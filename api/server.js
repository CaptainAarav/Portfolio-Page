// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

let databaseModule;
try {
  databaseModule = require('./database');
} catch(err) {
  console.error('Failed to load database module:', err);
  throw err;
}
const { initDatabase, updateServiceStatus, getAllServices } = databaseModule;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Custom body parser for /api/status/report - MUST BE FIRST, before any other body parsers
// This manually reads the stream to avoid conflicts with Express body parsers
// Optimized for faster request handling with reduced logging
app.use('/api/status/report', (req, res, next) => {
  if (req.method !== 'POST') {
    return next();
  }
  
  let rawData = Buffer.alloc(0);
  
  req.on('data', (chunk) => {
    rawData = Buffer.concat([rawData, chunk]);
  });
  
  req.on('end', () => {
    const rawDataString = rawData.toString('utf8');
    
    // Reduced logging for faster requests - only log errors
    // Uncomment below for debugging if needed:
    // console.log('=== RAW REQUEST BODY ===');
    // console.log(rawDataString);
    // console.log('=== END RAW BODY ===');
    
    // Check if body is empty
    if (!rawDataString || rawDataString.trim().length === 0) {
      console.error('Empty request body received');
      return res.status(400).json({ 
        success: false, 
        error: 'Empty request body',
        message: 'The request body is empty. Check AMP script configuration.'
      });
    }
    
    // Try to parse as JSON
    try {
      req.body = JSON.parse(rawDataString);
      // Reduced logging - only log on first request or errors
      // console.log('Successfully parsed JSON:', req.body.serviceId, req.body.serviceName);
      next();
    } catch (error) {
      console.error('JSON Parse Error Details:');
      console.error('Error:', error.message);
      const position = parseInt(error.message.match(/position (\d+)/)?.[1] || 0);
      console.error('Position:', position);
      if (position > 0 && rawDataString && rawDataString.length > position) {
        const start = Math.max(0, position - 100);
        const end = Math.min(rawDataString.length, position + 100);
        console.error('Problematic section:', rawDataString.substring(start, end));
        console.error('Character at position:', rawDataString[position]);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON in request body',
        message: 'AMP variables may not be replaced. Variables like {@UserCount} must be replaced with actual numbers, not sent as literal strings.',
        details: error.message,
        receivedBody: rawDataString ? rawDataString.substring(0, 500) : 'undefined or null'
      });
    }
  });
  
  req.on('error', (err) => {
    console.error('Request stream error:', err);
    res.status(500).json({ success: false, error: 'Request stream error' });
  });
});

// Regular body parser for other routes (skips /api/status/report because it's already parsed)
app.use((req, res, next) => {
  if (req.path === '/api/status/report' && req.method === 'POST') {
    return next(); // Already parsed by custom middleware
  }
  return bodyParser.json()(req, res, next);
});
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database on startup
initDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    console.error('Error details:', err.stack);
    process.exit(1);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper function to normalize status
function normalizeStatus(status) {
  if (!status) return 'online';
  const statusLower = status.toLowerCase();
  if (statusLower === 'ready' || statusLower === 'online' || statusLower === 'running' || statusLower === 'started') {
    return 'online';
  }
  return 'offline';
}

// Helper function to process service status
async function processServiceStatus(serviceData) {
  const { serviceId, serviceName, serviceType, status, responseTime, uptime, details } = serviceData;

  // Validate required fields
  if (!serviceId || !serviceName || !serviceType) {
    throw new Error('Missing required fields: serviceId, serviceName, serviceType');
  }

  // Validate serviceType
  const validTypes = ['game-server', 'discord-bot', 'website'];
  if (!validTypes.includes(serviceType)) {
    throw new Error(`Invalid serviceType. Must be one of: ${validTypes.join(', ')}`);
  }

  // Normalize status - AMP sends "Ready", "Online", "Offline", etc.
  const normalizedStatus = normalizeStatus(status);
  
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
  
  return { serviceId, success: true };
}

// POST endpoint for services to report their status (single or batch)
app.post('/api/status/report', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check if this is a batch request (array) or single request (object)
    const isBatch = Array.isArray(req.body);
    const services = isBatch ? req.body : [req.body];
    
    // Reduced logging for faster requests - only log batch size or first service
    if (isBatch) {
      console.log(`[${new Date().toISOString()}] Received batch POST request: ${services.length} services`);
    } else {
      // Only log occasionally for single requests to reduce log spam
      if (Math.random() < 0.1) { // Log ~10% of requests
        console.log(`[${new Date().toISOString()}] Received POST request from ${req.body?.serviceId || 'unknown'}`);
      }
    }
    
    const results = [];
    const errors = [];
    
    // Process all services in parallel for speed
    const promises = services.map(async (serviceData, index) => {
      try {
        const result = await processServiceStatus(serviceData);
        results.push(result);
        return result;
      } catch (error) {
        const errorInfo = {
          index,
          serviceId: serviceData?.serviceId || 'unknown',
          error: error.message
        };
        errors.push(errorInfo);
        console.error(`Error processing service ${errorInfo.serviceId}:`, error.message);
        return { serviceId: errorInfo.serviceId, success: false, error: error.message };
      }
    });
    
    await Promise.all(promises);
    
    const elapsed = Date.now() - startTime;
    
    // Log summary
    if (isBatch || errors.length > 0) {
      console.log(`[${new Date().toISOString()}] Processed ${services.length} service(s): ${results.length} succeeded, ${errors.length} failed (${elapsed}ms)`);
    }

    // Return success if at least one service was processed successfully
    if (results.length > 0) {
      res.json({
        success: true,
        message: isBatch ? `Processed ${results.length} of ${services.length} services` : 'Status recorded',
        processed: results.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      });
    } else {
      // All failed
      res.status(400).json({
        success: false,
        error: 'All services failed to process',
        errors: errors
      });
    }
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

// POST endpoint for contact form submissions
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, message'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Send email using nodemailer
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (err) {
      console.error('nodemailer not installed. Run: npm install nodemailer');
      return res.status(500).json({
        success: false,
        error: 'Email service not configured'
      });
    }

    // Configure transporter
    // Use environment variables for email configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.SMTP_USER || process.env.EMAIL_USER,
      to: 'aaravsahni1037@gmail.com',
      subject: `Portfolio Contact Form: Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);

    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// Enable HTTP keep-alive for better connection reuse
const server = app.listen(PORT, () => {
  console.log(`Status API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Status endpoint: http://localhost:${PORT}/api/status`);
  console.log(`Batch endpoint: POST to /api/status/report with array of services`);
  
  // Set keep-alive timeout for better connection reuse
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
});
