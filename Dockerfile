FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend files
COPY . .

# Build and install client dependencies
WORKDIR /app/client
RUN npm install
RUN npm run build

# Go back to root and expose port
WORKDIR /app
EXPOSE 8000

# Run the backend server which also serves the client build
CMD ["npx", "tsx", "server.ts"]
