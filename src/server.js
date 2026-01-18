const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require("./config/database"); // database is imported

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.locals.pool = pool;

// Import routes
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const categoryRoutes = require('./routes/catagoryRoutes');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message 
  });
});

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);

// 404 handler - as last Router for Error Handling
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Server is Running Check
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
