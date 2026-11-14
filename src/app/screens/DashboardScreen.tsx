import { useEffect, useState } from "react";
import { Bell, ChevronDown, MessageSquare } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
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
  PERFIL_LABEL,
  PERFIS_VISAO_TOTAL,
  type Metricas,
} from "../lib/api";
import { ehPeriodo, inicioDoPeriodo, PERIODOS, type PeriodoId } from "../lib/periodos";

const PERIODO_PADRAO: PeriodoId = "mes";

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardScreen() {
  const navigate = useNavigate();
  const usuario = useUsuario();
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const veTodoTime = PERFIS_VISAO_TOTAL.includes(usuario.perfil);
  // O período fica na URL (como no funil) para sobreviver ao "voltar".
  const [searchParams, setSearchParams] = useSearchParams();
  const periodoUrl = searchParams.get("periodo");
  const periodo: PeriodoId = ehPeriodo(periodoUrl) ? periodoUrl : PERIODO_PADRAO;
  const setPeriodo = (valor: PeriodoId) =>
    setSearchParams(valor === PERIODO_PADRAO ? {} : { periodo: valor }, { replace: true });
  const labelPeriodo = PERIODOS.find((p) => p.id === periodo)?.label ?? "Período";

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    api
      .metricas({ inicio: inicioDoPeriodo(periodo) })
      .then((m) => !cancelado && setMetricas(m))
      .catch((e: Error) => !cancelado && setErro(e.message))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [periodo]);

  const valor = (n: number | undefined) => (n === undefined ? "…" : n);
  const todoPeriodo = periodo === "todos";

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      {/* Header — no monitor o nome já aparece no menu lateral */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 lg:hidden">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-gray-900 block">{usuario.nome}</span>
            <span className="text-xs text-gray-500">{PERFIL_LABEL[usuario.perfil]}</span>
          </div>
          <button className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="p-6 lg:p-10 space-y-6 lg:space-y-8 max-w-6xl">
        {/* Saudação e período */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl lg:text-3xl text-gray-900">
              {saudacao()}, {usuario.nome.split(" ")[0]}
            </h2>
            <p className="hidden lg:block text-sm text-gray-500 mt-1">
              Resumo {veTodoTime ? "de todo o time" : "da sua carteira"} com dados do RD Station.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Período"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                periodo !== "todos" ? "bg-[#1B4F8A]/10 text-[#1B4F8A]" : "bg-[#F5F5F5] text-gray-700"
              }`}
            >
              {labelPeriodo}
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoId)}>
                {PERIODOS.map((p) => (
                  <DropdownMenuRadioItem key={p.id} value={p.id}>
                    {p.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {erro && <p className="text-sm text-[#EF4444]">{erro}</p>}

        {/* Indicadores: empilhados no celular, lado a lado no monitor */}
        <div
          className={`grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6 transition-opacity ${
            carregando && metricas ? "opacity-50" : ""
          }`}
        >
          {/* Card Principal - Valor das oportunidades criadas no período */}
          <div className="col-span-2 md:col-span-1 bg-white border border-gray-200 rounded-xl p-5 lg:p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base text-gray-700 mb-1">
                {todoPeriodo ? "Valor em oportunidades" : "Valor em novas oportunidades"}
              </h3>
              <p className="text-sm text-gray-500">
                {veTodoTime ? "Todo o time" : "Sua carteira"} · {labelPeriodo.toLowerCase()}
              </p>
            </div>
            <span className="text-3xl text-gray-900">
              {metricas ? formatarMoeda(metricas.valor_total_oportunidades) : "…"}
            </span>
          </div>

          {/* Leads */}
          <div className="bg-[#EBF2F9] rounded-xl p-5 lg:p-6">
            <p className="text-sm text-gray-600 mb-2">{todoPeriodo ? "Leads na carteira" : "Novos leads"}</p>
            <p className="text-3xl text-[#1B4F8A]">{valor(metricas?.total_leads)}</p>
          </div>

          {/* Oportunidades */}
          <div className="bg-[#EBF2F9] rounded-xl p-5 lg:p-6">
            <p className="text-sm text-gray-600 mb-2">{todoPeriodo ? "Oportunidades" : "Novas oportunidades"}</p>
            <p className="text-3xl text-[#1B4F8A]">{valor(metricas?.total_oportunidades)}</p>
          </div>

          {/* Ganhas e perdidas: pela data de fechamento */}
          <div className="bg-[#10B981]/10 rounded-xl p-5 lg:p-6">
            <p className="text-sm text-gray-600 mb-2">Oportunidades ganhas</p>
            <p className="text-3xl text-[#047857]">{valor(metricas?.ganhas.quantidade)}</p>
            <p className="text-sm text-[#047857] mt-1">{metricas ? formatarMoeda(metricas.ganhas.valor) : "…"}</p>
          </div>
          <div className="bg-[#EF4444]/10 rounded-xl p-5 lg:p-6">
            <p className="text-sm text-gray-600 mb-2">Oportunidades perdidas</p>
            <p className="text-3xl text-[#B91C1C]">{valor(metricas?.perdidas.quantidade)}</p>
            <p className="text-sm text-[#B91C1C] mt-1">{metricas ? formatarMoeda(metricas.perdidas.valor) : "…"}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
          <button
            onClick={() => navigate("/chat")}
            className="w-full md:w-auto md:px-8 bg-[#1B4F8A] text-white py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-[#153d6e] transition-colors shadow-md"
          >
            <MessageSquare className="w-6 h-6" />
            <span>Abrir Assistente</span>
          </button>

          <button
            onClick={() => navigate("/team")}
            className="w-full md:w-auto text-[#1B4F8A] py-3 text-center hover:underline"
          >
            Ver performance do time →
          </button>
        </div>
      </div>
    </div>
  );
}