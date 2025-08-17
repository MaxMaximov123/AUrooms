# AUrooms — Музыкальные комнаты

AUrooms — это веб-приложение для совместного прослушивания музыки в реальном времени. Пользователи могут создавать комнаты, приглашать друзей, добавлять треки в очередь и слушать музыку синхронно. Поддерживается интеграция с Telegram и Яндекс.Музыкой.

---

## Структура проекта

```
AUrooms/
│
├── backend/      # Серверная часть (Node.js, Express, WebSocket, PostgreSQL)
├── bot/          # Telegram-бот (Python)
├── frontend/     # Веб-клиент (Vue.js + Quasar)
├── docker-compose.yml
├── .env
└── README.md
```

---

## Быстрый старт

### 1. Клонирование репозитория

```sh
git clone https://github.com/MaxMaximov123/AUrooms.git
cd AUrooms
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта и заполните его по примеру:

```
DATABASE_URL=postgres://postgres:postgres@db:5432/music_app
TELEGRAM_BOT_TOKEN=ваш_токен_бота
YANDEX_MUSIC_API_TOKEN=ваш_токен_яндекс_музыки
YANDEX_MUSIC_UID=ваш_uid
```

### 3. Запуск через Docker Compose

```sh
docker-compose up --build
```

Это поднимет backend, frontend, базу данных и Telegram-бота.

---

## Компоненты

### Backend (`backend/`)

- Node.js + Express
- WebSocket сервер для синхронизации музыки
- PostgreSQL (через Knex.js)
- REST API для управления комнатами и треками

#### Основные команды

```sh
cd backend
npm install
npm start  # Запуск проекта
```

### Frontend (`frontend/`)

- Vue.js + Quasar Framework
- Поддержка мобильных и десктопных браузеров
- Веб-клиент для управления комнатой и очередью треков

#### Основные команды

```sh
cd frontend
npm install
quasar dev        # Запуск в режиме разработки
quasar build      # Сборка для продакшена
```

### Telegram Bot (`bot/`)

- Python 3
- aiogram для работы с Telegram API
- Позволяет управлять комнатами через Telegram

#### Основные команды

```sh
cd bot
pip install -r requirements.txt
python main.py
```

---

## Основные возможности

- Создание и присоединение к комнатам по коду
- Добавление треков из Яндекс.Музыки и других источников
- Синхронное воспроизведение музыки для всех участников комнаты
- Отображение списка пользователей комнаты (веб и Telegram)
- Интеграция с Telegram-ботом
- Поддержка Docker для быстрого деплоя

---

## API

### REST API

- `POST /api/rooms` — создать комнату
- `GET /api/rooms/:code` — получить информацию о комнате
- `GET /api/tracks/:room_id` — получить очередь треков
- `POST /api/tracks` — добавить трек в комнату

### WebSocket

- События для синхронизации воспроизведения, очереди, пользователей

---

## Миграции базы данных

Миграции находятся в [`backend/db/migrations/`](backend/db/migrations/). Для применения используйте:

```sh
cd backend
knex migrate:latest
```

---

## Разработка и деплой

- Для локальной разработки используйте отдельные терминалы для backend, frontend и bot.
- Для продакшена рекомендуется использовать Docker Compose.

---

## Лицензия

MIT

---

## Контакты

- Telegram: [@kotik594](https://t.me/kotik594)