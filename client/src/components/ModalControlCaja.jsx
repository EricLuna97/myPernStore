import { API_BASE_URL } from '../config/api';
import { useState, useEffect, useCallback } from 'react';
import { 
  Vault, 
  X, 
  Lock, 
  Unlock, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  ReceiptText 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from 'react-hot-toast';

function ModalControlCaja({ isOpen, onClose, onCajaActualizada }) {
  const [cajaInfo, setCajaInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  // Form apertura
  const [montoInicial, setMontoInicial] = useState('10000');
  
  // Form cierre / arqueo
  const [montoRealCierre, setMontoRealCierre] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [resumenArqueo, setResumenArqueo] = useState(null);

  const cargarEstadoCaja = useCallback(async () => {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/caja/estado`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCajaInfo(data);
      if (data.metricas) {
        setMontoRealCierre(data.metricas.total_esperado_cajon.toString());
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al consultar estado de caja");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      cargarEstadoCaja();
      setResumenArqueo(null);
    }
  }, [isOpen, cargarEstadoCaja]);

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoInicial);
    if (isNaN(monto) || monto < 0) {
      toast.error("Ingrese un monto inicial válido");
      return;
    }

    setProcesando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/caja/abrir`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ monto_inicial: monto })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("¡Caja abierta y turno iniciado! 🟢");
        if (onCajaActualizada) onCajaActualizada();
        cargarEstadoCaja();
      } else {
        toast.error(data.error || "Error al abrir caja");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    } finally {
      setProcesando(false);
    }
  };

  const handleCerrarCaja = async (e) => {
    e.preventDefault();
    const montoReal = parseFloat(montoRealCierre);
    if (isNaN(montoReal) || montoReal < 0) {
      toast.error("Ingrese el monto real contado en el cajón físico");
      return;
    }

    setProcesando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/caja/cerrar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          monto_real_cierre: montoReal,
          observaciones: observaciones.trim()
        })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("¡Caja cerrada y arqueo completado! 🔴");
        setResumenArqueo(data.arqueo);
        if (onCajaActualizada) onCajaActualizada();
      } else {
        toast.error(data.error || "Error al cerrar caja");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    } finally {
      setProcesando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Vault className="h-6 w-6 text-cyan-400" />
            <div>
              <h3 className="font-bold text-foreground text-lg">Control de Caja y Turnos</h3>
              <p className="text-xs text-muted-foreground">Gestión de flujo de efectivo y arqueo comercial</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {cargando ? (
          <div className="py-12 text-center text-muted-foreground">Consultando estado del turno...</div>
        ) : resumenArqueo ? (
          /* ================= RESUMEN DE ARQUEO TRAS CERRAR ================= */
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-xl border border-border text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-foreground text-lg">Arqueo Final de Turno #{resumenArqueo.id}</h4>
              <p className="text-xs text-muted-foreground">El turno ha sido cerrado permanentemente.</p>
            </div>

            <div className="space-y-2 text-xs bg-muted/30 p-4 rounded-xl border border-border">
              <div className="flex justify-between">
                <span>Ventas en Efectivo:</span>
                <span className="font-bold text-foreground">${parseFloat(resumenArqueo.monto_ventas_efectivo).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas Digitales (Tarjeta/Transf):</span>
                <span className="font-bold text-foreground">${parseFloat(resumenArqueo.monto_ventas_otros).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold">
                <span>Efectivo Total Esperado:</span>
                <span>${parseFloat(resumenArqueo.total_esperado).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm">
                <span>Efectivo Físico Contado:</span>
                <span className="text-cyan-400">${parseFloat(resumenArqueo.monto_real_cierre).toLocaleString()}</span>
              </div>

              {/* Diferencia */}
              <div className={`flex justify-between font-extrabold text-sm pt-2 border-t border-border ${
                parseFloat(resumenArqueo.diferencia) === 0 ? 'text-emerald-400' :
                parseFloat(resumenArqueo.diferencia) > 0 ? 'text-amber-400' : 'text-red-400'
              }`}>
                <span>Balance (Diferencia):</span>
                <span>
                  {parseFloat(resumenArqueo.diferencia) === 0 ? "✓ Exacto ($0)" :
                   parseFloat(resumenArqueo.diferencia) > 0 ? `+ Sobrante: $${parseFloat(resumenArqueo.diferencia).toLocaleString()}` :
                   `- Faltante: $${parseFloat(resumenArqueo.diferencia).toLocaleString()}`}
                </span>
              </div>
            </div>

            <Button onClick={() => { setResumenArqueo(null); cargarEstadoCaja(); }} className="w-full font-bold">
              Entendido / Cerrar
            </Button>
          </div>
        ) : !cajaInfo?.abierto ? (
          /* ================= APERTURA DE CAJA ================= */
          <form onSubmit={handleAbrirCaja} className="space-y-4">
            <div className="p-4 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-center space-y-2">
              <Lock className="h-8 w-8 text-amber-400 mx-auto" />
              <h4 className="font-bold text-foreground text-base">La Caja está Cerrada</h4>
              <p className="text-xs text-muted-foreground">
                Para comenzar a facturar y registrar movimientos, ingresa el dinero físico con el que arranca el cajero su turno.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                💵 Efectivo Inicial en Cajón (Fondo de Cambio - $)
              </label>
              <Input
                type="number"
                step="any"
                min="0"
                value={montoInicial}
                onChange={(e) => setMontoInicial(e.target.value)}
                placeholder="Ej: 10000"
                required
                className="text-lg font-bold text-cyan-400 bg-background"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              {[5000, 10000, 15000, 20000].map((monto) => (
                <button
                  key={monto}
                  type="button"
                  onClick={() => setMontoInicial(monto.toString())}
                  className="px-2.5 py-1 text-xs bg-muted/60 hover:bg-muted rounded border border-border text-foreground font-medium flex-1"
                >
                  ${monto.toLocaleString()}
                </button>
              ))}
            </div>

            <Button 
              type="submit" 
              disabled={procesando} 
              className="w-full font-bold bg-cyan-600 hover:bg-cyan-500 text-white mt-4"
            >
              {procesando ? "Abriendo..." : "🟢 Abrir Caja y Comenzar Turno"}
            </Button>
          </form>
        ) : (
          /* ================= TURNO ACTIVO Y ARQUEO DE CIERRE ================= */
          <div className="space-y-5">
            
            {/* Tarjeta de métricas del turno */}
            <div className="bg-background/80 p-4 rounded-xl border border-border space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Unlock className="h-4 w-4 text-emerald-400" /> Turno Abierto #{cajaInfo.turno.id}
                </span>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  {new Date(cajaInfo.turno.fecha_apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Fondo Inicial</span>
                  <span className="text-base font-bold text-foreground">
                    ${cajaInfo.metricas.monto_inicial.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Ventas en Efectivo</span>
                  <span className="text-base font-bold text-emerald-400">
                    +${cajaInfo.metricas.ventas_efectivo.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Ventas Digitales</span>
                  <span className="text-base font-bold text-blue-400">
                    ${cajaInfo.metricas.ventas_digitales.toLocaleString()}
                  </span>
                </div>

                <div className="p-2.5 bg-muted/40 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Tickets</span>
                  <span className="text-base font-bold text-foreground">
                    {cajaInfo.metricas.cantidad_ventas} operaciones
                  </span>
                </div>
              </div>

              {/* Total Esperado en Cajón */}
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg text-center mt-2">
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider block">
                  Total que debe haber en el cajón de efectivo:
                </span>
                <span className="text-2xl font-extrabold text-cyan-300 block mt-1">
                  ${cajaInfo.metricas.total_esperado_cajon.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Formulario de Cierre y Arqueo Ciego */}
            <form onSubmit={handleCerrarCaja} className="space-y-4 border-t border-border pt-4">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-cyan-400" />
                Hacer Arqueo y Cerrar Turno
              </h4>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  💵 Dinero Físico Real Contado en el Cajón ($)
                </label>
                <Input
                  type="number"
                  step="any"
                  value={montoRealCierre}
                  onChange={(e) => setMontoRealCierre(e.target.value)}
                  placeholder="Cuenta los billetes e ingresa el monto total"
                  required
                  className="text-base font-bold text-foreground bg-background"
                />
              </div>

              {/* Diferencia en vivo */}
              {montoRealCierre !== '' && !isNaN(parseFloat(montoRealCierre)) && (
                <div className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                  parseFloat(montoRealCierre) === cajaInfo.metricas.total_esperado_cajon
                    ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-400'
                    : parseFloat(montoRealCierre) > cajaInfo.metricas.total_esperado_cajon
                    ? 'bg-amber-950/30 border-amber-700/50 text-amber-400'
                    : 'bg-red-950/30 border-red-700/50 text-red-400'
                }`}>
                  <span>Balance calculado:</span>
                  <span>
                    {parseFloat(montoRealCierre) === cajaInfo.metricas.total_esperado_cajon
                      ? "✓ Arqueo Exacto ($0)"
                      : parseFloat(montoRealCierre) > cajaInfo.metricas.total_esperado_cajon
                      ? `Sobrante: +$${(parseFloat(montoRealCierre) - cajaInfo.metricas.total_esperado_cajon).toLocaleString()}`
                      : `Faltante: -$${(cajaInfo.metricas.total_esperado_cajon - parseFloat(montoRealCierre)).toLocaleString()}`}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Observaciones del Arqueo (Opcional)</label>
                <Input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Turno tarde sin novedades, billetes chicos en cambio"
                  className="bg-background text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={procesando}
                className="w-full font-bold bg-red-600 hover:bg-red-500 text-white"
              >
                {procesando ? "Procesando Arqueo..." : "🔴 Realizar Arqueo y Cerrar Turno"}
              </Button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}

export default ModalControlCaja;

