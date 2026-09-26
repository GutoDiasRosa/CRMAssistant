from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.db.models import Usuario
from app.dependencies import get_current_user
from app.services.crm_assistant_orchestrator_service import CrmAssistantOrchestratorService

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    mensagem: str = Field(min_length=1, max_length=8000)
    sessionId: str | None = None


class ChatResponse(BaseModel):
    detected_intent: str
    response_text: str
    sessionId: str


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[Usuario, Depends(get_current_user)],
):
    svc = CrmAssistantOrchestratorService(session, user)
    out = await svc.handle_chat(body.mensagem, body.sessionId)
    return ChatResponse(**out)
