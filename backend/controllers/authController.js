import { getDB } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

export const login = async (req, res) => {
  try {
    const { login, password } = req.body;
    const db = await getDB();
    const user = await db.get('SELECT * FROM users WHERE login = ?', [login]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid login or password' });
    }
    
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
