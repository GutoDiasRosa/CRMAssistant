import { useEffect, useState } from "react";
import { useUsuario } from "./RequireAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  api,
  PERFIS_VISAO_TOTAL,
  STATUS_OPORTUNIDADE,
  type Etapas,
  type OportunidadeDetalhe,
  type OportunidadeEntrada,
  type OportunidadeSalva,
  type StatusOportunidade,
  type Vendedor,
} from "../lib/api";

const inputClass =
  "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent";
const labelClass = "block text-sm text-gray-700 mb-1.5";

const ehStatus = (s: string | null | undefined): s is StatusOportunidade =>
  !!s && s in STATUS_OPORTUNIDADE;

type Props = {
  aberto: boolean;
  onFechar: () => void;
  // Presente: edita esta oportunidade. Ausente: cria uma nova.
  oportunidade?: OportunidadeDetalhe | null;
  // Criação a partir de um lead: o contato vem preenchido e a oportunidade fica ligada a ele.
  leadInicial?: { id: string; nome: string; email: string | null; telefone: string | null } | null;
  onSalva: (resultado: OportunidadeSalva) => void;
};

export default function OportunidadeDialog({ aberto, onFechar, oportunidade, leadInicial, onSalva }: Props) {
  const usuario = useUsuario();
  const veTodoTime = PERFIS_VISAO_TOTAL.includes(usuario.perfil);
  const [etapas, setEtapas] = useState<Etapas | null>(null);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [etapaRdId, setEtapaRdId] = useState("");
  const [etapaNome, setEtapaNome] = useState("");
  const [status, setStatus] = useState<StatusOportunidade>("ongoing");
  const [responsavelId, setResponsavelId] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [contatoEmail, setContatoEmail] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Preenche o formulário a cada abertura e carrega as opções.
  useEffect(() => {
    if (!aberto) return;
    const op = oportunidade;
    setNome(op?.nome ?? "");
    setValor(op?.valor != null ? String(op.valor) : "");
    setEtapaRdId(op?.rd_stage_id ?? "");
    setEtapaNome(op?.etapa_funil ?? "");
    const statusAtual = op?.status;
    setStatus(ehStatus(statusAtual) ? statusAtual : "ongoing"); // "open" (dados antigos) vira "ongoing"
    setResponsavelId(op?.responsavel?.id ?? usuario.id);
    const contato = op ? op.contato : leadInicial;
    setContatoNome(contato?.nome ?? "");
    setContatoEmail(contato?.email ?? "");
    setContatoTelefone(contato?.telefone ?? "");
    setErro(null);
    setEtapas(null);
    api
      .etapas()
      .then((e) => {
        setEtapas(e);
        // Oportunidade criada sem o RD: casa a etapa pelo nome, se existir no funil do RD.
        if (e.origem === "rd" && op && !op.rd_stage_id && op.etapa_funil) {
          const achada = e.funis.flatMap((f) => f.etapas).find((et) => et.nome === op.etapa_funil);
          if (achada?.id) setEtapaRdId(achada.id);
        }
      })
      .catch(() => setEtapas({ origem: "local", funis: [], aviso: "Não foi possível carregar as etapas." }));
    if (veTodoTime) api.vendedores().then(setVendedores).catch(() => setVendedores([]));
  }, [aberto, oportunidade, leadInicial, usuario.id, veTodoTime]);

  const doRd = etapas?.origem === "rd";
  const variosFunis = (etapas?.funis.length ?? 0) > 1;

  const escolherEtapaRd = (id: string) => {
    setEtapaRdId(id);
    const etapa = etapas?.funis.flatMap((f) => f.etapas).find((e) => e.id === id);
    setEtapaNome(etapa?.nome ?? "");
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const temContato = contatoNome.trim() || contatoEmail.trim() || contatoTelefone.trim();
    if (temContato && !contatoNome.trim()) {
      setErro("Informe o nome do contato.");
      return;
    }
    const dados: OportunidadeEntrada = {
      nome: nome.trim(),
      valor: valor.trim() ? Number(valor) : null,
      etapa: etapaNome.trim() || null,
      etapa_rd_id: doRd ? etapaRdId || null : null,
      status,
      usuario_id: veTodoTime ? responsavelId || null : null,
      lead_id: !oportunidade && leadInicial ? leadInicial.id : null,
      contato: temContato
        ? {
            nome: contatoNome.trim(),
            email: contatoEmail.trim() || null,
            telefone: contatoTelefone.trim() || null,
          }
        : null,
    };
    setErro(null);
    setSalvando(true);
    try {
      const resultado = oportunidade
        ? await api.atualizarOportunidade(oportunidade.id, dados)
        : await api.criarOportunidade(dados);
      onSalva(resultado);
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
          <DialogTitle className="text-gray-900 font-normal">
            {oportunidade ? "Editar oportunidade" : "Nova oportunidade"}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {doRd
              ? "Ao salvar, a oportunidade também é criada ou atualizada no RD Station CRM."
              : "O RD Station não está conectado: a oportunidade fica só no CRM Assist."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={salvar} className="space-y-4">
          <div>
            <label htmlFor="op-nome" className={labelClass}>
              Nome da oportunidade
            </label>
            <input
              id="op-nome"
              required
              maxLength={512}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={inputClass}
              placeholder="Ex.: Construtora Horizonte — betoneiras"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="op-valor" className={labelClass}>
                Valor (R$)
              </label>
              <input
                id="op-valor"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="op-status" className={labelClass}>
                Status
              </label>
              <select
                id="op-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusOportunidade)}
                className={inputClass}
              >
                {Object.entries(STATUS_OPORTUNIDADE).map(([id, rotulo]) => (
                  <option key={id} value={id}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="op-etapa" className={labelClass}>
              Etapa do funil
            </label>
            {etapas === null ? (
              <p className="text-sm text-gray-500">Carregando etapas...</p>
            ) : doRd ? (
              <select
                id="op-etapa"
                required
                value={etapaRdId}
                onChange={(e) => escolherEtapaRd(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Escolha a etapa
                </option>
                {etapas.funis.map((funil) =>
                  variosFunis ? (
                    <optgroup key={funil.id ?? funil.nome} label={funil.nome}>
                      {funil.etapas.map((et) => (
                        <option key={et.id ?? et.nome} value={et.id ?? ""}>
                          {et.nome}
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    funil.etapas.map((et) => (
                      <option key={et.id ?? et.nome} value={et.id ?? ""}>
                        {et.nome}
                      </option>
                    ))
                  ),
                )}
              </select>
            ) : (
              <>
                <input
                  id="op-etapa"
                  list="op-etapas-existentes"
                  maxLength={255}
                  value={etapaNome}
                  onChange={(e) => setEtapaNome(e.target.value)}
                  className={inputClass}
                  placeholder="Ex.: Prospecção"
                />
                <datalist id="op-etapas-existentes">
                  {etapas.funis.flatMap((f) => f.etapas).map((et) => (
                    <option key={et.nome} value={et.nome} />
                  ))}
                </datalist>
              </>
            )}
            {etapas?.aviso && <p className="text-xs text-[#B45309] mt-1.5">{etapas.aviso}</p>}
          </div>

          {veTodoTime && (
            <div>
              <label htmlFor="op-responsavel" className={labelClass}>
                Responsável
              </label>
              <select
                id="op-responsavel"
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className={inputClass}
              >
                {/* O responsável atual pode não estar na lista (ex.: usuário desativado). */}
                {oportunidade?.responsavel && !vendedores.some((v) => v.id === oportunidade.responsavel?.id) && (
                  <option value={oportunidade.responsavel.id}>{oportunidade.responsavel.nome}</option>
                )}
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <fieldset className="space-y-3 pt-2 border-t border-gray-200">
            <legend className="text-sm text-gray-900 pt-3">Contato</legend>
            <div>
              <label htmlFor="op-contato-nome" className={labelClass}>
                Nome
              </label>
              <input
                id="op-contato-nome"
                maxLength={512}
                value={contatoNome}
                onChange={(e) => setContatoNome(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="op-contato-email" className={labelClass}>
                  E-mail
                </label>
                <input
                  id="op-contato-email"
                  type="email"
                  maxLength={255}
                  value={contatoEmail}
                  onChange={(e) => setContatoEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="op-contato-telefone" className={labelClass}>
                  Telefone
                </label>
                <input
                  id="op-contato-telefone"
                  type="tel"
                  maxLength={64}
                  value={contatoTelefone}
                  onChange={(e) => setContatoTelefone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </fieldset>

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
              disabled={salvando || etapas === null}
              className="px-4 py-2.5 bg-[#1B4F8A] text-white rounded-lg text-sm hover:bg-[#153d6e] disabled:opacity-60"
            >
              {salvando ? "Salvando..." : oportunidade ? "Salvar alterações" : "Criar oportunidade"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
