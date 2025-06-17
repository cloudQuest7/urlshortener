require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();

// Database to store URLs (using object for simplicity)
const urlDatabase = {};
let counter = 1;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// POST endpoint to create short URL
app.post('/api/shorturl', async (req, res) => {
  const originalUrl = req.body.url;
  
  // Validate URL format
  try {
    const parsedUrl = new URL(originalUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.json({ error: 'invalid url' });
    }

    // Verify domain exists using DNS lookup
    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      // Check if URL already exists in database
      const existingUrl = Object.keys(urlDatabase).find(
        key => urlDatabase[key] === originalUrl
      );

      if (existingUrl) {
        return res.json({
          original_url: originalUrl,
          short_url: parseInt(existingUrl)
        });
      }

      // Store new URL
      urlDatabase[counter] = originalUrl;
      res.json({
        original_url: originalUrl,
        short_url: counter
      });
      counter++;
    });
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (!originalUrl) {
    return res.json({ error: 'No short URL found' });
  }

  res.redirect(originalUrl);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
