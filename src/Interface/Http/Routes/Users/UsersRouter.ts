import express  from "express";
import { listUsers } from "./ListUsersRoute.ts";

const router = express.Router();

router.get('/users', listUsers)

export {router as UserRouter}

