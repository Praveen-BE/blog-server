const express = require("express");
const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { NodeHttpHandler } = require("@smithy/node-http-handler");
const imageRouter = express.Router();
const { userAuth } = require("../middleware/auth");
require("dotenv").config();

// Initialize R2 Client
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: "auto",
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 30000,
    requestTimeout: 120000,
  }),
});

const upload = multer({ storage: multer.memoryStorage() });

imageRouter.post(
  "/upload",
  userAuth,
  upload.single("file"),
  async (req, res) => {
    const client = await req.app.locals.pool.connect();

    try {
      if (!req.file) return res.status(400).json({ error: "No file provided" });

      const { postId } = req.body;
      const userId = req.user.id;
      const timestamp = Date.now();

      const sanitizedName = req.file.originalname
        .split(".")[0]
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

      const customId = `blog/post_${postId || "draft"}/u${userId}_${timestamp}_${sanitizedName}`;

      const parallelUploads3 = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.CF_BUCKET_NAME,
          Key: customId,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5,
      });

      await parallelUploads3.done();

      const cdnUrl = `${process.env.R2_PUBLIC_URL}/${customId}`;

      await client.query(
        `INSERT INTO images (cloudflare_id, post_id, user_id, url) 
         VALUES ($1, $2, $3, $4)`,
        [customId, postId || null, userId, cdnUrl],
      );

      res.json({ success: true, url: cdnUrl, id: customId });
    } catch (error) {
      console.error("R2 Upload Error:", error);
      res.status(500).json({ error: "Upload failed" });
    } finally {
      client.release();
    }
  },
);

module.exports = imageRouter;

// // with Scanner but it neeed install on server like aws or render, vercel is not suitable
// const express = require("express");
// const multer = require("multer");
// const { S3Client } = require("@aws-sdk/client-s3");
// const { Upload } = require("@aws-sdk/lib-storage");
// const { NodeHttpHandler } = require("@smithy/node-http-handler");
// const NodeClam = require("clamscan"); // ClamAV wrapper
// const imageRouter = express.Router();
// const { userAuth } = require("../middleware/auth");
// require("dotenv").config();

// // Initialize R2 Client
// const s3Client = new S3Client({
//   credentials: {
//     accessKeyId: process.env.R2_ACCESS_KEY_ID,
//     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
//   },
//   endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
//   region: "auto",
//   requestHandler: new NodeHttpHandler({
//     connectionTimeout: 30000,
//     requestTimeout: 120000,
//   }),
// });

// // Allowed MIME types
// const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

// // Multer with size limit (5 MB)
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     if (allowedMimeTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Invalid file type. Only JPG, PNG, WEBP allowed."));
//     }
//   },
// });

// // Initialize ClamAV
// const initClam = async () => {
//   const clamscan = await new NodeClam().init({
//     clamdscan: {
//       path: "/usr/bin/clamdscan", // adjust if different
//       socket: "/var/run/clamav/clamd.ctl", // or TCP host/port
//       config_file: "/etc/clamav/clamd.conf",
//     },
//     debug_mode: false,
//     scan_recursively: false,
//   });
//   return clamscan;
// };

// imageRouter.post(
//   "/upload",
//   userAuth,
//   upload.single("file"),
//   async (req, res) => {
//     const client = await req.app.locals.pool.connect();

//     try {
//       if (!req.file) return res.status(400).json({ error: "No file provided" });

//       // Run ClamAV scan
//       const clamscan = await initClam();
//       const { is_infected, viruses } = await clamscan.scanBuffer(req.file.buffer);

//       if (is_infected) {
//         return res.status(400).json({
//           error: "Malware detected in file",
//           details: viruses,
//         });
//       }

//       const { postId } = req.body;
//       const userId = req.user.id;
//       const timestamp = Date.now();

//       const sanitizedName = req.file.originalname
//         .split(".")[0]
//         .replace(/[^a-z0-9]/gi, "_")
//         .toLowerCase();

//       const customId = `blog/post_${postId || "draft"}/u${userId}_${timestamp}_${sanitizedName}`;

//       const parallelUploads3 = new Upload({
//         client: s3Client,
//         params: {
//           Bucket: process.env.CF_BUCKET_NAME,
//           Key: customId,
//           Body: req.file.buffer,
//           ContentType: req.file.mimetype,
//         },
//         queueSize: 4,
//         partSize: 1024 * 1024 * 5,
//       });

//       await parallelUploads3.done();

//       const cdnUrl = `${process.env.R2_PUBLIC_URL}/${customId}`;

//       await client.query(
//         `INSERT INTO images (cloudflare_id, post_id, user_id, url)
//          VALUES ($1, $2, $3, $4)`,
//         [customId, postId || null, userId, cdnUrl],
//       );

//       res.json({ success: true, url: cdnUrl, id: customId });
//     } catch (error) {
//       console.error("Upload Error:", error);
//       res.status(500).json({ error: "Upload failed" });
//     } finally {
//       client.release();
//     }
//   },
// );

// module.exports = imageRouter;
