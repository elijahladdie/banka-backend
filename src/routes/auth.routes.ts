import { Router } from "express";
import { register, login, logout, forgotPassword, resetPassword, changePassword, me } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncWrapper } from "../utils/asyncWrapper";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  changePasswordSchema
} from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), asyncWrapper(register));
router.post("/login", validate(loginSchema), asyncWrapper(login));
router.post("/logout", authenticate, asyncWrapper(logout));
router.post("/forgot-password", validate(forgotPasswordSchema), asyncWrapper(forgotPassword));
router.post("/reset-password", validate(resetPasswordSchema), asyncWrapper(resetPassword));
router.post("/change-password", authenticate, validate(changePasswordSchema), asyncWrapper(changePassword));
router.get("/me", authenticate, asyncWrapper(me));

export default router;
