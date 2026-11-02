import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import InventoryPage from './pages/InventoryPage';
import StockHistoryPage from './pages/StockHistoryPage';
import CategoriesPage from './pages/CategoriesPage';
import { InventoryProvider } from './hooks/useInventoryData';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <InventoryProvider>
        <div className="app-shell">
          <Sidebar />
          <div className="main-content">
            <Routes>
              <Route path="/"              element={<Overview />} />
              <Route path="/inventory"     element={<InventoryPage />} />
              <Route path="/stock-history" element={<StockHistoryPage />} />
              <Route path="/categories"    element={<CategoriesPage />} />
              <Route path="*"              element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </InventoryProvider>
    </BrowserRouter>
  );
}

export default App;
