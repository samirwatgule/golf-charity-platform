# API Quick List

## Auth
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout

## Subscriptions
- GET /api/v1/subscriptions/me
- POST /api/v1/subscriptions/checkout-session
- POST /api/v1/subscriptions/cancel
- POST /api/v1/webhooks/stripe

## Scores
- GET /api/v1/scores/me
- POST /api/v1/scores

## Draws
- GET /api/v1/draws/current
- POST /api/v1/draws/admin/simulate
- POST /api/v1/draws/admin/publish

## Charities
- GET /api/v1/charities
- GET /api/v1/charities/:slug

## Admin
- GET /api/v1/admin/users
- PATCH /api/v1/admin/winners/:id/verify
