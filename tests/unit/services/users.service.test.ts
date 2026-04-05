import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    role: {
      findUnique: vi.fn()
    }
  },
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  cacheDelByPrefix: vi.fn(),
  paginationMeta: vi.fn(() => ({ page: 1 })),
  parsePagination: vi.fn(() => ({ page: 1, limit: 10, skip: 0 })),
  notificationService: {
    welcome: vi.fn(),
    profileUpdated: vi.fn(),
    userActivated: vi.fn(),
    userDeactivated: vi.fn(),
    passwordChanged: vi.fn()
  },
  buildUsersSearchCondition: vi.fn(() => ({})),
  bcrypt: {
    hash: vi.fn(),
    compare: vi.fn()
  },
  success: vi.fn(),
  error: vi.fn()
}));

vi.mock("../../../src/config/prisma", () => ({ prisma: mocked.prisma }));
vi.mock("../../../src/services/cache", () => ({
  cacheGet: mocked.cacheGet,
  cacheSet: mocked.cacheSet,
  cacheDelByPrefix: mocked.cacheDelByPrefix
}));
vi.mock("../../../src/utils/pagination", () => ({
  paginationMeta: mocked.paginationMeta,
  parsePagination: mocked.parsePagination
}));
vi.mock("../../../src/services/notification.service", () => ({
  notificationService: mocked.notificationService
}));
vi.mock("../../../src/utils/search.helper", () => ({
  buildUsersSearchCondition: mocked.buildUsersSearchCondition
}));
vi.mock("bcrypt", () => ({ default: mocked.bcrypt }));
vi.mock("../../../src/utils/response", () => ({ success: mocked.success, error: mocked.error }));

describe("users service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listUsers", () => {
    it("should return cached list when cache hit exists", async () => {
      mocked.cacheGet.mockResolvedValue([{ id: "u1" }]);
      const { usersService } = await import("../../../src/services/users.service");

      await usersService.listUsers({ query: {} } as any, {} as any);
      expect(mocked.success).toHaveBeenCalled();
      expect(mocked.prisma.user.count).not.toHaveBeenCalled();
    });
  });

  describe("createUser", () => {
    it("should reject when requester is not manager", async () => {
      const { usersService } = await import("../../../src/services/users.service");

      await usersService.createUser(
        { user: { userRoles: [{ role: { slug: "client" } }] } } as any,
        {} as any
      );

      expect(mocked.error).toHaveBeenCalledWith({}, 403, "Only managers can create user accounts");
    });
  });
});
