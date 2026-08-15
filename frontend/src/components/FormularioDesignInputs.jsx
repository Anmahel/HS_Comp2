import React from 'react';
import { Lock } from 'lucide-react';

export function FormularioDesignInputs({
  codigoEstampa,
  nomeDesign,
  existingDesign,
  onCodeChange,
  onNameChange,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Cód. Estampa: Always Editable */}
      <div className="space-y-1.5">
        <label htmlFor="form-codigo-estampa" className="block text-xs font-semibold text-slate-200">
          Cód. Estampa *
        </label>
        <input
          id="form-codigo-estampa"
          type="text"
          data-testid="input-codigo-estampa"
          aria-label="Código da Estampa"
          value={codigoEstampa}
          onChange={onCodeChange}
          placeholder="Ex: 001, 002..."
          required
          className="w-full px-3 py-2 bg-dark-900 text-white font-mono rounded-xl border border-slate-700 text-xs focus:border-rose-500 focus:outline-none"
        />
      </div>

      {/* Nome do Design: Conditionally Disabled if Code Exists */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="form-nome-design" className="block text-xs font-semibold text-slate-200">
            Nome do Design *
          </label>
          {existingDesign && (
            <span
              data-testid="badge-design-registrado"
              className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 flex items-center gap-1"
            >
              <Lock className="h-2.5 w-2.5" />
              Registrado
            </span>
          )}
        </div>
        <input
          id="form-nome-design"
          type="text"
          data-testid="input-nome-design"
          aria-label="Nome do Design"
          disabled={Boolean(existingDesign)}
          value={nomeDesign}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={existingDesign ? existingDesign.nome_design : 'Digite o nome do design...'}
          required
          className={`w-full px-3 py-2 bg-dark-900 text-white rounded-xl border border-slate-700 text-xs focus:border-rose-500 focus:outline-none ${
            existingDesign ? 'opacity-60 cursor-not-allowed bg-slate-900' : ''
          }`}
        />
      </div>
    </div>
  );
}
