const db = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required', data: null, error: 'Validation' });

    const existing = await db.query('SELECT id FROM tbl_users WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(409).json({ success: false, message: 'Email already registered', data: null, error: 'Duplicate' });

    const hashed = await bcrypt.hash(password, 10);
    const q = 'INSERT INTO tbl_users (name,email,password) VALUES ($1,$2,$3) RETURNING id,name,email,created_at';
    const result = await db.query(q, [name || null, email, hashed]);
    return res.status(201).json({ success: true, message: 'User registered', data: result.rows[0], error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error', data: null, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required', data: null, error: 'Validation' });

    const result = await db.query('SELECT * FROM tbl_users WHERE email=$1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Incorrect password', data: null, error: 'Auth' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, message: 'Login successful', data: { token, user: { id: user.id, name: user.name, email: user.email } }, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error', data: null, error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const id = req.user.id;
    const q = 'SELECT id,name,email,created_at FROM tbl_users WHERE id=$1';
    const result = await db.query(q, [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
    return res.json({ success: true, message: 'User fetched', data: result.rows[0], error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error', data: null, error: err.message });
  }
};
