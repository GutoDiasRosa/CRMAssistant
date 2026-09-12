import { Home, TrendingUp, MessageSquare, Settings } from "lucide-react";
import { Link, useLocation } from "react-router";

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: TrendingUp, label: "Funil", path: "/funnel" },
    { icon: MessageSquare, label: "Chat", path: "/chat" },
    { icon: Settings, label: "Config", path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 max-w-md mx-auto">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
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
