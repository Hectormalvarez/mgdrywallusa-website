.PHONY: dev-up dev-down dev-reset dev-health dev-logs test lint format typecheck check prod-deploy prod-seed prod-logs prod-status prod-verify env-check

# ─── Development ───────────────────────────────────────────────
dev-up:
	docker compose --env-file .env up -d --build
	docker compose ps

dev-down:
	docker compose down

# ─── Reset dev environment (removes anonymous volumes so node_modules resync) ──
dev-reset:
	@echo "\033[0;36m▶ Stopping dev containers and clearing anonymous volumes...\033[0m"
	docker compose down -v
	@echo "\033[0;36m▶ Rebuilding frontend image and restarting stack...\033[0m"
	docker compose --env-file .env up -d --build
	@echo "\033[0;32m✓ Dev stack reset. Run 'make dev-health' to verify.\033[0m"

# ─── Quick health check for dev stack ──
dev-health:
	@DEV_URL="$${DEV_URL:-https://mgdrywallusa-dev.taylormadetech.net}"; \
	echo "\033[0;36m▶ Checking dev stack on $$DEV_URL...\033[0m"; \
	curl -sf "$$DEV_URL/" > /dev/null && echo "\033[0;32m✓ Frontend: OK\033[0m" || echo "\033[0;31m✗ Frontend: FAIL\033[0m"; \
	curl -sf "$$DEV_URL/api/v1/settings/" > /dev/null && echo "\033[0;32m✓ Backend API: OK\033[0m" || echo "\033[0;31m✗ Backend API: FAIL\033[0m"

dev-logs:
	docker compose logs -f

# ─── Dev quality gates (run on host, no Docker required) ──────────
test:
	@echo "\033[0;36m▶ Running backend tests...\033[0m"
	cd backend && python -m pytest -v --tb=short
	@echo "\033[0;36m▶ Running frontend tests...\033[0m"
	cd frontend && npm test
	@echo "\033[0;32m✓ All tests passed.\033[0m"

lint:
	@echo "\033[0;36m▶ Linting backend (ruff)...\033[0m"
	cd backend && ruff check .
	@echo "\033[0;36m▶ Linting frontend (eslint)...\033[0m"
	cd frontend && npm run lint
	@echo "\033[0;32m✓ Lint passed.\033[0m"

format:
	@echo "\033[0;36m▶ Formatting backend (ruff)...\033[0m"
	cd backend && ruff format . && ruff check --fix .
	@echo "\033[0;36m▶ Formatting frontend (eslint --fix)...\033[0m"
	cd frontend && npm run lint:fix
	@echo "\033[0;32m✓ Formatted.\033[0m"

typecheck:
	@echo "\033[0;36m▶ Type checking frontend (tsc)...\033[0m"
	cd frontend && npx tsc --noEmit
	@echo "\033[0;32m✓ Types OK.\033[0m"

check: lint typecheck test
	@echo "\033[0;32m✓ Full check passed (lint + types + tests).\033[0m"

# ─── Production (zero-data-loss atomic replacement) ─────────────
prod-deploy:
	@test -f .env.prod || { echo "\033[0;31mError: .env.prod file missing. Aborting.\033[0m"; exit 1; }
	@echo "\033[0;36m\u25b6 Building and replacing production containers...\033[0m"
	docker compose -p mgdrywall-prod -f docker-compose.prod.yml --env-file .env.prod up -d --build --remove-orphans
	@echo "\033[0;36m\u25b6 Waiting for backend health check...\033[0m"
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do \
		if docker compose -p mgdrywall-prod -f docker-compose.prod.yml exec -T backend python manage.py check --deploy 2>/dev/null; then \
			echo "\033[0;32m\u2713 Backend is healthy.\033[0m"; break; \
		fi; \
		echo "  Waiting... ($$i/20)"; sleep 3; \
	done
	@docker compose -p mgdrywall-prod -f docker-compose.prod.yml ps

prod-seed:
	@echo "\033[0;36m\u25b6 Running seed_defaults on production...\033[0m"
	docker compose -p mgdrywall-prod -f docker-compose.prod.yml exec backend python manage.py seed_defaults

prod-logs:
	docker compose -p mgdrywall-prod -f docker-compose.prod.yml logs -f

prod-status:
	docker compose -p mgdrywall-prod -f docker-compose.prod.yml ps

prod-verify:
	@echo "\033[0;36m\u25b6 Verifying single-origin responses on localhost:9417...\033[0m"
	@curl -sf "http://localhost:9417/api/v1/pages/?type=home.HomePage" > /dev/null && echo "\033[0;32m\u2713 Pages API: OK\033[0m" || echo "\033[0;31m\u2717 Pages API: FAIL\033[0m"
	@curl -sf "http://localhost:9417/api/v1/settings/" > /dev/null && echo "\033[0;32m\u2713 Settings API: OK\033[0m" || echo "\033[0;31m\u2717 Settings API: FAIL\033[0m"
	@curl -sf "http://localhost:9417/" > /dev/null && echo "\033[0;32m\u2713 Frontend: OK\033[0m" || echo "\033[0;31m\u2717 Frontend: FAIL\033[0m"

# ─── Environment guard (catches misconfigured env before Docker starts) ──
env-check:
	@echo "\033[0;36m\u25b6 Checking .env.prod values...\033[0m"
	@grep -q 'DEBUG=False' .env.prod && echo "\033[0;32m\u2713 DEBUG=False\033[0m" || echo "\033[0;31m\u2717 DEBUG is not False!\033[0m"
	@grep -q 'replace-with-strong-password' .env.prod && echo "\033[0;31m\u2717 Default password still present!\033[0m" || echo "\033[0;32m\u2713 Production passwords set\033[0m"
	@echo "\033[0;32m\u2713 Environment check complete.\033[0m"
