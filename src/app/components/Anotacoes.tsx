import { useEffect, useState } from "react";
import { CalendarClock, Check, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { api, TIPO_ANOTACAO, type Anotacao, type TipoAnotacao } from "../lib/api";

const inputClass =
  "w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent";

// Data local de hoje no formato AAAA-MM-DD (a do toISOString seria a de UTC).
export function hojeLocal(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const agoraLocal = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const formatarDataHora = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
};

export const formatarDia = (aaaaMmDd: string) => aaaaMmDd.split("-").reverse().join("/");

// Uma anotação na linha do tempo; usada na tela do cliente e na agenda.
export function AnotacaoItem({
  anotacao: a,
  mostrarCliente,
  onAlterada,
  onExcluida,
}: {
  anotacao: Anotacao;
  mostrarCliente: boolean;
  onAlterada: (a: Anotacao) => void;
  onExcluida: (id: string) => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const atrasado = !!a.retorno_em && a.retorno_em < hojeLocal();

  const concluirRetorno = async () => {
    setOcupado(true);
    setErro(null);
    try {
      onAlterada(
        await api.atualizarAnotacao(a.id, {
          lead_id: a.lead?.id ?? null,
          oportunidade_id: a.oportunidade?.id ?? null,
          tipo: a.tipo,
          descricao: a.descricao,
          data: a.data,
          retorno_em: null,
        }),
      );
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  const excluir = async () => {
    if (!window.confirm("Excluir esta anotação?")) return;
    setOcupado(true);
    try {
      await api.excluirAnotacao(a.id);
      onExcluida(a.id);
    } catch (e) {
      setErro((e as Error).message);
      setOcupado(false);
    }
  };

  return (
    <li className="border border-gray-200 rounded-xl p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
        <span className="px-2 py-0.5 rounded-full bg-[#EBF2F9] text-[#1B4F8A]">{TIPO_ANOTACAO[a.tipo] ?? a.tipo}</span>
        <span>{formatarDataHora(a.data)}</span>
        {a.autor && <span>· {a.autor.nome}</span>}
      </div>
      {mostrarCliente && (a.lead || a.oportunidade) && (
        <p className="text-sm text-gray-900">
          {a.lead && (
            <Link to={`/leads/${a.lead.id}`} className="text-[#1B4F8A] hover:underline">
              {a.lead.nome}
            </Link>
          )}
          {a.lead && a.oportunidade && " · "}
          {a.oportunidade && (
            <Link to={`/lead/${a.oportunidade.id}`} className="text-[#1B4F8A] hover:underline">
              {a.oportunidade.nome}
            </Link>
          )}
        </p>
      )}
      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{a.descricao}</p>
      {(a.retorno_em || a.pode_editar) && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {a.retorno_em && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${
                atrasado ? "bg-[#EF4444]/10 text-[#B91C1C]" : "bg-[#F59E0B]/10 text-[#92400E]"
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              Retorno {atrasado ? "atrasado" : "em"} {formatarDia(a.retorno_em)}
            </span>
          )}
          {a.retorno_em && a.pode_editar && (
            <button
              onClick={concluirRetorno}
              disabled={ocupado}
              className="inline-flex items-center gap-1 text-xs text-[#047857] hover:underline disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" /> Retorno feito
            </button>
          )}
          {a.pode_editar && (
            <button
              onClick={excluir}
              disabled={ocupado}
              aria-label="Excluir anotação"
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#EF4444] disabled:opacity-60 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          )}
        </div>
      )}
      {erro && <p className="text-xs text-[#EF4444]">{erro}</p>}
    </li>
  );
}

// Formulário + linha do tempo de anotações de um lead ou de uma oportunidade.
export function AnotacoesPanel({ leadId, oportunidadeId }: { leadId?: string; oportunidadeId?: string }) {
  const [anotacoes, setAnotacoes] = useState<Anotacao[] | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoAnotacao>("nota");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(agoraLocal());
  const [retorno, setRetorno] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId && !oportunidadeId) return;
    setAnotacoes(null);
    setErroCarga(null);
    api
      .anotacoes({ lead_id: leadId, oportunidade_id: oportunidadeId })
      .then(setAnotacoes)
      .catch((e: Error) => setErroCarga(e.message));
  }, [leadId, oportunidadeId]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const nova = await api.criarAnotacao({
        lead_id: leadId ?? null,
        oportunidade_id: oportunidadeId ?? null,
        tipo,
        descricao: descricao.trim(),
        data: data ? new Date(data).toISOString() : null,
        retorno_em: retorno || null,
      });
      setAnotacoes((atual) => [nova, ...(atual ?? [])].sort((x, y) => y.data.localeCompare(x.data)));
      setDescricao("");
      setRetorno("");
      setData(agoraLocal());
      setTipo("nota");
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-base text-gray-900">Anotações</h2>
      <form onSubmit={salvar} className="space-y-3 bg-[#F5F5F5] rounded-xl p-4">
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
          <select
            aria-label="Tipo de contato"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoAnotacao)}
            className={inputClass}
          >
            {Object.entries(TIPO_ANOTACAO).map(([id, rotulo]) => (
              <option key={id} value={id}>
                {rotulo}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            aria-label="Quando aconteceu"
            value={data}
            max={agoraLocal()}
            onChange={(e) => setData(e.target.value)}
            className={inputClass}
          />
        </div>
        <textarea
          required
          maxLength={5000}
          rows={3}
          aria-label="Anotação"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="O que aconteceu? Ex.: Liguei, pediu proposta com 10 betoneiras; decisor é o diretor de obras."
          className={`${inputClass} resize-y`}
        />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="text-sm text-gray-700">
            Próximo retorno (opcional)
            <input
              type="date"
              value={retorno}
              min={hojeLocal()}
              onChange={(e) => setRetorno(e.target.value)}
              className={`${inputClass} mt-1.5 w-44`}
            />
          </label>
          <button
            type="submit"
            disabled={salvando || !descricao.trim()}
            className="px-4 py-2.5 bg-[#1B4F8A] text-white rounded-lg text-sm hover:bg-[#153d6e] disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Registrar anotação"}
          </button>
        </div>
        {erro && (
          <p role="alert" className="text-sm text-[#EF4444]">
            {erro}
          </p>
        )}
      </form>

      {erroCarga && <p className="text-sm text-[#EF4444]">{erroCarga}</p>}
      {!erroCarga && anotacoes === null && <p className="text-sm text-gray-500">Carregando anotações...</p>}
      {anotacoes?.length === 0 && <p className="text-sm text-gray-500">Nenhuma anotação ainda.</p>}
      {!!anotacoes?.length && (
        <ul className="space-y-3">
          {anotacoes.map((a) => (
            <AnotacaoItem
              key={a.id}
              anotacao={a}
              // Na tela do lead, mostra de qual oportunidade a anotação é.
              mostrarCliente={!!leadId && !!a.oportunidade}
              onAlterada={(nova) => setAnotacoes((atual) => atual?.map((x) => (x.id === nova.id ? nova : x)) ?? null)}
              onExcluida={(id) => setAnotacoes((atual) => atual?.filter((x) => x.id !== id) ?? null)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
