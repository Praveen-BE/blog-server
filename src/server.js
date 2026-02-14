const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require("./config/database"); // database is imported
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Allow only specific domains
const allowedOrigins = ['http://localhost:3000', 'https://mywebsite.com'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    // allowedHeaders: '*',
    credentials: true // Allow cookies/auth headers
}));

app.locals.pool = pool;

// Import routes
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const categoryRoutes = require('./routes/catagoryRoutes');
const authRoutes = require("./routes/authRoutes");
const profileRouter = require('./routes/profileRoutes');
const editorRouter = require('./routes/editorRoutes');

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
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRouter);
app.use('/api/editor', editorRouter);

// 404 handler - as last Router for Error Handling
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Server is Running Check
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
