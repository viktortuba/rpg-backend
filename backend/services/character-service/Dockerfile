FROM node:20-alpine

WORKDIR /workspace

# Copy and build shared package first
COPY shared shared/
WORKDIR /workspace/shared
RUN npm install
RUN npm run build

# Now build character service
WORKDIR /workspace/services/character-service
COPY services/character-service/package*.json ./

# Install dependencies (this will use file:../../shared)
RUN npm install

# Copy source code
COPY services/character-service/src ./src
COPY services/character-service/tsconfig.json ./
COPY services/character-service/jest.config.js ./

# Build the service
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
