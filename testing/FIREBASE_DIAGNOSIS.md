# Diagnóstico Firebase - Teste de Conexão

## ✅ **Configuração Confirmada**

**Project ID:** kimakudi-db ✓  
**API Key:** AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8 ✓  
**Auth Domain:** kimakudi-db.firebaseapp.com ✓

## 🔍 Problemas Identificados

O erro **404 Not Found** pode ocorrer por:
1. Firestore não está habilitado no projeto
2. Regras de segurança muito restritivas
3. API key não tem permissões suficientes
4. Região do Firestore diferente da padrão

## 🛠️ Comandos de Diagnóstico Específicos

### 1. Teste básico sem autenticação
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { testConnection(input: { type: FIREBASE, name: \"Kimakudi Test\", config: { apiUrl: \"kimakudi-db\" } }) { success message } }"
  }'
```

### 2. Teste com API key
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { testConnection(input: { type: FIREBASE, name: \"Kimakudi Test\", config: { apiUrl: \"kimakudi-db\", apiKey: \"AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8\" } }) { success message latency } }"
  }'
```

### 3. Teste direto da API Firebase (confirmar projeto existe)
```bash
curl "https://firebase.googleapis.com/v1beta1/projects/kimakudi-db?key=AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8"
```

### 4. Teste Firestore direto
```bash
curl "https://firestore.googleapis.com/v1/projects/kimakudi-db/databases/(default)/documents?key=AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8"
```

### 5. Teste com Authorization header
```bash
curl -H "Authorization: Bearer AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8" \
     "https://firestore.googleapis.com/v1/projects/kimakudi-db/databases/(default)/documents"
```

## 🔧 Possíveis Soluções

### Solução 1: Habilitar Firestore
1. Acesse: https://console.firebase.google.com/project/kimakudi-db
2. Vá para **Firestore Database**
3. Clique em **"Create database"** se não existir
4. Escolha modo de produção ou teste
5. Selecione uma região (recomendado: us-central1)

### Solução 2: Configurar Regras do Firestore
Configure regras temporárias para testes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;  // Apenas para testes
      allow write: if false; // Sem escrita
    }
  }
}
```

### Solução 3: Verificar Permissões da API Key
1. Acesse: https://console.cloud.google.com/apis/credentials?project=kimakudi-db
2. Encontre sua API key
3. Verifique se tem as APIs habilitadas:
   - Cloud Firestore API
   - Firebase Management API

### Solução 4: Teste com Região Específica
Se o Firestore estiver em região diferente da padrão:

```bash
curl "https://firestore.googleapis.com/v1/projects/kimakudi-db/databases/(default)/documents?key=AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8"
```

## 📋 Checklist de Verificação Atualizado

- [x] Project ID confirmado: "kimakudi-db"
- [x] API Key confirmada: "AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8"
- [ ] Firestore Database criado e ativo
- [ ] Regras de segurança configuradas
- [ ] APIs necessárias habilitadas
- [ ] Teste de conectividade direto realizado

## 🔍 Próximos Diagnósticos

Execute os comandos na ordem:

1. **Primeiro:** Teste direto da API Firebase para confirmar projeto
2. **Segundo:** Teste Firestore direto para confirmar banco
3. **Terceiro:** Teste via SmartBI com configurações corretas

## 💡 Resultado Esperado

Após configurar corretamente:

```json
{
  "data": {
    "testConnection": {
      "success": true,
      "message": "Firebase connection successful (Status: 200) - Project \"kimakudi-db\" exists",
      "latency": 150
    }
  }
}
```

**Execute os diagnósticos diretos primeiro! 🔍**