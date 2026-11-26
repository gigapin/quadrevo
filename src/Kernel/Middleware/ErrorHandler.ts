import { type Request, type Response, type NextFunction } from 'express';
import type { ErrorRequestHandler, RequestHandler } from "express";
import { NotFoundError, AppError, NotAuthorizedError } from '../../utils/errors.ts';

export const notAuthorized: RequestHandler = (req: Request, res: Response) => {
    res.status(401)
    throw new NotAuthorizedError(`Resource ${req.path} is not authorized`)
}

export const notFound: RequestHandler = (req: Request, res: Response) => {
    res.status(404)
    throw new NotFoundError(`Route ${req.method} ${req.path} not found`)
}

const errorHandler: ErrorRequestHandler = 
(err: Error, req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) {
        next(err)
    }
    
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            message: err.message,
            status: err.statusCode
        })
    }
}

export default errorHandler