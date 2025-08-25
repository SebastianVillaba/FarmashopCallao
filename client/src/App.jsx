import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import BarLayout from './Layouts/MainLayout'
import HomePage from './Pages/HomePage'
import CatalogoPage from './Pages/CatalogoPage' 
import DetalleProducto from './Pages/DetalleProducto'
import CartPage from './Pages/CartPage'
import CheckoutPage from './Pages/CheckoutPage'
import AuthLayout from './Layouts/AuthLayout'
import LoginPage from './Pages/Auth/LoginPage'
import RegisterPage from './Pages/Auth/RegisterPage'
import NotFound from './Pages/NotFound'

function App() {    
  return (     
    <>       
      <BrowserRouter>
        <Routes>  
          <Route path="/" element={<Navigate to="/home" replace />} />       
            
          <Route path='/' element={<BarLayout />}>
            {/*RUTA HOME PAGE*/}             
            <Route path='/home' element={<HomePage />} />
            {/* RUTAS DE PRODUCTOS */}
            <Route path='/catalogo' element={<CatalogoPage />} />
            <Route path='/detalle/:id/:slug' element={<DetalleProducto />} />
            <Route path='/cart' element={<CartPage />} />
            <Route path='/checkout' element={<CheckoutPage />} />
          </Route>

          {/* RUTAS DE AUTENTICACIÓN */}
          <Route path='/auth' element={<AuthLayout />}>
            <Route path='/auth/login' element={<LoginPage />} />
            <Route path='/auth/register' element={<RegisterPage />} />
          </Route>

          {/* 404 Not Found */}
          <Route path='*' element={<NotFound />} />
        </Routes>       
      </BrowserRouter>     
    </>   
  )
}

export default App