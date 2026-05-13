import cookieParser from 'cookie-parser';
import express from 'express';
import type { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import config from './config';
import router from './app/routes';
import { rateLimit } from './app/middlewares/rateLimit';
import { securityHeaders } from './app/middlewares/securityHeaders';

const app: Application = express();
app.use(cookieParser());
app.use(securityHeaders);

const allowedOrigins = new Set([
    config.frontend_url,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req: Request, res: Response) => {
    res.send({
        message: "🌟💼 Welcome to I JOB Server! Your ultimate platform to find the best jobs in Bangladesh. 🚀 Ready to discover your next career opportunity? Start your search now! 🔍",
        environment: config.node_env,
        uptime: process.uptime().toFixed(2) + "sec",
        timeStamp: new Date().toUTCString()
    })
});

// Routes 
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 80 }));
app.use('/api/v1/users/register', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.use('/api/v1', router);

app.use(globalErrorHandler);

app.use(notFound);

export default app;
