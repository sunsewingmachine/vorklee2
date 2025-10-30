$env:DATABASE_URL_NOTES = 'postgresql://neondb_owner:npg_my1bgzBdSRj8@ep-jolly-silence-a1md57lk-pooler.ap-southeast-1.aws.neon.tech/notes?sslmode=require&channel_binding=require'
$env:SKIP_AUTH = 'true'
$env:NEXT_PUBLIC_APP_URL = 'http://localhost:3001'
$env:CORE_API_URL = 'http://localhost:3000/api'

Write-Host "Starting Notes app with environment variables..."
npm run dev

