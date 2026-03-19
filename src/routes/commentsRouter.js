// FILE: routes/commentsRouter.js

const express = require("express");
const { userAuth } = require("../middleware/auth");
const commentsRouter = express.Router();

// GET /api/comments/:postId  — fetch all comments for a post
commentsRouter.get("/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await req.app.locals.pool.query(
      `SELECT 
        c.id,
        c.content,
        c.parent_id,
        c.created_at,
        u.id   AS user_id,
        u.name AS user_name
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC`,
      [postId],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/comments/:postId  — add a comment (auth required)
commentsRouter.post("/:postId", userAuth, async (req, res) => {
  const { postId } = req.params;
  const { content, parent_id = null } = req.body;
  const userId = req.user.id; // set by userAuth middleware

  if (!content?.trim()) {
    return res.status(400).json({ error: "Comment content is required" });
  }

  try {
    const result = await req.app.locals.pool.query(
      `INSERT INTO comments (post_id, user_id, parent_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, parent_id, created_at`,
      [postId, userId, parent_id, content.trim()],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// DELETE /api/comments/:commentId  — delete own comment (auth required)
commentsRouter.delete("/:commentId", userAuth, async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  try {
    const result = await req.app.locals.pool.query(
      `DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id`,
      [commentId, userId],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Comment not found or unauthorized" });
    }

    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

module.exports = commentsRouter;
