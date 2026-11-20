import { useCallback, useEffect, useState } from 'react';
import { Loader2, Lock, Pencil, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../ui/Button';
import { Input, Select } from '../../ui/Field';
import { Card } from '../../ui/misc';
import { api, mensajeError } from '../../lib/api';
import { cn } from '../../lib/cn';
import Modal from '../components/Modal';
import { Cargando, Encabezado, Toggle, fechaHora } from '../components/ui';
import { useSesion } from '../sesion';

const nombreCompleto = (u) => [u.nombre, u.apellido].filter(Boolean).join(' ') || u.nick;

function FormNuevo({ onCreado }) {
  const [candidatos, setCandidatos] = useState(null);
  const [idUsuario, setIdUsuario] = useState('');
  const [rol, setRol] = useState('editor');
  const [password, setPassword] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/admin/usuarios/candidatos')
      .then(({ data }) => setCandidatos(data.respuesta))
      .catch((err) => toast.error(mensajeError(err)));
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post('/admin/usuarios', { idUsuario: Number(idUsuario), rol, password });
      toast.success('Usuario habilitado');
      onCreado();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  if (!candidatos) return <Cargando className="min-h-40" />;

  return (
    <form onSubmit={crear} className="space-y-4 p-5">
      <Select label="Usuario del sistema (ERP)" value={idUsuario} onChange={(e) => setIdUsuario(e.target.value)} required>
        <option value="">Elegí un usuario…</option>
        {candidatos.map((c) => (
          <option key={c.idUsuario} value={c.idUsuario}>{c.nick} — {nombreCompleto(c)}{c.grupo ? ` (${c.grupo})` : ''}</option>
        ))}
      </Select>
      <Select label="Rol" value={rol} onChange={(e) => setRol(e.target.value)}>
        <option value="editor">Editor: productos, banners, temática, pedidos y estadísticas</option>
        <option value="admin">Administrador: además gestiona usuarios</option>
      </Select>
      <Input label="Contraseña del panel" type="password" autoComplete="new-password" hint="Mínimo 8 caracteres. Es independiente de la clave del ERP." value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      <Button type="submit" className="w-full" disabled={guardando || !idUsuario || password.length < 8}>
        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Habilitar acceso
      </Button>
    </form>
  );
}

function FormEditar({ usuario, esYo, onGuardado }) {
  const [rol, setRol] = useState(usuario.rol);
  const [activo, setActivo] = useState(usuario.activo);
  const [password, setPassword] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.put(`/admin/usuarios/${usuario.idUsuarioWeb}`, { rol, activo, password });
      toast.success('Usuario actualizado');
      onGuardado();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-4 p-5">
      <p className="text-sm text-ink-600"><strong>{usuario.nick}</strong> — {nombreCompleto(usuario)}</p>
      <Select label="Rol" value={rol} onChange={(e) => setRol(e.target.value)} disabled={esYo}>
        <option value="editor">Editor</option>
        <option value="admin">Administrador</option>
      </Select>
      <Toggle checked={activo} onChange={setActivo} disabled={esYo} label="Acceso habilitado" descripcion="Si se desactiva, se cierra su sesión en el próximo pedido al servidor." />
      <Input label="Nueva contraseña (opcional)" type="password" autoComplete="new-password" hint="Dejalo vacío para no cambiarla. También desbloquea al usuario." value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} />
      <Button type="submit" className="w-full" disabled={guardando || (password && password.length < 8)}>
        {guardando && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
      </Button>
    </form>
  );
}

export default function UsuariosPage() {
  const { usuario: yo } = useSesion();
  const [usuarios, setUsuarios] = useState(null);
  const [nuevo, setNuevo] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(() =>
    api.get('/admin/usuarios').then(({ data }) => setUsuarios(data.respuesta)).catch((err) => toast.error(mensajeError(err))), []);

  useEffect(() => { cargar(); }, [cargar]);

  if (!usuarios) return <Cargando />;

  return (
    <>
      <Encabezado titulo="Usuarios del panel" descripcion="Sólo pueden ingresar usuarios del sistema (ERP) habilitados acá. Si un usuario se desactiva en el ERP, pierde el acceso automáticamente.">
        <Button onClick={() => setNuevo(true)}><UserPlus className="h-4 w-4" /> Habilitar usuario</Button>
      </Encabezado>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ink-100 text-xs text-ink-500 uppercase">
            <tr>
              <th className="px-5 py-3 font-semibold">Usuario</th>
              <th className="px-5 py-3 font-semibold">Rol</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold">Último ingreso</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {usuarios.map((u) => {
              const bloqueado = u.bloqueadoHasta && new Date(u.bloqueadoHasta) > new Date();
              const habilitado = u.activo && u.activoErp;
              return (
                <tr key={u.idUsuarioWeb}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-ink-900">{nombreCompleto(u)}</p>
                    <p className="text-xs text-ink-500">{u.nick}</p>
                  </td>
                  <td className="px-5 py-3">{u.rol === 'admin' ? 'Administrador' : 'Editor'}</td>
                  <td className="px-5 py-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', habilitado && !bloqueado ? 'bg-leaf-50 text-leaf-700' : 'bg-red-50 text-red-700')}>
                      {bloqueado && <Lock className="h-3 w-3" />}
                      {bloqueado ? 'Bloqueado' : !u.activoErp ? 'Inactivo en ERP' : u.activo ? 'Activo' : 'Desactivado'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-ink-600">{fechaHora(u.ultimoLogin)}</td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditando(u)}><Pencil className="h-4 w-4" /> Editar</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={nuevo} onOpenChange={setNuevo} title="Habilitar usuario">
        {nuevo && <FormNuevo onCreado={() => { setNuevo(false); cargar(); }} />}
      </Modal>
      <Modal open={Boolean(editando)} onOpenChange={(v) => !v && setEditando(null)} title="Editar usuario">
        {editando && (
          <FormEditar
            usuario={editando}
            esYo={editando.idUsuarioWeb === yo?.idUsuarioWeb}
            onGuardado={() => { setEditando(null); cargar(); }}
          />
        )}
      </Modal>
    </>
  );
}
