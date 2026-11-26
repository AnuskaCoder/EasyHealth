FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY database/ ./database/
COPY src/ ./src/
EXPOSE 5000
USER node
CMD ["sh", "-c", "node src/database/migrate.js && exec node src/server.js"]
