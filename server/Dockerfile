FROM node:22-alpine
WORKDIR /usr/src/app
COPY . .
RUN npm install --omit=dev
CMD ["node", "./index.js"]
