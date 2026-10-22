import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { GenerarQr } from '../components/GenerarQr'
import { Listados } from '../components/Listados'
import { useRegistro } from '../context/registro'

type Vista = 'generar' | 'listados'

export function TeacherDashboard() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const {
    teacher,
    loading,
    logout,
    eventos,
    eventosError,
    eventosLoading,
    refreshEventos,
    setActiveEventoId,
  } = useRegistro()
  const vista: Vista = params.get('vista') === 'listados' ? 'listados' : 'generar'

  const irA = (next: Vista) => {
    setParams(next === 'generar' ? {} : { vista: next })
  }

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

  return (
    <div className="app-shell">
      <section className="panel panel-wide">
        <div className="admin-header">
          <div>
            <h1 className="brand">Registro</h1>
            <p className="lede">Sesión de maestro: {teacher.correo}</p>
          </div>
          <div className="admin-actions">
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

        <div className="tabs" role="tablist" aria-label="Apartados">
          <button
            type="button"
            role="tab"
            id="tab-generar"
            aria-selected={vista === 'generar'}
            aria-controls="panel-generar"
            className="tab"
            onClick={() => irA('generar')}
          >
            Generar QR
          </button>
          <button
            type="button"
            role="tab"
            id="tab-listados"
            aria-selected={vista === 'listados'}
            aria-controls="panel-listados"
            className="tab"
            onClick={() => irA('listados')}
          >
            Listados
            <span className="tab-count">{eventos.length}</span>
          </button>
        </div>

        {eventosError ? (
          <div className="form-error load-error" role="alert">
            <span className="error">{eventosError}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => void refreshEventos()}
              disabled={eventosLoading}
            >
              {eventosLoading ? 'Cargando…' : 'Reintentar'}
            </button>
          </div>
        ) : null}

        {vista === 'generar' ? (
          <div role="tabpanel" id="panel-generar" aria-labelledby="tab-generar">
            <GenerarQr
              onVerListado={(id) => {
                setActiveEventoId(id)
                irA('listados')
              }}
            />
          </div>
        ) : (
          <div
            role="tabpanel"
            id="panel-listados"
            aria-labelledby="tab-listados"
          >
            <Listados />
          </div>
        )}
      </section>
    </div>
  )
}
