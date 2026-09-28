import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import { api, formatarMoeda, type OportunidadeKanban } from "../lib/api";

// Ordem das etapas conhecidas; etapas novas vindas do RD Station aparecem depois.
const ORDEM_ETAPAS = ["Prospecção", "Qualificado", "Proposta", "Proposta enviada", "Negociação"];

type Etapa = { name: string; leads: OportunidadeKanban[] };

function ordenarEtapas(kanban: Record<string, OportunidadeKanban[]>): Etapa[] {
  const posicao = (nome: string) => {
    const i = ORDEM_ETAPAS.indexOf(nome);
    return i === -1 ? ORDEM_ETAPAS.length : i;
  };
  return Object.entries(kanban)
    .map(([name, leads]) => ({ name, leads }))
    .sort((a, b) => posicao(a.name) - posicao(b.name));
}

export default function FunnelScreen() {
  const navigate = useNavigate();
  const [funnelStages, setFunnelStages] = useState<Etapa[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api
      .kanban()
      .then((kanban) => setFunnelStages(ordenarEtapas(kanban)))
      .catch((e: Error) => setErro(e.message));
  }, []);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "won":
        return "bg-[#10B981]";
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
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] rounded-lg text-sm text-gray-700">
            Período
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] rounded-lg text-sm text-gray-700">
            Vendedor
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </header>

      {erro && <p className="px-6 lg:px-10 py-4 text-sm text-[#EF4444]">{erro}</p>}
      {!erro && funnelStages === null && (
        <p className="px-6 lg:px-10 py-4 text-sm text-gray-500">Carregando funil...</p>
      )}
      {funnelStages?.length === 0 && (
        <p className="px-6 lg:px-10 py-4 text-sm text-gray-500">
          Nenhuma oportunidade sincronizada do RD Station ainda.
        </p>
      )}

      {/* Kanban: rola na horizontal no celular; no monitor as colunas dividem a largura */}
      <div className="overflow-x-auto px-6 lg:px-10 py-4 lg:py-6">
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
