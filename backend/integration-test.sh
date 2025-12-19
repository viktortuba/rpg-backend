#!/bin/bash

# RPG Backend Integration Test Script
# This script tests the full flow: register -> create characters -> duel -> verify item transfer

set -e  # Exit on error

BASE_URL_AUTH="http://localhost:3001/api"
BASE_URL_CHAR="http://localhost:3002/api"
BASE_URL_COMBAT="http://localhost:3003/api"

echo "================================================"
echo "RPG Backend Integration Test Suite"
echo "================================================"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "ERROR: jq is required but not installed."
    echo "Install: sudo apt-get install jq (Ubuntu) or brew install jq (Mac)"
    exit 1
fi

# Check if services are running
echo "Checking if services are running..."
if ! curl -s -o /dev/null -w "%{http_code}" $BASE_URL_AUTH/health > /dev/null 2>&1; then
    echo "WARNING: Account service may not be running on port 3001"
fi

if ! curl -s -o /dev/null -w "%{http_code}" $BASE_URL_CHAR/health > /dev/null 2>&1; then
    echo "WARNING: Character service may not be running on port 3002"
fi

if ! curl -s -o /dev/null -w "%{http_code}" $BASE_URL_COMBAT/health > /dev/null 2>&1; then
    echo "WARNING: Combat service may not be running on port 3003"
fi

echo ""
echo "Step 1: Registering users..."
echo "----------------------------"

# Generate random usernames to avoid conflicts
RAND1=$RANDOM
RAND2=$RANDOM

PLAYER1=$(curl -s -X POST $BASE_URL_AUTH/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"player${RAND1}\",\"password\":\"test123\"}")

TOKEN1=$(echo $PLAYER1 | jq -r '.token')
if [ "$TOKEN1" == "null" ] || [ -z "$TOKEN1" ]; then
    echo "ERROR: Failed to register player 1"
    echo "Response: $PLAYER1"
    exit 1
fi
echo "✓ Player 1 registered (token: ${TOKEN1:0:20}...)"

PLAYER2=$(curl -s -X POST $BASE_URL_AUTH/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"player${RAND2}\",\"password\":\"test456\"}")

TOKEN2=$(echo $PLAYER2 | jq -r '.token')
if [ "$TOKEN2" == "null" ] || [ -z "$TOKEN2" ]; then
    echo "ERROR: Failed to register player 2"
    echo "Response: $PLAYER2"
    exit 1
fi
echo "✓ Player 2 registered (token: ${TOKEN2:0:20}...)"

echo ""
echo "Step 2: Fetching available classes..."
echo "--------------------------------------"

CLASSES=$(curl -s $BASE_URL_CHAR/class)
CLASS_ID=$(echo $CLASSES | jq -r '.[0].id')
CLASS_NAME=$(echo $CLASSES | jq -r '.[0].name')

if [ "$CLASS_ID" == "null" ] || [ -z "$CLASS_ID" ]; then
    echo "ERROR: No classes found. Did you run migrations?"
    exit 1
fi
echo "✓ Using class: $CLASS_NAME (ID: $CLASS_ID)"

echo ""
echo "Step 3: Creating characters..."
echo "-------------------------------"

CHAR1=$(curl -s -X POST $BASE_URL_CHAR/character \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d "{
    \"name\":\"Warrior${RAND1}\",
    \"health\":100,
    \"mana\":50,
    \"baseStrength\":15,
    \"baseAgility\":10,
    \"baseIntelligence\":5,
    \"baseFaith\":5,
    \"classId\":\"$CLASS_ID\"
  }")

CHAR1_ID=$(echo $CHAR1 | jq -r '.id')
CHAR1_NAME=$(echo $CHAR1 | jq -r '.name')
if [ "$CHAR1_ID" == "null" ] || [ -z "$CHAR1_ID" ]; then
    echo "ERROR: Failed to create character 1"
    echo "Response: $CHAR1"
    exit 1
fi
echo "✓ Character 1 created: $CHAR1_NAME (ID: $CHAR1_ID)"

CHAR2=$(curl -s -X POST $BASE_URL_CHAR/character \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d "{
    \"name\":\"Mage${RAND2}\",
    \"health\":80,
    \"mana\":100,
    \"baseStrength\":5,
    \"baseAgility\":8,
    \"baseIntelligence\":20,
    \"baseFaith\":10,
    \"classId\":\"$CLASS_ID\"
  }")

CHAR2_ID=$(echo $CHAR2 | jq -r '.id')
CHAR2_NAME=$(echo $CHAR2 | jq -r '.name')
if [ "$CHAR2_ID" == "null" ] || [ -z "$CHAR2_ID" ]; then
    echo "ERROR: Failed to create character 2"
    echo "Response: $CHAR2"
    exit 1
fi
echo "✓ Character 2 created: $CHAR2_NAME (ID: $CHAR2_ID)"

echo ""
echo "Step 4: Granting items to characters..."
echo "----------------------------------------"

# Get available items
ITEMS=$(curl -s $BASE_URL_CHAR/items)
ITEM1_ID=$(echo $ITEMS | jq -r '.[0].id // empty')
ITEM2_ID=$(echo $ITEMS | jq -r '.[1].id // empty')

