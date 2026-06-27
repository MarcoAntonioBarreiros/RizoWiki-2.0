// ProtocolReport - ficha de recomendacao exportavel (brief secoes 4 e 6).
// Renderiza o protocolo (vindo do protocolEngine) + ConfidenceBadge + disclaimer + exportar.
// Componente de exibicao: nao decide nada; quem monta o protocolo e o protocolEngine.
import ConfidenceBadge from './ConfidenceBadge.jsx';
import { DISCLAIMER } from '../disclaimer.js';
import { printProtocol } from '../utils/reportExporter.js';

function Linha({ titulo, children }) {
  return (
    <div style={{ margin: '0.4rem 0' }}>
      <strong>{titulo}:</strong> {children}
    </div>
  );
}

function ListaBloco({ titulo, itens }) {
  if (!itens || itens.length === 0) return null;
  return (
    <div style={{ margin: '0.4rem 0' }}>
      <strong>{titulo}:</strong>
      <ul style={{ margin: '0.2rem 0 0 1.1rem' }}>
        {itens.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ProtocolReport({ protocol, contexto = {} }) {
  if (!protocol || !protocol.organismo) return null;

  return (
    <div
      style={{
        border: '1px solid var(--panel-2)',
        borderRadius: 10,
        padding: '0.9rem 1rem',
        marginTop: '0.75rem',
        background: 'rgba(15, 23, 42, 0.5)',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Ficha pratica - {protocol.label || protocol.organismo}</h3>

      <Linha titulo="Dose">{protocol.dose}</Linha>
      <Linha titulo="Metodo / culturas">
        {protocol.metodo} - {protocol.culturasReferencia}
      </Linha>
      <Linha titulo="Ordem de mistura">{protocol.ordemDeMistura}</Linha>
      <Linha titulo="Manejo">{protocol.manejo}</Linha>
      {protocol.funcoes && protocol.funcoes.length > 0 && (
        <Linha titulo="Funcoes">{protocol.funcoes.join(', ')}</Linha>
      )}
      <ListaBloco titulo="O que monitorar" itens={protocol.monitorar} />
      <ListaBloco titulo="Contraindicacoes" itens={protocol.contraindicacoes} />

      {protocol.procedencia && (
        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--muted)',
            borderLeft: '3px solid var(--accent)',
            paddingLeft: '0.6rem',
            margin: '0.6rem 0',
          }}
        >
          <strong>Procedencia:</strong> {protocol.procedencia}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', margin: '0.6rem 0', flexWrap: 'wrap' }}>
        <ConfidenceBadge level={protocol.confidence} />
        <button className="app__tab" onClick={() => printProtocol(protocol, contexto)}>
          Imprimir / salvar PDF
        </button>
      </div>

      <ul className="page__todo">
        {protocol.limitations.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{DISCLAIMER}</p>
    </div>
  );
}
