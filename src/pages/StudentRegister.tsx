import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { LoginModal } from '../components/LoginModal'
import { useRegistro } from '../context/registro'
import { LICENCIATURAS, SEMESTRES } from '../data/licenciaturas'
import type { Evento } from '../types'
import {
  isValidAccount,
  isValidName,
  normalizeSpaces,
  onlyDigits,
  onlyNameChars,
} from '../utils/validation'

type FormState = {
  numeroCuenta: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  licenciatura: string
  semestre: string
}

type FormErrors = Partial<Record<keyof FormState | 'general', string>>

type EventoEstado =
  | { status: 'sin-qr' }
  | { status: 'cargando' }
  | { status: 'no-encontrado' }
  | { status: 'error'; message: string }
  | { status: 'listo'; evento: Evento }

const emptyForm: FormState = {
  numeroCuenta: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  licenciatura: '',
  semestre: '',
}

export function StudentRegister() {
  const { eventoId } = useParams()
  const { registrarAsistencia, getEventoPublico } = useRegistro()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loginOpen, setLoginOpen] = useState(false)
  const [registrado, setRegistrado] = useState<string | null>(null)
  const [estado, setEstado] = useState<EventoEstado>(
    eventoId ? { status: 'cargando' } : { status: 'sin-qr' },
  )
  const [submitting, setSubmitting] = useState(false)

  const cargarEvento = useCallback(
    async (id: string, isActive: () => boolean = () => true) => {
      setEstado({ status: 'cargando' })
      const { evento, error } = await getEventoPublico(id)
      if (!isActive()) return
      if (error) setEstado({ status: 'error', message: error })
      else if (!evento) setEstado({ status: 'no-encontrado' })
      else setEstado({ status: 'listo', evento })
    },
    [getEventoPublico],
  )

  useEffect(() => {
    if (!eventoId) {
      setEstado({ status: 'sin-qr' })
      return
    }
    let active = true
    void cargarEvento(eventoId, () => active)
    return () => {
      active = false
    }
  }, [eventoId, cargarEvento])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined, general: undefined }))
  }

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!isValidAccount(form.numeroCuenta)) {
      next.numeroCuenta = 'Ingresa un número de cuenta válido (5 a 12 dígitos).'
    }
    if (!isValidName(form.nombre)) {
      next.nombre = 'Revisa el nombre.'
    }
    if (!isValidName(form.apellidoPaterno)) {
      next.apellidoPaterno = 'Revisa el apellido paterno.'
    }
    if (!isValidName(form.apellidoMaterno)) {
      next.apellidoMaterno = 'Revisa el apellido materno.'
    }
    if (!form.licenciatura) {
      next.licenciatura = 'Selecciona una licenciatura.'
    }
    if (!form.semestre) {
      next.semestre = 'Selecciona el semestre.'
    }
    return next
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (estado.status !== 'listo') return

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const message = await registrarAsistencia(estado.evento.id, {
      numeroCuenta: form.numeroCuenta,
      nombre: normalizeSpaces(form.nombre),
      apellidoPaterno: normalizeSpaces(form.apellidoPaterno),
      apellidoMaterno: normalizeSpaces(form.apellidoMaterno),
      licenciatura: form.licenciatura,
      semestre: Number(form.semestre),
    })
    setSubmitting(false)

    if (message) {
      setErrors({ general: message })
      return
    }

    setForm(emptyForm)
    setErrors({})
    setRegistrado(estado.evento.nombre)
  }

  return (
    <div className="app-shell">
      <section className="panel">
        <h1 className="brand">Registro</h1>

        {estado.status === 'listo' ? (
          <>
            <div className="evento-badge">
              <span className="eyebrow">Evento</span>
              <strong>{estado.evento.nombre}</strong>
            </div>
            <p className="lede">
              Introduce tus datos para registrar tu asistencia.
            </p>
            {renderForm()}
          </>
        ) : (
          <div className="notice">
            {estado.status === 'cargando' ? <p>Cargando evento…</p> : null}
            {estado.status === 'sin-qr' ? (
              <p>
                Escanea el código QR que te comparta tu maestro para registrar
                tu asistencia.
              </p>
            ) : null}
            {estado.status === 'no-encontrado' ? (
              <p>
                Este código QR no es válido o el evento ya no existe. Pide a tu
                maestro el QR correcto.
              </p>
            ) : null}
            {estado.status === 'error' ? (
              <>
                <p>{estado.message} Revisa tu conexión a internet.</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => eventoId && void cargarEvento(eventoId)}
                >
                  Reintentar
                </button>
              </>
            ) : null}
          </div>
        )}

        <p className="form-credit">
          Este formulario ha sido realizado por{' '}
          <strong>David Salazar González</strong>, alumno de{' '}
          <strong>7°</strong> semestre de la{' '}
          <strong>Licenciatura en Ingeniería en Software</strong>.
        </p>
      </section>

      {registrado ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
          >
            <h2 id="success-title">Registro exitoso</h2>
            <p>
              Tu asistencia quedó registrada en <strong>{registrado}</strong>.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setRegistrado(null)}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="login-fab"
        onClick={() => setLoginOpen(true)}
      >
        Iniciar sesión
      </button>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )

  function renderForm() {
    return (
      <form className="form-stack" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="numeroCuenta">Número de cuenta</label>
          <input
            id="numeroCuenta"
            inputMode="numeric"
            autoComplete="off"
            value={form.numeroCuenta}
            onChange={(e) =>
              setField('numeroCuenta', onlyDigits(e.target.value))
            }
            placeholder="2024123456"
            maxLength={12}
          />
          <span className="error">{errors.numeroCuenta}</span>
        </div>

        <div className="field">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            value={form.nombre}
            onChange={(e) => setField('nombre', onlyNameChars(e.target.value))}
            placeholder="Nombre(s)"
            autoComplete="given-name"
          />
          <span className="error">{errors.nombre}</span>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="apellidoPaterno">Apellido paterno</label>
            <input
              id="apellidoPaterno"
              value={form.apellidoPaterno}
              onChange={(e) =>
                setField('apellidoPaterno', onlyNameChars(e.target.value))
              }
              placeholder="Apellido paterno"
              autoComplete="family-name"
            />
            <span className="error">{errors.apellidoPaterno}</span>
          </div>
          <div className="field">
            <label htmlFor="apellidoMaterno">Apellido materno</label>
            <input
              id="apellidoMaterno"
              value={form.apellidoMaterno}
              onChange={(e) =>
                setField('apellidoMaterno', onlyNameChars(e.target.value))
              }
              placeholder="Apellido materno"
            />
            <span className="error">{errors.apellidoMaterno}</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="licenciatura">Licenciatura</label>
          <select
            id="licenciatura"
            value={form.licenciatura}
            onChange={(e) => setField('licenciatura', e.target.value)}
          >
            <option value="">Selecciona una opción</option>
            {LICENCIATURAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <span className="error">{errors.licenciatura}</span>
        </div>

        <div className="field">
          <label htmlFor="semestre">Semestre</label>
          <select
            id="semestre"
            value={form.semestre}
            onChange={(e) => setField('semestre', e.target.value)}
          >
            <option value="">Selecciona el semestre</option>
            {SEMESTRES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="error">{errors.semestre}</span>
        </div>

        {errors.general ? (
          <p className="error form-error" role="alert">
            {errors.general}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
        >
          {submitting ? 'Enviando…' : 'Enviar registro'}
        </button>
      </form>
    )
  }
}
