const localOrigins = ['http://localhost:5173', 'http://localhost:5174'];
const productionOrigins = ['https://devansh-ai-chat.vercel.app'];

const splitOrigins = (value) =>
    value
        ? value.split(',').map((origin) => origin.trim()).filter(Boolean)
        : [];

const matchesVercelApp = (origin) => {
    try {
        const url = new URL(origin);
        return url.protocol === 'https:' && url.hostname.endsWith('.vercel.app');
    } catch {
        return false;
    }
};

export const getAllowedOrigins = () => {
    return [...new Set([
        ...localOrigins,
        ...productionOrigins,
        ...splitOrigins(process.env.CORS_ORIGIN),
        ...splitOrigins(process.env.FRONTEND_ORIGIN),
    ])];
};

export const isAllowedOrigin = (origin) => {
    if (!origin) {
        return true;
    }

    if (getAllowedOrigins().includes(origin)) {
        return true;
    }

    return matchesVercelApp(origin);
};