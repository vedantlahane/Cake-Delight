# Dockerfile for the Gateway service
FROM node:22-alpine
# Set working directory
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "src/index.js"]
