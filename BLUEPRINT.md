# Global Multi-Category Blogging Platform Blueprint

## 1. Project Overview

**Goal:** Build a high-performance, scalable, and maintainable blogging platform for a global audience.
**Core Philosophy:** "Content First." The design must be clean, readable, and distraction-free. The architecture must be robust enough to handle growth but simple enough for a solo developer to maintain.
**User Roles:**

- **Admin**: Complete system control.
- **Editor**: Content management and oversight.
- **Author**: Content creation.

---

## 2. High-Level System Architecture

### **Tech Stack**

- **Framework:** Next.js 14+ (App Router) for server-side rendering, routing, and API handling.
- **Language:** TypeScript for type safety and maintainability.
- **UI Library:** Mantine UI (Core + Hooks) for a cohesive, accessible, and responsive design system.
- **Database:** MySQL for structured, relational data storage.
- **ORM:** Prisma for type-safe database interactions and schema management.
- **Authentication:** Custom JWT-based auth or NextAuth.js (v5) with credentials provider, integrated with RBAC.

### **Data Flow**

1.  **Client (Browser):** Requests page or interacts with UI components (Forms, Buttons).
2.  **Next.js App Router:**
    - **Server Components (RSC):** Fetch data directly from the DB via Prisma. efficient, SEO-friendly (even if not a priority, it's good practice).
    - **Client Components:** Handle interactivity, calling Server Actions or API routes for mutations.
3.  **Server Actions / API:** Validate input (Zod), check permissions (RBAC), and transact with the DB.
4.  **Prisma ORM:** Translates TS calls to SQL queries.
5.  **MySQL Database:** Stores/Retrieves data.

---

## 3. Database Design

### **Entity Relationship Diagram (ERD) Overview**

- **Users**: Central entity. Linked to Roles (via Enum) and Posts.
- **Posts**: The core content. Linked to Authors (User) and Categories.
- **Categories**: Hierarchical organization for posts.

### **Prisma Schema**

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  EDITOR
  AUTHOR
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id            String    @id @default(cuid()) // CUIDs are better for scalability than auto-increment ints
  email         String    @unique
  name          String?
  passwordHash  String    // Ensure robust hashing (Argon2 or bcrypt)
  role          Role      @default(AUTHOR)
  bio           String?   @db.Text
  avatarUrl     String?

  posts         Post[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
}

model Category {
  id          String     @id @default(cuid())
  name        String     @unique
  slug        String     @unique
  description String?    @db.Text
  parentId    String?    // For nested categories (e.g., Tech > Web Dev)
  parent      Category?  @relation(fields: [parentId], references: [id], name: "CategoryHierarchy")
  children    Category[] @relation("CategoryHierarchy")

  posts       Post[]

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([slug])
}

model Post {
  id          String     @id @default(cuid())
  title       String
  slug        String     @unique
  content     String     @db.LongText // Supports Markdown or HTML
  excerpt     String?    @db.Text
  coverImage  String?
  status      PostStatus @default(DRAFT)

  authorId    String
  author      User       @relation(fields: [authorId], references: [id])

  categoryId  String
  category    Category   @relation(fields: [categoryId], references: [id])

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  publishedAt DateTime?

  @@index([authorId])
  @@index([categoryId])
  @@index([slug])
  @@index([status, publishedAt]) // Optimize for recent published posts
}
```

---

## 4. Next.js App Router Folder Structure

Designed for **separation of concerns** and **scalability**.

```
src/
├── app/
│   ├── (auth)/                 # Route Group: Authentication (No shared layout with public/admin if distinct)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/           # Optional, or Admin-only creation
│   │   │   └── page.tsx
│   │   └── layout.tsx          # Auth-specific layout (e.g., centered box)
│   │
│   ├── (admin)/                # Route Group: Protected Admin/Dashboard Area
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Overview stats
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx    # List all posts (with filters)
│   │   │   │   ├── create/     # Create new post
│   │   │   │   └── [id]/       # Edit post
│   │   │   ├── categories/
│   │   │   │   └── page.tsx    # Manage categories
│   │   │   └── users/          # (Admin only)
│   │   │       └── page.tsx
│   │   └── layout.tsx          # Dashboard shell (Sidebar, Header, Auth check)
│   │
│   ├── (public)/               # Route Group: Public facing blog
│   │   ├── page.tsx            # Home (Recent posts, Featured)
│   │   ├── [categorySlug]/     # Category archive
│   │   │   ├── page.tsx
│   │   │   └── [postSlug]/     # Single post view
│   │   │       └── page.tsx
│   │   └── layout.tsx          # Public layout (Header, Footer, Navigation)
│   │
│   ├── api/                    # Route Handlers (for external consumers or complex dynamic needs)
│   ├── layout.tsx              # Root Layout (Providers: Mantine, Auth)
│   └── globals.css             # Global styles / Mantine resets
│
├── components/                 # Shared Components
│   ├── core/                   # Buttons, Inputs, Cards (Mantine wrappers)
│   ├── layout/                 # Header, Footer, Sidebar
│   ├── posts/                  # PostCard, PostContent, PostGrid
│   └── dashboard/              # Admin-specific tables/forms
│
├── lib/
│   ├── prisma.ts               # Prisma Client singleton
│   ├── auth.ts                 # Auth configuration & utilities
│   ├── rbac.ts                 # Role-Based Access Control logic functions
│   ├── actions/                # Server Actions (Mutations)
│   │   ├── posts.ts
│   │   ├── categories.ts
│   │   └── users.ts
│   └── utils.ts                # Helpers
│
├── styles/
│   └── theme.ts                # Mantine Theme configuration
│
└── types/                      # TS Definitions
    └── index.ts
```

---

## 5. Role-Based Access Logic

### **Roles & Capabilities**

| Capability               | Admin | Editor |      Author       | Public |
| :----------------------- | :---: | :----: | :---------------: | :----: |
| **View Published Posts** |  ✅   |   ✅   |        ✅         |   ✅   |
| **View Drafts**          |  ✅   |   ✅   |     Own Only      |   ❌   |
| **Create Posts**         |  ✅   |   ✅   |        ✅         |   ❌   |
| **Edit Posts**           |  All  |  All   |     Own Only      |   ❌   |
| **Delete Posts**         |  All  |  All   | Own Only (Drafts) |   ❌   |
| **Publish Posts**        |  ✅   |   ✅   |   ❌ (Submit\*)   |   ❌   |
| **Manage Categories**    |  ✅   |   ✅   |        ❌         |   ❌   |
| **Manage Users**         |  ✅   |   ❌   |        ❌         |   ❌   |

_\*Authors might only be able to set status to 'PENDING_REVIEW' depending on strictness._

### **Implementation Logic (Server-Side)**

Located in `src/lib/rbac.ts` and used in Server Actions/Page Loaders.

```typescript
// Example Logic
import { auth } from "@/lib/auth";
import { db } from "@/lib/prisma";

export async function checkPermission(requiredRole: Role[]) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Unauthorized");

  if (!requiredRole.includes(session.user.role)) {
    throw new Error("Forbidden: Insufficient Permissions");
  }
  return session.user;
}

