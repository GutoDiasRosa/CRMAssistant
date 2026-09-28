import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  PlugZap,
  Unplug,
  XCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useUsuario } from "../components/RequireAuth";
import { api, type ConexaoRd } from "../lib/api";

const inputClass =
  "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent";

const formatarDataHora = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

// Campo somente leitura com botão de copiar (URLs que precisam ser coladas no RD Station).
function CampoCopiavel({ id, label, valor, ajuda }: { id: string; label: string; valor: string; ajuda: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o usuário ainda pode selecionar o texto.
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          readOnly
          value={valor}
          onFocus={(e) => e.target.select()}
          className={`${inputClass} bg-gray-50 text-gray-700 text-sm min-w-0`}
        />
        <button
          type="button"
          onClick={copiar}
          aria-label={`Copiar ${label}`}
          className="flex-shrink-0 px-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          {copiado ? <Check className="w-5 h-5 text-[#10B981]" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">{ajuda}</p>
    </div>
  );
}

function Passo({ numero, titulo, feito, children }: {
  numero: number;
  titulo: string;
  feito: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
            feito ? "bg-[#10B981] text-white" : "bg-[#EBF2F9] text-[#1B4F8A]"
          }`}
        >
          {feito ? <Check className="w-4 h-4" /> : numero}
        </span>
        <h2 className="text-base text-gray-900">{titulo}</h2>
      </div>
      {children}
    </section>
  );
}

export default function IntegracaoRdScreen() {
  const navigate = useNavigate();
  const usuario = useUsuario();
  const isAdmin = usuario.perfil === "ADMIN";
  const [searchParams, setSearchParams] = useSearchParams();

  const [conexao, setConexao] = useState<ConexaoRd | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [mostrarSecret, setMostrarSecret] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [desconectando, setDesconectando] = useState(false);
  const [confirmarDesconexao, setConfirmarDesconexao] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const carregar = () =>
    api
      .rdConexao()
      .then((c) => {
        setConexao(c);
        setClientId(c.client_id ?? "");
      })
      .catch((e: Error) => setErroCarga(e.message));

  useEffect(() => {
    if (isAdmin) carregar();
  }, [isAdmin]);

  // Retorno do callback OAuth: ?rd=conectado ou ?rd=erro&motivo=...
  useEffect(() => {
    const resultado = searchParams.get("rd");
    if (!resultado) return;
    setAviso(
      resultado === "conectado"
        ? { tipo: "sucesso", texto: "RD Station conectado com sucesso." }
        : { tipo: "erro", texto: searchParams.get("motivo") ?? "Não foi possível conectar ao RD Station." },
    );
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const credenciaisSalvas = !!conexao?.client_id && conexao.has_client_secret;
  const secretObrigatorio = !conexao?.has_client_secret || conexao.credenciais_origem !== "tela";

  const salvarCredenciais = async (e: React.FormEvent) => {
    e.preventDefault();
    setAviso(null);
    setSalvando(true);
    try {
      await api.rdSalvarCredenciais(clientId.trim(), clientSecret.trim() || null);
      setClientSecret("");
      await carregar();
      setAviso({ tipo: "sucesso", texto: "Credenciais salvas. Agora autorize o acesso ao RD Station." });
    } catch (err) {
      setAviso({ tipo: "erro", texto: (err as Error).message });
    } finally {
      setSalvando(false);
    }
  };

  const conectar = async () => {
    setAviso(null);
    setConectando(true);
    try {
      const { url } = await api.rdUrlAutorizacao();
      // Sai do app para a tela de autorização do RD; o callback traz o usuário de volta.
      window.location.href = url;
    } catch (err) {
      setAviso({ tipo: "erro", texto: (err as Error).message });
      setConectando(false);
    }
  };

  const desconectar = async () => {
    setAviso(null);
    setDesconectando(true);
    try {
      await api.rdDesconectar();
      await carregar();
      setAviso({ tipo: "sucesso", texto: "RD Station desconectado." });
    } catch (err) {
      setAviso({ tipo: "erro", texto: (err as Error).message });
    } finally {
      setDesconectando(false);
      setConfirmarDesconexao(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} aria-label="Voltar" className="p-1 -ml-1 lg:hidden">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl text-gray-900">Integração com RD Station</h1>
        </div>
      </header>

      {!isAdmin ? (
        <p className="p-6 text-sm text-gray-500">
          Apenas administradores podem configurar a integração com o RD Station.
        </p>
      ) : erroCarga ? (
        <p role="alert" className="p-6 text-sm text-[#EF4444]">
          {erroCarga}
        </p>
      ) : !conexao ? (
        <p className="p-6 text-sm text-gray-500">Carregando...</p>
      ) : (
        <div className="p-6 lg:p-10 max-w-6xl space-y-6">
          {aviso && (
            <div
              role={aviso.tipo === "erro" ? "alert" : "status"}
              className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
                aviso.tipo === "erro"
                  ? "bg-[#EF4444]/10 text-[#B91C1C]"
                  : "bg-[#10B981]/10 text-[#047857]"
              }`}
            >
              {aviso.tipo === "erro" ? (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{aviso.texto}</span>
            </div>
          )}

          {/* Resumo da conexão */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EBF2F9] rounded-full flex items-center justify-center">
                  <PlugZap className="w-5 h-5 text-[#1B4F8A]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status da conexão</p>
                  {conexao.connected ? (
                    <p className="text-base text-[#10B981]">Conectado</p>
                  ) : (
                    <p className="text-base text-gray-700">Não conectado</p>
                  )}
                </div>
              </div>
              {conexao.connected && (
                <button
                  onClick={() => setConfirmarDesconexao(true)}
                  className="px-4 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm"
                >
                  <Unplug className="w-4 h-4" />
                  Desconectar
                </button>
              )}
            </div>

            <dl className="grid gap-4 sm:grid-cols-3 mt-5 pt-5 border-t border-gray-200">
              <div>
                <dt className="text-sm text-gray-500 mb-1">Conectado em</dt>
                <dd className="text-sm text-gray-900">{formatarDataHora(conexao.conectado_em)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 mb-1">Token expira em</dt>
                <dd className="text-sm text-gray-900">{formatarDataHora(conexao.token_expira_em)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 mb-1">Última sincronização</dt>
                <dd className="text-sm text-gray-900">
                  {conexao.ultima_sincronizacao ? formatarDataHora(conexao.ultima_sincronizacao) : "Nenhuma ainda"}
                </dd>
              </div>
            </dl>

            {confirmarDesconexao && (
              <div className="mt-5 p-4 bg-red-50 rounded-lg space-y-3">
                <p className="text-sm text-gray-900">
                  Desconectar apaga os tokens de acesso. Os dados já sincronizados continuam no CRM Assist,
                  mas novas autorizações serão necessárias para voltar a acessar o RD Station.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={desconectar}
                    disabled={desconectando}
                    className="px-4 py-2 bg-[#EF4444] text-white rounded-lg text-sm hover:bg-[#DC2626] disabled:opacity-60"
                  >
                    {desconectando ? "Desconectando..." : "Confirmar desconexão"}
                  </button>
                  <button
                    onClick={() => setConfirmarDesconexao(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* Passo 1: credenciais do app criado na RD Station App Store */}
            <Passo numero={1} titulo="Credenciais do aplicativo" feito={credenciaisSalvas}>
              <p className="text-sm text-gray-600">
                Crie um aplicativo na área de desenvolvedores do RD Station e copie o Client ID e o Client
                Secret gerados.
              </p>
              <form onSubmit={salvarCredenciais} className="space-y-4">
                <div>
                  <label htmlFor="client-id" className="block text-sm text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    id="client-id"
                    required
                    autoComplete="off"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className={inputClass}
                    placeholder="Ex.: 0a1b2c3d-..."
                  />
                </div>

                <div>
                  <label htmlFor="client-secret" className="block text-sm text-gray-700 mb-2">
                    Client Secret
                  </label>
                  <div className="relative">
                    <input
                      id="client-secret"
                      type={mostrarSecret ? "text" : "password"}
                      required={secretObrigatorio}
                      autoComplete="off"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className={`${inputClass} pr-12`}
                      placeholder={secretObrigatorio ? "Cole o Client Secret" : "•••••••• (salvo)"}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSecret(!mostrarSecret)}
                      aria-label={mostrarSecret ? "Ocultar secret" : "Mostrar secret"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {mostrarSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {!secretObrigatorio && (
                    <p className="text-xs text-gray-500 mt-2">Deixe em branco para manter o secret atual.</p>
                  )}
                  {conexao.credenciais_origem === "env" && (
                    <p className="text-xs text-gray-500 mt-2">
                      Hoje as credenciais vêm do arquivo .env do servidor. Salvar aqui passa a usar as da tela.
                    </p>
                  )}
                </div>

                <CampoCopiavel
                  id="redirect-uri"
                  label="URL de redirecionamento"
                  valor={conexao.redirect_uri}
                  ajuda="Cadastre exatamente esta URL como callback no aplicativo do RD Station."
                />

                {conexao.connected && (
                  <p className="text-xs text-[#B45309] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Trocar as credenciais desconecta a integração atual.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full bg-white border border-[#1B4F8A] text-[#1B4F8A] py-3 rounded-lg hover:bg-[#EBF2F9] transition-colors disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar credenciais"}
                </button>
              </form>
            </Passo>

            <div className="space-y-6">
              {/* Passo 2: autorização OAuth */}
              <Passo numero={2} titulo="Autorizar acesso" feito={conexao.connected}>
                <p className="text-sm text-gray-600">
                  Você será levado ao RD Station para entrar com a conta da empresa e permitir o acesso do
                  CRM Assist. Depois disso, volta automaticamente para esta tela.
                </p>
                <button
                  onClick={conectar}
                  disabled={!credenciaisSalvas || conectando}
                  className="w-full bg-[#1B4F8A] text-white py-3 rounded-lg hover:bg-[#153d6e] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <PlugZap className="w-5 h-5" />
                  <span>
                    {conectando
                      ? "Abrindo o RD Station..."
                      : conexao.connected
                        ? "Reconectar ao RD Station"
                        : "Conectar ao RD Station"}
                  </span>
                </button>
                {!credenciaisSalvas && (
                  <p className="text-xs text-gray-500">Salve as credenciais do passo 1 para liberar a conexão.</p>
                )}
              </Passo>

              {/* Passo 3: webhook para sincronização automática */}
              <Passo
                numero={3}
                titulo="Webhook de sincronização"
                feito={conexao.ultima_sincronizacao !== null}
              >
                <p className="text-sm text-gray-600">
                  Para receber leads e oportunidades automaticamente, crie um webhook no RD Station apontando
                  para a URL abaixo.
                </p>
                <CampoCopiavel
                  id="webhook-url"
                  label="URL do webhook"
                  valor={conexao.webhook_url}
                  ajuda="Método POST, conteúdo em JSON."
                />
                {conexao.webhook_secret_configurado ? (
                  <p className="text-xs text-gray-600 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                    Segredo do webhook configurado no servidor. Envie-o no cabeçalho X-Webhook-Secret.
                  </p>
                ) : (
                  <p className="text-xs text-[#B45309] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Sem RD_WEBHOOK_SECRET no servidor, o webhook aceita qualquer chamada. Use só em
                    desenvolvimento.
                  </p>
                )}
              </Passo>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
