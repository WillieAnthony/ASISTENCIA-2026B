import { useState } from 'react'
import { useRegistro } from '../context/registro'
import type { Evento } from '../types'
import { fechaArchivo, formatFechaHora, slugify } from '../utils/format'

const COLUMNAS = [
  'Número de cuenta',
  'Nombre',
  'Apellido paterno',
  'Apellido materno',
  'Licenciatura',
  'Semestre',
  'Fecha y hora',
]

async function descargarExcel(evento: Evento) {
  // Carga diferida: la librería solo se descarga cuando se usa.
  const XLSX = await import('xlsx')
  const filas = [...evento.asistencias]
    .reverse()
    .map((a) => [
      a.numeroCuenta,
      a.nombre,
      a.apellidoPaterno,
      a.apellidoMaterno,
      a.licenciatura,
      a.semestre,
      formatFechaHora(a.registradoEn),
    ])

  const sheet = XLSX.utils.aoa_to_sheet([
    [`Evento: ${evento.nombre}`],
    [`Total de asistencias: ${evento.asistencias.length}`],
    [],
    COLUMNAS,
    ...filas,
  ])
  sheet['!cols'] = [12, 18, 18, 18, 44, 10, 20].map((wch) => ({ wch }))

  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Asistencias')
  XLSX.writeFile(
    book,
    `asistencias-${slugify(evento.nombre)}-${fechaArchivo()}.xlsx`,
  )
}

export function Listados() {
  const {
    eventos,
    activeEventoId,
    setActiveEventoId,
    refreshEventos,
    eventosLoading,
  } = useRegistro()
  const [exportando, setExportando] = useState(false)
  const evento = eventos.find((e) => e.id === activeEventoId)

  const onExcel = async () => {
    if (!evento) return
    setExportando(true)
    try {
      await descargarExcel(evento)
    } finally {
      setExportando(false)
    }
  }

  if (eventos.length === 0) {
    return (
      <section className="section">
        <h3>Listados</h3>
        <p className="empty">
          Aún no hay eventos. Genera un QR en el apartado “Generar QR”.
        </p>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="field">
        <label htmlFor="evento-listado">Evento</label>
        <select
          id="evento-listado"
          value={activeEventoId ?? ''}
          onChange={(e) => setActiveEventoId(e.target.value)}
        >
          {eventos.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre} — {e.asistencias.length} asistencia(s)
            </option>
          ))}
        </select>
      </div>

      <div className="admin-header listado-header">
        <div>
          <h3>{evento?.nombre ?? 'Listado'}</h3>
          <p>
            {evento
              ? `${evento.asistencias.length} registro(s). Se actualiza en tiempo real.`
              : 'Selecciona un evento.'}
          </p>
        </div>
        <div className="admin-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void refreshEventos()}
            disabled={eventosLoading}
          >
            {eventosLoading ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onExcel}
            disabled={!evento || exportando}
          >
            {exportando ? 'Preparando…' : 'Descargar Excel'}
          </button>
        </div>
      </div>

      {!evento || evento.asistencias.length === 0 ? (
        <p className="empty">Aún no hay asistencias para este QR.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cuenta</th>
                <th>Nombre</th>
                <th>Apellido paterno</th>
                <th>Apellido materno</th>
                <th>Licenciatura</th>
                <th>Semestre</th>
                <th>Fecha y hora</th>
              </tr>
            </thead>
            <tbody>
              {evento.asistencias.map((a, i) => (
                <tr key={a.id}>
                  <td data-label="#">{evento.asistencias.length - i}</td>
                  <td data-label="Cuenta">{a.numeroCuenta}</td>
                  <td data-label="Nombre">{a.nombre}</td>
                  <td data-label="Apellido paterno">{a.apellidoPaterno}</td>
                  <td data-label="Apellido materno">{a.apellidoMaterno}</td>
                  <td data-label="Licenciatura">{a.licenciatura}</td>
                  <td data-label="Semestre">{a.semestre}</td>
                  <td data-label="Fecha y hora">{formatFechaHora(a.registradoEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
