import { useMemo, useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import type { Evento } from '../types'
import { formatFecha, slugify } from '../utils/format'

type Props = {
  evento: Evento
}

export function EventoQr({ evento }: Props) {
  const printRef = useRef<HTMLCanvasElement>(null)

  const url = useMemo(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    return `${window.location.origin}${base}/r/${evento.id}`
  }, [evento.id])

  const onDescargar = () => {
    const canvas = printRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `qr-${slugify(evento.nombre)}.png`
    link.click()
  }

  return (
    <div className="qr-stage" key={evento.id}>
      <div className="qr-title">
        <span className="eyebrow">Evento</span>
        <strong>{evento.nombre}</strong>
        <span className="muted">Creado el {formatFecha(evento.creadoEn)}</span>
      </div>
      <QRCodeCanvas value={url} size={220} level="M" marginSize={2} />
      {/* Versión grande, solo para descargar e imprimir. */}
      <QRCodeCanvas
        ref={printRef}
        value={url}
        size={1024}
        level="M"
        marginSize={4}
        style={{ display: 'none' }}
      />
      <p className="qr-hint">
        Al escanearlo, el alumno abre el formulario y su asistencia queda en el
        listado de este evento.
      </p>
      <button type="button" className="btn btn-ghost" onClick={onDescargar}>
        Descargar QR (PNG)
      </button>
    </div>
  )
}
