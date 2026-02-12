import express from 'express';
import type { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import config from './config';

const app: Application = express();
app.use(cors({
    origin: 'http://localhost:3000',
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


app.use(globalErrorHandler);

app.use(notFound);

export default app;