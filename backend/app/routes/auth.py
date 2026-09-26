from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.db.models import (
    ConversaChatbot,
    Interacao,
    Lead,
    Mensagem,
    Oportunidade,
    Relatorio,
    Usuario,
)
from app.dependencies import get_current_user
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    nome: str = Field(min_length=1, max_length=255)
    perfil: str = Field(default="SDR", pattern="^(SDR|CLOSER|GERENTE|DIRETOR|ANALISTA)$")


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterBody, session: Annotated[AsyncSession, Depends(get_session)]):
    exists = await session.execute(select(Usuario.id).where(Usuario.email == body.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "E-mail já cadastrado")
    user = Usuario(
        email=body.email,
        hashed_password=hash_password(body.password),
        nome=body.nome,
        perfil=body.perfil,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    token = create_access_token(str(user.id), extra={"perfil": user.perfil})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginBody, session: Annotated[AsyncSession, Depends(get_session)]):
    r = await session.execute(select(Usuario).where(Usuario.email == body.email))
    user = r.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciais inválidas")
    if not user.ativo:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Usuário inativo")
    token = create_access_token(str(user.id), extra={"perfil": user.perfil})
    return TokenResponse(access_token=token)


@router.delete(
    "/me/lgpd",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="LGPD — remove o usuário autenticado, conversas e desvincula leads/oportunidades",
)
async def lgpd_delete_me(
    session: Annotated[AsyncSession, Depends(get_session)],
    current: Annotated[Usuario, Depends(get_current_user)],
):
    uid = current.id
    conv_subq = select(ConversaChatbot.id).where(ConversaChatbot.usuario_id == uid)
    await session.execute(delete(Mensagem).where(Mensagem.conversa_id.in_(conv_subq)))
    await session.execute(delete(ConversaChatbot).where(ConversaChatbot.usuario_id == uid))
    await session.execute(delete(Relatorio).where(Relatorio.usuario_id == uid))
    await session.execute(update(Lead).where(Lead.usuario_id == uid).values(usuario_id=None))
    await session.execute(update(Oportunidade).where(Oportunidade.usuario_id == uid).values(usuario_id=None))
    await session.execute(delete(Interacao).where(Interacao.usuario_id == uid))
    await session.execute(delete(Usuario).where(Usuario.id == uid))
    await session.commit()
