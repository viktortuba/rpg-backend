# RPG Backend - Postman Collection

This folder contains Postman collection and environment files for testing the RPG Backend API.

## Files

- `RPG-Backend-API.postman_collection.json` - Complete API collection with all endpoints
- `RPG-Backend.postman_environment.json` - Environment variables for local development

## How to Import

### 1. Import the Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select `RPG-Backend-API.postman_collection.json`
4. Click **Import**

### 2. Import the Environment

1. Click **Import** button again
2. Select `RPG-Backend.postman_environment.json`
3. Click **Import**

### 3. Select the Environment

1. In the top-right corner, select **RPG Backend - Local** from the environment dropdown
2. You should see it's now active

## How to Use

### Quick Start - Full Flow Test

Follow these requests in order to test the complete flow:

#### Step 1: Account Service
1. **Register User 1** - Creates first user and saves token automatically
2. **Register User 2** - Creates second user and saves token automatically
3. **Register Game Master** - Creates GM user and saves token automatically

#### Step 2: Character Service
4. **Get All Classes** - Fetches available classes and saves Warrior class ID
5. **Create Character 1 (User 1)** - Creates warrior for user 1, saves character ID
6. **Create Character 2 (User 2)** - Creates warrior for user 2, saves character ID
7. **Get Character 1 Details** - View character 1 full details
8. **Get Character 2 Details** - View character 2 full details

#### Step 3: Combat Service
9. **Create Duel (GM)** - GM creates duel between the two characters, saves duel ID
10. **Get Duel Status** - Check current duel state
11. **User 1 - Attack** - User 1's character attacks
12. **User 2 - Attack** - User 2's character attacks
13. **User 1 - Cast Spell** - User 1 casts a spell (2s cooldown)
14. **User 2 - Heal** - User 2 heals (2s cooldown)
15. **Get Duel Status** - Check final duel state
16. **Get Duel Logs** - View complete combat log

## Automatic Variable Management

The collection uses **Test Scripts** to automatically save important data:

- **Tokens**: Automatically saved when you register/login
- **User IDs**: Saved from registration responses
- **Character IDs**: Saved when characters are created
- **Class IDs**: Saved when fetching classes
- **Duel ID**: Saved when duel is created

All subsequent requests automatically use these saved variables!

## Environment Variables

The environment contains these variables:

### Service URLs
- `account_service_url`: http://localhost:3001
- `character_service_url`: http://localhost:3002
- `combat_service_url`: http://localhost:3003

### Authentication Tokens (auto-populated)
- `user1_token`: Bearer token for user 1
- `user2_token`: Bearer token for user 2
- `gm_token`: Bearer token for game master

### IDs (auto-populated)
- `user1_id`: User 1's account ID
- `user2_id`: User 2's account ID
- `gm_id`: Game Master's account ID
- `warrior_class_id`: Warrior class ID
- `character1_id`: Character 1 ID
- `character2_id`: Character 2 ID
- `duel_id`: Active duel ID

## Tips

### Viewing Environment Variables
1. Click the **eye icon** (👁️) next to the environment dropdown
2. You'll see all current values
3. Variables populated by test scripts appear here after running requests

### Manual Token Usage
If you need to manually copy a token:
1. Run the register/login request
2. Copy the `token` from the response
3. It's already saved automatically in the environment!

### Testing Combat Flow
Combat has turn-based mechanics:
- Turn alternates after each action
- Cast and Heal have 2-second cooldowns
- Attack has no cooldown
- Character 1 always goes first

### Authorization
- Most endpoints require `Authorization: Bearer <token>` header
- The collection automatically uses the correct token for each request
- User 1 token is used for Character 1 actions
- User 2 token is used for Character 2 actions
- GM token is used for creating duels and viewing all data

## Troubleshooting

### "Unauthorized" or 401 Error
- Make sure you ran "Register User 1/2" or "Login User 1/2" first
- Check that the token was saved (view environment variables)
- Tokens expire after 24 hours - re-login if needed

### "Character not found" or missing IDs
- Make sure you ran the setup requests in order
- Check environment variables to see if IDs were saved
- Re-run the "Create Character" requests if needed

### "Service unavailable" or connection errors
- Make sure all Docker containers are running: `docker-compose ps`
- Check service logs: `docker-compose logs <service-name>`
- Verify ports are correct: 3001 (account), 3002 (character), 3003 (combat)

## API Endpoints Summary

### Account Service (Port 3001)
- POST `/api/account/register` - Register new user
- POST `/api/account/login` - Login existing user

### Character Service (Port 3002)
- GET `/api/classes` - Get all character classes
- POST `/api/character` - Create new character
- GET `/api/character/:id` - Get character details
- GET `/api/characters` - Get all characters (GM only)

### Combat Service (Port 3003)
- POST `/api/combat/duel` - Create new duel
- GET `/api/combat/duel/:id` - Get duel status
- POST `/api/combat/duel/:id/attack` - Perform attack
- POST `/api/combat/duel/:id/cast` - Cast spell (2s cooldown)
- POST `/api/combat/duel/:id/heal` - Heal self (2s cooldown)
- GET `/api/combat/duel/:id/logs` - Get combat logs

## Notes

- All timestamps are in ISO 8601 format
- IDs are UUIDs (v4)
- JWT tokens are valid for 24 hours
- Character stats are cached at duel creation (prevents mid-combat changes)
- Duels timeout after 5 minutes
