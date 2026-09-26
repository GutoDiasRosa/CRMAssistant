"""Classificação leve de intenção (substituível por LLM depois)."""

INTENTS = (
    "resumo_lead",
    "indicadores_grafico",
    "performance_time",
    "relatorio_periodo",
    "consulta_funil",
    "cumprimento",
    "fora_de_escopo",
)


def classify_intent(mensagem: str) -> str:
    t = mensagem.lower().strip()
    if any(x in t for x in ("oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "hey")):
        return "cumprimento"
    if any(x in t for x in ("funil", "kanban", "etapa", "pipeline")):
        return "consulta_funil"
    if any(x in t for x in ("resumo", "lead", "contato")):
        return "resumo_lead"
    if any(x in t for x in ("gráfico", "grafico", "indicador", "métrica", "metrica")):
        return "indicadores_grafico"
    if any(x in t for x in ("time", "equipe", "vendedor", "performance")):
        return "performance_time"
    if any(x in t for x in ("relatório", "relatorio", "mês", "mes", "período", "periodo")):
        return "relatorio_periodo"
    if len(t) < 2:
        return "cumprimento"
    return "fora_de_escopo"
