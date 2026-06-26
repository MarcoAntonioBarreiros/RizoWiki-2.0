// RiskPanel - checklist "vou aplicar agora?" da aba Fatores (brief secao 6).
// Componente PURAMENTE visual: coleta os campos e devolve via onChange(field, valor).
// A decisao go/no-go fica no riskAssessment, que reusa os motores (AGENTS.md regra 5).
import organismsData from '../data/organisms.json';

const QUIMICOS = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'fungicida', label: 'Fungicida' },
  { value: 'cuprico_metal', label: 'Cuprico / metal' },
  { value: 'adubo_salino', label: 'Adubo salino' },
];

const UMIDADES = [
  { value: 'seco', label: 'Seco' },
  { value: 'adequado', label: 'Adequado' },
  { value: 'encharcado', label: 'Encharcado' },
];

const MODOS = [
  { value: 'mistura_tanque', label: 'Mistura em tanque' },
  { value: 'tratamento_semente', label: 'Tratamento de semente' },
  { value: 'sulco', label: 'Sulco' },
  { value: 'foliar', label: 'Foliar' },
];

export default function RiskPanel({ value, onChange }) {
  const organismos = Object.keys(organismsData.organisms);
  return (
    <div className="lab-grid">
      <label className="field">
        <span>Organismo</span>
        <select value={value.organismo} onChange={(event) => onChange('organismo', event.target.value)}>
          {organismos.map((id) => (
            <option key={id} value={id}>{organismsData.organisms[id].label}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Horas desde a inoculacao</span>
        <input
          type="number"
          min="0"
          max="336"
          step="1"
          value={value.horas}
          onChange={(event) => onChange('horas', Number(event.target.value))}
        />
      </label>

      <label className="field">
        <span>Umidade do solo</span>
        <select value={value.umidade} onChange={(event) => onChange('umidade', event.target.value)}>
          {UMIDADES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Quimico no tanque</span>
        <select value={value.quimico} onChange={(event) => onChange('quimico', event.target.value)}>
          {QUIMICOS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Modo de aplicacao</span>
        <select value={value.modo} onChange={(event) => onChange('modo', event.target.value)}>
          {MODOS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label className="check-field">
        <input
          type="checkbox"
          checked={value.refrigerado}
          onChange={(event) => onChange('refrigerado', event.target.checked)}
        />
        <span>Refrigerado ate aplicar</span>
      </label>

      <label className="check-field">
        <input
          type="checkbox"
          checked={value.exposicaoUV}
          onChange={(event) => onChange('exposicaoUV', event.target.checked)}
        />
        <span>Exposicao a sol/UV (foliar)</span>
      </label>
    </div>
  );
}
