FROM node:18-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/src/database/schema.sql ./dist/database/schema.sql

RUN mkdir -p /app/database
RUN mkdir -p /app/uploads/avatars

EXPOSE 3000

CMD ["node", "dist/server.js"]
