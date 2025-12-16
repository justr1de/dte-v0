# Pull Request

## Descrição
<!-- Descreva brevemente as alterações realizadas -->

## Tipo de Alteração
- [ ] Nova funcionalidade
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Documentação
- [ ] Configuração/Infraestrutura

---

## ✅ CHECKLIST OBRIGATÓRIO

### 1. Validação de Requisitos (Antes de Iniciar)
- [ ] Sistema de autenticação confirmado com o cliente (Supabase/Firebase/Auth0/OAuth)
- [ ] Arquitetura validada (serverless/tradicional/híbrida)
- [ ] Integrações existentes identificadas e preservadas
- [ ] Requisitos documentados por escrito antes de iniciar
- [ ] NÃO foi usado template padrão sem validação prévia com o cliente

### 2. Backup e Segurança (Antes de Alterações Críticas)
- [ ] Backup criado para arquivos de autenticação (se modificados)
- [ ] Backup criado para configurações de banco de dados (se modificadas)
- [ ] Backup criado para variáveis de ambiente (se modificadas)
- [ ] Estado funcional atual do sistema documentado
- [ ] Alterações testadas em ambiente isolado antes de produção

### 3. Diagnóstico (Se Correção de Bug)
- [ ] Causa raiz identificada (não apenas sintomas)
- [ ] Diferenças entre ambiente local e produção verificadas
- [ ] Máximo de 2 tentativas de correção antes de consultar cliente
- [ ] N/A - Não é correção de bug

---

## Arquivos Críticos Modificados
<!-- Liste os arquivos críticos que foram alterados -->
- [ ] `AuthContext.tsx` ou similar (autenticação)
- [ ] `supabase.ts` ou similar (banco de dados)
- [ ] `.env` ou variáveis de ambiente
- [ ] Arquivos de configuração (`config.ts`, `vite.config.ts`)
- [ ] Nenhum arquivo crítico foi modificado

---

## Testes Realizados
<!-- Descreva os testes realizados para validar as alterações -->

## Screenshots (se aplicável)
<!-- Adicione screenshots das alterações visuais -->

---

> ⚠️ **ATENÇÃO**: Este PR só será aprovado se todos os itens aplicáveis do checklist estiverem marcados.
