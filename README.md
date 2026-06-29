# SEAPEDIA - Marketplace Application

SEAPEDIA is a full-stack e-commerce platform that connects sellers, buyers, and delivery drivers in a single integrated marketplace. 

## 🚀 Deployment Links & Access
* **Frontend Application:** `[Insert Vercel/Netlify Link Here]`
* **Backend API URL:** `[Insert Render/Railway Link Here]`
* **API Documentation (Swagger/Postman):** `[Insert Link Here]`

## ⚙️ Universal Deployment (Works on Any Machine)
This project is containerized using Docker to ensure it runs seamlessly on any device.

**Prerequisites:** Docker and Docker Compose installed.

1. Clone the repository: `git clone <your-repo-url>`
2. Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL="postgresql://user:password@db:5432/seapedia"
   JWT_SECRET="your_super_secret_key"
