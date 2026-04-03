import type { Request, Response } from "express";
import { transactionsService } from "../services/transactions.service";

const deposit = (req: Request, res: Response): Promise<void> => transactionsService.deposit(req, res);
const withdraw = (req: Request, res: Response): Promise<void> => transactionsService.withdraw(req, res);
const transfer = (req: Request, res: Response): Promise<void> => transactionsService.transfer(req, res);
const listTransactions = (req: Request, res: Response): Promise<void> => transactionsService.listTransactions(req, res);
const getTransactionById = (req: Request, res: Response): Promise<void> => transactionsService.getTransactionById(req, res);

export { deposit, withdraw, transfer, listTransactions, getTransactionById };
