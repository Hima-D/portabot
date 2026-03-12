import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const users = new Map();
const apiKeys = new Map();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (users.has(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    const user = {
      id: userId,
      email,
      name: name || email.split('@')[0],
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.set(email, user);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/api-keys', async (req, res) => {
  try {
    const { userId } = req.body;
    const apiKey = `pk_${uuidv4().replace(/-/g, '')}`;
    
    apiKeys.set(apiKey, {
      userId,
      createdAt: new Date().toISOString()
    });

    res.json({ apiKey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

export default router;
export { users, apiKeys };
