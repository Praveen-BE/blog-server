const express = require('express');
const { userAuth } = require('../middleware/auth');
const editorRouter = express.Router();

editorRouter.post("/lexicalsave", userAuth, async (req, res) => {
  try {
    // console.log("Lexical Save Get this Body :- "+req.body);
    const { id, lexicalJson } = req.body; // post id and lexicalJson
    const userId = req.user.id; // userAuth middleware should attach user info

    // First, check if the post exists and belongs to the user
    const postCheck = await req.app.locals.pool.query(
      'SELECT author_id FROM posts WHERE id = $1',
      [id]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postCheck.rows[0].author_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this post' });
    }

    // Update lexical_json if user is the author
    const result = await req.app.locals.pool.query(
      'UPDATE posts SET lexical_content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [lexicalJson, id]
    );

    // res.json(result.rows[0].lexical_content);
    res.status(200).json({message : "Post Update Successfully"});
  } catch (error) {
    console.error('Error updating post lexicalJson:', error);
    res.status(500).json({ error: 'Failed to update post lexicalJson' });
  }
});

// Get single post for edit
editorRouter.get('/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.app.locals.pool.query(
      `SELECT 
        p.id, p.title, p.excerpt, 
        p.meta_description, p.meta_keywords, 
        p.published, p.created_at, p.updated_at, p.lexical_content,
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
      lexical_content: row.lexical_content,
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

module.exports = editorRouter;
