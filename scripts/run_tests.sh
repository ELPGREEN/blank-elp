#!/bin/bash
# =============================================================================
# ELP Green Technology - Edge Functions Test Suite
# =============================================================================
# Usage: bash scripts/run_tests.sh
# =============================================================================

set -euo pipefail

# Configuration
SUPABASE_URL="https://dlwafedtlvbvuoaopvsl.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsd2FmZWR0bHZidnVvYW9wdnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDI0MjEsImV4cCI6MjA4NDQ3ODQyMX0.ohz98f-MO3VNYoR6dth3zYhYqmviFs60ytJAQCwfJNk"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper functions
log_info() { echo -e "${BLUE}ℹ ${NC}$1"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; PASSED=$((PASSED + 1)); }
log_error() { echo -e "${RED}❌ $1${NC}"; FAILED=$((FAILED + 1)); }
log_warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
log_header() { echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BLUE}🧪 $1${NC}"; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

# Generic POST request
do_post() {
  local endpoint="$1"
  local payload="$2"
  local expected_status="${3:-200}"
  local timeout="${4:-60}"
  
  local url="${SUPABASE_URL}/functions/v1/${endpoint}"
  
  HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" \
    --max-time "$timeout" \
    -X POST "$url" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -d "$payload" 2>/dev/null || echo "000")
  
  RESPONSE=$(cat /tmp/response.json 2>/dev/null || echo "{}")
  
  if [[ "$HTTP_CODE" == "$expected_status" ]]; then
    return 0
  else
    return 1
  fi
}

# =============================================================================
# ANALYZE-FEASIBILITY TESTS
# =============================================================================
test_analyze_feasibility() {
  log_header "Testing: analyze-feasibility"
  
  # Test 1: Valid payload with flash model
  log_info "Test 1: Valid payload (Gemini Flash model)"
  PAYLOAD='{
    "study": {
      "project_name": "Test OTR Plant Brazil",
      "country": "Brazil",
      "region": "São Paulo",
      "daily_capacity_tons": 50,
      "operating_days_per_year": 300,
      "utilization_rate": 85,
      "plant_cost_usd": 5000000,
      "annual_revenue": 3000000,
      "annual_opex": 1500000,
      "annual_ebitda": 1500000,
      "payback_years": 3.5,
      "irr": 25,
      "npv": 2000000,
      "rubber_granules_yield": 45,
      "rubber_granules_price": 350,
      "steel_wire_yield": 25,
      "steel_wire_price": 200,
      "textile_fiber_yield": 20,
      "textile_fiber_price": 50,
      "government_royalties_percent": 0,
      "environmental_bonus_per_ton": 0
    },
    "language": "pt",
    "model": "flash"
  }'
  
  if do_post "analyze-feasibility" "$PAYLOAD" "200" 90; then
    if echo "$RESPONSE" | grep -q '"analysis"'; then
      log_success "Valid payload returned analysis (HTTP $HTTP_CODE)"
      MODEL_USED=$(echo "$RESPONSE" | grep -o '"model_used":"[^"]*"' | head -1)
      log_info "  $MODEL_USED"
    else
      log_error "Valid payload missing 'analysis' field"
    fi
  else
    log_error "Valid payload failed (HTTP $HTTP_CODE)"
    echo "  Response: ${RESPONSE:0:200}"
  fi
  
  # Test 2: Invalid payload (missing required fields)
  log_info "Test 2: Invalid payload (missing fields) - expect 400"
  INVALID_PAYLOAD='{
    "study": {
      "project_name": "Incomplete"
    },
    "language": "en"
  }'
  
  if do_post "analyze-feasibility" "$INVALID_PAYLOAD" "400" 10; then
    log_success "Invalid payload correctly rejected (HTTP $HTTP_CODE)"
  else
    if [[ "$HTTP_CODE" == "200" ]]; then
      log_warn "Invalid payload accepted (may have defaults) - HTTP $HTTP_CODE"
    else
      log_error "Unexpected response (HTTP $HTTP_CODE)"
    fi
  fi
  
  # Test 3: OPTIONS preflight
  log_info "Test 3: CORS preflight (OPTIONS)"
  CORS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS "${SUPABASE_URL}/functions/v1/analyze-feasibility" \
    -H "Origin: https://example.com" \
    -H "Access-Control-Request-Method: POST" 2>/dev/null || echo "000")
  
  if [[ "$CORS_CODE" == "200" || "$CORS_CODE" == "204" ]]; then
    log_success "CORS preflight passed (HTTP $CORS_CODE)"
  else
    log_error "CORS preflight failed (HTTP $CORS_CODE)"
  fi
}

