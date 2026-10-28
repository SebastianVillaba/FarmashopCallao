import { CreditCard, ShieldCheck, Store, Truck } from 'lucide-react';

const BENEFICIOS = [
  { icono: Truck, titulo: 'Delivery a domicilio', texto: 'Recibí tu pedido en tu casa', tono: 'bg-leaf-50 text-leaf-600' },
  { icono: Store, titulo: 'Retiro gratis', texto: 'En cualquiera de nuestras sucursales', tono: 'bg-sky-50 text-sky-600' },
  { icono: CreditCard, titulo: 'Pagá como quieras', texto: 'Transferencia, QR o al recibir', tono: 'bg-brand-50 text-brand-600' },
  { icono: ShieldCheck, titulo: 'Atención profesional', texto: 'Farmacéuticos a tu disposición', tono: 'bg-ink-100 text-ink-700' },
];

export default function Beneficios() {
  return (
    <section className="grid grid-cols-2 gap-3 rounded-3xl border border-ink-100 bg-white p-4 shadow-card sm:gap-6 sm:p-6 lg:grid-cols-4">
      {BENEFICIOS.map(({ icono: Icono, titulo, texto, tono }) => (
        <div key={titulo} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tono}`}>
            <Icono className="h-6 w-6" strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">{titulo}</p>
            <p className="text-xs text-ink-500 sm:text-sm">{texto}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
