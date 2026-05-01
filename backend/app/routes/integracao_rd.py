from typing import Annotated
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.database import get_session
from app.db.models import RdStationToken, Usuario
from app.dependencies import get_current_user

router = APIRouter(prefix="/oauth/rd", tags=["rd-station"])


@router.get("/authorize", summary="Inicia fluxo OAuth2 RD Station (redireciona ao provedor)")
async def rd_authorize():
    s = get_settings()
    if not s.rd_client_id or not s.rd_redirect_uri:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Configure RD_CLIENT_ID e RD_REDIRECT_URI",
        )
    params = {
        "response_type": "code",
        "client_id": s.rd_client_id,
        "redirect_uri": s.rd_redirect_uri,
    }
    url = f"{s.rd_oauth_authorize_url}?{urlencode(params)}"
    return RedirectResponse(url, status_code=status.HTTP_302_FOUND)


@router.get("/callback", summary="Callback OAuth2 — troca code por tokens e persiste")
async def rd_callback(
    session: Annotated[AsyncSession, Depends(get_session)],
    code: str | None = Query(None),
    error: str | None = Query(None),
):
    if error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"RD OAuth error: {error}")
    if not code:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Parâmetro code ausente")
    s = get_settings()
    if not s.rd_client_secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "RD_CLIENT_SECRET não configurado")
    data = {
        "client_id": s.rd_client_id,
        "client_secret": s.rd_client_secret,
        "code": code,
        "redirect_uri": s.rd_redirect_uri,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            s.rd_oauth_token_url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if r.status_code >= 400:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"Falha ao obter token RD: {r.status_code} {r.text[:500]}",
        )
    payload = r.json()
    access = payload.get("access_token")
    if not access:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Resposta RD sem access_token")
    refresh = payload.get("refresh_token")
    expires_in = payload.get("expires_in")
    from datetime import UTC, datetime, timedelta

    expires_at = None
    if expires_in is not None:
        try:
            expires_at = datetime.now(UTC) + timedelta(seconds=int(expires_in))
        except (TypeError, ValueError):
            pass
    await session.execute(delete(RdStationToken))
    row = RdStationToken(access_token=access, refresh_token=refresh, expires_at=expires_at)
    session.add(row)
    await session.commit()
    return {"status": "ok", "message": "Tokens RD Station armazenados"}


@router.get("/status", summary="Indica se há token RD configurado (requer usuário autenticado)")
async def rd_status(
    session: Annotated[AsyncSession, Depends(get_session)],
    _: Annotated[Usuario, Depends(get_current_user)],
):
    r = await session.execute(select(RdStationToken.id).limit(1))
    return {"connected": r.scalar_one_or_none() is not None}