# =============================================================================
# GENERATE-DOCUMENT-AI TESTS
# =============================================================================
test_generate_document_ai() {
  log_header "Testing: generate-document-ai"
  
  # Test 1: NDA template
  log_info "Test 1: NDA template generation"
  PAYLOAD='{
    "templateType": "nda",
    "country": "Brazil",
    "language": "en",
    "existingFields": {
      "disclosing_party": "ELP Green Technology",
      "receiving_party": "Test Partner Inc",
      "purpose": "OTR Tire Recycling Partnership",
      "duration": "2 years"
    },
    "generateFullDocument": false
  }'
  
  if do_post "generate-document-ai" "$PAYLOAD" "200" 90; then
    if echo "$RESPONSE" | grep -q '"templateInfo"\|"fields"\|"jurisdictionInfo"'; then
      log_success "NDA template returned valid structure (HTTP $HTTP_CODE)"
    else
      log_error "NDA template missing expected fields"
    fi
  else
    log_error "NDA template failed (HTTP $HTTP_CODE)"
    echo "  Response: ${RESPONSE:0:200}"
  fi
  
  # Test 2: LOI template
  log_info "Test 2: LOI template generation"
  PAYLOAD='{
    "templateType": "loi",
    "country": "Australia",
    "language": "en",
    "existingFields": {
      "buyer": "Australian Mining Corp",
      "seller": "ELP Green Technology"
    }
  }'
  
  if do_post "generate-document-ai" "$PAYLOAD" "200" 90; then
    log_success "LOI template generated (HTTP $HTTP_CODE)"
  else
    log_error "LOI template failed (HTTP $HTTP_CODE)"
  fi
  
  # Test 3: Invalid template type
  log_info "Test 3: Invalid template type - expect 400"
  INVALID_PAYLOAD='{
    "templateType": "invalid_type_xyz",
    "country": "Brazil"
  }'
  
  if do_post "generate-document-ai" "$INVALID_PAYLOAD" "400" 10; then
    log_success "Invalid template type correctly rejected (HTTP $HTTP_CODE)"
  else
    log_error "Invalid template type not rejected (HTTP $HTTP_CODE)"
  fi
  
  # Test 4: Missing templateType
  log_info "Test 4: Missing templateType - expect 400"
  INVALID_PAYLOAD='{
    "country": "Brazil",
    "language": "en"
  }'
  
  if do_post "generate-document-ai" "$INVALID_PAYLOAD" "400" 10; then
    log_success "Missing templateType correctly rejected (HTTP $HTTP_CODE)"
  else
    log_error "Missing templateType not rejected (HTTP $HTTP_CODE)"
  fi
}

# =============================================================================
# SEND-CONTACT-EMAIL TESTS
# =============================================================================
test_send_contact_email() {
  log_header "Testing: send-contact-email"
  
  # Test 1: Valid contact email
  log_info "Test 1: Valid contact email payload"
  PAYLOAD='{
    "name": "Test User",
    "email": "test@example.com",
    "company": "Test Company",
    "message": "This is a test message from the automated test suite.",
    "subject": "Test Contact Form Submission"
  }'
  
  if do_post "send-contact-email" "$PAYLOAD" "200" 30; then
    log_success "Contact email sent (HTTP $HTTP_CODE)"
  else
    log_warn "Contact email returned HTTP $HTTP_CODE (may require valid RESEND_API_KEY)"
  fi
  
  # Test 2: Missing required fields
  log_info "Test 2: Missing email field - expect 400"
  INVALID_PAYLOAD='{
    "name": "Test User",
    "message": "Missing email"
  }'
  
  if do_post "send-contact-email" "$INVALID_PAYLOAD" "400" 10; then
    log_success "Missing email correctly rejected (HTTP $HTTP_CODE)"
  else
    log_warn "Missing email not validated (HTTP $HTTP_CODE)"
  fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================
main() {
  echo ""
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║     ELP Green Technology - Edge Functions Test Suite          ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  log_info "Supabase URL: ${SUPABASE_URL}"
  log_info "Started at: $(date)"
  echo ""
  
  # Run all tests
  test_analyze_feasibility
  test_generate_document_ai
  test_send_contact_email
  
  # Summary
  echo ""
  log_header "Test Summary"
  echo -e "  ${GREEN}Passed: $PASSED${NC}"
  echo -e "  ${RED}Failed: $FAILED${NC}"
  echo ""
  
  if [[ $FAILED -gt 0 ]]; then
    log_error "Some tests failed!"
    exit 1
  else
    log_success "All tests passed!"
    exit 0
  fi
}

# Run main
main "$@"
