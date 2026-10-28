import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import HomeImageSlider from '../Components/HomeImageSlider';
import ComprarCategoria from '../Components/ComprarCategoria';
import ProductosDestacados from '../Components/ProductosDestacados';
import Beneficios from '../Components/Beneficios';
import { WhatsAppLogo } from '../Components/FloatingBubble';
import { buttonClasses } from '../ui/Button';
import { whatsappUrl } from '../lib/texto';
import { TIENDA } from '../config/tienda';

function PromoDermo() {
  return (
    <Link
      to="/catalogo?depto=dermocosmetica"
      className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 to-sky-700 p-7 text-white shadow-card"
    >
      <Sparkles className="absolute top-6 right-6 h-24 w-24 text-white/15 transition duration-500 group-hover:rotate-12" />
      <span className="text-sm font-semibold text-white/80">Dermocosmética</span>
      <h3 className="mt-1 max-w-xs text-2xl font-extrabold text-white">Tu rutina de cuidado facial, completa</h3>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
        Descubrir <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function PromoBebes() {
  return (
    <Link
      to="/catalogo?depto=bebes"
      className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br from-leaf-500 to-leaf-700 p-7 text-white shadow-card"
    >
      <span className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/10 transition duration-500 group-hover:scale-110" />
      <span className="text-sm font-semibold text-white/80">Bebés y maternidad</span>
      <h3 className="mt-1 max-w-xs text-2xl font-extrabold text-white">Pañales, higiene y todo para tu bebé</h3>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
        Ver productos <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function AyudaWhatsapp() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 px-6 py-10 text-white sm:px-12 sm:py-14">
      <span className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
      <span className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-white/5" />
      <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">¿Tenés una receta o no encontrás algo?</h2>
          <p className="mt-3 text-white/85">
            Envianos una foto por WhatsApp y nuestros farmacéuticos te ayudan a armar tu pedido.
          </p>
        </div>
        <a
          href={whatsappUrl(TIENDA.whatsapp, 'Hola! Quiero consultar por un producto / receta.')}
          target="_blank"
          rel="noreferrer"
          className={buttonClasses({ variant: 'whatsapp', size: 'lg', className: 'shadow-lg shadow-black/20' })}
        >
          <WhatsAppLogo className="h-5 w-5" /> Consultar por WhatsApp
        </a>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <title>Farmashop Paraguay · Tu farmacia online</title>
      <div className="container-page space-y-14 pt-6 sm:space-y-20 sm:pt-8">
        <div className="space-y-6">
          <HomeImageSlider />
          <Beneficios />
        </div>
        <ComprarCategoria />
        <ProductosDestacados />
        <div className="grid gap-5 md:grid-cols-2">
          <PromoDermo />
          <PromoBebes />
        </div>
        <AyudaWhatsapp />
      </div>
    </>
  );
}
