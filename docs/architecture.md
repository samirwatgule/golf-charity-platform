# Architecture Notes

## API Design
- Express app with module-based routing under /api/v1.
- Middleware chain: authJwt -> role guard -> active subscription guard.
- Service-friendly route design for easy extraction into separate service files later.

## Data Design
- PostgreSQL schema supports subscription lifecycle, draw publication, winner verification, and charity donation records.
- Money-critical flows (draw publish, score retention) use transactions.

## Scale Considerations
- Country and currency columns are included now for multi-country expansion.
- Organization tables can be introduced for corporate account support without rewriting core user tables.
- Stateless JWT model is mobile app ready.
