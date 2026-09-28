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
    const detail = typeof body?.detail === "string" ? body.detail : `Erro ${response.status}`;
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

export type Metricas = {
  total_leads: number;
  total_oportunidades: number;
  valor_total_oportunidades: number;
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

export type ConexaoRd = {
  connected: boolean;
  client_id: string | null;
  has_client_secret: boolean;
  credenciais_origem: "tela" | "env" | null;
  redirect_uri: string;
  webhook_url: string;
  webhook_secret_configurado: boolean;
  conectado_em: string | null;
  token_expira_em: string | null;
  ultima_sincronizacao: string | null;
};

// ---- Endpoints ----

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<Usuario>("/auth/me"),
  kanban: () => request<Record<string, OportunidadeKanban[]>>("/api/crm/kanban"),
  metricas: () => request<Metricas>("/api/crm/metricas"),
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
