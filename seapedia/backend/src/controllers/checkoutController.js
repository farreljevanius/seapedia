const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.checkout = async (req, res) => {
  const { deliveryMethod, discountCode } = req.body;
  const buyerId = req.user.userId;
  const PPN_RATE = 0.12; // Rule: PPN 12%

  try {
    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
    const cartItems = await prisma.cartItem.findMany({
      where: { buyerId },
      include: { product: true }
    });

    if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    // Single store validation should have happened at AddToCart, but we verify again
    const storeId = cartItems[0].product.storeId;
    let subtotal = 0;
    
    // Verify stock and calculate subtotal
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${item.product.name}` });
      }
      subtotal += item.product.price * item.quantity;
    }

    // Determine Delivery Fee
    let deliveryFee = 0;
    if (deliveryMethod === 'INSTANT') deliveryFee = 50000;
    if (deliveryMethod === 'NEXT_DAY') deliveryFee = 25000;
    if (deliveryMethod === 'REGULAR') deliveryFee = 10000;

    // Apply Discount (Dummy logic for Promo/Voucher validation)
    let discountAmount = 0;
    if (discountCode === 'PROMO20') discountAmount = subtotal * 0.20; // 20% off

    // Rule: PPN is applied after discount but before delivery fee
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * PPN_RATE;
    const finalTotal = taxableAmount + tax + deliveryFee;

    // Check Wallet Balance
    if (buyer.wallet < finalTotal) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    // Execute the Checkout Transaction Safely
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct Wallet
      await tx.user.update({
        where: { id: buyerId },
        data: { wallet: buyer.wallet - finalTotal }
      });

      // 2. Reduce Stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: item.product.stock - item.quantity }
        });
      }

      // 3. Create Order
      const order = await tx.order.create({
        data: {
          buyerId,
          storeId,
          subtotal,
          discount: discountAmount,
          deliveryFee,
          tax,
          finalTotal,
          deliveryMethod,
          status: 'SEDANG_DIKEMAS' // Mandatory starting status
        }
      });

      // 4. Create Status History
      await tx.orderHistory.create({
        data: { orderId: order.id, status: 'SEDANG_DIKEMAS' }
      });

      // 5. Clear Cart
      await tx.cartItem.deleteMany({ where: { buyerId } });

      return order;
    });

    res.status(201).json({ message: 'Checkout successful', order: result });
  } catch (error) {
    res.status(500).json({ error: 'Checkout failed: ' + error.message });
  }
};