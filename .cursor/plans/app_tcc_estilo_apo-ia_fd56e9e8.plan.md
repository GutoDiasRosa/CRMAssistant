---
name: App TCC estilo APO-IA
overview: "Backend FastAPI (PostgreSQL apenas) com camadas estilo APO-IA: rotas → CrmAssistantOrchestratorService único → agentes LangChain → repositórios. Ingestão a partir do RD Station numa pasta única (ex.: rd_station_sync). Webhook RD alinhado ao CRM para leads e oportunidades. Front-end fora do escopo imediato."
todos:
  - id: scaffold-fastapi
    content: Esqueleto FastAPI + Poetry/pyproject, config Pydantic, main.py, docker-compose (Postgres + API), README
    status: completed
  - id: db-der
    content: DER do TCC em SQLAlchemy + Alembic (PostgreSQL); repositórios e filtros RF07
    status: completed
  - id: rd-sync-folder
    content: "Pasta única app/core/rd_station_sync/ (ou nome alinhado ao projeto): parse payload RD, normalização, upsert leads/oportunidades + tabela sincronizacao; reutilizado por webhook e por sync manual/OAuth"
    status: completed
  - id: rd-webhook-endpoint
    content: "POST /webhooks/rd-station (ou path oficial RD): validação assinatura/segredo, idempotência, BackgroundTasks; mapear eventos CRM → leads/oportunidades no PostgreSQL"
    status: completed
  - id: rd-oauth
    content: OAuth2 RD Station (authorize/callback), tokens, cliente API para complementar webhook quando necessário
    status: completed
  - id: agents-orchestrator
    content: CrmAssistantOrchestratorService único; IntentRouter + agentes; POST /chat; sem AgenteSupportService nem Doc360
    status: completed
  - id: rf06-rnf
    content: Endpoints REST para dados agregados (kanban, métricas), auth JWT, logging, OpenAPI, LGPD
    status: completed
isProject: false
---

# Plano: backend TCC com organização APO-IA (PostgreSQL, RD Station, sem front imediato)

## Contexto

- **Referência de organização:** [README_apoia.md](c:\ObsidianVault\Sisloc\README_apoia.md) — FastAPI, serviços orquestradores, agentes, repositórios. **Não** replicamos o segundo braço do APO-IA: **sem** `AgenteSupportService`, **sem** integração **Doc360** nem fluxos paralelos de suporte sobre histórico de tickets de terceiros.
- **Negócio:** [contexto_projeto_tcc.md](c:\ObsidianVault\COTEMIG\TCC\contexto_projeto_tcc.md) — RD Station (OAuth 2.0), assistente NL, funil, perfis, DER com `usuario`, `leads`, `oportunidade`, `interacao`, `conversa_chatbot`, `mensagem`, `relatorio`, `sincronizacao`.

**SGBD:** **somente PostgreSQL** — o DER e toda a persistência da aplicação usam PostgreSQL (tipos, migrações e documentação do TCC devem ser alinhados a PG, sem menção a MySQL no planejamento de implementação).

**Front-end:** **fora do escopo deste plano imediato** — nenhuma pasta `frontend/` obrigatória neste repositório por ora; quando existir, pode ser **projeto ou ambiente separado**; a API expõe REST/OpenAPI para consumo futuro.

---

## Diagrama (backend + RD + PostgreSQL)

```mermaid
flowchart TB
  subgraph external [Externos]
    RD[RD_Station_API]
    RDHook[RD_Station_webhooks]
  end
  subgraph api [Backend]
    Routes[FastAPI_routes]
    WebhookRoute[POST_webhooks_rd_station]
    Orch[CrmAssistantOrchestratorService]
    Agents[IntentRouter_agents]
    SyncModule[rd_station_sync_pasta_unica]
    Repo[Repositories]
  end
  subgraph data [Dados]
    PG[(PostgreSQL_DER)]
  end
  RDHook -->|HTTPS_payload_assinado| WebhookRoute
  WebhookRoute --> SyncModule
  Routes --> Orch
  Orch --> Agents
  Agents --> Repo
  Agents --> RD
  SyncModule --> Repo
  Repo --> PG
```

---

## Estrutura de pastas (espelho conceitual do APO-IA, simplificado)

Repositório [CRMAssistant](c:\Projetos\CRMAssistant): **apenas backend** neste ciclo (raiz `app/` ou `backend/app/` conforme preferência).


