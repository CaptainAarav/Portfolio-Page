const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'status.db');

// Initialize database
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
    });

    // Create services table
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS services (
          serviceId TEXT PRIMARY KEY,
          serviceName TEXT NOT NULL,
          serviceType TEXT NOT NULL,
          status TEXT NOT NULL,
          responseTime INTEGER,
          uptime REAL,
          lastSeen TEXT NOT NULL,
          details TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          reject(err);
        }
      });

      db.run(`
        CREATE INDEX IF NOT EXISTS idx_lastSeen ON services(lastSeen)
      `, (err) => {
        if (err) {
          console.error('Error creating index:', err);
          reject(err);
        } else {
          resolve(db);
        }
      });
    });
  });
}

// Get database instance
function getDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(db);
    });
  });
}

// Store or update service status
function updateServiceStatus(serviceData) {
  return new Promise((resolve, reject) => {
    getDatabase().then(db => {
      const now = new Date().toISOString();
      const details = serviceData.details ? JSON.stringify(serviceData.details) : null;

      db.run(`
        INSERT INTO services (
          serviceId, serviceName, serviceType, status, responseTime, 
          uptime, lastSeen, details, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(serviceId) DO UPDATE SET
          serviceName = excluded.serviceName,
          serviceType = excluded.serviceType,
          status = excluded.status,
          responseTime = excluded.responseTime,
          uptime = excluded.uptime,
          lastSeen = excluded.lastSeen,
          details = excluded.details,
          updatedAt = excluded.updatedAt
      `, [
        serviceData.serviceId,
        serviceData.serviceName,
        serviceData.serviceType,
        serviceData.status || 'online',
        serviceData.responseTime || null,
        serviceData.uptime || null,
        now,
        details,
        now,
        now
      ], function(err) {
        if (err) {
          console.error('Error updating service:', err);
          reject(err);
        } else {
          resolve({ success: true, id: this.lastID });
        }
        db.close();
      });
    }).catch(reject);
  });
}

// Get all services with status calculation
function getAllServices() {
  return new Promise((resolve, reject) => {
    getDatabase().then(db => {
      const now = new Date();
      
      db.all('SELECT * FROM services', [], (err, rows) => {
        if (err) {
          reject(err);
          db.close();
          return;
        }

        // Calculate current status based on lastSeen
        const services = rows.map(service => {
          const lastSeen = new Date(service.lastSeen);
          const secondsSinceLastSeen = (now - lastSeen) / 1000;
          
          // If service hasn't reported in >60 seconds, mark as offline
          const currentStatus = secondsSinceLastSeen > 60 ? 'offline' : service.status;
          
          return {
            serviceId: service.serviceId,
            serviceName: service.serviceName,
            serviceType: service.serviceType,
            status: currentStatus,
            responseTime: service.responseTime,
            uptime: service.uptime,
            lastSeen: service.lastSeen,
            details: service.details ? JSON.parse(service.details) : null
          };
        });

        resolve(services);
        db.close();
      });
    }).catch(reject);
  });
}

module.exports = {
  initDatabase,
  updateServiceStatus,
  getAllServices
};
