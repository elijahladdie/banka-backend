FROM node:22-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

FROM base AS deps
COPY package.json yarn.lock ./
COPY src/prisma ./src/prisma
RUN yarn install --frozen-lockfile --ignore-scripts

FROM base AS build
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn prisma:generate
RUN yarn build

FROM base AS runtime
ENV NODE_ENV=production
COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src/prisma ./src/prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/locales ./locales
EXPOSE 5000
CMD ["node", "dist/index.js"]
