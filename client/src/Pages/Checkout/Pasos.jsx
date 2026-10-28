import { useFormContext, useWatch } from 'react-hook-form';
import { Banknote, CreditCard, MapPin, QrCode, Store, Truck } from 'lucide-react';
import { Input, Select, Textarea } from '../../ui/Field';
import { formatCurrency } from '../../utils/formatCurrency';
import { CIUDADES_DELIVERY, COSTO_DELIVERY, METODOS_PAGO, SUCURSALES } from '../../config/tienda';

const ICONOS_PAGO = { transferencia: Banknote, qr: QrCode, contra_entrega: CreditCard };

// Tarjeta seleccionable que envuelve un radio
function Opcion({ name, value, icono: Icono, titulo, detalle, extra, registrar }) {
  return (
    <label className="group flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-ink-100 bg-white p-4 transition hover:border-ink-200 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/50">
      <input type="radio" value={value} {...registrar(name)} className="peer sr-only" />
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-600 transition group-has-[:checked]:bg-brand-500 group-has-[:checked]:text-white">
        <Icono className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-ink-900">{titulo}</span>
        <span className="block text-sm text-ink-500">{detalle}</span>
      </span>
      {extra && <span className="text-sm font-bold text-ink-900">{extra}</span>}
    </label>
  );
}

export function PasoDatos() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-xl font-bold">Tus datos</h2>
        <p className="mb-5 text-sm text-ink-500">Te contactamos por WhatsApp o email para coordinar tu pedido.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" required autoComplete="given-name" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Apellido" required autoComplete="family-name" error={errors.apellido?.message} {...register('apellido')} />
          <Input label="Email" required type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input label="Celular" required type="tel" autoComplete="tel" placeholder="0981 123 456" error={errors.telefono?.message} {...register('telefono')} />
        </div>
      </section>
      <section>
        <h2 className="mb-1 text-xl font-bold">Datos para la factura</h2>
        <p className="mb-5 text-sm text-ink-500">Si no necesitás factura a nombre de una empresa, usá tu número de cédula.</p>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Input label="Cédula o RUC" required inputMode="numeric" error={errors.documento?.message} {...register('documento')} />
          <Input label="DV" maxLength={2} inputMode="numeric" hint="Sólo RUC" error={errors.dv?.message} {...register('dv')} />
          <Input label="Razón social" className="sm:col-span-2" hint="Opcional" error={errors.razonSocial?.message} {...register('razonSocial')} />
        </div>
      </section>
    </div>
  );
}

