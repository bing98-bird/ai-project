# Gamuda AI: Project Intelligence Assistant

A professional, multi-agent AI assistant built for **Gamuda Berhad** to analyze construction documents (PDFs, spreadsheets) and provide intelligent answers with precise source citations.

---

## 🏗️ Architecture
- **LLM:** Gemini 2.5 Flash
- **RAG Engine:** MongoDB Atlas Vector Search
- **Backend:** FastAPI (Python)
- **Frontend:** React + Vite + Material UI
- **Database:** Local PostgreSQL (File & Session Metadata)

---

## 🚀 Quick Start Guide

Follow these steps to get the environment running on your local machine.

### 1. Prerequisites
Ensure you have the following installed:
- **Python 3.10+**
- **Node.js (LTS)**
- **PostgreSQL** (Local instance)
- **MongoDB Atlas** account (for Vector Search)

### 2. Backend Setup
1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```
2. **Create and activate a virtual environment:**
   ```bash
   python -m venv .venv
   # Windows:
   .\.venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure Environment Variables:**
   - Copy `.env.template` to a new file named `.env`.
   - Add your `GEMINI_API_KEY`, `MONGODB_ATLAS_CLUSTER_URI`, and local PostgreSQL credentials.

### 3. Frontend Setup
1. **Navigate to the frontend folder:**
   ```bash
   cd ../frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```

---

## 🏃 Running the Application

You will need two terminal windows open simultaneously:

### Terminal 1: Backend
```bash
# Inside the /backend directory with .venv active
python main.py
```
*The API will start at `http://localhost:8000`.*

### Terminal 2: Frontend
```bash
# Inside the /frontend directory
npm run dev
```
*The UI will start at `http://localhost:5173`.*

---

## 🔍 Key Features to Test
1. **Document Upload:** Use the sidebar to upload a construction PDF.
2. **Intelligent Query:** Ask questions like "What are the project risks in this document?"
3. **Source Citations:** Click the green chips in the chat bubbles to see the exact page/context the AI used.

---

## 📘 Documentation
For a deeper dive into the system logic, RAG implementation, and MongoDB setup, please refer to:
- [learningModule.md](learningModule.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
