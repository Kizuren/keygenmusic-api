FROM node:20-alpine

WORKDIR /app

# Install Bun
RUN npm install -g bun

# Install system dependencies
RUN apk add --no-cache git netcat-openbsd

# Copy package files
COPY package.json ./

RUN bun install

# Copy the rest
COPY . .

EXPOSE 3000

# Start app
CMD ["bun", "start"]

