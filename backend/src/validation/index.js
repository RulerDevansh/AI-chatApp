import jwt from 'jsonwebtoken';


export function isLoggedIn(req, res, next) {
    // Check for token in Authorization header first
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else {
        // Fallback to cookie-based token
        token = req.cookies['accessToken'];
    }
    
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
}