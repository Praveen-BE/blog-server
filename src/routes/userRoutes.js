const express = require('express');
const userRouter = express.Router();
const bcrypt = require('bcrypt')

// Get all users
userRouter.get('/', async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      'SELECT id, name, email, bio, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
userRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.app.locals.pool.query(
      'SELECT id, name, email, bio, created_at FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user
userRouter.post('/', async (req, res) => {
  try {
    const { name, email, password, bio } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await req.app.locals.pool.query(
      'INSERT INTO users (name, email, password, bio) VALUES ($1, $2, $3, $4) RETURNING id, name, email, bio, created_at',
      [name, email, hashedPassword, bio || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
userRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, bio } = req.body;
    
    const result = await req.app.locals.pool.query(
      'UPDATE users SET name = $1, email = $2, bio = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, email, bio, updated_at',
      [name, email, bio, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
userRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.app.locals.pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = userRouter;