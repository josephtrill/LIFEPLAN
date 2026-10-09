# LifePlan

> **Manage today. Improve yourself. Prepare for tomorrow.**

**Repository:** [github.com/josephtrill/LIFEPLAN](https://github.com/josephtrill/LIFEPLAN)

LifePlan is a personal-use, full-stack web application that brings finances, daily plans, time, productivity, habits, thoughts, skills, goals, roadmaps, and future preparation into one centralized system. It is not just an expense tracker or task manager. It is a self-management system that connects:

**Money + Time + Planning + Productivity + Habits + Skills + Goals + Discipline + Future Preparation**

The aim is to help you become financially responsible, organized, productive, disciplined, consistent, goal-oriented, and prepared for the future. The dashboard answers two questions: *"How am I doing today?"* and *"Am I moving toward my future?"*

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Features](#features)
- [Database](#database)
- [REST API](#rest-api)
- [Getting Started](#getting-started)
- [Security](#security)
- [Validation and Error Handling](#validation-and-error-handling)
- [Responsive Design](#responsive-design)
- [Development Roadmap](#development-roadmap)
- [Testing Checklist](#testing-checklist)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript, Fetch API, Chart.js |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (via the `pg` driver) |
| Auth | `bcrypt` password hashing, `jsonwebtoken` |
| Config | `dotenv`, `cors` |

**Not used:** PHP, XAMPP, MySQL, React, Angular, Vue, Laravel.

## Architecture

```
Browser
  ↓
HTML + CSS + JavaScript
  ↓  Fetch API
Express.js + TypeScript REST API
  ↓
Routes → Controllers → Services → Database (PostgreSQL)
  ↓
API Response
  ↓
JavaScript updates the interface
```

- Database queries stay out of the frontend.
- Business logic stays out of HTML.
- The backend is layered (routes, controllers, services, database) and split into small modules.

## Project Structure

```
lifeplan/
├── src/
│   ├── server.ts
│   ├── db/
│   │   └── database.ts
│   ├── controllers/      # auth, dashboard, expense, budget, planning, task,
│   │                     # thought, time, goal, roadmap, skill, habit, productivity
│   ├── routes/           # one routes file per controller
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   └── errorMiddleware.ts
│   ├── services/         # auth, dashboard, expense, planning, goal, skill, productivity
│   └── types/
│       └── index.ts
│
├── public/
│   ├── index.html        # login / register
│   ├── dashboard.html
│   ├── expenses.html
│   ├── planning.html
│   ├── time.html
│   ├── thoughts.html
│   ├── goals.html
│   ├── roadmap.html
│   ├── skills.html
│   ├── habits.html
│   ├── future.html
│   ├── reports.html
│   ├── css/              # style.css, dashboard.css, responsive.css
│   └── js/               # app.js plus one script per page
│
├── database/
│   └── schema.sql
│
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## Features

### Authentication
- Register, login, and logout
- Password hashing (no plain-text passwords stored)
- Authentication middleware that protects private pages and API routes
- Input validation with useful error messages
- Redirects to `/dashboard.html` after a successful login

### Dashboard
The main control center, updated from API data. It shows:

- **Financial summary:** today's, weekly, and monthly expenses; daily and monthly budget with what remains; savings progress
- **Productivity summary:** today's, completed, and remaining tasks; productivity percentage; habit completion; study and productive hours
- **Goals summary:** active and completed goals, goal progress
- **Skills summary:** skills in progress and completed, average progress
- **Today's plan:** planned, completed, and pending activities
- **Today's thought:** your latest personal thought
- **Upcoming goals:** approaching deadlines

### Dashboard Charts (Chart.js)
All charts load from PostgreSQL through the REST API, with no hard-coded values.

1. Daily expenses
2. Weekly spending
3. Monthly spending
4. Expenses by category
5. Productivity trend
6. Goal progress
7. Skill progress
8. Time usage

### Finance
- **Expenses:** add, edit, delete, view, search, filter by date or category, sort, and calculate totals. Categories: Food, Transportation, Education, Bills, Shopping, Entertainment, Health, Savings, Other.
- **Budget:** monthly income, daily and monthly spending limits, savings target, emergency fund target, and future purchase target. It shows income, expenses, remaining money, savings, budget percentage used, and savings percentage.
- **Savings tracker:** create savings goals (e.g., Emergency Fund, Laptop) with target, current amount, and a progress bar.

### Planning
- **Daily plans:** create, edit, delete, and complete plans with title, description, date, deadline, priority (High, Medium, Low), and status (Pending, In Progress, Completed, Cancelled).
- **Tasks:** title, description, priority, deadline, status, and completion date.
- **Time management:** record activity, category, start and end time, and notes. Duration is calculated automatically. Categories: Work, Study, Exercise, Sleep, Family, Entertainment, Social Media, Personal, Other. It shows productive, study, entertainment, social media, and sleep hours, plus a time usage chart.

### Personal Development
- **Thoughts / journal:** private entries with add, edit, delete, search, filter, and history. Categories: Reflection, Idea, Problem, Lesson, Future, Personal.
- **Habits:** daily check-ins with daily, weekly, and monthly completion, current streak, and best streak.
- **Skills:** track current level, target level, progress, status (Not Started, Learning, Practicing, Improving, Completed), and notes.
- **Goals:** Short-, Medium-, and Long-Term goals with target date, 0–100% progress, and status (Not Started, In Progress, Completed, Paused, Cancelled).
- **Roadmaps:** each major goal can have ordered steps (e.g., Become a Full Stack Developer: HTML → CSS → JavaScript → TypeScript → Express → PostgreSQL → Projects → Portfolio → Apply for Jobs). Add, edit, delete, reorder, complete, and update progress per step.

### Productivity and Discipline
- **Productivity score:** a daily score calculated from tasks completed, daily plans completed, habits completed, study time, productive time, goal progress, and budget discipline. The calculation is documented in the code.
- **Self-discipline tracker:** daily, weekly, and monthly discipline scores and habit streaks, based on following the plan, following the budget, completing habits, studying, exercising, and reducing distractions. It rewards consistency rather than only successful days.

### Future Preparation
One page combining financial, career, education, personal, and savings goals, the emergency fund, major purchases, skills, and long-term goals.

### Reviews and Reports
- **Daily review:** expenses, budget, tasks, time, habits, goals, productivity score, and reflection prompts ("What went well today?", "What should I improve tomorrow?", "What did I learn today?").
- **Weekly review:** expenses, savings, tasks, average productivity and discipline, study and exercise hours, goal and skill progress, with charts.
- **Monthly review:** income, expenses, savings, budget usage, tasks and goals completed, skills improved, average productivity and discipline, study hours, and time distribution.

### Navigation

```
Dashboard
Finance            → Expenses, Budget, Savings
Planning           → Daily Plans, Tasks, Time Management
Personal           → Thoughts, Habits, Productivity
Development        → Skills, Goals, Roadmap
Future             → Future Preparation
Reports            → Daily Review, Weekly Review, Monthly Review
Settings
Logout
```

## Database

PostgreSQL tables (all personal records carry a `user_id`, with primary keys, foreign keys, timestamps, constraints, and indexes):

`users`, `budgets`, `expenses`, `savings_goals`, `daily_plans`, `tasks`, `time_entries`, `thoughts`, `goals`, `roadmaps`, `skills`, `habits`, `habit_records`, `daily_reviews`

```
users
 ├── budgets
 ├── expenses
 ├── savings_goals
 ├── daily_plans
 ├── tasks
 ├── time_entries
 ├── thoughts
 ├── goals ──── roadmaps
 ├── skills
 ├── habits ─── habit_records
 └── daily_reviews
```

The full schema lives in [`database/schema.sql`](database/schema.sql).

## REST API

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Dashboard | `GET /api/dashboard`, `/summary`, `/charts`, `/productivity` |
| Expenses | `GET/POST /api/expenses`, `GET/PUT/DELETE /api/expenses/:id` |
| Budget | `GET/PUT /api/budget` |
| Savings | `GET/POST /api/savings`, `PUT/DELETE /api/savings/:id` |
| Plans | `GET/POST /api/plans`, `PUT/DELETE /api/plans/:id` |
| Tasks | `GET/POST /api/tasks`, `PUT/DELETE /api/tasks/:id` |
| Time | `GET/POST /api/time`, `PUT/DELETE /api/time/:id` |
| Thoughts | `GET/POST /api/thoughts`, `PUT/DELETE /api/thoughts/:id` |
| Goals | `GET/POST /api/goals`, `PUT/DELETE /api/goals/:id` |
| Roadmaps | `GET/POST /api/goals/:goalId/roadmap`, `PUT/DELETE /api/roadmap/:id` |
| Skills | `GET/POST /api/skills`, `PUT/DELETE /api/skills/:id` |
| Habits | `GET/POST /api/habits`, `PUT/DELETE /api/habits/:id` |
| Productivity | `GET /api/productivity/daily`, `/weekly`, `/monthly` |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- [PostgreSQL](https://www.postgresql.org/) (pgAdmin optional)

### 1. Clone the repository

```bash
git clone https://github.com/josephtrill/LIFEPLAN.git
cd LIFEPLAN
```

### 2. Install dependencies

```bash
npm install
```

The project uses these packages:

```bash
npm install express pg dotenv cors bcrypt jsonwebtoken
npm install -D typescript ts-node-dev @types/node @types/express @types/pg @types/cors @types/bcrypt @types/jsonwebtoken
```

### 3. Create the database

Create a PostgreSQL database named `lifeplan`, then run the schema:

```bash
createdb lifeplan
psql -d lifeplan -f database/schema.sql
```

Or in pgAdmin: create a database named `lifeplan`, open the Query Tool, and run the contents of `database/schema.sql`.

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/lifeplan
```

Replace `username` and `password` with your PostgreSQL credentials. Also add a secret for signing tokens (e.g., `JWT_SECRET`). Never commit `.env` to GitHub.

### 5. Run the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Security

- Passwords are hashed and never stored in plain text
- Authentication middleware protects private pages and API routes
- Users can only access their own data
- All SQL uses parameterized queries
- Secrets and database credentials live in `.env`, not in source code
- Input is validated on both frontend and backend
- Database errors are logged on the server and never exposed to the user

## Validation and Error Handling

**Validation examples:** expense amounts must be positive, emails must be valid, required fields cannot be empty, goal progress must be between 0 and 100, dates must be valid, and passwords must meet minimum security requirements.

**HTTP status codes:**

| Code | Meaning |
|---|---|
| 400 | Invalid input |
| 401 | Unauthorized |
| 404 | Not found |
| 409 | Conflict |
| 500 | Server error |

The frontend shows user-friendly error messages, success messages after saving, loading indicators, and confirmation dialogs before destructive actions.

## Responsive Design

LifePlan works on desktop, laptop, tablet, and mobile. Navigation collapses for small screens, tables stay usable, and cards and charts resize to fit.

## Development Roadmap

The app is built incrementally, one phase at a time, with each feature tested before moving on.

- [ ] **Phase 1:** Project setup (Node.js, TypeScript, Express, PostgreSQL)
- [ ] **Phase 2:** Database connection and schema
- [ ] **Phase 3:** Login and registration
- [ ] **Phase 4:** Dashboard
- [ ] **Phase 5:** Expenses
- [ ] **Phase 6:** Budget
- [ ] **Phase 7:** Savings
- [ ] **Phase 8:** Daily planning
- [ ] **Phase 9:** Tasks
- [ ] **Phase 10:** Time management
- [ ] **Phase 11:** Thoughts
- [ ] **Phase 12:** Goals
- [ ] **Phase 13:** Roadmaps
- [ ] **Phase 14:** Skills
- [ ] **Phase 15:** Habits
- [ ] **Phase 16:** Productivity
- [ ] **Phase 17:** Self-discipline
- [ ] **Phase 18:** Future preparation
- [ ] **Phase 19:** Daily, weekly, and monthly reports
- [ ] **Phase 20:** Testing, bug fixing, UI improvement, and security review

## Testing Checklist

- [ ] Registration, login, logout, and invalid login
- [ ] Expense creation, editing, and deletion
- [ ] Budget and savings calculations
- [ ] Task completion and daily planning
- [ ] Time tracking and thought creation
- [ ] Goal, roadmap, and skill progress
- [ ] Habit completion
- [ ] Productivity calculations and dashboard graphs
- [ ] Database relationships
- [ ] Invalid data and missing fields
- [ ] Unauthorized API requests
- [ ] Wrong user accessing another user's data
- [ ] Database connection failures

## License

Personal-use project.
