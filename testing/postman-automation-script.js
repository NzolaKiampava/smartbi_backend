// SmartBI Connection Test Automation Script
// Use este script na aba "Tests" do Postman para automação

// Configurações do teste
const testConfig = {
    maxRetries: 3,
    timeoutMs: 30000,
    expectedLatency: 5000 // 5 segundos
};

// Função para testar múltiplas conexões
function runConnectionTests() {
    const connections = [
        {
            name: "MySQL Production",
            type: "MYSQL",
            config: {
                host: pm.environment.get("mysql_host"),
                port: parseInt(pm.environment.get("mysql_port")),
                database: pm.environment.get("mysql_database"),
                username: pm.environment.get("mysql_username"),
                password: pm.environment.get("mysql_password")
            }
        },
        {
            name: "PostgreSQL Analytics", 
            type: "POSTGRESQL",
            config: {
                host: pm.environment.get("postgres_host"),
                port: parseInt(pm.environment.get("postgres_port")),
                database: pm.environment.get("postgres_database"),
                username: pm.environment.get("postgres_username"),
                password: pm.environment.get("postgres_password")
            }
        },
        {
            name: "External API",
            type: "API_REST",
            config: {
                apiUrl: pm.environment.get("api_base_url"),
                apiKey: pm.environment.get("api_key"),
                headers: [
                    {"key": "Content-Type", "value": "application/json"}
                ]
            }
        }
    ];

    return connections;
}

// Função de validação de resposta
function validateConnectionResponse(response, connectionName) {
    const data = response.json();
    
    // Testes básicos
    pm.test(`${connectionName} - Response status is 200`, () => {
        pm.expect(pm.response.code).to.equal(200);
    });

    pm.test(`${connectionName} - Response has data`, () => {
        pm.expect(data).to.have.property('data');
    });

    if (data.data && data.data.testConnection) {
        const result = data.data.testConnection;
        
        pm.test(`${connectionName} - Connection successful`, () => {
            pm.expect(result.success).to.be.true;
        });

        if (result.success) {
            pm.test(`${connectionName} - Latency within acceptable range`, () => {
                pm.expect(result.latency).to.be.below(testConfig.expectedLatency);
            });

            // Log detalhes da conexão
            console.log(`✅ ${connectionName}:`);
            console.log(`   Latency: ${result.latency}ms`);
            console.log(`   Message: ${result.message}`);
            
            if (result.schemaPreview) {
                console.log(`   Tables found: ${result.schemaPreview.totalTables}`);
                
                pm.test(`${connectionName} - Schema preview available`, () => {
                    pm.expect(result.schemaPreview.totalTables).to.be.greaterThan(0);
                });
            }
        } else {
            console.log(`❌ ${connectionName}: ${result.message}`);
        }
    }
}

// Função para validar AI Query
function validateAIQueryResponse(response, queryText) {
    const data = response.json();
    
    pm.test("AI Query - Response status is 200", () => {
        pm.expect(pm.response.code).to.equal(200);
    });

    if (data.data && data.data.executeAIQuery) {
        const result = data.data.executeAIQuery;
        
        pm.test("AI Query - Execution successful", () => {
            pm.expect(result.status).to.equal("SUCCESS");
        });

        if (result.status === "SUCCESS") {
            pm.test("AI Query - Generated query exists", () => {
                pm.expect(result.generatedQuery).to.not.be.empty;
            });

            pm.test("AI Query - Results returned", () => {
                pm.expect(result.results).to.be.an('array');
            });

            pm.test("AI Query - Execution time reasonable", () => {
                pm.expect(result.executionTime).to.be.below(60000); // 60 segundos
            });

            // Log detalhes da consulta
            console.log(`🧠 AI Query Results:`);
            console.log(`   Original: ${result.naturalQuery}`);
            console.log(`   Generated SQL: ${result.generatedQuery}`);
            console.log(`   Execution time: ${result.executionTime}ms`);
            console.log(`   Results count: ${result.results.length}`);
        } else {
            console.log(`❌ AI Query failed: ${result.error}`);
        }
    }
}

// Função para executar testes de performance
function performanceTests(response) {
    pm.test("Response time is acceptable", () => {
        pm.expect(pm.response.responseTime).to.be.below(testConfig.timeoutMs);
    });

    console.log(`⏱️ Total response time: ${pm.response.responseTime}ms`);
}

// Função para setup de ambiente
function setupTestEnvironment() {
    // Verificar se todas as variáveis necessárias estão definidas
    const requiredVars = [
        'baseUrl', 'test_email', 'test_password',
        'mysql_host', 'mysql_username', 'mysql_database'
    ];

    let missingVars = [];
    requiredVars.forEach(varName => {
        if (!pm.environment.get(varName)) {
            missingVars.push(varName);
        }
    });

    if (missingVars.length > 0) {
        console.log(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
        return false;
    }

    return true;
}

// Função para gerar relatório de testes
function generateTestReport() {
    const timestamp = new Date().toISOString();
    const environment = pm.environment.name || 'Unknown';
    
    console.log(`
📊 SmartBI Connection Test Report
================================
Environment: ${environment}
Timestamp: ${timestamp}
Base URL: ${pm.environment.get('baseUrl')}

Test Status:
- Total requests: ${pm.info.requestName}
- Response time: ${pm.response.responseTime}ms
- Status code: ${pm.response.code}

Next Steps:
1. Review any failed connections
2. Check network connectivity for slow responses
3. Verify credentials for authentication errors
4. Monitor AI query performance
    `);
}

// Script principal - execute baseado no request atual
if (pm.info.requestName.includes('Login')) {
    // Validação de login
    const response = pm.response.json();
    if (response.data && response.data.login && response.data.login.token) {
        pm.collectionVariables.set('auth_token', response.data.login.token);
        console.log('✅ Authentication successful');
    }
} else if (pm.info.requestName.includes('Test') && pm.info.requestName.includes('Connection')) {
    // Validação de conexão
    const connectionName = pm.info.requestName.replace('Test ', '').replace(' Connection', '');
    validateConnectionResponse(pm.response, connectionName);
    performanceTests(pm.response);
} else if (pm.info.requestName.includes('AI Query')) {
    // Validação de AI Query
    validateAIQueryResponse(pm.response, pm.request.body.raw);
    performanceTests(pm.response);
}

// Sempre executar relatório no final
generateTestReport();