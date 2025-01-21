const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Admin = require('./models/Admin');
const Alert = require('./models/Alert');

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

const alerts = [];

// Endpoint to handle incoming alert requests
app.post('/alerts', (req, res) => {
  const { name, phone, location, message } = req.body;
  const alert = { name, phone, location, message };
  alerts.push(alert);
  console.log(`Alert received: ${name}, ${phone}, ${location}`);
  res.status(200).send('Alert received');
});

// Endpoint to return stored alerts
app.get('/alerts', (req, res) => {
  res.json(alerts);
});

// Add this new endpoint
app.post('/api/test-alert', async (req, res) => {
  try {
    const newAlert = new Alert({
      name: req.body.name,
      phone: req.body.phone,
      location: {
        latitude: req.body.latitude,
        longitude: req.body.longitude
      },
      message: req.body.message,
      timestamp: new Date()
    });

    await newAlert.save();
    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Error creating test alert:', error);
    res.status(500).json({ error: 'Failed to create test alert' });
  }
});

// Add this endpoint to get all alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Add this endpoint to delete an alert
app.delete('/api/alerts/:id', async (req, res) => {
  try {
    console.log('Received delete request for alert ID:', req.params.id);
    const alertId = req.params.id;
    
    // Check if alert exists before deletion
    const alertExists = await Alert.findById(alertId);
    if (!alertExists) {
      console.log('Alert not found:', alertId);
      return res.status(404).json({ error: 'Alert not found' });
    }

    const result = await Alert.findByIdAndDelete(alertId);
    console.log('Delete result:', result);
    
    if (!result) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    console.log('Alert deleted successfully:', alertId);
    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});