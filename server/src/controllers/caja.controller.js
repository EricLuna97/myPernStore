const pool = require('../config/db');

// 1. Obtener estado actual del turno de caja del cajero
const getEstadoCaja = async (req, res) => {
  const usuarioId = req.user?.id;

  try {
    // Buscar si hay un turno abierto
    const turnoResult = await pool.query(
      `SELECT t.*, u.nombre AS cajero 
       FROM turnos_caja t
       LEFT JOIN usuarios u ON t.usuario_id = u.id
       WHERE t.estado = 'abierto'
       ORDER BY t.fecha_apertura DESC 
       LIMIT 1`
    );

    if (turnoResult.rows.length === 0) {
      return res.json({ abierto: false, turno: null, metricas: null });
    }

    const turno = turnoResult.rows[0];

    // Calcular ventas realizadas durante este turno
    const metricasResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS ventas_efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) AS ventas_tarjeta,
         COALESCE(SUM(CASE WHEN metodo_pago = 'transferencia' THEN total ELSE 0 END), 0) AS ventas_transferencia,
         COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN COALESCE((detalle_pago->>'efectivo')::numeric, 0) ELSE 0 END), 0) AS mixto_efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN COALESCE((detalle_pago->>'tarjeta')::numeric, 0) ELSE 0 END), 0) AS mixto_tarjeta,
         COUNT(id) AS cantidad_ventas
       FROM ventas
       WHERE turno_id = $1 OR (turno_id IS NULL AND fecha >= $2)`,
      [turno.id, turno.fecha_apertura]
    );

    const row = metricasResult.rows[0];
    const ventasEfectivo = parseFloat(row.ventas_efectivo) + parseFloat(row.mixto_efectivo);
    const ventasDigitales = parseFloat(row.ventas_tarjeta) + parseFloat(row.ventas_transferencia) + parseFloat(row.mixto_tarjeta);
    const montoInicial = parseFloat(turno.monto_inicial);
    const totalEsperadoEnCajon = montoInicial + ventasEfectivo;

    res.json({
      abierto: true,
      turno,
      metricas: {
        monto_inicial: montoInicial,
        ventas_efectivo: ventasEfectivo,
        ventas_digitales: ventasDigitales,
        total_esperado_cajon: totalEsperadoEnCajon,
        cantidad_ventas: parseInt(row.cantidad_ventas, 10)
      }
    });

  } catch (error) {
    console.error("Error en getEstadoCaja:", error);
    res.status(500).json({ error: "Error al obtener estado de caja" });
  }
};

// 2. Apertura de Caja (Iniciar turno con dinero físico base)
const abrirCaja = async (req, res) => {
  const usuarioId = req.user?.id;
  const { monto_inicial } = req.body;

  if (monto_inicial === undefined || monto_inicial === null || isNaN(monto_inicial) || monto_inicial < 0) {
    return res.status(400).json({ error: "Debe ingresar un monto inicial válido mayor o igual a cero." });
  }

  try {
    // Verificar si ya existe un turno abierto
    const turnoExistente = await pool.query(
      "SELECT id FROM turnos_caja WHERE estado = 'abierto' LIMIT 1"
    );

    if (turnoExistente.rows.length > 0) {
      return res.status(400).json({ error: "Ya existe un turno de caja abierto. Ciérralo antes de abrir uno nuevo." });
    }

    const result = await pool.query(
      `INSERT INTO turnos_caja (usuario_id, monto_inicial, estado)
       VALUES ($1, $2, 'abierto') RETURNING *`,
      [usuarioId, monto_inicial]
    );

    res.status(201).json({
      message: "Caja abierta exitosamente",
      turno: result.rows[0]
    });

  } catch (error) {
    console.error("Error en abrirCaja:", error);
    res.status(500).json({ error: "Error al abrir la caja" });
  }
};

// 3. Cierre de Caja y Arqueo Final
const cerrarCaja = async (req, res) => {
  const { monto_real_cierre, observaciones } = req.body;

  if (monto_real_cierre === undefined || monto_real_cierre === null || isNaN(monto_real_cierre)) {
    return res.status(400).json({ error: "Debe ingresar el monto real contado en el cajón físico." });
  }

  try {
    // Buscar el turno abierto actual
    const turnoResult = await pool.query(
      "SELECT * FROM turnos_caja WHERE estado = 'abierto' ORDER BY id DESC LIMIT 1"
    );

    if (turnoResult.rows.length === 0) {
      return res.status(400).json({ error: "No hay ningún turno de caja abierto para cerrar." });
    }

    const turno = turnoResult.rows[0];

    // Calcular ventas del turno
    const metricasResult = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS ventas_efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago IN ('tarjeta', 'transferencia') THEN total ELSE 0 END), 0) AS ventas_otros,
         COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN COALESCE((detalle_pago->>'efectivo')::numeric, 0) ELSE 0 END), 0) AS mixto_efectivo,
         COALESCE(SUM(CASE WHEN metodo_pago = 'mixto' THEN COALESCE((detalle_pago->>'tarjeta')::numeric, 0) ELSE 0 END), 0) AS mixto_otros
       FROM ventas
       WHERE turno_id = $1 OR (turno_id IS NULL AND fecha >= $2)`,
      [turno.id, turno.fecha_apertura]
    );

    const row = metricasResult.rows[0];
    const ventasEfectivo = parseFloat(row.ventas_efectivo) + parseFloat(row.mixto_efectivo);
    const ventasOtros = parseFloat(row.ventas_otros) + parseFloat(row.mixto_otros);
    const montoInicial = parseFloat(turno.monto_inicial);
    const totalEsperado = montoInicial + ventasEfectivo;
    const montoReal = parseFloat(monto_real_cierre);
    const diferencia = montoReal - totalEsperado;

    // Actualizar y cerrar el turno
    const updateResult = await pool.query(
      `UPDATE turnos_caja 
       SET 
         estado = 'cerrado', 
         fecha_cierre = CURRENT_TIMESTAMP,
         monto_ventas_efectivo = $1,
         monto_ventas_otros = $2,
         total_esperado = $3,
         monto_real_cierre = $4,
         diferencia = $5,
         observaciones = $6
       WHERE id = $7
       RETURNING *`,
      [ventasEfectivo, ventasOtros, totalEsperado, montoReal, diferencia, observaciones || null, turno.id]
    );

    res.json({
      message: "Turno cerrado y arqueo procesado con éxito",
      arqueo: updateResult.rows[0]
    });

  } catch (error) {
    console.error("Error en cerrarCaja:", error);
    res.status(500).json({ error: "Error al cerrar la caja" });
  }
};

module.exports = {
  getEstadoCaja,
  abrirCaja,
  cerrarCaja
};

