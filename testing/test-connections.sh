#!/bin/bash
# Script Bash para testar conexões SmartBI
# Teste rápido dos principais tipos de conexão

BASE_URL="http://localhost:4000"
GRAPHQL_URL="$BASE_URL/graphql"
TEST_ALL=false
CONNECTION_TYPE=""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            TEST_ALL=true
            shift
            ;;
        --type)
            CONNECTION_TYPE="$2"
            shift 2
            ;;
        --url)
            BASE_URL="$2"
            GRAPHQL_URL="$BASE_URL/graphql"
            shift 2
            ;;
        -h|--help)
            echo "Uso: $0 [opções]"
            echo "Opções:"
            echo "  --all           Testa todas as conexões"
            echo "  --type TYPE     Testa apenas um tipo específico"
            echo "  --url URL       URL base do servidor (padrão: http://localhost:4000)"
            echo "  -h, --help      Mostra esta ajuda"
            exit 0
            ;;
        *)
            echo "Opção desconhecida: $1"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}🔗 SmartBI - Teste de Conexões${NC}"
echo -e "${CYAN}=================================${NC}"
echo ""

# Função para fazer requisição GraphQL
make_graphql_request() {
    local query="$1"
    local name="$2"
    
    echo -e "${YELLOW}🧪 Testando: $name${NC}"
    
    local json_body=$(jq -n --arg query "$query" '{query: $query}')
    
    local response=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "$json_body" \
        --max-time 30)
    
    if echo "$response" | jq -e '.data.createDataConnectionPublic' > /dev/null 2>&1; then
        local connection=$(echo "$response" | jq -r '.data.createDataConnectionPublic')
        local conn_id=$(echo "$connection" | jq -r '.id')
        local conn_name=$(echo "$connection" | jq -r '.name')
        local conn_type=$(echo "$connection" | jq -r '.type')
        local conn_status=$(echo "$connection" | jq -r '.status')
        
        echo -e "${GREEN}✅ Sucesso: $conn_name (ID: $conn_id)${NC}"
        echo -e "${GRAY}   Tipo: $conn_type | Status: $conn_status${NC}"
        echo "$conn_id"
        return 0
    elif echo "$response" | jq -e '.errors' > /dev/null 2>&1; then
        local error_msg=$(echo "$response" | jq -r '.errors[0].message')
        echo -e "${RED}❌ Erro GraphQL: $error_msg${NC}"
        if [[ "$error_msg" == *"enum"* ]]; then
            echo -e "${YELLOW}   💡 Dica: Atualize o enum do banco com os novos tipos de conexão${NC}"
        fi
    else
        echo -e "${RED}❌ Erro na requisição${NC}"
    fi
    
    echo ""
    return 1
}

# Função para testar query natural
test_natural_query() {
    local connection_id="$1"
    local query="$2"
    local name="$3"
    
    if [[ -z "$connection_id" || "$connection_id" == "null" ]]; then
        echo -e "${YELLOW}⚠️ Pulando teste de query - conexão não criada${NC}"
        return 1
    fi
    
    echo -e "${CYAN}🤖 Testando query natural: $name${NC}"
    
    local graphql_query='mutation ExecuteQuery($input: AIQueryInput!) {
        executeAIQueryPublic(input: $input) {
            naturalQuery
            generatedQuery
            status
            error
            executionTime
        }
    }'
    
    local variables=$(jq -n \
        --arg connectionId "$connection_id" \
        --arg naturalQuery "$query" \
        '{input: {connectionId: $connectionId, naturalQuery: $naturalQuery}}')
    
    local json_body=$(jq -n \
        --arg query "$graphql_query" \
        --argjson variables "$variables" \
        '{query: $query, variables: $variables}')
    
    local response=$(curl -s -X POST "$GRAPHQL_URL" \
        -H "Content-Type: application/json" \
        -d "$json_body" \
        --max-time 30)
    
    if echo "$response" | jq -e '.data.executeAIQueryPublic' > /dev/null 2>&1; then
        local result=$(echo "$response" | jq -r '.data.executeAIQueryPublic')
        local generated_query=$(echo "$result" | jq -r '.generatedQuery')
        local status=$(echo "$result" | jq -r '.status')
        local execution_time=$(echo "$result" | jq -r '.executionTime')
        local error=$(echo "$result" | jq -r '.error')
        
        echo -e "${GRAY}   Query gerada: $generated_query${NC}"
        echo -e "${GRAY}   Status: $status | Tempo: ${execution_time}ms${NC}"
        
        if [[ "$error" != "null" && -n "$error" ]]; then
            echo -e "${YELLOW}   Erro: $error${NC}"
        else
            echo -e "${GREEN}   ✅ Query executada com sucesso!${NC}"
        fi
    else
        echo -e "${RED}   ❌ Erro ao executar query${NC}"
    fi
    
    echo ""
}

