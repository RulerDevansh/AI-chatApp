import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CORS_ORIGIN 
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['set-cookie']
}))

app.use(express.urlencoded({extended: true ,limit: "16kb"}))
app.use(express.json({limit: "16kb"}));
app.use(express.text());
app.use(express.static("public"));
app.use(cookieParser());



// Importing routes
import userRouter from './routes/index.js';


// routes declaration
app.use('/api/user', userRouter);

export { app }