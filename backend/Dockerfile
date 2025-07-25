FROM node:latest

COPY backend/package.json backend/package-lock.json ./
RUN npm install

COPY ./ ./

WORKDIR "/backend"

CMD ["npm", "run", "start"]