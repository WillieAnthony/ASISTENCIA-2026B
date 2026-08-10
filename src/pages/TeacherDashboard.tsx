import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import * as XLSX from 'xlsx'
import { useRegistro } from '../context/RegistroContext'

export function TeacherDashboard() {
  const navigate = useNavigate()
  const {
    teacher,
    loading,
    logout,
    salones,
    activeSalonId,
    setActiveSalonId,
    generarNuevoRegistro,
    getSalon,
    refreshSalones,
  } = useRegistro()

  const [showQr, setShowQr] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const activeSalon = getSalon(activeSalonId ?? undefined)

  const qrUrl = useMemo(() => {
    if (!activeSalon) return ''
    return `${window.location.origin}/r/${activeSalon.id}`
  }, [activeSalon])

  if (loading) {
    return (
      <div className="app-shell">
        <section className="panel">
          <h1 className="brand">Registro</h1>
          <p className="lede">Cargando sesión…</p>
        </section>
      </div>
    )
  }

  if (!teacher) {
    return <Navigate to="/" replace />
  }

  const onGenerar = async () => {
    setBusy(true)
    setError('')
    const { error: message } = await generarNuevoRegistro()
    setBusy(false)
    if (message) {
      setError(message)
      return
    }
    setShowQr(true)
  }

  const onDescargarExcel = () => {
    if (!activeSalon) return

    const rows = activeSalon.asistencias.map((a) => ({
      'Número de cuenta': a.numeroCuenta,
      Nombre: a.nombre,
      'Apellido paterno': a.apellidoPaterno,
      'Apellido materno': a.apellidoMaterno,
      Licenciatura: a.licenciatura,
      Semestre: a.semestre,
      'Fecha y hora': new Date(a.registradoEn).toLocaleString('es-MX'),
    }))

    const sheet = XLSX.utils.json_to_sheet(
      rows.length > 0
        ? rows
        : [
            {
              'Número de cuenta': '',
              Nombre: '',
              'Apellido paterno': '',
              'Apellido materno': '',
              Licenciatura: '',
              Semestre: '',
              'Fecha y hora': '',
            },
          ],
    )
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Asistencias')
    XLSX.writeFile(book, `asistencias-${activeSalon.id}.xlsx`)
  }

  return (
    <div className="app-shell">
      <section className="panel panel-wide">
        <div className="admin-header">
          <div>
            <h1 className="brand">Registro</h1>
            <p className="lede">
              Sesión de maestro: {teacher.correo}. Genera un QR, compártelo en el
              salón y revisa quiénes asistieron.
            </p>
          </div>
          <div className="admin-actions">
            <button
              type="button"
              className="btn btn-accent"
              onClick={onGenerar}
              disabled={busy}
            >
              {busy ? 'Generando…' : 'Generar nuevo registro'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                void refreshSalones()
              }}
            >
              Actualizar
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={async () => {
                await logout()
                navigate('/')
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}

        <div className="field">
          <label htmlFor="salon">Salón / código QR</label>
          <select
            id="salon"
            value={activeSalonId ?? ''}
            onChange={(e) => {
              setActiveSalonId(e.target.value)
              setShowQr(true)
            }}
          >
            {salones.length === 0 ? (
              <option value="">Aún no hay salones</option>
            ) : null}
            {salones.map((salon) => (
              <option key={salon.id} value={salon.id}>
                {salon.nombre} — {salon.asistencias.length} asistencias
              </option>
            ))}
          </select>
        </div>

        {(showQr || activeSalon) && activeSalon ? (
          <section className="section">
            <h3>Este es tu QR</h3>
            <p>Compártelo con todos o pégalo en la sala del salón.</p>
            <div className="qr-stage">
              <QRCodeSVG value={qrUrl} size={220} level="M" includeMargin />
              <p className="qr-hint">
                Al escanearlo, el alumno abre el formulario de registro de este
                salón.
              </p>
              <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                {qrUrl}
              </code>
            </div>
          </section>
        ) : null}

        <section className="section">
          <div className="admin-header" style={{ marginBottom: '0.75rem' }}>
            <div>
              <h3>Asistencias</h3>
              <p>
                {activeSalon
                  ? `${activeSalon.asistencias.length} registro(s) en ${activeSalon.nombre}.`
                  : 'Genera un nuevo registro para obtener tu QR.'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onDescargarExcel}
              disabled={!activeSalon}
            >
              Descargar Excel
            </button>
          </div>

          {!activeSalon || activeSalon.asistencias.length === 0 ? (
            <p className="empty">Aún no hay asistencias para este QR.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cuenta</th>
                    <th>Nombre</th>
                    <th>Apellido paterno</th>
                    <th>Apellido materno</th>
                    <th>Licenciatura</th>
                    <th>Semestre</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSalon.asistencias.map((a) => (
                    <tr key={a.id}>
                      <td>{a.numeroCuenta}</td>
                      <td>{a.nombre}</td>
                      <td>{a.apellidoPaterno}</td>
                      <td>{a.apellidoMaterno}</td>
                      <td>{a.licenciatura}</td>
                      <td>{a.semestre}</td>
                      <td>
                        {new Date(a.registradoEn).toLocaleTimeString('es-MX')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  )
}
