import { BrowserRouter, Route, Routes } from 'react-router-dom'
import BarLayout from './Layouts/MainLayout'
import HomePage from './Pages/HomePage'
import CatalogoPage from './Pages/CatalogoPage' 
import DetalleProducto from './Pages/DetalleProducto'
import CartPage from './Pages/CartPage'
import CheckoutPage from './Pages/CheckoutPage'

function App() {    
  return (     
    <>       
      <BrowserRouter>
        <Routes>           
          <Route path='/' element={<BarLayout />}>
            {/*RUTA HOME PAGE*/}             
            <Route path='/home' element={<HomePage />} />
            {/* RUTAS DE PRODUCTOS */}
            <Route path='/catalogo' element={<CatalogoPage />} />
            <Route path='/detalle/:id/:slug' element={<DetalleProducto />} />
            <Route path='/cart' element={<CartPage />} />
            <Route path='/checkout' element={<CheckoutPage />} />
          </Route>
        </Routes>       
      </BrowserRouter>     
    </>   
  )
}

export default App