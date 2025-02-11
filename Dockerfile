FROM node:22-alpine AS base
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./

FROM base AS build
COPY . .
RUN corepack enable \
  && yarn workspaces focus --all \
  && yarn build

FROM base AS prod-dependencies
RUN corepack enable \
  && yarn workspaces focus --all --production

FROM base AS production
COPY --chown=node:node package.json .
COPY --chown=node:node --from=prod-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node ./indexes ./indexes

USER node
ENTRYPOINT ["node", "dist/index.js"]
