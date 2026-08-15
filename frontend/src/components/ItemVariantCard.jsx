import React from 'react';
import { Shirt, Palette, MinusCircle, AlertTriangle } from 'lucide-react';
import { getStatusBadge } from '../utils/formatters';

export function ItemVariantCard({
  item,
  type = 'peca', // 'peca' | 'estampa'
  onDeduct,
}) {
  const isPeca = type === 'peca';
  const isLowStock = item.quantidade < 5;

  return (
    <div className="p-4 rounded-xl bg-dark-800/90 border border-slate-700/60 hover:border-slate-600 transition-colors flex flex-col justify-between gap-3 shadow-md">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono ${
              item.brand_slug === 'CR'
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
            }`}
          >
            {item.brand_name || item.brand_slug}
          </span>

          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            {isPeca ? <Shirt className="h-3.5 w-3.5 text-indigo-400" /> : <Palette className="h-3.5 w-3.5 text-rose-400" />}
            {isPeca ? 'Peça Pronta' : 'Estampa Avulsa'}
          </span>
        </div>

        {/* Design and SKU */}
        <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">
          {item.nome_design || `Design #${item.codigo_estampa}`}
        </h4>

        <div className="font-mono text-xs text-slate-300 bg-dark-900/80 px-2.5 py-1 rounded-lg border border-slate-800 mb-2.5 truncate">
          {item.sku || 'Sem SKU gerado'}
        </div>

        {/* Attributes Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-400">
          <div className="bg-slate-800/50 p-1.5 rounded">
            <span className="text-[10px] text-slate-500 block">Cor:</span>
            <span className="font-semibold text-slate-200">{item.cor || item.cor_nome}</span>
          </div>

          {isPeca && (
            <div className="bg-slate-800/50 p-1.5 rounded">
              <span className="text-[10px] text-slate-500 block">Tamanho / Tipo:</span>
              <span className="font-semibold text-slate-200">
                {item.tamanho} • {item.tipo_codigo}
              </span>
            </div>
          )}

          {!isPeca && (
            <div className="bg-slate-800/50 p-1.5 rounded">
              <span className="text-[10px] text-slate-500 block">Cód. Estampa:</span>
              <span className="font-semibold text-slate-200">#{item.codigo_estampa}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stock Footer & Action */}
      <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-lg font-black font-mono ${
              item.quantidade === 0
                ? 'text-rose-400'
                : isLowStock
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {item.quantidade}
          </span>
          <span className="text-[11px] text-slate-400">unidades</span>

          {isLowStock && item.quantidade > 0 && (
            <span title="Estoque baixo (< 5 unidades)">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={item.quantidade <= 0}
          onClick={() => onDeduct(item, type)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            item.quantidade > 0
              ? 'bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <MinusCircle className="h-3.5 w-3.5" />
          <span>Dar Baixa</span>
        </button>
      </div>
    </div>
  );
}
