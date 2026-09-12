import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EBF2F9] to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#1B4F8A] rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">AC</div>
          </div>
          <h1 className="text-2xl text-gray-900">Assistente de CRM</h1>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Campo E-mail */}
          <div>
            <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
              E-mail corporativo
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent"
              placeholder="seu.email@empresa.com"
            />
          </div>

          {/* Campo Senha */}
          <div>
            <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent pr-12"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Botão Entrar */}
          <button
            type="submit"
            className="w-full bg-[#1B4F8A] text-white py-3 rounded-lg hover:bg-[#153d6e] transition-colors mt-6"
          >
            Entrar
          </button>

          {/* Link Esqueci Senha */}
          <div className="text-center">
            <a href="#" className="text-sm text-[#1B4F8A] hover:underline">
              Esqueci minha senha
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
