import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BANKA API",
      version: "1.0.0"
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "Manager protected user endpoints" },
      { name: "Accounts", description: "Bank account endpoints" },
      { name: "Transactions", description: "Transaction endpoints" },
      { name: "Stats", description: "Manager statistics endpoints" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation successful" },
            data: { type: "object" },
            pagination: {
              type: "object",
              nullable: true,
              properties: {
                page: { type: "integer", example: 1 },
                limit: { type: "integer", example: 10 },
                total: { type: "integer", example: 100 },
                totalPages: { type: "integer", example: 10 },
                hasNext: { type: "boolean", example: true },
                hasPrev: { type: "boolean", example: false }
              }
            }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string", example: "email" },
                  message: { type: "string", example: "Email already exists" }
                }
              }
            }
          }
        },
        AuthRegisterRequest: {
          type: "object",
          required: ["firstName", "email", "nationalId", "password", "age"],
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            phoneNumber: { type: "string" },
            nationalId: { type: "string" },
            password: { type: "string" },
            age: { type: "integer" },
            profilePicture: { type: "string" }
          }
        },
        AuthLoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string" },
            password: { type: "string" }
          }
        },
        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string" }
          }
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["token", "newPassword"],
          properties: {
            token: { type: "string" },
            newPassword: { type: "string" }
          }
        },
        CreateUserRequest: {
          type: "object",
          required: ["firstName", "email", "nationalId", "password", "age", "roleSlug"],
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            phoneNumber: { type: "string" },
            nationalId: { type: "string" },
            password: { type: "string" },
            age: { type: "integer" },
            roleSlug: { type: "string", enum: ["client", "cashier", "manager"] },
            profilePicture: { type: "string" }
          }
        },
        UpdateUserRequest: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            phoneNumber: { type: "string" },
            profilePicture: { type: "string" },
            age: { type: "integer" }
          }
        },
        UpdateUserStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["active", "inactive", "suspended", "pending_approval"] }
          }
        },
        CreateAccountRequest: {
          type: "object",
          required: ["type"],
          properties: {
            ownerId: { type: "string" },
            type: { type: "string", enum: ["saving", "fixed"] }
          }
        },
        AccountStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["Active", "Inactive", "Dormant"] },
            reason: { type: "string" }
          }
        },
        AccountDecisionRequest: {
          type: "object",
          properties: {
            reason: { type: "string" }
          }
        },
        DepositRequest: {
          type: "object",
          required: ["toAccount", "amount", "description"],
          properties: {
            toAccount: { type: "string" },
            amount: { type: "number", minimum: 100 },
            description: { type: "string" }
          }
        },
        WithdrawRequest: {
          type: "object",
          required: ["fromAccount", "amount", "description"],
          properties: {
            fromAccount: { type: "string" },
            amount: { type: "number", minimum: 100 },
            description: { type: "string" }
          }
        },
        TransferRequest: {
          type: "object",
          required: ["fromAccount", "toAccount", "amount", "description"],
          properties: {
            fromAccount: { type: "string" },
            toAccount: { type: "string" },
            amount: { type: "number", minimum: 100 },
            description: { type: "string" }
          }
        }
      }
    },
    paths: {
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Client self-registration",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthRegisterRequest" }
              }
            }
          },
          responses: {
            "200": { description: "Registered", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
            "409": { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
          }
        }
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login and set JWT httpOnly cookie",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthLoginRequest" }
              }
            }
          },
          responses: {
            "200": { description: "Logged in", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
            "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
          }
        }
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout and blacklist token",
          responses: {
            "200": { description: "Logged out", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Send reset email",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ForgotPasswordRequest" }
              }
            }
          },
          responses: {
            "200": { description: "Reset flow started", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Validate token and reset password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ResetPasswordRequest" }
              }
            }
          },
          responses: {
            "200": { description: "Password reset", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
            "400": { description: "Invalid token", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
          }
        }
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user",
          responses: {
            "200": { description: "Current user", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
            "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
          }
        }
      },
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "List users",
          parameters: [
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
            { in: "query", name: "search", schema: { type: "string" } },
            { in: "query", name: "role", schema: { type: "string" } },
            { in: "query", name: "status", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Users list", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        },
        post: {
          tags: ["Users"],
          summary: "Create user",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateUserRequest" } } }
          },
          responses: {
            "200": { description: "User created", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Get user detail",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "User detail", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        },
        patch: {
          tags: ["Users"],
          summary: "Update user",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUserRequest" } } }
          },
          responses: {
            "200": { description: "User updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        },
        delete: {
          tags: ["Users"],
          summary: "Soft delete user",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "User soft deleted", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/users/{id}/status": {
        patch: {
          tags: ["Users"],
          summary: "Update user status",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUserStatusRequest" } } }
          },
          responses: {
            "200": { description: "Status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/accounts": {
        post: {
          tags: ["Accounts"],
          summary: "Create account request",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateAccountRequest" } } }
          },
          responses: {
            "200": { description: "Account request created", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        },
        get: {
          tags: ["Accounts"],
          summary: "List accounts",
          parameters: [
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
            { in: "query", name: "status", schema: { type: "string" } },
            { in: "query", name: "type", schema: { type: "string" } },
            { in: "query", name: "ownerId", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Accounts list", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/accounts/{id}": {
        get: {
          tags: ["Accounts"],
          summary: "Account detail",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Account detail", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/accounts/{id}/approve": {
        patch: {
          tags: ["Accounts"],
          summary: "Approve account",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: false,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AccountDecisionRequest" } } }
          },
          responses: {
            "200": { description: "Account approved", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/accounts/{id}/reject": {
        patch: {
          tags: ["Accounts"],
          summary: "Reject account",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: false,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AccountDecisionRequest" } } }
          },
          responses: {
            "200": { description: "Account rejected", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/accounts/{id}/status": {
        patch: {
          tags: ["Accounts"],
          summary: "Update account status",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AccountStatusRequest" } } }
          },
          responses: {
            "200": { description: "Account status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/transactions/deposit": {
        post: {
          tags: ["Transactions"],
          summary: "Deposit to account",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/DepositRequest" } } }
          },
          responses: {
            "200": { description: "Deposit completed", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/transactions/withdraw": {
        post: {
          tags: ["Transactions"],
          summary: "Withdraw from account",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/WithdrawRequest" } } }
          },
          responses: {
            "200": { description: "Withdrawal completed", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/transactions/transfer": {
        post: {
          tags: ["Transactions"],
          summary: "Transfer between own accounts",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/TransferRequest" } } }
          },
          responses: {
            "200": { description: "Transfer completed", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/transactions": {
        get: {
          tags: ["Transactions"],
          summary: "List transactions",
          parameters: [
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
            { in: "query", name: "type", schema: { type: "string" } },
            { in: "query", name: "status", schema: { type: "string" } },
            { in: "query", name: "fromDate", schema: { type: "string" } },
            { in: "query", name: "toDate", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Transactions list", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/transactions/{id}": {
        get: {
          tags: ["Transactions"],
          summary: "Transaction detail",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Transaction detail", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/stats/overview": {
        get: {
          tags: ["Stats"],
          summary: "Overview KPIs",
          responses: {
            "200": { description: "Overview data", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/stats/transactions": {
        get: {
          tags: ["Stats"],
          summary: "Transaction time-series",
          parameters: [
            { in: "query", name: "fromDate", schema: { type: "string" } },
            { in: "query", name: "toDate", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Transaction stats", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/stats/accounts": {
        get: {
          tags: ["Stats"],
          summary: "Accounts time-series",
          parameters: [
            { in: "query", name: "fromDate", schema: { type: "string" } },
            { in: "query", name: "toDate", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Account stats", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      },
      "/api/stats/users": {
        get: {
          tags: ["Stats"],
          summary: "User registration time-series",
          parameters: [
            { in: "query", name: "fromDate", schema: { type: "string" } },
            { in: "query", name: "toDate", schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "User stats", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    servers: [{ url: "http://localhost:5000" }]
  },
  apis: []
});
