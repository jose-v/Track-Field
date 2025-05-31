import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { PWARefreshButton } from './components/PWARefreshButton';
import { PWAStartupHandler } from './components/PWAStartupHandler';

function App() {
  return (
    <BrowserRouter>
      <PWAStartupHandler />
      <AppRoutes />
      <PWARefreshButton />
    </BrowserRouter>
  );
}

export default App;
