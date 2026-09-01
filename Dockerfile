FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# 使用 lockfile 精确安装（npm ci），避免无锁文件解析触发 npm edgesOut 报错
RUN npm ci --registry=https://registry.npmmirror.com
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=build /app/node_modules/tsx ./node_modules/tsx
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]
