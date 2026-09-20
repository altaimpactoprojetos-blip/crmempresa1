FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
# As migrações são aplicadas a cada início (só as novas) e depois o servidor sobe.
CMD ["sh", "-c", "npm run migrate && node src/server.js"]
