# 💰 FinPilot

### AI-Powered Personal Finance & Financial Literacy Platform

FinPilot is a full-stack personal finance platform designed to help users **understand money, manage their finances, analyze investments, build financial habits, and make better financial decisions** through a unified interactive experience.

The platform combines financial education, budgeting, investment calculators, market tracking, financial-independence planning, an AI financial tutor, quizzes, progress tracking, badges, and personalized financial tools.

---

## ✨ What is FinPilot?

Managing personal finance often requires switching between multiple applications:

- One app for budgeting
- Another for investment calculations
- Another for market tracking
- Another for financial education
- Another for learning through quizzes
- Another for financial planning

**FinPilot brings these capabilities together in one platform.**

The goal is simple:

> **Learn → Plan → Calculate → Track → Improve**

FinPilot is designed to make financial literacy practical rather than purely theoretical.

---

# 🚀 Core Features

## 📊 Dashboard

A centralized financial-learning dashboard that provides an overview of the user's activity and progress.

Includes:

- Learning progress
- Completed lessons
- Quiz performance
- Financial-learning statistics
- Badges and achievements
- Quick access to major financial tools

---

## 💰 Budget Planner

Track and manage monthly finances through structured budgets.

Features include:

- Monthly budget creation
- Income tracking
- Expense tracking
- Budget categories
- Individual budget entries
- Entry editing
- Entry deletion
- Monthly navigation
- Historical expense tracking
- Budget summaries
- Remaining budget calculations

The budget system is designed around persistent anonymous sessions so users can maintain their data without requiring traditional authentication.

---

## 📈 Markets

FinPilot includes an interactive market-monitoring experience.

Features include:

- Stock search
- Stock selection
- Current quotes
- Historical market data
- Interactive price charts
- Candlestick visualization
- Volume information
- Market statistics
- Watchlist integration
- Market status
- Data timestamps
- Loading and error states

The market system is connected to the FinPilot backend market-data layer rather than exposing provider credentials to the browser.

> **Important:** Market-data availability depends on the configured provider and its API limits.

---

## ⭐ Watchlist

Users can maintain a personalized collection of stocks they want to monitor.

Features:

- Add stocks
- Remove stocks
- Update watchlist items
- Search available symbols
- View quotes
- Persistent anonymous-session storage

The watchlist is integrated with the Markets experience.

---

## 🧮 Financial Calculators

FinPilot provides investment calculation tools for common financial scenarios.

### SIP Calculator

Calculate projected investment growth based on:

- Monthly investment
- Expected return
- Investment duration

### Lumpsum Calculator

Calculate projected returns for:

- Initial investment
- Expected return
- Investment duration

The calculator functionality is implemented with dedicated frontend utilities and backend calculation APIs.

---

## 🎯 Financial Independence Planner

A financial-independence planning tool designed to help users understand the relationship between:

- Income
- Expenses
- Savings
- Investments
- Expected returns
- Financial goals
- Time horizon

The planner provides users with a structured way to think about long-term financial independence.

---

## 📚 Financial Learning

FinPilot contains a structured financial-literacy curriculum.

Learning areas include concepts related to:

- Personal finance
- Saving
- Investing
- Markets
- Financial planning
- Money management

The learning system supports:

- Modules
- Lessons
- Lesson completion
- Progress tracking
- Quizzes
- Quiz attempts
- Scores
- Passing status
- Feedback

---

## 🧠 AI Financial Tutor

FinPilot includes an AI-powered tutor designed to help users understand financial concepts conversationally.

The tutor supports:

- Conversations
- Contextual questions
- Financial explanations
- Lesson-related assistance
- Conversation history
- AI-generated responses

The AI layer is implemented on the backend so provider credentials remain server-side.

---

## 🏆 Quizzes & Gamification

The learning experience includes quizzes and achievement tracking.

Features include:

- Multiple-choice questions
- True/False questions
- Fill-in-the-blank questions
- Automatic grading
- Attempt limits
- Score calculation
- Passing percentage
- Question-level feedback
- Explanations
- Attempt history
- Badges

Quiz grading and attempt enforcement are handled by the backend.

---

# 🏗️ Architecture

FinPilot follows a full-stack architecture:

