# CRM Assist

Front-end de um assistente de CRM para times de vendas B2B, com integração com o RD Station, gestão de leads, chatbot com IA e acompanhamento de desempenho.

Projeto originalmente exportado do Figma Make: https://www.figma.com/design/RA8I7ImbAiQweaYPMYNnR8/CRM-Assist

> O backend (FastAPI + PostgreSQL + integração RD Station) está na branch [`cursor/backend-tcc-fastapi-rd-station`](https://github.com/GutoDiasRosa/CRMAssistant/tree/cursor/backend-tcc-fastapi-rd-station).

## Stack

- [Vite](https://vite.dev/) 6
- [React](https://react.dev/) 18 + TypeScript
- [React Router](https://reactrouter.com/) 7
- [Tailwind CSS](https://tailwindcss.com/) 4
- Componentes baseados em [Radix UI](https://www.radix-ui.com/) / shadcn

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (recomendado 20+)
- npm 9 ou superior

## Como rodar o projeto

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

3. Abra [http://localhost:5173](http://localhost:5173) no navegador.

## Scripts disponíveis

| Comando         | Descrição                                      |
| --------------- | ----------------------------------------------- |
| `npm run dev`   | Inicia o servidor de desenvolvimento (Vite)      |
| `npm run build` | Gera a build de produção em `dist/`              |

## Verificação de tipos

O projeto usa TypeScript. Para checar os tipos sem gerar arquivos:

```bash
npx tsc --noEmit
```
