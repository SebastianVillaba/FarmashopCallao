import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux'
import { Toaster } from 'sonner';
import App from './App.jsx';
import ConfigProvider from './context/ConfigProvider';
import CuentaProvider from './context/CuentaProvider';
import { store } from './redux/store.js'
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ConfigProvider>
        <CuentaProvider>
          <App />
        </CuentaProvider>
      </ConfigProvider>
      <Toaster position="top-center" richColors closeButton toastOptions={{ className: 'font-sans' }} />
    </Provider>
  </StrictMode>
);
