import CustomBreadcrumbs from '../Components/CustomBreadCrumb';
import { Card } from '../ui/misc';
import { formatCurrency } from '../utils/formatCurrency';
import { COSTO_DELIVERY, TIENDA } from '../config/tienda';

// BORRADORES: deben ser revisados por la empresa / asesoría legal antes de publicar
const CONTENIDO = {
  terminos: {
    titulo: 'Términos y condiciones',
    secciones: [
      ['Generalidades', `Este sitio es operado por ${TIENDA.razonSocial}. Al realizar un pedido aceptás estos términos. Los precios están expresados en guaraníes e incluyen IVA.`],
      ['Pedidos', 'Todo pedido queda sujeto a confirmación de stock y de pago. Nos reservamos el derecho de cancelar pedidos con datos incompletos o inconsistentes; en ese caso se devuelve el importe abonado.'],
      ['Precios', 'Los precios pueden modificarse sin previo aviso. Se respeta el precio vigente al momento de confirmar el pedido.'],
      ['Medicamentos', 'Los medicamentos de venta bajo receta sólo se entregan contra presentación de la receta médica correspondiente. La información publicada no reemplaza la consulta con un profesional de la salud.'],
      ['Facturación', 'La factura se emite con los datos ingresados en el checkout. Verificá que la cédula o RUC sea correcta.'],
    ],
  },
  privacidad: {
    titulo: 'Política de privacidad',
    secciones: [
      ['Datos que recolectamos', 'Nombre, apellido, email, teléfono, documento y dirección de entrega, exclusivamente para procesar y entregar tus pedidos.'],
      ['Uso de los datos', 'Usamos tus datos para gestionar pedidos, emitir facturas y comunicarnos con vos sobre tu compra. No los vendemos ni compartimos con terceros, salvo obligación legal.'],
      ['Almacenamiento local', 'El carrito, tus favoritos y los datos del último pedido se guardan en tu navegador para hacer más rápida la próxima compra. Podés borrarlos limpiando los datos del sitio.'],
      ['Tus derechos', 'Podés solicitar el acceso, corrección o eliminación de tus datos escribiéndonos por WhatsApp.'],
    ],
  },
  envios: {
    titulo: 'Envíos y devoluciones',
    secciones: [
      ['Retiro en sucursal', 'Sin costo. Te avisamos por WhatsApp cuando tu pedido esté listo. Presentá tu número de pedido y documento.'],
      ['Delivery', `Costo de envío: ${formatCurrency(COSTO_DELIVERY)}. Cobertura y tiempos de entrega se coordinan al confirmar el pedido.`],
      ['Cambios y devoluciones', 'Por razones sanitarias, los medicamentos y productos de higiene abiertos no admiten devolución. Si recibiste un producto dañado o equivocado, avisanos dentro de las 48 horas.'],
    ],
    faq: [
      ['¿Cuándo preparan mi pedido?', 'Una vez confirmado el pago (o al confirmar el pedido si pagás al recibir).'],
      ['¿Puedo comprar medicamentos con receta?', 'Sí. Envianos la foto de la receta por WhatsApp y presentá el original al retirar o recibir.'],
      ['¿Cómo sigo mi pedido?', 'En "Seguí tu pedido" con tu número de pedido y email.'],
    ],
  },
};

export default function LegalPage({ tipo }) {
  const pagina = CONTENIDO[tipo];

  return (
    <div className="container-page max-w-3xl pt-6">
      <title>{`${pagina.titulo} · Farmashop`}</title>
      <CustomBreadcrumbs items={[{ label: pagina.titulo }]} />
      <h1 className="mt-5 mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl">{pagina.titulo}</h1>

      <Card className="space-y-8 p-6 sm:p-10">
        {pagina.secciones.map(([titulo, texto]) => (
          <section key={titulo}>
            <h2 className="text-lg font-bold">{titulo}</h2>
            <p className="mt-2 leading-relaxed text-ink-600">{texto}</p>
          </section>
        ))}

        {pagina.faq && (
          <section id="preguntas" className="scroll-mt-40 border-t border-ink-100 pt-8">
            <h2 className="mb-4 text-lg font-bold">Preguntas frecuentes</h2>
            <div className="divide-y divide-ink-100">
              {pagina.faq.map(([pregunta, respuesta]) => (
                <details key={pregunta} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink-900">
                    {pregunta}
                    <span className="text-xl text-brand-500 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-ink-600">{respuesta}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </Card>
    </div>
  );
}
