import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, CloudOff, Info, Mail, Pencil, Phone, Plus, RefreshCw, User } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import LeadDialog from "../components/LeadDialog";
import OportunidadeDialog from "../components/OportunidadeDialog";
import { api, formatarMoeda, rotuloStatus, type LeadDetalhe } from "../lib/api";

type Aviso = { ok: boolean; texto: string };

export default function LeadScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [lead, setLead] = useState<LeadDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [novaOportunidade, setNovaOportunidade] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const carregar = () => {
    if (!id) return;
    api
      .lead(id)
      .then(setLead)
      .catch((e: Error) => setErro(e.message));
  };

  useEffect(carregar, [id]);

  const avisoEnvio = (rd: { enviado: boolean; mensagem: string | null }, ok: string) =>
    setAviso(rd.enviado ? { ok: true, texto: ok } : { ok: false, texto: rd.mensagem ?? "Salvo." });

  return (
    <div className="min-h-screen bg-white pb-20 lg:pb-8">
      <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl text-gray-900 flex-1 truncate">{lead?.nome || "Lead"}</h1>
          {lead && (
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
      {!erro && !lead && <p className="p-6 lg:px-10 text-sm text-gray-500">Carregando...</p>}

      {lead && (
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
            <section className="space-y-4">
              <h2 className="text-base text-gray-900">Dados do contato</h2>
              {[
                { icone: User, rotulo: "Responsável", valor: lead.responsavel?.nome ?? "Sem responsável" },
                { icone: Mail, rotulo: "E-mail", valor: lead.email ?? "—" },
                { icone: Phone, rotulo: "Telefone", valor: lead.telefone ?? "—" },
              ].map(({ icone: Icone, rotulo, valor }) => (
                <div key={rotulo} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#EBF2F9] rounded-full flex items-center justify-center flex-shrink-0">
                    <Icone className="w-5 h-5 text-[#1B4F8A]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">{rotulo}</p>
                    <p className="text-base text-gray-900 break-words">{valor}</p>
                  </div>
                </div>
              ))}
              <p className="flex items-center gap-2 text-xs text-gray-500">
                {lead.sincronizado ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" /> Sincronizado com o RD Station CRM
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3.5 h-3.5" /> Ainda não enviado ao RD Station (salve de novo para tentar)
                  </>
                )}
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base text-gray-900">Oportunidades</h2>
                <button
                  onClick={() => setNovaOportunidade(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm hover:bg-[#153d6e]"
                >
                  <Plus className="w-4 h-4" />
                  Nova oportunidade
                </button>
              </div>
              {lead.oportunidades.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma oportunidade para este lead.</p>
              ) : (
                <ul className="space-y-3">
                  {lead.oportunidades.map((op) => (
                    <li key={op.id}>
                      <button
                        onClick={() => navigate(`/lead/${op.id}`)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-base text-gray-900 truncate">{op.nome}</p>
                            <p className="text-sm text-gray-500">
                              {op.etapa_funil ?? "Sem etapa"} · {rotuloStatus(op.status)}
                            </p>
                          </div>
                          <span className="text-sm text-[#1B4F8A] flex-shrink-0">{formatarMoeda(op.valor)}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      <LeadDialog
        aberto={editando}
        onFechar={() => setEditando(false)}
        lead={lead}
        onSalvo={({ lead: salvo, rd }) => {
          setLead(salvo);
          avisoEnvio(rd, "Alterações salvas e enviadas ao RD Station.");
        }}
      />
      <OportunidadeDialog
        aberto={novaOportunidade}
        onFechar={() => setNovaOportunidade(false)}
        leadInicial={lead}
        onSalva={({ rd }) => {
          carregar();
          avisoEnvio(rd, "Oportunidade criada e enviada ao RD Station.");
        }}
      />
    </div>
  );
}
