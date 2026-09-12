import { CheckCircle2, XCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import BottomNav from "../components/BottomNav";

const syncLogs = [
  {
    id: 1,
    date: "30/03/2026",
    time: "08:45",
    status: "success",
  },
  {
    id: 2,
    date: "29/03/2026",
    time: "22:30",
    status: "success",
  },
  {
    id: 3,
    date: "29/03/2026",
    time: "14:15",
    status: "error",
  },
];

export default function SettingsScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl text-gray-900">Configurações</h1>
      </header>

      {/* Conteúdo */}
      <div className="p-6 space-y-8">
        {/* Seção Integração RD Station */}
        <section>
          <h2 className="text-base text-gray-900 mb-4">Integração com RD Station</h2>
          
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            {/* Status da Conexão */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Status da conexão</span>
              <span className="inline-flex items-center gap-2 bg-[#10B981]/10 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                <span className="text-sm text-[#10B981]">Conectado</span>
              </span>
            </div>

            {/* Última Sincronização */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700 mb-1">Última sincronização</p>
              <p className="text-sm text-gray-900">30/03/2026 às 08:45</p>
            </div>

            {/* Botão Reconectar */}
            <button className="w-full bg-white border border-[#1B4F8A] text-[#1B4F8A] py-3 rounded-lg hover:bg-[#EBF2F9] transition-colors">
              Reconectar
            </button>
          </div>
        </section>

        {/* Seção Logs de Sincronização */}
        <section>
          <h2 className="text-base text-gray-900 mb-4">Logs de sincronização</h2>
          
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-200">
            {syncLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 mb-1">
                    {log.date} às {log.time}
                  </p>
                  <div className="flex items-center gap-2">
                    {log.status === "success" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                        <span className="text-sm text-[#10B981]">Sucesso</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-[#EF4444]" />
                        <span className="text-sm text-[#EF4444]">Erro</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seção Conta */}
        <section>
          <h2 className="text-base text-gray-900 mb-4">Conta</h2>
          
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            {/* Nome do Usuário */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Nome</p>
              <p className="text-base text-gray-900">Carlos Silva</p>
            </div>

            {/* Cargo */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Cargo</p>
              <p className="text-base text-gray-900">Vendedor Sênior</p>
            </div>

            {/* Botão Sair */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate("/")}
                className="w-full bg-white border border-[#EF4444] text-[#EF4444] py-3 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Menu de Navegação Inferior */}
      <BottomNav />
    </div>
  );
}
