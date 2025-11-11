import 'dotenv/config';
import express from 'express';
import pool from '#config/pool.js';
import redisClient from '#config/redis.js';
import generateShortCode from '#utils/shortcode.util.js';

// Init express app
const app = express();
app.use(express.json()); // to parse request body

// Connect to the redis client
try {
  redisClient.connect();
} catch (error) {
  console.error('Error connecting to redis client', error);
  throw new Error(error.message);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Landing route
app.get('/api', (req, res) => {
  res.status(200).send('Thank you for using url-shortener');
});

// Create short URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { url, customCode } = req.body;

    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
      });
    }

    // Validate the URL format
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return res.status(400).json({
        error: 'Invalid URL format',
      });
    }

    // Check if custom code already exists
    if (customCode) {
      const existing = await pool.query(
        'SELECT id FROM urls WHERE short_code = $1',
        [customCode]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Custom code already exists' });
      }
    }

    const shortCode = customCode || generateShortCode();

    // Insert into database
    const result = await pool.query(
      'INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING id, short_code, original_url, created_at',
      [shortCode, url]
    );

    // Cache in Redis (expire after 24 hours)
    await redisClient.setEx(`url:${shortCode}`, 86400, url);

    res.status(201).json({
      shortCode: result.rows[0].short_code,
      originalUrl: result.rows[0].original_url,
      shortUrl: `${req.protocol}://${req.get('host')}/${result.rows[0].short_code}`,
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    console.error('Error creating short URL:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Redirect to the original URL
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    let originalUrl = await redisClient.get(`url:${shortCode}`);

    // If not in the cache, query database
    if (!originalUrl) {
      const result = await pool.query(
        'SELECT original_url FROM urls WHERE short_code = $1',
        [shortCode]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Short URL not found',
        });
      }

      originalUrl = result.rows[0].original_url;

      // Cache for future requests
      await redisClient.setEx(`url:${shortCode}`, 86400, originalUrl);
    }

    // Increment click count (async, don't wait)
    pool
      .query(
        'UPDATE urls SET clicks = clicks + 1, last_accessed = NOW() WHERE short_code = $1',
        [shortCode]
      )
      .catch(console.error);

    res.redirect(originalUrl);
  } catch (error) {
    console.error('Error redirecting:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get analytics for a short URL
app.get('/api/analytics/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    const result = await pool.query(
      'SELECT short_code, original_url, clicks, created_at, last_accessed FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Short URL was not found ',
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving analytics:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Get all URLs (with pagination)
app.get('/api/urls', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT short_code, original_url, clicks, created_at, last_accessed FROM urls ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const totalCount = (await pool.query('SELECT * FROM urls')).rowCount;

    res.status(200).json({
      urls: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error retrieving URLs:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// Listen to incoming requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`URL Shortener service running on port ${PORT}...`);
});
