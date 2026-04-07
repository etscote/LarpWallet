const express = require('express');
const path = require('path');

const app = express();

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve CSS
app.use('/css', express.static(path.join(__dirname, 'css')));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 2829;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:$2829`);
});