export function PasoEntrega() {
  const { register, control, formState: { errors } } = useFormContext();
  const metodo = useWatch({ control, name: 'metodoEnvio' });
  const idSucursal = useWatch({ control, name: 'idSucursal' });
  const sucursal = SUCURSALES.find((s) => String(s.id) === String(idSucursal));

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-5 text-xl font-bold">¿Cómo querés recibir tu pedido?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Opcion name="metodoEnvio" value="retiro" icono={Store} titulo="Retiro en sucursal" detalle="Listo en el día" extra={<span className="text-leaf-600">Gratis</span>} registrar={register} />
          <Opcion name="metodoEnvio" value="delivery" icono={Truck} titulo="Delivery" detalle="Lo llevamos a tu casa" extra={formatCurrency(COSTO_DELIVERY)} registrar={register} />
        </div>
      </section>

      {metodo === 'retiro' ? (
        <section className="space-y-4">
          <Select label="Sucursal" required error={errors.idSucursal?.message} {...register('idSucursal')}>
            <option value="">Elegí una sucursal</option>
            {SUCURSALES.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </Select>
          {sucursal && (
            <div className="overflow-hidden rounded-2xl border border-ink-100">
              <iframe
                title={`Ubicación de ${sucursal.nombre}`}
                src={`https://maps.google.com/maps?q=${sucursal.coords.lat},${sucursal.coords.lng}&z=16&output=embed`}
                className="h-56 w-full border-0"
                loading="lazy"
              />
              <p className="flex items-center gap-2 bg-ink-50 px-4 py-3 text-sm text-ink-600">
                <MapPin className="h-4 w-4 text-brand-500" /> {sucursal.direccion} · {sucursal.horario}
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          <Input label="Calle principal y número" required className="sm:col-span-2" autoComplete="address-line1" error={errors.calle?.message} {...register('calle')} />
          <Input label="Entre / esquina" placeholder="Ej: casi Mcal. López" error={errors.calleSecundaria?.message} {...register('calleSecundaria')} />
          <Select label="Ciudad" required error={errors.ciudad?.message} {...register('ciudad')}>
            <option value="">Elegí la ciudad</option>
            {CIUDADES_DELIVERY.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Referencia" className="sm:col-span-2" placeholder="Ej: casa de rejas verdes, frente a la plaza" error={errors.referencia?.message} {...register('referencia')} />
        </section>
      )}

      <Textarea label="Observaciones" hint="Opcional" placeholder="Horario preferido, indicaciones, etc." error={errors.observacion?.message} {...register('observacion')} />
    </div>
  );
}

export function PasoPago() {
  const { register, formState: { errors } } = useFormContext();
  return (
    <section>
      <h2 className="mb-1 text-xl font-bold">¿Cómo vas a pagar?</h2>
      <p className="mb-5 text-sm text-ink-500">Al confirmar te mostramos las instrucciones de pago.</p>
      <div className="space-y-3">
        {METODOS_PAGO.map((m) => (
          <Opcion key={m.id} name="metodoPago" value={m.id} icono={ICONOS_PAGO[m.id]} titulo={m.titulo} detalle={m.detalle} registrar={register} />
        ))}
      </div>
      {errors.metodoPago && <p className="mt-3 text-sm font-medium text-red-600">{errors.metodoPago.message}</p>}
    </section>
  );
}

function Bloque({ titulo, onEditar, children }) {
  return (
    <div className="rounded-2xl bg-ink-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wide text-ink-500 uppercase">{titulo}</h3>
        <button type="button" onClick={onEditar} className="cursor-pointer text-sm font-semibold text-brand-600 hover:underline">Editar</button>
      </div>
      <div className="text-sm leading-relaxed text-ink-800">{children}</div>
    </div>
  );
}

export function PasoRevision({ irAPaso }) {
  const { getValues } = useFormContext();
  const d = getValues();
  const sucursal = SUCURSALES.find((s) => String(s.id) === String(d.idSucursal));
  const pago = METODOS_PAGO.find((m) => m.id === d.metodoPago);

  return (
    <section>
      <h2 className="mb-5 text-xl font-bold">Revisá tu pedido</h2>
      <div className="space-y-3">
        <Bloque titulo="Datos" onEditar={() => irAPaso(0)}>
          <p className="font-semibold">{d.nombre} {d.apellido}</p>
          <p>{d.email} · {d.telefono}</p>
          <p className="text-ink-500">Factura: {d.razonSocial || `${d.nombre} ${d.apellido}`} · {d.documento}{d.dv ? `-${d.dv}` : ''}</p>
        </Bloque>
        <Bloque titulo="Entrega" onEditar={() => irAPaso(1)}>
          {d.metodoEnvio === 'retiro' ? (
            <p><strong>Retiro en sucursal:</strong> {sucursal?.nombre}</p>
          ) : (
            <p><strong>Delivery:</strong> {d.calle}{d.calleSecundaria ? `, ${d.calleSecundaria}` : ''} — {d.ciudad}{d.referencia ? <><br /><span className="text-ink-500">{d.referencia}</span></> : null}</p>
          )}
          {d.observacion && <p className="mt-1 text-ink-500">“{d.observacion}”</p>}
        </Bloque>
        <Bloque titulo="Pago" onEditar={() => irAPaso(2)}>
          <p className="font-semibold">{pago?.titulo}</p>
        </Bloque>
      </div>
    </section>
  );
}
