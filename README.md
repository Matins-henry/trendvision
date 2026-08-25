# Hotel Platform

A complete hotel management system with customer booking website and staff management tools.

## 📖 Documentation

All project documentation is located in the [`docs/`](./docs/) folder:

- **[docs/PROJECT_CONTEXT.md](./docs/PROJECT_CONTEXT.md)** - Start here for project overview
- **[docs/PHASE_1_FINAL_SUMMARY.md](./docs/PHASE_1_FINAL_SUMMARY.md)** - Phase 1 completion summary
- **[docs/README.md](./docs/README.md)** - Complete documentation index

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🧪 Test Users

| Email | Password | Role |
|-------|----------|------|
| manager@hotel.com | Manager123! | MANAGER |
| receptionist@hotel.com | Receptionist123! | RECEPTIONIST |
| owner@hotel.com | Owner123! | OWNER |

## 📦 Project Structure

```
hotel-platform/
├── apps/
│   ├── admin/          # Hotel Management System
│   ├── site/           # Customer Booking Website
│   └── docs/           # Documentation site
├── packages/
│   ├── auth/           # Authentication package
│   └── db/             # Database package (Prisma)
├── docs/               # Project documentation
└── .kiro/              # Specifications and requirements
```

## 🔧 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Supabase Postgres
- **Auth**: Supabase Auth
- **Testing**: Jest, fast-check
- **Monorepo**: Turborepo

## 📚 Learn More

See [`docs/PROJECT_CONTEXT.md`](./docs/PROJECT_CONTEXT.md) for complete architecture, conventions, and implementation details.

---

**Status**: Phase 1 Complete ✅ (Authentication & Authorization)
