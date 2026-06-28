import ConfidenceBadge from './ConfidenceBadge.jsx';

const CLASSE_P_LABEL = {
  muito_baixo: 'Muito baixo',
  baixo: 'Baixo',
  medio: 'Medio',
  alto: 'Alto',
  muito_alto: 'Muito alto',
};

const ORIGEM_LABEL = {
  real: 'real',
  prior_regional: 'prior',
  ausente: 'ausente',
  informada: 'informada',
  assumida: 'assumida',
};

function OriginChip({ origem }) {
  const key = origem || 'ausente';
  return <span className={`origin-chip origin-chip--${key}`}>{ORIGEM_LABEL[key] || key}</span>;
}

function SoilRow({ indicador, valor, interpretacao, origem, fonte }) {
  return (
    <tr>
      <th>{indicador}</th>
      <td>{valor || '-'}</td>
      <td>{interpretacao || '-'}</td>
      <td><OriginChip origem={origem} /></td>
      <td>{fonte || '-'}</td>
    </tr>
  );
}

function compactSource(text) {
  if (!text) return '';
  return String(text).replace(/^Fonte:\s*/i, '');
}

export default function SoilSummaryPanel({ soilSummary }) {
  const { soil, pInterp, acidez, compactacao, kInterp, npk, pConfidence } = soilSummary;
  const completeness = soil.campos_total > 0
    ? Math.round((soil.campos_reais / soil.campos_total) * 100)
    : 0;

  const pValor = pInterp.classe
    ? `${pInterp.valor} mg/dm3 ${pInterp.extrator ? `(${pInterp.extrator})` : ''}`
    : pInterp.mensagem;
  const pInterpText = pInterp.classe
    ? `${CLASSE_P_LABEL[pInterp.classe] || pInterp.classe}${pInterp.abaixo_critico ? ' abaixo do critico' : ''}`
    : '';

  const acidezValor = [
    acidez.pH ? `pH ${acidez.pH.valor}` : null,
    acidez.V ? `V ${acidez.V.valor}%` : null,
    acidez.m ? `Al ${acidez.m.valor}%` : null,
  ].filter(Boolean).join(' / ');
  const acidezInterp = acidez._status === 'sem_dado'
    ? 'Sem dado'
    : acidez.calagem_indicada ? 'Calagem indicada' : 'Sem alerta critico';

  const compactValor = [
    compactacao.densidade ? `Ds ${compactacao.densidade.valor}` : null,
    compactacao.rp ? `RP ${compactacao.rp.valor}` : null,
  ].filter(Boolean).join(' / ');
  const compactInterp = compactacao._status === 'sem_dado'
    ? 'Sem dado'
    : compactacao._status === 'argila_ausente'
      ? 'Informe argila'
      : `Restricao ${compactacao.restricao}`;

  const kValor = kInterp.classe ? `${kInterp.valor} mg/dm3` : kInterp.mensagem;
  const kInterpText = kInterp.classe ? `${CLASSE_P_LABEL[kInterp.classe] || kInterp.classe}` : '';

  return (
    <div className="map-panel map-panel--soil">
      <div className="map-panel__header">
        <div>
          <h3>Solo e nutricao</h3>
          <p>
            {soil.campos_reais}/{soil.campos_total} campos reais - {soil.regiao_label}
          </p>
        </div>
        <div className="completion-meter" title={`Completude: ${completeness}%`}>
          <span style={{ width: `${completeness}%` }} />
        </div>
        <ConfidenceBadge level={pConfidence} />
      </div>

      {soil.regiao_aviso && <p className="inline-note">{soil.regiao_aviso}</p>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Valor</th>
              <th>Interpretacao</th>
              <th>Origem</th>
              <th>Fonte</th>
            </tr>
          </thead>
          <tbody>
            <SoilRow
              indicador="Fosforo (P)"
              valor={pValor}
              interpretacao={pInterpText}
              origem={pInterp.origem}
              fonte={compactSource(pInterp._source)}
            />
            <SoilRow
              indicador="Potassio (K)"
              valor={kValor}
              interpretacao={kInterpText}
              origem={kInterp.origem}
              fonte={compactSource(kInterp._source)}
            />
            <SoilRow
              indicador="Acidez"
              valor={acidezValor}
              interpretacao={acidezInterp}
              origem={acidez.origem}
              fonte={compactSource(acidez._source)}
            />
            <SoilRow
              indicador="Compactacao"
              valor={compactValor}
              interpretacao={compactInterp}
              origem={compactacao.origem}
              fonte={compactSource(compactacao._source)}
            />
          </tbody>
        </table>
      </div>

      <div className="npk-strip" aria-label="Adubacao NPK qualitativa">
        <div>
          <span>N</span>
          <strong>{npk.N.texto}</strong>
        </div>
        <div>
          <span>P</span>
          <strong>{npk.P.texto}</strong>
        </div>
        <div>
          <span>K</span>
          <strong>{npk.K.texto}</strong>
        </div>
      </div>
      <p className="inline-note">{npk.nota} Dose em kg/ha pendente (tabela CQFS 2016).</p>
    </div>
  );
}
