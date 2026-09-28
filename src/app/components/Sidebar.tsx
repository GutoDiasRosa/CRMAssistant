import { LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { PERFIL_LABEL, type Usuario } from "../lib/api";
import { itensVisiveis } from "./navItems";

// Menu lateral fixo exibido a partir de telas grandes (lg, 1024px).
export default function Sidebar({ usuario, onSair }: { usuario: Usuario; onSair: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const itens = itensVisiveis(usuario.perfil);
  const caminhosVisiveis = itens.map((i) => i.path);

  const ativo = (path: string, match: string[] = []) =>
    location.pathname === path ||
    match
      // Não herda o destaque de uma rota que já tem item próprio no menu.
      .filter((prefixo) => !caminhosVisiveis.includes(prefixo))
      .some((prefixo) => location.pathname.startsWith(prefixo));

  const iniciais = usuario.nome
    .split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-20 w-64 flex-col bg-white border-r border-gray-200">
      {/* Marca */}
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-3 px-6 h-16 border-b border-gray-200 text-left"
      >
        <div className="w-9 h-9 bg-[#1B4F8A] rounded-xl flex items-center justify-center">
          <span className="text-white text-sm font-bold">AC</span>
        </div>
        <span className="text-base text-gray-900">CRM Assist</span>
      </button>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {itens.map((item) => {
          const Icon = item.icon;
          const isActive = ativo(item.path, item.match);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-[#EBF2F9] text-[#1B4F8A] font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Usuário logado */}
      <div className="border-t border-gray-200 p-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#EBF2F9] rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-[#1B4F8A]">{iniciais}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 truncate">{usuario.nome}</p>
          <p className="text-xs text-gray-500 truncate">{PERFIL_LABEL[usuario.perfil]}</p>
        </div>
        <button
          onClick={onSair}
          aria-label="Sair"
          title="Sair"
          className="p-2 text-gray-400 hover:text-[#EF4444] rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
