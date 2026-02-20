# ⚠️ Database Configuration Needed

## Current Status

The application is ready but needs a MySQL database connection.

## Quick Fix Options

### Option 1: Use XAMPP (Easiest for Windows)

1. **Download XAMPP**: https://www.apachefriends.org/download.html
2. **Install** and start **MySQL** from XAMPP Control Panel
3. **Update `.env`**:

   ```env
   DATABASE_URL="mysql://root@localhost:3306/blog"
   ```

   (XAMPP MySQL has no password by default)

4. **Create database**:
   - Open `http://localhost/phpmyadmin`
   - Click "New" → Database name: `blog` → Create

5. **Run setup**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

### Option 2: Use MySQL Workbench

1. **Download**: https://dev.mysql.com/downloads/workbench/
2. **Install MySQL Server** (remember the root password!)
3. **Create database** named `blog`
4. **Update `.env`**:
   ```env
   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/blog"
   ```
5. **Run setup**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

### Option 3: Use Online MySQL (PlanetScale - Free Tier)

1. **Sign up**: https://planetscale.com/
2. **Create database**
3. **Get connection string** and update `.env`
4. **Run setup**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

## After Database is Connected

The dev server will automatically reload and you can:

- Visit `/` to see the homepage
- Login at `/login` with:
  - Email: `admin@example.com`
  - Password: `securepassword123`

## Need Help?

Let me know which option you'd like to try and I can guide you through it!
