FROM python:3.11-slim

WORKDIR /app

COPY bot/ /app/bot
COPY requirements.txt .  # должен содержать aiogram, sqlalchemy и asyncpg

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "-m", "bot.main"]