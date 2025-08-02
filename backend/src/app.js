import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

// const bodyParser = require('body-parser'); // in place of this we can also we express.json(), ...
const app = express()

// Enhanced CORS configuration for production
const allowedOrigins = [
    'http://localhost:5173', // Local development
    'https://devansh-ai-chat.vercel.app', // Production frontend
    process.env.CORS_ORIGIN // Environment variable fallback
].filter(Boolean); // Remove any undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
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

// app.use(bodyParser.json()); // acts as middleware -> it reads data which is coming into json form
// app.use(bodyParser.text()); // reads data which is present in test form
// app.use(bodyParser.urlencoded());


// NOTE : express server by default req.body ko parse nhi kr paata  thats why we need middleware parsers

app.use(express.urlencoded({extended: true ,limit: "16kb"}))
app.use(express.json({limit: "16kb"})); // acts as middleware -> it reads data which is coming into json form
app.use(express.text()); // reads data which is present in test form
app.use(express.static("public"));
app.use(cookieParser());
// app.post('/ping', (req,res)=>{
//     // console.log(req.body); prints undefined to correct it we have to use middlewares like express.json(), express.text(), .... 
//     console.log(req.body);
//     return res.json({message : 'pong'}); 
// })


// Importing routes
import userRouter from './routes/index.js';


// routes declaration
app.use('/api/user', userRouter);

export { app }