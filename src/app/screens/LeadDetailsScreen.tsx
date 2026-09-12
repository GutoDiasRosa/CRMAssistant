import { ArrowLeft, Phone, Mail, User, Briefcase, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router";

const timelineEvents = [
  {
    id: 1,
    type: "Ligação",
    description: "Ligação de follow-up realizada",
    date: "28/03/2026 - 14:30",
  },
  {
    id: 2,
    type: "E-mail",
    description: "Proposta comercial enviada",
    date: "26/03/2026 - 10:15",
  },
  {
    id: 3,
    type: "Reunião",
    description: "Reunião de apresentação",
    date: "22/03/2026 - 15:00",
  },
];

export default function LeadDetailsScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl text-gray-900">Construtora ABC</h1>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="p-6 space-y-6">
        {/* Dados do Contato */}
        <section>
          <h2 className="text-base text-gray-900 mb-4">Dados do contato</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#EBF2F9] rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-[#1B4F8A]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="text-base text-gray-900">João Silva</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#EBF2F9] rounded-full flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-[#1B4F8A]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cargo</p>
                <p className="text-base text-gray-900">Gerente de Compras</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#EBF2F9] rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-[#1B4F8A]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="text-base text-gray-900">(11) 98765-4321</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#EBF2F9] rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-[#1B4F8A]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">E-mail</p>
                <p className="text-base text-gray-900">joao@construtorabc.com.br</p>
              </div>
            </div>
          </div>
        </section>

        {/* Histórico de Interações */}
        <section>
          <h2 className="text-base text-gray-900 mb-4">Histórico de interações</h2>
          <div className="relative pl-1">
            {/* Linha Vertical da Timeline */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200"></div>

            <div className="space-y-6">
              {timelineEvents.map((event) => (
                <div key={event.id} className="flex gap-4">
                  {/* Ponto da Timeline */}
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-[#1B4F8A] rounded-full flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>

                  {/* Conteúdo do Evento */}
                  <div className="flex-1 pt-1">
                    <p className="text-base text-gray-900 mb-1">{event.type}</p>
                    <p className="text-sm text-gray-600 mb-1">
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-400">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Status Atual */}
        <section>
          <h2 className="text-base text-gray-900 mb-4">Status atual</h2>
          <div className="inline-flex items-center gap-2 bg-[#EBF2F9] px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-[#1B4F8A] rounded-full"></div>
            <span className="text-sm text-[#1B4F8A]">Prospecção</span>
          </div>
        </section>
      </div>

      {/* Botão Flutuante */}
      <div className="fixed bottom-24 left-0 right-0 px-4 flex justify-end max-w-[480px] mx-auto">
        <button
          onClick={() => navigate("/chat")}
          className="bg-[#1B4F8A] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-[#153d6e] transition-colors text-sm"
        >
          <MessageSquare className="w-5 h-5 flex-shrink-0" />
          <span className="whitespace-nowrap">Pedir resumo ao assistente</span>
        </button>
      </div>
    </div>
  );
}