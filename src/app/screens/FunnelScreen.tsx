import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";

const funnelStages = [
  {
    name: "Prospecção",
    count: 12,
    leads: [
      { id: 1, company: "Construtora ABC", contact: "João Silva", value: "R$ 45.000", status: "success" },
      { id: 2, company: "Obras & Cia", contact: "Maria Santos", value: "R$ 32.000", status: "warning" },
    ],
  },
  {
    name: "Qualificado",
    count: 8,
    leads: [
      { id: 3, company: "BuildTech", contact: "Pedro Costa", value: "R$ 78.000", status: "success" },
      { id: 4, company: "Forte Construções", contact: "Ana Lima", value: "R$ 54.000", status: "success" },
    ],
  },
  {
    name: "Proposta enviada",
    count: 5,
    leads: [
      { id: 5, company: "MegaObras", contact: "Carlos Dias", value: "R$ 120.000", status: "warning" },
      { id: 6, company: "Urbana Engenharia", contact: "Beatriz Rocha", value: "R$ 95.000", status: "success" },
    ],
  },
  {
    name: "Negociação",
    count: 3,
    leads: [
      { id: 7, company: "Estrutural S.A.", contact: "Roberto Alves", value: "R$ 180.000", status: "danger" },
      { id: 8, company: "TopEdificios", contact: "Laura Mendes", value: "R$ 210.000", status: "success" },
    ],
  },
];

export default function FunnelScreen() {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-[#10B981]";
      case "warning":
        return "bg-[#F59E0B]";
      case "danger":
        return "bg-[#EF4444]";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl text-gray-900 mb-3">Funil de Vendas</h1>
        
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

      {/* Kanban Scroll Horizontal */}
      <div className="overflow-x-auto px-6 py-4">
        <div className="flex gap-4 min-w-max">
          {funnelStages.map((stage) => (
            <div key={stage.name} className="w-72 flex-shrink-0">
              {/* Header da Coluna */}
              <div className="mb-3">
                <h3 className="text-base text-gray-900 mb-1">{stage.name}</h3>
                <span className="text-sm text-gray-500">{stage.count} leads</span>
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
                          {lead.company}
                        </h4>
                        <p className="text-sm text-gray-500">{lead.contact}</p>
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
                        {lead.value}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu de Navegação Inferior */}
      <BottomNav />
    </div>
  );
}
