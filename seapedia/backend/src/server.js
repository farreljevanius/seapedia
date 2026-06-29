const express = require('express');
const cors = require('cors');
const { requireRole } = require('./middlewares/authMiddleware');
const authController = require('./controllers/authController');
const cartController = require('./controllers/cartController');

const app = express();

app.use(cors());
app.use(express.json());

// --- PUBLIC ROUTES (Level 1) ---
app.post('/api/auth/login', authController.login);
app.post('/api/auth/role', authController.selectActiveRole);

// --- BUYER ROUTES (Level 3) ---
// Notice how requireRole('BUYER') securely locks down the endpoint
app.post('/api/buyer/cart', requireRole('BUYER'), cartController.addToCart);

// --- SELLER ROUTES (Level 2) ---
app.post('/api/seller/products', requireRole('SELLER'), (req, res) => {
    res.json({ message: "Product created by seller" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SEAPEDIA Backend running on port ${PORT}`);
});