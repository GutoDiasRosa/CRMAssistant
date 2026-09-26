import hmac
import hashlib

from app.config import get_settings


def verify_webhook_secret(header_secret: str | None) -> bool:
    """Se RD_WEBHOOK_SECRET estiver vazio, aceita qualquer chamada (apenas dev)."""
    settings = get_settings()
    expected = (settings.rd_webhook_secret or "").strip()
    if not expected:
        return True
    if not header_secret:
        return False
    return hmac.compare_digest(header_secret.strip(), expected)


def verify_signature_body(raw_body: bytes, signature_header: str | None) -> bool:
    """
    Opcional: HMAC-SHA256 em hex no header (padrão comum em webhooks).
    Só valida se RD_WEBHOOK_SECRET estiver definido e o header vier preenchido.
    """
    settings = get_settings()
    secret = (settings.rd_webhook_secret or "").encode()
    if not secret or not signature_header:
        return True
    try:
        digest = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(digest, signature_header.strip().lower())
    except Exception:
        return False
