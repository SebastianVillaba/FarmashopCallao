import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { capitalizar } from '../lib/texto';
import { CATEGORIAS_OCULTAS, DEPARTAMENTOS } from '../config/tienda';

// Se consulta una sola vez por sesión
let cache = null;
let pendiente = null;

const cargar = () => {
  if (cache) return Promise.resolve(cache);
  if (!pendiente) {
    pendiente = api.get('/productos/getCategorias')
      .then(({ data }) => {
        cache = agrupar(data.respuesta || []);
        return cache;
      })
      .catch((err) => {
        pendiente = null;
        throw err;
      });
  }
  return pendiente;
};

const agrupar = (categorias) => {
  const ocultas = new Set(CATEGORIAS_OCULTAS);
  const asignadas = new Map();
  DEPARTAMENTOS.forEach((d) => d.categorias.forEach((nombre) => asignadas.set(nombre, d.slug)));

  const departamentos = DEPARTAMENTOS.map((d) => ({ ...d, categorias: [] }));
  const porSlug = Object.fromEntries(departamentos.map((d) => [d.slug, d]));

  for (const c of categorias) {
    const nombreErp = String(c.nombreTipo).trim().toUpperCase();
    if (ocultas.has(nombreErp)) continue;
    const slug = asignadas.get(nombreErp) || 'otros';
    porSlug[slug].categorias.push({ id: c.idTipoProducto, nombre: capitalizar(nombreErp), departamento: slug });
  }

  departamentos.forEach((d) => d.categorias.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
  return departamentos.filter((d) => d.categorias.length);
};

export default function useCategorias() {
  const [departamentos, setDepartamentos] = useState(cache || []);
  const [cargando, setCargando] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let activo = true;
    cargar()
      .then((d) => activo && setDepartamentos(d))
      .catch(() => activo && setDepartamentos([]))
      .finally(() => activo && setCargando(false));
    return () => { activo = false; };
  }, []);

  return { departamentos, cargando };
}

export const buscarCategoria = (departamentos, id) => {
  for (const d of departamentos) {
    const c = d.categorias.find((cat) => String(cat.id) === String(id));
    if (c) return { departamento: d, categoria: c };
  }
  return null;
};
