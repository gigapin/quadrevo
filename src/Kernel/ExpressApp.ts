import express, { type Express,  type Request, type Response } from 'express';
import router from './Router.ts';
import errorHandler from './Middleware/ErrorHandler.ts';

const app: Express = express();

app.use(express.json());
app.use('/api/v1', router);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    time: new Date().toISOString()
  });
});

app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: "Route not found",
    status: 404
  });
});

export default app;