# Base image
FROM public.ecr.aws/docker/library/node:22-alpine

# Use apk for Alpine Linux to install qpdf
RUN apk add --no-cache qpdf

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

#COPY .env ./

# Ensure that the .env file has the correct permissions
#RUN chmod 644 /usr/src/app/.env

# Creates a "dist" folder with the production build
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3000

# Start the server using the production build
CMD ["npm", "run", "start:prod"]
