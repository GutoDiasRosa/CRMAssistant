import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CloudOff,
  Info,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  User,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { AnotacoesPanel } from "../components/Anotacoes";
import OportunidadeDialog from "../components/OportunidadeDialog";
import {
  api,
  formatarMoeda,
  rotuloStatus,
  type OportunidadeDetalhe,
  type OportunidadeEntrada,
  type OportunidadeSalva,
  type StatusOportunidade,
} from "../lib/api";

const COR_STATUS: Record<string, string> = {
  won: "bg-[#10B981]/10 text-[#047857]",
  lost: "bg-[#EF4444]/10 text-[#B91C1C]",
  paused: "bg-gray-100 text-gray-700",
};

// Corpo do PUT a partir do que já está salvo, trocando só o status.
function comStatus(op: OportunidadeDetalhe, status: StatusOportunidade): OportunidadeEntrada {
  return {
    nome: op.nome,
    valor: op.valor,
    etapa: op.etapa_funil,
    etapa_rd_id: op.rd_stage_id,
    status,
    usuario_id: op.responsavel?.id ?? null,
    contato: null, // sem contato no corpo, o atual é mantido
  };
}

function Campo({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#EBF2F9] rounded-full flex items-center justify-center flex-shrink-0">{icone}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{rotulo}</p>
        <p className="text-base text-gray-900 break-words">{valor}</p>
      </div>
    </div>
  );
}

export default function LeadDetailsScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [op, setOp] = useState<OportunidadeDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setErro(null);
    api
      .oportunidade(id)
      .then(setOp)
      .catch((e: Error) => setErro(e.message));
  }, [id]);

  const aposSalvar = ({ oportunidade, rd }: OportunidadeSalva) => {
    setOp(oportunidade);
    setAviso(
      rd.enviado
        ? { ok: true, texto: "Alterações salvas e enviadas ao RD Station." }
        : { ok: false, texto: rd.mensagem ?? "Alterações salvas." },
    );
  };

  const mudarStatus = async (status: StatusOportunidade) => {
    if (!op) return;
    setAviso(null);
    setSalvando(true);
    try {
      aposSalvar(await api.atualizarOportunidade(op.id, comStatus(op, status)));
    } catch (e) {
      setAviso({ ok: false, texto: (e as Error).message });
    } finally {
      setSalvando(false);
    }
  };

  const emAberto = !op || op.status === null || ["ongoing", "open", "paused"].includes(op.status);

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl text-gray-900 flex-1 truncate">{op?.nome ?? "Oportunidade"}</h1>
          {op && (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#1B4F8A] text-[#1B4F8A] rounded-lg text-sm hover:bg-[#EBF2F9] transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </header>

      {erro && (
        <p role="alert" className="p-6 lg:px-10 text-sm text-[#EF4444]">
          {erro}
        </p>
      )}
      {!erro && !op && <p className="p-6 lg:px-10 text-sm text-gray-500">Carregando...</p>}

      {op && (
        <div className="p-6 lg:p-10 space-y-6 max-w-6xl">
          {aviso && (
            <div
              role="status"
              className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                aviso.ok ? "bg-[#10B981]/10 text-[#047857]" : "bg-[#F59E0B]/10 text-[#92400E]"
              }`}
            >
              {aviso.ok ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <Info className="w-5 h-5 flex-shrink-0" />}
              <span>{aviso.texto}</span>
            </div>
          )}

          <div className="grid gap-6 lg:gap-10 lg:grid-cols-2 lg:items-start">
            {/* Negociação */}
            <section className="space-y-4">
              <h2 className="text-base text-gray-900">Negociação</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 bg-[#EBF2F9] px-4 py-2 rounded-full text-sm text-[#1B4F8A]">
                  <span className="w-2 h-2 bg-[#1B4F8A] rounded-full" />
                  {op.etapa_funil ?? "Sem etapa"}
                </span>
                <span
                  className={`px-4 py-2 rounded-full text-sm ${COR_STATUS[op.status ?? ""] ?? "bg-[#F59E0B]/10 text-[#92400E]"}`}
                >
                  {rotuloStatus(op.status)}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Valor</dt>
                  <dd className="text-base text-gray-900">{formatarMoeda(op.valor)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Responsável</dt>
                  <dd className="text-base text-gray-900">{op.responsavel?.nome ?? "—"}</dd>
                </div>
              </dl>
              <p className="flex items-center gap-2 text-xs text-gray-500">
                {op.rd_deal_id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" /> Sincronizada com o RD Station CRM
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3.5 h-3.5" /> Ainda não enviada ao RD Station (salve de novo para tentar)
                  </>
                )}
              </p>
              {emAberto && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => mudarStatus("won")}
                    disabled={salvando}
                    className="flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm hover:bg-[#059669] disabled:opacity-60"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Marcar como ganha
                  </button>
                  <button
                    onClick={() => mudarStatus("lost")}
                    disabled={salvando}
                    className="flex items-center gap-2 px-4 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg text-sm hover:bg-red-50 disabled:opacity-60"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Marcar como perdida
                  </button>
                </div>
              )}
              {!emAberto && (
                <button
                  onClick={() => mudarStatus("ongoing")}
                  disabled={salvando}
                  className="text-sm text-[#1B4F8A] hover:underline disabled:opacity-60"
                >
                  Reabrir oportunidade
                </button>
              )}
            </section>

            {/* Contato */}
            <section>
              <h2 className="text-base text-gray-900 mb-4">Dados do contato</h2>
              {op.contato ? (
                <div className="space-y-4">
                  <Campo icone={<User className="w-5 h-5 text-[#1B4F8A]" />} rotulo="Nome" valor={op.contato.nome || "—"} />
                  <Campo
                    icone={<Phone className="w-5 h-5 text-[#1B4F8A]" />}
                    rotulo="Telefone"
                    valor={op.contato.telefone ?? "—"}
                  />
                  <Campo icone={<Mail className="w-5 h-5 text-[#1B4F8A]" />} rotulo="E-mail" valor={op.contato.email ?? "—"} />
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhum contato vinculado. Use Editar para adicionar.</p>
              )}
            </section>

            {/* Anotações (agenda) da oportunidade */}
            <AnotacoesPanel oportunidadeId={op.id} />
          </div>
        </div>
      )}

      <OportunidadeDialog
        aberto={editando}
        onFechar={() => setEditando(false)}
        oportunidade={op}
        onSalva={aposSalvar}
      />

      {/* Botão Flutuante */}
      <div className="fixed bottom-24 right-4 lg:bottom-8 lg:right-10 z-10">
        <button
          onClick={() => navigate("/chat")}
          className="bg-[#1B4F8A] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-[#153d6e] transition-colors text-sm"
        >
          <MessageSquare className="w-5 h-5 flex-shrink-0" />
          <span className="whitespace-nowrap">Pedir resumo ao assistente</span>
        </button>
      </div>
    </div>
  );
}
