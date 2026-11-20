import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../ui/Button';
import { Input } from '../../ui/Field';
import { Card } from '../../ui/misc';
import { api, mensajeError } from '../../lib/api';
import { Encabezado } from '../components/ui';

export default function CuentaPage() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [guardando, setGuardando] = useState(false);

  const error = nueva && nueva.length < 8 ? 'Mínimo 8 caracteres' : repetir && repetir !== nueva ? 'Las contraseñas no coinciden' : null;

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.put('/admin/me/password', { actual, nueva });
      toast.success('Contraseña actualizada');
      setActual(''); setNueva(''); setRepetir('');
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Encabezado titulo="Cambiar contraseña" descripcion="La contraseña del panel es independiente de la del sistema (ERP)." />
      <Card className="max-w-md p-6">
        <form onSubmit={guardar} className="space-y-4">
          <Input label="Contraseña actual" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
          <Input label="Nueva contraseña" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required />
          <Input label="Repetir nueva contraseña" type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} error={error} required />
          <Button type="submit" disabled={guardando || !actual || !nueva || nueva !== repetir || Boolean(error)}>
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
          </Button>
        </form>
      </Card>
    </>
  );
}
