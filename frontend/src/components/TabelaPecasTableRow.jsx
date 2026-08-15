import React from 'react';
import { Edit, MinusCircle, Trash2 } from 'lucide-react';

export function TabelaPecasTableRow({
  item,
  onOpenDeduct,
  onOpenEdit,
  onDelete,
}) {
  return (
    <tr
      data-testid={`row-peca-${item.id}`}
      className="hover:bg-slate-800/40 transition-colors group"
    >
      {/* SKU */}
      <td className="px-4 py-3 font-mono font-semibold text-slate-200">
        <span className="px-2 py-1 rounded-md bg-dark-900 border border-slate-800 text-xs">
          {item.sku}
        </span>
      </td>

      {/* Brand */}
      <td className="px-4 py-3">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${
            item.brand_slug === 'CR'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
          }`}
        >
          {item.brand_slug}
        </span>
      </td>

      {/* Design */}
      <td className="px-4 py-3">
        <div className="font-medium text-white">{item.nome_design}</div>
        <div className="text-[10px] text-slate-400 font-mono">Cód #{item.codigo_estampa}</div>
      </td>

      {/* Tipo */}
      <td className="px-4 py-3 font-mono text-slate-300">
        {item.tipo_codigo}
      </td>

      {/* Cor */}
      <td className="px-4 py-3">
        <span className="font-medium text-slate-200">{item.cor}</span>
      </td>

      {/* Tamanho */}
      <td className="px-4 py-3 font-mono font-bold text-slate-300">
        {item.tamanho}
      </td>

      {/* Quantidade */}
      <td className="px-4 py-3 text-right">
        <span
          className={`font-mono font-bold text-sm ${
            item.quantidade === 0
              ? 'text-rose-400'
              : item.quantidade < 5
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}
        >
          {item.quantidade}
        </span>
        <span className="text-[10px] text-slate-500 ml-1">un</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            title="Dar baixa no estoque"
            aria-label={`Dar baixa no item ${item.sku}`}
            disabled={item.quantidade <= 0}
            onClick={() => onOpenDeduct(item, 'peca')}
            className={`p-1.5 rounded-lg border transition-colors ${
              item.quantidade > 0
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500 hover:text-white'
                : 'bg-slate-800 text-slate-600 border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <MinusCircle className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Editar item"
            aria-label={`Editar item ${item.sku}`}
            onClick={() => onOpenEdit(item, 'peca')}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Excluir item"
            aria-label={`Excluir item ${item.sku}`}
            onClick={() => {
              if (window.confirm(`Deseja realmente excluir ${item.sku}?`)) {
                onDelete(item.id, 'peca');
              }
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-rose-600 hover:text-white transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
