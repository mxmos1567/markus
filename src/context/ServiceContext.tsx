import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getServiceContainer, type ServiceContainer } from '../services/ServiceContainer'
import { LoadingScreen } from '../components/common/LoadingScreen'

const ServiceContext = createContext<ServiceContainer | null>(null)

export function ServiceProvider({ children }: { children: ReactNode }) {
  const services = useMemo(() => getServiceContainer(), [])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    services
      .init()
      .then(() => setReady(true))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
  }, [services])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-6 text-center text-warmwhite/80">
        <p>Memory Shelf could not open its archive: {error}</p>
      </div>
    )
  }

  if (!ready) return <LoadingScreen />

  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>
}

export function useServices(): ServiceContainer {
  const ctx = useContext(ServiceContext)
  if (!ctx) throw new Error('useServices must be used within a ServiceProvider')
  return ctx
}
