// QuickDiagnosisForm - formulario curto do Mapa (brief secao 6).
// Componente PURAMENTE visual: coleta os campos e devolve via onChange(field, valor).
// Nao decide nada (AGENTS.md regra 5); quem chama os motores e a pagina Mapa.
import { PROBLEMAS } from '../engines/diagnosticEngine.js';

const CULTURAS = ['soja', 'milho', 'feijao', 'trigo', 'cana', 'arroz', 'hortalicas', 'cafe', 'outra'];

const ESTADIOS = [
  { value: 'pre_semeadura', label: 'Pre-semeadura / TS' },
  { value: 'vegetativo', label: 'Vegetativo' },
  { value: 'reprodutivo', label: 'Reprodutivo' },
];

const UMIDADES = [
  { value: 'seco', label: 'Seco' },
  { value: 'adequado', label: 'Adequado' },
  { value: 'encharcado', label: 'Encharcado' },
];

const QUIMICOS = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'fungicida', label: 'Fungicida' },
  { value: 'cuprico_metal', label: 'Cuprico / metal' },
  { value: 'adubo_salino', label: 'Adubo salino' },
  { value: 'herbicida', label: 'Herbicida' },
];

const MODOS = [
  { value: 'tratamento_semente', label: 'Tratamento de semente' },
  { value: 'mistura_tanque', label: 'Mistura em tanque' },
  { value: 'sulco', label: 'Sulco' },
  { value: 'foliar', label: 'Foliar' },
];

function Field({ label, field, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(field, event.target.value)}>
        {options.map((opt) => {
          const v = typeof opt === 'string' ? opt : opt.value;
          const l = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={v} value={v}>{l}</option>
          );
        })}
      </select>
    </label>
  );
}

export default function QuickDiagnosisForm({ value, onChange }) {
  const problemaOptions = Object.keys(PROBLEMAS).map((key) => ({
    value: key,
    label: PROBLEMAS[key].label,
  }));

  return (
    <div className="lab-grid">
      <Field label="Cultura" field="cultura" value={value.cultura} options={CULTURAS} onChange={onChange} />
      <Field label="Estadio" field="estadio" value={value.estadio} options={ESTADIOS} onChange={onChange} />
      <Field label="Problema" field="problema" value={value.problema} options={problemaOptions} onChange={onChange} />
      <Field label="Umidade" field="umidade" value={value.umidade} options={UMIDADES} onChange={onChange} />
      <Field label="Quimico" field="quimico" value={value.quimico} options={QUIMICOS} onChange={onChange} />
      <Field label="Modo de aplicacao" field="modo" value={value.modo} options={MODOS} onChange={onChange} />
    </div>
  );
}
