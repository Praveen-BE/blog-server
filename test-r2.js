// test-r2.js
require("dotenv").config();
const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
const { NodeHttpHandler } = require("@smithy/node-http-handler");

console.log("--- ENV CHECK ---");
console.log("Account ID  :", JSON.stringify(process.env.CF_ACCOUNT_ID));
console.log("Access Key  :", JSON.stringify(process.env.R2_ACCESS_KEY_ID));
console.log("Secret Key  :", JSON.stringify(process.env.R2_SECRET_ACCESS_KEY));
console.log("Bucket Name :", JSON.stringify(process.env.CF_BUCKET_NAME));
console.log("Public URL  :", JSON.stringify(process.env.R2_PUBLIC_URL));

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

// Replace the async block in test-r2.js with this:
(async () => {
  try {
    const result = await s3Client.send(new ListBucketsCommand({}));
    console.log(
      "\n✅ Buckets:",
      result.Buckets.map((b) => b.Name),
    );
  } catch (err) {
    console.error("\n❌ Error:", err.name);
    console.error("Message :", err.message);
    console.error("HTTP Status:", err?.$metadata?.httpStatusCode);
    console.error("Full error:", JSON.stringify(err, null, 2));
  }
})();
