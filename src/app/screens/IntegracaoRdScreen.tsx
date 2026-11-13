import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  PlugZap,
  RefreshCw,
  Unplug,
  XCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useUsuario } from "../components/RequireAuth";
import { Switch } from "../components/ui/switch";
import { api, PERFIL_LABEL, type ConexaoRd, type Usuario } from "../lib/api";

const RD_LINKS = {
  appStore: "https://appstore.rdstation.com/pt-BR/publisher",
  tokens: "https://app.rdstation.com.br/integracoes/tokens",
  webhooks: "https://app.rdstation.com.br/integracoes/webhooks",
};

const inputClass =
  "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent";
const botaoSecundario =
  "w-full bg-white border border-[#1B4F8A] text-[#1B4F8A] py-3 rounded-lg hover:bg-[#EBF2F9] transition-colors disabled:opacity-60";

type Aviso = { tipo: "sucesso" | "erro"; texto: string };

const formatarDataHora = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

// Campo somente leitura com botão de copiar (URLs que precisam ser coladas no RD Station).
function CampoCopiavel({ id, label, valor, ajuda }: { id: string; label: string; valor: string; ajuda?: string }) {
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
      {ajuda && <p className="text-xs text-gray-500 mt-2">{ajuda}</p>}
    </div>
  );
}

// Campo de segredo: nunca recebe o valor salvo de volta; em branco mantém o atual.
function CampoSegredo({ id, label, valor, onChange, salvo }: {
  id: string;
  label: string;
  valor: string;
  onChange: (v: string) => void;
  salvo: boolean;
}) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={mostrar ? "text" : "password"}
          required={!salvo}
          autoComplete="off"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-12`}
          placeholder={salvo ? "•••••••• (salvo)" : `Cole o ${label}`}
        />
        <button
          type="button"
          onClick={() => setMostrar(!mostrar)}
          aria-label={mostrar ? `Ocultar ${label}` : `Mostrar ${label}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {mostrar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {salvo && <p className="text-xs text-gray-500 mt-2">Deixe em branco para manter o valor atual.</p>}
    </div>
  );
}

