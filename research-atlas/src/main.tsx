import { createRoot } from 'react-dom/client';
import Atlas from './components/Atlas';
import './app/globals.css';
import './app/workspace.css';

createRoot(document.getElementById('root')!).render(<Atlas />);
