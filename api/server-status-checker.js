#!/usr/bin/env node

/**
 * Centralized Docker Status Checker
 * 
 * Monitors all Discord bot and website Docker containers on the server
 * and reports their status to the status API.
 * 
 * Environment Variables:
 * - STATUS_API_URL: API endpoint (default: https://captainaarav.dev/api/status/report)
 * - DOCKER_SOCKET: Docker socket path (default: /var/run/docker.sock)
 * - SERVICES_CONFIG: Path to services config file (default: ./services-config.json)
 * - CHECK_INTERVAL: Seconds between checks (default: 60)
 * - ENABLE_HTTP_CHECKS: Enable HTTP health checks for websites (default: true)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration from environment variables
const CONFIG = {
  apiUrl: process.env.STATUS_API_URL || 'https://captainaarav.dev/api/status/report',
  dockerSocket: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
  servicesConfigPath: process.env.SERVICES_CONFIG || path.join(__dirname, 'services-config.json'),
  checkInterval: parseInt(process.env.CHECK_INTERVAL || '60', 10) * 1000, // Convert to milliseconds
  enableHttpChecks: process.env.ENABLE_HTTP_CHECKS !== 'false',
};

// Try to use dockerode if available, otherwise fallback to docker CLI
let Docker;
let docker;
try {
  Docker = require('dockerode');
  docker = new Docker({ socketPath: CONFIG.dockerSocket });
  console.log('[Status Checker] Using dockerode for Docker API access');
} catch (error) {
  console.log('[Status Checker] dockerode not available, using docker CLI');
  docker = null;
}

/**
 * Load services configuration from JSON file
 */
function loadServicesConfig() {
  try {
    if (!fs.existsSync(CONFIG.servicesConfigPath)) {
      console.error(`Error: Services config file not found: ${CONFIG.servicesConfigPath}`);
      console.error('Please create services-config.json with your service mappings.');
      process.exit(1);
    }
    
    const configData = fs.readFileSync(CONFIG.servicesConfigPath, 'utf8');
    const config = JSON.parse(configData);
    
    if (!config.services || !Array.isArray(config.services)) {
      throw new Error('Config file must contain a "services" array');
    }
    
    return config.services;
  } catch (error) {
    console.error('Error loading services config:', error.message);
    process.exit(1);
  }
}

/**
 * Get container status using dockerode
 */
async function getContainerStatusDockerode(containerName) {
  try {
    const container = docker.getContainer(containerName);
    const inspect = await container.inspect();
    const stats = await container.stats({ stream: false });
    
    // Calculate CPU usage percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;
    
    // Get memory usage
    const memoryUsage = stats.memory_stats.usage || 0;
    const memoryLimit = stats.memory_stats.limit || 0;
    const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;
    
    return {
      status: inspect.State.Status === 'running' ? 'online' : 'offline',
      health: inspect.State.Health?.Status || null,
      cpuUsage: Math.round(cpuPercent * 10) / 10, // Round to 1 decimal
      ramUsage: Math.round(memoryUsage / 1024 / 1024), // Convert to MB
      ramUsagePercent: Math.round(memoryPercent * 10) / 10,
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return { status: 'offline', error: 'Container not found' };
    }
    throw error;
  }
}

/**
 * Get container status using docker CLI
 */
