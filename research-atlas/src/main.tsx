import { createRoot } from 'react-dom/client';
import Atlas from './components/Atlas';
import { initAppInstall } from './lib/appInstall';
import './app/globals.css';
import './app/workspace.css';
import './app/polish.css';
import './components/beginner-entry.css';

initAppInstall();
createRoot(document.getElementById('root')!).render(<Atlas />);
