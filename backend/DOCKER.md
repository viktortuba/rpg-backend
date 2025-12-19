# Docker Setup and Integration Testing Guide

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.9 or higher
- At least 4GB of RAM allocated to Docker

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure:

```bash
cp .env-example .env
```

Make sure to generate a strong JWT secret (instructions in .env-example).

### 2. Build and Start All Services

From the `backend` directory:

```bash
docker-compose up --build
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Account Service (port 3001)
- Character Service (port 3002)
- Combat Service (port 3003)

### 3. Run in Detached Mode

```bash
docker-compose up -d
```

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f account-service
docker-compose logs -f character-service
docker-compose logs -f combat-service
```

### 5. Stop Services

```bash
docker-compose down
```

### 6. Stop and Remove Volumes (Fresh Start)

```bash
docker-compose down -v
```

## Service Health Checks

The docker-compose configuration includes health checks for:
- **PostgreSQL**: Checks if database accepts connections
- **Redis**: Checks if Redis responds to PING

Services will wait for dependencies to be healthy before starting:
- Account Service waits for PostgreSQL
- Character Service waits for PostgreSQL and Redis
- Combat Service waits for PostgreSQL and Character Service

## Integration Testing

### Manual Integration Test Flow

#### 1. Register Users

```bash
# Register Player 1
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"pass123"}'

# Save the token from response
export TOKEN1="<token-from-response>"

# Register Player 2
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"player2","password":"pass456"}'

export TOKEN2="<token-from-response>"
```

#### 2. Create Characters

First, get available classes:

```bash
curl http://localhost:3002/api/class
```

Create characters:

```bash
# Player 1's character
curl -X POST http://localhost:3002/api/character \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{
    "name": "Warrior1",
    "health": 100,
    "mana": 50,
    "baseStrength": 15,
    "baseAgility": 10,
    "baseIntelligence": 5,
    "baseFaith": 5,
    "classId": "<class-id-from-previous-call>"
  }'

export CHAR1_ID="<character-id-from-response>"

# Player 2's character
curl -X POST http://localhost:3002/api/character \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d '{
    "name": "Mage1",
    "health": 80,
    "mana": 100,
    "baseStrength": 5,
    "baseAgility": 8,
    "baseIntelligence": 20,
    "baseFaith": 10,
    "classId": "<class-id-from-previous-call>"
  }'

export CHAR2_ID="<character-id-from-response>"
```

#### 3. Grant Items to Characters

```bash
# Get available items
curl http://localhost:3002/api/items

# Grant item to character 1
curl -X POST http://localhost:3002/api/items/grant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{
    "itemId": "<item-id>",
    "characterId": "'$CHAR1_ID'"
  }'
```

#### 4. Initiate Combat

```bash
curl -X POST http://localhost:3003/api/challenge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{
    "challenger1Id": "'$CHAR1_ID'",
    "challenger2Id": "'$CHAR2_ID'"
  }'

export DUEL_ID="<duel-id-from-response>"
```

#### 5. Execute Combat Actions

```bash
# Player 1 attacks (their turn first)
curl -X POST http://localhost:3003/api/$DUEL_ID/attack \
  -H "Authorization: Bearer $TOKEN1"

# Player 2 casts spell
curl -X POST http://localhost:3003/api/$DUEL_ID/cast \
  -H "Authorization: Bearer $TOKEN2"

# Player 1 heals
curl -X POST http://localhost:3003/api/$DUEL_ID/heal \
  -H "Authorization: Bearer $TOKEN1"

# Continue until one character's health reaches 0
```

#### 6. Verify Duel Outcome

```bash
curl http://localhost:3003/api/duel/$DUEL_ID \
  -H "Authorization: Bearer $TOKEN1"
```

#### 7. Verify Item Transfer

Check winner's character to see if they received an item:

```bash
curl http://localhost:3002/api/character/$CHAR1_ID \
  -H "Authorization: Bearer $TOKEN1"
```

### Automated Integration Test Script

Save this as `integration-test.sh`:

