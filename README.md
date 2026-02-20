# Global Multi-Category Blogging Platform

This repository contains the blueprint and initial setup for a scalable, solo-developer-friendly blogging platform.

## 🚀 Getting Started

### 1. Review the Blueprint

Read [BLUEPRINT.md](./BLUEPRINT.md) completely to understand the architecture, data flow, and roadmap.

### 2. Setup Database

The database schema is defined in [prisma/schema.prisma](./prisma/schema.prisma).
Ensure you have a MySQL database ready (e.g., local, PlanetScale, Railway).

### 3. Initialize Project (Next Step)

Run the following commands to scaffold the application based on the blueprint:

```bash
# Initialize Next.js with TypeScript, ESLint, Tailwind (optional but good for utility classes alongside Mantine)
npx create-next-app@latest . --typescript --eslint --src-dir

# Install Core Dependencies
npm install @mantine/core @mantine/hooks @emotion/react @prisma/client next-auth zod
npm install -D prisma postcss postcss-preset-mantine postcss-simple-vars
```

### 4. Essential Files

- **BLUEPRINT.md**: The master plan.
- **prisma/schema.prisma**: The database structure.

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI**: Mantine UI
- **Database**: MySQL + Prisma
- **Auth**: RBAC (Admin, Editor, Author)
