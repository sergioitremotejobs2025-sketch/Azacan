# Frontend Dockerfile for Next.js
FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY my-next-app/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the frontend code
COPY my-next-app/ .

# Build the Next.js application
RUN npm run build

EXPOSE 3000

# Start the Next.js application in production mode
CMD ["npm", "run", "start"]
