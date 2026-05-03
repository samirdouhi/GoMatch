FROM python:3.12-slim

WORKDIR /app

# Dépendances système minimales
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Installer dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

EXPOSE 8000

# Uvicorn — liaison 0.0.0.0 obligatoire pour Docker
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
