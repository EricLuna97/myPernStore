import { useEffect, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, Receipt, Package } from "lucide-react";

function Ventas() {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    // 1. La función nace estrictamente dentro del efecto
    const cargarVentas = async () => {
      try {
        // Nota: Si configuraste JWT en esta ruta, recuerda agregar el header 'Authorization'
        const res = await fetch('http://localhost:4000/api/ventas');
        const data = await res.json();
        setVentas(data);
      } catch (error) {
        console.error("Error al cargar ventas:", error);
      }
    };

    // 2. Se ejecuta inmediatamente
    cargarVentas();
  }, []);

  // Formato de fecha estandarizado a hora local (¡Excelente práctica!)
  const formatDate = (fechaString) => {
    const isUTC = fechaString.endsWith('Z') ? fechaString : `${fechaString}Z`;
    return new Date(isUTC).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-5xl">
      
      {/* Cabecera Moderna */}
      <div className="bg-card p-6 rounded-xl border border-border border-l-4 border-l-cyan-500 mb-8 shadow-sm">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Receipt className="h-6 w-6 text-cyan-500" />
          Registro de Ventas
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Historial detallado de todas las transacciones procesadas en el sistema.
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
              
              {/* Lo que se ve cerrado (Resumen de la Venta) */}
              <AccordionTrigger className="hover:no-underline hover:bg-white/5 px-2 rounded-md transition-colors">
                <div className="flex flex-col sm:flex-row justify-between w-full pr-4 gap-4 items-start sm:items-center text-left">
                  <div className="flex items-center gap-3">
                    <span className="bg-cyan-500/20 text-cyan-400 font-bold px-3 py-1 rounded-md text-sm">
                      #{venta.id}
                    </span>
                    <div className="flex items-center text-muted-foreground text-sm gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(venta.fecha)}
                    </div>
                  </div>
                  
                  <div className="flex gap-6 items-center w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-bold text-lg text-foreground">
                      Total: ${parseFloat(venta.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              {/* Lo que se despliega al hacer clic (Detalles) */}
              <AccordionContent className="pt-4 pb-6 border-t border-border mt-2">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
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
                      {/* Aquí iteramos sobre el array interno que nos manda el backend */}
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
    </div>
  );
}

export default Ventas;