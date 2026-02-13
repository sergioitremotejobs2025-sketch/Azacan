#!/bin/bash

# Configuration
PUBLIC_IP="34.135.120.2"
BASE_URL="http://$PUBLIC_IP"
NAMESPACE="libro-mind"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "===================================================="
echo "          LIBRO-MIND PRODUCTION SMOKE TEST          "
echo "===================================================="
echo "Target IP: $PUBLIC_IP"
echo ""

# 1. Frontend Check
echo -n "Test 1: Frontend Home Page... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}PASS (200 OK)${NC}"
else
    echo -e "${RED}FAIL (Status: $STATUS)${NC}"
fi

# 2. Backend Connectivity Check
echo -n "Test 2: Backend API (/api/books/)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/books/")
if [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}PASS (200 OK)${NC}"
else
    echo -e "${RED}FAIL (Status: $STATUS)${NC}"
fi

# 3. AI Pipeline Check (Non-Streaming)
echo -n "Test 3: AI Recommendation Engine (Standard)... "
RESPONSE=$(curl -s -X POST "$BASE_URL/api/recommend/query/" \
-H "Content-Type: application/json" \
-d '{"query": "history of Rome", "top_k": 1}')

if [[ "$RESPONSE" == *"recommendations"* ]] && [[ "$RESPONSE" == *"title"* ]]; then
    echo -e "${GREEN}PASS (Valid JSON returned)${NC}"
else
    echo -e "${RED}FAIL (Invalid response: $RESPONSE)${NC}"
fi

# 4. AI Pipeline Check (Streaming)
echo -n "Test 4: AI Recommendation Engine (Streaming)... "
# We check if it returns at least some data in chunks
STREAMS_COUNT=$(curl -s -N -X POST "$BASE_URL/api/recommend/query/stream/" \
-H "Content-Type: application/json" \
-d '{"query": "test query", "top_k": 1}' | head -c 20 | wc -c)

if [ "$STREAMS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}PASS (Stream active)${NC}"
else
    echo -e "${RED}FAIL (No stream data received)${NC}"
fi

# 5. Routing Check (Admin)
echo -n "Test 5: Admin Routing (/admin/)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin/")
if [ "$STATUS" == "302" ] || [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}PASS (Routing active)${NC}"
else
    echo -e "${RED}FAIL (Status: $STATUS)${NC}"
fi

# 6. Observability Check (Prometheus)
echo -n "Test 6: Prometheus Metrics Endpoint... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/prometheus/metrics")
if [ "$STATUS" == "200" ]; then
    echo -e "${GREEN}PASS (200 OK)${NC}"
else
    echo -e "${RED}FAIL (Status: $STATUS)${NC}"
fi

# 7. Cluster Health (kubectl)
echo ""
echo "Current Cluster Pod Status ($NAMESPACE):"
kubectl get pods -n $NAMESPACE

echo ""
echo "===================================================="
echo "          SMOKE TEST COMPLETED                      "
echo "===================================================="
