export default {
    apps: [
        {
            name: "AI-chatApp",
            script: "npm",
            args: "run dev",
            interpreter: "node",
            watch: true,
            ignore_watch: ["node_modules", "logs"],
            env: {
                NODE_ENV: "development",
                PORT: 8000,
            },
        },
    ],
};