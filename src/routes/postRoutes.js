const express = require('express');
const { userAuth } = require('../middleware/auth');
const router = express.Router();

// Get all posts with author info - this api collect specific auther posts and latest post
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

// Get posts by Catogory slug
router.get('/categories', async (req, res) => {
    try {
    const { slug } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const query = `
      SELECT 
        p.id, p.title, p.content, p.excerpt, 
        p.published, p.created_at, p.lexical_content,
        u.name as author_name,
        -- This aggregates all category names into a single JSON array
        json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)) as categories
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      INNER JOIN post_categories pc ON p.id = pc.post_id
      INNER JOIN categories c ON pc.category_id = c.id
      WHERE p.id IN (
        -- Subquery to find IDs of posts that belong to the requested category slug
        SELECT post_id 
        FROM post_categories 
        JOIN categories ON post_categories.category_id = categories.id 
        WHERE categories.slug = $1
      )
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const params = [slug, limit, offset];
    const result = await req.app.locals.pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No posts found for this category" });
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/posts/byfilter?slugs=javascript,react&author_ids=1,2
router.get('/byfilter', async (req, res) => {
  try {
    const slugs = req.query.slugs ? req.query.slugs.split(',') : [];
    const { limit = 10, offset = 0, sort = 'desc' } = req.query;

    // Convert author_ids query param into an array of integers
    const authorIds = req.query.author_ids
      ? req.query.author_ids.split(',').map(id => parseInt(id, 10)).filter(Number.isInteger)
      : [];

    if (slugs.length === 0) {
      return res.status(400).json({ error: "No slugs provided" });
    }

    const sortOrder = sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        p.id, p.title, p.excerpt, 
        p.published, p.created_at,
        u.name as author_name,
        json_agg(json_build_object('name', c.name, 'slug', c.slug)) as categories
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      INNER JOIN post_categories pc ON p.id = pc.post_id
      INNER JOIN categories c ON pc.category_id = c.id
      WHERE p.id IN (
        SELECT post_id 
        FROM post_categories 
        JOIN categories ON post_categories.category_id = categories.id 
        WHERE categories.slug = ANY($1)
      )
      ${authorIds.length > 0 ? 'AND p.author_id = ANY($4::int[])' : ''}
      GROUP BY p.id, u.id
      ORDER BY p.created_at ${sortOrder}
      LIMIT $2 OFFSET $3
    `;

    const params = authorIds.length > 0
      ? [slugs, limit, offset, authorIds]
      : [slugs, limit, offset];

    const result = await req.app.locals.pool.query(query, params);

    res.json({
      count: result.rows.length,
      posts: result.rows
    });
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Get posts by author id
router.get('/authorblogs/:author_id', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const { author_id } = req.params;

    const query = `
      SELECT 
        p.id, p.title, p.content, p.excerpt, 
        p.meta_description, p.meta_keywords, 
        p.lexical_content,
        p.published, p.created_at, p.updated_at,
        u.id as author_id, u.name as author_name, u.email as author_email
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const params = [author_id, limit, offset];
    const result = await req.app.locals.pool.query(query, params);

    const posts = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      meta_description: row.meta_description,
      meta_keywords: row.meta_keywords,
      lexical_content: row.lexical_content,
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

// Get posts by author id
router.get('/myblogs', userAuth, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    // console.log(req.user);
    const {id} = req.user;
    const  author_id = id;

    const query = `
      SELECT 
        p.id, p.title, p.content, p.excerpt, 
        p.meta_description, p.meta_keywords,
        p.published, p.created_at, p.updated_at,
        u.id as author_id, u.name as author_name, u.email as author_email
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const params = [author_id, limit, offset];
    const result = await req.app.locals.pool.query(query, params);

    const posts = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      meta_description: row.meta_description,
      meta_keywords: row.meta_keywords,
      lexical_content: row.lexical_content,
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

// Get single post for user Reading
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
router.post('/', userAuth, async (req, res) => {
  try {
    const {id, email} = req.user;
    const author_id = id;
    const { 
      title, 
      content, 
      excerpt, 
      meta_description, 
      meta_keywords, 
      published = false,
      lexical_content,
    } = req.body;
    
    // Validate input
    if (!title || !content || !author_id || !lexical_content) {
      return res.status(400).json({ 
        error: 'Title, content, and author_id are required' 
      });
    }
    
    const result = await req.app.locals.pool.query(
      `INSERT INTO posts 
        (title, content, excerpt, meta_description, meta_keywords, author_id, published, lexical_content) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [title, content, excerpt, meta_description, meta_keywords, author_id, published, lexical_content]
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
      published,
      lexical_content 
    } = req.body;
    
    const result = await req.app.locals.pool.query(
      `UPDATE posts 
      SET title = $1, content = $2, excerpt = $3, 
          meta_description = $4, meta_keywords = $5, 
          published = $6, updated_at = NOW(), lexical_content = $7
      WHERE id = $8 
      RETURNING *`,
      [title, content, excerpt, meta_description, meta_keywords, published, lexical_content, id]
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