FROM node:24.22.1
WORKDIR /app
COPY package.json .
RUN npm install
RUN npm i -g serve
RUN npm run build
COPY ./dist ./dist
EXPOSE 3000
CMD [ "serve", "-s", "dist" ]