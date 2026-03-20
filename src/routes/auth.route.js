import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouter = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register', authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user and return access token
 * @access Public
 */
authRouter.post('/login', authController.login);

/** 
 * GET /api/auth/get-me
 */
authRouter.get('/get-me', authController.getMe);

/** 
 * GET /api/auth/refresh-token
 */
authRouter.get('/refresh-token', authController.refreshToken);

/** 
 * GET /api/auth/logout
 */
authRouter.get('/logout', authController.logout);

/** 
 * GET /api/auth/logout-all
 */
authRouter.get('/logout-all', authController.logoutAll);
export default authRouter;