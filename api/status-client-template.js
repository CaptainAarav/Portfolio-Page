/**
 * Status Client Template
 * 
 * Copy this code to your service (AMP server, Discord bot, website) and configure it
 * to POST status every 60 seconds to the status API.
 * 
 * Configuration:
 * - Update API_URL to point to your status API endpoint
 * - Update serviceId, serviceName, serviceType
 * - Add any custom details you want to report
 */

const API_URL = 'http://your-server-ip:3001/api/status/report'; // Update this!

// Service configuration
const SERVICE_CONFIG = {
  serviceId: 'your-service-id',        // e.g., 'minecraft-server-1'
  serviceName: 'Your Service Name',    // e.g., 'Minecraft Server'
  serviceType: 'game-server',          // 'game-server', 'discord-bot', or 'website'
};

// Function to get service status
async function getServiceStatus() {
  // TODO: Implement your service-specific status checking logic here
  // This is just a template - customize based on your service type
  
  const status = 'online'; // or 'offline' or 'degraded'
  const responseTime = 45; // milliseconds (optional)
  const uptime = 99.8; // percentage (optional)
  
  // Optional: Add service-specific details
  const details = {
    // For game servers:
    // players: 12,
    // maxPlayers: 50,
    // version: '1.20.1',
    
    // For Discord bots:
    // guilds: 5,
    // commands: 20,
    
    // For websites:
    // sslValid: true,
    // responseCode: 200
  };
  
  return {
    status,
    responseTime,
    uptime,
    details
  };
}

// Function to POST status to API
async function reportStatus() {
  try {
    const serviceStatus = await getServiceStatus();
    
    const payload = {
      ...SERVICE_CONFIG,
      ...serviceStatus
    };
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Status reported successfully:', result);
  } catch (error) {
    console.error('Error reporting status:', error);
  }
}

// Report status every 60 seconds
setInterval(reportStatus, 60000);

// Report immediately on startup
reportStatus();

/**
 * Example implementations for different service types:
 */

// ============================================
// Example 1: Node.js/Express Website
// ============================================
/*
const express = require('express');
const app = express();

// Add this endpoint to your Express app
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  // Your health check logic here
  const responseTime = Date.now() - startTime;
  
  await reportStatus({
    status: 'online',
    responseTime,
    details: { sslValid: true }
  });
  
  res.json({ status: 'ok' });
});

// Also add a cron job or setInterval to report every 60 seconds
setInterval(async () => {
  await reportStatus({
    status: 'online',
    responseTime: 0,
    details: {}
  });
}, 60000);
*/

// ============================================
// Example 2: Discord Bot (discord.js)
// ============================================
/*
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log('Bot is ready!');
  
  // Report status every 60 seconds
  setInterval(async () => {
    await reportStatus({
      status: client.isReady() ? 'online' : 'offline',
      details: {
        guilds: client.guilds.cache.size,
        users: client.users.cache.size
      }
    });
  }, 60000);
});
*/

// ============================================
// Example 3: AMP Server Script
// ============================================
/*
// For AMP servers, you can create a simple script that runs via cron
// or as a scheduled task that queries AMP API and posts status

const fetch = require('node-fetch');

async function checkAMPServer() {
  try {
    const ampResponse = await fetch('http://localhost:8080/API/Core/GetStatus', {
      headers: { 'Accept': 'application/json' }
    });
    
    const ampData = await ampResponse.json();
    const responseTime = Date.now() - startTime;
    
    await reportStatus({
      status: ampData.Status === 'Online' ? 'online' : 'offline',
      responseTime,
      details: {
        players: ampData.Players || 0,
        maxPlayers: ampData.MaxPlayers || 0,
        version: ampData.Version
      }
    });
  } catch (error) {
    await reportStatus({
      status: 'offline',
      details: { error: error.message }
    });
  }
}

setInterval(checkAMPServer, 60000);
checkAMPServer();
*/
