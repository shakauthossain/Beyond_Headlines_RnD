FROM node:20-alpine

# Install system dependencies for Prisma/Alpha
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies with retries for stability
COPY package*.json ./
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm install

# Copy source and schema
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

# Generate Prisma Client
RUN npx prisma generate

# Build (optional but good for production)
# RUN npm run build

CMD ["npm", "start"]
