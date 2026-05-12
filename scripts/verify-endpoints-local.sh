#!/usr/bin/env bash
# Curl-based endpoint sweep against a LOCAL api running on http://localhost:3001.
# Captures status + time + a per-endpoint correctness assertion and prints a
# markdown results table to stdout (also written to e2e-results/curl-local.md
# when CURL_OUT is set).
#
# Usage:
#   bash scripts/verify-endpoints-local.sh
#   CURL_OUT=apps/web/playwright-report/curl-local.md bash scripts/verify-endpoints-local.sh
set -uo pipefail

BASE="${LOCAL_API_BASE:-http://localhost:3001/api/v1}"
ADMIN_EMAIL="${LOCAL_ADMIN_EMAIL:-admin@acme-corp.com}"
ADMIN_PASSWORD="${LOCAL_ADMIN_PASSWORD:-Password1}"

green=0; red=0; total=0
declare -a rows

probe() {
  local method="$1" path="$2" expect="$3" auth="${4:-no}" body="${5:-}"
  total=$((total + 1))
  local hdr=(-H 'Accept: application/json')
  if [[ "$auth" == "yes" && -n "${TOKEN:-}" ]]; then
    hdr+=(-H "Authorization: Bearer $TOKEN")
  fi
  local data_arg=()
  if [[ -n "$body" ]]; then
    hdr+=(-H 'Content-Type: application/json')
    data_arg=(--data "$body")
  fi
  local out
  out=$(curl -s -o /dev/null -w '%{http_code} %{time_total}' "${hdr[@]}" -X "$method" "${data_arg[@]}" "$BASE$path") || out="000 0"
  local code="${out%% *}"
  local time="${out##* }"
  local mark
  if [[ "$code" == "$expect" ]]; then
    mark="OK"; green=$((green + 1))
  else
    mark="MISMATCH"; red=$((red + 1))
  fi
  rows+=("| \`$method $path\` | $expect | $code | ${time}s | $mark |")
}

login() {
  local payload
  payload=$(printf '{"email":"%s","password":"%s"}' "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
  TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' -d "$payload" "$BASE/auth/login" \
    | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
  if [[ -z "$TOKEN" ]]; then
    echo "WARN: could not retrieve admin JWT — protected probes will all fail."
  fi
}

login

# Unauthenticated probes
probe GET    '/health'                      200 no
probe POST   '/auth/login'                  401 no '{"email":"nope@nope.com","password":"wrong"}'
probe GET    '/contractors'                 401 no
probe GET    '/invoices'                    401 no
probe GET    '/dashboard/stats'             401 no

# Authenticated probes (admin reads)
probe GET    '/contractors'                 200 yes
probe GET    '/invoices'                    200 yes
probe GET    '/offboarding'                 200 yes
probe GET    '/notifications'               200 yes
probe GET    '/organizations/settings'      200 yes
probe GET    '/dashboard/stats'             200 yes
probe GET    '/classification/dashboard'    200 yes
probe GET    '/audit-log'                   200 yes
probe GET    '/contractors/00000000-0000-4000-8000-deadbeefdead' 404 yes

OUT_PATH="${CURL_OUT:-}"
{
  echo "## curl-local — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo "Base: \`$BASE\` · total: $total · green: $green · red: $red"
  echo
  echo "| Endpoint | Expect | Got | Time | Result |"
  echo "|---|---|---|---|---|"
  for r in "${rows[@]}"; do echo "$r"; done
} | tee "${OUT_PATH:-/dev/null}"

[[ $red -eq 0 ]] || exit 1
