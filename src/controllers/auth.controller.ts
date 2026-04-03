import type { Request, Response } from "express";
import { authService } from "../services/auth.service";

const register = (req: Request, res: Response): Promise<void> => authService.register(req, res);
const login = (req: Request, res: Response): Promise<void> => authService.login(req, res);
const logout = (req: Request, res: Response): Promise<void> => authService.logout(req, res);
const forgotPassword = (req: Request, res: Response): Promise<void> => authService.forgotPassword(req, res);
const resetPassword = (req: Request, res: Response): Promise<void> => authService.resetPassword(req, res);
const me = (req: Request, res: Response): Promise<void> => authService.me(req, res);

export { register, login, logout, forgotPassword, resetPassword, me };
