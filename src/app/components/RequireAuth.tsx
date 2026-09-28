import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate, useOutletContext } from "react-router";
import { ApiError, api, getToken, setToken, type Usuario } from "../lib/api";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";

// Envolve as telas internas: só renderiza com usuário autenticado
// e disponibiliza os dados dele para as telas via useUsuario().
export default function RequireAuth() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const token = getToken();

  useEffect(() => {
    if (!token) return;
    api
      .me()
      .then(setUsuario)
      .catch((e: ApiError) => {
        if (e.status === 401) {
          setToken(null);
          navigate("/", { replace: true });
        } else {
          setErro(e.message);
        }
      });
  }, [token, navigate]);

  if (!token) return <Navigate to="/" replace />;

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-sm text-[#EF4444]">
        {erro}
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar usuario={usuario} onSair={() => sair(navigate)} />
      {/* No monitor o conteúdo fica ao lado do menu lateral (w-64) */}
      <main className="lg:pl-64 min-w-0">
        <Outlet context={usuario} />
      </main>
      <BottomNav />
    </div>
  );
}

export function useUsuario() {
  return useOutletContext<Usuario>();
}

export function sair(navigate: ReturnType<typeof useNavigate>) {
  setToken(null);
  navigate("/", { replace: true });
}
