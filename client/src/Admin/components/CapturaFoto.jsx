import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, Info, Loader2, RefreshCw, RotateCcw, SunMedium } from 'lucide-react';
import Button from '../../ui/Button';
import { Select } from '../../ui/Field';
import { cn } from '../../lib/cn';

const CLAVE_CAMARA = 'fs_admin_camara';
const LADO_MAX = 1600;
// Capturadoras HDMI / utilidades webcam de cámaras profesionales: se prefieren a la webcam de la notebook
const EXTERNA = /hdmi|capture|captura|usb video|cam link|nikon|canon|sony|fujifilm|elgato|uvc/i;

const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin storage */ } };

const mensajeErrorCamara = (err) => {
  if (!navigator.mediaDevices?.getUserMedia) return 'El navegador no permite usar la cámara en esta página. El panel tiene que abrirse con HTTPS (o desde localhost).';
  switch (err?.name) {
    case 'NotAllowedError': return 'Se bloqueó el permiso de la cámara. Habilitalo desde el candado de la barra de direcciones.';
    case 'NotFoundError': return 'No se encontró ninguna cámara conectada.';
    case 'NotReadableError': return 'La cámara está siendo usada por otro programa (cerrá Zoom, Teams, OBS, etc.).';
    case 'OverconstrainedError': return 'La cámara elegida no soporta la resolución pedida.';
    default: return 'No se pudo iniciar la cámara.';
  }
};

// Captura de fotos de producto desde una webcam o una cámara profesional conectada por
// capturadora HDMI-USB (Windows la ve como una webcam más). Recorta en cuadrado.
export default function CapturaFoto({ onCaptura, enviando }) {
  const video = useRef(null);
  const stream = useRef(null);
  const [dispositivos, setDispositivos] = useState([]);
  const [deviceId, setDeviceId] = useState(leer(CLAVE_CAMARA) || ''); // cámara pedida
  const [activa, setActiva] = useState(''); // cámara que realmente está transmitiendo
  const [estado, setEstado] = useState('iniciando'); // iniciando | listo | error | capturada
  const [error, setError] = useState(null);
  const [resolucion, setResolucion] = useState(null);
  const [captura, setCaptura] = useState(null); // { blob, url }
  const [brillo, setBrillo] = useState(100);

  const detener = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  const iniciar = useCallback(async (id) => {
    detener();
    setEstado('iniciando');
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('inseguro');
      const s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...(id ? { deviceId: { exact: id } } : {}),
          width: { ideal: 3840 },
          height: { ideal: 2160 },
        },
      });
      stream.current = s;

      // Con el permiso concedido ya se pueden leer los nombres de las cámaras
      const lista = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
      setDispositivos(lista);
      const actual = s.getVideoTracks()[0];
      const ajustes = actual.getSettings();
      setResolucion(ajustes.width && ajustes.height ? `${ajustes.width}×${ajustes.height}` : null);
      setActiva(ajustes.deviceId || '');

      // Primera vez: si hay una cámara externa, cambiar a ella
      if (!id) {
        const externa = lista.find((d) => EXTERNA.test(d.label));
        if (externa && externa.deviceId !== ajustes.deviceId) {
          setDeviceId(externa.deviceId);
          return;
        }
      }

      if (video.current) {
        video.current.srcObject = s;
        await video.current.play().catch(() => {});
      }
      setEstado('listo');
    } catch (err) {
      // La cámara guardada puede haberse desconectado: reintentar con la predeterminada
      if (id && (err?.name === 'OverconstrainedError' || err?.name === 'NotFoundError')) {
        guardar(CLAVE_CAMARA, '');
        setDeviceId('');
        return;
      }
      setError(mensajeErrorCamara(err));
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    iniciar(deviceId);
    return detener;
  }, [deviceId, iniciar]);

  useEffect(() => () => captura && URL.revokeObjectURL(captura.url), [captura]);

  const elegirCamara = (id) => {
    guardar(CLAVE_CAMARA, id);
    setDeviceId(id);
  };

  const capturar = () => {
    const v = video.current;
    if (!v?.videoWidth) return;
    const lado = Math.min(v.videoWidth, v.videoHeight);
    const salida = Math.min(lado, LADO_MAX);
    const canvas = document.createElement('canvas');
    canvas.width = salida;
    canvas.height = salida;
    const ctx = canvas.getContext('2d');
    ctx.filter = `brightness(${brillo}%)`;
    ctx.drawImage(v, (v.videoWidth - lado) / 2, (v.videoHeight - lado) / 2, lado, lado, 0, 0, salida, salida);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setCaptura({ blob, url: URL.createObjectURL(blob) });
      setEstado('capturada');
    }, 'image/jpeg', 0.92);
  };

  const repetir = () => {
    setCaptura(null);
    setEstado('listo');
  };

  const usar = async () => {
    if (!captura) return;
    const ok = await onCaptura(new File([captura.blob], 'captura.jpg', { type: 'image/jpeg' }));
    if (ok !== false) repetir();
  };

  return (
    <div className="space-y-4 p-5">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-ink-900">
        <video
          ref={video}
          playsInline
          muted
          className={cn('absolute inset-0 h-full w-full object-cover', estado === 'capturada' && 'invisible')}
          style={{ filter: `brightness(${brillo}%)` }}
        />
        {captura && <img src={captura.url} alt="Foto capturada" className="absolute inset-0 h-full w-full object-cover" />}

        {/* Guías de encuadre (tercios + margen de seguridad) */}
        {estado === 'listo' && (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-[8%] rounded-xl border-2 border-dashed border-white/60" />
            <div className="absolute inset-y-0 left-1/3 w-px bg-white/20" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white/20" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-white/20" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white/20" />
          </div>
        )}

        {estado === 'iniciando' && (
          <div className="absolute inset-0 grid place-items-center text-white/80"><Loader2 className="h-8 w-8 animate-spin" /></div>
        )}
        {estado === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white">
            <Camera className="h-8 w-8 text-white/60" />
            <p>{error}</p>
            <Button size="sm" variant="outline" onClick={() => iniciar(deviceId)}><RefreshCw className="h-4 w-4" /> Reintentar</Button>
          </div>
        )}
        {resolucion && estado === 'listo' && (
          <span className="absolute top-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white">{resolucion}</span>
        )}
      </div>

      {estado === 'capturada' ? (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={repetir} disabled={enviando}><RotateCcw className="h-4 w-4" /> Repetir</Button>
          <Button className="flex-1" onClick={usar} disabled={enviando}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Usar esta foto
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Select label="Cámara" value={activa} onChange={(e) => elegirCamara(e.target.value)} disabled={!dispositivos.length}>
              {dispositivos.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Cámara ${i + 1}`}</option>
              ))}
            </Select>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
              <span className="flex items-center gap-1"><SunMedium className="h-4 w-4" /> Brillo {brillo}%</span>
              <input type="range" min="70" max="140" value={brillo} onChange={(e) => setBrillo(Number(e.target.value))} className="h-12 accent-brand-500" />
            </label>
          </div>
          <Button size="lg" className="w-full" onClick={capturar} disabled={estado !== 'listo'}>
            <Camera className="h-5 w-5" /> Sacar foto
          </Button>
          <p className="flex gap-2 rounded-2xl bg-sky-50 p-3 text-xs leading-relaxed text-sky-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Para usar la Nikon COOLPIX B700, conectala por su salida micro-HDMI a una capturadora HDMI-USB y elegila arriba.
              Ocultá la información en pantalla de la cámara (botón DISP) para que no salga en la foto.
              Usá fondo blanco y buena luz pareja; la foto se recorta en cuadrado.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
