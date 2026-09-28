import { Home, MessageSquare, Settings, TrendingUp, Users, BarChart3 } from "lucide-react";
import type { Perfil } from "../lib/api";

export type NavItem = {
  icon: typeof Home;
  label: string;
  path: string;
  // Rotas internas que também marcam este item como ativo (ex.: detalhe do lead → Funil).
  match?: string[];
  somenteAdmin?: boolean;
  // Itens exibidos também na barra inferior do celular (máximo de 4).
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: "Início", path: "/dashboard", mobile: true },
  { icon: TrendingUp, label: "Funil", path: "/funnel", match: ["/lead/"], mobile: true },
  { icon: MessageSquare, label: "Assistente", path: "/chat", mobile: true },
  { icon: BarChart3, label: "Performance do time", path: "/team" },
  { icon: Users, label: "Usuários", path: "/usuarios", somenteAdmin: true },
  { icon: Settings, label: "Configurações", path: "/settings", match: ["/usuarios"], mobile: true },
];

export function itensVisiveis(perfil: Perfil) {
  return NAV_ITEMS.filter((item) => !item.somenteAdmin || perfil === "ADMIN");
}

export function estaAtivo(item: NavItem, pathname: string) {
  return (
    pathname === item.path || (item.match ?? []).some((prefixo) => pathname.startsWith(prefixo))
  );
}
