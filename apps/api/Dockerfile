# Multi-stage Dockerfile for @contractor-os/api production image.
#
# Stage 1 builds the workspace and prunes dev dependencies; stage 2 ships
# only the runtime artefacts on a slim node image. The result is what the
# Trivy container-scan job in CI scans for HIGH/CRITICAL CVEs.

FROM node:22-alpine AS builder
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# Workspace metadata first so dependency install layers cache cleanly.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Source for the two packages the api depends on at build time.
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

RUN pnpm --filter @contractor-os/shared build \
  && pnpm --filter @contractor-os/api build \
  && pnpm --filter @contractor-os/api --prod deploy /out

# ---

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Drop the default `node` user privileges. The image still needs to read
# the bundled migrations on startup so we set the ownership at copy time.
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /out ./
USER app

CMD ["node", "dist/main.js"]
