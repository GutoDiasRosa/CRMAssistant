import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import { ApiError, api, getToken, setToken } from "../lib/api";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  if (getToken()) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const { access_token } = await api.login(email, password);
      setToken(access_token);
      navigate("/dashboard");
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 401
          ? "E-mail ou senha incorretos."
          : (err as Error).message,
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EBF2F9] to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md md:bg-white md:border md:border-gray-200 md:rounded-2xl md:shadow-sm md:p-10">
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
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {erro && (
            <p role="alert" className="text-sm text-[#EF4444]">
              {erro}
            </p>
          )}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-[#1B4F8A] text-white py-3 rounded-lg hover:bg-[#153d6e] transition-colors mt-6 disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
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
