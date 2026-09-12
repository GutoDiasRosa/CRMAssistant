import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import BottomNav from "../components/BottomNav";

const teamMembers = [
  {
    id: 1,
    name: "Carlos Silva",
    role: "Vendedor Sênior",
    prospected: 24,
    qualified: 18,
    closed: 5,
    aboveTarget: true,
  },
  {
    id: 2,
    name: "Maria Santos",
    role: "Vendedora Pleno",
    prospected: 32,
    qualified: 22,
    closed: 6,
    aboveTarget: true,
  },
  {
    id: 3,
    name: "Pedro Costa",
    role: "Vendedor Júnior",
    prospected: 18,
    qualified: 12,
    closed: 2,
    aboveTarget: false,
  },
  {
    id: 4,
    name: "Ana Lima",
    role: "Vendedora Sênior",
    prospected: 28,
    qualified: 20,
    closed: 4,
    aboveTarget: true,
  },
];

export default function TeamPerformanceScreen() {
  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-xl text-gray-900 mb-3">Performance do Time</h1>
        
        {/* Seletor de Período */}
        <button className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] rounded-lg text-sm text-gray-700">
          Março 2026
          <ChevronDown className="w-4 h-4" />
        </button>
      </header>

      {/* Conteúdo */}
      <div className="p-6 space-y-6">
        {/* Card Total do Time */}
        <div className="bg-[#1B4F8A] text-white rounded-xl p-6">
          <h3 className="text-base mb-2 opacity-90">Negócios fechados no mês</h3>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-4xl">9</span>
            <span className="text-xl opacity-90 mb-1">de 20</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full"
                style={{ width: "45%" }}
              ></div>
            </div>
            <p className="text-sm mt-2 opacity-90">45% da meta atingida</p>
          </div>
        </div>

        {/* Lista de Vendedores */}
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              {/* Header do Card */}
              <div className="flex items-start gap-3 mb-4">
                {/* Avatar Placeholder */}
                <div className="w-12 h-12 bg-[#EBF2F9] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1B4F8A] text-base">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>

                {/* Nome e Cargo */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base text-gray-900">{member.name}</h4>
                    {member.aboveTarget ? (
                      <TrendingUp className="w-5 h-5 text-[#10B981]" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-[#EF4444]" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Prospectados</p>
                  <p className="text-xl text-gray-900">{member.prospected}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Qualificados</p>
                  <p className="text-xl text-gray-900">{member.qualified}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fechados</p>
                  <p className="text-xl text-[#1B4F8A]">{member.closed}</p>
                </div>
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
