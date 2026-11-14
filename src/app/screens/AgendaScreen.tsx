import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router";
import { AnotacaoItem, formatarDia, hojeLocal } from "../components/Anotacoes";
import { useUsuario } from "../components/RequireAuth";
import { api, PERFIS_VISAO_TOTAL, type Anotacao, type Vendedor } from "../lib/api";

const EU = "eu";
const TODOS = "todos";

// Soma dias a uma data AAAA-MM-DD sem passar por fuso horário.
function somarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

// Início do dia no horário local, em ISO (o banco guarda em UTC).
const inicioLocal = (dia: string) => new Date(`${dia}T00:00:00`).toISOString();

export default function AgendaScreen() {
  const usuario = useUsuario();
  const veTodoTime = PERFIS_VISAO_TOTAL.includes(usuario.perfil);
  const [searchParams, setSearchParams] = useSearchParams();
  const hoje = hojeLocal();
  const diaUrl = searchParams.get("dia");
  const dia = diaUrl && /^\d{4}-\d{2}-\d{2}$/.test(diaUrl) ? diaUrl : hoje;
  const quem = (veTodoTime && searchParams.get("quem")) || EU;
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [retornos, setRetornos] = useState<Anotacao[] | null>(null);
  const [doDia, setDoDia] = useState<Anotacao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const setParam = (chave: "dia" | "quem", valor: string | null) =>
    setSearchParams(
      (atual) => {
        const novo = new URLSearchParams(atual);
        if (valor === null) novo.delete(chave);
        else novo.set(chave, valor);
        return novo;
      },
      { replace: true },
    );
  const irPara = (novoDia: string) => setParam("dia", novoDia === hoje ? null : novoDia);

  useEffect(() => {
    if (veTodoTime) api.vendedores().then(setVendedores).catch(() => setVendedores([]));
  }, [veTodoTime]);

  useEffect(() => {
    let cancelado = false;
    setErro(null);
    setRetornos(null);
    setDoDia(null);
    // SDR/Closer já recebem só a própria carteira (RF07); quem vê o time escolhe de quem é a agenda.
    const autor = !veTodoTime ? undefined : quem === EU ? usuario.id : quem === TODOS ? undefined : quem;
    Promise.all([
      // Hoje inclui os retornos atrasados; outros dias, só os daquele dia.
      api.retornos({ ate: dia, de: dia === hoje ? undefined : dia, usuario_id: autor }),
      api.anotacoes({ inicio: inicioLocal(dia), fim: inicioLocal(somarDias(dia, 1)), usuario_id: autor }),
    ])
      .then(([r, a]) => {
        if (cancelado) return;
        setRetornos(r);
        setDoDia(a);
      })
      .catch((e: Error) => !cancelado && setErro(e.message));
    return () => {
      cancelado = true;
    };
  }, [dia, quem, hoje, usuario.id, veTodoTime]);

  const alterar = (nova: Anotacao) => {
    // "Retorno feito" tira a anotação da lista de retornos.
    setRetornos((atual) => atual?.filter((x) => x.id !== nova.id || nova.retorno_em) ?? null);
    setDoDia((atual) => atual?.map((x) => (x.id === nova.id ? nova : x)) ?? null);
  };
  const excluir = (id: string) => {
    setRetornos((atual) => atual?.filter((x) => x.id !== id) ?? null);
    setDoDia((atual) => atual?.filter((x) => x.id !== id) ?? null);
  };

  const titulo =
    dia === hoje
      ? "Hoje"
      : new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10 md:flex md:items-center md:justify-between gap-4">
        <h1 className="text-xl text-gray-900 mb-3 md:mb-0">Agenda</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => irPara(somarDias(dia, -1))}
            aria-label="Dia anterior"
            className="p-2 rounded-lg bg-[#F5F5F5] hover:bg-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            aria-label="Dia"
            value={dia}
            onChange={(e) => e.target.value && irPara(e.target.value)}
            className="px-3 py-2 bg-[#F5F5F5] rounded-lg text-sm"
          />
          <button
            onClick={() => irPara(somarDias(dia, 1))}
            aria-label="Próximo dia"
            className="p-2 rounded-lg bg-[#F5F5F5] hover:bg-gray-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {dia !== hoje && (
            <button onClick={() => irPara(hoje)} className="text-sm text-[#1B4F8A] hover:underline px-2">
              Hoje
            </button>
          )}
          {veTodoTime && (
            <select
              aria-label="Agenda de quem"
              value={quem}
              onChange={(e) => setParam("quem", e.target.value === EU ? null : e.target.value)}
              className="px-3 py-2 bg-[#F5F5F5] rounded-lg text-sm text-gray-700 max-w-[14rem]"
            >
              <option value={EU}>Minha agenda</option>
              <option value={TODOS}>Todo o time</option>
              {vendedores
                .filter((v) => v.id !== usuario.id)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
            </select>
          )}
        </div>
      </header>

      <div className="p-6 lg:p-10 max-w-4xl space-y-8">
        <p className="text-base text-gray-900 first-letter:uppercase">{titulo}</p>
        {erro && (
          <p role="alert" className="text-sm text-[#EF4444]">
            {erro}
          </p>
        )}

        <section className="space-y-3">
          <h2 className="text-base text-gray-900">
            Retornos {dia === hoje ? "para hoje e atrasados" : `para ${formatarDia(dia)}`}
          </h2>
          {retornos === null && !erro && <p className="text-sm text-gray-500">Carregando...</p>}
          {retornos?.length === 0 && <p className="text-sm text-gray-500">Nenhum retorno agendado.</p>}
          {!!retornos?.length && (
            <ul className="space-y-3">
              {retornos.map((a) => (
                <AnotacaoItem key={a.id} anotacao={a} mostrarCliente onAlterada={alterar} onExcluida={excluir} />
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-base text-gray-900">Anotações do dia</h2>
          {doDia === null && !erro && <p className="text-sm text-gray-500">Carregando...</p>}
          {doDia?.length === 0 && (
            <p className="text-sm text-gray-500">
              Nenhuma anotação neste dia. Registre contatos na tela de cada lead ou oportunidade.
            </p>
          )}
          {!!doDia?.length && (
            <ul className="space-y-3">
              {doDia.map((a) => (
                <AnotacaoItem key={a.id} anotacao={a} mostrarCliente onAlterada={alterar} onExcluida={excluir} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
