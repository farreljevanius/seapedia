const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Step 1: Standard Login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    // Return the user's available roles so the frontend can show a selection screen
    res.json({
      message: 'Login successful. Please select an active role.',
      userId: user.id,
      availableRoles: user.roles // e.g., ['BUYER', 'SELLER']
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Step 2: Active Role Selection (Generates the actual session token)
exports.selectActiveRole = async (req, res) => {
  const { userId, selectedRole } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user.roles.includes(selectedRole)) {
      return res.status(403).json({ error: 'You do not own this role.' });
    }

    // Generate JWT containing ONLY the active role for strict authorization
    const token = jwt.sign(
      { userId: user.id, activeRole: selectedRole }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      message: `Session started as ${selectedRole}`,
      token,
      activeRole: selectedRole
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during role selection' });
  }
};