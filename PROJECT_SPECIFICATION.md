# EduVerse-AI: Project Specification & Implementation Status

## 🚀 Overview
**EduVerse-AI** is a next-generation, AI-powered Multi-Tenant Learning Management System (LMS). It differentiates itself from traditional LMS platforms by using advanced machine learning (Google Gemini 2.5 Flash via LangChain) to analyze student performance and dynamically generate personalized educational content.

The platform is built as a Multi-Tenant SaaS, allowing organizations (Schools, Colleges, Companies) to host their own white-labeled learning environments while benefiting from a shared global student network.

---

## 🛠️ Technology Stack

### Frontend (Modern Angular Architecture)
- **Framework**: Angular 19 (using Standalone Components and Signals)
- **Styling**: Tailwind CSS for responsive, utility-first design
- **State & Logic**: RxJS for reactive programming
- **Visualizations**: Chart.js (ng2-charts) for performance analytics dashboards
- **Payments**: Stripe Embedded Checkout for subscription management
- **Content Rendering**: `ngx-markdown` and `marked` for rendering AI-generated Markdown lessons
- **UI Components**: custom-built accessible components with `intl-tel-input` for global reach

### Backend (High-Performance Python API)
- **Framework**: FastAPI (Asynchronous, Type-hinted)
- **Runtime**: Python 3.12+ managed via `uv`
- **Database**: MongoDB (NoSQL) with `Motor` for asynchronous I/O
- **Authentication**: JWT (JSON Web Tokens) with `python-jose` and `bcrypt` hashing
- **Security**: Role-Based Access Control (RBAC) enforced at the middleware/router level
- **Payments**: Stripe Python SDK for backend-side transaction handling
- **Documentation**: Automatic OpenAPI (Swagger) generation

### AI Core (The "Brain")
- **Model**: Google Gemini 2.5 Flash (via `google-generativeai`)
- **Orchestration**: LangChain (for prompt templating, output parsing, and chain management)
- **Logic**: Custom Adaptive Learning Engine (Classification + Generation)

---

## 🧠 Core AI Features (Implemented)

### 1. Student Learning Classifier
- **Mechanism**: Analyzes quiz scores, time spent, and time limits.
- **Output**: Classifies students into three learning paces: `slow`, `average`, and `fast`.
- **Purpose**: Feeds directly into the content generation engine to adjust pedagogical complexity.

### 2. Adaptive Lesson Generator
- **Personalization**: Takes the student's pace, recent quiz scores, and "weak areas" to generate a custom Markdown lesson.
- **Structure**: Includes titles, detailed content, difficulty levels, estimated duration, key concepts, and summaries.
- **Teacher Workflow**: Teachers can provide "Base Notes," which the AI then expands into polished, interactive lessons for students.

### 3. Dynamic Quiz Generator
- **Logic**: Generates high-quality Multiple Choice Questions (MCQs) on demand.
- **Parameters**: Difficulty level, question count, and specific topics are passed to the LLM.
- **Feedback**: Every question includes a detailed AI-generated explanation to help students learn from mistakes.

### 4. AI Tutor & Recommendations
- **AI Tutor**: A conversational interface that allows students to ask questions about course material.
- **Recommendation Engine**: Suggests courses or lessons based on the student's classification and past performance.

---

## 🏗️ Architecture & Data Model

### Multi-Tenancy Strategy
- **Isolation**: Admins and Teachers are strictly scoped to their `TenantID`.
- **Global Students**: Students are global entities. A single student can enroll in courses from different schools (tenants) without needing multiple accounts.
- **Resource Ownership**: Course content and financial records are owned by the Tenant.

### Role-Based Access Control (RBAC)
1. **Super Admin**: Manages platform-wide tenants, global subscription plans, and platform settings.
2. **Admin**: Manages school-specific teachers, students, billing, and school branding.
3. **Teacher**: Authored courses, builds lessons, manages quizzes, and tracks student progress.
4. **Student**: Global dashboard, course player (video/markdown), AI-adaptive lessons, and performance leaderboards.

---

## 📂 Project Structure

### Frontend (`/src/app`)
- `core/`: Global interceptors, guards, constants, and singleton services.
- `shared/`: Reusable UI components (buttons, cards, modals), pipes, and interfaces.
- `layouts/`: Role-specific shell components (Sidebars, Topbars) for Admin, Teacher, Student, etc.
- `features/`:
    - `auth/`: Multi-role login and signup flows.
    - `student/`: Personalized dashboard, course player, and AI interaction screens.
    - `teacher/`: Course builder and student tracking dashboards.
    - `admin/`: Tenant management and billing.

### Backend (`/app`)
- `routers/`: API endpoints grouped by domain (auth, courses, adaptive_learning, payments, etc.).
- `services/`: Core business logic (AI generation, payment processing, classification).
- `models/` & `schemas/`: Pydantic models for request/response validation.
- `db/`: MongoDB connection management and indexing.
- `scripts/`: Database maintenance, integrity checks, and cleanup utilities.

---

## 🔄 Data Flow (AI Adaptive Loop)
1. **Student** completes an AI-generated **Quiz**.
2. **Backend** calculates the score and passes it to the **Classifier**.
3. **Classifier** determines the student's current learning pace.
4. **Adaptive Learning Service** triggers a **Gemini 2.5 Flash** call with the pace and identified weak areas.
5. **AI** generates a personalized **Markdown Lesson**.
6. **Frontend** renders the new lesson in the **Course Player**, helping the student improve before the next assessment.

---

## 📈 Implementation Progress Summary
- ✅ **Authentication**: Full JWT-based multi-role auth.
- ✅ **Multi-Tenancy**: Tenant-scoped course and user management.
- ✅ **AI Integration**: Gemini 2.5 Flash integrated with retry logic and JSON repair mechanisms.
- ✅ **Payments**: Stripe embedded checkout for organization subscriptions.
- ✅ **Analytics**: Performance tracking and charts for both students and teachers.
- ✅ **UI/UX**: Modern, responsive Tailwind-based interface with role-based shells.

---
*This document was generated for research and further implementation planning. It covers the technical architecture, feature set, and current progress of the EduVerse-AI project.*
