const pool = require("../config/database"); // database is imported

// Get all post - sql query
async function getAllPostSqlQuery (){   
    const result = await pool.query(
      `SELECT p.*, u.username as author_name 
       FROM posts p 
       JOIN users u ON p.author_id = u.id 
       WHERE p.published = true 
       ORDER BY p.created_at DESC`
    );
}

// Get single post by Slug Sql Query
async function getSinglePostbySlugSqlQuery(slug){
    const result = await pool.query(
      `SELECT p.*, u.username as author_name 
       FROM posts p 
       JOIN users u ON p.author_id = u.id 
       WHERE p.slug = $1 AND p.published = true`,
      [slug]
    );
    return result;
}

// Create New Post Sql Query
async function createNewPostSqlQuery(slug, title, content, excerpt, meta_description, meta_keywords, author_id){
    const result = await pool.query(
      `INSERT INTO posts (title, slug, content, excerpt, meta_description, meta_keywords, author_id, published) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) 
       RETURNING *`,
      [title, slug, content, excerpt, meta_description, meta_keywords, author_id]
    );
    return result;
}

// Update Post Sql Query
async function updatePostSqlQuery(slug, title, content, excerpt, meta_description, meta_keywords, id){
    const result = await pool.query(
      `UPDATE posts 
       SET title = $1, slug = $2, content = $3, excerpt = $4, 
           meta_description = $5, meta_keywords = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 
       RETURNING *`,
      [title, slug, content, excerpt, meta_description, meta_keywords, id]
    );
    return result;
}

// Delete Post Sql Query
async function deletePostSqlQuery(id){
    result = await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    return result;
}

module.exports = {getAllPostSqlQuery, getSinglePostbySlugSqlQuery, createNewPostSqlQuery, updatePostSqlQuery, deletePostSqlQuery};