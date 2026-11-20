// Cliente HTTP da API do CRM Assist (repositório CRMAssistant-backend).

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "crmassist.token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Sem localStorage (modo privado): o login vale só até recarregar a página.
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar ao servidor. Verifique se a API está rodando.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    // FastAPI devolve texto nos erros da aplicação e uma lista nos de validação.
    const detail =
      typeof body?.detail === "string"
        ? body.detail
        : Array.isArray(body?.detail) && body.detail.length
          ? body.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join("; ")
          : `Erro ${response.status}`;
    throw new ApiError(response.status, detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ---- Tipos das respostas ----

export type Usuario = {
  id: string;
  email: string;
  nome: string;
  perfil: Perfil;
};

export type Perfil = "SDR" | "CLOSER" | "GERENTE" | "DIRETOR" | "ANALISTA" | "ADMIN";

export type NovoUsuario = {
  nome: string;
  email: string;
  password: string;
  perfil: Perfil;
};

export type OportunidadeKanban = {
  id: string;
  rd_deal_id: string | null;
  nome: string;
  valor: number | null;
  status: string | null;
  usuario_id: string | null;
  lead_id: string | null;
  lead_nome: string | null;
};

export type FiltrosKanban = {
  usuario_id?: string;
  inicio?: string; // ISO 8601, inclusivo
  fim?: string; // ISO 8601, exclusivo
  busca?: string; // parte do nome da empresa ou do contato
  situacao?: "abertas" | "em_andamento" | "pausadas" | "ganhas" | "perdidas";
  valor_min?: string;
  valor_max?: string;
};

export type FiltrosLeads = {
  busca?: string; // parte do nome, e-mail ou telefone
  usuario_id?: string;
  criado_de?: string; // AAAA-MM-DD
  criado_ate?: string; // AAAA-MM-DD
  oportunidades?: "com_aberta" | "com_ganha" | "sem";
  rd?: "sincronizado" | "local";
};

export type Vendedor = { id: string; nome: string };

// Prospectados, qualificados e convertidos contam as oportunidades criadas no período;
// fechados e perdidos, as encerradas no período (data de fechamento).
export type PerformanceNumeros = {
  prospectados: number;
  valor_prospectado: number;
  qualificados: number;
  convertidos: number; // das criadas no período, as já ganhas (base da taxa de conversão)
  fechados: number;
  valor_fechado: number;
  perdidos: number;
  valor_perdido: number;
};

export type PerformanceVendedor = PerformanceNumeros & {
  id: string;
  nome: string;
  perfil: Perfil;
};

export type PerformanceTime = {
  vendedores: PerformanceVendedor[];
  totais: PerformanceNumeros;
};

type QuantidadeValor = { quantidade: number; valor: number };

// Leads e oportunidades contam pela data de criação; ganhas e perdidas, pela data de fechamento.
export type Metricas = {
  total_leads: number;
  total_oportunidades: number;
  valor_total_oportunidades: number;
  abertas: QuantidadeValor;
  ganhas: QuantidadeValor;
  perdidas: QuantidadeValor;
};

export type ChatResposta = {
  detected_intent: string;
  response_text: string;
  sessionId: string;
};

export type Sincronizacao = {
  id: string;
  status: string;
  event_type: string | null;
  created_at: string;
};

// Status de negociação do RD Station CRM ("open" vem de dados antigos de demonstração).
export type StatusOportunidade = "ongoing" | "won" | "lost" | "paused";

export const STATUS_OPORTUNIDADE: Record<StatusOportunidade, string> = {
  ongoing: "Em andamento",
  won: "Ganha",
  lost: "Perdida",
  paused: "Pausada",
};

export function rotuloStatus(status: string | null): string {
  if (status === "open") return STATUS_OPORTUNIDADE.ongoing;
  return STATUS_OPORTUNIDADE[status as StatusOportunidade] ?? status ?? "—";
}

// Funis e etapas: do RD Station CRM quando conectado; senão, as etapas já usadas no CRM Assist.
export type FunilVendas = { id: string | null; nome: string; etapas: { id: string | null; nome: string }[] };
export type Etapas = { origem: "rd" | "local"; funis: FunilVendas[]; aviso: string | null };

export type OportunidadeDetalhe = {
  id: string;
  rd_deal_id: string | null;
  nome: string;
  valor: number | null;
  status: string | null;
  etapa_funil: string | null;
  rd_stage_id: string | null;
  responsavel: { id: string; nome: string } | null;
  contato: { id: string; nome: string; email: string | null; telefone: string | null } | null;
  interacoes: { id: string; tipo: string; descricao: string; created_at: string }[];
  created_at: string;
  updated_at: string;
};

export type OportunidadeEntrada = {
  nome: string;
  valor: number | null;
  etapa: string | null;
  etapa_rd_id: string | null;
  status: StatusOportunidade;
  usuario_id: string | null;
  // Lead já existente (criação a partir da tela do lead).
  lead_id?: string | null;
  contato: { nome: string; email: string | null; telefone: string | null } | null;
};

export type LeadResumo = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  responsavel: { id: string; nome: string } | null;
  oportunidades: number;
  sincronizado: boolean;
  rd_lead_id: string | null;
  updated_at: string;
};

