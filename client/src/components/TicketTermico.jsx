import { useRef } from 'react';
import { Printer, X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";

function TicketTermico({ venta, onClose, autoPrint = false }) {
  const ticketRef = useRef(null);

  if (!venta) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (fecha) => {
    if (!fecha) return new Date().toLocaleString('es-AR');
    const isUTC = typeof fecha === 'string' && fecha.endsWith('Z') ? fecha : `${fecha}Z`;
    return new Date(isUTC).toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  const items = venta.detalles || venta.items || [];
  const total = parseFloat(venta.total || 0);

  return (
    <>
      {/* ========================================================
          ESTILOS DE IMPRESIÓN ESPECÍFICOS PARA ROLLO TÉRMICO (@media print)
          ======================================================== */}
      <style>{`
        @media print {
          /* 1. Ocultar todo lo que no sea el ticket */
          body * {
            visibility: hidden !important;
          }
          #ticket-termico-contenedor, #ticket-termico-contenedor * {
            visibility: visible !important;
          }
          #ticket-termico-contenedor {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important; /* Estándar térmico 80mm (o 58mm en rollos chicos) */
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>

      {/* Modal flotante en pantalla (Preview digital) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print animate-in fade-in duration-200">
        <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl p-6 flex flex-col max-h-[90vh]">
          
          <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-foreground text-base">Comprobante de Venta</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* VISTA PREVIA DEL TICKET (Diseño térmico en pantalla) */}
          <div className="flex-1 overflow-y-auto mb-5 p-4 bg-white text-black font-mono text-xs rounded-lg shadow-inner border border-gray-300">
            
            {/* Elemento que se imprimirá */}
            <div id="ticket-termico-contenedor" ref={ticketRef}>
              
              {/* Encabezado */}
              <div className="text-center pb-2 border-b border-dashed border-black mb-2">
                <h2 className="text-base font-black tracking-wider uppercase">PERNSTORE</h2>
                <p className="text-[10px]">SISTEMA DE GESTION COMERCIAL</p>
                <p className="text-[10px]">C.U.I.T.: 30-12345678-9</p>
                <p className="text-[10px] mt-1 font-bold">*** TICKET NO FISCAL ***</p>
              </div>

              {/* Metadatos */}
              <div className="text-[10px] space-y-0.5 pb-2 border-b border-dashed border-black mb-2">
                <div className="flex justify-between">
                  <span>TICKET #:</span>
                  <span className="font-bold">{venta.id ? String(venta.id).padStart(6, '0') : '000001'}</span>
                </div>
                <div className="flex justify-between">
                  <span>FECHA:</span>
                  <span>{formatDate(venta.fecha)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CAJERO:</span>
                  <span>{venta.vendedor || 'Mostrador'}</span>
                </div>
              </div>

              {/* Tabla de Artículos */}
              <div className="pb-2 border-b border-dashed border-black mb-2">
                <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-gray-400 mb-1">
                  <span className="w-8">CANT</span>
                  <span className="flex-1 px-1">DETALLE</span>
                  <span className="w-14 text-right">TOTAL</span>
                </div>

                <div className="space-y-1">
                  {items.map((item, index) => {
                    const cant = item.cantidad || item.quantity || 1;
                    const precio = item.precio_historico || item.precio_venta || 0;
                    const sub = item.subtotal || (cant * precio);
                    return (
                      <div key={index} className="flex justify-between text-[10px]">
                        <span className="w-8">{cant}x</span>
                        <span className="flex-1 px-1 truncate">{item.nombre || 'Producto'}</span>
                        <span className="w-14 text-right">${parseFloat(sub).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totales y Medios de Pago */}
              <div className="space-y-1 text-xs pb-2 border-b border-dashed border-black mb-2">
                <div className="flex justify-between font-black text-sm">
                  <span>TOTAL:</span>
                  <span>${total.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between text-[10px] pt-1">
                  <span className="uppercase">FORMA DE PAGO:</span>
                  <span className="font-bold uppercase">{venta.metodo_pago || 'EFECTIVO'}</span>
                </div>

                {venta.metodo_pago === 'efectivo' && (
                  <>
                    <div className="flex justify-between text-[10px]">
                      <span>PAGO CON:</span>
                      <span>${parseFloat(venta.monto_recibido || total).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>SU CAMBIO:</span>
                      <span>${parseFloat(venta.vuelto || 0).toLocaleString()}</span>
                    </div>
                  </>
                )}

                {venta.metodo_pago === 'mixto' && venta.detalle_pago && (
                  <div className="text-[9px] text-gray-700">
                    <div>Efectivo: ${parseFloat(venta.detalle_pago.efectivo || 0).toLocaleString()}</div>
                    <div>Tarjeta: ${parseFloat(venta.detalle_pago.tarjeta || 0).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {/* Pie de Ticket */}
              <div className="text-center text-[10px] pt-1 space-y-0.5">
                <p className="font-bold">¡GRACIAS POR SU COMPRA!</p>
                <p className="text-[9px] text-gray-600">Cambios dentro de los 30 dias</p>
                <p className="text-[8px] text-gray-500">www.pernstore.com</p>
              </div>

            </div>

          </div>

          {/* Botones de Acción */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cerrar
            </Button>
            
            <Button
              onClick={handlePrint}
              className="flex-1 font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}

export default TicketTermico;

