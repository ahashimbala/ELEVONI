# Assistant daily limit: local development vs production

The daily limit is now configurable by backend environment.

| Environment | `NODE_ENV` | `ASSISTANT_DAILY_LIMIT` | Effective behaviour |
|---|---|---:|---|
| Local development | `development` | `0` | Unlimited prompts; quota database and session identity are not consulted |
| Production | `production` | `10` | 10 prompts per account/anonymous visitor per `Africa/Lagos` day |
| Production, if variable omitted | `production` | unset | Secure default of 10 prompts |
| Any environment | any | positive integer | Enforces that configured number |

## Local setup

In `backend/.env`, set:

```env
NODE_ENV=development
ASSISTANT_DAILY_LIMIT=0
```

The repository `backend/.env.example` now uses this local-development default.

## Production setup

In the backend production deployment environment, set:

```env
NODE_ENV=production
ASSISTANT_DAILY_LIMIT=10
ASSISTANT_DAILY_LIMIT_TIME_ZONE=Africa/Lagos
ASSISTANT_USAGE_HMAC_SECRET=<random secret, at least 32 characters>
```

Do not copy the local `.env` file to production. The cap is decided by backend environment variables, not by frontend hostname or client-supplied values. Local unlimited mode bypasses only this daily assistant quota; authentication, request validation, existing short-window rate limits and other security controls remain active.

## Verification

Focused tests cover the ten-prompt production default, explicit production limit, unlimited local development, invalid configuration and existing shared-account quota behaviour. Full production builds and live deployment still need to be run in the target environment.
