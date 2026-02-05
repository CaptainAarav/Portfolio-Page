const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase, updateServiceStatus, getAllServices } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database on startup
initDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST endpoint for services to report their status
app.post('/api/status/report', async (req, res) => {
  try {
    const { serviceId, serviceName, serviceType, status, responseTime, uptime, details } = req.body;

    // Validate required fields
    if (!serviceId || !serviceName || !serviceType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: serviceId, serviceName, serviceType'
      });
    }

    // Validate serviceType
    const validTypes = ['game-server', 'discord-bot', 'website'];
    if (!validTypes.includes(serviceType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid serviceType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Store status
    await updateServiceStatus({
      serviceId,
      serviceName,
      serviceType,
      status: status || 'online',
      responseTime,
      uptime,
      details
    });

    res.json({
      success: true,
      message: 'Status recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET endpoint for frontend to retrieve all service statuses
app.get('/api/status', async (req, res) => {
  try {
    const services = await getAllServices();
    
    res.json({
      services,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving services:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Status API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Status endpoint: http://localhost:${PORT}/api/status`);
});
