import { useEffect, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Receipt, Package, Banknote, CreditCard, ArrowLeftRight, Split, User, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import TicketTermico from '../components/TicketTermico';

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

  useEffect(() => {
    let cancelado = false;
    const cargarVentas = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:4000/api/ventas', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!cancelado) {
          setVentas(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelado) console.error("Error al cargar ventas:", error);
      }
    };
    cargarVentas();
    return () => { cancelado = true; };
  }, []);

  const formatDate = (fechaString) => {
    const isUTC = fechaString.endsWith('Z') ? fechaString : `${fechaString}Z`;
    return new Date(isUTC).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  // Badge para el medio de pago
  const renderMedioPagoBadge = (metodo) => {
    switch (metodo) {
      case 'tarjeta':
        return (
          <span className="flex items-center gap-1 bg-blue-500/20 text-blue-400 text-xs px-2.5 py-1 rounded-md font-medium border border-blue-500/30">
            <CreditCard className="h-3.5 w-3.5" /> Tarjeta
          </span>
        );
      case 'transferencia':
        return (
          <span className="flex items-center gap-1 bg-purple-500/20 text-purple-400 text-xs px-2.5 py-1 rounded-md font-medium border border-purple-500/30">
            <ArrowLeftRight className="h-3.5 w-3.5" /> Transferencia
          </span>
        );
      case 'mixto':
        return (
          <span className="flex items-center gap-1 bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-md font-medium border border-amber-500/30">
            <Split className="h-3.5 w-3.5" /> Mixto
          </span>
        );
      case 'efectivo':
      default:
        return (
          <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-md font-medium border border-emerald-500/30">
            <Banknote className="h-3.5 w-3.5" /> Efectivo
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-5xl">
      
      {/* Cabecera */}
      <div className="bg-card p-6 rounded-xl border border-border border-l-4 border-l-cyan-500 mb-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-6 w-6 text-cyan-500" />
          Registro de Ventas
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Historial detallado de todas las transacciones, medios de pago y arqueos procesados.
        </p>
      </div>
      
      {ventas.length === 0 ? (
        <div className="text-center text-muted-foreground py-10 bg-background rounded-xl border border-border">
          Aún no hay ventas registradas.
        </div>
      ) : (
        /* --- ACORDEÓN DE VENTAS --- */
        <Accordion type="single" collapsible className="w-full space-y-4">
          {ventas.map((venta) => (
            <AccordionItem 
              key={venta.id} 
              value={`venta-${venta.id}`} 
              className="bg-card border border-border rounded-lg px-4"
            >
              
              {/* Resumen de la Venta (Cerrado) */}
              <AccordionTrigger className="hover:no-underline hover:bg-white/5 px-2 rounded-md transition-colors">
                <div className="flex flex-col sm:flex-row justify-between w-full pr-4 gap-4 items-start sm:items-center text-left">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-cyan-500/20 text-cyan-400 font-bold px-3 py-1 rounded-md text-sm">
                      #{venta.id}
                    </span>
                    <div className="flex items-center text-muted-foreground text-sm gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(venta.fecha)}
                    </div>
                    {renderMedioPagoBadge(venta.metodo_pago)}
                  </div>
                  
                  <div className="flex gap-6 items-center w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-bold text-lg text-foreground">
                      Total: ${parseFloat(venta.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              {/* Contenido Desplegable (Detalles) */}
              <AccordionContent className="pt-4 pb-6 border-t border-border mt-2 space-y-4">
                
                {/* Información Financiera del Pago */}
                <div className="bg-background/80 p-4 rounded-lg border border-border flex flex-wrap justify-between items-center gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 text-cyan-400" />
                    <span>Vendedor: <strong className="text-foreground">{venta.vendedor || 'Sistema / General'}</strong></span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    {venta.metodo_pago === 'efectivo' && (
                      <>
                        <span>Abonó con: <strong className="text-foreground">${parseFloat(venta.monto_recibido || venta.total).toLocaleString()}</strong></span>
                        <span className="text-emerald-400 font-semibold">
                          Vuelto entregado: ${parseFloat(venta.vuelto || 0).toLocaleString()}
                        </span>
                      </>
                    )}

                    {venta.metodo_pago === 'mixto' && venta.detalle_pago && (
                      <span>
                        Desglose: Efectivo <strong className="text-foreground">${parseFloat(venta.detalle_pago.efectivo || 0).toLocaleString()}</strong> + Tarjeta <strong className="text-foreground">${parseFloat(venta.detalle_pago.tarjeta || 0).toLocaleString()}</strong>
                      </span>
                    )}

                    {(venta.metodo_pago === 'tarjeta' || venta.metodo_pago === 'transferencia') && (
                      <span>Pago digital directo por el total exacto.</span>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setTicketSeleccionado(venta)}
                      className="ml-auto flex items-center gap-1.5 text-xs h-7 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Reimprimir Ticket
                    </Button>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos Vendidos en este Ticket
                </h4>
                
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-background text-muted-foreground uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Producto</th>
                        <th className="px-4 py-3 text-center">Cant.</th>
                        <th className="px-4 py-3 text-right">Precio Unit.</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {venta.detalles?.map((item, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {item.nombre || 'Producto Eliminado'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.cantidad}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            ${parseFloat(item.precio_historico).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-cyan-400">
                            ${parseFloat(item.subtotal).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </AccordionContent>
              
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Modal de Comprobante / Ticket Térmico */}
      {ticketSeleccionado && (
        <TicketTermico 
          venta={ticketSeleccionado}
          onClose={() => setTicketSeleccionado(null)}
        />
      )}
    </div>
  );
}

export default Ventas;
