FROM node:10
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 7070
CMD [ "node", "shcp.js" ]