function LinkRd({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-[#1B4F8A] hover:underline"
    >
      {children}
      <ExternalLink className="w-3.5 h-3.5" />
    </a>
  );
}

function Passo({ numero, titulo, feito, status, children }: {
  numero: number;
  titulo: string;
  feito: boolean;
  status?: string;
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
        <h2 className="text-base text-gray-900 flex-1">{titulo}</h2>
        {feito && status && <span className="text-xs text-[#047857] hidden sm:inline">{status}</span>}
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
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  // Ação em andamento (só uma por vez): desabilita o botão correspondente.
  const [ocupado, setOcupado] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [tokenPublico, setTokenPublico] = useState("");
  const [tokenPrivado, setTokenPrivado] = useState("");
  const [confirmarDesconexao, setConfirmarDesconexao] = useState(false);
  const [confirmarNovaUrl, setConfirmarNovaUrl] = useState(false);

  const carregar = async () => {
    const c = await api.rdConexao();
    setConexao(c);
    setClientId(c.client_id ?? "");
    setTokenPublico(c.token_publico ?? "");
    setErroCarga(null);
  };

  const carregarInicial = () => {
    setErroCarga(null);
    carregar().catch((e: Error) => setErroCarga(e.message));
    api
      .listarUsuarios()
      .then(setUsuarios)
      .catch(() => setUsuarios([]));
  };

  useEffect(() => {
    if (isAdmin) carregarInicial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Retorno do callback OAuth: ?rd=conectado ou ?rd=erro&motivo=...
  useEffect(() => {
    const resultado = searchParams.get("rd");
    if (!resultado) return;
    setAviso(
      resultado === "conectado"
        ? { tipo: "sucesso", texto: "RD Station autorizado com sucesso." }
        : { tipo: "erro", texto: searchParams.get("motivo") ?? "Não foi possível conectar ao RD Station." },
    );
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Executa uma ação, recarrega o estado e mostra o resultado; um erro ao recarregar
  // vira aviso em vez de derrubar a tela inteira.
  const executar = async (chave: string, acao: () => Promise<unknown>, sucesso?: string) => {
    setAviso(null);
    setOcupado(chave);
    try {
      await acao();
      await carregar();
      if (sucesso) setAviso({ tipo: "sucesso", texto: sucesso });
      return true;
    } catch (err) {
      setAviso({ tipo: "erro", texto: (err as Error).message });
      return false;
    } finally {
      setOcupado(null);
    }
  };

  const salvarCredenciais = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await executar(
      "credenciais",
      () => api.rdSalvarCredenciais(clientId.trim(), clientSecret.trim() || null),
      "Credenciais salvas. Agora autorize o acesso ao RD Station.",
    );
    if (ok) setClientSecret("");
  };

  const salvarTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await executar(
      "tokens",
      () => api.rdSalvarTokensApi(tokenPublico.trim(), tokenPrivado.trim() || null),
      "Tokens da API salvos.",
    );
    if (ok) setTokenPrivado("");
  };

  const conectar = async () => {
    setAviso(null);
    setOcupado("conectar");
    try {
      const { url } = await api.rdUrlAutorizacao();
      // Sai do app para a tela de autorização do RD; o callback traz o usuário de volta.
      window.location.href = url;
    } catch (err) {
      setAviso({ tipo: "erro", texto: (err as Error).message });
      setOcupado(null);
    }
  };

  const testar = async () => {
    setAviso(null);
    setOcupado("testar");
    try {
      const { conta } = await api.rdTestar();
      setAviso({
        tipo: "sucesso",
        texto: conta ? `Conexão funcionando (conta: ${conta}).` : "Conexão com o RD Station funcionando.",
      });
    } catch (err) {
      setAviso({ tipo: "erro", texto: (err as Error).message });
    } finally {
      setOcupado(null);
      // O teste pode ter renovado (ou invalidado) o token: atualiza o status.
      carregar().catch(() => undefined);
    }
  };

  if (!isAdmin) {
    return (
      <Tela onVoltar={() => navigate("/settings")}>
        <p className="p-6 text-sm text-gray-500">
          Apenas administradores podem configurar a integração com o RD Station.
        </p>
      </Tela>
    );
  }
  if (erroCarga) {
    return (
      <Tela onVoltar={() => navigate("/settings")}>
        <div className="p-6 space-y-3">
          <p role="alert" className="text-sm text-[#EF4444]">
            {erroCarga}
          </p>
          <button onClick={carregarInicial} className="text-sm text-[#1B4F8A] hover:underline">
            Tentar novamente
          </button>
        </div>
      </Tela>
    );
  }
  if (!conexao) {
    return (
      <Tela onVoltar={() => navigate("/settings")}>
        <p className="p-6 text-sm text-gray-500">Carregando...</p>
      </Tela>
    );
  }

  const credenciaisSalvas = !!conexao.client_id && conexao.has_client_secret;
  const tokensSalvos = !!conexao.token_publico && conexao.has_token_privado;
  const autorizado = conexao.token_status === "valido";
  const statusConexao = !conexao.ativo
    ? { texto: "Integração desativada", cor: "text-gray-500" }
    : conexao.token_status === "valido"
      ? { texto: "Conectado", cor: "text-[#10B981]" }
      : conexao.token_status === "expirado"
        ? { texto: "Autorização expirada", cor: "text-[#B45309]" }
        : { texto: "Não autorizado", cor: "text-gray-700" };

  return (
    <Tela onVoltar={() => navigate("/settings")}>
      <div className="p-6 lg:p-10 max-w-4xl space-y-6">
        {aviso && (
          <div
            role={aviso.tipo === "erro" ? "alert" : "status"}
            className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
              aviso.tipo === "erro" ? "bg-[#EF4444]/10 text-[#B91C1C]" : "bg-[#10B981]/10 text-[#047857]"
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
                <p className="text-sm text-gray-500">Status da integração</p>
                <p className={`text-base ${statusConexao.cor}`}>{statusConexao.texto}</p>
              </div>
            </div>
            {conexao.connected && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={testar}
                  disabled={ocupado !== null}
                  className="px-4 py-2 border border-[#1B4F8A] text-[#1B4F8A] rounded-lg hover:bg-[#EBF2F9] transition-colors flex items-center gap-2 text-sm disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${ocupado === "testar" ? "animate-spin" : ""}`} />
                  Testar conexão
                </button>
                <button
                  onClick={() => setConfirmarDesconexao(true)}
                  className="px-4 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm"
                >
                  <Unplug className="w-4 h-4" />
                  Desconectar
                </button>
              </div>
            )}
          </div>

          <dl className="grid gap-4 sm:grid-cols-3 mt-5 pt-5 border-t border-gray-200">
            <div>
              <dt className="text-sm text-gray-500 mb-1">Autorizado em</dt>
              <dd className="text-sm text-gray-900">{formatarDataHora(conexao.conectado_em)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 mb-1">Token expira em</dt>
              <dd className={`text-sm ${conexao.token_status === "expirado" ? "text-[#B45309]" : "text-gray-900"}`}>
                {formatarDataHora(conexao.token_expira_em)}
                {conexao.token_status === "expirado" && " (expirado)"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 mb-1">Último dado recebido</dt>
              <dd className="text-sm text-gray-900">
                {conexao.ultima_sincronizacao ? formatarDataHora(conexao.ultima_sincronizacao) : "Nenhum ainda"}
              </dd>
            </div>
          </dl>

          {confirmarDesconexao && (
            <div className="mt-5 p-4 bg-red-50 rounded-lg space-y-3">
              <p className="text-sm text-gray-900">
                Desconectar apaga os tokens de acesso. Os dados já sincronizados continuam no CRM Assist, mas
                será preciso autorizar de novo para voltar a acessar o RD Station.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await executar("desconectar", api.rdDesconectar, "RD Station desconectado.");
                    setConfirmarDesconexao(false);
                  }}
                  disabled={ocupado !== null}
                  className="px-4 py-2 bg-[#EF4444] text-white rounded-lg text-sm hover:bg-[#DC2626] disabled:opacity-60"
                >
                  {ocupado === "desconectar" ? "Desconectando..." : "Confirmar desconexão"}
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

        {/* 1. Ativar integração */}
        <Passo numero={1} titulo="Ativar integração" feito={conexao.ativo} status="Integração ativada">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="rd-ativo" className="text-sm text-gray-600">
              Quando ativa, o CRM Assist recebe leads e oportunidades enviados pelo RD Station. Desativada, os
              eventos recebidos são registrados e ignorados, sem perder a configuração.
            </label>
            <Switch
              id="rd-ativo"
              checked={conexao.ativo}
              disabled={ocupado !== null}
              onCheckedChange={(ativo) =>
                executar(
                  "ativo",
                  () => api.rdSalvarConfiguracao({ ativo }),
                  ativo ? "Integração ativada." : "Integração desativada.",
                )
              }
            />
          </div>
        </Passo>

        {/* 2. Credenciais do app criado na RD Station App Store */}
        <Passo numero={2} titulo="Criar um aplicativo no RD Station" feito={credenciaisSalvas} status="Credenciais salvas">
          <ol className="text-sm text-gray-600 space-y-1 list-decimal pl-5">
            <li>
              Crie um aplicativo na <LinkRd href={RD_LINKS.appStore}>área de desenvolvedores do RD Station</LinkRd>.
            </li>
            <li>Na criação do app, informe como URL de callback a URL abaixo.</li>
            <li>Com o app criado, copie o Client ID e o Client Secret para os campos abaixo.</li>
          </ol>
          <CampoCopiavel
            id="redirect-uri"
            label="URL de callback"
            valor={conexao.redirect_uri}
            ajuda="Cadastre exatamente esta URL no aplicativo do RD Station."
          />
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
            <CampoSegredo
              id="client-secret"
              label="Client Secret"
              valor={clientSecret}
              onChange={setClientSecret}
              salvo={conexao.has_client_secret && conexao.credenciais_origem === "tela"}
            />
            {conexao.credenciais_origem === "env" && (
              <p className="text-xs text-gray-500">
                Hoje as credenciais vêm do arquivo .env do servidor. Salvar aqui passa a usar as da tela.
              </p>
            )}
            {conexao.connected && (
              <p className="text-xs text-[#B45309] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Trocar as credenciais exige autorizar o acesso novamente.
              </p>
            )}
            <button type="submit" disabled={ocupado !== null} className={botaoSecundario}>
              {ocupado === "credenciais" ? "Salvando..." : "Salvar credenciais"}
            </button>
          </form>
        </Passo>

        {/* 3. Usuário responsável */}
        <Passo
          numero={3}
          titulo="Definir usuário responsável pela integração"
          feito={!!conexao.usuario_integracao}
          status="Usuário definido"
        >
          <p className="text-sm text-gray-600">
            Leads e oportunidades novos que chegarem do RD Station sem responsável serão atribuídos a este
            usuário.
          </p>
          <div>
            <label htmlFor="usuario-integracao" className="block text-sm text-gray-700 mb-2">
              Usuário responsável
            </label>
            <select
              id="usuario-integracao"
              value={conexao.usuario_integracao?.id ?? ""}
              disabled={ocupado !== null}
              onChange={(e) =>
                executar(
                  "usuario",
                  () => api.rdSalvarConfiguracao({ usuario_integracao_id: e.target.value || null }),
                  "Usuário responsável atualizado.",
                )
              }
              className={inputClass}
            >
              <option value="">Nenhum (registros ficam sem responsável)</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} — {PERFIL_LABEL[u.perfil]}
                </option>
              ))}
            </select>
          </div>
        </Passo>

        {/* 4. Autorização OAuth */}
        <Passo numero={4} titulo="Autorizar acesso ao RD Station" feito={autorizado} status="Acesso autorizado">
          <p className="text-sm text-gray-600">
            Você será levado ao RD Station para entrar com a conta da empresa e permitir o acesso do CRM Assist.
            Depois disso, volta automaticamente para esta tela. O token é renovado sozinho antes de expirar.
          </p>
          {conexao.token_status === "expirado" && (
            <p className="text-xs text-[#B45309] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              A autorização expirou e não pôde ser renovada. Autorize novamente.
            </p>
          )}
          <button
            onClick={conectar}
            disabled={!credenciaisSalvas || ocupado !== null}
            className="w-full bg-[#1B4F8A] text-white py-3 rounded-lg hover:bg-[#153d6e] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <PlugZap className="w-5 h-5" />
            <span>
              {ocupado === "conectar"
                ? "Abrindo o RD Station..."
                : conexao.connected
                  ? "Autorizar novamente"
                  : "Autorizar acesso"}
            </span>
          </button>
          {!credenciaisSalvas && (
            <p className="text-xs text-gray-500">Salve as credenciais do passo 2 para liberar a autorização.</p>
          )}
        </Passo>

        {/* 5. Tokens público e privado */}
        <Passo numero={5} titulo="Informar token público e privado" feito={tokensSalvos} status="Tokens salvos">
          <p className="text-sm text-gray-600">
            No RD Station, acesse Integrações › Dados de integração (API) e copie os tokens público e privado.{" "}
            <LinkRd href={RD_LINKS.tokens}>Ver os tokens no RD Station</LinkRd>
          </p>
          <form onSubmit={salvarTokens} className="space-y-4">
            <div>
              <label htmlFor="token-publico" className="block text-sm text-gray-700 mb-2">
                Token público
              </label>
              <input
                id="token-publico"
                required
                autoComplete="off"
                value={tokenPublico}
                onChange={(e) => setTokenPublico(e.target.value)}
                className={inputClass}
              />
            </div>
            <CampoSegredo
              id="token-privado"
              label="Token privado"
              valor={tokenPrivado}
              onChange={setTokenPrivado}
              salvo={conexao.has_token_privado}
            />
            <button type="submit" disabled={ocupado !== null} className={botaoSecundario}>
              {ocupado === "tokens" ? "Salvando..." : "Salvar tokens"}
            </button>
          </form>
        </Passo>

        {/* 6. Webhook */}
        <Passo
          numero={6}
          titulo="Configurar webhook no RD Station"
          feito={conexao.ultima_sincronizacao !== null}
          status="Recebendo dados"
        >
          <ol className="text-sm text-gray-600 space-y-1 list-decimal pl-5">
            <li>
              No RD Station, acesse Integrações › Webhooks › Configurar.{" "}
              <LinkRd href={RD_LINKS.webhooks}>Abrir no RD Station</LinkRd>
            </li>
            <li>Clique em "Criar webhook" e escolha um nome.</li>
            <li>No campo URL, cole a URL abaixo.</li>
            <li>Escolha "Conversão" no campo Gatilho e salve.</li>
          </ol>
          <CampoCopiavel
            id="webhook-url"
            label="URL do webhook"
            valor={conexao.webhook_url}
            ajuda="A URL contém um token secreto: não a compartilhe fora do RD Station."
          />
          <p className="text-xs text-gray-500">
            Para testar, use "Verificar" na tela de webhooks do RD Station e escolha um lead. Ele deve aparecer
            no funil do CRM Assist e o "Último dado recebido" acima é atualizado.
          </p>

          {conexao.ultima_falha && (
            <div role="alert" className="p-3 bg-[#EF4444]/10 rounded-lg text-xs text-[#B91C1C] space-y-1">
              <p className="flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" />
                Falha ao processar um evento em {formatarDataHora(conexao.ultima_falha.em)}
                {conexao.falhas_ultimos_7_dias > 1 && ` (${conexao.falhas_ultimos_7_dias} falhas nos últimos 7 dias)`}
              </p>
              <p className="break-words opacity-80">{conexao.ultima_falha.mensagem}</p>
            </div>
          )}

          {confirmarNovaUrl ? (
            <div className="p-4 bg-[#F59E0B]/10 rounded-lg space-y-3">
              <p className="text-sm text-gray-900">
                A URL atual deixará de funcionar imediatamente. Depois de gerar a nova, atualize-a no webhook do
                RD Station.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await executar("webhook", api.rdRegenerarWebhookToken, "Nova URL gerada. Atualize-a no RD Station.");
                    setConfirmarNovaUrl(false);
                  }}
                  disabled={ocupado !== null}
                  className="px-4 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm hover:bg-[#153d6e] disabled:opacity-60"
                >
                  {ocupado === "webhook" ? "Gerando..." : "Gerar nova URL"}
                </button>
                <button
                  onClick={() => setConfirmarNovaUrl(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmarNovaUrl(true)} className="text-sm text-[#1B4F8A] hover:underline">
              Gerar nova URL do webhook
            </button>
          )}
        </Passo>
      </div>
    </Tela>
  );
}

function Tela({ onVoltar, children }: { onVoltar: () => void; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} aria-label="Voltar" className="p-1 -ml-1 lg:hidden">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl text-gray-900">Integração com RD Station</h1>
        </div>
      </header>
      {children}
    </div>
  );
}