| Referência APO-IA | Equivalente neste projeto |
| --- | --- |
| `app/routes/chatbot.py` (sem `agente_support`) | `chat_crm.py`, `integracao_rd.py` (OAuth), `webhooks_rd.py`, `auth.py`, rotas de dados para kanban/relatórios quando necessário |
| `AgentsOrchestratorService` | **`CrmAssistantOrchestratorService` único** — toda assistência NL |
| `AgenteSupportService`, Doc360 | **Não implementar** |
| `core/agents/*` | Agentes CRM (intent router, resumo, funil, performance, conversacional, fora de escopo) — só orquestrador único |
| `core/retrievers/*` + `core/etl/*` | **Substituídos por uma única pasta**, por exemplo `app/core/rd_station_sync/`: recebe payloads/API RD, normaliza e grava no PostgreSQL (`leads`, `oportunidade`, log em `sincronizacao`). Pode organizar internamente em funções tipo extract/transform/load, **sem** subpastas paralelas “retriever” vs “etl”. |
| `domain/repositories/*`, `db/models.py` | Igual ideia APO-IA: repositórios + modelos SQLAlchemy do DER |
| `migrations/` | Alembic / SQL inicial **só** para tabelas relacionais do DER |

---

## Webhook RD Station (obrigatório no plano)

- **Endpoint dedicado**, por exemplo `POST /webhooks/rd-station` (ajustar path ao que a documentação oficial do RD Station CRM exigir para webhooks).
- **Padrões CRM / segurança:** validar **assinatura ou token secreto** configurado no painel RD; rejeitar corpo inválido com 4xx; responder rápido (ex.: 200/202) e processar persistência em **BackgroundTasks** ou fila leve, para não estourar timeout do RD em picos.
- **Idempotência:** usar IDs estáveis do RD (`lead_id`, `deal_id`/oportunidade) em `upsert` para evitar duplicatas em reentregas.
- **Escopo da sincronização neste endpoint:** **leads** e **oportunidades** (mapeamento dos campos do payload RD → colunas das tabelas `leads` e `oportunidade` + FKs/`usuario` quando aplicável); registrar cada execução em **`sincronizacao`** (status, payload resumido, erros).
- **Mesma lógica reutilizada:** o módulo da pasta única `rd_station_sync` é chamado pelo webhook e pode ser chamado por **sync manual** ou **jobs** após OAuth, evitando duplicação de código.

Documentação oficial RD Station para **formato do webhook, headers e verificação** deve ser seguida na implementação (não fixar aqui um JSON fictício).

---

## Subsistemas

1. **Assistente NL** — `POST /chat` (ou `/assistant/chat`): um orquestrador, IntentRouter, tools contra **PostgreSQL** (dados já sincronizados) e **API RD** quando precisar de dado em tempo real.
2. **Sincronização de dados** — webhook + pasta `rd_station_sync`; opcional scheduler como **fallback** (RNF de atraso aceitável).
3. **OAuth RD (RF02)** — authorize/callback, armazenamento e renovação de tokens.
4. **Auth app (RF01)** — JWT (ou sessão) para usuários; RF07 nos serviços/repos.

---

## Banco de dados

- PostgreSQL: tabelas do DER — `usuario`, `leads`, `oportunidade`, `interacao`, `conversa_chatbot`, `mensagem`, `relatorio`, `sincronizacao`.
- Escopo de dados: **somente** tabelas relacionais do DER e registros de sincronização; **sem** camada de busca semântica sobre corpus interno nesta entrega.

---

## Variáveis de ambiente (backend)

- `POSTGRES_URL` (asyncpg/SQLAlchemy async).
- OAuth RD: client id, secret, redirect URI; **segredo do webhook** (ou chave pública conforme doc RD).
- `ANTHROPIC_API_KEY` / `LLM_PROVIDER`, `JWT_SECRET`.
- `CORS_ORIGINS`: pode ficar restrito a localhost genérico ou vazio até existir front; quando o front for outro repo, configurar origem real.

---

## Fases (sem front)

1. Esqueleto FastAPI + Docker (Postgres + API) + DER em migrations.
2. `rd_station_sync`: módulos internos (parse, map, upsert) + testes com payloads de exemplo da doc RD.
3. **Webhook** `POST /webhooks/...` + persistência leads/oportunidades + `sincronizacao`.
4. OAuth RD + primeira carga complementar se necessário.
5. Auth JWT + endpoints de leitura agregada (kanban, etc.) conforme RF.
6. `CrmAssistantOrchestratorService` + agentes + `/chat`.
7. RNF: logging, OpenAPI, HTTPS em deploy, LGPD.

---

## Decisões para documentar no TCC

- Persistência e implementação **exclusivamente em PostgreSQL** (alinhamento técnico ao stack de referência e ao deploy único).
- **Sem** segunda linha de produto “suporte/KB”; **sem** Doc360.
- **Ingestão RD** centralizada em **uma pasta**; **webhook** como canal principal de atualização de leads e oportunidades.
- **Interface:** consumidores futuros (web mobile, outro repositório) via API; escopo de front **adiado**.

---

## Fora de escopo

- Front-end (TypeScript/Figma) neste momento — decisão de mono vs multi repo fica em aberto.
- `AgenteSupportService`, `/agente`, Doc360, fluxos de suporte sobre tickets de sistemas externos.
- n8n como obrigatório (RD pode apontar webhook direto para esta API).
