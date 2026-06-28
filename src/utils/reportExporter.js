// reportExporter - gera a ficha de recomendacao em HTML imprimivel (=> PDF via "salvar como PDF").
// brief secoes 1 e 6: a ficha sempre traz organismo, dose, riscos, limitacoes e disclaimer.
import { DISCLAIMER } from '../disclaimer.js';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function liList(items) {
  if (!items || items.length === 0) return '<li>-</li>';
  return items.map((item) => `<li>${esc(item)}</li>`).join('');
}

export function buildProtocolHtml(protocol, contexto = {}) {
  if (!protocol || !protocol.organismo) {
    return '<!doctype html><meta charset="utf-8"><p>Sem protocolo para exportar.</p>';
  }
  const titulo = protocol.label || protocol.organismo;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Ficha RizoWiki 2.0 - ${esc(titulo)}</title>
<style>
  body { font-family: system-ui, Arial, sans-serif; color: #111; max-width: 720px; margin: 24px auto; padding: 0 16px; line-height: 1.5; }
  h1 { font-size: 1.4rem; margin: 0 0 0.2rem; }
  h2 { font-size: 1rem; margin: 1.1rem 0 0.3rem; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
  .tag { display: inline-block; background: #f59e0b; color: #111; border-radius: 999px; padding: 1px 8px; font-size: 0.75rem; font-weight: 700; }
  .muted { color: #555; font-size: 0.85rem; }
  ul { margin: 0.2rem 0 0.6rem 1.1rem; padding: 0; }
  .foot { margin-top: 1.2rem; border-top: 1px solid #ddd; padding-top: 0.6rem; font-size: 0.8rem; color: #555; }
</style></head>
<body>
  <h1>Ficha de recomendacao - ${esc(titulo)}</h1>
  <p class="tag">RASCUNHO - confianca ${esc(protocol.confidence)} - fonte: ${esc(protocol.source)}</p>
  <p class="muted">Contexto: cultura ${esc(contexto.cultura || '-')} | problema ${esc(contexto.problema || '-')} | quimico ${esc(contexto.quimico || 'nenhum')} | modo ${esc(contexto.modo || '-')}</p>

  <h2>Dose</h2><p>${esc(protocol.dose)}</p>
  <h2>Metodo / culturas</h2><p>${esc(protocol.metodo)} - ${esc(protocol.culturasReferencia)}</p>
  <h2>Ordem de mistura</h2><p>${esc(protocol.ordemDeMistura)}</p>
  <h2>Manejo</h2><p>${esc(protocol.manejo)}</p>
  <h2>Funcoes</h2><p>${esc((protocol.funcoes || []).join(', ') || '-')}</p>
  <h2>O que monitorar</h2><ul>${liList(protocol.monitorar)}</ul>
  <h2>Contraindicacoes</h2><ul>${liList(protocol.contraindicacoes)}</ul>
  <h2>Procedencia</h2><p>${esc(protocol.procedencia || '-')}</p>
  <h2>Referencias</h2><ul>${liList((protocol.references || []).map((ref) => `${ref.title}${ref.publisher ? ' - ' + ref.publisher : ''}${ref.url ? ' - ' + ref.url : ''}`))}</ul>
  <h2>Limitacoes</h2><ul>${liList(protocol.limitations)}</ul>

  <p class="foot">${esc(DISCLAIMER)}</p>
</body></html>`;
}

export function printProtocol(protocol, contexto = {}) {
  if (typeof window === 'undefined') return false;
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(buildProtocolHtml(protocol, contexto));
  win.document.close();
  win.focus();
  win.print();
  return true;
}

// Mantido por compatibilidade com chamadas antigas.
export function exportReport(protocol, contexto) {
  return printProtocol(protocol, contexto);
}

export default printProtocol;
