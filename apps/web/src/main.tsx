import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { trackPointer } from './design/pointer';
import { trackScrollbar } from './design/scrollbar';
import './i18n';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing from index.html');

trackScrollbar();
trackPointer();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
