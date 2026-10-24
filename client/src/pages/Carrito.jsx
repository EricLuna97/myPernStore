import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Trash2, 
  Banknote, 
  CreditCard, 
  ArrowLeftRight, 
  Split, 
  CheckCircle2, 
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TicketTermico from '../components/TicketTermico';

function Carrito() {
  const { cart, removeFromCart, decreaseQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  // Estados para el flujo de cobro
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo'); // 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [ventaParaImprimir, setVentaParaImprimir] = useState(null);

  // Estados específicos para pago mixto
  const [mixtoEfectivo, setMixtoEfectivo] = useState('');
  const [mixtoTarjeta, setMixtoTarjeta] = useState('');

  const totalGeneral = cart.reduce((acc, item) => acc + (parseFloat(item.precio_venta) * item.quantity), 0);

  // Abrir modal de cobro y preconfigurar valores
  const abrirModalCobro = () => {
    setMetodoPago('efectivo');
    setMontoEfectivo(totalGeneral.toString());
    setMixtoEfectivo((totalGeneral / 2).toFixed(2));
    setMixtoTarjeta((totalGeneral / 2).toFixed(2));
    setMostrarModalCobro(true);
  };

  // Cálculos dinámicos de vuelto según medio de pago
  const pagaConNumero = parseFloat(montoEfectivo) || 0;
  const vueltoEfectivo = pagaConNumero >= totalGeneral ? pagaConNumero - totalGeneral : 0;
  const faltanteEfectivo = totalGeneral > pagaConNumero ? totalGeneral - pagaConNumero : 0;

  // Cálculos para pago mixto
  const parteEfectivo = parseFloat(mixtoEfectivo) || 0;
  const parteTarjeta = parseFloat(mixtoTarjeta) || 0;
  const sumaMixta = parteEfectivo + parteTarjeta;
  const diferenciaMixta = totalGeneral - sumaMixta;

  // Acceso rápido a billetes comunes
  const agregarBillete = (monto) => {
    setMontoEfectivo(monto.toString());
  };

  const handleFinalizarVenta = async () => {
    // Validaciones de dinero según el método
    if (metodoPago === 'efectivo' && pagaConNumero < totalGeneral) {
      toast.error(`El monto recibido ($${pagaConNumero.toLocaleString()}) es menor al total ($${totalGeneral.toLocaleString()})`);
      return;
    }

    if (metodoPago === 'mixto' && Math.abs(diferenciaMixta) > 0.01) {
      toast.error(`La suma de efectivo y tarjeta ($${sumaMixta.toLocaleString()}) debe coincidir exactamente con el total ($${totalGeneral.toLocaleString()})`);
      return;
    }

    setProcesando(true);

    try {
      const token = localStorage.getItem('token');
      
      // Preparar payload de pago
      let payloadPago = {
        total: totalGeneral,
        items: cart,
        metodo_pago: metodoPago,
        monto_recibido: totalGeneral,
        vuelto: 0,
        detalle_pago: null
      };

      if (metodoPago === 'efectivo') {
        payloadPago.monto_recibido = pagaConNumero;
        payloadPago.vuelto = vueltoEfectivo;
      } else if (metodoPago === 'mixto') {
        payloadPago.monto_recibido = sumaMixta;
        payloadPago.detalle_pago = {
          efectivo: parteEfectivo,
          tarjeta: parteTarjeta
        };
      }

      const response = await fetch('http://localhost:4000/api/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payloadPago)
      });

      const data = await response.json();

      if (response.ok) {
        setMostrarModalCobro(false);
        if (metodoPago === 'efectivo' && vueltoEfectivo > 0) {
          toast.success(`¡Venta completada! Vuelto a entregar: $${vueltoEfectivo.toLocaleString()}`, { duration: 6000 });
        } else {
          toast.success("¡Venta registrada y cobrada con éxito!");
        }

        // Preparamos el objeto para el comprobante térmico
        const datosTicket = {
          id: data.venta_id,
          fecha: new Date().toISOString(),
          vendedor: 'Mostrador',
          total: totalGeneral,
          metodo_pago: payloadPago.metodo_pago,
          monto_recibido: payloadPago.monto_recibido,
          vuelto: payloadPago.vuelto,
          detalle_pago: payloadPago.detalle_pago,
          items: [...cart]
        };

        setVentaParaImprimir(datosTicket);
        clearCart(); 
      } else {
        toast.error("Error: " + (data.error || "No se pudo procesar"));
      }

    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el servidor");
    } finally {
      setProcesando(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 text-center max-w-lg">
        <div className="bg-card p-8 rounded-xl border border-border shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-2">El pedido está vacío 🛒</h2>
          <p className="text-muted-foreground mb-6">Agrega productos desde el catálogo para comenzar una venta.</p>
          <Link to="/">
            <Button className="w-full">🔙 Volver al Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-4xl">
      <div className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-md">
        
        <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Resumen de Pedido
          </h1>
          <span className="text-sm text-muted-foreground font-medium">
            {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {/* LISTA DE PRODUCTOS EN EL PEDIDO */}
        <div className="space-y-3 mb-6">
          {cart.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/60 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex-1 pr-4">
                <h3 className="font-semibold text-foreground text-base">{item.nombre}</h3>
                <span className="text-xs text-muted-foreground">
                  ${parseFloat(item.precio_venta).toLocaleString()} x {item.quantity} u.
                </span>
              </div>

              <div className="text-right pr-6">
                <span className="font-bold text-lg text-cyan-400">
                  ${(item.precio_venta * item.quantity).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => decreaseQuantity(item.id)}
                  className="h-8 w-8 p-0"
                >
                  -
                </Button>
                
                <span className="font-bold text-base w-8 text-center text-foreground">
                  {item.quantity}
                </span>
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeFromCart(item.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div> 
          ))}
        </div>

        {/* PIE Y TOTAL GENERAL */}
        <div className="pt-6 border-t-2 border-dashed border-border/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground block font-semibold">
              Total a Cobrar
            </span>
            <span className="text-3xl font-extrabold text-cyan-400">
              ${totalGeneral.toLocaleString()}
            </span>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              onClick={clearCart}
              variant="outline"
              className="flex-1 sm:flex-initial"
            >
              Cancelar
            </Button>
            
            <Button 
              onClick={abrirModalCobro}
              className="flex-1 sm:flex-initial font-bold text-base px-6 py-5 bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              💵 Cobrar Pedido
            </Button>
          </div>
        </div>

      </div>

      {/* ========================================================
          MODAL PROFESIONAL DE COBRO Y MEDIOS DE PAGO (PUNTO 3)
          ======================================================== */}
      {mostrarModalCobro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 relative">
            
            {/* Header del Modal */}
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">Finalizar Cobro</h3>
                <p className="text-xs text-muted-foreground">Selecciona el método de pago e ingresa el importe</p>
              </div>
              <button 
                onClick={() => setMostrarModalCobro(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Display del Total a Pagar */}
            <div className="bg-background/80 rounded-xl p-4 border border-border text-center mb-5">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total de la Venta</span>
              <div className="text-3xl font-extrabold text-cyan-400 mt-1">
                ${totalGeneral.toLocaleString()}
              </div>
            </div>

            {/* Selector de Medios de Pago */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              <button
                type="button"
                onClick={() => setMetodoPago('efectivo')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                  metodoPago === 'efectivo' 
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-400 shadow-sm' 
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <Banknote className="h-5 w-5 mb-1" />
                Efectivo
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('tarjeta')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                  metodoPago === 'tarjeta' 
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-400 shadow-sm' 
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <CreditCard className="h-5 w-5 mb-1" />
                Tarjeta
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('transferencia')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                  metodoPago === 'transferencia' 
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-400 shadow-sm' 
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <ArrowLeftRight className="h-5 w-5 mb-1" />
                Transf.
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('mixto')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all ${
                  metodoPago === 'mixto' 
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-400 shadow-sm' 
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <Split className="h-5 w-5 mb-1" />
                Mixto
              </button>
            </div>

            {/* ================= OPCIÓN: EFECTIVO ================= */}
            {metodoPago === 'efectivo' && (
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    ¿Con cuánto efectivo abona el cliente? ($)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={montoEfectivo}
                    onChange={(e) => setMontoEfectivo(e.target.value)}
                    placeholder="Monto entregado por el cliente"
                    className="text-lg font-bold text-cyan-400 bg-background"
                    autoFocus
                  />
                </div>

                {/* Botones de billetes comunes para agilizar mostrador */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-[11px] text-muted-foreground self-center mr-1">Billetes:</span>
                  <button 
                    type="button" 
                    onClick={() => agregarBillete(totalGeneral)}
                    className="px-2.5 py-1 text-xs bg-muted/60 hover:bg-muted rounded border border-border text-foreground font-medium"
                  >
                    Exacto (${totalGeneral.toLocaleString()})
                  </button>
                  {[1000, 2000, 5000, 10000, 20000].map((billete) => (
                    <button
                      key={billete}
                      type="button"
                      onClick={() => agregarBillete(billete)}
                      className="px-2.5 py-1 text-xs bg-muted/60 hover:bg-muted rounded border border-border text-foreground font-medium"
                    >
                      ${billete.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Cartel de Vuelto o Alerta de Faltante */}
                {faltanteEfectivo > 0 ? (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>Faltan <strong>${faltanteEfectivo.toLocaleString()}</strong> para cubrir el total.</span>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-600/60 rounded-xl text-center">
                    <span className="text-xs text-emerald-400 uppercase font-bold tracking-wider block">
                      Vuelto (Cambio) a Entregar
                    </span>
                    <span className="text-3xl font-extrabold text-emerald-300 mt-1 block">
                      ${vueltoEfectivo.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ================= OPCIÓN: TARJETA (POSNET) ================= */}
            {metodoPago === 'tarjeta' && (
              <div className="p-4 bg-background rounded-xl border border-border text-center space-y-2 mb-5">
                <CreditCard className="h-8 w-8 text-cyan-400 mx-auto" />
                <h4 className="font-semibold text-foreground text-sm">Terminal Posnet / Lector de Tarjetas</h4>
                <p className="text-xs text-muted-foreground">
                  Pasa la tarjeta por la terminal física por el importe exacto de:
                </p>
                <div className="text-2xl font-bold text-foreground">
                  ${totalGeneral.toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-400 block font-medium">✓ No requiere cálculo de vuelto</span>
              </div>
            )}

            {/* ================= OPCIÓN: TRANSFERENCIA ================= */}
            {metodoPago === 'transferencia' && (
              <div className="p-4 bg-background rounded-xl border border-border text-center space-y-2 mb-5">
                <ArrowLeftRight className="h-8 w-8 text-cyan-400 mx-auto" />
                <h4 className="font-semibold text-foreground text-sm">Cobro por Transferencia / QR</h4>
                <p className="text-xs text-muted-foreground">
                  Verifica la acreditación bancaria por el importe exacto de:
                </p>
                <div className="text-2xl font-bold text-foreground">
                  ${totalGeneral.toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-400 block font-medium">✓ No requiere cálculo de vuelto</span>
              </div>
            )}

            {/* ================= OPCIÓN: PAGO MIXTO ================= */}
            {metodoPago === 'mixto' && (
              <div className="space-y-4 mb-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      💵 Parte en Efectivo ($)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={mixtoEfectivo}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMixtoEfectivo(val);
                        const num = parseFloat(val) || 0;
                        setMixtoTarjeta(Math.max(0, totalGeneral - num).toFixed(2));
                      }}
                      className="bg-background font-bold text-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      💳 Parte en Tarjeta / QR ($)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={mixtoTarjeta}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMixtoTarjeta(val);
                        const num = parseFloat(val) || 0;
                        setMixtoEfectivo(Math.max(0, totalGeneral - num).toFixed(2));
                      }}
                      className="bg-background font-bold text-foreground"
                    />
                  </div>
                </div>

                {Math.abs(diferenciaMixta) > 0.01 ? (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      La suma (${sumaMixta.toLocaleString()}) no coincide con el total. Diferencia: ${diferenciaMixta.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-600/40 rounded-xl text-emerald-400 text-xs text-center font-medium">
                    ✓ Total cubierto correctamente (${parteEfectivo.toLocaleString()} efectivo + ${parteTarjeta.toLocaleString()} tarjeta)
                  </div>
                )}
              </div>
            )}

            {/* Botones de Acción del Modal */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => setMostrarModalCobro(false)}
                className="flex-1"
                disabled={procesando}
              >
                Volver
              </Button>

              <Button
                type="button"
                onClick={handleFinalizarVenta}
                disabled={
                  procesando || 
                  (metodoPago === 'efectivo' && faltanteEfectivo > 0) ||
                  (metodoPago === 'mixto' && Math.abs(diferenciaMixta) > 0.01)
                }
                className="flex-1 font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                {procesando ? "Procesando..." : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar Cobro
                  </span>
                )}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          COMPROBANTE / TICKET TÉRMICO (PUNTO 1)
          ======================================================== */}
      {ventaParaImprimir && (
        <TicketTermico 
          venta={ventaParaImprimir}
          onClose={() => {
            setVentaParaImprimir(null);
            navigate('/historial');
          }}
        />
      )}

    </div>
  );
}

export default Carrito;