```text
                    ┌─────────────────────┐
                    │      FinPilot       │
                    │     Frontend        │
                    │     Next.js 14      │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        PostgreSQL        Market Provider     AI Provider
         / Database       Market Data          Groq / AI
             │
             ▼
       Persistent User
       Session Data
🛠️ Technology Stack
Frontend
Next.js 14
React
TypeScript
Tailwind CSS
TanStack Query
Recharts
Lucide React
Zustand
Backend
Python
FastAPI
SQLAlchemy
Pydantic
Alembic
Async database access
Pytest
Data & Services
PostgreSQL-compatible database
Market-data provider integration
Groq / AI provider integration
Anonymous session architecture
📁 Project Structure
FinPilot/
│
├── README.md
├── .gitignore
│
├── backend/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   │
│   ├── migrations/
│   ├── scripts/
│   ├── tests/
│   ├── docs/
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
│
├── frontend/
│   │
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── store/
│   │   └── types/
│   │
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── .env.example
│
└── docs/
🔐 Anonymous Session Architecture

FinPilot currently uses an anonymous browser session model.

A unique UUID is generated for the browser and stored locally.

Browser
   │
   │ X-Session-ID
   ▼
FastAPI Backend
   │
   ▼
User-specific data

This allows FinPilot to maintain:

Budgets
Watchlists
Learning progress
Quiz attempts
Tutor conversations

without requiring a traditional login flow for the core anonymous experience.

⚙️ Local Development Setup
Prerequisites

Install the following before starting:

Git
Node.js 18+
npm
Python 3.10+
PostgreSQL or the project's configured database
Required API provider credentials

Verify installations:

git --version
node --version
npm --version
python --version
📥 Clone the Repository
git clone https://github.com/Asish8239/FinPilot.git
cd FinPilot
🐍 Backend Setup

Move into the backend:

cd backend

Create a virtual environment:

python -m venv .venv

Activate it on Windows:

.\.venv\Scripts\Activate.ps1

If PowerShell blocks activation, run:

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Then activate again:

.\.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt
🔑 Backend Environment Variables

Create:

backend/.env

using:

backend/.env.example

Example:

Copy-Item .env.example .env

Then edit .env and provide the required values.

Never commit .env.

API keys, database credentials and other secrets must remain local.

🗄️ Database Setup

After configuring the backend environment, run the project's database migrations:

alembic upgrade head

If the project requires initial curriculum/demo data, use the provided seed script:

python scripts/seed_curriculum.py

Only run seed operations when appropriate for your local database.

▶️ Start the Backend

From:

FinPilot/backend

run:

uvicorn app.main:app --reload

The backend should become available at:

http://localhost:8000

FastAPI documentation:

http://localhost:8000/docs

Alternative OpenAPI documentation:

http://localhost:8000/redoc
⚛️ Frontend Setup

Open another terminal.

From the project root:

cd frontend

Install dependencies:

npm install

Create the local environment file:

Copy-Item .env.example .env.local

Edit:

frontend/.env.local

and configure the backend URL required by the project.

▶️ Start the Frontend

Run:

npm run dev

The application should be available at:

http://localhost:3000
🧪 Verify the Frontend Build

Before submitting frontend changes:

npm run build

A successful build should complete without:

TypeScript errors
ESLint errors
compilation errors
failed static generation
🧪 Backend Tests

From:

FinPilot/backend

run:

pytest

For more detailed output:

pytest -v
🔌 API Overview

The backend exposes versioned APIs under:

/api/v1

Major API areas include:

/api/v1/modules
/api/v1/quizzes
/api/v1/progress
/api/v1/tutor
/api/v1/calculator
/api/v1/budget
/api/v1/watchlist
/api/v1/markets

FastAPI automatically provides interactive API documentation through:

http://localhost:8000/docs
📈 Market Data

The Markets system uses the backend market-data service.

The frontend communicates with FinPilot's backend rather than directly exposing provider credentials.

Conceptually:

Markets UI
    ↓
FinPilot API
    ↓
Market Data Service
    ↓
Configured Market Provider

The project also contains caching/rate-limit handling because external market-data providers may impose request limits.

Market-data availability and update frequency depend on the configured provider and its plan.

🤖 AI Provider

The AI tutor uses a backend-side AI integration.

Provider API keys must remain in:

backend/.env

Never place private AI keys inside:

frontend/.env.local

and never commit them to Git.

🔒 Security Rules
Never commit:
.env
.env.local
.env.production
API keys
database passwords
tokens
private credentials
local databases
node_modules
.next
Python virtual environments

The repository's .gitignore is configured to exclude common secrets and generated files.

Before pushing changes, always run:

git status

and inspect the staged files.

🌿 Git Workflow

The main branch is:

main

For development work, create a feature branch:

git checkout -b feature/your-feature-name

Example:

git checkout -b feature/improve-market-chart

Make your changes and test them.

Then:

git status
git add .
git commit -m "Improve market chart interactions"
git push -u origin feature/improve-market-chart

Open a Pull Request into:

main
🤝 Contribution Guidelines

Before creating a Pull Request:

Frontend

Run:

npm run build
Backend

Run:

pytest
General

Check:

No secrets committed
No generated files committed
No unnecessary dependencies
No console errors
No broken routes
No dead buttons
Existing functionality still works
New functionality is tested where practical
🧭 Development Principles

FinPilot development follows these principles:

1. Functionality first

A feature should work before being considered complete.

2. No fake production data

Real financial information must never be fabricated and presented as real.

3. Security by default

Secrets remain server-side and local environment files remain untracked.

4. Type safety

Frontend and backend contracts should remain strongly typed and validated.

5. Reusable architecture

Prefer reusable components, services and utilities over duplicated logic.

6. Reactive user experience

Changes in data should propagate correctly throughout the interface.

7. Graceful failure

External services can fail. The application should show useful loading, error, stale-data and unavailable states instead of crashing.

🐛 Troubleshooting
Frontend won't start

Try:

cd frontend
npm install
npm run dev

If Next.js reports a stale chunk error such as:

ChunkLoadError
Loading chunk app/layout failed

stop the development server and clear the Next.js cache:

Remove-Item -Recurse -Force .next
npm run dev

Then hard-refresh the browser:

Ctrl + Shift + R
Backend won't start

Verify the virtual environment is active:

.\.venv\Scripts\Activate.ps1

Then:

pip install -r requirements.txt

and:

uvicorn app.main:app --reload
Database errors

Verify:

Database is running
Database URL in .env is correct
Required database exists
Migrations have been executed

Run:

alembic upgrade head
Market data unavailable

Check:

Backend is running
Market-data API credentials are configured
Provider limits have not been exceeded
Requested symbol is valid
Backend market endpoints are responding

Open:

http://localhost:8000/docs

and inspect the market endpoints.

📋 Current Project Areas
Area	Purpose
Dashboard	Financial-learning overview
Budget	Monthly budgeting and expense tracking
Calculator	SIP and Lumpsum calculations
Financial Independence	Long-term financial planning
Markets	Market data and analysis
Watchlist	Personalized stock monitoring
Learn	Financial education
Tutor	AI-powered financial assistance
Quizzes	Knowledge assessment
Profile	User progress and profile
Badges	Learning achievements
Settings	Application preferences
🏆 Project Goals

FinPilot is being developed with the long-term objective of creating a unified financial-learning and personal-finance platform that makes financial concepts:

Understandable → Actionable → Trackable

Rather than simply showing financial information, FinPilot aims to help users understand what the information means and how it relates to their financial decisions.

🚧 Development Status

FinPilot is under active development.

Core application areas include:

Financial learning
Budget management
Investment calculations
Financial-independence planning
Market monitoring
Watchlists
AI tutoring
Quizzes
Progress tracking
Gamification

Some integrations depend on external providers, database configuration and API availability.

Always verify provider-dependent functionality in the local development environment before considering a feature production-ready.

👥 Team

FinPilot

Developed collaboratively using:

Next.js
React
TypeScript
FastAPI
Python
SQLAlchemy
PostgreSQL
AI services
Market-data services

Repository:

https://github.com/Asish8239/FinPilot

📄 License

This project is currently maintained as a development project.

Add an appropriate open-source license before publicly redistributing or commercially licensing the project.

⭐ FinPilot

Learn your money. Plan your future. Make informed decisions.

Learn → Plan → Calculate → Track → Improve

### One correction before you paste it

I intentionally **didn't claim that the Markets page is already fully real-time production market data**, because we've just identified that part as an active development area. That's better for a professional repository than making a claim the current implementation cannot yet substantiate.

Also, the README currently gives the clone URL as the repository you just pushed to:

:contentReference[oaicite:0]{index=0}

After you paste it, we'll do the professional cleanup next: **commit the README, remove the two `test_results` artifacts, push, and then add your friend as a GitHub collaborator.**
