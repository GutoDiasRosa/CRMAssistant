"""
Normaliza payloads do RD Station.
A API real pode variar — aceitamos chaves comuns e aninhamento genérico (`data`, `payload`).
"""

from typing import Any


def _pick(d: dict[str, Any], *keys: str) -> Any:
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return None


def extract_event_type(body: dict[str, Any]) -> str | None:
    return (
        _pick(body, "event_type", "eventType", "type")
        or _pick(body.get("data") or {}, "event_type", "eventType", "type")
        if isinstance(body.get("data"), dict)
        else None
    )


def extract_lead_dict(body: dict[str, Any]) -> dict[str, Any] | None:
    for key in ("lead", "Lead"):
        v = body.get(key)
        if isinstance(v, dict):
            return v
    data = body.get("data")
    if isinstance(data, dict):
        for key in ("lead", "Lead"):
            v = data.get(key)
            if isinstance(v, dict):
                return v
    if body.get("uuid") and (_pick(body, "email") or _pick(body, "name", "nome")):
        return body
    return None


def extract_deal_dict(body: dict[str, Any]) -> dict[str, Any] | None:
    for key in ("deal", "Deal", "oportunidade", "opportunity"):
        v = body.get(key)
        if isinstance(v, dict):
            return v
    data = body.get("data")
    if isinstance(data, dict):
        for key in ("deal", "Deal", "oportunidade", "opportunity"):
            v = data.get(key)
            if isinstance(v, dict):
                return v
    return None


def lead_rd_id(lead: dict[str, Any]) -> str | None:
    rid = _pick(lead, "uuid", "id", "lead_id", "lead_uuid", "_id")
    return str(rid) if rid is not None else None


def deal_rd_id(deal: dict[str, Any]) -> str | None:
    rid = _pick(deal, "uuid", "id", "deal_id", "opportunity_id", "_id")
    return str(rid) if rid is not None else None


def map_lead_fields(lead: dict[str, Any]) -> dict[str, Any]:
    return {
        "rd_lead_id": lead_rd_id(lead),
        "nome": str(_pick(lead, "name", "nome", "title") or "")[:512],
        "email": (_pick(lead, "email", "personal_email") or None),
        "telefone": (_pick(lead, "phone", "telefone", "mobile_phone") or None),
        "status": str(_pick(lead, "status", "lifecycle_stage") or "")[:128] or None,
        "dados_extras": lead,
    }


def map_deal_fields(deal: dict[str, Any]) -> dict[str, Any]:
    valor = _pick(deal, "value", "valor", "amount")
    try:
        valor_f = float(valor) if valor is not None else None
    except (TypeError, ValueError):
        valor_f = None
    etapa = _pick(deal, "deal_stage", "stage", "etapa_funil", "pipeline_stage")
    etapa_str = str(etapa)[:255] if etapa is not None else None
    return {
        "rd_deal_id": deal_rd_id(deal),
        "nome": str(_pick(deal, "name", "nome", "title") or "")[:512],
        "etapa_funil": etapa_str or None,
        "valor": valor_f,
        "status": str(_pick(deal, "status") or "")[:128] or None,
        "dados_extras": deal,
    }
