import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { getAllowedOrigins } from './utils/origins.js'

// Load environment variables before reading process.env
dotenv.config()

const app = express()
const allowedOrigins = getAllowedOrigins();

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