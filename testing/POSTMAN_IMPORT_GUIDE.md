# Como Importar e Usar a Coleção do Postman 📮

## Importação Rápida

### Opção 1: Importar Arquivo
1. Abra o Postman
2. Clique em **Import** no canto superior esquerdo
3. Selecione **Upload Files**
4. Escolha o arquivo `SmartBI-Natural-Language.postman_collection.json`
5. Clique em **Import**

### Opção 2: Importar via Raw Text
1. No Postman, clique em **Import**
2. Selecione **Raw text**
3. Cole o conteúdo do arquivo JSON
4. Clique em **Continue** → **Import**

## Configuração das Variáveis

A coleção já vem com variáveis pré-configuradas:
- `base_url`: http://localhost:4000
- `connection_id`: 3343fdeb-1ced-42aa-8f40-a9821c8a6957

Para alterar o connection_id:
1. Clique com botão direito na coleção
2. Selecione **Edit**
3. Vá na aba **Variables**
4. Altere o valor de `connection_id`

## Ordem de Teste Recomendada

### 1️⃣ Setup
- **Listar Conexões Disponíveis** - Para ver todas as conexões e seus IDs

### 2️⃣ Consultas Básicas
- **Mostrar Primeiros Usuários** - Teste simples para verificar funcionamento
- **Contar Total de Usuários** - Consulta de agregação
- **Listar Empresas** - Explorar outras tabelas

### 3️⃣ Consultas Filtradas
- **Usuários por Empresa** - Filtros com WHERE
- **Conexões por Tipo** - Explorar dados específicos
- **Usuários Ativos** - Filtros por status

### 4️⃣ Consultas Avançadas
- **Estatísticas de Empresas** - Análises quantitativas
- **Dados Recentes** - Filtros por data
- **Histórico de Consultas AI** - Meta-dados do sistema

### 5️⃣ Testes em Português
- **Quantas empresas temos?** - Linguagem natural brasileira
- **Quem são os administradores?** - Perguntas sobre roles
- **Qual é o nome da empresa padrão?** - Consultas específicas

## Estrutura da Resposta

Todas as consultas retornam a mesma estrutura:

```json
{
  "data": {
    "executeAIQueryPublic": {
      "id": "uuid-do-historico",
      "naturalQuery": "Pergunta original em português",
      "generatedQuery": "SELECT SQL GERADO PELA IA",
      "results": [
        {
          "data": {
            "campo1": "valor1",
            "campo2": "valor2"
          }
        }
      ],
      "executionTime": 2500,
      "status": "SUCCESS|ERROR",
      "error": null,
      "createdAt": "2025-09-14T18:30:00.000Z"
    }
  }
}
```

## Personalização

### Criar Suas Próprias Consultas
1. Duplique uma consulta existente
2. Altere o `naturalQuery` na seção `variables`
3. Opcionalmente, altere o `connectionId` se quiser usar outra conexão

### Exemplos de Perguntas Personalizadas
```
"Mostre os últimos 10 registros da tabela X"
"Quantos registros foram criados ontem?"
"Qual usuário tem mais conexões?"
"Mostre dados da semana passada"
"Quais empresas têm mais de 5 usuários?"
```

## Troubleshooting

### Erro: "Cannot connect to server"
- Verifique se o servidor está rodando em localhost:4000
- Execute: `npm run dev` na pasta do projeto

### Erro: "Connection not found"
- Execute primeiro "Listar Conexões Disponíveis"
- Copie o ID correto e atualize a variável `connection_id`

### Status: ERROR na resposta
- Verifique o campo `error` para detalhes
- Simplifique a pergunta
- Teste com perguntas dos exemplos primeiro

### Resultados vazios
- A tabela pode estar vazia
- Teste com tabelas que você sabe que têm dados
- Verifique se a conexão está funcionando

## Próximos Passos

Após dominar esta coleção:
1. Teste com outras conexões de banco de dados
2. Crie consultas mais complexas
3. Explore diferentes tipos de perguntas
4. Monitore o histórico de consultas no banco

---

**Dica**: Mantenha o console do Postman aberto para ver logs detalhados das requisições!