import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@aliv/ui/tokens.css';
import '@aliv/ui/accents.css';
import '@aliv/ui/shell.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
