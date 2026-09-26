# CRM Assist

Assistente de CRM com inteligência artificial para equipes de vendas B2B, integrado ao **RD Station**. É o projeto de Trabalho de Conclusão de Curso (TCC) de Augusto Dias Rosa no COTEMIG.

Com o CRM Assist, cada membro do time comercial consulta funil, leads, desempenho e relatórios **em linguagem natural**, sem depender de quem domina o RD Station.

Protótipo de telas no Figma: https://www.figma.com/design/RA8I7ImbAiQweaYPMYNnR8/CRM-Assist

## Estrutura do repositório

| Parte | Tecnologia | Onde |
|---|---|---|
| Front-end | React 18, Vite 6, TypeScript, Tailwind CSS 4, React Router 7 | raiz (`src/`) |
| Backend (API) | Python, FastAPI, PostgreSQL, LangChain + Claude | [`backend/`](backend/README.md) |

```
.
├── src/                 # Front-end: telas, componentes e estilos
├── backend/             # API FastAPI (ver backend/README.md)
├── docker-compose.yml   # Banco PostgreSQL + API
├── package.json         # Dependências do front-end
└── vite.config.ts
```

## Backend

Pela raiz do repositório:

```bash
docker compose up --build
```

- API: <http://localhost:8000>
- Documentação interativa: <http://localhost:8000/docs>

Arquitetura, endpoints, variáveis de ambiente e execução sem Docker estão no [README do backend](backend/README.md).

## Front-end

Pré-requisitos: [Node.js](https://nodejs.org/) 18 ou superior (recomendado 20+) e npm 9 ou superior.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

3. Abra <http://localhost:5173> no navegador.

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento (Vite) |
| `npm run build` | Gera a build de produção em `dist/` |
| `npx tsc --noEmit` | Verifica os tipos TypeScript sem gerar arquivos |

> As telas ainda usam dados de exemplo. A integração com a API é o próximo passo.