```bash
#!/bin/bash

BASE_URL_AUTH="http://localhost:3001/api"
BASE_URL_CHAR="http://localhost:3002/api"
BASE_URL_COMBAT="http://localhost:3003/api"

echo "=== Integration Test Suite ==="

# 1. Register users
echo "1. Registering users..."
PLAYER1=$(curl -s -X POST $BASE_URL_AUTH/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testplayer1","password":"test123"}')

TOKEN1=$(echo $PLAYER1 | jq -r '.token')
echo "Player 1 token: $TOKEN1"

PLAYER2=$(curl -s -X POST $BASE_URL_AUTH/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testplayer2","password":"test456"}')

TOKEN2=$(echo $PLAYER2 | jq -r '.token')
echo "Player 2 token: $TOKEN2"

# 2. Get classes
echo "2. Fetching classes..."
CLASSES=$(curl -s $BASE_URL_CHAR/class)
CLASS_ID=$(echo $CLASSES | jq -r '.[0].id')
echo "Using class ID: $CLASS_ID"

# 3. Create characters
echo "3. Creating characters..."
CHAR1=$(curl -s -X POST $BASE_URL_CHAR/character \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d "{\"name\":\"TestWarrior\",\"health\":100,\"mana\":50,\"baseStrength\":15,\"baseAgility\":10,\"baseIntelligence\":5,\"baseFaith\":5,\"classId\":\"$CLASS_ID\"}")

CHAR1_ID=$(echo $CHAR1 | jq -r '.id')
echo "Character 1 ID: $CHAR1_ID"

CHAR2=$(curl -s -X POST $BASE_URL_CHAR/character \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d "{\"name\":\"TestMage\",\"health\":80,\"mana\":100,\"baseStrength\":5,\"baseAgility\":8,\"baseIntelligence\":20,\"baseFaith\":10,\"classId\":\"$CLASS_ID\"}")

CHAR2_ID=$(echo $CHAR2 | jq -r '.id')
echo "Character 2 ID: $CHAR2_ID"

# 4. Start duel
echo "4. Starting duel..."
DUEL=$(curl -s -X POST $BASE_URL_COMBAT/challenge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d "{\"challenger1Id\":\"$CHAR1_ID\",\"challenger2Id\":\"$CHAR2_ID\"}")

DUEL_ID=$(echo $DUEL | jq -r '.id')
echo "Duel ID: $DUEL_ID"

# 5. Execute combat
echo "5. Executing combat..."
curl -s -X POST $BASE_URL_COMBAT/$DUEL_ID/attack \
  -H "Authorization: Bearer $TOKEN1"
echo "Player 1 attacked"

sleep 1

curl -s -X POST $BASE_URL_COMBAT/$DUEL_ID/cast \
  -H "Authorization: Bearer $TOKEN2"
echo "Player 2 cast spell"

# 6. Check duel status
echo "6. Checking duel status..."
DUEL_STATUS=$(curl -s $BASE_URL_COMBAT/duel/$DUEL_ID \
  -H "Authorization: Bearer $TOKEN1")
echo $DUEL_STATUS | jq '.'

echo "=== Integration Test Complete ==="
```

Make it executable:

```bash
chmod +x integration-test.sh
./integration-test.sh
```

## Troubleshooting

### Services Won't Start

Check logs:
```bash
docker-compose logs postgres
docker-compose logs redis
```

### Database Connection Errors

Ensure PostgreSQL is healthy:
```bash
docker-compose ps
```

All services should show "healthy" status.

### Port Already in Use

Change ports in docker-compose.yml if needed:
```yaml
ports:
  - "3011:3000"  # Change 3001 to 3011
```

### Rebuild After Code Changes

```bash
docker-compose up --build
```

### Reset Everything

```bash
docker-compose down -v
docker-compose up --build
```

## Development Workflow

### Hot Reload

The docker-compose configuration uses `npm run dev` which includes hot reload via `ts-node-dev`. Changes to source files will automatically restart the service.

### Run Migrations

```bash
# Account Service
docker-compose exec account-service npm run migration:run

# Character Service
docker-compose exec character-service npm run migration:run

# Combat Service
docker-compose exec combat-service npm run migration:run
```

### Access Database

```bash
docker-compose exec postgres psql -U postgres -d game_db
```

### Access Redis CLI

```bash
docker-compose exec redis redis-cli
```

## Testing Cross-Service Communication

### Test JWT Authentication Across Services

1. Register in Account Service (get JWT)
2. Use JWT to create character in Character Service
3. Verify Character Service validates the JWT correctly

### Test Combat Service → Character Service Communication

1. Create duel
2. Complete duel (winner emerges)
3. Check Combat Service logs for Character Service API calls
4. Verify item was transferred via Character Service

### Test Redis Caching

1. Get character details (cache miss)
2. Get same character again (cache hit - check logs)
3. Update character (grant item)
4. Get character details (cache invalidated, new data)

## Performance Testing

### Load Test with Apache Bench

```bash
# Install apache2-utils
# Ubuntu: sudo apt-get install apache2-utils
# Mac: brew install httpd

# Test registration endpoint
ab -n 100 -c 10 -p register.json -T application/json \
  http://localhost:3001/api/auth/register
```

### Monitor Resource Usage

```bash
docker stats
```

## Production Considerations

1. **Environment Variables**: Never commit .env with real secrets
2. **Health Checks**: Ensure all services have proper health endpoints
3. **Logging**: Use structured logging (JSON format)
4. **Monitoring**: Add Prometheus/Grafana for metrics
5. **Scaling**: Use `docker-compose up --scale character-service=3`
6. **Database Migrations**: Run migrations before starting services
7. **Secrets Management**: Use Docker secrets or vault in production
