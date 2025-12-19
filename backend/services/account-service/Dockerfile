FROM node:20-alpine

WORKDIR /workspace

# Copy and build shared package first
COPY shared shared/
WORKDIR /workspace/shared
RUN npm install
RUN npm run build

# Now build account service
WORKDIR /workspace/services/account-service
COPY services/account-service/package*.json ./

# Install dependencies (this will use file:../../shared)
RUN npm install

# Copy source code
COPY services/account-service/src ./src
COPY services/account-service/tsconfig.json ./
COPY services/account-service/jest.config.js ./

# Build the service
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
