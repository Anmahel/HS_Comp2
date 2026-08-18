import React, { useState, useRef } from 'react';
import {
  Upload, FileSpreadsheet, Sparkles, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import { ProcessadorSuccessCard } from './ProcessadorSuccessCard';
import { ProcessadorPreviewCard } from './ProcessadorPreviewCard';

const SAMPLE_CSV_CONTENT = `SKU;Produto;Quantidade;Data
CF-643-PRE-G;Camiseta Baby Look Un Belo Dia Ria - G - Preta;2;2026-08-16
CM-001-BRA-P;Camiseta Masculina 78 Black Sabbath - P - Branca;5;2026-08-16
CF-643-PRE-GG;Camiseta Baby Look Un Belo Dia Ria - GG - Preta;1;2026-08-16
CF-558-BRA-M;Camiseta Baby Look Toca Raul - M - Branca;10;2026-08-16
CF-572-BRA-M;Camiseta Tour Guns 2025 - M - Branca;10;2026-08-16
`;

export function ProcessadorPedidosView({
  user = null,
  onProcessBatch,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastProcessedLote, setLastProcessedLote] = useState(null);
  const fileInputRef = useRef(null);

  const userRole = user ? user.role : null;
  const userName = user ? user.name : 'Não autenticado';

  // Check if role is allowed to process
  const canProcess = ['soporte', 'jefe', 'admin', 'ing'].includes(userRole);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    setSelectedFile(file);
    setLastProcessedLote(null);
    setLoadingPreview(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const preview = await api.previaPedidos(formData);
      setPreviewData(preview);
      toast.success(`Arquivo "${file.name}" carregado. Prévia gerada com sucesso!`);
    } catch (err) {
      toast.error(`Falha ao ler arquivo: ${err.message}`);
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadSampleData = async () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const sampleFile = new File([blob], 'planilha_pedidos_exemplo.csv', { type: 'text/csv' });
    await handleFileSelected(sampleFile);
  };

  const handleProcessSubmit = async () => {
    if (!selectedFile && !previewData) {
      toast.error('Nenhum arquivo ou dados para processar.');
      return;
    }

    if (!canProcess) {
      toast.error(`O perfil "${userRole}" não possui permissão para processar pedidos.`);
      return;
    }

    setProcessing(true);
    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        res = await onProcessBatch(formData);
      } else {
        res = await onProcessBatch({
          items: previewData.items,
          filename: previewData.filename || 'pedidos.csv',
        });
      }

      setLastProcessedLote(res.lote);
      setPreviewData(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      // Handled in parent
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setLastProcessedLote(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8">
      {/* RBAC Header & Workflow Context Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-dark-800 via-dark-800 to-indigo-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Módulo de Processamento de Pedidos & Desconto Atômico
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Ingestão de planilhas <b>CSV, XLSX e PDF</b>. O sistema consulta automaticamente o estoque de{' '}
              <span className="text-indigo-300 font-semibold">Peças Prontas</span>, em seguida{' '}
              <span className="text-amber-300 font-semibold">Estampas Avulsas</span> e encaminha o remanescente para a{' '}
              <span className="text-rose-400 font-semibold">Fila de Impressão</span>, gerando os PDFs de <b>Imprenta (PDF 1)</b> e <b>Separação (PDF 2)</b>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-dark-900/80 px-3.5 py-2 rounded-xl border border-slate-700/60 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div>
              <span className="text-slate-400 text-[10px] block">Perfil Ativo</span>
              <span className="font-bold text-white font-mono uppercase">{userName} ({userRole})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Card */}
      {lastProcessedLote && (
        <ProcessadorSuccessCard
          lote={lastProcessedLote}
          onReset={resetForm}
        />
      )}

      {/* Upload Zone & Interactive Preview */}
      {!lastProcessedLote && (
        <div className="space-y-6">
          {/* Dropzone button container */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-8 rounded-2xl border-2 border-dashed transition-colors text-center relative ${
              dragActive
                ? 'border-rose-500 bg-rose-500/10'
                : 'border-slate-700 hover:border-slate-500 bg-dark-800/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="max-w-md mx-auto space-y-3">
              <button
                type="button"
                aria-label="Abrir seletor de arquivos para upload de pedidos"
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 mx-auto flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors"
              >
                <Upload className="h-6 w-6" />
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-bold text-white hover:text-rose-400 transition-colors"
                >
                  Arraste sua planilha de pedidos aqui ou clique para buscar
                </button>
                <p className="text-xs text-slate-400 mt-1">
                  Formatos aceitos: <b>.CSV, .XLSX (Excel) ou .PDF</b>
                </p>
              </div>

              {selectedFile && (
                <div className="pt-2">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-lg inline-block border border-emerald-500/20">
                    Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={loadSampleData}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-rose-400" />
                  Carregar Planilha de Demonstração (Agatha)
                </button>
              </div>
            </div>
          </div>

          {/* Loading preview state */}
          {loadingPreview && (
            <div className="py-8 text-center text-slate-400 font-mono text-xs">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-rose-500 border-t-transparent mb-2" />
              <p>Lendo arquivo e calculando cascata de estoque...</p>
            </div>
          )}

          {/* Preview Analysis Breakdown */}
          {previewData && (
            <ProcessadorPreviewCard
              previewData={previewData}
              processing={processing}
              canProcess={canProcess}
              onReset={resetForm}
              onSubmit={handleProcessSubmit}
            />
          )}
        </div>
      )}
    </div>
  );
}
