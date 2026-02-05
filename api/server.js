const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase, updateServiceStatus, getAllServices } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Custom body parser for /api/status/report to capture raw body
app.use('/api/status/report', (req, res, next) => {
  if (req.method !== 'POST') {
    return next();
  }
  
  let rawData = Buffer.alloc(0);
  
  req.on('data', (chunk) => {
    rawData = Buffer.concat([rawData, chunk]);
  });
  
  req.on('end', () => {
    const rawBodyString = rawData.toString('utf8');
    console.log('=== RAW REQUEST BODY ===');
    console.log(rawBodyString);
    console.log('=== END RAW BODY ===');
    
    // Try to parse as JSON
    try {
      req.body = JSON.parse(rawBodyString);
      next();
    } catch (error) {
      console.error('JSON Parse Error Details:');
      console.error('Error:', error.message);
      const position = parseInt(error.message.match(/position (\d+)/)?.[1] || 0);
      console.error('Position:', position);
      if (position > 0 && rawBodyString.length > position) {
        const start = Math.max(0, position - 100);
        const end = Math.min(rawBodyString.length, position + 100);
        console.error('Problematic section:', rawBodyString.substring(start, end));
        console.error('Character at position:', rawBodyString[position]);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON in request body',
        message: 'AMP variables may not be replaced. Variables like {{UserCount}} must be replaced with actual numbers, not sent as literal strings.',
        details: error.message,
        receivedBody: rawBodyString.substring(0, 500)
      });
    }
  });
  
  req.on('error', (err) => {
    console.error('Request stream error:', err);
    res.status(500).json({ success: false, error: 'Request stream error' });
  });
});

// Regular body parser for other routes
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
    // Log raw body for debugging
    console.log(`[${new Date().toISOString()}] Received POST request`);
    console.log('Raw body:', JSON.stringify(req.body));
    
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

    // Normalize status - AMP sends "Ready", "Online", "Offline", etc.
    let normalizedStatus = 'online';
    if (status) {
      const statusLower = status.toLowerCase();
      // Map various AMP statuses to online/offline
      if (statusLower === 'ready' || statusLower === 'online' || statusLower === 'running') {
        normalizedStatus = 'online';
      } else {
        normalizedStatus = 'offline';
      }
    }
    
    // Log received status for debugging
    console.log(`[${new Date().toISOString()}] Received status from ${serviceId}: ${status} -> ${normalizedStatus}`);
    
    // Handle RAM/CPU - AMP might send RAM in MB, convert if needed
    let processedDetails = details;
    if (details) {
      processedDetails = { ...details };
      
      // If RAM usage is > 100, assume it's in MB and convert to percentage
      // (assuming typical server has 2-8GB RAM, adjust threshold as needed)
      if (processedDetails.ramUsage && processedDetails.ramUsage > 100) {
        // This is likely MB, not percentage - we'll store as-is but frontend can handle it
        // Or convert: ramUsageMB / totalRAMMB * 100
        // For now, keep as-is and let frontend display it as MB
        console.log(`RAM usage appears to be in MB: ${processedDetails.ramUsage}`);
      }
    }
    
    // Store status
    await updateServiceStatus({
      serviceId,
      serviceName,
      serviceType,
      status: normalizedStatus,
      responseTime,
      uptime,
      details: processedDetails
    });

    res.json({
      success: true,
      message: 'Status recorded',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording status:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body that caused error:', req.body);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
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
