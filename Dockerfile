FROM node:24.22.1
WORKDIR /app
COPY package.json .
RUN npm install
RUN npm i -g serve
COPY dist dist
RUN npm run build
EXPOSE 3000
CMD [ "serve", "-s", "dist" ]