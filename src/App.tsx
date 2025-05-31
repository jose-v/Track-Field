import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { PWARefreshButton } from './components/PWARefreshButton';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <PWARefreshButton />
    </BrowserRouter>
  );
}

export default App;
