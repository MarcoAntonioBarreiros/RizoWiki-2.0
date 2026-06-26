import { useState } from 'react';
import Wiki from './pages/Wiki.jsx';
import Mapa from './pages/Mapa.jsx';
import Fatores from './pages/Fatores.jsx';
import Lab from './pages/Lab.jsx';

export const DISCLAIMER =
  'Ferramenta de apoio a decisao. Ajuste a bula, a legislacao, as condicoes ' +
  'locais e a avaliacao tecnica responsavel.';

const TABS = [
  { id: 'mapa', label: 'Mapa', component: Mapa },
  { id: 'fatores', label: 'Fatores', component: Fatores },
  { id: 'lab', label: 'Lab', component: Lab },
  { id: 'wiki', label: 'Wiki', component: Wiki },
];

export default function App() {
  const [tab, setTab] = useState('mapa');
  const Active = (TABS.find((item) => item.id === tab) ?? TABS[0]).component;

  return (
    <div className="app">
      <header className="app__header">
        <h1>RizoWiki 2.0</h1>
        <p className="app__tagline">
          Apoio a decisao sobre bioinsumos e rizosfera - descritivo e explicavel.
        </p>
        <p className="app__phase" role="status">
          Fase 1 - compatibilityEngine implementado. Demais motores e telas seguem como placeholders.
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
        <Active />
      </main>

      <footer className="app__footer">
        <p>{DISCLAIMER}</p>
      </footer>
    </div>
  );
}
