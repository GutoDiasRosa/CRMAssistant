import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, UserPlus } from "lucide-react";
import { useNavigate } from "react-router";
import { useUsuario } from "../components/RequireAuth";
import { api, PERFIL_LABEL, type NovoUsuario, type Perfil, type Usuario } from "../lib/api";

const PERFIS: Perfil[] = ["SDR", "CLOSER", "GERENTE", "DIRETOR", "ANALISTA", "ADMIN"];

const FORM_VAZIO: NovoUsuario = { nome: "", email: "", password: "", perfil: "SDR" };

const inputClass =
  "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent";

export default function UsersScreen() {
  const navigate = useNavigate();
  const usuario = useUsuario();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [form, setForm] = useState<NovoUsuario>(FORM_VAZIO);
  const [showPassword, setShowPassword] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const isAdmin = usuario.perfil === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;
    api
      .listarUsuarios()
      .then(setUsuarios)
      .catch((e: Error) => setErro(e.message));
  }, [isAdmin]);

  const atualizar = <K extends keyof NovoUsuario>(campo: K, valor: NovoUsuario[K]) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setSalvando(true);
    try {
      const criado = await api.criarUsuario(form);
      setUsuarios((atual) =>
        [...(atual ?? []), criado].sort((a, b) => a.nome.localeCompare(b.nome)),
      );
      setSucesso(`Usuário ${criado.nome} cadastrado com o perfil ${PERFIL_LABEL[criado.perfil]}.`);
      setForm(FORM_VAZIO);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} aria-label="Voltar" className="p-1 -ml-1 lg:hidden">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl text-gray-900">Usuários</h1>
        </div>
      </header>

      {!isAdmin ? (
        <p className="p-6 text-sm text-gray-500">
          Apenas administradores podem gerenciar usuários.
        </p>
      ) : (
        <div className="p-6 lg:p-10 grid gap-8 lg:grid-cols-2 lg:items-start max-w-6xl">
          {/* Novo usuário */}
          <section>
            <h2 className="text-base text-gray-900 mb-4">Novo usuário</h2>
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
            >
              <div>
                <label htmlFor="nome" className="block text-sm text-gray-700 mb-2">
                  Nome completo
                </label>
                <input
                  id="nome"
                  required
                  value={form.nome}
                  onChange={(e) => atualizar("nome", e.target.value)}
                  className={inputClass}
                  placeholder="Ex.: Carlos Eduardo Mendes"
                />
              </div>

              <div>
                <label htmlFor="novo-email" className="block text-sm text-gray-700 mb-2">
                  E-mail corporativo
                </label>
                <input
                  id="novo-email"
                  type="email"
                  required
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => atualizar("email", e.target.value)}
                  className={inputClass}
                  placeholder="nome@empresa.com"
                />
              </div>

              <div>
                <label htmlFor="nova-senha" className="block text-sm text-gray-700 mb-2">
                  Senha inicial
                </label>
                <div className="relative">
                  <input
                    id="nova-senha"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => atualizar("password", e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="Mínimo de 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="perfil" className="block text-sm text-gray-700 mb-2">
                  Perfil de acesso
                </label>
                <select
                  id="perfil"
                  value={form.perfil}
                  onChange={(e) => atualizar("perfil", e.target.value as Perfil)}
                  className={inputClass}
                >
                  {PERFIS.map((p) => (
                    <option key={p} value={p}>
                      {PERFIL_LABEL[p]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {form.perfil === "SDR" || form.perfil === "CLOSER"
                    ? "Vê apenas a própria carteira de leads e oportunidades."
                    : form.perfil === "ADMIN"
                      ? "Vê todos os dados e pode cadastrar usuários."
                      : "Vê os dados de toda a equipe."}
                </p>
              </div>

              {erro && (
                <p role="alert" className="text-sm text-[#EF4444]">
                  {erro}
                </p>
              )}
              {sucesso && (
                <p role="status" className="text-sm text-[#10B981]">
                  {sucesso}
                </p>
              )}

              <button
                type="submit"
                disabled={salvando}
                className="w-full bg-[#1B4F8A] text-white py-3 rounded-lg hover:bg-[#153d6e] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <UserPlus className="w-5 h-5" />
                <span>{salvando ? "Cadastrando..." : "Cadastrar usuário"}</span>
              </button>
            </form>
          </section>

          {/* Lista de usuários */}
          <section>
            <h2 className="text-base text-gray-900 mb-4">
              Usuários cadastrados{usuarios ? ` (${usuarios.length})` : ""}
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-200">
              {usuarios === null && !erro && (
                <p className="p-4 text-sm text-gray-500">Carregando...</p>
              )}
              {usuarios?.map((u) => (
                <div key={u.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EBF2F9] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm text-[#1B4F8A]">
                      {u.nome
                        .split(" ")
                        .map((parte) => parte[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {u.nome}
                      {u.id === usuario.id && <span className="text-gray-500"> (você)</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <span className="inline-block mt-1 text-xs text-[#1B4F8A] bg-[#EBF2F9] px-2 py-0.5 rounded-full">
                      {PERFIL_LABEL[u.perfil]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
