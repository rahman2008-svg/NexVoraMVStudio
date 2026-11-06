import { lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './styles.css';
import './nexvora.css';
import { initAnalytics } from './analytics';
import { applyPreferences, loadPreferences } from './domain/preferences';
import { Landing } from './landing/Landing';
import { Splash } from './landing/Splash';

// The studio (editor, renderers, exporters) is a separate chunk so the landing page opens fast on phones.
const App = lazy(() => import('./App'));
const enteredKey = 'nexvora-mv-entered';
const wantsStudio = () => location.hash === '#studio';
applyPreferences(loadPreferences());

function Root() {
  const [studio, setStudio] = useState(wantsStudio);
  useEffect(() => { const sync = () => setStudio(wantsStudio()); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync); }, []);
  if (studio) { try { localStorage.setItem(enteredKey, '1'); } catch { /* private mode */ } return <Suspense fallback={<Splash/>}><App/></Suspense>; }
  let returning = false; try { returning = !!localStorage.getItem(enteredKey); } catch { /* private mode */ }
  return <Landing returning={returning} open={() => { location.hash = '#studio'; }}/>;
}

// Single local-first entry point.
initAnalytics();
createRoot(document.getElementById('root')!).render(<Root/>);
