# syntax=docker/dockerfile:1
FROM node:26-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache g++ make py3-pip openssl

COPY package*.json ./
# This stage installs production dependencies only, then builds below — so any
# package needed at BUILD time (TypeScript, Nx, Angular tooling, and @types
# packages whose declarations the code references, e.g. @types/multer for the
# Express.Multer global namespace) must stay in "dependencies" in package.json.
RUN npm install --omit=dev --ignore-scripts
RUN npm_config_build_from_source=true npm rebuild bcrypt
RUN npm_config_build_from_source=true npm rebuild better-sqlite3

COPY . .

# prisma generate requires DATABASE_URL to be resolvable via prisma.config.ts,
# but the build stage never connects to a database, so a placeholder is sufficient.
ENV DATABASE_URL="mysql://scholarsome:scholarsome@localhost:3306/scholarsome"

RUN npm run generate
# Build the deploy artifact with the API's production configuration (minified
# bundle, extracted licenses): npm forwards the flag to `nx run-many`, and the
# API's webpack config picks it up via NX_TASK_TARGET_CONFIGURATION. The
# front-end already defaults to its production configuration, and the docs
# build is production-only.
RUN npm run build -- --configuration=production

FROM node:26-alpine

WORKDIR /usr/src/app

# libcap provides setcap below: it lets the node binary keep the ability to bind
# privileged ports even though the application runs as the non-root "node" user
# (HTTP_PORT is commonly set to 80, and SSL mode binds 8443). su-exec is used by
# the entrypoint to drop privileges after fixing /data ownership.
RUN apk add --no-cache openssl libcap su-exec \
    && setcap "cap_net_bind_service=+ep" /usr/local/bin/node

# Runtime needs: the full dist tree (the API serves the front-end, handbook and
# sitemaps out of it), node_modules, package.json for the npm run scripts, and
# the prisma schema/migrations for `prisma migrate deploy` on boot.
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --chown=node:node package.json prisma.config.ts ./
COPY --chown=node:node prisma ./prisma

# /data holds user media and is pre-created here so that Docker initializes
# fresh named volumes with the right ownership. Ownership of existing volumes
# (including root-owned ones left behind by the previous root-based image) is
# fixed automatically by the entrypoint at startup.
RUN mkdir -p /data

COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# The container boots as root only so the entrypoint can fix /data ownership,
# then drops to the unprivileged "node" user via su-exec — the same bootstrap
# pattern as the official postgres and redis images. Running the container as
# a non-root user (e.g. compose `user: "1000:1000"`) skips the bootstrap.
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -q --spider "http://127.0.0.1:${HTTP_PORT:-80}/" || exit 1

ENTRYPOINT [ "/usr/local/bin/docker-entrypoint.sh" ]
CMD [ "npm", "run", "serve:node" ]
