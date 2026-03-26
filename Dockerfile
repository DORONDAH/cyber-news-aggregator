# Stage 1: Build Frontend
FROM node:20-slim AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build Backend and Final Image
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY api/ ./api/

# Copy built frontend from Stage 1
COPY --from=frontend-build /app/dist ./dist

# Set Environment Variables
ENV PORT=8000
ENV HOST=0.0.0.0
ENV VERCEL=false

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000"]