export type TipoAnotacao = "nota" | "ligacao" | "email" | "whatsapp" | "reuniao" | "visita";

export const TIPO_ANOTACAO: Record<TipoAnotacao, string> = {
  nota: "Nota",
  ligacao: "Ligação",
  email: "E-mail",
  whatsapp: "WhatsApp",
  reuniao: "Reunião",
  visita: "Visita",
};

export type Anotacao = {
  id: string;
  tipo: TipoAnotacao;
  descricao: string;
  data: string; // quando o contato aconteceu
  retorno_em: string | null; // AAAA-MM-DD do próximo contato combinado
  autor: { id: string; nome: string } | null;
  lead: { id: string; nome: string } | null;
  oportunidade: { id: string; nome: string } | null;
  pode_editar: boolean;
};

export type AnotacaoEntrada = {
  lead_id?: string | null;
  oportunidade_id?: string | null;
  tipo: TipoAnotacao;
  descricao: string;
  data?: string | null;
  retorno_em?: string | null;
};

// Página do contato no RD Station CRM (RD Vendas); exige estar logado no RD.
export const linkContatoRd = (rdId: string) => `https://crm.rdstation.com/app#/contacts/${rdId}`;

export type LeadDetalhe = Omit<LeadResumo, "oportunidades"> & {
  oportunidades: { id: string; nome: string; etapa_funil: string | null; valor: number | null; status: string | null }[];
  created_at: string;
};

export type LeadEntrada = {
  nome: string;
  email: string | null;
  telefone: string | null;
  usuario_id: string | null;
};

export type LeadSalvo = { lead: LeadDetalhe; rd: { enviado: boolean; mensagem: string | null } };

// Resultado de salvar: a oportunidade e se ela chegou ao RD Station CRM.
export type OportunidadeSalva = {
  oportunidade: OportunidadeDetalhe;
  rd: { enviado: boolean; mensagem: string | null };
};

export type ConexaoRd = {
  ativo: boolean;
  // Credenciais do app (OAuth)
  client_id: string | null;
  has_client_secret: boolean;
  redirect_uri: string;
  // Usuário responsável pelos registros novos
  usuario_integracao: { id: string; nome: string } | null;
  // Autorização OAuth
  connected: boolean;
  token_status: "ausente" | "valido" | "expirado";
  conectado_em: string | null;
  token_expira_em: string | null;
  // Webhooks criados pelo CRM Assist no RD Station ao concluir a autorização
  webhooks: { event_type: string; uuid: string | null }[];
  webhook_erro: string | null;
  ultima_sincronizacao: string | null;
  ultima_falha: { em: string; mensagem: string } | null;
  falhas_ultimos_7_dias: number;
};

