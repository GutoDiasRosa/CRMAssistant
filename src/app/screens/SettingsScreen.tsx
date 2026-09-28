import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, LogOut, MinusCircle, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { sair, useUsuario } from "../components/RequireAuth";
import { api, PERFIL_LABEL, type Sincronizacao } from "../lib/api";

const formatarData = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("pt-BR"),
    time: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
};

export default function SettingsScreen() {
  const navigate = useNavigate();
  const usuario = useUsuario();
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [syncLogs, setSyncLogs] = useState<Sincronizacao[] | null>(null);

  useEffect(() => {
    api
      .rdStatus()
      .then((r) => setConectado(r.connected))
      .catch(() => setConectado(false));
    api
      .sincronizacoes()
      .then(setSyncLogs)
      .catch(() => setSyncLogs([]));
  }, []);

  const ultima = syncLogs?.[0] ? formatarData(syncLogs[0].created_at) : null;

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4">
        <h1 className="text-xl text-gray-900">Configurações</h1>
      </header>

      {/* Conteúdo */}
      <div className="p-6 lg:p-10 grid gap-8 lg:grid-cols-2 lg:items-start max-w-6xl">
        {/* Seção Integração RD Station */}
        <section>
          <h2 className="text-base text-gray-900 mb-4">Integração com RD Station</h2>
          
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            {/* Status da Conexão */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Status da conexão</span>
              {conectado === null ? (
                <span className="text-sm text-gray-500">Verificando...</span>
              ) : conectado ? (
                <span className="inline-flex items-center gap-2 bg-[#10B981]/10 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                  <span className="text-sm text-[#10B981]">Conectado</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Não conectado</span>
                </span>
              )}
            </div>

            {/* Última Sincronização */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-700 mb-1">Última sincronização</p>
              <p className="text-sm text-gray-900">
                {ultima ? `${ultima.date} às ${ultima.time}` : "Nenhuma ainda"}
              </p>
            </div>

            {/* Botão Conectar (fluxo OAuth do RD Station no backend) */}
            <a
              href={api.rdAuthorizeUrl}
              className="block text-center w-full bg-white border border-[#1B4F8A] text-[#1B4F8A] py-3 rounded-lg hover:bg-[#EBF2F9] transition-colors"
            >
              {conectado ? "Reconectar" : "Conectar ao RD Station"}
            </a>
          </div>
        </section>

        {/* Seção Logs de Sincronização */}
        <section>
          <h2 className="text-base text-gray-900 mb-4">Logs de sincronização</h2>
          
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-200">
            {syncLogs?.length === 0 && (
              <p className="p-4 text-sm text-gray-500">Nenhuma sincronização registrada.</p>
            )}
            {syncLogs?.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 mb-1">
                    {formatarData(log.created_at).date} às {formatarData(log.created_at).time}
                  </p>
                  <div className="flex items-center gap-2">
                    {log.status === "success" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                        <span className="text-sm text-[#10B981]">Sucesso</span>
                      </>
                    ) : log.status === "ignored" ? (
                      <>
                        <MinusCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Ignorado</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-[#EF4444]" />
                        <span className="text-sm text-[#EF4444]">Erro</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seção Conta */}
        <section>
          <h2 className="text-base text-gray-900 mb-4">Conta</h2>
          
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            {/* Nome do Usuário */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Nome</p>
              <p className="text-base text-gray-900">{usuario.nome}</p>
            </div>

            {/* Cargo */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Cargo</p>
              <p className="text-base text-gray-900">{PERFIL_LABEL[usuario.perfil]}</p>
            </div>

            {/* Gestão de usuários (somente administradores) */}
            {usuario.perfil === "ADMIN" && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate("/usuarios")}
                  className="w-full bg-white border border-[#1B4F8A] text-[#1B4F8A] py-3 rounded-lg hover:bg-[#EBF2F9] transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  <span>Gerenciar usuários</span>
                </button>
              </div>
            )}

            {/* Botão Sair */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => sair(navigate)}
                className="w-full bg-white border border-[#EF4444] text-[#EF4444] py-3 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