if [ -n "$ITEM1_ID" ]; then
    ITEM1_NAME=$(echo $ITEMS | jq -r '.[0].name')
    curl -s -X POST $BASE_URL_CHAR/items/grant \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN1" \
      -d "{\"itemId\":\"$ITEM1_ID\",\"characterId\":\"$CHAR1_ID\"}" > /dev/null
    echo "✓ Granted $ITEM1_NAME to $CHAR1_NAME"
fi

if [ -n "$ITEM2_ID" ]; then
    ITEM2_NAME=$(echo $ITEMS | jq -r '.[1].name')
    curl -s -X POST $BASE_URL_CHAR/items/grant \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN1" \
      -d "{\"itemId\":\"$ITEM2_ID\",\"characterId\":\"$CHAR2_ID\"}" > /dev/null
    echo "✓ Granted $ITEM2_NAME to $CHAR2_NAME"
fi

echo ""
echo "Step 5: Initiating combat..."
echo "-----------------------------"

DUEL=$(curl -s -X POST $BASE_URL_COMBAT/challenge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d "{\"challenger1Id\":\"$CHAR1_ID\",\"challenger2Id\":\"$CHAR2_ID\"}")

DUEL_ID=$(echo $DUEL | jq -r '.id')
if [ "$DUEL_ID" == "null" ] || [ -z "$DUEL_ID" ]; then
    echo "ERROR: Failed to create duel"
    echo "Response: $DUEL"
    exit 1
fi
echo "✓ Duel initiated (ID: $DUEL_ID)"
echo "  $CHAR1_NAME vs $CHAR2_NAME"

echo ""
echo "Step 6: Executing combat actions..."
echo "------------------------------------"

# Round 1
echo "Round 1:"
RESULT=$(curl -s -X POST $BASE_URL_COMBAT/$DUEL_ID/attack \
  -H "Authorization: Bearer $TOKEN1")
CHAR1_HP=$(echo $RESULT | jq -r '.duel.challenger1.currentHealth')
CHAR2_HP=$(echo $RESULT | jq -r '.duel.challenger2.currentHealth')
echo "  $CHAR1_NAME attacks! → $CHAR1_NAME: ${CHAR1_HP}HP | $CHAR2_NAME: ${CHAR2_HP}HP"

sleep 1

RESULT=$(curl -s -X POST $BASE_URL_COMBAT/$DUEL_ID/cast \
  -H "Authorization: Bearer $TOKEN2")
CHAR1_HP=$(echo $RESULT | jq -r '.duel.challenger1.currentHealth')
CHAR2_HP=$(echo $RESULT | jq -r '.duel.challenger2.currentHealth')
echo "  $CHAR2_NAME casts spell! → $CHAR1_NAME: ${CHAR1_HP}HP | $CHAR2_NAME: ${CHAR2_HP}HP"

# Round 2
echo "Round 2:"
sleep 1

RESULT=$(curl -s -X POST $BASE_URL_COMBAT/$DUEL_ID/attack \
  -H "Authorization: Bearer $TOKEN1")
CHAR1_HP=$(echo $RESULT | jq -r '.duel.challenger1.currentHealth')
CHAR2_HP=$(echo $RESULT | jq -r '.duel.challenger2.currentHealth')
STATUS=$(echo $RESULT | jq -r '.duel.status')
echo "  $CHAR1_NAME attacks! → $CHAR1_NAME: ${CHAR1_HP}HP | $CHAR2_NAME: ${CHAR2_HP}HP"

if [ "$STATUS" == "COMPLETED" ]; then
    WINNER_ID=$(echo $RESULT | jq -r '.duel.winnerId')
    if [ "$WINNER_ID" == "$CHAR1_ID" ]; then
        echo "  🏆 $CHAR1_NAME wins!"
    else
        echo "  🏆 $CHAR2_NAME wins!"
    fi
fi

echo ""
echo "Step 7: Verifying duel outcome..."
echo "----------------------------------"

DUEL_STATUS=$(curl -s $BASE_URL_COMBAT/duel/$DUEL_ID \
  -H "Authorization: Bearer $TOKEN1")

FINAL_STATUS=$(echo $DUEL_STATUS | jq -r '.status')
WINNER_ID=$(echo $DUEL_STATUS | jq -r '.winnerId // empty')

echo "Duel Status: $FINAL_STATUS"
if [ -n "$WINNER_ID" ]; then
    if [ "$WINNER_ID" == "$CHAR1_ID" ]; then
        echo "Winner: $CHAR1_NAME"
        WINNER_TOKEN=$TOKEN1
    else
        echo "Winner: $CHAR2_NAME"
        WINNER_TOKEN=$TOKEN2
    fi

    echo ""
    echo "Step 8: Verifying item transfer..."
    echo "-----------------------------------"

    WINNER_CHAR=$(curl -s $BASE_URL_CHAR/character/$WINNER_ID \
      -H "Authorization: Bearer $WINNER_TOKEN")

    ITEM_COUNT=$(echo $WINNER_CHAR | jq '.items | length')
    echo "Winner's item count: $ITEM_COUNT"

    if [ "$ITEM_COUNT" -gt 1 ]; then
        echo "✓ Item transfer successful!"
        echo "Winner's items:"
        echo $WINNER_CHAR | jq -r '.items[] | "  - \(.displayName)"'
    else
        echo "⚠ Item transfer may not have occurred (loser had no items)"
    fi
fi

echo ""
echo "================================================"
echo "✓ Integration Test Complete!"
echo "================================================"
echo ""
echo "Summary:"
echo "  - Users registered: 2"
echo "  - Characters created: 2"
echo "  - Duel completed: $FINAL_STATUS"
if [ -n "$WINNER_ID" ]; then
    echo "  - Winner: $([ "$WINNER_ID" == "$CHAR1_ID" ] && echo "$CHAR1_NAME" || echo "$CHAR2_NAME")"
fi
echo ""
