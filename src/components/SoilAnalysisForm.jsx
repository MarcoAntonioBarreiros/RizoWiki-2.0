// SoilAnalysisForm - entrada OPCIONAL da analise de solo (Fase S1b/R1).
// Componente puramente visual: coleta os campos e devolve via onChange(field, valor) com nomes
// simples ('P', 'argila', ...). Quem resolve prior/real e interpreta sao os motores de solo.
// Principio do projeto: roda com o que o usuario tiver; campos vazios usam prior regional rotulado.

const REGIOES = [
  { value: '', label: '(nao informada)' },
  { value: 'sul_pr', label: 'Sul / Parana' },
];

const EXTRATORES = [
  { value: 'mehlich1', label: 'Mehlich-1' },
  { value: 'resina', label: 'Resina (troca anionica)' },
];

function SelectField({ label, field, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(field, event.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, field, value, onChange, placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min="0"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange(field, event.target.value)}
      />
    </label>
  );
}

export default function SoilAnalysisForm({ value = {}, onChange }) {
  return (
    <div>
      <p className="page__todo" style={{ marginTop: 0 }}>
        Opcional. Informe o que tiver da sua analise de solo - o modelo roda mesmo incompleto e
        estima o resto por <strong>prior regional</strong> (sempre rotulado). Quanto mais dado real,
        maior a confianca.
      </p>
      <div className="lab-grid">
        <SelectField
          label="Regiao"
          field="regiao"
          value={value.regiao ?? ''}
          options={REGIOES}
          onChange={onChange}
        />
        <SelectField
          label="Extrator de P"
          field="extrator"
          value={value.extrator ?? 'mehlich1'}
          options={EXTRATORES}
          onChange={onChange}
        />
        <NumberField label="P (mg/dm3)" field="P" value={value.P} onChange={onChange} placeholder="ex.: 6" />
        <NumberField label="Argila (% ou g/kg)" field="argila" value={value.argila} onChange={onChange} placeholder="ex.: 65 ou 650" />
        <NumberField label="pH (agua)" field="pH" value={value.pH} onChange={onChange} placeholder="ex.: 5,4" />
        <NumberField label="V - sat. bases (%)" field="V" value={value.V} onChange={onChange} placeholder="ex.: 50" />
        <NumberField label="m - sat. aluminio (%)" field="m" value={value.m} onChange={onChange} placeholder="ex.: 12" />
        <NumberField label="Densidade (g/cm3)" field="densidade" value={value.densidade} onChange={onChange} placeholder="ex.: 1,45" />
        <NumberField label="Resist. penetracao (MPa)" field="rp" value={value.rp} onChange={onChange} placeholder="ex.: 2,3" />
      </div>
    </div>
  );
}
