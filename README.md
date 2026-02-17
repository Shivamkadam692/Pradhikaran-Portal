# Private Research Collaboration Platform

A production-style **MERN stack** application where **Senior Members** post questions and **Researchers** submit answers. Includes private review, inline feedback, revision cycles, answer compilation, approval workflow, anonymous mode, version history, audit logs, real-time updates (Socket.IO), and strict **RBAC++**.

## Tech Stack

- **MongoDB** — data store  
- **Express.js** — REST API, middleware, Socket.IO server  
- **React** (Vite) — SPA with role-based UI  
- **Node.js** — runtime  
- **Socket.IO** — real-time events  
- **JWT** — authentication  

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, optional CLIENT_URL
npm run dev
```

Optional seed (creates senior@example.com, researcher@example.com, password: `password123`):

```bash
npm run seed
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. Use the proxy: `/api` and `/socket.io` go to the backend (port 5000).

## Roles

- **Senior Member**: Create questions, set deadlines, review answers privately, add inline comments, request revisions, compile final answer, approve & complete, view analytics.
- **Researcher**: View open questions, submit answers, see inline feedback, revise and resubmit, track approval/rejection

## Core Rules

- Researchers **cannot** see other researchers’ answers.  
- Answers are visible only to the **question owner** (senior) and the **answer author**.  
- Researchers **cannot** see senior identity when anonymous mode is on.  
- Approved answers are **locked** and immutable.  
- All important actions are **audit logged**.

## Docs

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — system architecture, folder structure, database schemas, API summary, security/RBAC, workflow, real-time, analytics.

## License

MIT.
