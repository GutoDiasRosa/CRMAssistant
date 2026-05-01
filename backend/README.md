# CRMAssistant API

Backend FastAPI do TCC: PostgreSQL, webhook RD Station (`POST /webhooks/rd-station`), OAuth RD, chat com `CrmAssistantOrchestratorService`, endpoints de kanban e métricas (RF07).

## Requisitos

- Python 3.11+
- PostgreSQL 16 (local ou Docker)

## Setup (pip)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
# ajuste POSTGRES_URL e JWT_SECRET
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Opcional: também existe `pyproject.toml` para quem usa [Poetry](https://python-poetry.org/).

Na primeira subida com `uvicorn` (sem `SKIP_ALEMBIC_ON_STARTUP=1`), o `lifespan` executa `alembic upgrade head` automaticamente.

## Docker (raiz do repositório)

```bash
docker compose up --build
```

API: `http://localhost:8000` — documentação: `/docs`.

## Endpoints principais

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/health` | Saúde |
| POST | `/auth/register` | Cadastro |
| POST | `/auth/login` | JWT |
| DELETE | `/auth/me/lgpd` | Exclusão de dados (LGPD) |
| GET | `/oauth/rd/authorize` | Redireciona ao RD OAuth |
| GET | `/oauth/rd/callback` | Troca `code` por tokens |
| GET | `/oauth/rd/status` | Há token RD? (autenticado) |
| POST | `/webhooks/rd-station` | Webhook RD (header `X-Webhook-Secret` se `RD_WEBHOOK_SECRET` definido) |
| POST | `/chat` | Chat NL (Bearer) |
| GET | `/api/crm/kanban` | Kanban |
| GET | `/api/crm/metricas` | Totais |

## Webhook

Configure no RD Station a URL pública `https://seu-dominio/webhooks/rd-station` e o mesmo segredo em `RD_WEBHOOK_SECRET` / header `X-Webhook-Secret`. Payload aceito: objeto JSON com `lead` e/ou `deal` (ou equivalentes aninhados em `data`) — ver `app/core/rd_station_sync/normalize.py`.

## Testes

```powershell
cd backend
$env:SKIP_ALEMBIC_ON_STARTUP="1"
python -m pytest -q
```
