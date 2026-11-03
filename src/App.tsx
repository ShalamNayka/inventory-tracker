import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import Overview from './pages/Overview';
import InventoryPage from './pages/InventoryPage';
import StockHistoryPage from './pages/StockHistoryPage';
import CategoriesPage from './pages/CategoriesPage';
import LoginPage from './pages/LoginPage';
import { useRole } from './hooks/useRole';
import './App.css';

// Create TanStack Query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSidebarCollapsed } = useRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className={`app-shell ${isSidebarCollapsed ? 'app-shell--collapsed' : 'app-shell--expanded'}`}
    >
      <Sidebar />
      <main className="main-content">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Overview />
              </ProtectedLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/stock-history"
            element={
              <ProtectedLayout>
                <StockHistoryPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedLayout>
                <CategoriesPage />
              </ProtectedLayout>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
