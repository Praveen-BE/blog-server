const express = require('express');
const router = express.Router();
const {slugify} = require("../utlls/slugify");

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.app.locals.pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Get category by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await req.app.locals.pool.query(
      'SELECT * FROM categories WHERE slug = $1',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category
router.post('/', async (req, res) => {
  try {
    let { name, slug, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Auto-generate slug from name if not provided
    if (!slug) {
      slug = slugify(name);
    } else {
      slug = slugify(slug); // Ensure slug is properly formatted
    }
    
    // Check if slug already exists
    const existingSlug = await req.app.locals.pool.query(
      'SELECT slug FROM categories WHERE slug = $1',
      [slug]
    );
    
    if (existingSlug.rows.length > 0) {
      // Generate unique slug by appending number
      let counter = 1;
      let uniqueSlug = `${slug}-${counter}`;
      
      while (true) {
        const checkSlug = await req.app.locals.pool.query(
          'SELECT slug FROM categories WHERE slug = $1',
          [uniqueSlug]
        );
        
        if (checkSlug.rows.length === 0) {
          slug = uniqueSlug;
          break;
        }
        
        counter++;
        uniqueSlug = `${slug}-${counter}`;
      }
    }
    
    const result = await req.app.locals.pool.query(
      'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, description || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let { name, slug, description } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Auto-generate slug from name if not provided
    if (!slug) {
      slug = slugify(name);
    } else {
      slug = slugify(slug); // Ensure slug is properly formatted
    }
    
    // Check if slug is already taken by another category
    const existingCategory = await req.app.locals.pool.query(
      'SELECT id, slug FROM categories WHERE slug = $1 AND id != $2',
      [slug, id]
    );
    
    if (existingCategory.rows.length > 0) {
      return res.status(409).json({ 
        error: `Slug '${slug}' already exists. Please choose a different slug.`,
        suggestion: `Try: ${slug}-2, ${slug}-updated, or ${slugify(name)}-new`
      });
    }
    
    const result = await req.app.locals.pool.query(
      'UPDATE categories SET name = $1, slug = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, slug, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'Slug already exists. Please choose a different slug.' 
      });
    }
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Check if slug is available
router.get('/check-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await req.app.locals.pool.query(
      'SELECT id FROM categories WHERE slug = $1',
      [slugify(slug)]
    );
    
    res.json({ 
      available: result.rows.length === 0,
      slug: slugify(slug)
    });
  } catch (error) {
    console.error('Error checking slug:', error);
    res.status(500).json({ error: 'Failed to check slug availability' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.app.locals.pool.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;