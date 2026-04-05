import { describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  router: {
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  },
  authenticate: { name: "authenticate" },
  requireRole: vi.fn((...roles: string[]) => ({ type: "requireRole", roles })),
  listUsers: { name: "listUsers" },
  createUser: { name: "createUser" },
  getUserById: { name: "getUserById" },
  updateUser: { name: "updateUser" },
  updateUserStatus: { name: "updateUserStatus" },
  softDeleteUser: { name: "softDeleteUser" },
  usersListSchema: { name: "usersListSchema" },
  createUserSchema: { name: "createUserSchema" },
  idParamSchema: { name: "idParamSchema" },
  updateUserSchema: { name: "updateUserSchema" },
  updateUserStatusSchema: { name: "updateUserStatusSchema" },
  validate: vi.fn((schema: unknown) => ({ type: "validate", schema })),
  asyncWrapper: vi.fn((handler: unknown) => ({ type: "wrapped", handler }))
}));

vi.mock("express", () => ({
  Router: vi.fn(() => mocked.router)
}));

vi.mock("../../../src/controllers/users.controller", () => ({
  listUsers: mocked.listUsers,
  createUser: mocked.createUser,
  getUserById: mocked.getUserById,
  updateUser: mocked.updateUser,
  updateUserStatus: mocked.updateUserStatus,
  softDeleteUser: mocked.softDeleteUser
}));

vi.mock("../../../src/middleware/auth", () => ({
  authenticate: mocked.authenticate,
  requireRole: mocked.requireRole
}));

vi.mock("../../../src/middleware/validate", () => ({
  validate: mocked.validate
}));

vi.mock("../../../src/utils/asyncWrapper", () => ({
  asyncWrapper: mocked.asyncWrapper
}));

vi.mock("../../../src/validators/user.validator", () => ({
  usersListSchema: mocked.usersListSchema,
  createUserSchema: mocked.createUserSchema,
  idParamSchema: mocked.idParamSchema,
  updateUserSchema: mocked.updateUserSchema,
  updateUserStatusSchema: mocked.updateUserStatusSchema
}));

describe("routes/users", () => {
  it("registers parent auth/role gate and all child routes with route-specific conditions", async () => {
    const { default: router } = await import("../../../src/routes/users.routes");

    expect(router).toBe(mocked.router);

    expect(mocked.requireRole).toHaveBeenCalledTimes(2);
    expect(mocked.requireRole).toHaveBeenNthCalledWith(1, "client", "cashier", "manager");
    expect(mocked.requireRole).toHaveBeenNthCalledWith(2, "manager");

    expect(mocked.router.use).toHaveBeenCalledTimes(1);
    expect(mocked.router.use).toHaveBeenCalledWith(mocked.authenticate, {
      type: "requireRole",
      roles: ["client", "cashier", "manager"]
    });

    expect(mocked.validate).toHaveBeenCalledTimes(6);
    expect(mocked.validate).toHaveBeenNthCalledWith(1, mocked.usersListSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(2, mocked.createUserSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(3, mocked.idParamSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(4, mocked.updateUserSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(5, mocked.updateUserStatusSchema);
    expect(mocked.validate).toHaveBeenNthCalledWith(6, mocked.idParamSchema);

    expect(mocked.asyncWrapper).toHaveBeenCalledTimes(6);

    expect(mocked.router.get).toHaveBeenNthCalledWith(
      1,
      "/",
      {
        type: "validate",
        schema: mocked.usersListSchema
      },
      {
        type: "wrapped",
        handler: mocked.listUsers
      }
    );
    expect(mocked.router.post).toHaveBeenNthCalledWith(
      1,
      "/",
      {
        type: "requireRole",
        roles: ["manager"]
      },
      {
        type: "validate",
        schema: mocked.createUserSchema
      },
      {
        type: "wrapped",
        handler: mocked.createUser
      }
    );
    expect(mocked.router.get).toHaveBeenNthCalledWith(
      2,
      "/:id",
      {
        type: "validate",
        schema: mocked.idParamSchema
      },
      {
        type: "wrapped",
        handler: mocked.getUserById
      }
    );
    expect(mocked.router.patch).toHaveBeenNthCalledWith(
      1,
      "/:id",
      {
        type: "validate",
        schema: mocked.updateUserSchema
      },
      {
        type: "wrapped",
        handler: mocked.updateUser
      }
    );
    expect(mocked.router.patch).toHaveBeenNthCalledWith(
      2,
      "/:id/status",
      {
        type: "validate",
        schema: mocked.updateUserStatusSchema
      },
      {
        type: "wrapped",
        handler: mocked.updateUserStatus
      }
    );
    expect(mocked.router.delete).toHaveBeenNthCalledWith(
      1,
      "/:id",
      {
        type: "validate",
        schema: mocked.idParamSchema
      },
      {
        type: "wrapped",
        handler: mocked.softDeleteUser
      }
    );
  });
});
