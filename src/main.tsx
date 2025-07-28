import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { DictionaryProvider } from './contexts/DictionaryContext'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light">
    <DictionaryProvider>
      <App />
    </DictionaryProvider>
  </ThemeProvider>
);
