import React, { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, AlertCircle, CheckCircle2, AlertTriangle, XCircle, Shirt, Palette, Filter } from 'lucide-react';
import { api } from '../api';
import { ItemVariantCard } from './ItemVariantCard';
import { getStatusBadge } from '../utils/formatters';

export function BuscaSKU({
  catalogs = {},
  selectedBrand,
  onOpenDeduct,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCor, setSelectedCor] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const { brands = [], cores = [], tipos = [] } = catalogs;

  // Execute verification search
  const performSearch = useCallback(async (term, cor, tipo) => {
    if (!term && !cor && !tipo && selectedBrand === 'all') {
      setResult(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const brandPrefix = selectedBrand !== 'all' ? selectedBrand : '';
      const data = await api.verificarDisponibilidade({
        sku: term,
        brand_prefix: brandPrefix,
        cor: cor,
        tipo: tipo,
      });
      setResult(data);
    } catch (err) {
      setResult({
        status: 'SEM_ESTOQUE',
        status_label: 'Erro na busca',
        status_description: err.message,
        total_pecas: 0,
        total_estampas: 0,
        pecas_prontas: [],
        estampas: [],
      });
    } finally {
      setLoading(false);
    }
  }, [selectedBrand]);

  // Debounced auto-search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim().length > 0 || selectedCor || selectedTipo || selectedBrand !== 'all') {
        performSearch(searchTerm, selectedCor, selectedTipo);
      } else {
        setResult(null);
        setHasSearched(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [searchTerm, selectedCor, selectedTipo, selectedBrand, performSearch]);

  const statusBadge = result ? getStatusBadge(result.status) : null;

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-rose-500" />
              Verificador Inteligente de Disponibilidade & SKU
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Digite um código (ex: <code className="text-rose-300 font-mono">001</code>), código + tamanho (ex: <code className="text-rose-300 font-mono">001 M</code>, <code className="text-rose-300 font-mono">006G1</code>) ou SKU completo.
            </p>
          </div>

          {/* Search Inputs Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* SKU / Code Text Input */}
            <div className="md:col-span-6 relative">
              <label htmlFor="sku-search-input" className="sr-only">
                Buscar por SKU, código ou nome
              </label>
              <input
                id="sku-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar SKU, código ou nome... (Ctrl + K)"
                aria-label="Buscar SKU, código ou nome"
                className="w-full pl-10 pr-4 py-3 bg-dark-900/90 text-white rounded-xl border border-slate-700/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-sm font-mono placeholder:font-sans placeholder:text-slate-500 shadow-inner transition-colors"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpar busca"
                  className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-white"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Color Filter */}
            <div className="md:col-span-3">
              <select
                aria-label="Filtrar por Cor"
                value={selectedCor}
                onChange={(e) => setSelectedCor(e.target.value)}
                className="w-full px-3.5 py-3 bg-dark-900/90 text-slate-200 rounded-xl border border-slate-700/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-sm"
              >
                <option value="">Todas as Cores</option>
                {cores.map((c) => (
                  <option key={c.id} value={c.cor}>
                    {c.cor} - {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="md:col-span-3">
              <select
                aria-label="Filtrar por Tipo"
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full px-3.5 py-3 bg-dark-900/90 text-slate-200 rounded-xl border border-slate-700/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-sm"
              >
                <option value="">Todos os Tipos</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.codigo}>
                    {t.codigo} - {t.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-rose-500 border-t-transparent" />
          <p className="text-xs text-slate-400 mt-2 font-mono">Buscando disponibilidade no estoque...</p>
        </div>
      )}

      {/* Results view */}
      {!loading && hasSearched && result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Alert Banner */}
          <div
            data-testid="verifier-status-banner"
            className={`p-5 rounded-2xl border ${statusBadge.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md`}
          >
            <div className="flex items-center gap-3.5">
              <span className={`w-3.5 h-3.5 rounded-full ${statusBadge.dot} animate-ping shrink-0`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-wide uppercase">
                    {result.status_label}
                  </span>
                  {result.extracted && result.extracted.code && (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900/60 font-mono text-slate-300 border border-slate-700">
                      Cód: #{result.extracted.code} {result.extracted.size && `• Tam: ${result.extracted.size}`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{result.status_description}</p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-dark-900/60 px-4 py-2 rounded-xl border border-white/10 self-start sm:self-auto">
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Peças Prontas</span>
                <span className="text-sm font-bold font-mono text-emerald-400">{result.total_pecas}</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div className="text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Estampas Avulsas</span>
                <span className="text-sm font-bold font-mono text-amber-400">{result.total_estampas}</span>
              </div>
            </div>
          </div>

          {/* Detailed Lists Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peças Prontas Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-indigo-400" />
                  Peças Prontas Encontradas ({result.pecas_prontas ? result.pecas_prontas.length : 0})
                </h3>
              </div>

              {result.pecas_prontas && result.pecas_prontas.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.pecas_prontas.map((peca) => (
                    <ItemVariantCard
                      key={peca.id}
                      item={peca}
                      type="peca"
                      onDeduct={onOpenDeduct}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-dark-800/40 border border-slate-800 text-center text-xs text-slate-500">
                  Nenhuma peça pronta em estoque para os filtros selecionados.
                </div>
              )}
            </div>

            {/* Estampas Avulsas Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-rose-400" />
                  Estampas Avulsas Encontradas ({result.estampas ? result.estampas.length : 0})
                </h3>
              </div>

              {result.estampas && result.estampas.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.estampas.map((est) => (
                    <ItemVariantCard
                      key={est.id}
                      item={est}
                      type="estampa"
                      onDeduct={onOpenDeduct}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-dark-800/40 border border-slate-800 text-center text-xs text-slate-500">
                  Nenhuma estampa avulsa em estoque para os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty / Welcome State */}
      {!hasSearched && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-dark-800/20">
          <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Pronto para consultar disponibilidade</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Use a barra de busca acima ou pressione <kbd className="px-1.5 py-0.5 bg-dark-900 rounded border border-slate-700 font-mono text-[11px] text-slate-300">Ctrl + K</kbd> para pesquisar instantaneamente por SKU, código ou nome da estampa.
          </p>
        </div>
      )}
    </div>
  );
}
