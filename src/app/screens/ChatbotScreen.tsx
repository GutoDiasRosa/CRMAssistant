import { useEffect, useRef, useState } from "react";
import { Clock, Send } from "lucide-react";
import { useUsuario } from "../components/RequireAuth";
import { api } from "../lib/api";

type Message = {
  id: number;
  text: string;
  sender: "user" | "assistant";
  timestamp: string;
  erro?: boolean;
};

const horaAtual = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export default function ChatbotScreen() {
  const usuario = useUsuario();
  const [inputValue, setInputValue] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Identifica a conversa no backend; vem na primeira resposta do /chat.
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: `Olá, ${usuario.nome.split(" ")[0]}! Pergunte sobre seu funil, leads, desempenho do time ou relatórios.`,
      sender: "assistant",
      timestamp: horaAtual(),
    },
  ]);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, enviando]);

  const adicionar = (msg: Omit<Message, "id" | "timestamp">) =>
    setMessages((atual) => [...atual, { ...msg, id: atual.length, timestamp: horaAtual() }]);

  const handleSend = async () => {
    const texto = inputValue.trim();
    if (!texto || enviando) return;
    setInputValue("");
    adicionar({ text: texto, sender: "user" });
    setEnviando(true);
    try {
      const resposta = await api.chat(texto, sessionId);
      setSessionId(resposta.sessionId);
      adicionar({ text: resposta.response_text, sender: "assistant" });
    } catch (e) {
      adicionar({ text: (e as Error).message, sender: "assistant", erro: true });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-3xl mx-auto">
          <h1 className="text-xl text-gray-900">Assistente IA</h1>
          <button className="p-2">
            <Clock className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Área de Conversa */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-4 lg:py-6 space-y-4 w-full max-w-3xl mx-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] md:max-w-[70%] ${
                message.sender === "user" ? "order-2" : "order-1"
              }`}
            >
              {/* Avatar do Assistente */}
              {message.sender === "assistant" && (
                <div className="flex items-start gap-2 mb-1">
                  <div className="w-8 h-8 bg-[#1B4F8A] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">AI</span>
                  </div>
                </div>
              )}

              {/* Balão de Mensagem */}
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.sender === "user"
                    ? "bg-[#1B4F8A] text-white ml-auto"
                    : message.erro
                      ? "bg-red-50 text-[#EF4444]"
                      : "bg-[#F5F5F5] text-gray-900"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
              </div>

              {/* Timestamp */}
              <div
                className={`mt-1 px-1 ${
                  message.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <span className="text-xs text-gray-400">
                  {message.timestamp}
                </span>
              </div>
            </div>
          </div>
        ))}
        {enviando && (
          <p className="text-sm text-gray-400 px-1" aria-live="polite">
            Assistente digitando...
          </p>
        )}
        <div ref={fimRef} />
      </div>

      {/* Campo de Input Fixo */}
      <div className="bg-white border-t border-gray-200 px-6 lg:px-10 py-4 sticky bottom-16 lg:bottom-0">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite sua pergunta..."
            className="flex-1 px-4 py-3 bg-[#F5F5F5] rounded-full focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          />
          <button
            onClick={handleSend}
            disabled={enviando || !inputValue.trim()}
            aria-label="Enviar"
            className="w-12 h-12 bg-[#1B4F8A] text-white rounded-full flex items-center justify-center hover:bg-[#153d6e] transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
}
