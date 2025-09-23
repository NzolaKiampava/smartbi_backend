# Quick Database Save Test Commands

## Test Firebase Connection Save

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateFirebaseConnection { createDataConnectionPublic(input: { type: FIREBASE, name: \"Test Firebase Save\", description: \"Testing database save\", config: { apiUrl: \"kimakudi-db\", apiKey: \"AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8\" } }) { id name type status description config { apiUrl } createdAt } }"
  }'
```

## Verify Connections List

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query ListConnections { getDataConnectionsPublic { id name type status description createdAt } }"
  }'
```

## Test MongoDB Connection Save

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateMongoConnection { createDataConnectionPublic(input: { type: MONGODB, name: \"Test MongoDB Save\", description: \"Testing MongoDB save\", config: { connectionString: \"mongodb://localhost:27017/testdb\" } }) { id name type status description createdAt } }"
  }'
```

## Expected Results

### If Database Enum is Updated (Success):
```json
{
  "data": {
    "createDataConnectionPublic": {
      "id": "uuid-here",
      "name": "Test Firebase Save",
      "type": "FIREBASE",
      "status": "INACTIVE",
      "description": "Testing database save",
      "config": {
        "apiUrl": "kimakudi-db"
      },
      "createdAt": "2025-09-19T..."
    }
  }
}
```

### If Database Enum Needs Update (Error):
```json
{
  "errors": [
    {
      "message": "invalid input value for enum connection_type: \"FIREBASE\"",
      "locations": [...],
      "path": ["createDataConnectionPublic"]
    }
  ]
}
```

## How to Fix Database Enum Error

If you get the enum error, run this SQL in your Supabase dashboard:

```sql
-- Add new connection types to the enum
ALTER TYPE connection_type ADD VALUE 'FIREBASE';
ALTER TYPE connection_type ADD VALUE 'MONGODB';
ALTER TYPE connection_type ADD VALUE 'REDIS';
ALTER TYPE connection_type ADD VALUE 'ELASTICSEARCH';
ALTER TYPE connection_type ADD VALUE 'CASSANDRA';
ALTER TYPE connection_type ADD VALUE 'DYNAMODB';
```

## Running the Tests

1. **Start the server**: `npm run dev`
2. **Run PowerShell script**: `.\testing\test-database-save.ps1`
3. **Or use Postman**: Import `SmartBI-Database-Save-Test.postman_collection.json`
4. **Or run curl commands**: Copy-paste the commands above

## Troubleshooting

- **Server not running**: Make sure `npm run dev` is running
- **Enum error**: Update database enum with SQL commands above
- **Connection test fails**: That's OK, we're testing database save, not external connection
- **GraphQL errors**: Check the response for specific error messages