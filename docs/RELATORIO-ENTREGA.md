# Relatório de entrega — evolução do CRM de atendimento

Data: 12/09/2026 · Branch `claude/crm-atendimento-evolution-ls4iqw` · Apresentação atualizada em GitHub Pages (branch `gh-pages`).

## 1. Ponto de partida

A aplicação existente (Node.js + Express + PostgreSQL, SPA sem build) foi analisada por completo: rotas, migrações 001/002, componentes de página, testes e a galeria publicada. Tudo o que existia foi preservado: cadastros, histórico (linha do tempo, eventos de oportunidade), permissões validadas no servidor, importação/exportação CSV, auditoria, rodízio, controle de versão otimista, recuperação de senha e backup. As mudanças foram incrementais, com a migração `003_inbox_pipelines_automations.sql`, que só adiciona colunas e tabelas e preenche os campos novos a partir dos dados existentes.

## 2. Melhorias concluídas

### Identidade visual e navegação
- Sistema visual próprio: branco, cinzas neutros, azul-marinho na estrutura (menu lateral e títulos) e cor principal configurável para ações. Tipografia 14 px base, títulos 20/16/14 px, ícones de uma única família (traço 1,8 px), cantos de 6–8 px, bordas discretas e sombras mínimas. Sem degradês, emojis ou frases promocionais.
- Menu lateral compacto e recolhível (preferência salva por usuário), atalhos inferiores no celular, indicador discreto de demonstração no cabeçalho.
- Busca global (`/` foca o campo), filtros, ações e tabelas padronizados em todas as telas.

### Central de conversas (Atendimentos)
- Três áreas: lista de conversas, conversa selecionada e contexto do cliente (dados, negociação com troca de etapa, tarefas, anexos, outros atendimentos). Visão em tabela para supervisão preservada e ampliada.
- Lista com cliente, prévia da última mensagem, horário, canal, responsável, não lidas e prazo de resposta (vencido / minutos restantes). Filtros: Meus, Fila, Sem resposta, Aguardando cliente, Todos abertos, Encerrados; canal, responsável e prioridade; filtros salvos.
- Conversa: responder ao cliente, nota interna (visualmente distinta, nunca enviada), registrar mensagem recebida, respostas rápidas (botão ou `/atalho`, com variáveis), anexos (até 2 MB, consultáveis), agendar retorno com atalhos de data. Ações frequentes no cabeçalho (Assumir, Retorno, Resolver); as demais em um menu.
- "Assumir" continua atômico (o servidor impede que dois atendentes assumam o mesmo atendimento); a outra tela é atualizada em tempo real.
- Atualização em tempo real preserva o texto que está sendo digitado.

### Ficha do cliente e funil
- Ficha com negociações (funil/etapa, valor, responsável, próxima ação), atendimentos, tarefas e histórico completo de interações; menu de ações secundárias.
- Funil: quadro com contagem e valor por etapa, cabeçalhos fixos, rolagem horizontal visível, cartões na ordem cliente → oportunidade → valor → responsável → último contato → próxima ação; "Sem próxima ação" e "Prazo vencido" em texto e cor. Alternância quadro/lista, filtros salvos, múltiplos funis configuráveis, motivo obrigatório de perda preservado.
- Painel lateral amplo da oportunidade com edição direta dos campos comuns, tarefas, atendimentos do cliente e histórico; o funil permanece visível atrás.

### Painel do dia
- Primeiro os indicadores que exigem ação (fila, sem resposta, retornos vencidos, oportunidades sem próxima ação), todos clicáveis e com ajuda explicando período e cálculo.
- Atendente: pendências pessoais, próximos contatos, minhas conversas, fila. Supervisão/administração: carga da equipe, clientes aguardando resposta, cumprimento do prazo de 1ª resposta, resultado comercial do mês, funil aberto e oportunidades paradas.

### Tabelas e celular
- Tabela genérica com colunas selecionáveis (persistidas por usuário), ordenação no servidor, paginação, truncamento com texto completo no título, larguras mínimas e rolagem interna. Datas em dd/mm/aaaa, valores em R$.
- Celular: lista → conversa → contexto em telas empilhadas, atalhos inferiores (fila, conversas, clientes, tarefas), indicadores compactos, foco visível e navegação por teclado (tabelas, cartões e menus são focáveis).

### Integração WhatsApp Business (API oficial)
- Recebimento via webhook idempotente (deduplicação pelo id da mensagem), criação automática de cliente e atendimento, vínculo ao atendimento aberto correto, reabertura de "aguardando cliente" quando o cliente responde, mídias como anexos.
- Envio pela central com status enviado → entregue → lido → falhou conforme os eventos da Meta; janela de 24 h respeitada, com envio de modelo aprovado fora dela.
- Estado real na área administrativa: credenciais, webhook, assinatura, último evento, último erro, contagens, pendências para concluir a conexão, registro de mensagens e detalhes técnicos. Sem credenciais nada é simulado e o registro manual permanece identificado.

### Automações
- Regras gatilho → condição → ação com ativação/pausa e histórico de execução; modelos sugeridos (tarefa após proposta, alerta de oportunidade parada, distribuição de novos atendimentos, aviso de prazo vencido ao supervisor, retorno vencido vira urgente).
- Rodízio reaproveitado com ajuste por equipe; deduplicação por estado; acompanhamentos encerrados quando o cliente responde ou a negociação é fechada; mensagens automáticas só com canal conectado e dentro das regras da Meta.

## 3. Verificações realizadas

- `npm test`: 24 testes de integração (12 originais preservados + 12 novos), incluindo API da Meta simulada. Resultado: 24/24.
- Percurso completo pela interface com Playwright (Chromium), sem erros de console: cadastrar cliente (com aviso de duplicidade) → abrir atendimento na fila com mensagem inicial → assumir → responder (Ctrl+Enter) → resposta rápida com variável → nota interna → criar oportunidade sem sair da conversa → mover etapa pelo contexto → agendar retorno (tarefa criada) → recarregar (persistência) → resolver (composição bloqueada) → visão em tabela com ordenação → disputa simultânea entre dois atendentes em dois navegadores (apenas um assume; o outro perde o acesso conforme a regra de escopo).
- Tour automatizado por todas as telas nos três perfis e em largura de celular (400 px), gerando as 37 capturas da apresentação.

## 4. Dependências externas pendentes

- **WhatsApp Business:** requer conta Meta for Developers com número aprovado, token permanente, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` e `WHATSAPP_APP_SECRET` no `.env`, além do cadastro da URL do webhook (HTTPS público) no painel da Meta. Modelos (templates) precisam ser aprovados pela Meta para envio fora da janela de 24 h. O código está pronto e testado com a API simulada; a conexão real depende dessas credenciais.
- **E-mail (SMTP):** opcional, apenas para recuperação de senha por e-mail.
- **Outros canais** (telefone, e-mail, chat, presencial) continuam como registro manual, por decisão de concluir um canal antes de apresentar outros como conectados.
- **Envio de anexos pelo WhatsApp** não foi implementado (recebimento sim); a central envia texto e modelos.

## 5. Como rodar a prévia navegável

```bash
npm install && cp .env.example .env   # ajuste DATABASE_URL e SESSION_SECRET
npm run migrate && npm run seed:demo  # dados fictícios coerentes (senha Demo12345)
npm start                             # http://localhost:3000 — admin@demo.local / supervisor@demo.local / bruno@demo.local
```
