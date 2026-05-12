#!/usr/bin/env bash
# Daily cleanup of E2E-test pollution from the live contractor_os DB.
#
# Live-smoke Playwright tests that need to create data use the prefix
# `e2e-test-<timestamp>-<random>@demo.contractoros.test`. This script
# deletes all rows that match that pattern across the user-facing tables.
# It is idempotent and safe to run manually at any time.
#
# Install on the VPS:
#   sudo install -m 0755 cleanup-e2e-test-data.sh /usr/local/bin/cleanup-e2e-test-data.sh
#   sudo crontab -e   # add the line shown in DEPLOYMENT_NOTES.md
#
# Required env (sourced from /var/www/contractoros/.env.api when the cron
# fires, or set manually for ad-hoc runs):
#   DATABASE_URL=postgresql://contractoros:<password>@localhost:5432/contractor_os
set -euo pipefail

ENV_FILE="${ENV_FILE:-/var/www/contractoros/.env.api}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL must be set (directly or via $ENV_FILE)}"

PATTERN='e2e-test-%@demo.contractoros.test'
LOG_TAG="cleanup-e2e-test-data"

run_sql() {
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -t -A -c "$1"
}

ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[$ts] $LOG_TAG: starting"

# Delete in dependency order — child rows first so FK constraints are happy.
# Every delete is scoped by joining back to a parent whose email matches
# the e2e-test-* pattern, so this script can never touch real data even
# if pollution leaks into unexpected tables.

# Refresh tokens for e2e-test users
deleted_refresh=$(run_sql "
  WITH d AS (
    DELETE FROM refresh_tokens
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '$PATTERN')
    RETURNING 1
  ) SELECT COUNT(*) FROM d;
")

# Notifications for e2e-test users
deleted_notifications=$(run_sql "
  WITH d AS (
    DELETE FROM notifications
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '$PATTERN')
    RETURNING 1
  ) SELECT COUNT(*) FROM d;
")

# Audit events written by e2e-test users
deleted_audit=$(run_sql "
  WITH d AS (
    DELETE FROM audit_events
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE '$PATTERN')
    RETURNING 1
  ) SELECT COUNT(*) FROM d;
")

# Contractors created via e2e-test emails
deleted_contractors=$(run_sql "
  WITH d AS (
    DELETE FROM contractors
    WHERE email LIKE '$PATTERN'
    RETURNING 1
  ) SELECT COUNT(*) FROM d;
")

# Users created via e2e-test emails
deleted_users=$(run_sql "
  WITH d AS (
    DELETE FROM users
    WHERE email LIKE '$PATTERN'
    RETURNING 1
  ) SELECT COUNT(*) FROM d;
")

# Organizations created via e2e-test slugs (slug naming convention: e2e-test-<…>)
deleted_orgs=$(run_sql "
  WITH d AS (
    DELETE FROM organizations
    WHERE slug LIKE 'e2e-test-%'
    RETURNING 1
  ) SELECT COUNT(*) FROM d;
")

ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[$ts] $LOG_TAG: done — refresh_tokens=${deleted_refresh} notifications=${deleted_notifications} audit_events=${deleted_audit} contractors=${deleted_contractors} users=${deleted_users} organizations=${deleted_orgs}"
