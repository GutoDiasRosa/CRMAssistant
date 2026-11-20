import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, ExternalLink, Info, Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import FiltrosAvancados, { CampoBusca, CampoFiltro, classeControle } from "../components/FiltrosAvancados";
import LeadDialog from "../components/LeadDialog";
import { useUsuario } from "../components/RequireAuth";
import {
  api,
  linkContatoRd,
  PERFIS_VISAO_TOTAL,
  type LeadResumo,
  type LeadSalvo,
  type Vendedor,
} from "../lib/api";

const TODOS = "todos";

// Filtros do painel avançado (a busca por nome fica no topo da tela).
type Filtros = {
  vendedor: string; // id do vendedor ou TODOS
  de: string; // AAAA-MM-DD, cadastrados a partir de
  ate: string; // AAAA-MM-DD, cadastrados até
  oportunidades: "" | "com_aberta" | "com_ganha" | "sem";
  rd: "" | "sincronizado" | "local";
};
const SEM_FILTROS: Filtros = { vendedor: TODOS, de: "", ate: "", oportunidades: "", rd: "" };
const CHAVES_URL = ["vendedor", "de", "ate", "oportunidades", "rd"] as const;

export default function LeadsScreen() {
  const navigate = useNavigate();
  const usuario = useUsuario();
  const veTodoTime = PERFIS_VISAO_TOTAL.includes(usuario.perfil);
  // Filtros na URL para sobreviver ao "voltar" da tela do lead.
  const [searchParams, setSearchParams] = useSearchParams();
  const buscaUrl = searchParams.get("busca") ?? "";
  const filtros: Filtros = {
    vendedor: (veTodoTime && searchParams.get("vendedor")) || TODOS,
    de: searchParams.get("de") ?? "",
    ate: searchParams.get("ate") ?? "",
    oportunidades: (searchParams.get("oportunidades") as Filtros["oportunidades"]) ?? "",
    rd: (searchParams.get("rd") as Filtros["rd"]) ?? "",
  };
  const vendedorId = filtros.vendedor;
  const [busca, setBusca] = useState(buscaUrl);
  const [leads, setLeads] = useState<LeadResumo[] | null>(null);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [novoAberto, setNovoAberto] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const setFiltro = (chave: "busca" | "vendedor", valor: string) =>
    setSearchParams(
      (atual) => {
        const novo = new URLSearchParams(atual);
        if (!valor || valor === TODOS) novo.delete(chave);
        else novo.set(chave, valor);
        return novo;
      },
      { replace: true },
    );
  const aplicarFiltros = (novos: Filtros) =>
    setSearchParams(
      (atual) => {
        const novo = new URLSearchParams(atual);
        for (const chave of CHAVES_URL) {
          const valor = novos[chave];
          if (!valor || valor === TODOS) novo.delete(chave);
          else novo.set(chave, valor);
        }
        return novo;
      },
      { replace: true },
    );
  const filtrosAtivos = CHAVES_URL.filter((chave) => filtros[chave] && filtros[chave] !== TODOS).length;

  // Espera a pessoa parar de digitar antes de buscar.
  useEffect(() => {
    const t = setTimeout(() => {
      if (busca.trim() !== buscaUrl) setFiltro("busca", busca.trim());
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  useEffect(() => {
    if (!veTodoTime) return;
    api.vendedores().then(setVendedores).catch(() => setVendedores([]));
  }, [veTodoTime]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    api
      .leads({
        busca: buscaUrl || undefined,
        usuario_id: vendedorId === TODOS ? undefined : vendedorId,
        criado_de: filtros.de || undefined,
        criado_ate: filtros.ate || undefined,
        oportunidades: filtros.oportunidades || undefined,
        rd: filtros.rd || undefined,
      })
      .then((l) => !cancelado && setLeads(l))
      .catch((e: Error) => !cancelado && setErro(e.message))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
    // searchParams cobre todos os filtros da URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, recarga]);

  const leadCriado = ({ lead, rd }: LeadSalvo) => {
    setRecarga((n) => n + 1);
    setAviso(
      rd.enviado
        ? { ok: true, texto: `Lead ${lead.nome} criado e enviado ao RD Station.` }
        : { ok: false, texto: rd.mensagem ?? "Lead criado." },
    );
  };

  const filtrando = !!buscaUrl || filtrosAtivos > 0;

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10 md:flex md:items-center md:justify-between gap-4">
        <h1 className="text-xl text-gray-900 mb-3 md:mb-0">Leads</h1>
        <div className="flex flex-wrap items-center gap-3">
          <CampoBusca
            valor={busca}
            onChange={setBusca}
            rotulo="Buscar leads por nome"
            placeholder="Nome, e-mail ou telefone"
          />
          <FiltrosAvancados
            titulo="Filtrar leads"
            descricao="Combine os filtros e aplique. A busca por nome continua valendo."
            valores={filtros}
            vazio={SEM_FILTROS}
            ativos={filtrosAtivos}
            onAplicar={aplicarFiltros}
          >
            {(f, alterar) => (
              <>
                {veTodoTime && (
                  <CampoFiltro id="filtro-vendedor" rotulo="Responsável">
                    <select
                      id="filtro-vendedor"
                      value={f.vendedor}
                      onChange={(e) => alterar({ vendedor: e.target.value })}
                      className={classeControle}
                    >
                      <option value={TODOS}>Todos os vendedores</option>
                      {vendedores.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nome}
                        </option>
                      ))}
                    </select>
                  </CampoFiltro>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <CampoFiltro id="filtro-de" rotulo="Cadastrado de">
                    <input
                      id="filtro-de"
                      type="date"
                      value={f.de}
                      max={f.ate || undefined}
                      onChange={(e) => alterar({ de: e.target.value })}
                      className={classeControle}
                    />
                  </CampoFiltro>
                  <CampoFiltro id="filtro-ate" rotulo="até">
                    <input
                      id="filtro-ate"
                      type="date"
                      value={f.ate}
                      min={f.de || undefined}
                      onChange={(e) => alterar({ ate: e.target.value })}
                      className={classeControle}
                    />
                  </CampoFiltro>
                </div>
                <CampoFiltro id="filtro-oportunidades" rotulo="Oportunidades">
                  <select
                    id="filtro-oportunidades"
                    value={f.oportunidades}
                    onChange={(e) => alterar({ oportunidades: e.target.value as Filtros["oportunidades"] })}
                    className={classeControle}
                  >
                    <option value="">Todos os leads</option>
                    <option value="com_aberta">Com negociação em aberto</option>
                    <option value="com_ganha">Já compraram (venda ganha)</option>
                    <option value="sem">Sem oportunidade</option>
                  </select>
                </CampoFiltro>
                <CampoFiltro id="filtro-rd" rotulo="RD Station">
                  <select
                    id="filtro-rd"
                    value={f.rd}
                    onChange={(e) => alterar({ rd: e.target.value as Filtros["rd"] })}
                    className={classeControle}
                  >
                    <option value="">Todos</option>
                    <option value="sincronizado">Sincronizados com o RD</option>
                    <option value="local">Só no CRM Assist</option>
                  </select>
                </CampoFiltro>
              </>
            )}
          </FiltrosAvancados>
          {filtrando && (
            <button
              onClick={() => {
                setBusca("");
                setSearchParams({}, { replace: true });
              }}
              className="text-sm text-[#1B4F8A] hover:underline"
            >
              Limpar filtros
            </button>
          )}
          <button
            onClick={() => setNovoAberto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm hover:bg-[#153d6e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo lead
          </button>
        </div>
      </header>

      {aviso && (
        <div
          role="status"
          className={`mx-6 lg:mx-10 mt-4 flex items-start gap-3 p-3 rounded-lg text-sm ${
            aviso.ok ? "bg-[#10B981]/10 text-[#047857]" : "bg-[#F59E0B]/10 text-[#92400E]"
          }`}
        >
          {aviso.ok ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <Info className="w-5 h-5 flex-shrink-0" />}
          <span className="flex-1">{aviso.texto}</span>
          <button onClick={() => setAviso(null)} className="text-xs underline flex-shrink-0">
            Fechar
          </button>
        </div>
      )}

      <div className={`px-6 lg:px-10 py-4 lg:py-6 transition-opacity ${carregando && leads ? "opacity-50" : ""}`}>
        {erro && (
          <p role="alert" className="text-sm text-[#EF4444]">
            {erro}
          </p>
        )}
        {!erro && leads === null && <p className="text-sm text-gray-500">Carregando leads...</p>}
        {!erro && leads?.length === 0 && (
          <p className="text-sm text-gray-500">
            {filtrando
              ? "Nenhum lead encontrado para os filtros selecionados."
              : "Nenhum lead ainda. Crie o primeiro ou aguarde os contatos que vierem do RD Station."}
          </p>
        )}

        {!!leads?.length && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Cabeçalho só no monitor; no celular cada lead vira um cartão. */}
            <div className="hidden lg:grid grid-cols-[2fr_2fr_1.2fr_1.5fr_1fr_1fr] gap-4 px-5 py-3 bg-[#F5F5F5] text-xs text-gray-500">
              <span>Nome</span>
              <span>E-mail</span>
              <span>Telefone</span>
              <span>Responsável</span>
              <span>Oportunidades</span>
              <span>RD Station</span>
            </div>
            <ul className="divide-y divide-gray-200">
              {leads.map((lead) => (
                <li key={lead.id}>
                  {/* div clicável (e não <button>): a linha contém o link para o RD. */}
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`/leads/${lead.id}`)}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 cursor-pointer grid gap-1 lg:gap-4 lg:grid-cols-[2fr_2fr_1.2fr_1.5fr_1fr_1fr] lg:items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F8A]"
                  >
                    <span className="text-base text-gray-900 truncate">{lead.nome || "Sem nome"}</span>
                    <span className="text-sm text-gray-600 truncate">{lead.email ?? "—"}</span>
                    <span className="text-sm text-gray-600 truncate">{lead.telefone ?? "—"}</span>
                    <span className="text-sm text-gray-600 truncate">{lead.responsavel?.nome ?? "Sem responsável"}</span>
                    <span className="text-sm text-gray-600">
                      {lead.oportunidades}
                      <span className="lg:hidden"> {lead.oportunidades === 1 ? "oportunidade" : "oportunidades"}</span>
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      {lead.rd_lead_id ? (
                        <a
                          href={linkContatoRd(lead.rd_lead_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Abrir o contato no RD Station CRM"
                          className="inline-flex items-center gap-1.5 text-[#1B4F8A] hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Abrir no RD
                        </a>
                      ) : (
                        <>
                          <CloudOff className="w-3.5 h-3.5" /> Só no CRM Assist
                        </>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {leads && leads.length >= 200 && (
          <p className="text-xs text-gray-500 mt-3">Mostrando os 200 mais recentes. Use a busca para encontrar outros.</p>
        )}
      </div>

      <LeadDialog aberto={novoAberto} onFechar={() => setNovoAberto(false)} onSalvo={leadCriado} />
    </div>
  );
}
