This is Blog-Server for my Blog-website

## Getting Started

First, run the development server:

```bash
npm run dev
```
## SQL Database code

i get this from claude ai.

```bash

-- ============================================
-- Database Schema
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  meta_description TEXT,
  meta_keywords VARCHAR(500),
  author_id INTEGER NOT NULL,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post-Category junction table (many-to-many)
CREATE TABLE IF NOT EXISTS post_categories (
  post_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, category_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================
-- Seed Data
-- ============================================

-- Insert test users
INSERT INTO users (name, email, password, bio) VALUES
  ('John Doe', 'john@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Full-stack developer and tech enthusiast'),
  ('Jane Smith', 'jane@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Frontend specialist with a passion for React'),
  ('Bob Johnson', 'bob@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Backend engineer and database expert')
ON CONFLICT (email) DO NOTHING;

-- Insert categories
INSERT INTO categories (name, slug, description) VALUES
  ('Technology', 'technology', 'Articles about the latest in tech'),
  ('Web Development', 'web-development', 'Web development tutorials and tips'),
  ('JavaScript', 'javascript', 'Everything JavaScript related'),
  ('Database', 'database', 'Database design and optimization'),
  ('React', 'react', 'React tutorials and best practices'),
  ('Node.js', 'nodejs', 'Backend development with Node.js')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample posts (assuming user IDs 1, 2, 3 exist)
INSERT INTO posts (title, content, excerpt, meta_description, meta_keywords, author_id, published) VALUES
  (
    'Getting Started with Node.js and PostgreSQL',
    'Node.js combined with PostgreSQL creates a powerful stack for building modern web applications. In this comprehensive guide, we will explore how to set up a connection between Node.js and PostgreSQL, handle queries efficiently, and implement best practices for database management.

PostgreSQL is a robust, open-source relational database that offers excellent performance and reliability. When paired with Node.js, you can build scalable applications that handle complex data relationships with ease.

In this tutorial, we will cover:
1. Setting up PostgreSQL on your local machine
2. Installing and configuring the pg library
3. Creating a connection pool
4. Performing CRUD operations
5. Error handling and best practices

Let us dive into the key concepts and implementation details that will help you master this technology stack.',
    'Learn how to build powerful web applications by combining Node.js with PostgreSQL. This guide covers setup, connection handling, and best practices.',
    'Complete guide to integrating Node.js with PostgreSQL. Learn database setup, connection pooling, query optimization, and best practices for building scalable applications.',
    'nodejs, postgresql, database, backend development, web development, sql, javascript',
    1,
    true
  ),
  (
    '10 React Hooks You Should Know in 2024',
    'React Hooks have revolutionized the way we write React components. Since their introduction in React 16.8, hooks have become an essential part of modern React development. In this article, we will explore 10 powerful hooks that every React developer should master.

1. useState - The foundation of state management in functional components
2. useEffect - Handle side effects and lifecycle events
3. useContext - Access context without prop drilling
4. useReducer - Manage complex state logic
5. useCallback - Optimize performance by memoizing functions
6. useMemo - Memoize expensive calculations
7. useRef - Access DOM elements and persist values
8. useLayoutEffect - Synchronous effects before paint
9. useImperativeHandle - Customize exposed refs
10. useDebugValue - Custom hook debugging

Each of these hooks serves a specific purpose and can dramatically improve your code quality and application performance. We will dive deep into each one with practical examples.',
    'Discover 10 essential React Hooks that will level up your development skills and help you write cleaner, more efficient code.',
    'Master these 10 React Hooks to write better functional components. Includes useState, useEffect, useContext, useReducer, and more advanced hooks with examples.',
    'react, hooks, javascript, frontend, web development, useState, useEffect, react hooks',
    2,
    true
  ),
  (
    'The Ultimate Guide to RESTful API Design',
    'RESTful APIs are the backbone of modern web applications. Understanding how to design them properly is crucial for building maintainable and scalable systems.

Key principles include:
- Use proper HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Implement consistent naming conventions
- Version your API appropriately
- Handle errors gracefully with meaningful status codes
- Implement proper authentication and authorization
- Use pagination for large datasets
- Provide comprehensive documentation

HTTP Methods:
GET - Retrieve resources
POST - Create new resources
PUT - Update entire resources
PATCH - Partially update resources
DELETE - Remove resources

Status Codes:
200 - Success
201 - Created
400 - Bad Request
401 - Unauthorized
404 - Not Found
500 - Server Error

By following these best practices, you will create APIs that are intuitive to use and easy to maintain over time.',
    'Master RESTful API design with this comprehensive guide covering best practices, HTTP methods, versioning, and security.',
    'Learn RESTful API design best practices including HTTP methods, endpoint naming, versioning, error handling, and security implementation.',
    'rest api, api design, http methods, web services, backend development, api best practices',
    3,
    true
  ),
  (
    'Database Optimization Techniques for PostgreSQL',
    'PostgreSQL is known for its performance, but even the best database needs proper optimization. This guide covers essential techniques to make your PostgreSQL database blazing fast.

Topics covered:
- Index optimization strategies
- Query performance analysis with EXPLAIN
- Vacuuming and maintenance
- Connection pooling best practices
- Partitioning large tables
- Materialized views for complex queries

Performance is not just about raw speed - it is about efficiency, scalability, and resource management.',
    'Learn advanced PostgreSQL optimization techniques to improve query performance and database efficiency.',
    'PostgreSQL optimization guide covering indexing, query analysis, connection pooling, partitioning, and performance tuning strategies.',
    'postgresql, database optimization, indexing, performance tuning, sql optimization',
    1,
    false
  );

-- Link posts to categories
INSERT INTO post_categories (post_id, category_id) 
SELECT p.id, c.id FROM posts p, categories c 
WHERE p.title = 'Getting Started with Node.js and PostgreSQL' 
  AND c.slug IN ('nodejs', 'database', 'web-development')
ON CONFLICT DO NOTHING;

INSERT INTO post_categories (post_id, category_id) 
SELECT p.id, c.id FROM posts p, categories c 
WHERE p.title = '10 React Hooks You Should Know in 2024' 
  AND c.slug IN ('react', 'javascript', 'web-development')
ON CONFLICT DO NOTHING;

INSERT INTO post_categories (post_id, category_id) 
SELECT p.id, c.id FROM posts p, categories c 
WHERE p.title = 'The Ultimate Guide to RESTful API Design' 
  AND c.slug IN ('web-development', 'nodejs')
ON CONFLICT DO NOTHING;

```