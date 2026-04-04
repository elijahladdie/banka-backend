import type { Request, Response } from "express";
import { statsService } from "../services/stats.service";

const overview = (req: Request, res: Response): Promise<void> => statsService.overview(req, res);
const transactionsSeries = (req: Request, res: Response): Promise<void> => statsService.transactionsSeries(req, res);
const accountsSeries = (req: Request, res: Response): Promise<void> => statsService.accountsSeries(req, res);
const usersSeries = (req: Request, res: Response): Promise<void> => statsService.usersSeries(req, res);

export { overview, transactionsSeries, accountsSeries, usersSeries };
