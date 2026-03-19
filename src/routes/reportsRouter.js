// FILE: routes/reportsRouter.js

const express = require("express");
const { userAuth } = require("../middleware/auth");
const reportsRouter = express.Router();

const VALID_REASONS = [
  "spam",
  "harassment",
  "misinformation",
  "inappropriate",
  "copyright",
  "other",
];

// POST /api/reports  — submit a report (auth required)
reportsRouter.post("/", userAuth, async (req, res) => {
  const { target_type, target_id, reason, details = null } = req.body;
  const reporterId = req.user.id;

  if (!["post", "comment"].includes(target_type)) {
    return res.status(400).json({ error: "Invalid target_type" });
  }

  if (!target_id || !Number.isInteger(Number(target_id))) {
    return res.status(400).json({ error: "Invalid target_id" });
  }

  if (!VALID_REASONS.includes(reason)) {
    return res.status(400).json({
      error: "Invalid reason",
      valid_reasons: VALID_REASONS,
    });
  }

  try {
    // Verify the target actually exists
    const table = target_type === "post" ? "posts" : "comments";
    const exists = await req.app.locals.pool.query(
      `SELECT id FROM ${table} WHERE id = $1`,
      [target_id],
    );

    if (exists.rowCount === 0) {
      return res.status(404).json({ error: `${target_type} not found` });
    }

    await req.app.locals.pool.query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        reporterId,
        target_type,
        Number(target_id),
        reason,
        details?.trim() || null,
      ],
    );

    res
      .status(201)
      .json({ message: "Report submitted. Thank you for your feedback." });
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation — already reported
      return res
        .status(409)
        .json({ error: "You have already reported this content." });
    }
    console.error("Report error:", err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// GET /api/reports  — list reports (admin use, add your own admin auth middleware)
reportsRouter.get("/", userAuth, async (req, res) => {
  const { status = "pending", page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const result = await req.app.locals.pool.query(
      `SELECT
          r.id,
          r.target_type,
          r.target_id,
          r.reason,
          r.details,
          r.status,
          r.created_at,
          u.name  AS reporter_name,
          u.email AS reporter_email
       FROM reports r
       JOIN users u ON u.id = r.reporter_id
       WHERE r.status = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, Number(limit), offset],
    );

    res.json(result.rows);
  } catch (err) {
    console.error("List reports error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// PATCH /api/reports/:id  — update report status (admin)
reportsRouter.patch("/:id", userAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "reviewed", "dismissed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const result = await req.app.locals.pool.query(
      `UPDATE reports SET status = $1 WHERE id = $2 RETURNING id, status`,
      [status, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update report error:", err);
    res.status(500).json({ error: "Failed to update report" });
  }
});

module.exports = reportsRouter;
