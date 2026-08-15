import React from 'react';
import { Palette, Info } from 'lucide-react';

export function FormularioEstampaFields() {
  return (
    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
      <Info className="h-4 w-4 shrink-0 mt-0.5" />
      <p>
        Estampas avulsas representam as impressões prontas para aplicação em qualquer peça lisa do catálogo.
      </p>
    </div>
  );
}
