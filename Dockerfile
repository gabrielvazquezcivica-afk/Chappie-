# Use an official Node.js runtime (slim Alpine)
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package manifests first to leverage Docker cache
COPY package*.json ./

# Install only production dependencies (change NODE_ENV if you need dev deps)
ENV NODE_ENV=production
RUN npm install --production

# Copy application source
COPY . .

# Ensure files are owned by non-root user "node" and switch to it
RUN chown -R node:node /app
USER node

# Default command to start the bot (index.js as package.json main)
CMD ["npm", "start"]
