const express = require('express');
const router = express.Router();

// Get all posts with author info
router.get('/', async (req, res) => {
  try {
    const { limit = 10, offset = 0, author_id } = req.query;
    
    let query = `
      SELECT 
        p.id, p.title, p.content, p.excerpt, 
        p.meta_description, p.meta_keywords, 
        p.published, p.created_at, p.updated_at,
        u.id as author_id, u.name as author_name, u.email as author_email
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
    `;
    
    const params = [];
    
    if (author_id) {
      query += ' WHERE p.author_id = $1';
      params.push(author_id);
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await req.app.locals.pool.query(query, params);
    
    const posts = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      meta_description: row.meta_description,
      meta_keywords: row.meta_keywords,
      published: row.published,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: {
        id: row.author_id,
        name: row.author_name,
        email: row.author_email
      }
    }));
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.app.locals.pool.query(
      `SELECT 
        p.id, p.title, p.content, p.excerpt, 
        p.meta_description, p.meta_keywords, 
        p.published, p.created_at, p.updated_at,
        u.id as author_id, u.name as author_name, u.email as author_email
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const row = result.rows[0];
    const post = {
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      meta_description: row.meta_description,
      meta_keywords: row.meta_keywords,
      published: row.published,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: {
        id: row.author_id,
        name: row.author_name,
        email: row.author_email
      }
    };
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create post
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      content, 
      excerpt, 
      meta_description, 
      meta_keywords, 
      author_id,
      published = false 
    } = req.body;
    
    // Validate input
    if (!title || !content || !author_id) {
      return res.status(400).json({ 
        error: 'Title, content, and author_id are required' 
      });
    }
    
    const result = await req.app.locals.pool.query(
      `INSERT INTO posts 
        (title, content, excerpt, meta_description, meta_keywords, author_id, published) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [title, content, excerpt, meta_description, meta_keywords, author_id, published]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        error: 'Invalid author_id. User does not exist.' 
      });
    }
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      content, 
      excerpt, 
      meta_description, 
      meta_keywords,
      published 
    } = req.body;
    
    const result = await req.app.locals.pool.query(
      `UPDATE posts 
      SET title = $1, content = $2, excerpt = $3, 
          meta_description = $4, meta_keywords = $5, 
          published = $6, updated_at = NOW() 
      WHERE id = $7 
      RETURNING *`,
      [title, content, excerpt, meta_description, meta_keywords, published, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.app.locals.pool.query(
      'DELETE FROM posts WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ message: 'Post deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Publish/Unpublish post
router.patch('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;
    
    const result = await req.app.locals.pool.query(
      'UPDATE posts SET published = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [published, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({ error: 'Failed to update post status' });
  }
});

module.exports = router;