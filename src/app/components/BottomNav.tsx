import { Link, useLocation } from "react-router";
import { NAV_ITEMS, estaAtivo } from "./navItems";

// Navegação do celular; em telas grandes (lg) o menu lateral (Sidebar) assume.
export default function BottomNav() {
  const location = useLocation();
  const navItems = NAV_ITEMS.filter((item) => item.mobile);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = estaAtivo(item, location.pathname);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 py-2 px-3"
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? "text-[#1B4F8A]" : "text-gray-400"
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? "text-[#1B4F8A] font-medium" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
