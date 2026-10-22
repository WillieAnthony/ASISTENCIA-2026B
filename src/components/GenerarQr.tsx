import { useState, type FormEvent } from 'react'
import { useRegistro } from '../context/registro'
import { formatFecha } from '../utils/format'
import { EVENTO_NOMBRE_MAX } from '../utils/validation'
import { EventoQr } from './EventoQr'

type Props = {
  onVerListado: (eventoId: string) => void
}

export function GenerarQr({ onVerListado }: Props) {
  const { eventos, activeEventoId, setActiveEventoId, crearEvento } =
    useRegistro()
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const activeEvento = eventos.find((e) => e.id === activeEventoId)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    const { error: message } = await crearEvento(nombre)
    setBusy(false)
    if (message) {
      setError(message)
      return
    }
    setNombre('')
    setError('')
  }

  return (
    <div className="generar-grid">
      <div>
        <section className="section">
          <h3>Nuevo QR</h3>
          <p>
            Ponle nombre al evento. Cada QR tiene su propio listado de
            asistencias.
          </p>
          <form className="inline-form" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="evento-nombre">Nombre del evento</label>
              <input
                id="evento-nombre"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value)
                  setError('')
                }}
                placeholder="Ej. Programación Web — Grupo 701"
                maxLength={EVENTO_NOMBRE_MAX}
                autoComplete="off"
              />
              <span className="error">{error}</span>
            </div>
            <button type="submit" className="btn btn-accent" disabled={busy}>
              {busy ? 'Generando…' : 'Generar QR'}
            </button>
          </form>
        </section>

        {activeEvento ? (
          <section className="section">
            <EventoQr evento={activeEvento} />
          </section>
        ) : null}
      </div>

      <section className="section generar-lista">
        <h3>Tus QR</h3>
        {eventos.length === 0 ? (
          <p className="empty">Aún no has generado ningún QR.</p>
        ) : (
          <ul className="evento-list">
            {eventos.map((evento) => (
              <li
                key={evento.id}
                className={
                  evento.id === activeEventoId
                    ? 'evento-card is-active'
                    : 'evento-card'
                }
              >
                <div className="evento-info">
                  <strong>{evento.nombre}</strong>
                  <span className="muted">
                    {formatFecha(evento.creadoEn)} · {evento.asistencias.length}{' '}
                    asistencia(s)
                  </span>
                </div>
                <div className="evento-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setActiveEventoId(evento.id)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    Ver QR
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onVerListado(evento.id)}
                  >
                    Ver listado
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
