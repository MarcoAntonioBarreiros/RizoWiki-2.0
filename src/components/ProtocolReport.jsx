// ProtocolReport - ficha de recomendacao exportavel (brief secoes 4 e 6).
// Renderiza o protocolo (vindo do protocolEngine) + ConfidenceBadge + disclaimer + exportar.
// Componente de exibicao: nao decide nada; quem monta o protocolo e o protocolEngine.
import ConfidenceBadge from './ConfidenceBadge.jsx';
import { DISCLAIMER } from '../disclaimer.js';
import { printProtocol } from '../utils/reportExporter.js';

const FIELD_LABELS = {
  'protocol.culturas': 'Culturas',
  'protocol.metodo': 'Metodo',
  'protocol.dose_range': 'Dose',
  'protocol.critical': 'Critico',
  'protocol.ordem_mistura': 'Mistura',
  'protocol.manejo': 'Manejo',
  limites_operacionais: 'Limites operacionais',
  functions: 'Funcoes',
};

function FieldChip({ children }) {
  return <span className="field-chip">{children}</span>;
}

function ProtocolRow({ titulo, children }) {
  return (
    <tr>
      <th>{titulo}</th>
      <td>{children || '-'}</td>
    </tr>
  );
}

function ListBlock({ titulo, itens, tone = 'default' }) {
  if (!itens || itens.length === 0) return null;
  return (
    <div className={`protocol-list protocol-list--${tone}`}>
      <strong>{titulo}</strong>
      <ul>
        {itens.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function References({ references = [] }) {
  if (references.length === 0) return null;

  return (
    <div className="reference-grid">
      {references.map((ref) => (
        <article key={ref.id} className="reference-card">
          <span>{ref.sourceType || 'fonte'}</span>
          {ref.url ? (
            <a href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a>
          ) : (
            <strong>{ref.title}</strong>
          )}
          {ref.publisher && <p>{ref.publisher}</p>}
        </article>
      ))}
    </div>
  );
}

export default function ProtocolReport({ protocol, contexto = {} }) {
  if (!protocol || !protocol.organismo) return null;
  const fields = protocol.calibratedFields || [];

  return (
    <div className="protocol-report">
      <div className="protocol-report__header">
        <div>
          <h3>Ficha pratica - {protocol.label || protocol.organismo}</h3>
          <p>{protocol.source}</p>
        </div>
        <div className="protocol-report__actions">
          <ConfidenceBadge level={protocol.confidence} />
          <button className="app__tab app__tab--small" onClick={() => printProtocol(protocol, contexto)}>
            Imprimir / salvar PDF
          </button>
        </div>
      </div>

      <div className="protocol-report__meta">
        {fields.length > 0 ? (
          <>
            <strong>Campos com fonte tecnica</strong>
            <div className="field-chip-row">
              {fields.map((field) => (
                <FieldChip key={field}>{FIELD_LABELS[field] || field}</FieldChip>
              ))}
            </div>
          </>
        ) : (
          <p>Ficha em rascunho do RizoWiki 1.0; fonte tecnica de produto ainda pendente.</p>
        )}
      </div>

      <div className="protocol-layout">
        <div className="table-wrap protocol-table-wrap">
          <table className="data-table protocol-table">
            <tbody>
              <ProtocolRow titulo="Dose">{protocol.dose}</ProtocolRow>
              <ProtocolRow titulo="Metodo">{protocol.metodo}</ProtocolRow>
              <ProtocolRow titulo="Culturas">{protocol.culturasReferencia}</ProtocolRow>
              <ProtocolRow titulo="Mistura">{protocol.ordemDeMistura}</ProtocolRow>
              <ProtocolRow titulo="Manejo">{protocol.manejo}</ProtocolRow>
            </tbody>
          </table>
        </div>

        {protocol.funcoes && protocol.funcoes.length > 0 && (
          <div className="protocol-functions">
            <strong>Funcoes</strong>
            <div className="priority-strip">
              {protocol.funcoes.map((fn) => (
                <span key={fn}>{fn}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="protocol-columns">
        <ListBlock titulo="O que monitorar" itens={protocol.monitorar} />
        <ListBlock titulo="Contraindicacoes e pontos criticos" itens={protocol.contraindicacoes} tone="warn" />
      </div>

      {(protocol.pending || protocol.procedencia) && (
        <div className="source-note">
          <strong>Pendencias / procedencia</strong>
          <p>{protocol.pending || protocol.procedencia}</p>
        </div>
      )}

      {protocol.extractionSummary && (
        <details className="map-details">
          <summary>Resumo bruto da curadoria</summary>
          <p>{protocol.extractionSummary}</p>
        </details>
      )}

      <References references={protocol.references} />

      <details className="map-details">
        <summary>Limitacoes da ficha</summary>
        <ul>
          {protocol.limitations.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </details>

      <p className="map-disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
