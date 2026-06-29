const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// LEVEL 2: Store Management
exports.createStore = async (req, res) => {
  const { name } = req.body;
  const sellerId = req.user.userId;

  try {
    const existingStore = await prisma.store.findUnique({ where: { name } });
    if (existingStore) return res.status(400).json({ error: 'Store name must be unique' });

    const store = await prisma.store.create({
      data: { name, sellerId }
    });
    res.status(201).json({ message: 'Store created', store });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create store' });
  }
};

// LEVEL 2: Product Management
exports.createProduct = async (req, res) => {
  const { name, description, price, stock } = req.body;
  const sellerId = req.user.userId;

  try {
    const store = await prisma.store.findUnique({ where: { sellerId } });
    if (!store) return res.status(404).json({ error: 'Please create a store first' });

    const product = await prisma.product.create({
      data: { name, description, price, stock, storeId: store.id }
    });
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// LEVEL 4: Process Order
exports.processOrder = async (req, res) => {
  const { orderId } = req.params;
  const sellerId = req.user.userId;

  try {
    const store = await prisma.store.findUnique({ where: { sellerId } });
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.storeId !== store.id) {
      return res.status(403).json({ error: 'Unauthorized to process this order' });
    }
    if (order.status !== 'SEDANG_DIKEMAS') {
      return res.status(400).json({ error: 'Order cannot be processed at this stage' });
    }

    // Move to Menunggu Pengirim so Drivers can see it
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'MENUNGGU_PENGIRIM' }
      }),
      prisma.orderHistory.create({
        data: { orderId, status: 'MENUNGGU_PENGIRIM' }
      })
    ]);

    res.json({ message: 'Order processed. Waiting for driver.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process order' });
  }
};