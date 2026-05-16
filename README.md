# EduVerse AI: The Future of Adaptive Learning
**An AI-Powered Multi-Tenant Learning Management System (LMS)**

EduVerse AI is an innovative AI powered multi tenant educational platform that uses Large Language Models and Retrieval Augmented Generation to create personalized learning experiences for students. The system dynamically adjusts educational content, quiz difficulty, and learning recommendations based on student performance and interaction.

---

## Key Features
- **Adaptive AI Lessons:** Dynamically generates lessons based on student learning pace (Slow, Average, Fast).
- **Dynamic Quiz Generation:** Automatically creates MCQs from course content using Llama 3.2, Phi 3.5 and Qwen 2.5.
- **AI-Tutor Chat:** A 24/7 RAG-powered (Retrieval-Augmented Generation) assistant for student queries.
- **Gamification:** Global leaderboard and XP points to boost engagement.
- **Premium Subscriptions:** Fully integrated with Stripe for secure multi-tenant billing.
- **Multi-Tenant Architecture:** Scalable support for multiple organizations/schools on one platform.

---

## Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Angular 19, RxJS, Tailwind CSS |
| **Backend** | FastAPI (Python), Uvicorn, Pydantic |
| **Database** | MongoDB Atlas (NoSQL), ChromaDB (Vector DB) |
| **AI/LLM** | Ollama (Local Llama 3.2 / Phi 3.5/Qwen 2.5)|
| **Payments** | Stripe API |

---

## Project Structure
```text
FYP/
├── EduVerse-AI/                # Frontend (Angular 19)
└── EduVerse-AI-main-backend/   # Backend (FastAPI)
```

---

## Installation & Setup

### 1. Prerequisites
- Python 3.11+
- Node.js v18+
- Ollama (running locally with `llama3.2`,`phi3.5` and `qwen2.5` models pulled)

### 2. Backend Setup
```bash
cd EduVerse-AI-main-backend
python -m venv venv
.\venv\Scripts\activate  # On Linux use: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd EduVerse-AI
npm install
ng serve -o
```

### 4. Stripe Webhook (Optional for testing payments)
```bash
stripe listen --forward-to localhost:8000/payments/webhook
```

---

## Environment Variables

Create a `.env` file in the backend directory and configure:

MONGODB_URL=
GEMINI_API_KEY=
JWT_SECRET=
STRIPE_SECRET_KEY=
CHROMA_DB_PATH=

## Development Notes
- Developed for the Final Year Project (FYP) 2024-2026.
- UI built with a focus on modern aesthetics and accessibility.
- Backend uses asynchronous processing for high-concurrency LLM calls.
