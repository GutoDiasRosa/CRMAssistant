import { createBrowserRouter } from "react-router";
import RequireAuth from "./components/RequireAuth";
import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import FunnelScreen from "./screens/FunnelScreen";
import ChatbotScreen from "./screens/ChatbotScreen";
import LeadDetailsScreen from "./screens/LeadDetailsScreen";
import TeamPerformanceScreen from "./screens/TeamPerformanceScreen";
import SettingsScreen from "./screens/SettingsScreen";
import UsersScreen from "./screens/UsersScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginScreen,
  },
  {
    // Telas que exigem login
    Component: RequireAuth,
    children: [
      { path: "/dashboard", Component: DashboardScreen },
      { path: "/funnel", Component: FunnelScreen },
      { path: "/chat", Component: ChatbotScreen },
      { path: "/lead/:id", Component: LeadDetailsScreen },
      { path: "/team", Component: TeamPerformanceScreen },
      { path: "/settings", Component: SettingsScreen },
      { path: "/usuarios", Component: UsersScreen },
    ],
  },
]);
