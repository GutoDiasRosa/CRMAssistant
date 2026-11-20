# CRM Assist

Front-end do **CRM Assist**, assistente de CRM com inteligência artificial para equipes de vendas B2B, integrado ao RD Station CRM. Trabalho de Conclusão de Curso (TCC) de Augusto Dias Rosa no COTEMIG, 2026.

> O backend (FastAPI + PostgreSQL + integração RD Station) fica em um repositório separado: [CRMAssistant-backend](https://github.com/GutoDiasRosa/CRMAssistant-backend). Para rodar o sistema completo, com a escolha de carregar ou não dados de teste, siga o **Guia da banca** (`GUIA-DA-BANCA.md`, na raiz do backend).

## Telas

| Tela | O que faz |
|---|---|
| Início | Indicadores do período: novos leads, novas oportunidades, ganhas e perdidas |
| Funil | Kanban das oportunidades por etapa, com busca por nome, período e filtros avançados (responsável, situação, valor) |
| Leads | Lista com busca e filtros avançados (responsável, data de cadastro, oportunidades, RD Station); detalhe, criação e edição |
| Oportunidade | Detalhe, edição, marcar como ganha ou perdida e anotações |
| Agenda | Retornos do dia e atrasados e as anotações do dia; gerentes escolhem de quem é a agenda |
| Assistente | Chat em linguagem natural com a IA; o botão "Pedir resumo ao assistente" abre com a pergunta pronta |
| Performance do time | Prospectados, qualificados e fechados por vendedor no período |
| Usuários e Integração RD | Exclusivas do administrador: cadastro da equipe e conexão com o RD Station CRM |

Cada perfil vê só o que pode: SDRs e closers enxergam a própria carteira; gerente, diretor, analista e administrador veem a equipe toda.

O layout partiu de um protótipo no Figma Make: https://www.figma.com/design/RA8I7ImbAiQweaYPMYNnR8/CRM-Assist

## Stack

- [Vite](https://vite.dev/) 6
- [React](https://react.dev/) 18 + TypeScript
- [React Router](https://reactrouter.com/) 7
- [Tailwind CSS](https://tailwindcss.com/) 4
- Componentes baseados em [Radix UI](https://www.radix-ui.com/) / shadcn

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior (recomendado 20+)
- npm 9 ou superior
- A API do [CRMAssistant-backend](https://github.com/GutoDiasRosa/CRMAssistant-backend) rodando

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

O front-end conversa com a API pelo endereço em `VITE_API_URL`. Para usar a API local, copie o exemplo antes do passo 2:

```bash
copy .env.example .env   # Windows
cp .env.example .env     # Linux ou macOS
```

Sem o arquivo, o padrão também é `http://localhost:8000`. A API precisa estar no ar (veja o Guia da banca no repositório do backend).

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

## Publicação

A versão publicada roda na Vercel a partir da branch `main` (o `vercel.json` manda as rotas do React Router para o `index.html`).
