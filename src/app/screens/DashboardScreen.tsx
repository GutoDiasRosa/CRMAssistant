import { useEffect, useState } from "react";
import { Bell, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router";
import { useUsuario } from "../components/RequireAuth";
import {
  api,
  formatarMoeda,
  PERFIL_LABEL,
  PERFIS_VISAO_TOTAL,
  type Metricas,
} from "../lib/api";

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
  const veTodoTime = PERFIS_VISAO_TOTAL.includes(usuario.perfil);

  useEffect(() => {
    api
      .metricas()
      .then(setMetricas)
      .catch((e: Error) => setErro(e.message));
  }, []);

  const valor = (n: number | undefined) => (n === undefined ? "…" : n);

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
        {/* Saudação */}
        <div>
          <h2 className="text-2xl lg:text-3xl text-gray-900">
            {saudacao()}, {usuario.nome.split(" ")[0]}
          </h2>
          <p className="hidden lg:block text-sm text-gray-500 mt-1">
            Resumo {veTodoTime ? "de todo o time" : "da sua carteira"} com dados do RD Station.
          </p>
        </div>

        {erro && <p className="text-sm text-[#EF4444]">{erro}</p>}

        {/* Indicadores: empilhados no celular, lado a lado no monitor */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Card Principal - Valor em oportunidades */}
          <div className="col-span-2 md:col-span-1 bg-white border border-gray-200 rounded-xl p-5 lg:p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base text-gray-700 mb-1">Valor em oportunidades</h3>
              <p className="text-sm text-gray-500">
                {veTodoTime ? "Todo o time" : "Sua carteira"}
              </p>
            </div>
            <span className="text-3xl text-gray-900">
              {metricas ? formatarMoeda(metricas.valor_total_oportunidades) : "…"}
            </span>
          </div>

          {/* Leads na Carteira */}
          <div className="bg-[#EBF2F9] rounded-xl p-5 lg:p-6">
            <p className="text-sm text-gray-600 mb-2">Leads na carteira</p>
            <p className="text-3xl text-[#1B4F8A]">{valor(metricas?.total_leads)}</p>
          </div>

          {/* Oportunidades */}
          <div className="bg-[#EBF2F9] rounded-xl p-5 lg:p-6">
            <p className="text-sm text-gray-600 mb-2">Oportunidades</p>
            <p className="text-3xl text-[#1B4F8A]">{valor(metricas?.total_oportunidades)}</p>
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