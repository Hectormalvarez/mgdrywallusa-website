---
paths:
  - "backend/**/*.py"
  - "frontend/src/**"
---
# Cross-Stack Synchronization

The backend (Wagtail/DRF) and frontend (Next.js) form one contract. Changes that cross it must touch both sides in the same change — a one-sided edit is a bug.

## Validation Parity

- Client-side validation (`frontend/src/features/leads/validation.ts`) and its constants (`constants.ts`) must stay exactly in sync with `backend/leads/serializers.py`: same regexes, same file-count/byte limits, same accepted MIME types, same tier values.
- Changing a limit or pattern on only one side is drift — always update both and note the contract in the commit body.

## API Shapes

- New or changed Wagtail model fields: add the `APIField` declaration in the backend model AND the matching TypeScript type in `frontend/src/types/`, plus update any `fields=` query strings in `src/lib/api.ts`.
- Normalize Wagtail response quirks (e.g. hoisting `meta.slug` to a top-level `slug`) in `src/lib/api.ts`, not inside components.
- The error contract is `{"errors": {field: [messages]}}` (see `core/exceptions.py`). Frontend consumers parse that shape — never change it without updating all consumers.

## Environment URLs

- Browser → backend: relative `NEXT_PUBLIC_*` URLs (routed by Nginx).
- SSR → backend: `WAGTAIL_API_BASE_URL` (Docker DNS, `http://backend:8000`) + `X-Forwarded-Proto: https` header.
- Adding an API surface requires wiring both layers and the corresponding `.env.sample` documentation.