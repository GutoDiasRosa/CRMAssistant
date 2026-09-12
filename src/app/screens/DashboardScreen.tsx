import { Bell, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";

export default function DashboardScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-900">Carlos Silva</span>
          <button className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="p-6 space-y-6">
        {/* Saudação */}
        <div>
          <h2 className="text-2xl text-gray-900">Bom dia, Carlos</h2>
        </div>

        {/* Card Principal - Meta */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base text-gray-700 mb-1">Meta do mês</h3>
            <p className="text-sm text-gray-500">40 leads qualificados</p>
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl text-gray-900">28</span>
              <span className="text-base text-[#1B4F8A]">70%</span>
            </div>
            
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-[#1B4F8A] h-3 rounded-full"
                style={{ width: "70%" }}
              ></div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">28 atingidos de 40</p>
        </div>

        {/* Cards Menores */}
        <div className="grid grid-cols-2 gap-4">
          {/* Leads na Carteira */}
          <div className="bg-[#EBF2F9] rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-2">Leads na carteira</p>
            <p className="text-3xl text-[#1B4F8A]">18</p>
          </div>

          {/* Follow-ups Pendentes */}
          <div className="bg-[#EBF2F9] rounded-xl p-5">
            <p className="text-sm text-gray-600 mb-2">Follow-ups pendentes</p>
            <p className="text-3xl text-[#1B4F8A]">3</p>
          </div>
        </div>

        {/* Botão Assistente */}
        <button
          onClick={() => navigate("/chat")}
          className="w-full bg-[#1B4F8A] text-white py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-[#153d6e] transition-colors shadow-md"
        >
          <MessageSquare className="w-6 h-6" />
          <span>Abrir Assistente</span>
        </button>

        {/* Link para Performance do Time */}
        <button
          onClick={() => navigate("/team")}
          className="w-full text-[#1B4F8A] py-3 text-center hover:underline"
        >
          Ver performance do time →
        </button>
      </div>

      {/* Menu de Navegação Inferior */}
      <BottomNav />
    </div>
  );
}