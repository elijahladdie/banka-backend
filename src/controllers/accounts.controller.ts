import type { Request, Response } from "express";
import { accountsService } from "../services/accounts.service";

const createAccount = (req: Request, res: Response): Promise<void> => accountsService.createAccount(req, res);
const listAccounts = (req: Request, res: Response): Promise<void> => accountsService.listAccounts(req, res);
const getAccountById = (req: Request, res: Response): Promise<void> => accountsService.getAccountById(req, res);
const getAccountByNumber = (req: Request, res: Response): Promise<void> => accountsService.getAccountByNumber(req, res);
const approveAccount = (req: Request, res: Response): Promise<void> => accountsService.approveAccount(req, res);
const rejectAccount = (req: Request, res: Response): Promise<void> => accountsService.rejectAccount(req, res);
const updateAccountStatus = (req: Request, res: Response): Promise<void> => accountsService.updateAccountStatus(req, res);

export { createAccount, listAccounts, getAccountById, getAccountByNumber, approveAccount, rejectAccount, updateAccountStatus };
