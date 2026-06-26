module.exports = {
  apps: [
    {
      name: "performa-backend",
      script: "server.js",
      cwd: "F:/EDP/Project/PerformaLayanan/backend",
      env: {
        NODE_ENV: "production",
        PORT: 5001,
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
    },
  ],
};