# Verificar dependências
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl não está instalado${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq não está instalado${NC}"
    echo -e "${YELLOW}   Instale com: sudo apt install jq (Ubuntu/Debian) ou brew install jq (Mac)${NC}"
    exit 1
fi

# Verificar se servidor está rodando
echo -e "${CYAN}📡 Verificando servidor...${NC}"
if curl -s "$BASE_URL" --max-time 5 > /dev/null; then
    echo -e "${GREEN}✅ Servidor SmartBI está rodando em $BASE_URL${NC}"
else
    echo -e "${RED}❌ Servidor não está rodando em $BASE_URL${NC}"
    echo -e "${YELLOW}   Inicie o servidor com: npm run dev${NC}"
    exit 1
fi

echo ""

# Definir conexões para teste
declare -A CONNECTIONS

CONNECTIONS[mysql,name]="MySQL Local"
CONNECTIONS[mysql,query]='mutation { createDataConnectionPublic(input: { type: MYSQL, name: "MySQL Local Test", description: "Teste MySQL", config: { host: "localhost", port: 3306, database: "test", username: "root", password: "password" } }) { id name type status } }'
CONNECTIONS[mysql,natural]="mostrar todas as tabelas"

CONNECTIONS[postgresql,name]="PostgreSQL Local"
CONNECTIONS[postgresql,query]='mutation { createDataConnectionPublic(input: { type: POSTGRESQL, name: "PostgreSQL Local Test", description: "Teste PostgreSQL", config: { host: "localhost", port: 5432, database: "postgres", username: "postgres", password: "postgres" } }) { id name type status } }'
CONNECTIONS[postgresql,natural]="listar todos os usuários"

CONNECTIONS[firebase,name]="Firebase Firestore"
CONNECTIONS[firebase,query]='mutation { createDataConnectionPublic(input: { type: FIREBASE, name: "Firebase Test", description: "Teste Firebase", config: { apiUrl: "kimakudi-db", apiKey: "AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8" } }) { id name type status } }'
CONNECTIONS[firebase,natural]="buscar 5 documentos da collection users"

CONNECTIONS[mongodb,name]="MongoDB Local"
CONNECTIONS[mongodb,query]='mutation { createDataConnectionPublic(input: { type: MONGODB, name: "MongoDB Local Test", description: "Teste MongoDB", config: { connectionString: "mongodb://localhost:27017/test" } }) { id name type status } }'
CONNECTIONS[mongodb,natural]="contar documentos na collection produtos"

CONNECTIONS[api,name]="API REST"
CONNECTIONS[api,query]='mutation { createDataConnectionPublic(input: { type: API_REST, name: "JSONPlaceholder API", description: "API de teste", config: { apiUrl: "https://jsonplaceholder.typicode.com" } }) { id name type status } }'
CONNECTIONS[api,natural]="listar todos os posts"

# Executar testes
if [[ "$TEST_ALL" == true ]]; then
    echo -e "${GREEN}🚀 Testando todas as conexões...${NC}"
    echo ""
    
    for conn_type in mysql postgresql firebase mongodb api; do
        name_key="$conn_type,name"
        query_key="$conn_type,query"
        natural_key="$conn_type,natural"
        
        connection_id=$(make_graphql_request "${CONNECTIONS[$query_key]}" "${CONNECTIONS[$name_key]}")
        test_natural_query "$connection_id" "${CONNECTIONS[$natural_key]}" "${CONNECTIONS[$name_key]}"
        sleep 2
    done
elif [[ -n "$CONNECTION_TYPE" ]]; then
    conn_type=$(echo "$CONNECTION_TYPE" | tr '[:upper:]' '[:lower:]')
    name_key="$conn_type,name"
    query_key="$conn_type,query"
    natural_key="$conn_type,natural"
    
    if [[ -n "${CONNECTIONS[$name_key]}" ]]; then
        connection_id=$(make_graphql_request "${CONNECTIONS[$query_key]}" "${CONNECTIONS[$name_key]}")
        test_natural_query "$connection_id" "${CONNECTIONS[$natural_key]}" "${CONNECTIONS[$name_key]}"
    else
        echo -e "${RED}❌ Tipo de conexão '$CONNECTION_TYPE' não encontrado${NC}"
        exit 1
    fi
else
    echo -e "${CYAN}📋 Conexões disponíveis para teste:${NC}"
    echo -e "${GRAY}   - mysql : MySQL Local${NC}"
    echo -e "${GRAY}   - postgresql : PostgreSQL Local${NC}"
    echo -e "${GRAY}   - firebase : Firebase Firestore${NC}"
    echo -e "${GRAY}   - mongodb : MongoDB Local${NC}"
    echo -e "${GRAY}   - api : API REST${NC}"
    echo ""
    echo -e "${YELLOW}💡 Uso:${NC}"
    echo -e "${GRAY}   $0 --all                    # Testa todas as conexões${NC}"
    echo -e "${GRAY}   $0 --type firebase          # Testa apenas Firebase${NC}"
    echo -e "${GRAY}   $0 --type mysql             # Testa apenas MySQL${NC}"
    echo ""
    
    # Testar apenas Firebase como exemplo
    echo -e "${GREEN}🔥 Testando Firebase (exemplo)...${NC}"
    echo ""
    connection_id=$(make_graphql_request "${CONNECTIONS[firebase,query]}" "${CONNECTIONS[firebase,name]}")
    test_natural_query "$connection_id" "${CONNECTIONS[firebase,natural]}" "${CONNECTIONS[firebase,name]}"
fi

echo -e "${GREEN}🎉 Teste concluído!${NC}"
echo ""
echo -e "${CYAN}📚 Para mais exemplos, consulte:${NC}"
echo -e "${GRAY}   - testing/GUIA_COMPLETO_CONEXOES.md${NC}"
echo -e "${GRAY}   - testing/SmartBI-All-Connections.postman_collection.json${NC}"