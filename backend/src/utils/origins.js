const localOrigins = ['http://localhost:5173', 'http://localhost:5174'];
const productionOrigins = ['https://devansh-ai-chat.vercel.app'];

const splitOrigins = (value) =>
    value
        ? value.split(',').map((origin) => origin.trim()).filter(Boolean)
        : [];

export const getAllowedOrigins = () => {
    return [...new Set([
        ...localOrigins,
        ...productionOrigins,
        ...splitOrigins(process.env.CORS_ORIGIN),
        ...splitOrigins(process.env.FRONTEND_ORIGIN),
    ])];
};