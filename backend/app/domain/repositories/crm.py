from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Lead, Oportunidade, Usuario
from app.dependencies import pode_ver_todos_oportunidades


class LeadRepository:
    def __init__(self, session: AsyncSession, usuario: Usuario):
        self.session = session
        self.usuario = usuario

    def _scoped_filter(self, stmt):
        if pode_ver_todos_oportunidades(self.usuario):
            return stmt
        return stmt.where(Lead.usuario_id == self.usuario.id)

    async def list_leads(self, limit: int = 100) -> list[Lead]:
        stmt = self._scoped_filter(select(Lead).order_by(Lead.updated_at.desc()).limit(limit))
        r = await self.session.execute(stmt)
        return list(r.scalars().all())

    async def get_by_rd_id(self, rd_lead_id: str) -> Lead | None:
        stmt = select(Lead).where(Lead.rd_lead_id == rd_lead_id)
        if not pode_ver_todos_oportunidades(self.usuario):
            stmt = stmt.where(Lead.usuario_id == self.usuario.id)
        r = await self.session.execute(stmt)
        return r.scalar_one_or_none()


class OportunidadeRepository:
    def __init__(self, session: AsyncSession, usuario: Usuario):
        self.session = session
        self.usuario = usuario

    def _scoped_filter(self, stmt):
        if pode_ver_todos_oportunidades(self.usuario):
            return stmt
        return stmt.where(Oportunidade.usuario_id == self.usuario.id)

    async def list_oportunidades(self, limit: int = 500) -> list[Oportunidade]:
        stmt = self._scoped_filter(
            select(Oportunidade).order_by(Oportunidade.updated_at.desc()).limit(limit)
        )
        r = await self.session.execute(stmt)
        return list(r.scalars().all())

    async def kanban_por_etapa(self) -> dict[str, list[dict]]:
        """Agrupa oportunidades por etapa_funil para UI kanban (RF04)."""
        oportunidades = await self.list_oportunidades()
        buckets: dict[str, list[dict]] = {}
        for op in oportunidades:
            etapa = op.etapa_funil or "Sem etapa"
            buckets.setdefault(etapa, []).append(
                {
                    "id": str(op.id),
                    "rd_deal_id": op.rd_deal_id,
                    "nome": op.nome,
                    "valor": float(op.valor) if op.valor is not None else None,
                    "status": op.status,
                    "usuario_id": str(op.usuario_id) if op.usuario_id else None,
                    "lead_id": str(op.lead_id) if op.lead_id else None,
                }
            )
        return buckets

    async def metricas_resumo(self) -> dict:
        """Contagens agregadas respeitando RF07."""
        base_leads = select(func.count()).select_from(Lead)
        base_ops = select(func.count()).select_from(Oportunidade)
        if not pode_ver_todos_oportunidades(self.usuario):
            base_leads = base_leads.where(Lead.usuario_id == self.usuario.id)
            base_ops = base_ops.where(Oportunidade.usuario_id == self.usuario.id)
        n_leads = (await self.session.execute(base_leads)).scalar_one()
        n_ops = (await self.session.execute(base_ops)).scalar_one()
        return {"total_leads": int(n_leads), "total_oportunidades": int(n_ops)}
