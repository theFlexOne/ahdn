FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json index.ts ./
RUN npm run build

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 8080

CMD ["node", "dist/index.js"]
