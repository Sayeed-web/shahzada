# Database Setup Instructions

## Problem
PostgreSQL is not installed or not running on your local machine. The error shows:
```
the URL must start with the protocol `postgresql://` or `postgres://`
```

## Solution Options

### Option 1: Use Vercel Postgres (RECOMMENDED for Production)
1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Database → Postgres
3. Copy the `POSTGRES_PRISMA_URL` from Vercel
4. Update `.env` file:
```env
DATABASE_URL="your-vercel-postgres-url-here"
```

### Option 2: Install PostgreSQL Locally
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install with default settings (port 5432, user: postgres)
3. Set password during installation
4. Update `.env` with your password:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/saray_shazada"
```
5. Create database:
```bash
psql -U postgres
CREATE DATABASE saray_shazada;
\q
```
6. Run migrations:
```bash
npx prisma generate
npx prisma db push
npx tsx scripts/realSeed.ts
```

### Option 3: Use Docker PostgreSQL
1. Install Docker Desktop
2. Run PostgreSQL container:
```bash
docker run --name saray-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=saray_shazada -p 5432:5432 -d postgres:14
```
3. Keep `.env` as is:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saray_shazada"
```
4. Run migrations:
```bash
npx prisma generate
npx prisma db push
npx tsx scripts/realSeed.ts
```

## After Database Setup
Run these commands to initialize:
```bash
npx prisma generate
npx prisma db push
npx tsx scripts/realSeed.ts
```

## Login Credentials (After Seeding)
- **Admin**: admin@saray.af / Admin@123456
- **Saraf**: saraf@test.af / Saraf@123456
- **User**: user@test.af / User@123456
