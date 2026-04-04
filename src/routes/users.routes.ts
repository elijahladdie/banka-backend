import { Router } from "express";
import { listUsers, createUser, getUserById, updateUser, updateUserStatus, softDeleteUser } from "../controllers/users.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncWrapper } from "../utils/asyncWrapper";
import {
  createUserSchema,
  idParamSchema,
  updateUserSchema,
  updateUserStatusSchema,
  usersListSchema
} from "../validators/user.validator";

const router = Router();

router.use(authenticate, requireRole("client", "cashier", "manager"));

router.get("/", validate(usersListSchema), asyncWrapper(listUsers));
router.post("/", requireRole("manager"), validate(createUserSchema), asyncWrapper(createUser));
router.get("/:id", validate(idParamSchema), asyncWrapper(getUserById));
router.patch("/:id", validate(updateUserSchema), asyncWrapper(updateUser));
router.patch("/:id/status", validate(updateUserStatusSchema), asyncWrapper(updateUserStatus));
router.delete("/:id", validate(idParamSchema), asyncWrapper(softDeleteUser));

export default router;
