import { useState, type ReactNode } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "./ui/sheet";

// Campo de busca por nome usado no topo das listagens.
export function CampoBusca({
  valor,
  onChange,
  placeholder,
  rotulo,
}: {
  valor: string;
  onChange: (valor: string) => void;
  placeholder: string;
  rotulo: string;
}) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="search"
        aria-label={rotulo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-3 py-2 bg-[#F5F5F5] rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
      />
    </div>
  );
}

// Um campo do painel: rótulo em cima, controle embaixo.
export function CampoFiltro({ id, rotulo, children }: { id: string; rotulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm text-gray-700">
        {rotulo}
      </label>
      {children}
    </div>
  );
}

export const classeControle =
  "w-full px-3 py-2 bg-[#F5F5F5] rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]";

/**
 * Botão "Filtros" com o número de filtros ativos e o painel lateral que os edita.
 * O painel trabalha num rascunho: nada muda na listagem até "Aplicar filtros".
 */
export default function FiltrosAvancados<T>({
  titulo,
  descricao,
  valores,
  vazio,
  ativos,
  onAplicar,
  children,
}: {
  titulo: string;
  descricao: string;
  valores: T; // filtros aplicados agora
  vazio: T; // filtros zerados ("Limpar")
  ativos: number;
  onAplicar: (valores: T) => void;
  children: (rascunho: T, alterar: (parcial: Partial<T>) => void) => ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<T>(valores);

  const abrir = () => {
    setRascunho(valores);
    setAberto(true);
  };
  const aplicar = (novos: T) => {
    onAplicar(novos);
    setAberto(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
          ativos ? "bg-[#1B4F8A]/10 text-[#1B4F8A]" : "bg-[#F5F5F5] text-gray-700"
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtros
        {ativos > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#1B4F8A] text-white text-xs flex items-center justify-center">
            {ativos}
          </span>
        )}
      </button>

      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent side="right" className="w-full sm:max-w-sm bg-white">
          <SheetHeader className="border-b border-gray-200">
            <SheetTitle className="text-gray-900">{titulo}</SheetTitle>
            <SheetDescription>{descricao}</SheetDescription>
          </SheetHeader>
          <form
            id="form-filtros"
            className="flex-1 overflow-y-auto px-4 grid gap-5 content-start"
            onSubmit={(e) => {
              e.preventDefault();
              aplicar(rascunho);
            }}
          >
            {children(rascunho, (parcial) => setRascunho((atual) => ({ ...atual, ...parcial })))}
          </form>
          <SheetFooter className="border-t border-gray-200 flex-row gap-3">
            <button
              type="button"
              onClick={() => aplicar(vazio)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Limpar
            </button>
            <button
              type="submit"
              form="form-filtros"
              className="flex-1 px-4 py-2 bg-[#1B4F8A] text-white rounded-lg text-sm hover:bg-[#153d6e]"
            >
              Aplicar filtros
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
