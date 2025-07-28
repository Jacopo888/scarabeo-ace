import { createRoot } from 'react-dom/client'
import { DictionaryProvider } from './contexts/DictionaryContext'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <DictionaryProvider>
    <App />
  </DictionaryProvider>
);
