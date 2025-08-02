module.exports = {
  apps: [
    {
      name: "backend-AIchat-dev", 
      script: "npm", 
      args: "run dev",
      interpreter: "node",
      watch: true, 
      ignore_watch: ["node_modules", "logs"],
      env: {      },
    },
  ],
};
