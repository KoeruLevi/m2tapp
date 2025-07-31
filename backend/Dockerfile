FROM node:20

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ .

COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install && npm run build

WORKDIR /app
RUN mv ./frontend/dist ./frontend_dist


EXPOSE 80

CMD ["node", "server.js"]