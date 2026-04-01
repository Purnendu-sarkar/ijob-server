import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import config from './config';
import router from './app/routes';
const app = express();
app.use(cookieParser());
app.use(cors({
    origin: ['*', 'http://localhost:3000'],
    credentials: true
}));
//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.send({
        message: "🌟💼 Welcome to I JOB Server! Your ultimate platform to find the best jobs in Bangladesh. 🚀 Ready to discover your next career opportunity? Start your search now! 🔍",
        environment: config.node_env,
        uptime: process.uptime().toFixed(2) + "sec",
        timeStamp: new Date().toUTCString()
    });
});
// Routes 
app.use('/api/v1', router);
app.use(globalErrorHandler);
app.use(notFound);
export default app;
