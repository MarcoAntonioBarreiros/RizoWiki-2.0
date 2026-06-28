// CaseContextBar - barra de "caso compartilhado" no topo de Fatores e Lab.
// Torna VISIVEL que as abas trabalham o mesmo caseState (cultura/problema/organismo) e mostra,
// num chip, o semaforo "vou aplicar agora?" (riskAssessment). Reusa os motores; nao decide nada
// novo - so expoe o que ja flui no background entre as abas.
import { useMemo } from 'react';
import organismsData from '../data/organisms.json';
import { PROBLEMAS } from '../engines/diagnosticEngine.js';
import { assessApplication } from '../utils/riskAssessment.js';

const RISK = {
  go: { label: 'GO - pode aplicar', cls: 'risk-go' },
  atencao: { label: 'ATENCAO - ajustar', cls: 'risk-atencao' },
  nogo: { label: 'NO-GO - nao aplicar', cls: 'risk-nogo' },
  inconclusiva: { label: 'inconclusiva', cls: 'risk-atencao' },
};

const HINT = {
  fatores: 'Edite os fatores de aplicacao abaixo; o veredito usa este organismo e caso.',
  lab: 'Compare cenarios de viabilidade abaixo para este organismo.',
};

export default function CaseContextBar({ caseState, onCaseChange, active }) {
  const organismIds = Object.keys(organismsData.organisms);
  const orgId = organismsData.organisms[caseState.organismo] ? caseState.organismo : organismIds[0];
  const problemaLabel = PROBLEMAS[caseState.problema]?.label || caseState.problema || '-';
  const risk = useMemo(() => assessApplication(caseState), [caseState]);
  const r = RISK[risk.semaphore] || RISK.atencao;

  return (
    <div className="case-bar">
      <div className="case-bar__head">
        <span className="map-kicker">Caso compartilhado - Mapa, Fatores e Lab</span>
        <div className="case-bar__risk">
          <small>Vou aplicar agora?</small>
          <span className={`status-chip status-chip--${r.cls}`}>{r.label}</span>
        </div>
      </div>
      <div className="case-bar__chips">
        <span className="case-chip"><small>Cultura</small>{caseState.cultura || '-'}</span>
        <span className="case-chip"><small>Problema</small>{problemaLabel}</span>
        <label className="case-chip case-chip--select">
          <small>Organismo em analise</small>
          <select value={orgId} onChange={(event) => onCaseChange('organismo', event.target.value)}>
            {organismIds.map((id) => (
              <option key={id} value={id}>{organismsData.organisms[id].label}</option>
            ))}
          </select>
        </label>
      </div>
      {HINT[active] && <p className="inline-note">{HINT[active]}</p>}
    </div>
  );
}
