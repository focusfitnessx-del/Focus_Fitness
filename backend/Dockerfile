FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
# Install all deps so prisma CLI is available for generate, then prune dev deps
RUN npm install

COPY . .

RUN npx prisma generate --schema=prisma/schema.prisma && npm prune --omit=dev

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node prisma/seed.js && node src/app.js"]
