FROM python:3.12-slim

# ffmpeg is required by pydub for the webm -> wav conversion
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first so this layer is cached unless requirements change
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Then copy the application code
COPY app ./app

# Render sets $PORT; bind uvicorn to it (falls back to 8000 locally)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
