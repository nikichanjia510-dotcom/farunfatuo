ARG NODE_IMAGE=public.ecr.aws/docker/library/node:24-slim
FROM ${NODE_IMAGE} AS build

WORKDIR /app
ARG NPM_REGISTRY=https://registry.npmmirror.com
RUN npm install --global pnpm@11.16.0 --registry=${NPM_REGISTRY}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm config set registry ${NPM_REGISTRY} \
  && pnpm install --frozen-lockfile

COPY apps ./apps
COPY content ./content
COPY playwright.config.ts ./playwright.config.ts
RUN pnpm build

FROM ${NODE_IMAGE} AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/app/data/tuobao.sqlite

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY --from=build /app/content ./content

RUN mkdir -p /app/data
WORKDIR /app/apps/api
EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
