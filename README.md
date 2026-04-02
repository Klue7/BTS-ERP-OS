

This contains everything you need to run your app locally.


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Local Database

This repo now includes a local PostgreSQL setup via Docker Compose and Prisma.

1. Create local env:
   `cp .env.example .env`
2. Start PostgreSQL:
   `npm run db:up`
3. Create or update the schema:
   `npm run db:migrate -- --name init_catalog`
4. Seed the current product catalog:
   `npm run db:seed`
5. Open Prisma Studio if needed:
   `npm run db:studio`
