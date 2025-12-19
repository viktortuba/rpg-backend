#!/bin/bash

# Integration Test Script for RPG Backend
# Tests the full flow: Register → Create Character → Combat

set -e

BASE_URL="http://localhost"
ACCOUNT_SERVICE="$BASE_URL:3001"
CHARACTER_SERVICE="$BASE_URL:3002"
COMBAT_SERVICE="$BASE_URL:3003"

echo "================================"
echo "RPG Backend Integration Test"
echo "================================"
echo ""

# Generate unique usernames with timestamp
TIMESTAMP=$(date +%s)
USER1_NAME="player1_$TIMESTAMP"
USER2_NAME="player2_$TIMESTAMP"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    local expected_status="$5"
    local auth_token="$6"

    echo -e "${BLUE}Testing: $name${NC}"

    if [ -n "$auth_token" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $auth_token" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body"
        echo ""
        echo "$body" > /tmp/last_response.json
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "Response: $body"
        echo ""
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "=== 1. Account Service Tests ==="
echo ""

# Register User 1
test_endpoint "Register User 1" "POST" "$ACCOUNT_SERVICE/api/auth/register" \
    "{\"username\":\"$USER1_NAME\",\"password\":\"password123\"}" "201"
USER1_TOKEN=$(cat /tmp/last_response.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "User 1 Token: ${USER1_TOKEN:0:20}..."
echo ""

# Register User 2
test_endpoint "Register User 2" "POST" "$ACCOUNT_SERVICE/api/auth/register" \
    "{\"username\":\"$USER2_NAME\",\"password\":\"password123\"}" "201"
USER2_TOKEN=$(cat /tmp/last_response.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "User 2 Token: ${USER2_TOKEN:0:20}..."
echo ""

# Login User 1
test_endpoint "Login User 1" "POST" "$ACCOUNT_SERVICE/api/auth/login" \
    "{\"username\":\"$USER1_NAME\",\"password\":\"password123\"}" "200"
echo ""

# Register Game Master
test_endpoint "Register Game Master" "POST" "$ACCOUNT_SERVICE/api/auth/register" \
    "{\"username\":\"gm_$TIMESTAMP\",\"password\":\"password123\",\"role\":\"GameMaster\"}" "201"
GM_TOKEN=$(cat /tmp/last_response.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "GM Token: ${GM_TOKEN:0:20}..."
echo ""

echo "=== 2. Character Service Tests ==="
echo ""

# Get Warrior Class ID from database
echo -e "${BLUE}Getting Warrior Class ID from database${NC}"
WARRIOR_CLASS_ID=$(docker exec backend-postgres-1 psql -U postgres -d game_db -t -c "SELECT id FROM classes WHERE name='Warrior' LIMIT 1;" | tr -d ' \n')
echo "Warrior Class ID: $WARRIOR_CLASS_ID"
echo ""

# Create Character for User 1
test_endpoint "Create Character 1 (Warrior)" "POST" "$CHARACTER_SERVICE/api/character" \
    "{\"name\":\"BraveWarrior_$TIMESTAMP\",\"health\":100,\"mana\":50,\"baseStrength\":20,\"baseAgility\":10,\"baseIntelligence\":5,\"baseFaith\":5,\"classId\":\"$WARRIOR_CLASS_ID\"}" \
    "201" "$USER1_TOKEN"
CHAR1_ID=$(cat /tmp/last_response.json | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Character 1 ID: $CHAR1_ID"
echo ""

# Create Character for User 2
test_endpoint "Create Character 2 (Warrior)" "POST" "$CHARACTER_SERVICE/api/character" \
    "{\"name\":\"MightyWarrior_$TIMESTAMP\",\"health\":100,\"mana\":50,\"baseStrength\":18,\"baseAgility\":12,\"baseIntelligence\":5,\"baseFaith\":5,\"classId\":\"$WARRIOR_CLASS_ID\"}" \
    "201" "$USER2_TOKEN"
CHAR2_ID=$(cat /tmp/last_response.json | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Character 2 ID: $CHAR2_ID"
echo ""

# Get Character Details
test_endpoint "Get Character 1 Details" "GET" "$CHARACTER_SERVICE/api/character/$CHAR1_ID" "" "200" "$USER1_TOKEN"
echo ""

echo "=== 3. Combat Service Tests ==="
echo ""

# Create Duel (as Game Master to bypass ownership checks)
test_endpoint "Create Duel" "POST" "$COMBAT_SERVICE/api/challenge" \
    "{\"challenger1Id\":\"$CHAR1_ID\",\"challenger2Id\":\"$CHAR2_ID\"}" \
    "201" "$GM_TOKEN"
DUEL_ID=$(cat /tmp/last_response.json | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Duel ID: $DUEL_ID"
echo ""

# Get Duel Status (as GM)
test_endpoint "Get Duel Status" "GET" "$COMBAT_SERVICE/api/duel/$DUEL_ID" "" "200" "$GM_TOKEN"
echo ""

# User 1 Attacks (Turn 1)
test_endpoint "User 1 Attacks" "POST" "$COMBAT_SERVICE/api/$DUEL_ID/attack" "" "200" "$USER1_TOKEN"
echo ""

# User 2 Attacks (Turn 2)
test_endpoint "User 2 Attacks" "POST" "$COMBAT_SERVICE/api/$DUEL_ID/attack" "" "200" "$USER2_TOKEN"
echo ""

# User 1 Casts (Turn 3)
test_endpoint "User 1 Casts Spell" "POST" "$COMBAT_SERVICE/api/$DUEL_ID/cast" "" "200" "$USER1_TOKEN"
echo ""

# Wait for cooldown (2 seconds)
echo "Waiting 2 seconds for cooldown..."
sleep 2
echo ""

# User 2 Heals (Turn 4)
test_endpoint "User 2 Heals" "POST" "$COMBAT_SERVICE/api/$DUEL_ID/heal" "" "200" "$USER2_TOKEN"
echo ""

# Get Final Duel Status (as GM)
test_endpoint "Get Final Duel Status" "GET" "$COMBAT_SERVICE/api/duel/$DUEL_ID" "" "200" "$GM_TOKEN"
echo ""

echo "=== 4. Item Management Tests ==="
echo ""

# Get Available Items
test_endpoint "Get Available Items" "GET" "$CHARACTER_SERVICE/api/items" "" "200" "$USER1_TOKEN"
ITEM_ID=$(cat /tmp/last_response.json | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "First Item ID: $ITEM_ID"
echo ""

# Grant Item to Character (GameMaster only - will fail for regular user)
echo -e "${BLUE}Testing: Grant Item (Expected to fail for regular user)${NC}"
curl -s -X POST "$CHARACTER_SERVICE/api/items/grant" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER1_TOKEN" \
    -d "{\"itemId\":\"$ITEM_ID\",\"characterId\":\"$CHAR1_ID\"}" | head -20
echo ""
echo ""

echo "================================"
echo "Test Summary"
echo "================================"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All integration tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
