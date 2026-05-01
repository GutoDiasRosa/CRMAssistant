from uuid import UUID, uuid4

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_anthropic import ChatAnthropic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.agents.intent_router_crm import classify_intent
from app.db.models import ConversaChatbot, Mensagem, Usuario
from app.domain.repositories.crm import OportunidadeRepository


class CrmAssistantOrchestratorService:
    def __init__(self, session: AsyncSession, usuario: Usuario):
        self.session = session
        self.usuario = usuario

    async def _get_or_create_conversa(self, session_id: str | None) -> ConversaChatbot:
        if session_id:
            try:
                cid = UUID(session_id)
            except ValueError:
                cid = None
            if cid:
                r = await self.session.execute(
                    select(ConversaChatbot).where(
                        ConversaChatbot.id == cid,
                        ConversaChatbot.usuario_id == self.usuario.id,
                    )
                )
                found = r.scalar_one_or_none()
                if found:
                    return found
        conv = ConversaChatbot(id=uuid4(), usuario_id=self.usuario.id, titulo=None)
        self.session.add(conv)
        await self.session.flush()
        return conv

    def _fallback_reply(self, intent: str, contexto: str) -> str:
        if intent == "cumprimento":
            return "Olá! Sou o assistente do CRM. Posso ajudar com funil, leads, performance do time e relatórios."
        if intent == "consulta_funil":
            return (
                "Para ver o funil, use o endpoint GET /api/crm/kanban com seu token. "
                f"Resumo rápido: {contexto}"
            )
        if intent == "fora_de_escopo":
            return "Esse assunto está fora do escopo do assistente de vendas e CRM. Posso ajudar com dados do RD Station sincronizados aqui."
        return (
            f"(Modo sem chave de IA) Intenção detectada: {intent}. Contexto numérico: {contexto}. "
            "Configure ANTHROPIC_API_KEY para respostas em linguagem natural completas."
        )

    async def handle_chat(self, mensagem: str, session_id: str | None) -> dict:
        conv = await self._get_or_create_conversa(session_id)
        self.session.add(
            Mensagem(conversa_id=conv.id, papel="user", conteudo=mensagem),
        )
        await self.session.flush()

        intent = classify_intent(mensagem)
        op_repo = OportunidadeRepository(self.session, self.usuario)
        lead_repo = LeadRepository(self.session, self.usuario)
        metrics = await op_repo.metricas_resumo()
        kanban = await op_repo.kanban_por_etapa()
        n_etapas = len(kanban)
        contexto = f"leads={metrics['total_leads']}, oportunidades={metrics['total_oportunidades']}, etapas_funil={n_etapas}"

        settings = get_settings()
        reply: str
        if settings.anthropic_api_key:
            try:
                llm = ChatAnthropic(
                    api_key=settings.anthropic_api_key,
                    model=settings.anthropic_model,
                    max_tokens=1024,
                )
                sys = SystemMessage(
                    content=(
                        "Você é o assistente de CRM em português do Brasil. "
                        "Use linguagem simples, sem jargão técnico. "
                        f"Intenção detectada: {intent}. "
                        f"Dados agregados do usuário (respeitando permissão): {contexto}. "
                        "Não invente números; se precisar de detalhes não presentes, diga que pode consultar o kanban na API."
                    )
                )
                msg = HumanMessage(content=mensagem)
                out = await llm.ainvoke([sys, msg])
                reply = out.content if isinstance(out, AIMessage) else str(out)
            except Exception:
                reply = self._fallback_reply(intent, contexto)
        else:
            reply = self._fallback_reply(intent, contexto)

        self.session.add(Mensagem(conversa_id=conv.id, papel="assistant", conteudo=reply))
        await self.session.commit()
        return {
            "detected_intent": intent,
            "response_text": reply,
            "sessionId": str(conv.id),
        }
