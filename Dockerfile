# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

# Copy package.json and package-lock.json to the container
COPY package.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn

COPY . .

# Build the application
RUN yarn build


# Expose the application port (3000 is the default port for a NestJS app)
EXPOSE 3000

# Start the application
CMD ["yarn", "start:prod"]
