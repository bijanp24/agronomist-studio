FROM node:24-slim

WORKDIR /usr/src/app

# Copy root package.json and workspace package.json files first
COPY package.json package-lock.json ./
COPY AgronomistStudio/package.json ./AgronomistStudio/
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Install dependencies (workspaces-aware)
RUN npm clean-install

# Copy the rest of the application source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev:api", "--workspace=server"]
