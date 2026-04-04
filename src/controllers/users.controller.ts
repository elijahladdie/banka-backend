import type { Request, Response } from "express";
import { usersService } from "../services/users.service";

const listUsers = (req: Request, res: Response): Promise<void> => usersService.listUsers(req, res);
const createUser = (req: Request, res: Response): Promise<void> => usersService.createUser(req, res);
const getUserById = (req: Request, res: Response): Promise<void> => usersService.getUserById(req, res);
const updateUser = (req: Request, res: Response): Promise<void> => usersService.updateUser(req, res);
const updateUserStatus = (req: Request, res: Response): Promise<void> => usersService.updateUserStatus(req, res);
const changeUserPassword = (req: Request, res: Response): Promise<void> => usersService.changeUserPassword(req, res);
const softDeleteUser = (req: Request, res: Response): Promise<void> => usersService.softDeleteUser(req, res);

export { listUsers, createUser, getUserById, updateUser, updateUserStatus, changeUserPassword, softDeleteUser };
