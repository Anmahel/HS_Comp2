import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, AlertCircle, Shirt, Palette } from 'lucide-react';
import { generateSku } from '../utils/sku';
import { FormularioPecaFields } from './FormularioPecaFields';
import { FormularioEstampaFields } from './FormularioEstampaFields';
import { FormularioDesignInputs } from './FormularioDesignInputs';
import { ConfirmacaoEstoqueModal } from './ConfirmacaoEstoqueModal';

export function FormularioEstoqueModal({
  isOpen,
  category = 'peca', // 'peca' | 'estampa'
  itemToEdit = null,
  catalogs = {},
  onClose,
  onSave,
}) {
  const isEditing = Boolean(itemToEdit);
  const { brands = [], cores = [], designs = [], tamanhos = [], tipos = [] } = catalogs;

  const initialFormData = useMemo(() => {
    if (itemToEdit) {
      return {
        categoria: category,
        brand_id: itemToEdit.brand_id || '',
        codigo_estampa: itemToEdit.codigo_estampa || '',
        nome_design: itemToEdit.nome_design || '',
        cor_id: itemToEdit.cor_id || '',
        tipo_id: itemToEdit.tipo_id || '',
        tamanho_id: itemToEdit.tamanho_id || '',
        quantidade: itemToEdit.quantidade || 0,
      };
    }
    return {
      categoria: category,
      brand_id: brands[0]?.id || '',
      codigo_estampa: '',
      nome_design: '',
      cor_id: cores[0]?.id || '',
      tipo_id: tipos[0]?.id || '',
      tamanho_id: tamanhos[0]?.id || '',
      quantidade: 1,
    };
  }, [itemToEdit, category, brands, cores, tipos, tamanhos]);

  const [formData, setFormData] = useState(initialFormData);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reactive Design Code Check
  // Rule: If Cód. Estampa matches an existing design, lock Nome do Design & auto-populate
  const existingDesign = useMemo(() => {
    const cod = String(formData.codigo_estampa || '').trim();
    if (!cod) return null;
    return designs.find((d) => String(d.codigo_estampa).trim() === cod);
  }, [formData.codigo_estampa, designs]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDesignCodeChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const match = designs.find((d) => String(d.codigo_estampa).trim() === String(val).trim());
      return {
        ...prev,
        codigo_estampa: val,
        nome_design: match ? match.nome_design : prev.nome_design,
      };
    });
  };

  // Generated SKU Live Preview
  const currentGeneratedSku = generateSku(formData, catalogs);

  // Summary Data for confirmation dialog
  const summaryData = {
    brandName: brands.find((b) => String(b.id) === String(formData.brand_id))?.name || 'Não selecionada',
    codigoEstampa: formData.codigo_estampa || '---',
    designName: formData.nome_design || 'Novo Design',
    corName: cores.find((c) => String(c.id) === String(formData.cor_id))?.nome || 'Não selecionada',
    tipoName: tipos.find((t) => String(t.id) === String(formData.tipo_id))?.nome,
    tamanhoName: tamanhos.find((tam) => String(tam.id) === String(formData.tamanho_id))?.tamanho,
    quantidade: formData.quantidade,
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!formData.brand_id || !formData.codigo_estampa || !formData.cor_id) return;
    if (category === 'peca' && (!formData.tipo_id || !formData.tamanho_id)) return;

    setIsConfirmOpen(true);
  };

  const handleFinalSubmit = async () => {
    try {
      setSubmitting(true);
      const success = await onSave(formData);
      if (success) {
        setIsConfirmOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-lg bg-dark-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-dark-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white shadow-md">
                {category === 'peca' ? <Shirt className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isEditing ? 'Editar Item do Estoque' : 'Cadastrar Novo Item no Estoque'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {category === 'peca' ? 'Peça Pronta Finalizada' : 'Estampa Avulsa para Produção'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar formulário"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handlePreSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Live SKU Preview Badge */}
            <div className="p-3 rounded-xl bg-dark-900 border border-slate-700/80 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">SKU Gerado:</span>
              <span className="font-mono font-bold text-xs text-rose-400 bg-dark-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {currentGeneratedSku}
              </span>
            </div>

            {/* Brand Modification Guard in Edit Mode */}
            {isEditing && (
              <div
                data-testid="brand-locked-alert"
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  A marca não pode ser alterada em um item já cadastrado. Para transferir estoque, crie um novo registro ou faça um ajuste.
                </p>
              </div>
            )}

            {/* Brand Selector */}
            <div className="space-y-1.5">
              <label htmlFor="form-brand" className="block text-xs font-semibold text-slate-200">
                Marca *
              </label>
              <select
                id="form-brand"
                data-testid="select-brand"
                aria-label="Marca"
                disabled={isEditing}
                value={formData.brand_id || ''}
                onChange={(e) => handleChange('brand_id', e.target.value)}
                required
                className={`w-full px-3 py-2 bg-dark-900 text-white rounded-xl border border-slate-700 text-xs focus:border-rose-500 focus:outline-none ${
                  isEditing ? 'opacity-60 cursor-not-allowed bg-slate-900' : ''
                }`}
              >
                <option value="">Selecione a Marca...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.slug})
                  </option>
                ))}
              </select>
            </div>

            {/* Design Code & Design Name Rules Grid */}
            <FormularioDesignInputs
              codigoEstampa={formData.codigo_estampa}
              nomeDesign={formData.nome_design}
              existingDesign={existingDesign}
              onCodeChange={handleDesignCodeChange}
              onNameChange={(val) => handleChange('nome_design', val)}
            />

            {/* Cor do Tecido */}
            <div className="space-y-1.5">
              <label htmlFor="form-cor" className="block text-xs font-semibold text-slate-200">
                Cor do Tecido / Base *
              </label>
              <select
                id="form-cor"
                data-testid="select-cor"
                aria-label="Cor do Tecido"
                value={formData.cor_id || ''}
                onChange={(e) => handleChange('cor_id', e.target.value)}
                required
                className="w-full px-3 py-2 bg-dark-900 text-white rounded-xl border border-slate-700 text-xs focus:border-rose-500 focus:outline-none"
              >
                <option value="">Selecione a Cor...</option>
                {cores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cor} - {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Category Fields */}
            {category === 'peca' ? (
              <FormularioPecaFields
                formData={formData}
                onChange={handleChange}
                tipos={tipos}
                tamanhos={tamanhos}
              />
            ) : (
              <FormularioEstampaFields />
            )}

            {/* Quantidade Input */}
            <div className="space-y-1.5">
              <label htmlFor="form-quantidade" className="block text-xs font-semibold text-slate-200">
                Quantidade {isEditing ? 'em Estoque' : 'para Adicionar'} *
              </label>
              <input
                id="form-quantidade"
                type="number"
                min="0"
                data-testid="input-quantidade"
                aria-label="Quantidade"
                value={formData.quantidade}
                onChange={(e) => handleChange('quantidade', parseInt(e.target.value, 10) || 0)}
                required
                className="w-full px-3 py-2 bg-dark-900 text-white font-mono font-bold rounded-xl border border-slate-700 text-sm focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid="submit-form-btn"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-colors active:scale-95"
              >
                <span>{isEditing ? 'Avançar para Atualização' : 'Avançar para Cadastro'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Pre-submit Summary Modal */}
      <ConfirmacaoEstoqueModal
        isOpen={isConfirmOpen}
        isEditing={isEditing}
        generatedSku={currentGeneratedSku}
        summaryData={summaryData}
        submitting={submitting}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalSubmit}
      />
    </>
  );
}
