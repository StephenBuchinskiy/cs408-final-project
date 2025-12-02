API="https://96ibxsftp9.execute-api.us-east-2.amazonaws.com"

# 1: Create (POST /quests)
CREATE_RES=$(curl -sS -w "\n%{http_code}\n" -X POST "$API/quests" \
  -H "content-type: application/json" \
  -d '{
    "serverId": "s-123",
    "userId": "u-1",
    "username": "@stephen",
    "title": "Test Quest",
    "tags": ["school"]
}')
echo "$CREATE_RES"

# Extract id for later
QUEST_ID=$(echo "$CREATE_RES" | head -1 | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
echo "Created quest with id: $QUEST_ID"

# 2: LIST (GET /quests?serverId=s-123)
curl -sS -w "\n%{http_code}\n" -X GET "$API/quests?serverId=s-123"
# expected: 200

# 3: UPDATE (PATCH /quests/{id})
curl -sS -w "\n%{http_code}\n" -X PATCH "$API/quests/$QUEST_ID" \
  -H "content-type: application/json" \
  -d '{
    "status": "done",
    "kudos": 2
}'
# expected: 200

# 4: LEADERBOARD (GET /leaderboard?serverId=s-123)
curl -sS -w "\n%{http_code}\n" -X GET "$API/leaderboard?serverId=s-123&limit=10"
# expected: 200

#5: DELETE (DELETE /quests/{id})
curl -sS -w "\n%{http_code}\n" -X DELETE "$API/quests/$QUEST_ID"
# expected: 204

#6: VERIFY DELETION (GET /quests?serverId=s-123)
curl -sS -w "\n%{http_code}\n" -X GET "$API/quests?serverId=s-123"
# expected: item gone