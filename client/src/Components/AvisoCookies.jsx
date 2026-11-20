import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import Button from '../ui/Button';
import { useConfig } from '../context/ConfigContext';
import { consentimiento, setConsentimiento } from '../lib/analytics';

// Sólo aparece si Google Analytics está configurado y el visitante todavía no eligió
export default function AvisoCookies() {
  const { ga4Id } = useConfig();
  const [respondido, setRespondido] = useState(() => consentimiento() !== null);

  if (!ga4Id || respondido) return null;

  const responder = (valor) => {
    setConsentimiento(valor);
    setRespondido(true);
  };

  return (
    <div role="dialog" aria-label="Uso de cookies" className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl animate-fade-in rounded-3xl border border-ink-100 bg-white p-5 shadow-pop lg:bottom-6">
      <div className="flex gap-4">
        <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-500 sm:grid">
          <Cookie className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm text-ink-600">
            Usamos cookies de Google Analytics para entender cómo se usa la tienda y mejorarla.
            Podés leer más en nuestra <Link to="/privacidad" className="font-semibold text-brand-600 underline">política de privacidad</Link>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => responder('si')}>Aceptar</Button>
            <Button size="sm" variant="ghost" onClick={() => responder('no')}>Sólo necesarias</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
