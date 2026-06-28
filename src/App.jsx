import { useCallback, useState } from 'react';
import Wiki from './pages/Wiki.jsx';
import Mapa from './pages/Mapa.jsx';
import Fatores from './pages/Fatores.jsx';
import Lab from './pages/Lab.jsx';
import { DISCLAIMER } from './disclaimer.js';
import organismsData from './data/organisms.json';

const DEFAULT_ORGANISM = 'bacillus';
const DEFAULT_CASE = {
  cultura: 'soja',
  estadio: 'pre_semeadura',
  problema: 'fosforo_indisponivel',
  umidade: 'adequado',
  quimico: 'nenhum',
  modo: 'tratamento_semente',
  organismo: DEFAULT_ORGANISM,
  horas: 6,
  refrigerado: false,
  exposicaoUV: false,
  initialLog: 9,
  temperatureC: 30,
  effectiveThresholdLog: organismsData.organisms[DEFAULT_ORGANISM].viability.effective_threshold_log,
  // Analise de solo (opcional). Vazio => prior regional (degradacao graciosa, Fase R1).
  soil: { regiao: '', extrator: 'mehlich1', P: '', argila: '', pH: '', V: '', m: '', densidade: '', rp: '' },
};

const TABS = [
  { id: 'mapa', label: 'Mapa', component: Mapa },
  { id: 'fatores', label: 'Fatores', component: Fatores },
  { id: 'lab', label: 'Lab', component: Lab },
  { id: 'wiki', label: 'Wiki', component: Wiki },
];

export default function App() {
  const [tab, setTab] = useState('mapa');
  const [caseState, setCaseState] = useState(DEFAULT_CASE);
  const Active = (TABS.find((item) => item.id === tab) ?? TABS[0]).component;
  const setCaseField = useCallback((field, value) => {
    setCaseState((prev) => {
      if (typeof field === 'string' && field.startsWith('soil.')) {
        const key = field.slice('soil.'.length);
        return { ...prev, soil: { ...prev.soil, [key]: value } };
      }
      if (field !== 'organismo') return { ...prev, [field]: value };

      const threshold = organismsData.organisms[value]?.viability?.effective_threshold_log;
      return {
        ...prev,
        organismo: value,
        effectiveThresholdLog: threshold ?? prev.effectiveThresholdLog,
      };
    });
  }, []);

  return (
    <div className="app">
      <header className="app__header">
        <h1>RizoWiki 2.0</h1>
        <p className="app__tagline">
          Apoio a decisao sobre bioinsumos e rizosfera - descritivo e explicavel.
        </p>
        <p className="app__phase" role="status">
          Fase 5 - Mapa V0.5 ranqueia candidatos pelo mesmo caso usado em Fatores e Lab.
          Motores: diagnostic, recommendation, compatibility, viability e protocol. Dados tecnicos ainda em curadoria.
        </p>
      </header>

      <nav className="app__nav" aria-label="Secoes">
        {TABS.map((item) => (
          <button
            key={item.id}
            className={'app__tab' + (item.id === tab ? ' app__tab--active' : '')}
            aria-current={item.id === tab ? 'page' : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="app__main">
        <Active caseState={caseState} onCaseChange={setCaseField} />
      </main>

      <footer className="app__footer">
        <p>{DISCLAIMER}</p>
      </footer>
    </div>
  );
}
