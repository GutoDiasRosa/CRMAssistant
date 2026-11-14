import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, Info, Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import OportunidadeDialog from "../components/OportunidadeDialog";
import { useUsuario } from "../components/RequireAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  api,
  formatarMoeda,
  PERFIS_VISAO_TOTAL,
  type OportunidadeKanban,
  type OportunidadeSalva,
  type Vendedor,
} from "../lib/api";
import { ehPeriodo, inicioDoPeriodo, PERIODOS, type PeriodoId } from "../lib/periodos";

// Ordem usada sem o RD Station; conectado, vale a ordem das etapas do funil do RD.
const ORDEM_ETAPAS = ["Prospecção", "Qualificado", "Proposta", "Proposta enviada", "Negociação"];

type Etapa = { name: string; leads: OportunidadeKanban[] };

function ordenarEtapas(kanban: Record<string, OportunidadeKanban[]>, ordem: string[]): Etapa[] {
  const posicao = (nome: string) => {
    const i = ordem.indexOf(nome);
    return i === -1 ? ordem.length : i;
  };
  return Object.entries(kanban)
    .map(([name, leads]) => ({ name, leads }))
    .sort((a, b) => posicao(a.name) - posicao(b.name));
}

const TODOS = "todos";

export default function FunnelScreen() {
  const navigate = useNavigate();
  const usuario = useUsuario();
  const veTodoTime = PERFIS_VISAO_TOTAL.includes(usuario.perfil);
  const [funnelStages, setFunnelStages] = useState<Etapa[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  // Filtros ficam na URL para sobreviver ao "voltar" da tela do lead.
  const [searchParams, setSearchParams] = useSearchParams();
  const periodoUrl = searchParams.get("periodo");
  const periodo: PeriodoId = ehPeriodo(periodoUrl) ? periodoUrl : "todos";
  const vendedorId = (veTodoTime && searchParams.get("vendedor")) || TODOS;
  const setFiltro = (chave: "periodo" | "vendedor", valor: string) =>
    setSearchParams(
      (atual) => {
        const novo = new URLSearchParams(atual);
        if (valor === TODOS) novo.delete(chave);
        else novo.set(chave, valor);
        return novo;
      },
      { replace: true },
    );
  const setPeriodo = (valor: PeriodoId) => setFiltro("periodo", valor);
  const setVendedorId = (valor: string) => setFiltro("vendedor", valor);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [ordemEtapas, setOrdemEtapas] = useState<string[]>(ORDEM_ETAPAS);
  const [novaAberta, setNovaAberta] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    api
      .etapas()
      .then((e) => {
        if (e.origem === "rd") setOrdemEtapas(e.funis.flatMap((f) => f.etapas.map((et) => et.nome)));
      })
      .catch(() => undefined);
  }, []);

  const oportunidadeCriada = ({ rd }: OportunidadeSalva) => {
    setRecarga((n) => n + 1);
    setAviso(
      rd.enviado
        ? { ok: true, texto: "Oportunidade criada e enviada ao RD Station." }
        : { ok: false, texto: rd.mensagem ?? "Oportunidade criada." },
    );
  };

  // SDR e Closer só enxergam as próprias oportunidades (RF07): o filtro de vendedor não se aplica.
  useEffect(() => {
    if (!veTodoTime) return;
    api
      .vendedores()
      .then(setVendedores)
      .catch(() => setVendedores([]));
  }, [veTodoTime]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    api
      .kanban({
        usuario_id: vendedorId === TODOS ? undefined : vendedorId,
        inicio: inicioDoPeriodo(periodo),
      })
      .then((kanban) => {
        if (!cancelado) setFunnelStages(ordenarEtapas(kanban, ordemEtapas));
      })
      .catch((e: Error) => {
        if (!cancelado) setErro(e.message);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [periodo, vendedorId, recarga, ordemEtapas]);

  const filtrando = periodo !== "todos" || vendedorId !== TODOS;
  const labelPeriodo = PERIODOS.find((p) => p.id === periodo)?.label ?? "Período";
  const labelVendedor =
    vendedorId === TODOS
      ? "Todos os vendedores"
      : (vendedores.find((v) => v.id === vendedorId)?.nome ?? "Vendedor");
  const classeFiltro = (ativo: boolean) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm max-w-[14rem] ${
      ativo ? "bg-[#1B4F8A]/10 text-[#1B4F8A]" : "bg-[#F5F5F5] text-gray-700"
    }`;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "won":
        return "bg-[#10B981]";
      case "ongoing":
      case "open":
        return "bg-[#F59E0B]";
      case "lost":
        return "bg-[#EF4444]";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10 md:flex md:items-center md:justify-between">
        <h1 className="text-xl text-gray-900 mb-3 md:mb-0">Funil de Vendas</h1>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className={classeFiltro(periodo !== "todos")}>
              <span className="truncate">{labelPeriodo}</span>
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoId)}>
                {PERIODOS.map((p) => (
                  <DropdownMenuRadioItem key={p.id} value={p.id}>
                    {p.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {veTodoTime && (
            <DropdownMenu>
              <DropdownMenuTrigger className={classeFiltro(vendedorId !== TODOS)}>
                <span className="truncate">{labelVendedor}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                <DropdownMenuRadioGroup value={vendedorId} onValueChange={setVendedorId}>
                  <DropdownMenuRadioItem value={TODOS}>Todos os vendedores</DropdownMenuRadioItem>
                  {vendedores.map((v) => (
                    <DropdownMenuRadioItem key={v.id} value={v.id}>
                      {v.nome}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {filtrando && (
            <button
              onClick={() => setSearchParams({}, { replace: true })}
              className="text-sm text-[#1B4F8A] hover:underline"
            >
              Limpar filtros
            </button>
          )}

          <button
            onClick={() => setNovaAberta(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm hover:bg-[#153d6e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova oportunidade
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

      <OportunidadeDialog aberto={novaAberta} onFechar={() => setNovaAberta(false)} onSalva={oportunidadeCriada} />

      {erro && <p className="px-6 lg:px-10 py-4 text-sm text-[#EF4444]">{erro}</p>}
      {!erro && carregando && funnelStages === null && (
        <p className="px-6 lg:px-10 py-4 text-sm text-gray-500">Carregando funil...</p>
      )}
      {!erro && !carregando && funnelStages?.length === 0 && (
        <p className="px-6 lg:px-10 py-4 text-sm text-gray-500">
          {filtrando
            ? "Nenhuma oportunidade encontrada para os filtros selecionados."
            : "Nenhuma oportunidade ainda. Crie a primeira ou aguarde as que vierem do RD Station."}
        </p>
      )}

      {/* Kanban: rola na horizontal no celular; no monitor as colunas dividem a largura */}
      <div
        className={`overflow-x-auto px-6 lg:px-10 py-4 lg:py-6 transition-opacity ${
          carregando && funnelStages ? "opacity-50" : ""
        }`}
      >
        <div className="flex gap-4 min-w-max lg:min-w-full">
          {funnelStages?.map((stage) => (
            <div
              key={stage.name}
              className="w-72 flex-shrink-0 lg:w-auto lg:flex-1 lg:min-w-[13rem] lg:bg-[#F5F5F5] lg:rounded-xl lg:p-3"
            >
              {/* Header da Coluna */}
              <div className="mb-3">
                <h3 className="text-base text-gray-900 mb-1">{stage.name}</h3>
                <span className="text-sm text-gray-500">
                  {stage.leads.length} {stage.leads.length === 1 ? "oportunidade" : "oportunidades"}
                  {" · "}
                  {formatarMoeda(stage.leads.reduce((soma, op) => soma + (op.valor ?? 0), 0))}
                </span>
              </div>

              {/* Cards de Leads */}
              <div className="space-y-3">
                {stage.leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => navigate(`/lead/${lead.id}`)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md transition-shadow"
                  >
                    {/* Indicador de Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-base text-gray-900 mb-1">
                          {lead.nome}
                        </h4>
                        <p className="text-sm text-gray-500">{lead.lead_nome ?? "Sem contato"}</p>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          lead.status
                        )} mt-1`}
                      ></div>
                    </div>

                    {/* Valor */}
                    <div className="text-right">
                      <span className="text-sm text-[#1B4F8A]">
                        {formatarMoeda(lead.valor)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
