#!/bin/sh
set -e

echo "🎯 TypeScript type check..."
yarn typecheck

echo "🔍 ESLint check..."
yarn lint

echo "🧼 Prettier check..."
yarn format:check

echo "🧪 Running tests..."
yarn test

echo "✅ All checks complete!"
