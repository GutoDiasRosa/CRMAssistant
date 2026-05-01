from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.db.models import Usuario
from app.dependencies import get_current_user
from app.domain.repositories.crm import OportunidadeRepository

router = APIRouter(prefix="/api/crm", tags=["crm"])


@router.get("/kanban", summary="Funil kanban (oportunidades por etapa, RF04 + RF07)")
async def kanban(
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[Usuario, Depends(get_current_user)],
):
    repo = OportunidadeRepository(session, user)
    return await repo.kanban_por_etapa()


@router.get("/metricas", summary="Resumo numérico (RF07)")
async def metricas(
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[Usuario, Depends(get_current_user)],
):
    repo = OportunidadeRepository(session, user)
    return await repo.metricas_resumo()