// ---- Endpoints ----

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<Usuario>("/auth/me"),
  kanban: (filtros: FiltrosKanban = {}) => {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) if (valor) params.set(chave, valor);
    const query = params.toString();
    return request<Record<string, OportunidadeKanban[]>>(`/api/crm/kanban${query ? `?${query}` : ""}`);
  },
  vendedores: () => request<Vendedor[]>("/api/crm/vendedores"),
  performance: (filtros: { inicio?: string; fim?: string } = {}) => {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) if (valor) params.set(chave, valor);
    const query = params.toString();
    return request<PerformanceTime>(`/api/crm/performance${query ? `?${query}` : ""}`);
  },
  metricas: (filtros: { inicio?: string; fim?: string } = {}) => {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) if (valor) params.set(chave, valor);
    const query = params.toString();
    return request<Metricas>(`/api/crm/metricas${query ? `?${query}` : ""}`);
  },
  etapas: () => request<Etapas>("/api/crm/etapas"),
  leads: (filtros: FiltrosLeads = {}) => {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) if (valor) params.set(chave, valor);
    const query = params.toString();
    return request<LeadResumo[]>(`/api/crm/leads${query ? `?${query}` : ""}`);
  },
  lead: (id: string) => request<LeadDetalhe>(`/api/crm/leads/${id}`),
  anotacoes: (filtros: { lead_id?: string; oportunidade_id?: string; inicio?: string; fim?: string; usuario_id?: string }) => {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) if (valor) params.set(chave, valor);
    return request<Anotacao[]>(`/api/crm/anotacoes?${params.toString()}`);
  },
  retornos: (filtros: { ate: string; de?: string; usuario_id?: string }) => {
    const params = new URLSearchParams();
    for (const [chave, valor] of Object.entries(filtros)) if (valor) params.set(chave, valor);
    return request<Anotacao[]>(`/api/crm/anotacoes/retornos?${params.toString()}`);
  },
  criarAnotacao: (dados: AnotacaoEntrada) =>
    request<Anotacao>("/api/crm/anotacoes", { method: "POST", body: JSON.stringify(dados) }),
  atualizarAnotacao: (id: string, dados: AnotacaoEntrada) =>
    request<Anotacao>(`/api/crm/anotacoes/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  excluirAnotacao: (id: string) => request<void>(`/api/crm/anotacoes/${id}`, { method: "DELETE" }),
  criarLead: (dados: LeadEntrada) =>
    request<LeadSalvo>("/api/crm/leads", { method: "POST", body: JSON.stringify(dados) }),
  atualizarLead: (id: string, dados: LeadEntrada) =>
    request<LeadSalvo>(`/api/crm/leads/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  oportunidade: (id: string) => request<OportunidadeDetalhe>(`/api/crm/oportunidades/${id}`),
  criarOportunidade: (dados: OportunidadeEntrada) =>
    request<OportunidadeSalva>("/api/crm/oportunidades", { method: "POST", body: JSON.stringify(dados) }),
  atualizarOportunidade: (id: string, dados: OportunidadeEntrada) =>
    request<OportunidadeSalva>(`/api/crm/oportunidades/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  sincronizacoes: () => request<Sincronizacao[]>("/api/crm/sincronizacoes"),
  rdStatus: () => request<{ connected: boolean }>("/oauth/rd/status"),
  chat: (mensagem: string, sessionId: string | null) =>
    request<ChatResposta>("/chat", {
      method: "POST",
      body: JSON.stringify({ mensagem, sessionId }),
    }),
  // Integração com o RD Station (somente perfil ADMIN)
  rdConexao: () => request<ConexaoRd>("/oauth/rd/conexao"),
  rdSalvarCredenciais: (client_id: string, client_secret: string | null) =>
    request<void>("/oauth/rd/credenciais", {
      method: "PUT",
      body: JSON.stringify({ client_id, client_secret }),
    }),
  rdSalvarConfiguracao: (dados: { ativo?: boolean; usuario_integracao_id?: string | null }) =>
    request<void>("/oauth/rd/configuracao", { method: "PUT", body: JSON.stringify(dados) }),
  rdCriarWebhook: () => request<void>("/oauth/rd/webhook", { method: "POST" }),
  // Cria (ou atualiza) um contato de teste no RD Station CRM
  rdTestar: () =>
    request<{ email: string; contato_id: string; criado: boolean }>("/oauth/rd/testar", { method: "POST" }),
  rdUrlAutorizacao: () => request<{ url: string }>("/oauth/rd/authorize-url", { method: "POST" }),
  rdDesconectar: () => request<void>("/oauth/rd/conexao", { method: "DELETE" }),
  // Gestão de usuários (somente perfil ADMIN)
  listarUsuarios: () => request<Usuario[]>("/usuarios"),
  criarUsuario: (dados: NovoUsuario) =>
    request<Usuario>("/usuarios", { method: "POST", body: JSON.stringify(dados) }),
};

// ---- Formatação ----

export const PERFIL_LABEL: Record<Perfil, string> = {
  SDR: "Prospector (SDR)",
  CLOSER: "Closer",
  GERENTE: "Gerente comercial",
  DIRETOR: "Diretor",
  ANALISTA: "Analista de CRM",
  ADMIN: "Administrador",
};

// Perfis que enxergam os dados de toda a equipe (RF07).
export const PERFIS_VISAO_TOTAL: Perfil[] = ["GERENTE", "DIRETOR", "ANALISTA", "ADMIN"];

export function formatarMoeda(valor: number | null): string {
  if (valor === null) return "—";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
