const express = require("express");
const { userAuth } = require("../middleware/auth");
const convertLexicalToHtml = require("../middleware/jsonToHtmlConver");
const editorRouter = express.Router();

editorRouter.post("/lexicalsave", userAuth, async (req, res) => {
  try {
    // console.log("Lexical Save Get this Body :- "+req.body);
    const { id, lexicalJson } = req.body; // post id and lexicalJson
    const userId = req.user.id; // userAuth middleware should attach user info

    // First, check if the post exists and belongs to the user
    const postCheck = await req.app.locals.pool.query(
      "SELECT author_id FROM posts WHERE id = $1",
      [id],
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (postCheck.rows[0].author_id !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this post" });
    }

    // Update lexical_json if user is the author
    const result = await req.app.locals.pool.query(
      "UPDATE posts SET lexical_content = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [lexicalJson, id],
    );

    // res.json(result.rows[0].lexical_content);
    res.status(200).json({ message: "Post Update Successfully" });
  } catch (error) {
    console.error("Error updating post lexicalJson:", error);
    res.status(500).json({ error: "Failed to update post lexicalJson" });
  }
});

// Get single post for edit
// editorRouter.get('/edit/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const result = await req.app.locals.pool.query(
//       `SELECT
//         p.id, p.title, p.excerpt,
//         p.meta_description, p.meta_keywords,
//         p.published, p.created_at, p.updated_at, p.lexical_content,
//         u.id as author_id, u.name as author_name, u.email as author_email
//       FROM posts p
//       LEFT JOIN users u ON p.author_id = u.id
//       WHERE p.id = $1`,
//       [id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     const row = result.rows[0];
//     const post = {
//       id: row.id,
//       title: row.title,
//       lexical_content: row.lexical_content,
//       excerpt: row.excerpt,
//       meta_description: row.meta_description,
//       meta_keywords: row.meta_keywords,
//       published: row.published,
//       created_at: row.created_at,
//       updated_at: row.updated_at,
//       author: {
//         id: row.author_id,
//         name: row.author_name,
//         email: row.author_email
//       }
//     };

//     res.json(post);
//   } catch (error) {
//     console.error('Error fetching post:', error);
//     res.status(500).json({ error: 'Failed to fetch post' });
//   }
// });
editorRouter.get("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // const result = await req.app.locals.pool.query(
    //   `SELECT
    //     p.id, p.title, p.excerpt,
    //     p.meta_description, p.meta_keywords,
    //     p.published, p.created_at, p.updated_at, p.lexical_content,
    //     u.id as author_id, u.name as author_name, u.email as author_email,
    //     COALESCE(json_agg(
    //       DISTINCT jsonb_build_object('name', c.name, 'slug', c.slug)
    //     ) FILTER (WHERE c.id IS NOT NULL), '[]') AS categories
    //   FROM posts p
    //   LEFT JOIN users u ON p.author_id = u.id
    //   LEFT JOIN post_categories pc ON p.id = pc.post_id
    //   LEFT JOIN categories c ON pc.category_id = c.id
    //   WHERE p.id = $1
    //   GROUP BY p.id, u.id`,
    //   [id],
    // );

    const result = await req.app.locals.pool.query(
      `SELECT 
    p.id, p.title, p.excerpt, 
    p.meta_description, p.meta_keywords, 
    p.published, p.created_at, p.updated_at, p.lexical_content,
    u.id as author_id, u.name as author_name, u.email as author_email,
    COALESCE(json_agg(
      DISTINCT c.id
    ) FILTER (WHERE c.id IS NOT NULL), '[]') AS categories
  FROM posts p
  LEFT JOIN users u ON p.author_id = u.id
  LEFT JOIN post_categories pc ON p.id = pc.post_id
  LEFT JOIN categories c ON pc.category_id = c.id
  WHERE p.id = $1
  GROUP BY p.id, u.id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
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
        email: row.author_email,
      },
      categories: row.categories, // now just an array of IDs
    };

    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Covert lexical json to Clean HTML and insert into Postgres db as content
editorRouter.post("/updateashtml", userAuth, async (req, res) => {
  try {
    // console.log("Lexical Save Get this Body :- "+ JSON.stringify(req.body));
    const { id, lexicalJson } = req.body; // post id and lexicalJson
    // console.log("post id :- "+ id);
    // console.log("lexical json from api :-"+ JSON.stringify(lexicalJson));
    // console.log("lexical json from api 1 :-"+ lexicalJson);
    const userId = req.user.id; // userAuth middleware should attach user info

    // First, check if the post exists and belongs to the user
    const postCheck = await req.app.locals.pool.query(
      "SELECT author_id FROM posts WHERE id = $1",
      [id],
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (postCheck.rows[0].author_id !== userId) {
      return res
        .status(403)
        .json({ error: "You are not authorized to update this post" });
    }

    // Convert lexical json to clean html
    const safeHtml = convertLexicalToHtml(lexicalJson);
    // console.log("html of lexical :- "+safeHtml);

    // Update lexical_json if user is the author
    const result = await req.app.locals.pool.query(
      "UPDATE posts SET lexical_content = $1, content = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [lexicalJson, safeHtml, id],
    );

    // res.json(result.rows[0].lexical_content);
    res.status(200).json({ message: "Post Update Successfully" });
  } catch (error) {
    console.error("Error updating post lexicalJson:", error);
    res.status(500).json({ error: "Failed to update post lexicalJson" });
  }
});

editorRouter.post("/seosave", userAuth, async (req, res) => {
  const client = await req.app.locals.pool.connect();
  try {
    const { id, excerpt, meta_description, meta_keywords, categories } =
      req.body;
    const userId = req.user.id; // from userAuth middleware

    // Check if post exists and belongs to this user
    const postResult = await client.query(
      `SELECT author_id FROM posts WHERE id = $1`,
      [id],
    );

    if (postResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: "Post not found" });
    }

    if (postResult.rows[0].author_id !== userId) {
      client.release();
      return res
        .status(403)
        .json({ error: "You are not the author of this post" });
    }

    // Begin transaction
    await client.query("BEGIN");

    // Update SEO fields
    await client.query(
      `UPDATE posts 
       SET excerpt = $1, meta_description = $2, meta_keywords = $3, updated_at = NOW()
       WHERE id = $4`,
      [excerpt, meta_description, meta_keywords, id],
    );

    // Reset categories
    await client.query(`DELETE FROM post_categories WHERE post_id = $1`, [id]);

    if (categories && categories.length > 0) {
      for (const categoryId of categories) {
        await client.query(
          `INSERT INTO post_categories (post_id, category_id) VALUES ($1, $2)`,
          [id, categoryId],
        );
      }
    }

    // Commit transaction
    await client.query("COMMIT");
    client.release();

    res.json({ success: true, message: "SEO content updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    client.release();
    console.error("Error updating SEO content:", error);
    res.status(500).json({ error: "Failed to update SEO content" });
  }
});

module.exports = editorRouter;
