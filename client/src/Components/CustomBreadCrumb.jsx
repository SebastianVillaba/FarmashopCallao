import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// items: [{ label, to? }]; el último se muestra como página actual
export default function CustomBreadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Ruta de navegación" className="scrollbar-none overflow-x-auto">
      <ol className="flex items-center gap-1.5 text-sm whitespace-nowrap text-ink-500">
        <li>
          <Link to="/home" className="flex items-center hover:text-brand-600" aria-label="Inicio">
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, i) => (
          <Fragment key={`${item.label}-${i}`}>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-300" />
            <li>
              {item.to && i < items.length - 1 ? (
                <Link to={item.to} className="hover:text-brand-600">{item.label}</Link>
              ) : (
                <span className="font-medium text-ink-800" aria-current="page">{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
