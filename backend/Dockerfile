# Dockerfile for backend deployment
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements-pinecone.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements-pinecone.txt

# Copy application code
COPY . .

# Expose port (Cloud Run uses PORT environment variable, defaults to 8080)
EXPOSE 8080

# Run the application
# Use PORT environment variable from Cloud Run, or default to 8080
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}

