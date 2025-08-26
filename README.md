# sav3-backend

## Development

1. Copy env file:
```
cp .env.example .env
```
Adjust secrets.

2. Start services (Docker):
```
docker compose up --build
```
This starts Postgres and the API.

3. Apply migrations (handled automatically in container start). For local (non-container) dev:
```
npx prisma migrate dev --name init
```

4. Run API locally without docker DB (requires external Postgres):
```
npm run dev
```

## Endpoints
- GET /api/v1/health
- POST /api/v1/auth/register { email, password }
- POST /api/v1/auth/login { email, password }
- GET /api/v1/me (Authorization: Bearer <token>)

## Swagger Docs
Visit /docs once server is running.
