import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { LoginModal } from '../components/LoginModal'
import { useRegistro } from '../context/RegistroContext'
import { LICENCIATURAS, SEMESTRES } from '../data/licenciaturas'
import type { SalonRegistro } from '../types'
import {
  isValidAccount,
  isValidName,
  onlyDigits,
  onlyLetters,
} from '../utils/validation'

type FormState = {
  numeroCuenta: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  licenciatura: string
  semestre: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const emptyForm: FormState = {
  numeroCuenta: '',
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  licenciatura: '',
  semestre: '',
}

export function StudentRegister() {
  const { salonId } = useParams()
  const { agregarAsistencia, getSalonPublico } = useRegistro()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loginOpen, setLoginOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [salon, setSalon] = useState<SalonRegistro | null>(null)
  const [salonLoading, setSalonLoading] = useState(Boolean(salonId))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!salonId) {
      setSalon(null)
      setSalonLoading(false)
      return
    }

    let active = true
    setSalonLoading(true)
    getSalonPublico(salonId).then((result) => {
      if (!active) return
      setSalon(result)
      setSalonLoading(false)
    })

    return () => {
      active = false
    }
  }, [salonId, getSalonPublico])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setSuccessOpen(false)
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
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (!salon) {
      setSuccessOpen(false)
      setErrors({
        numeroCuenta:
          'Escanea el código QR del salón para registrar tu asistencia.',
      })
      return
    }

    setSubmitting(true)
    const message = await agregarAsistencia(salon.id, {
      numeroCuenta: form.numeroCuenta,
      nombre: form.nombre.trim(),
      apellidoPaterno: form.apellidoPaterno.trim(),
      apellidoMaterno: form.apellidoMaterno.trim(),
      licenciatura: form.licenciatura,
      semestre: Number(form.semestre),
    })
    setSubmitting(false)

    if (message) {
      setErrors({ numeroCuenta: message })
      return
    }

    setForm(emptyForm)
    setErrors({})
    setSuccessOpen(true)
  }

  const closeSuccess = () => {
    setForm(emptyForm)
    setErrors({})
    setSuccessOpen(false)
  }

  return (
    <div className="app-shell">
      <section className="panel">
        <h1 className="brand">Registro</h1>
        <p className="lede">
          {salonLoading
            ? 'Cargando salón…'
            : salon
              ? `Introduce tus datos para registrar asistencia en ${salon.nombre}.`
              : 'Introduce tus datos para registrar asistencia.'}
        </p>

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
              onChange={(e) => setField('nombre', onlyLetters(e.target.value))}
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
                  setField('apellidoPaterno', onlyLetters(e.target.value))
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
                  setField('apellidoMaterno', onlyLetters(e.target.value))
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

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting || salonLoading}
          >
            {submitting ? 'Enviando…' : 'Enviar registro'}
          </button>

          <p className="form-credit">
            Este formulario ha sido realizado por{' '}
            <strong>David Salazar González</strong>, alumno de{' '}
            <strong>7°</strong> semestre de la{' '}
            <strong>Licenciatura en Ingeniería en Software</strong>.
          </p>
        </form>
      </section>

      {successOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
          >
            <h2 id="success-title">Registro exitoso</h2>
            <p>
              Su registro ha sido realizado correctamente. La asistencia quedó
              registrada.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={closeSuccess}
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
}
