// test-connection.js
const https = require("https");

const req = https.get(
  "https://5c104bae931f4675ea7fa0ffe545f327.r2.cloudflarestorage.com",
  (res) => {
    console.log("Connected! Status:", res.statusCode); // Expect 400 - that's fine
  },
);

req.on("error", (err) => {
  console.error("Connection error:", err.message);
});

req.setTimeout(10000, () => {
  console.error("Timed out");
  req.destroy();
});
