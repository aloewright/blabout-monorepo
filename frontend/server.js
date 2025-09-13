const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

// Enforce primary host to consolidate frontends and avoid OAuth origin mismatch
const PRIMARY_HOST = process.env.PRIMARY_HOST || 'blabout.com';
app.use((req, res, next) => {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https');
  if (host && host !== PRIMARY_HOST) {
    const url = `${proto}://${PRIMARY_HOST}${req.originalUrl || '/'}`;
    return res.redirect(301, url);
  }
  return next();
});

// Serve static files from the React app build directory with proper MIME types
app.use(express.static(path.join(__dirname, 'build'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Health
app.get('/_health', (_req, res) => res.status(200).send('ok'));

// Runtime env for frontend: served from Cloud Run env vars
app.get('/env.json', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    apiBaseUrl: process.env.API_BASE_URL || ''
  });
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port} (primary host: ${PRIMARY_HOST})`);
});
