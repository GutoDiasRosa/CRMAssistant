import { useState } from "react";
import { Clock, Send } from "lucide-react";
import BottomNav from "../components/BottomNav";

type Message = {
  id: number;
  text: string;
  sender: "user" | "assistant";
  timestamp: string;
};

export default function ChatbotScreen() {
  const [inputValue, setInputValue] = useState("");
  const [messages] = useState<Message[]>([
    {
      id: 1,
      text: "Quantos leads qualificados tenho essa semana?",
      sender: "user",
      timestamp: "14:32",
    },
    {
      id: 2,
      text: "Você tem 8 leads qualificados essa semana. Sua meta semanal é de 10. Faltam 2 para bater a meta.",
      sender: "assistant",
      timestamp: "14:32",
    },
  ]);

  const handleSend = () => {
    if (inputValue.trim()) {
      // Aqui seria adicionada a nova mensagem
      setInputValue("");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-xl text-gray-900">Assistente IA</h1>
          <button className="p-2">
            <Clock className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Área de Conversa */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] ${
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
                    : "bg-[#F5F5F5] text-gray-900"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
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
      </div>

      {/* Campo de Input Fixo */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 sticky bottom-16">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite sua pergunta..."
            className="flex-1 px-4 py-3 bg-[#F5F5F5] rounded-full focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
          />
          <button
            onClick={handleSend}
            className="w-12 h-12 bg-[#1B4F8A] text-white rounded-full flex items-center justify-center hover:bg-[#153d6e] transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Menu de Navegação Inferior */}
      <BottomNav />
    </div>
  );
}
