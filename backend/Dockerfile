FROM node:22-alpine

# Install build dependencies required for sqlite3
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Rebuild sqlite3 from source for this platform
RUN npm rebuild sqlite3 --build-from-source

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]

