/**
 * Formats ISO datetime string to local date time (pt-BR)
 */
export function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Returns badge styling for availability status
 */
export function getStatusBadge(status) {
  switch (status) {
    case 'EM_ESTOQUE':
      return {
        label: 'Em Estoque',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'ESTAMPAR':
      return {
        label: 'Estampar',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'SEM_ESTOQUE':
    default:
      return {
        label: 'Sem Estoque',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
      };
  }
}

/**
 * Movement type formatting
 */
export function getMovimentoBadge(tipo) {
  switch (tipo) {
    case 'ENTRADA':
      return {
        label: 'Entrada (+)',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      };
    case 'SAIDA':
      return {
        label: 'Saída (-)',
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      };
    case 'AJUSTE':
    default:
      return {
        label: 'Ajuste',
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      };
  }
}
