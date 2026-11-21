import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/inter';
import '@fontsource/chakra-petch/400.css';
import '@fontsource/chakra-petch/600.css';
import '@fontsource/chakra-petch/700.css';
import App from './App.tsx';
import './index.css';
import './styles/consola.css';

createRoot(document.getElementById('root')!).render(<App />);
