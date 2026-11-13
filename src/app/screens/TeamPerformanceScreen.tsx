import { useEffect, useState } from "react";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { useSearchParams } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { api, formatarMoeda, PERFIL_LABEL, type PerformanceTime } from "../lib/api";
import { ehPeriodo, inicioDoPeriodo, PERIODOS, type PeriodoId } from "../lib/periodos";

const PERIODO_PADRAO: PeriodoId = "mes";

function taxa(fechados: number, prospectados: number): number {
  return prospectados > 0 ? fechados / prospectados : 0;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const letras = partes.length > 1 ? [partes[0], partes[partes.length - 1]] : partes;
  return letras.map((p) => p[0].toUpperCase()).join("");
}

export default function TeamPerformanceScreen() {
  const [dados, setDados] = useState<PerformanceTime | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  // Período fica na URL, como no funil, para sobreviver a recarregar/voltar.
  const [searchParams, setSearchParams] = useSearchParams();
  const periodoUrl = searchParams.get("periodo");
  const periodo: PeriodoId = ehPeriodo(periodoUrl) ? periodoUrl : PERIODO_PADRAO;
  const setPeriodo = (valor: PeriodoId) =>
    setSearchParams(valor === PERIODO_PADRAO ? {} : { periodo: valor }, { replace: true });

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    api
      .performance({ inicio: inicioDoPeriodo(periodo) })
      .then((resposta) => {
        if (!cancelado) setDados(resposta);
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
  }, [periodo]);

  const labelPeriodo = PERIODOS.find((p) => p.id === periodo)?.label ?? "Período";
  const totais = dados?.totais;
  const taxaTime = totais ? taxa(totais.fechados, totais.prospectados) : 0;
  const percentualTime = Math.round(taxaTime * 100);
  // Comparar com o time só faz sentido quando há mais de um vendedor na lista.
  const comparaComTime = (dados?.vendedores.length ?? 0) > 1;

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10 md:flex md:items-center md:justify-between">
        <h1 className="text-xl text-gray-900 mb-3 md:mb-0">Performance do Time</h1>

        {/* Seletor de Período */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] rounded-lg text-sm text-gray-700">
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
      </header>

      {erro && <p className="px-6 lg:px-10 py-4 text-sm text-[#EF4444]">{erro}</p>}
      {!erro && carregando && dados === null && (
        <p className="px-6 lg:px-10 py-4 text-sm text-gray-500">Carregando performance...</p>
      )}

      {/* Conteúdo */}
      {dados && totais && (
        <div
          className={`p-6 lg:p-10 space-y-6 max-w-6xl transition-opacity ${carregando ? "opacity-50" : ""}`}
        >
          {/* Card Total do Time */}
          <div className="bg-[#1B4F8A] text-white rounded-xl p-6">
            <h3 className="text-base mb-2 opacity-90">Negócios fechados · {labelPeriodo.toLowerCase()}</h3>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-4xl">{totais.fechados}</span>
              <span className="text-xl opacity-90 mb-1">
                de {totais.prospectados} {totais.prospectados === 1 ? "oportunidade" : "oportunidades"}
              </span>
            </div>
            <p className="text-sm opacity-90">{formatarMoeda(totais.valor_fechado)} em negócios ganhos</p>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{ width: `${percentualTime}%` }}></div>
              </div>
              <p className="text-sm mt-2 opacity-90">{percentualTime}% de conversão</p>
            </div>
          </div>

          {dados.vendedores.length === 0 && (
            <p className="text-sm text-gray-500">Nenhum vendedor com oportunidades neste período.</p>
          )}

          {/* Lista de Vendedores */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dados.vendedores.map((member) => {
              const acimaDoTime = taxa(member.fechados, member.prospectados) >= taxaTime;
              return (
                <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  {/* Header do Card */}
                  <div className="flex items-start gap-3 mb-4">
                    {/* Avatar Placeholder */}
                    <div className="w-12 h-12 bg-[#EBF2F9] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#1B4F8A] text-base">{iniciais(member.nome)}</span>
                    </div>

                    {/* Nome e Cargo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base text-gray-900 truncate">{member.nome}</h4>
                        {comparaComTime && member.prospectados > 0 &&
                          (acimaDoTime ? (
                            <TrendingUp
                              className="w-5 h-5 text-[#10B981] flex-shrink-0"
                              aria-label="Conversão igual ou acima da média do time"
                            />
                          ) : (
                            <TrendingDown
                              className="w-5 h-5 text-[#EF4444] flex-shrink-0"
                              aria-label="Conversão abaixo da média do time"
                            />
                          ))}
                      </div>
                      <p className="text-sm text-gray-500">{PERFIL_LABEL[member.perfil] ?? member.perfil}</p>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Prospectados</p>
                      <p className="text-xl text-gray-900">{member.prospectados}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Qualificados</p>
                      <p className="text-xl text-gray-900">{member.qualificados}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fechados</p>
                      <p className="text-xl text-[#1B4F8A]">{member.fechados}</p>
                    </div>
                  </div>
                  {member.valor_fechado > 0 && (
                    <p className="text-sm text-gray-500 mt-3">{formatarMoeda(member.valor_fechado)} ganhos</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
