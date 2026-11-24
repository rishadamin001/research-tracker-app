import './app/schema-policy';
import { createRoot } from 'react-dom/client';
import Atlas from './components/workspace/Atlas';
import { initAppInstall } from './lib/appInstall';
import './app/globals.css';
import './app/workspace.css';
import './app/polish.css';
import './components/workspace/beginner-entry.css';
import './app/interface.css';

initAppInstall();
createRoot(document.getElementById('root')!).render(<Atlas />);
