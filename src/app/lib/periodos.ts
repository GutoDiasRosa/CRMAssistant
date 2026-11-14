// Períodos compartilhados entre telas: oportunidades em aberto contam pela data de criação;
// ganhas e perdidas, pela data de fechamento.
export const PERIODOS = [
  { id: "todos", label: "Todo o período" },
  { id: "7d", label: "Últimos 7 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "90d", label: "Últimos 90 dias" },
  { id: "mes", label: "Este mês" },
  { id: "ano", label: "Este ano" },
] as const;

export type PeriodoId = (typeof PERIODOS)[number]["id"];

export function ehPeriodo(valor: string | null): valor is PeriodoId {
  return PERIODOS.some((p) => p.id === valor);
}

// Início do período à meia-noite do horário local, em ISO (a API compara com fuso).
export function inicioDoPeriodo(periodo: PeriodoId): string | undefined {
  const hoje = new Date();
  const [ano, mes, dia] = [hoje.getFullYear(), hoje.getMonth(), hoje.getDate()];
  const meiaNoite = (a: number, m: number, d: number) => new Date(a, m, d).toISOString();
  switch (periodo) {
    case "7d":
      return meiaNoite(ano, mes, dia - 6);
    case "30d":
      return meiaNoite(ano, mes, dia - 29);
    case "90d":
      return meiaNoite(ano, mes, dia - 89);
    case "mes":
      return meiaNoite(ano, mes, 1);
    case "ano":
      return meiaNoite(ano, 0, 1);
    default:
      return undefined;
  }
}
