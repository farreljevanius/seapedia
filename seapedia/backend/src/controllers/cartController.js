const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const buyerId = req.user.userId; // Extracted from requireRole('BUYER') middleware

  try {
    // 1. Find the product being added to get its storeId
    const targetProduct = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!targetProduct) return res.status(404).json({ error: 'Product not found' });

    // 2. Fetch the buyer's current cart items
    const currentCart = await prisma.cartItem.findMany({
      where: { buyerId: buyerId },
      include: { product: true }
    });

    // 3. ENFORCE SINGLE-STORE CHECKOUT RULE
    if (currentCart.length > 0) {
      const existingStoreId = currentCart[0].product.storeId;
      
      if (existingStoreId !== targetProduct.storeId) {
        return res.status(400).json({ 
          error: 'Single-store checkout rule: You can only add products from one store to your cart at a time. Please clear your cart first.' 
        });
      }
    }

    // 4. Add to cart if rule passes
    const cartItem = await prisma.cartItem.create({
      data: {
        buyerId: buyerId,
        productId: productId,
        quantity: quantity
      }
    });

    res.status(201).json({ message: 'Product added to cart safely', cartItem });

  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};