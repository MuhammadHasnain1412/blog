# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+
- MySQL database (local or hosted)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

Update `.env` with your MySQL connection:

```env
DATABASE_URL=mysql://username:password@localhost:3306/blog
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Initialize Database

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed admin user
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Default Admin Credentials

- **Email**: `admin@example.com`
- **Password**: `securepassword123`

## Key URLs

- **Public Homepage**: `/`
- **Admin Login**: `/login`
- **Admin Dashboard**: `/admin/dashboard`
- **Create Post**: `/admin/dashboard/posts/create`
- **Manage Categories**: `/admin/dashboard/categories`
- **Status Page**: `/status`

## Project Documentation

- **BLUEPRINT.md** - Original architecture and design
- **IMPLEMENTATION_SUMMARY.md** - Complete feature list and structure
- **prisma/schema.prisma** - Database schema

## Common Tasks

### Create a New Category

1. Login as Admin/Editor
2. Navigate to `/admin/dashboard/categories`
3. Click "Create Category"
4. Enter name (slug auto-generated)

### Create a New Post

1. Login as any user
2. Navigate to `/admin/dashboard/posts/create`
3. Fill in title, select category, write content
4. Choose status (Admin/Editor can publish, Authors save as draft)
5. Click "Save Post"

### View Public Blog

1. Visit `/` to see all published posts
2. Click a post card to read full content
3. Use category links to filter by category

## Troubleshooting

### Prisma Client Not Found

```bash
npx prisma generate
```

### Database Connection Error

- Verify MySQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists

### Login Not Working

- Run seed script: `npm run db:seed`
- Check console for errors
- Verify NEXTAUTH_SECRET is set

## Next Steps

See `IMPLEMENTATION_SUMMARY.md` for optional enhancements and future features.
