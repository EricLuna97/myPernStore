import { useState } from 'react';
import { ShieldAlert, X, Check, KeyRound } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from 'react-hot-toast';

function ModalPinAutorizacion({ accionTitulo, onAutorizado, onCancelar }) {
  const [pin, setPin] = useState('');
  const [verificando, setVerificando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast.error("Por favor ingrese el PIN de 4 dígitos");
      return;
    }

    setVerificando(true);
    try {
      const response = await fetch('http://localhost:4000/api/auth/validar-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() })
      });

      const data = await response.json();

      if (response.ok && data.autorizado) {
        toast.success(`✓ Autorizado por ${data.supervisor || 'Encargado'}`);
        onAutorizado();
      } else {
        toast.error(data.error || "PIN incorrecto. Autorización denegada.");
        setPin('');
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al conectar con el servidor");
    } finally {
      setVerificando(false);
    }
  };

  const agregarDigito = (d) => {
    if (pin.length < 6) {
      setPin(prev => prev + d);
    }
  };

  const borrarDigito = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm rounded-2xl border border-red-500/40 shadow-2xl p-6 relative">
        
        {/* Cabecera */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-red-400">
            <ShieldAlert className="h-6 w-6 shrink-0" />
            <div>
              <h3 className="font-bold text-foreground text-base">Autorización en Sitio</h3>
              <p className="text-xs text-muted-foreground">{accionTitulo || 'Acción restringida'}</p>
            </div>
          </div>
          <button 
            onClick={onCancelar}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4 bg-muted/40 p-2.5 rounded-lg border border-border">
          El cajero requiere que el <strong>Encargado o Administrador</strong> ingrese su PIN para anular ítems de la cuenta. (PIN por defecto: <code>1234</code>).
        </p>

        {/* Input PIN */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              autoFocus
              className="pl-10 text-center tracking-[0.5em] text-2xl font-bold bg-background h-12"
            />
          </div>

          {/* Teclado numérico táctil para agilizar en pantalla táctil/POS */}
          <div className="grid grid-cols-3 gap-2 py-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                onClick={() => agregarDigito(num.toString())}
                className="h-10 text-base font-bold bg-background/50 hover:bg-muted"
              >
                {num}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={borrarDigito}
              className="h-10 text-xs font-bold text-red-400 hover:bg-red-950/20"
            >
              Borrar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => agregarDigito('0')}
              className="h-10 text-base font-bold bg-background/50 hover:bg-muted"
            >
              0
            </Button>
            <Button
              type="submit"
              disabled={verificando || pin.length === 0}
              className="h-10 font-bold bg-red-600 hover:bg-red-500 text-white"
            >
              OK
            </Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancelar}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalPinAutorizacion;

