# 1. Use a lightweight Python base
FROM python:3.12-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy only the requirements first (optimizes Docker caching)
# We will create this file in the next step
COPY requirements.txt .

# 4. Install dependencies including the WebSocket support we just fixed
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of your backend code
COPY . .

# 6. Expose the port FastAPI runs on
EXPOSE 8000

# 7. Start the server using the standard uvicorn worker for WebSockets
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

