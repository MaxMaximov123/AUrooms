# Use Node.js 18 LTS
FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

RUN npm ci --production

# Копируем остальной код
COPY . .

# Собираем фронтенд (если нужно)
# RUN npm run build --prefix ../frontend

EXPOSE 8000

CMD ["node", "app.js"]