const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.simulateNextDayAndRefund = async (req, res) => {
  try {
    // Find orders that are stuck in SEDANG_DIKEMAS or MENUNGGU_PENGIRIM for too long
    // For simulation, we'll assume any order in these states is now "Overdue"
    const overdueOrders = await prisma.order.findMany({
      where: {
        status: { in: ['SEDANG_DIKEMAS', 'MENUNGGU_PENGIRIM'] }
      },
      include: { orderItems: true } // Assuming you added orderItems relation
    });

    let refundedCount = 0;

    for (const order of overdueOrders) {
      await prisma.$transaction(async (tx) => {
        // 1. Change status to DIKEMBALIKAN
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'DIKEMBALIKAN' }
        });

        await tx.orderHistory.create({
          data: { orderId: order.id, status: 'DIKEMBALIKAN' }
        });

        // 2. Refund Buyer Wallet
        const buyer = await tx.user.findUnique({ where: { id: order.buyerId } });
        await tx.user.update({
          where: { id: order.buyerId },
          data: { wallet: buyer.wallet + order.finalTotal }
        });

        // 3. Restore Stock (Skipped here for brevity, loop through orderItems)
        // ...
      });
      refundedCount++;
    }

    res.json({ message: `Time simulated. ${refundedCount} overdue orders refunded.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process overdue orders' });
  }
};