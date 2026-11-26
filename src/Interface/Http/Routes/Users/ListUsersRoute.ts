import { type Request, type Response } from "express";

export const listUsers = (req: Request, res: Response) => {
    res.status(200).json({
        message: "Users"
    })
}


