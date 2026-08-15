import React from 'react';

export function FormularioPecaFields({
  formData,
  onChange,
  tipos = [],
  tamanhos = [],
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Tipo Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-200">
          Tipo da Peça *
        </label>
        <select
          data-testid="select-tipo"
          value={formData.tipo_id || ''}
          onChange={(e) => onChange('tipo_id', e.target.value)}
          required
          className="w-full px-3 py-2 bg-dark-900 text-white rounded-xl border border-slate-700 text-xs focus:border-rose-500 focus:outline-none"
        >
          <option value="">Selecione o Tipo...</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.codigo} - {t.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Tamanho Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-200">
          Tamanho *
        </label>
        <select
          data-testid="select-tamanho"
          value={formData.tamanho_id || ''}
          onChange={(e) => onChange('tamanho_id', e.target.value)}
          required
          className="w-full px-3 py-2 bg-dark-900 text-white rounded-xl border border-slate-700 text-xs focus:border-rose-500 focus:outline-none"
        >
          <option value="">Selecione o Tamanho...</option>
          {tamanhos.map((tam) => (
            <option key={tam.id} value={tam.id}>
              {tam.tamanho}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
