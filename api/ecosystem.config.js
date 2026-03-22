module.exports = {
  apps: [
    {
      name: 'status-api',
      script: './server.js',
      cwd: '/home/aarav/Portfoliio/api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        SMTP_USER: 'aaravsahni1037@gmail.com',
        SMTP_PASS: 'vvxa afdn aoxj vbee',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_SECURE: 'false'
      }
    },
    {
      name: 'status-checker',
      script: './server-status-checker.js',
      cwd: '/home/aarav/Portfoliio/api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        STATUS_API_URL: 'http://localhost:3001/api/status/report',
        CHECK_INTERVAL: '60'
      }
    }
  ]
};
