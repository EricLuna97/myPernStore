import { API_BASE_URL } from '../config/api';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Sparkles, 
  UploadCloud, 
  FileText, 
  FileSpreadsheet, 
  Trash2, 
  Percent, 
  Barcode, 
  PackagePlus, 
  ArrowLeft 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getCategories } from '../services/categoryService';

function CargaMasiva() {
  const navigate = useNavigate();

  // Estados de archivo y configuración
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [margenGanancia, setMargenGanancia] = useState(40); // 40% por defecto
  const [analizando, setAnalizando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estados de datos
  const [listaCategorias, setListaCategorias] = useState([]);
  const [productosDetectados, setProductosDetectados] = useState([]);
  const [paso, setPaso] = useState(1); // 1: Subida, 2: Revisión

  useEffect(() => {
    let cancelado = false;
    const fetchCats = async () => {
      try {
        const cats = await getCategories();
        if (!cancelado) {
          setListaCategorias(cats);
        }
      } catch (err) {
        if (!cancelado) {
          console.error("Error al cargar categorías:", err);
        }
      }
    };
    fetchCats();

    return () => {
      cancelado = true;
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      // Generar preview solo si es una imagen
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setArchivo(null);
    setPreviewUrl(null);
  };

  // Función para asociar nombre de categoría extraído con el ID real de la base de datos
  const encontrarCategoriaId = (nombreSugerido) => {
    if (!nombreSugerido || listaCategorias.length === 0) return '';
    const match = listaCategorias.find(cat => 
      cat.nombre.toLowerCase().includes(nombreSugerido.toLowerCase()) ||
      nombreSugerido.toLowerCase().includes(cat.nombre.toLowerCase())
    );
    return match ? match.id : (listaCategorias[0]?.id || '');
  };



  // Enviar archivo al backend (soporta imágenes para Gemini Vision, o Excel/CSV para SheetJS)
  const handleProcesarArchivo = async (e) => {
    e.preventDefault();
    if (!archivo) {
      toast.error("Por favor selecciona un archivo o foto de factura");
      return;
    }

    setAnalizando(true);
    const formData = new FormData();
    formData.append('factura', archivo);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/ai/analizar-archivo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo procesar el archivo.");
      }

      // Preparar productos con cálculo inicial de precio de venta y categoría mapeada
      const factorMargen = 1 + (parseFloat(margenGanancia) || 0) / 100;

      const productosListos = data.productos.map((p, index) => {
        const costo = parseFloat(p.precio_costo) || 0;
        // Si el archivo ya traía un precio de venta definido lo respetamos, de lo contrario aplicamos el margen
        const ventaSugerida = (p.precio_venta && p.precio_venta > 0)
          ? parseFloat(p.precio_venta)
          : Math.round(costo * factorMargen);

        const catId = encontrarCategoriaId(p.categoria);

        return {
          idTemp: Date.now() + index,
          seleccionado: true,
          nombre: p.nombre || 'Producto sin nombre',
          codigo_barras: p.codigo_barras || '',
          descripcion: p.descripcion || '',
          precio_costo: costo,
          precio_venta: ventaSugerida,
          stock: parseInt(p.stock, 10) || 1,
          categoria_id: catId,
          imagen_url: p.imagen_url || null
        };
      });

      setProductosDetectados(productosListos);
      setPaso(2);

      if (data.tipo_origen === 'tabular') {
        toast.success(`📊 ¡Se importaron ${productosListos.length} productos desde la planilla con éxito!`);
      } else {
        toast.success(`✨ ¡Gemini identificó ${productosListos.length} productos con éxito!`);
      }

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error al procesar el archivo.");
    } finally {
      setAnalizando(false);
    }
  };

  // Modificar campo de un producto en la tabla
  const handleItemChange = (idTemp, campo, valor) => {
    setProductosDetectados(prev => prev.map(item => {
      if (item.idTemp !== idTemp) return item;

      const updated = { ...item, [campo]: valor };

      // Si cambia el costo, actualizamos automáticamente el precio de venta sugerido
      if (campo === 'precio_costo') {
        const nuevoCosto = parseFloat(valor) || 0;
        const factor = 1 + (parseFloat(margenGanancia) || 0) / 100;
        updated.precio_venta = Math.round(nuevoCosto * factor);
      }

      return updated;
    }));
  };

  const toggleSeleccionarTodos = (e) => {
    const check = e.target.checked;
    setProductosDetectados(prev => prev.map(p => ({ ...p, seleccionado: check })));
  };

  const eliminarFila = (idTemp) => {
    setProductosDetectados(prev => prev.filter(p => p.idTemp !== idTemp));
  };

  // Re-aplicar margen a toda la tabla
  const reaplicarMargenATodos = (nuevoMargen) => {
    setMargenGanancia(nuevoMargen);
    const factor = 1 + (parseFloat(nuevoMargen) || 0) / 100;
    setProductosDetectados(prev => prev.map(p => ({
      ...p,
      precio_venta: Math.round((parseFloat(p.precio_costo) || 0) * factor)
    })));
  };

  // Enviar a la base de datos (Batch Upsert)
  const handleConfirmarCargaMasiva = async () => {
    const seleccionados = productosDetectados.filter(p => p.seleccionado);

    if (seleccionados.length === 0) {
      toast.error("Debes seleccionar al menos un producto para ingresar.");
      return;
    }

    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/productos/carga-masiva`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productos: seleccionados })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`🎉 ${data.message} (${data.insertados} nuevos, ${data.actualizados} stock sumado)`, { duration: 6000 });
        navigate('/'); // Redirigir al catálogo para ver los productos recién ingresados
      } else {
        toast.error("Error: " + (data.error || "No se pudo procesar la carga"));
      }

    } catch (err) {
      console.error(err);
      toast.error("Error al conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  };

  const itemsSeleccionados = productosDetectados.filter(p => p.seleccionado);
  const totalUnidades = itemsSeleccionados.reduce((acc, p) => acc + (parseInt(p.stock, 10) || 0), 0);
  const costoTotalFactura = itemsSeleccionados.reduce((acc, p) => acc + ((parseFloat(p.precio_costo) || 0) * (parseInt(p.stock, 10) || 0)), 0);

  // Detección de tipo de archivo para textos y etiquetas
  const esExcel = archivo?.name?.match(/\.(xlsx|xls)$/i);
  const esCsv = archivo?.name?.match(/\.csv$/i);
  const esImagen = archivo?.type?.startsWith('image/');

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-6 rounded-xl border border-border border-l-4 border-l-cyan-500 mb-8 gap-4 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Ingreso Masivo de Productos
          </h1>
          <p className="text-muted-foreground text-sm">
            Sube una foto de tu factura/remito, o importa directamente listas de proveedores en Excel (.xlsx) o CSV.
          </p>

          <Link to="/cargar">
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" /> Carga Individual
            </Button>
          </Link>
        </div>
      </div>

      {/* ================= PASO 1: SUBIDA DE ARCHIVO ================= */}
      {paso === 1 && (
        <Card className="p-8 bg-card border-border max-w-2xl mx-auto shadow-md">
          <form onSubmit={handleProcesarArchivo} className="space-y-6">
            
            {/* Zona Dropzone */}
            <div className="border-2 border-dashed border-border/80 hover:border-cyan-500/80 rounded-2xl p-8 text-center transition-colors bg-background/50">
              <input 
                type="file" 
                id="file-factura" 
                accept="image/*,.csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" 
                onChange={handleFileChange} 
                className="hidden" 
              />

              {!archivo ? (
                <label htmlFor="file-factura" className="cursor-pointer block space-y-3">
                  <div className="flex justify-center items-center gap-3 text-muted-foreground mb-1">
                    <UploadCloud className="h-10 w-10 text-cyan-400" />
                    <FileSpreadsheet className="h-10 w-10 text-emerald-400" />
                  </div>
                  <h4 className="font-semibold text-foreground text-base">
                    Haz clic o arrastra tu archivo aquí
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Formatos soportados: <strong>Imágenes</strong> (JPG, PNG, WEBP), <strong>Planillas Excel</strong> (.xlsx, .xls) o <strong>Archivos CSV</strong> (.csv).
                  </p>
                  <div className="pt-2 flex justify-center gap-2 text-[11px] text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-muted/50 border border-border">Facturas / Fotos</span>
                    <span className="px-2 py-0.5 rounded bg-muted/50 border border-border">Listas de Precios Excel</span>
                    <span className="px-2 py-0.5 rounded bg-muted/50 border border-border">Dumps CSV</span>
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  {/* Previsualización según tipo de archivo */}
                  {esImagen && previewUrl && (
                    <div className="space-y-2">
                      <span className="text-xs text-cyan-400 font-semibold block">Imagen de Factura Lista</span>
                      <img 
                        src={previewUrl} 
                        alt="Preview factura" 
                        className="max-h-60 mx-auto rounded-lg shadow border border-border object-contain"
                      />
                    </div>
                  )}

                  {esExcel && (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center justify-between gap-4 text-left">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-10 w-10 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">Planilla Excel</span>
                          <p className="text-sm font-semibold text-foreground truncate max-w-sm">{archivo.name}</p>
                          <span className="text-xs text-muted-foreground">{(archivo.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile} className="text-red-400 hover:text-red-300">
                        Cambiar
                      </Button>
                    </div>
                  )}

                  {esCsv && (
                    <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl flex items-center justify-between gap-4 text-left">
                      <div className="flex items-center gap-3">
                        <FileText className="h-10 w-10 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-amber-400 block uppercase tracking-wider">Archivo CSV</span>
                          <p className="text-sm font-semibold text-foreground truncate max-w-sm">{archivo.name}</p>
                          <span className="text-xs text-muted-foreground">{(archivo.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile} className="text-red-400 hover:text-red-300">
                        Cambiar
                      </Button>
                    </div>
                  )}

                  {(!esImagen && !esExcel && !esCsv) && (
                    <div className="p-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between gap-4 text-left">
                      <div className="flex items-center gap-3">
                        <FileText className="h-10 w-10 text-cyan-400 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-muted-foreground block uppercase">Archivo Seleccionado</span>
                          <p className="text-sm font-semibold text-foreground truncate max-w-sm">{archivo.name}</p>
                          <span className="text-xs text-muted-foreground">{(archivo.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile} className="text-red-400 hover:text-red-300">
                        Cambiar
                      </Button>
                    </div>
                  )}

                  <label htmlFor="file-factura" className="inline-block text-xs text-cyan-400 hover:underline cursor-pointer">
                    Seleccionar otro archivo
                  </label>
                </div>
              )}
            </div>

            {/* Configuración de Margen de Ganancia */}
            <div className="bg-background/80 p-4 rounded-xl border border-border flex items-center justify-between gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-cyan-400" />
                  Margen de Ganancia Sugerido
                </label>
                <p className="text-xs text-muted-foreground">
                  Calcula el precio de venta cuando el archivo no especifica uno (Costo + %)
                </p>
              </div>

              <div className="flex items-center gap-2 w-32">
                <Input
                  type="number"
                  min="0"
                  step="5"
                  value={margenGanancia}
                  onChange={(e) => setMargenGanancia(e.target.value)}
                  className="font-bold text-center bg-card"
                />
                <span className="text-sm font-bold text-muted-foreground">%</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={analizando || !archivo}
              className="w-full font-bold py-6 text-base bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-2"
            >
              {analizando ? (
                <>
                  <Sparkles className="h-5 w-5 animate-spin" />
                  {esExcel || esCsv 
                    ? "Leyendo planilla y buscando fotos de productos..." 
                    : "Procesando factura con IA y buscando fotos..."}
                </>
              ) : (
                <>
                  {esExcel || esCsv ? (
                    <>
                      <FileSpreadsheet className="h-5 w-5" />
                      Importar Planilla ({esExcel ? 'Excel' : 'CSV'})
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      PROCESAR
                    </>
                  )}
                </>
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* ================= PASO 2: TABLA DE REVISIÓN Y CONFIRMACIÓN ================= */}
      {paso === 2 && (
        <div className="space-y-6">
          
          {/* Barra de Herramientas de la Tabla */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-4 rounded-xl border border-border gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPaso(1)}
              >
                ← Subir Otro Archivo
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                <strong className="text-foreground">{itemsSeleccionados.length}</strong> de {productosDetectados.length} seleccionados
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">Margen Global:</span>
              <div className="flex items-center gap-1">
                {[30, 40, 50, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => reaplicarMargenATodos(m)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      parseInt(margenGanancia, 10) === m 
                        ? 'bg-cyan-500 text-black font-bold border-cyan-400' 
                        : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    +{m}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla Interactiva */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-background text-muted-foreground uppercase text-xs border-b border-border">
                  <tr>
                    <th className="p-3 text-center w-10">
                      <input 
                        type="checkbox" 
                        defaultChecked={true} 
                        onChange={toggleSeleccionarTodos}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="p-3 w-16 text-center">Foto</th>
                    <th className="p-3 min-w-[200px]">Producto</th>
                    <th className="p-3 w-40">Código Barras</th>
                    <th className="p-3 w-28 text-right">Costo ($)</th>
                    <th className="p-3 w-28 text-right">Venta ($)</th>
                    <th className="p-3 w-20 text-center">Cant.</th>
                    <th className="p-3 w-44">Categoría</th>
                    <th className="p-3 w-12 text-center"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {productosDetectados.map((item) => (
                    <tr 
                      key={item.idTemp} 
                      className={`hover:bg-white/5 transition-colors ${
                        !item.seleccionado ? 'opacity-40 bg-muted/10' : ''
                      }`}
                    >
                      {/* Checkbox selección */}
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={item.seleccionado} 
                          onChange={(e) => handleItemChange(item.idTemp, 'seleccionado', e.target.checked)}
                          className="rounded cursor-pointer"
                        />
                      </td>

                      {/* Miniatura Foto (Oficial o Placeholder) */}
                      <td className="p-3 text-center">
                        {item.imagen_url ? (
                          <img 
                            src={item.imagen_url} 
                            alt={item.nombre} 
                            className="h-10 w-10 object-contain bg-white rounded border border-border mx-auto shadow-sm"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground mx-auto">
                            📷
                          </div>
                        )}
                      </td>

                      {/* Nombre del producto */}
                      <td className="p-3">
                        <Input 
                          value={item.nombre} 
                          onChange={(e) => handleItemChange(item.idTemp, 'nombre', e.target.value)}
                          className="h-8 bg-background text-xs font-medium"
                        />
                      </td>

                      {/* Código de barras */}
                      <td className="p-3">
                        <div className="relative">
                          <Input 
                            value={item.codigo_barras} 
                            onChange={(e) => handleItemChange(item.idTemp, 'codigo_barras', e.target.value)}
                            placeholder="Sin código"
                            className="h-8 bg-background font-mono text-xs pr-6"
                          />
                          <Barcode className="h-3.5 w-3.5 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>

                      {/* Precio Costo */}
                      <td className="p-3 text-right">
                        <Input 
                          type="number"
                          step="0.01"
                          value={item.precio_costo} 
                          onChange={(e) => handleItemChange(item.idTemp, 'precio_costo', e.target.value)}
                          className="h-8 bg-background text-xs font-semibold text-right"
                        />
                      </td>

                      {/* Precio Venta */}
                      <td className="p-3 text-right">
                        <Input 
                          type="number"
                          step="0.01"
                          value={item.precio_venta} 
                          onChange={(e) => handleItemChange(item.idTemp, 'precio_venta', e.target.value)}
                          className="h-8 bg-background text-xs font-bold text-cyan-400 text-right"
                        />
                      </td>

                      {/* Cantidad / Stock */}
                      <td className="p-3 text-center">
                        <Input 
                          type="number"
                          min="1"
                          value={item.stock} 
                          onChange={(e) => handleItemChange(item.idTemp, 'stock', e.target.value)}
                          className="h-8 bg-background text-xs font-bold text-center w-16 mx-auto"
                        />
                      </td>

                      {/* Categoría */}
                      <td className="p-3">
                        <select
                          value={item.categoria_id}
                          onChange={(e) => handleItemChange(item.idTemp, 'categoria_id', e.target.value)}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">Seleccionar...</option>
                          {listaCategorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                          ))}
                        </select>
                      </td>

                      {/* Botón borrar fila */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => eliminarFila(item.idTemp)}
                          className="text-red-400 hover:text-red-300 p-1 rounded"
                          title="Quitar este producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel de Resumen Final y Confirmación */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold block">Productos Listos</span>
                <span className="text-xl font-bold text-foreground">{itemsSeleccionados.length} artículos</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold block">Stock a Sumar</span>
                <span className="text-xl font-bold text-cyan-400">{totalUnidades} unidades</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold block">Total Inversión</span>
                <span className="text-xl font-bold text-foreground">${costoTotalFactura.toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={handleConfirmarCargaMasiva}
              disabled={guardando || itemsSeleccionados.length === 0}
              className="w-full md:w-auto font-bold px-8 py-6 text-base bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-2"
            >
              {guardando ? (
                "Guardando en Base de Datos..."
              ) : (
                <>
                  <PackagePlus className="h-5 w-5" />
                  Confirmar e Ingresar Todo al Inventario
                </>
              )}
            </Button>

          </div>

        </div>
      )}

    </div>
  );
}

export default CargaMasiva;
