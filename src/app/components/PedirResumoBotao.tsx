import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router";

// Abre o chat com a pergunta já escrita na caixa de texto; o usuário revisa e envia.
export type ChatState = { pergunta?: string };

export default function PedirResumoBotao({ pergunta }: { pergunta: string }) {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-24 right-4 lg:bottom-8 lg:right-10 z-10">
      <button
        onClick={() => navigate("/chat", { state: { pergunta } satisfies ChatState })}
        className="bg-[#1B4F8A] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-[#153d6e] transition-colors text-sm"
      >
        <MessageSquare className="w-5 h-5 flex-shrink-0" />
        <span className="whitespace-nowrap">Pedir resumo ao assistente</span>
      </button>
    </div>
  );
}