export async function canEditPost(userId: string, postId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  const post = await db.post.findUnique({ where: { id: postId } });

  if (user.role === "ADMIN" || user.role === "EDITOR") return true;
  if (user.role === "AUTHOR" && post.authorId === user.id) return true;

  return false;
}
```

---

## 6. Mantine UI Usage Plan

### **Theming Approach**

- **Theme Object:** Define primary colors, font families, and spacing in `src/styles/theme.ts`.
- **CSS Variables:** Use Mantine's CSS variables feature for dynamic dark/light mode switching which Mantine supports natively.
- **Typography:** Set up global styles for clean, readable serif (for body) and sans-serif (for headers) fonts.

### **Core Components to Build**

1.  **AppShell:** Use Mantine's `AppShell` for the Admin Dashboard (Navbar, Header, Main).
2.  **Container:** Restrict content width for readability (e.g., `md` or `lg` size usually ~800-1000px for blog text).
3.  **Grid / SimpleGrid:** Responsive layouts for the post archive/home page.
4.  **Card:** Reusable component for post previews (Image, Title, Excerpt, Author badge).
5.  **Typography**: specialized `Title` and `Text` components with predefined sizes for headings and body text.
6.  **Rich Text Editor:** Integrate Tiptap (Mantine has a dedicated `@mantine/tiptap` package) for the post editor.

---

## 7. Scalability Plan

**Phase 1 (Solo Developer):**

- **Monolith:** Keep everything in Next.js.
- **Database:** Hosted managed MySQL (e.g., PlanetScale, Railway, or AWS RDS).
- **Images:** Store URLs in DB. Use a service like UploadThing or AWS S3 for actual storage.

**Phase 2 (Growth):**

- **Caching:** Implement `unstable_cache` or standard `fetch` caching with revalidation tags for high-traffic public pages.
- **Read Replicas:** If DB reads become a bottleneck, separate read/write connections in Prisma.
- **CDN:** Ensure all static assets and uploaded images are served via a global CDN.

**Phase 3 (Enterprise):**

- **Microservices:** Only if absolutely needed (e.g., separate Auth or Notification service).
- **Search:** Integrate Meilisearch or Algolia for full-text search if MySQL `LIKE` queries become too slow.

---

## 8. Final Build Checklist (Implementation Roadmap)

### **Step 1: Foundation**

- [ ] Initialize Next.js project.
- [ ] Install Mantine (Core, Hooks, Tiptap).
- [ ] Setup Prisma & MySQL connection.
- [ ] Define Schema (`User`, `Post`, `Category`).
- [ ] Run initial migration.

### **Step 2: Authentication & RBAC**

- [ ] Setup Auth system (Login page, Session management).
- [ ] Create `rbac.ts` utilities.
- [ ] Create "Seed" script to generate the first Admin user.

### **Step 3: Admin Dashboard (The "Engine")**

- [ ] create `(admin)/layout.tsx` with AppShell.
- [ ] Implement Category management (CRUD).
- [ ] Implement Post creation (Integrate Tiptap editor).
- [ ] Implement Post management (List view with status filters).

### **Step 4: Public Frontend (The "Face")**

- [ ] Create Homepage (List of recent published posts).
- [ ] Create Category Page (Filtered list).
- [ ] Create Single Post View (The reading experience).
- [ ] Style strictly with Mantine Theme for consistency.

### **Step 5: Polish & Deploy**

- [ ] Add loading skeletons.
- [ ] Handle 404s and Error boundaries.
- [ ] Deploy to Vercel/Netlify/VPS.
- [ ] Connect production DB.