async function getContainerStatusCLI(containerName) {
  try {
    // Check if container exists and get status
    // Use conditional to handle containers without health checks
    const { stdout: inspectOutput } = await execAsync(`docker inspect ${containerName} --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}'`);
    const [status, health] = inspectOutput.trim().split('|');
    
    // Get container stats
    const { stdout: statsOutput } = await execAsync(`docker stats ${containerName} --no-stream --format '{{.CPUPerc}}|{{.MemUsage}}'`);
    const [cpuPercent, memUsage] = statsOutput.trim().split('|');
    
    // Parse memory usage (format: "123.45MiB / 2GiB")
    const memMatch = memUsage.match(/([\d.]+)\s*(\w+)\s*\/\s*([\d.]+)\s*(\w+)/);
    let ramUsage = 0;
    let ramUsagePercent = 0;
    
    if (memMatch) {
      const used = parseFloat(memMatch[1]);
      const usedUnit = memMatch[2];
      const total = parseFloat(memMatch[3]);
      const totalUnit = memMatch[4];
      
      // Convert to MB
      const usedMB = convertToMB(used, usedUnit);
      const totalMB = convertToMB(total, totalUnit);
      
      ramUsage = Math.round(usedMB);
      ramUsagePercent = totalMB > 0 ? Math.round((usedMB / totalMB) * 100 * 10) / 10 : 0;
    }
    
    // Parse CPU percentage (format: "12.34%")
    const cpuMatch = cpuPercent.match(/([\d.]+)%/);
    const cpuUsage = cpuMatch ? Math.round(parseFloat(cpuMatch[1]) * 10) / 10 : 0;
    
    return {
      status: status === 'running' ? 'online' : 'offline',
      health: health && health !== '<no value>' && health !== 'none' ? health : null,
      cpuUsage,
      ramUsage,
      ramUsagePercent,
    };
  } catch (error) {
    if (error.message.includes('No such container')) {
      return { status: 'offline', error: 'Container not found' };
    }
    throw error;
  }
}

/**
 * Convert memory units to MB
 */
function convertToMB(value, unit) {
  const unitLower = unit.toLowerCase();
  if (unitLower === 'b') return value / 1024 / 1024;
  if (unitLower === 'kb' || unitLower === 'kib') return value / 1024;
  if (unitLower === 'mb' || unitLower === 'mib') return value;
  if (unitLower === 'gb' || unitLower === 'gib') return value * 1024;
  if (unitLower === 'tb' || unitLower === 'tib') return value * 1024 * 1024;
  return value; // Default to MB
}

/**
 * Get container status (uses dockerode if available, otherwise CLI)
 */
async function getContainerStatus(containerName) {
  if (docker && typeof docker.getContainer === 'function') {
    return await getContainerStatusDockerode(containerName);
  } else {
    return await getContainerStatusCLI(containerName);
  }
}

/**
 * Check HTTP health endpoint
 */
async function checkHttpHealth(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          healthy: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode,
          responseTime,
        });
      });
    });
    
    req.on('error', () => {
      resolve({
        healthy: false,
        error: 'Connection failed',
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        healthy: false,
        error: 'Timeout',
      });
    });
  });
}

/**
 * Check status of a single service
 */
async function checkService(serviceConfig) {
  const { containerName, serviceId, serviceName, serviceType, healthCheckUrl } = serviceConfig;
  
  try {
    // Get container status
    const containerStatus = await getContainerStatus(containerName);
    
    // Determine overall status
    let status = containerStatus.status;
    if (status === 'online' && containerStatus.health) {
      // If healthcheck is configured, use health status
      if (containerStatus.health === 'unhealthy') {
        status = 'offline';
      }
    }
    
    // For websites, optionally check HTTP health
    let httpHealth = null;
    if (serviceType === 'website' && CONFIG.enableHttpChecks && healthCheckUrl) {
      httpHealth = await checkHttpHealth(healthCheckUrl);
      if (!httpHealth.healthy) {
        status = 'offline';
      }
    }
    
    // Build details object
    const details = {};
    
    if (containerStatus.ramUsage) {
      details.ramUsage = containerStatus.ramUsage; // In MB
    }
    
    if (containerStatus.cpuUsage !== undefined) {
      details.cpuUsage = containerStatus.cpuUsage;
    }
    
    // Add HTTP health info for websites
    if (httpHealth) {
      details.responseCode = httpHealth.statusCode;
      if (httpHealth.error) {
        details.error = httpHealth.error;
      }
    }
    
    return {
      serviceId,
      serviceName,
      serviceType,
      status,
      responseTime: httpHealth?.responseTime || 50,
      details,
    };
  } catch (error) {
    console.error(`Error checking service ${serviceName} (${containerName}):`, error.message);
    return {
      serviceId,
      serviceName,
      serviceType,
      status: 'offline',
      details: { error: error.message },
    };
  }
}

