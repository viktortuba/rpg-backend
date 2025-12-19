FROM node:20-alpine

WORKDIR /workspace

# Copy and build shared package first
COPY shared shared/
WORKDIR /workspace/shared
RUN npm install
RUN npm run build

# Now build combat service
WORKDIR /workspace/services/combat-service
COPY services/combat-service/package*.json ./

# Install dependencies (this will use file:../../shared)
RUN npm install

# Copy source code
COPY services/combat-service/src ./src
COPY services/combat-service/tsconfig.json ./

# Build the service
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
