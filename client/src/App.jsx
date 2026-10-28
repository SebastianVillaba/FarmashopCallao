import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import MainLayout from './Layouts/MainLayout'
import HomePage from './Pages/HomePage'
import CatalogoPage from './Pages/CatalogoPage'
import DetalleProducto from './Pages/DetalleProducto'
import CartPage from './Pages/CartPage'
import NotFound from './Pages/NotFound'

// Páginas que no hacen falta en la primera carga
const CheckoutPage = lazy(() => import('./Pages/CheckoutPage'))
const PedidoPage = lazy(() => import('./Pages/PedidoPage'))
const SucursalesPage = lazy(() => import('./Pages/SucursalesPage'))
const LegalPage = lazy(() => import('./Pages/LegalPage'))
const FavoritosPage = lazy(() => import('./Pages/FavoritosPage'))

const Cargando = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Cargando />}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route element={<MainLayout />}>
          {/*RUTA HOME PAGE*/}
          <Route path='/home' element={<HomePage />} />
          {/* RUTAS DE PRODUCTOS */}
          <Route path='/catalogo' element={<CatalogoPage />} />
          <Route path='/detalle/:id/:slug?' element={<DetalleProducto />} />
          <Route path='/favoritos' element={<FavoritosPage />} />
          <Route path='/cart' element={<CartPage />} />
          {/* RUTAS DE PEDIDOS */}
          <Route path='/pedido' element={<PedidoPage />} />
          <Route path='/pedido/:nro' element={<PedidoPage />} />
          {/* RUTAS INSTITUCIONALES */}
          <Route path='/sucursales' element={<SucursalesPage />} />
          <Route path='/terminos' element={<LegalPage key="terminos" tipo="terminos" />} />
          <Route path='/privacidad' element={<LegalPage key="privacidad" tipo="privacidad" />} />
          <Route path='/envios-y-devoluciones' element={<LegalPage key="envios" tipo="envios" />} />
        </Route>

        {/* El checkout tiene su propio encabezado, sin distracciones */}
        <Route path='/checkout' element={<CheckoutPage />} />

        {/* 404 Not Found */}
        <Route path='*' element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
