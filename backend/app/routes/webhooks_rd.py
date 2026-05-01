import json
import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status
from app.core.rd_station_sync.process import process_rd_webhook_payload
from app.core.rd_station_sync.webhook_auth import verify_webhook_secret, verify_signature_body
from app.db.database import async_session_factory

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


async def _run_webhook_sync(body: dict) -> None:
    async with async_session_factory() as session:
        try:
            async with session.begin():
                await process_rd_webhook_payload(session, body)
        except Exception:
            logger.exception("webhook_rd process failed")
            raise


@router.post(
    "/rd-station",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Webhook RD Station — conversão / atualização de leads e oportunidades",
)
async def rd_station_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
):
    raw = await request.body()
    secret_hdr = request.headers.get("X-Webhook-Secret") or request.headers.get("x-webhook-secret")
    sig_hdr = request.headers.get("X-RD-Signature") or request.headers.get("x-rd-signature")
    if not verify_webhook_secret(secret_hdr):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Webhook secret inválido")
    if not verify_signature_body(raw, sig_hdr):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Assinatura inválida")

    try:
        body = json.loads(raw.decode("utf-8") or "{}")
    except json.JSONDecodeError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "JSON inválido") from e
    if not isinstance(body, dict):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Corpo deve ser objeto JSON")

    background_tasks.add_task(_run_webhook_sync, body)
    return {"status": "accepted", "message": "Sincronização agendada em background"}
