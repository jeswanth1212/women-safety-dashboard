const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Admin = require('./models/Admin');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/admins', {
  // Remove deprecated options
  // useNewUrlParser and useUnifiedTopology are no longer needed
});

// Endpoint to register a new admin (for initial setup)
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = new Admin({ username, password });
    await admin.save();
    res.status(201).send('Admin registered');
  } catch (error) {
    res.status(400).send(error);
  }
});

// Endpoint to login an admin
app.post('/login', async (req, res) => {
  // Temporarily bypass authentication
  const token = jwt.sign({ id: 'temporary_admin_id' }, 'your_jwt_secret', { expiresIn: '1h' });
  res.json({ token });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});