import { useEffect, useState } from "react";
import { CheckCircle2, CloudOff, Info, Plus, RefreshCw, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import LeadDialog from "../components/LeadDialog";
import { useUsuario } from "../components/RequireAuth";
import { api, PERFIS_VISAO_TOTAL, type LeadResumo, type LeadSalvo, type Vendedor } from "../lib/api";

const TODOS = "todos";

export default function LeadsScreen() {
  const navigate = useNavigate();
  const usuario = useUsuario();
  const veTodoTime = PERFIS_VISAO_TOTAL.includes(usuario.perfil);
  // Filtros na URL para sobreviver ao "voltar" da tela do lead.
  const [searchParams, setSearchParams] = useSearchParams();
  const buscaUrl = searchParams.get("busca") ?? "";
  const vendedorId = (veTodoTime && searchParams.get("vendedor")) || TODOS;
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
      .leads({ busca: buscaUrl || undefined, usuario_id: vendedorId === TODOS ? undefined : vendedorId })
      .then((l) => !cancelado && setLeads(l))
      .catch((e: Error) => !cancelado && setErro(e.message))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [buscaUrl, vendedorId, recarga]);

  const leadCriado = ({ lead, rd }: LeadSalvo) => {
    setRecarga((n) => n + 1);
    setAviso(
      rd.enviado
        ? { ok: true, texto: `Lead ${lead.nome} criado e enviado ao RD Station.` }
        : { ok: false, texto: rd.mensagem ?? "Lead criado." },
    );
  };

  const filtrando = !!buscaUrl || vendedorId !== TODOS;

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10 md:flex md:items-center md:justify-between gap-4">
        <h1 className="text-xl text-gray-900 mb-3 md:mb-0">Leads</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Buscar leads"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, e-mail ou telefone"
              className="pl-9 pr-3 py-2 bg-[#F5F5F5] rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
            />
          </div>
          {veTodoTime && (
            <select
              aria-label="Filtrar por vendedor"
              value={vendedorId}
              onChange={(e) => setFiltro("vendedor", e.target.value)}
              className="px-3 py-2 bg-[#F5F5F5] rounded-lg text-sm text-gray-700 max-w-[14rem]"
            >
              <option value={TODOS}>Todos os vendedores</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
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
                  <button
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 grid gap-1 lg:gap-4 lg:grid-cols-[2fr_2fr_1.2fr_1.5fr_1fr_1fr] lg:items-center"
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
                      {lead.sincronizado ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" /> Sincronizado
                        </>
                      ) : (
                        <>
                          <CloudOff className="w-3.5 h-3.5" /> Só no CRM Assist
                        </>
                      )}
                    </span>
                  </button>
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
