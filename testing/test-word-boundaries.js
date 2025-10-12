/**
 * Test Script: Validação de Query - Word Boundaries
 * 
 * Este script testa se a correção do bug de word boundaries está funcionando
 */

// Simular a função sanitizeQuery corrigida
function sanitizeQuery(query) {
  const dangerousKeywords = [
    'DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE', 'ALTER',
    'CREATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
  ];

  // Verifica se as palavras perigosas aparecem como palavras completas
  for (const keyword of dangerousKeywords) {
    const wordBoundaryPattern = new RegExp(`\\b${keyword}\\b`, 'i');
    if (wordBoundaryPattern.test(query)) {
      throw new Error(`Query contains prohibited keyword: ${keyword}`);
    }
  }

  return query.trim();
}

// Testes
console.log('🧪 Testando Validação de Queries com Word Boundaries\n');
console.log('=' .repeat(60));

const testCases = [
  {
    name: 'Query com updated_at (deve passar)',
    query: 'SELECT * FROM users ORDER BY updated_at DESC LIMIT 5',
    shouldPass: true
  },
  {
    name: 'Query com deleted_at (deve passar)',
    query: 'SELECT * FROM logs WHERE deleted_at IS NOT NULL',
    shouldPass: true
  },
  {
    name: 'Query com last_update (deve passar)',
    query: 'SELECT * FROM records WHERE last_update > NOW()',
    shouldPass: true
  },
  {
    name: 'Query com created_at e updated_at (deve passar)',
    query: 'SELECT id, name, created_at, updated_at FROM users',
    shouldPass: true
  },
  {
    name: 'Query com palavra "atualizados" (deve passar)',
    query: 'SELECT * FROM users -- registros atualizados',
    shouldPass: true
  },
  {
    name: 'Comando UPDATE perigoso (deve bloquear)',
    query: 'UPDATE users SET role = admin',
    shouldPass: false
  },
  {
    name: 'Comando DELETE perigoso (deve bloquear)',
    query: 'DELETE FROM users WHERE id = 1',
    shouldPass: false
  },
  {
    name: 'Comando DROP perigoso (deve bloquear)',
    query: 'DROP TABLE users',
    shouldPass: false
  },
  {
    name: 'Query com INSERT perigoso (deve bloquear)',
    query: 'INSERT INTO users (name) VALUES (test)',
    shouldPass: false
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}`);
  console.log(`   Query: "${test.query}"`);
  
  try {
    sanitizeQuery(test.query);
    if (test.shouldPass) {
      console.log('   ✅ PASSOU - Query permitida corretamente');
      passed++;
    } else {
      console.log('   ❌ FALHOU - Query perigosa não foi bloqueada!');
      failed++;
    }
  } catch (error) {
    if (!test.shouldPass) {
      console.log(`   ✅ PASSOU - Query bloqueada corretamente: ${error.message}`);
      passed++;
    } else {
      console.log(`   ❌ FALHOU - Query segura foi bloqueada: ${error.message}`);
      failed++;
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Resultado dos Testes:`);
console.log(`   ✅ Passou: ${passed}/${testCases.length}`);
console.log(`   ❌ Falhou: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n🎉 Todos os testes passaram! Bug corrigido com sucesso.\n');
} else {
  console.log('\n⚠️  Alguns testes falharam. Revisar implementação.\n');
}
