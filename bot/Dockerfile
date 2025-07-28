FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Если bot/ — корень, и main.py лежит внутри, запускаем напрямую
#ENV PYTHONPATH=/app
CMD ["python", "-m", "main"]