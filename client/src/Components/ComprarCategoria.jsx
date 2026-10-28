import { Link } from 'react-router-dom';
import DepartamentoIcono from './DepartamentoIcono';
import { Skeleton } from '../ui/misc';
import useCategorias from '../hooks/useCategorias';

// Accesos directos a los departamentos
export default function ComprarCategoria() {
  const { departamentos, cargando } = useCategorias();

  return (
    <section>
      <h2 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">Comprá por categoría</h2>
      <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-10">
        {cargando
          ? Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-32 w-28 shrink-0 rounded-3xl sm:w-auto" />)
          : departamentos.map((d) => (
            <Link
              key={d.slug}
              to={`/catalogo?depto=${d.slug}`}
              className="group flex w-28 shrink-0 flex-col items-center gap-3 rounded-3xl border border-ink-100 bg-white p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover sm:w-auto"
            >
              <DepartamentoIcono departamento={d} className="h-14 w-14 transition group-hover:scale-110" iconClassName="h-7 w-7" />
              <span className="text-[13px] leading-tight font-semibold text-ink-800">{d.nombre}</span>
            </Link>
          ))}
      </div>
    </section>
  );
}