/**
 * Report status to API
 */
async function reportStatus(serviceStatuses) {
  const url = new URL(CONFIG.apiUrl);
  const client = url.protocol === 'https:' ? https : http;
  
  // Report each service individually
  const results = [];
  
  for (const serviceStatus of serviceStatuses) {
    try {
      const payload = JSON.stringify(serviceStatus);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 10000,
      };
      
      await new Promise((resolve, reject) => {
        const req = client.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve();
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.write(payload);
        req.end();
      });
      
      results.push({ service: serviceStatus.serviceName, success: true });
    } catch (error) {
      console.error(`Error reporting status for ${serviceStatus.serviceName}:`, error.message);
      results.push({ service: serviceStatus.serviceName, success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Main check cycle
 */
async function checkAndReport() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Starting status check cycle...`);
  
  try {
    const servicesConfig = loadServicesConfig();
    console.log(`[${timestamp}] Found ${servicesConfig.length} services to check`);
    
    // Check all services
    const serviceStatuses = await Promise.all(
      servicesConfig.map(serviceConfig => checkService(serviceConfig))
    );
    
    // Report to API
    const results = await reportStatus(serviceStatuses);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`[${timestamp}] Status check complete: ${successCount} succeeded, ${failCount} failed`);
    
    if (failCount > 0) {
      results.filter(r => !r.success).forEach(r => {
        console.error(`  Failed: ${r.service} - ${r.error}`);
      });
    }
  } catch (error) {
    console.error(`[${timestamp}] Error in check cycle:`, error.message);
  }
}

/**
 * Main execution
 */
let intervalId = null;
let isShuttingDown = false;

async function start() {
  console.log(`[${new Date().toISOString()}] Starting Docker Status Checker`);
  console.log(`[${new Date().toISOString()}] API URL: ${CONFIG.apiUrl}`);
  console.log(`[${new Date().toISOString()}] Docker Socket: ${CONFIG.dockerSocket}`);
  console.log(`[${new Date().toISOString()}] Services Config: ${CONFIG.servicesConfigPath}`);
  console.log(`[${new Date().toISOString()}] Check Interval: ${CONFIG.checkInterval / 1000} seconds`);
  
  // Verify Docker access
  try {
    if (docker && typeof docker.listContainers === 'function') {
      await docker.listContainers();
      console.log('[Status Checker] Docker API access verified');
    } else {
      await execAsync('docker ps');
      console.log('[Status Checker] Docker CLI access verified');
    }
  } catch (error) {
    console.error('Error: Cannot access Docker. Make sure Docker is running and accessible.');
    console.error('  - If using dockerode: ensure docker socket is accessible');
    console.error('  - If using CLI: ensure docker command is available and user has permissions');
    process.exit(1);
  }
  
  // Run initial check
  await checkAndReport();
  
  // Set up periodic checks
  intervalId = setInterval(async () => {
    if (!isShuttingDown) {
      await checkAndReport();
    }
  }, CONFIG.checkInterval);
}

// Graceful shutdown
function shutdown() {
  if (isShuttingDown) return;
  
  isShuttingDown = true;
  console.log(`[${new Date().toISOString()}] Shutting down status checker...`);
  
  if (intervalId) {
    clearInterval(intervalId);
  }
  
  // Run final check
  checkAndReport()
    .then(() => {
      console.log(`[${new Date().toISOString()}] Final status check complete`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`[${new Date().toISOString()}] Final status check failed:`, error.message);
      process.exit(1);
    });
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the checker
start().catch((error) => {
  console.error(`[${new Date().toISOString()}] Failed to start status checker:`, error);
  process.exit(1);
});
