import express, { type Request, type Response, type NextFunction } from 'express';
import { UserRouter } from '../Interface/Http/Routes/Users/UsersRouter.ts' 

const router = express.Router();

const middleware = ((req: Request, res: Response, next: NextFunction) => {
    next();
});

router.use(middleware);

router.use(UserRouter)

export default router;