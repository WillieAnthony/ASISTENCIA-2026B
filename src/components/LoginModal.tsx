import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRegistro } from '../context/RegistroContext'

type Props = {
  open: boolean
  onClose: () => void
}

export function LoginModal({ open, onClose }: Props) {
  const { login } = useRegistro()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    const message = await login(correo, password)
    setSubmitting(false)
    if (message) {
      setError(message)
      return
    }
    setError('')
    onClose()
    navigate('/admin')
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="login-title">Iniciar sesión</h2>
        <p>Acceso para maestros. Correo y contraseña.</p>
        <form className="form-stack" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="email"
              autoComplete="username"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="1maestro23@maestro.com"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <span className="error">{error}</span>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Entrando…' : 'Aceptar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
