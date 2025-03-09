# # Comments are provided throughout this file to help you get started.
# # If you need more help, visit the Dockerfile reference guide at
# # https://docs.docker.com/go/dockerfile-reference/

FROM node:20.10.0-alpine

WORKDIR /app

COPY /react-project/ ./

COPY /react-project/package*.json ./

RUN npm install

CMD [ "npm", "run", "host"]