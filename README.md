# Banka Backend

Banka is a banking backend API built with Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, and Docker.

It supports three platform roles:

- Client: self-service banking actions
- Cashier: branch operations and transaction support
- Manager: administration, approvals, and reporting

## Features

- Authentication with JWT cookies
- Role-based authorization
- User registration and profile management
- Bank account creation, approval, and status updates
- Deposits, withdrawals, transfers, and withdrawal confirmation
- Transaction history and account search
- Notifications and password reset flow
- Statistics endpoints for managers
- Redis-backed cache and token blacklist with in-memory fallback
- Docker image build and GitHub Actions pipeline

## Requirements

- Node.js 22 or later
- Yarn 1.x
- PostgreSQL
- Redis

## Environment Variables

Create a `.env` file in the project root with the following values:

```dotenv
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/banka
DATABASE_SSL=false
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
COOKIE_NAME=banka_token
COOKIE_SECURE=false
FRONTEND_URL=http://localhost:3000
FRONTEND_URLS=
REDIS_URL=redis://localhost:6379
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@banka.local
```

Set `DATABASE_SSL=false` only when your Postgres provider does not require SSL.


## Installation

```bash
yarn install
```

## Database Setup

Run Prisma migrations and seed data:

```bash
yarn prisma:migrate
yarn prisma:seed
```

Generate the Prisma client if needed:

```bash
yarn prisma:generate
```

## Development

Start the API in development mode:

```bash
yarn dev
```

The server starts on the port defined in `PORT`, and the health endpoint is available at:

```bash
GET /health
```

## Build and Run

Build the project:

```bash
yarn build
```

Run the compiled app:

```bash
yarn start
```

## Quality Checks

Run the full local quality gate:

```bash
yarn husky
```

This runs:

- TypeScript type check
- ESLint
- Prettier check
- Vitest test suite

Other useful scripts:

```bash
yarn lint
yarn lint:fix
yarn format
yarn format:check
yarn test
yarn typecheck
```

## Docker

Build the image locally:

```bash
docker build -t banka-backend:local .
```

Run the container with your environment variables:

```bash
docker run --rm -p 5000:5000 \
  -e PORT=5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/banka \
  -e DATABASE_SSL=false \
  -e JWT_SECRET=your_jwt_secret_key \
  -e JWT_EXPIRES_IN=1d \
  -e COOKIE_NAME=banka_token \
  -e COOKIE_SECURE=false \
  -e FRONTEND_URL=http://localhost:3000 \
  -e FRONTEND_URLS= \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e SMTP_HOST=localhost \
  -e SMTP_PORT=587 \
  -e SMTP_USER=test \
  -e SMTP_PASS=test \
  -e SMTP_FROM=no-reply@banka.local \
  banka-backend:local
```

## API Documentation

Swagger documentation is exposed by the app at:

```bash
/api/docs
```

## User Roles

### Client

Clients are the regular banking users.

What they can do:

- Register their own account
- Log in and manage their session
- View and update their own profile data
- Create and view their own bank accounts
- Transfer money between accounts they control
- View their own transactions
- Confirm withdrawals when required
- Receive notifications for account and transaction events

Typical flow for a client:

1. Register through the public authentication endpoint
2. Wait for account approval if required by the business flow
3. Log in
4. Create or manage bank accounts
5. Perform transfers and review activity

### Cashier

Cashiers support banking operations at the branch level.

What they can do:

- Log in
- Deposit funds into accounts
- Withdraw funds from accounts
- Confirm withdrawal requests
- View account and transaction records
- Search accounts by account number
- Access user and account data allowed by cashier permissions

Typical flow for a cashier:

1. Log in with a cashier account
2. Search for a customer account
3. Process deposits or withdrawals
4. Confirm withdrawal transactions when required
5. Review transaction history

### Manager

Managers have the broadest access and handle approvals and reporting.

What they can do:

- Approve or reject account requests
- Change account status
- Create and manage users
- View all accounts and transactions
- Process deposits and withdrawals
- Access manager-only statistics
- Manage customer lifecycle and operational oversight

Typical flow for a manager:

1. Log in with a manager account
2. Review pending account requests
3. Approve or reject accounts
4. Monitor users, accounts, and transactions
5. View statistics for operational reporting

## Important Notes

- The API uses Redis for cache and token blacklist support.
- If Redis is unavailable, the app falls back to in-memory storage for those features.
- The API uses CORS with an environment-driven origin allowlist (`FRONTEND_URL`, optional `FRONTEND_URLS`).
- The database connection can be configured with SSL using `DATABASE_SSL=true`.

## GitHub Actions

The repository includes a workflow that:

- runs tests
- builds the Docker image
- publishes the image to Docker Hub on push to the configured branch

Make sure these secrets exist in GitHub:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## Support Endpoints

- `GET /health` for application health
- `GET /api/docs` for API documentation

## License

No license is currently defined for this repository.
