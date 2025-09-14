-- ==================================================
-- SCRIPT DE CONFIGURAÇÃO INICIAL - SUPABASE
-- SmartBI Backend - Dados de Teste
-- ==================================================

-- ⚠️ Execute este script no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole este código

-- 🗃️ 1. CRIAÇÃO DAS TABELAS
-- ==================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    data_nascimento DATE,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN DEFAULT true,
    tipo_cliente VARCHAR(20) DEFAULT 'COMUM'
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativa BOOLEAN DEFAULT true,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id),
    estoque INTEGER DEFAULT 0,
    peso DECIMAL(5,2),
    marca VARCHAR(100),
    codigo_barras VARCHAR(50),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS vendas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10,2) NOT NULL,
    desconto DECIMAL(10,2) DEFAULT 0,
    valor_final DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'CONCLUIDA',
    metodo_pagamento VARCHAR(30),
    observacoes TEXT
);

-- Tabela de itens da venda
CREATE TABLE IF NOT EXISTS itens_venda (
    id SERIAL PRIMARY KEY,
    venda_id INTEGER REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- 📊 2. INSERÇÃO DE DADOS DE EXEMPLO
-- ==================================================

-- Inserir categorias
INSERT INTO categorias (nome, descricao) VALUES
('Eletrônicos', 'Dispositivos eletrônicos e tecnologia'),
('Periféricos', 'Acessórios para computador e gaming'),
('Móveis', 'Móveis para escritório e casa'),
('Livros', 'Livros técnicos e educacionais'),
('Roupas', 'Vestuário e acessórios'),
('Esportes', 'Equipamentos esportivos e fitness')
ON CONFLICT (nome) DO NOTHING;

-- Inserir usuários
INSERT INTO usuarios (nome, email, telefone, data_nascimento, cidade, estado, tipo_cliente) VALUES
('João Silva', 'joao.silva@exemplo.com', '11999887766', '1985-03-15', 'São Paulo', 'SP', 'VIP'),
('Maria Santos', 'maria.santos@exemplo.com', '11988776655', '1990-07-22', 'Rio de Janeiro', 'RJ', 'COMUM'),
('Pedro Oliveira', 'pedro.oliveira@exemplo.com', '11977665544', '1988-11-10', 'Belo Horizonte', 'MG', 'COMUM'),
('Ana Costa', 'ana.costa@exemplo.com', '11966554433', '1992-01-08', 'São Paulo', 'SP', 'VIP'),
('Carlos Pereira', 'carlos.pereira@exemplo.com', '11955443322', '1987-09-25', 'Salvador', 'BA', 'COMUM'),
('Lucia Fernandes', 'lucia.fernandes@exemplo.com', '11944332211', '1989-04-12', 'Porto Alegre', 'RS', 'COMUM'),
('Rafael Souza', 'rafael.souza@exemplo.com', '11933221100', '1991-12-03', 'Recife', 'PE', 'VIP'),
('Fernanda Lima', 'fernanda.lima@exemplo.com', '11922110099', '1986-06-18', 'Fortaleza', 'CE', 'COMUM')
ON CONFLICT (email) DO NOTHING;

-- Inserir produtos
INSERT INTO produtos (nome, descricao, preco, categoria_id, estoque, peso, marca, codigo_barras) VALUES
-- Eletrônicos
('Notebook Dell Inspiron 15', 'Notebook Dell com Intel i5, 8GB RAM, SSD 256GB', 2500.00, 1, 10, 2.5, 'Dell', '7891234567890'),
('Smartphone Samsung Galaxy A54', 'Smartphone Android 128GB, Câmera 50MP', 1200.00, 1, 25, 0.2, 'Samsung', '7891234567891'),
('Tablet iPad Air', 'iPad Air com tela 10.9", 64GB WiFi', 3200.00, 1, 8, 0.5, 'Apple', '7891234567892'),
('Smart TV 55" LG', 'Smart TV 4K UHD, WebOS, HDR', 2800.00, 1, 5, 15.0, 'LG', '7891234567893'),

-- Periféricos
('Mouse Logitech MX Master 3', 'Mouse sem fio ergonômico, sensor de alta precisão', 450.00, 2, 50, 0.1, 'Logitech', '7891234567894'),
('Teclado Mecânico Corsair K95', 'Teclado mecânico RGB, switches Cherry MX', 800.00, 2, 25, 1.2, 'Corsair', '7891234567895'),
('Headset HyperX Cloud II', 'Headset gamer com microfone removível', 350.00, 2, 30, 0.3, 'HyperX', '7891234567896'),
('Monitor Gamer 24" AOC', 'Monitor 144Hz, 1ms, Full HD', 900.00, 2, 15, 4.5, 'AOC', '7891234567897'),

-- Móveis
('Cadeira Gamer DXRacer', 'Cadeira gamer ergonômica, ajuste de altura', 1200.00, 3, 8, 25.0, 'DXRacer', '7891234567898'),
('Mesa Gamer RGB', 'Mesa para setup gamer com iluminação LED', 800.00, 3, 12, 30.0, 'Fortrek', '7891234567899'),
('Estante Para Livros', 'Estante de madeira 5 prateleiras', 350.00, 3, 20, 40.0, 'Móveis Brasil', '7891234567900'),

-- Livros
('Livro: Clean Code', 'Livro sobre boas práticas de programação', 89.90, 4, 100, 0.8, 'O Reilly', '9788576082675'),
('Livro: Design Patterns', 'Padrões de projeto orientado a objetos', 120.00, 4, 80, 1.0, 'Addison Wesley', '9780201633610'),

-- Roupas
('Camiseta Gamer "Code Life"', 'Camiseta 100% algodão com estampa geek', 45.00, 5, 200, 0.2, 'Geek Store', '7891234567901'),
('Moletom "Dev Mode On"', 'Moletom com capuz, programador style', 120.00, 5, 50, 0.8, 'Code Wear', '7891234567902'),

-- Esportes
('Tênis Nike Air Max', 'Tênis esportivo para corrida e academia', 380.00, 6, 40, 0.9, 'Nike', '7891234567903'),
('Bola de Futebol Oficial', 'Bola oficial FIFA, couro sintético', 150.00, 6, 60, 0.4, 'Penalty', '7891234567904')
ON CONFLICT (codigo_barras) DO NOTHING;

-- Inserir vendas
INSERT INTO vendas (usuario_id, data_venda, valor_total, desconto, valor_final, metodo_pagamento, observacoes) VALUES
(1, '2024-01-15 14:30:00', 2500.00, 0, 2500.00, 'CARTAO_CREDITO', 'Primeira compra do cliente VIP'),
(2, '2024-01-16 09:15:00', 900.00, 50.00, 850.00, 'PIX', 'Desconto promocional aplicado'),
(3, '2024-01-17 16:45:00', 800.00, 0, 800.00, 'CARTAO_DEBITO', NULL),
(1, '2024-01-18 11:20:00', 900.00, 0, 900.00, 'CARTAO_CREDITO', 'Segunda compra do cliente'),
(4, '2024-01-19 13:10:00', 1200.00, 0, 1200.00, 'PIX', 'Cliente VIP - frete grátis'),
(2, '2024-01-20 15:35:00', 1200.00, 100.00, 1100.00, 'CARTAO_CREDITO', 'Desconto fidelidade'),
(5, '2024-01-21 10:25:00', 450.00, 0, 450.00, 'PIX', NULL),
(6, '2024-01-22 17:40:00', 350.00, 0, 350.00, 'CARTAO_DEBITO', NULL),
(7, '2024-01-23 12:15:00', 3200.00, 200.00, 3000.00, 'CARTAO_CREDITO', 'Cliente VIP - desconto especial'),
(3, '2024-01-24 14:50:00', 350.00, 0, 350.00, 'PIX', NULL),
(8, '2024-01-25 09:30:00', 165.00, 0, 165.00, 'CARTAO_DEBITO', 'Compra de livros técnicos'),
(1, '2024-01-26 16:20:00', 380.00, 0, 380.00, 'PIX', 'Terceira compra do cliente'),
(4, '2024-01-27 11:45:00', 2800.00, 0, 2800.00, 'CARTAO_CREDITO', 'Compra de alto valor');

-- Inserir itens das vendas
INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES
-- Venda 1 (João - Notebook)
(1, 1, 1, 2500.00, 2500.00),

-- Venda 2 (Maria - Monitor)
(2, 8, 1, 900.00, 900.00),

-- Venda 3 (Pedro - Teclado)
(3, 6, 1, 800.00, 800.00),

-- Venda 4 (João - Monitor)
(4, 8, 1, 900.00, 900.00),

-- Venda 5 (Ana - Cadeira)
(5, 9, 1, 1200.00, 1200.00),

-- Venda 6 (Maria - Smartphone)
(6, 2, 1, 1200.00, 1200.00),

-- Venda 7 (Carlos - Mouse)
(7, 5, 1, 450.00, 450.00),

-- Venda 8 (Lucia - Headset)
(8, 7, 1, 350.00, 350.00),

-- Venda 9 (Rafael - iPad)
(9, 3, 1, 3200.00, 3200.00),

-- Venda 10 (Pedro - Estante)
(10, 11, 1, 350.00, 350.00),

-- Venda 11 (Fernanda - Livros)
(11, 12, 1, 89.90, 89.90),
(11, 13, 1, 120.00, 120.00),

-- Venda 12 (João - Tênis)
(12, 15, 1, 380.00, 380.00),

-- Venda 13 (Ana - Smart TV)
(13, 4, 1, 2800.00, 2800.00);

-- 📈 3. VIEWS ÚTEIS PARA ANÁLISE
-- ==================================================

-- View: Vendas detalhadas
CREATE OR REPLACE VIEW vw_vendas_detalhadas AS
SELECT 
    v.id as venda_id,
    u.nome as cliente,
    u.email,
    u.cidade,
    u.estado,
    u.tipo_cliente,
    v.data_venda,
    v.valor_total,
    v.desconto,
    v.valor_final,
    v.metodo_pagamento,
    COUNT(iv.id) as total_itens,
    EXTRACT(YEAR FROM v.data_venda) as ano,
    EXTRACT(MONTH FROM v.data_venda) as mes,
    EXTRACT(DOW FROM v.data_venda) as dia_semana
FROM vendas v
JOIN usuarios u ON v.usuario_id = u.id
LEFT JOIN itens_venda iv ON v.id = iv.venda_id
GROUP BY v.id, u.id;

-- View: Produtos mais vendidos
CREATE OR REPLACE VIEW vw_produtos_mais_vendidos AS
SELECT 
    p.id,
    p.nome as produto,
    p.marca,
    c.nome as categoria,
    p.preco,
    SUM(iv.quantidade) as total_vendido,
    SUM(iv.subtotal) as receita_total,
    COUNT(DISTINCT iv.venda_id) as total_vendas,
    AVG(iv.quantidade) as media_por_venda
FROM produtos p
JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN itens_venda iv ON p.id = iv.produto_id
GROUP BY p.id, c.nome
ORDER BY total_vendido DESC;

-- View: Performance por categoria
CREATE OR REPLACE VIEW vw_categoria_performance AS
SELECT 
    c.nome as categoria,
    COUNT(DISTINCT p.id) as total_produtos,
    COUNT(DISTINCT iv.venda_id) as total_vendas,
    SUM(iv.quantidade) as itens_vendidos,
    SUM(iv.subtotal) as receita_total,
    AVG(p.preco) as preco_medio,
    MAX(p.preco) as maior_preco,
    MIN(p.preco) as menor_preco
FROM categorias c
LEFT JOIN produtos p ON c.id = p.categoria_id
LEFT JOIN itens_venda iv ON p.id = iv.produto_id
GROUP BY c.id, c.nome
ORDER BY receita_total DESC;

-- 🔍 4. ÍNDICES PARA PERFORMANCE
-- ==================================================

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_usuario ON vendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_cidade ON usuarios(cidade);
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto ON itens_venda(produto_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda ON itens_venda(venda_id);

-- ✅ 5. VERIFICAÇÃO DOS DADOS
-- ==================================================

-- Contagem de registros por tabela
SELECT 'categorias' as tabela, COUNT(*) as registros FROM categorias
UNION ALL
SELECT 'usuarios' as tabela, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'produtos' as tabela, COUNT(*) as registros FROM produtos
UNION ALL
SELECT 'vendas' as tabela, COUNT(*) as registros FROM vendas
UNION ALL
SELECT 'itens_venda' as tabela, COUNT(*) as registros FROM itens_venda
ORDER BY registros DESC;

-- 🎉 CONFIGURAÇÃO CONCLUÍDA!
-- ==================================================
-- 
-- ✅ Agora você pode testar o SmartBI com:
-- 
-- 📊 5 categorias de produtos
-- 👥 8 usuários de diferentes cidades
-- 🛍️ 16 produtos variados
-- 💰 13 vendas com 15 itens
-- 📈 3 views para análises
-- ⚡ Índices para performance
-- 
-- 🚀 Execute as consultas do Postman para testar!
-- ==================================================