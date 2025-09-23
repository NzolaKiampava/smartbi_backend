# Teste Firebase Kimakudi-DB - Passos Específicos

## ✅ **Informações Confirmadas**
- **Project ID:** kimakudi-db
- **API Key:** AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8

## 🔍 **Diagnóstico Passo a Passo**

### Passo 1: Verificar se o projeto Firebase existe
```bash
curl "https://firebase.googleapis.com/v1beta1/projects/kimakudi-db?key=AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8"
```

**Resultado esperado:** Status 200 com informações do projeto

### Passo 2: Verificar se Firestore existe e está ativo
```bash
curl "https://firestore.googleapis.com/v1/projects/kimakudi-db/databases/(default)/documents?key=AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8"
```

**Resultado esperado:** Status 200 ou 403 (não 404)

### Passo 3: Teste via SmartBI (sem API key primeiro)
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { testConnection(input: { type: FIREBASE, name: \"Kimakudi Test\", config: { apiUrl: \"kimakudi-db\" } }) { success message } }"
  }'
```

### Passo 4: Teste via SmartBI (com API key)
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { testConnection(input: { type: FIREBASE, name: \"Kimakudi Test\", config: { apiUrl: \"kimakudi-db\", apiKey: \"AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8\" } }) { success message latency } }"
  }'
```

## 🛠️ **Se o Passo 1 Falhar (404)**

O projeto pode não estar ativo ou a API key não tem permissões. Faça:

1. **Acesse o Firebase Console:**
   - https://console.firebase.google.com/project/kimakudi-db

2. **Verifique o status do projeto:**
   - Se aparece "Este projeto foi suspenso"
   - Se pede para ativar algum serviço

3. **Habilite Firestore:**
   - Vá para "Firestore Database"
   - Clique em "Create database" se necessário

## 🛠️ **Se o Passo 2 Falhar (404)**

Firestore não está criado. Faça:

1. **No Firebase Console:**
   - Vá para "Firestore Database"
   - Clique em "Create database"
   - Escolha "Start in test mode" (para facilitar)
   - Selecione região (ex: us-central1)

2. **Configure regras temporárias:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
    }
  }
}
```

## 🛠️ **Se os Passos 3-4 Falharem**

Problema no código do adapter. Vamos debugar:

1. **Verifique os logs do servidor SmartBI**
2. **Teste com outros tipos de conexão para confirmar que o sistema funciona**

## 🎯 **Ação Imediata Recomendada**

**Execute PRIMEIRO os comandos curl diretos (Passos 1 e 2) para confirmar se:**
- O projeto existe ✅
- O Firestore está ativo ✅
- A API key funciona ✅

**Depois execute os testes via SmartBI (Passos 3 e 4)**

## 📝 **Resultados dos Testes**

Anote aqui os resultados:

**Passo 1 (Firebase Project API):**
```
Status: ___
Response: ___
```

**Passo 2 (Firestore API):**
```
Status: ___
Response: ___
```

**Passo 3 (SmartBI sem key):**
```
Status: ___
Response: ___
```

**Passo 4 (SmartBI com key):**
```
Status: ___
Response: ___
```

**Vamos descobrir exatamente onde está o problema! 🔍**