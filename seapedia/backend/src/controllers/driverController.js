const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Find Available Jobs (Level 5)
exports.getAvailableJobs = async (req, res) => {
  try {
    // Drivers only see orders that sellers have processed
    const availableJobs = await prisma.order.findMany({
      where: { status: 'MENUNGGU_PENGIRIM' },
      include: { store: true }
    });
    res.json(availableJobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available jobs' });
  }
};

// 2. Take a Job (Level 5)
exports.takeJob = async (req, res) => {
  const { orderId } = req.params;
  const driverId = req.user.userId;

  try {
    // Transaction ensures no two drivers can claim the same order simultaneously
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      
      if (!order || order.status !== 'MENUNGGU_PENGIRIM') {
        throw new Error('Order is no longer available');
      }

      // Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'SEDANG_DIKIRIM' }
      });

      // Log the timestamped history
      await tx.orderHistory.create({
        data: { orderId, status: 'SEDANG_DIKIRIM' }
      });

      // Assign Job to Driver
      const job = await tx.job.create({
        data: {
          orderId,
          driverId,
          earnings: updatedOrder.deliveryFee * 0.8 // 80% cut to driver as documented rule
        }
      });

      return { updatedOrder, job };
    });

    res.json({ message: 'Job successfully claimed', result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 3. Complete Job (Level 5)
exports.completeJob = async (req, res) => {
  const { jobId } = req.params;
  const driverId = req.user.userId;

  try {
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { order: true } });
    if (!job || job.driverId !== driverId) return res.status(403).json({ error: 'Unauthorized' });

    await prisma.$transaction([
      prisma.order.update({
        where: { id: job.orderId },
        data: { status: 'PESANAN_SELESAI' }
      }),
      prisma.orderHistory.create({
        data: { orderId: job.orderId, status: 'PESANAN_SELESAI' }
      }),
      prisma.job.update({
        where: { id: jobId },
        data: { completed: true }
      })
    ]);

    res.json({ message: 'Delivery completed successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete job' });
  }
};