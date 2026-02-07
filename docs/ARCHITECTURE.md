# Research Collaboration Platform — System Architecture

## Overview

Production-grade MERN stack application for private research collaboration: Senior Members post questions, Researchers submit answers. Supports multiple answers per question, private review, revision cycles, compilation, approval workflow, anonymous mode, version history, audit logs, real-time updates, and RBAC++.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React SPA (Vite)                          │
│  AuthContext │ SocketContext │ Role-based routes & components   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST + Socket.IO
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js Backend                            │
│  auth │ RBAC │ ownership │ routes │ controllers │ cron │ socket  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB                                     │
│  users │ questions │ answers │ answer_versions │ inline_comments │
│  audit_logs │ notifications                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Backend Folder Structure

```
backend/
├── src/
│   ├── config/          # DB connection
│   ├── constants/       # ROLES, QUESTION_STATUS, ANSWER_STATUS
│   ├── controllers/     # auth, question, answer, compilation, feedback, analytics, notification
│   ├── middleware/      # auth (JWT), rbac, ownership, validate
│   ├── models/         # User, Question, Answer, AnswerVersion, InlineComment, AuditLog, Notification
│   ├── routes/         # auth, questions, answers, compilation, feedback, analytics, notifications
│   ├── jobs/           # deadlineCron (auto-close questions)
│   ├── socket.js       # Socket.IO setIO/getIO for server
│   ├── utils/          # auditLogger
│   ├── scripts/        # seed.js
│   ├── app.js          # Express app, middleware, route mount
│   └── server.js       # HTTP server, Socket.IO, cron start
├── .env.example
└── package.json
```

## Frontend Folder Structure

```
frontend/
├── src/
│   ├── api/            # client (axios), auth, questions, answers, compilation, feedback, analytics, notifications
│   ├── components/     # Layout, Layout.css
│   ├── context/        # AuthContext, SocketContext
│   ├── pages/          # Login, Register, SeniorDashboard, ResearcherDashboard, QuestionCreate,
│   │                   # QuestionDetail, QuestionEdit, AnswerEditor, ReviewFeedback, Analytics
│   ├── App.jsx         # Routes, ProtectedRoute (role-based)
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js      # proxy /api and /socket.io to backend
└── package.json
```

## Database Schemas (MongoDB / Mongoose)

- **User**: email, password (hashed), name, role (senior_member | researcher), isActive.
- **Question**: title, description, tags[], difficulty, status (draft|open|closed|completed), submissionDeadline, anonymousMode, owner (ref User), compiledAnswer { content, compiledAt, approvedAt }.
- **Answer**: question (ref), author (ref), status (draft|submitted|revision_requested|approved|rejected), content, isLocked.
- **AnswerVersion**: answer (ref), versionNumber, content, submittedAt, revisionNote.
- **InlineComment**: answer, answerVersion, author, text, startIndex, endIndex, resolved, resolvedAt.
- **AuditLog**: user, action, resourceType, resourceId, metadata, ip, userAgent (append-only).
- **Notification**: recipient, type, title, body, link, resourceType, resourceId, read, readAt.

## Security & RBAC

- **JWT**: Issued on login/register; sent as `Authorization: Bearer <token>`; verified in `protect` middleware.
- **RBAC++**: `seniorOnly` / `researcherOnly` / `requireRole(...)` restrict routes by role.
- **Ownership**: `isQuestionOwner` ensures only the question owner can update/publish/close/compile. `canAccessAnswer` ensures only question owner or answer author can read/comment/approve/revise that answer.
- **Privacy**: Researchers never receive other researchers’ answers (listByQuestion filters by author for non-owners). Anonymous mode: owner field is omitted in API responses to researchers.
- **Immutability**: Approved answers are `isLocked: true`; compiled approved content is not editable. Audit logs are never updated or deleted.
- **Input**: express-validator on body/params; express-mongo-sanitize; helmet; CORS to CLIENT_URL.

## API Endpoints Summary

| Method | Path | Who | Description |
|--------|------|-----|-------------|
| POST | /api/auth/register | Public | Register (role in body) |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | Auth | Current user |
| POST | /api/questions | Senior | Create question |
| GET | /api/questions/mine | Senior | My questions |
| GET | /api/questions/open | Researcher | Open questions |
| GET | /api/questions/:id | Auth | Get one |
| PUT | /api/questions/:questionId | Senior+Owner | Update draft |
| POST | /api/questions/:questionId/publish | Senior+Owner | Publish |
| POST | /api/questions/:questionId/close | Senior+Owner | Close |
| POST | /api/questions/:questionId/answers | Researcher | Submit/revise answer |
| GET | /api/questions/:questionId/answers | Auth | List (owner: all; researcher: own) |
| GET | /api/answers/:answerId | Auth+Access | Get one |
| GET | /api/answers/:answerId/versions | Auth+Access | Version history |
| POST | /api/answers/:answerId/request-revision | Senior+Owner | Request revision |
| POST | /api/answers/:answerId/approve | Senior+Owner | Approve |
| POST | /api/answers/:answerId/reject | Senior+Owner | Reject |
| PUT | /api/questions/:questionId/compilation | Senior+Owner | Save compiled text |
| POST | /api/questions/:questionId/compilation/approve | Senior+Owner | Approve & complete |
| POST | /api/answers/:answerId/comments | Auth+Access | Add inline comment |
| GET | /api/answers/:answerId/comments | Auth+Access | List comments |
| PATCH | /api/answers/:answerId/comments/:commentId/resolve | Auth+Access | Resolve |
| GET | /api/analytics/dashboard | Senior | Analytics |
| GET | /api/notifications | Auth | List |
| PATCH | /api/notifications/:id/read | Auth | Mark read |
| POST | /api/notifications/read-all | Auth | Mark all read |

## Workflow

1. **Senior** creates question (draft), sets deadline and anonymous mode, then **publishes** → status `open`.
2. **Researchers** see only open questions (no senior identity if anonymous). They **submit** answers; each gets one Answer document with **AnswerVersion** history.
3. **Senior** sees all answers for their questions in **Review** UI: adds **inline comments**, **requests revision**, or **approves/rejects**.
4. **Researchers** get notifications; they **revise** (new version) and resubmit; they can **resolve** comments.
5. When **deadline** passes, **cron** sets question to `closed` (no new answers).
6. **Senior** **compiles** final answer from one or more, **saves compilation**, then **approves compilation** → question `completed`, approved answers locked; notifications sent.
7. **Real-time**: Socket.IO used for new_answer, revision_requested, answer_approved/rejected, inline_comment, question_completed; clients join `user-<id>` and `question-<id>`.

## Real-Time (Socket.IO)

- **Server**: Attached to same HTTP server; auth via `handshake.auth.token` (JWT). Rooms: `user-<userId>`, `question-<questionId>` (join on `join_question`).
- **Events emitted by server**: new_answer, answer_updated, revision_requested, answer_approved, answer_rejected, inline_comment, question_completed.
- **Client**: Connects with token; joins question room when viewing a question; listens for events to refresh data and show notifications.

## Analytics (Senior)

- Total questions, by status, total answers, avg answers per question, completion rate, completed count, revision cycles, comments count, domain activity (tags).

## Running the Project

1. **Backend**: `cd backend && npm install && cp .env.example .env` (set MONGODB_URI, JWT_SECRET). `npm run dev`. Optional: `npm run seed`.
2. **Frontend**: `cd frontend && npm install && npm run dev`. Proxy in Vite forwards /api and /socket.io to backend.
3. **MongoDB**: Running locally or set MONGODB_URI.

---

This architecture is suitable for a university project, resume showcase, or startup MVP.
