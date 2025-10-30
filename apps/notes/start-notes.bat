@echo off
set DATABASE_URL_NOTES=postgresql://neondb_owner:npg_my1bgzBdSRj8@ep-jolly-silence-a1md57lk-pooler.ap-southeast-1.aws.neon.tech/notes?sslmode=require&channel_binding=require
set SKIP_AUTH=true
set NEXT_PUBLIC_APP_URL=http://localhost:3001
set CORE_API_URL=http://localhost:3000/api

npm run dev

