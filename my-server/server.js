const express = require('express');
const path = require('path');

const app = express();

// Serve everything inside the parent folder (LARPWALLET)
app.use(express.static(path.join(__dirname, '..')));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', 'index.html'));
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});