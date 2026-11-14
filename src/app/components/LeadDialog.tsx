import { useEffect, useState } from "react";
import { useUsuario } from "./RequireAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { api, PERFIS_VISAO_TOTAL, type LeadDetalhe, type LeadSalvo, type Vendedor } from "../lib/api";

const inputClass =
  "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent";
const labelClass = "block text-sm text-gray-700 mb-1.5";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  // Presente: edita este lead. Ausente: cria um novo.
  lead?: LeadDetalhe | null;
  onSalvo: (resultado: LeadSalvo) => void;
};

export default function LeadDialog({ aberto, onFechar, lead, onSalvo }: Props) {
  const usuario = useUsuario();
  const veTodoTime = PERFIS_VISAO_TOTAL.includes(usuario.perfil);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setNome(lead?.nome ?? "");
    setEmail(lead?.email ?? "");
    setTelefone(lead?.telefone ?? "");
    setResponsavelId(lead?.responsavel?.id ?? usuario.id);
    setErro(null);
    if (veTodoTime) api.vendedores().then(setVendedores).catch(() => setVendedores([]));
  }, [aberto, lead, usuario.id, veTodoTime]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const dados = {
      nome: nome.trim(),
      email: email.trim() || null,
      telefone: telefone.trim() || null,
      usuario_id: veTodoTime ? responsavelId || null : null,
    };
    setErro(null);
    setSalvando(true);
    try {
      const resultado = lead ? await api.atualizarLead(lead.id, dados) : await api.criarLead(dados);
      onSalvo(resultado);
      onFechar();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && !salvando && onFechar()}>
      <DialogContent className="bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900 font-normal">{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription className="text-gray-500">
            Com o RD Station conectado, o lead também é criado ou atualizado como contato no RD Station CRM.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label htmlFor="lead-nome" className={labelClass}>
              Nome
            </label>
            <input
              id="lead-nome"
              required
              maxLength={512}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="lead-email" className={labelClass}>
                E-mail
              </label>
              <input
                id="lead-email"
                type="email"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="lead-telefone" className={labelClass}>
                Telefone
              </label>
              <input
                id="lead-telefone"
                type="tel"
                maxLength={64}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {veTodoTime && (
            <div>
              <label htmlFor="lead-responsavel" className={labelClass}>
                Responsável
              </label>
              <select
                id="lead-responsavel"
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className={inputClass}
              >
                {lead?.responsavel && !vendedores.some((v) => v.id === lead.responsavel?.id) && (
                  <option value={lead.responsavel.id}>{lead.responsavel.nome}</option>
                )}
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {erro && (
            <p role="alert" className="text-sm text-[#EF4444]">
              {erro}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2.5 bg-[#1B4F8A] text-white rounded-lg text-sm hover:bg-[#153d6e] disabled:opacity-60"
            >
              {salvando ? "Salvando..." : lead ? "Salvar alterações" : "Criar lead"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
