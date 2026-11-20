import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SesionProvider from './SesionProvider';
import { useSesion } from './sesion';
import AdminLayout from './AdminLayout';
import LoginPage from './pages/LoginPage';
import { Cargando } from './components/ui';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PedidosPage = lazy(() => import('./pages/PedidosPage'));
const ClientesPage = lazy(() => import('./pages/ClientesPage'));
const ProductosPage = lazy(() => import('./pages/ProductosPage'));
const BannersPage = lazy(() => import('./pages/BannersPage'));
const TemaPage = lazy(() => import('./pages/TemaPage'));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage'));
const CuentaPage = lazy(() => import('./pages/CuentaPage'));

function Protegido({ children, rol }) {
  const { usuario, cargando } = useSesion();
  const location = useLocation();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/admin/login" replace state={{ desde: location.pathname }} />;
  if (rol && usuario.rol !== rol) return <Navigate to="/admin" replace />;
  return children;
}

export default function AdminApp() {
  return (
    <SesionProvider>
      <title>Panel · Farmashop</title>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<Protegido><AdminLayout /></Protegido>}>
          <Route index element={<Suspense fallback={<Cargando />}><DashboardPage /></Suspense>} />
          <Route path="pedidos" element={<Suspense fallback={<Cargando />}><PedidosPage /></Suspense>} />
          <Route path="clientes" element={<Suspense fallback={<Cargando />}><ClientesPage /></Suspense>} />
          <Route path="productos" element={<Suspense fallback={<Cargando />}><ProductosPage /></Suspense>} />
          <Route path="banners" element={<Suspense fallback={<Cargando />}><BannersPage /></Suspense>} />
          <Route path="tematica" element={<Suspense fallback={<Cargando />}><TemaPage /></Suspense>} />
          <Route path="cuenta" element={<Suspense fallback={<Cargando />}><CuentaPage /></Suspense>} />
          <Route path="usuarios" element={<Protegido rol="admin"><Suspense fallback={<Cargando />}><UsuariosPage /></Suspense></Protegido>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </SesionProvider>
  );
}
