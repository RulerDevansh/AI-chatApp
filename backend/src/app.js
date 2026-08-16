import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { isAllowedOrigin } from './utils/origins.js'

// Load environment variables before reading process.env
dotenv.config()

const app = express()

const corsOptions = {
    origin: function (origin, callback) {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['set-cookie']
};

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))

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