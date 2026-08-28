import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cityService } from '@/services/cityService'
import { cinemaService } from '@/services/cinemaService'
import { getCinemaCityId } from '@/utils/cinema'
import type { ICinema, ICity } from '@/types'

const CITY_STORAGE_KEY = 'selected-city-id'
const CINEMA_STORAGE_KEY = 'selected-cinema-id'

interface LocationContextType {
  cities: ICity[]
  cinemas: ICinema[]
  cityId: string
  cinemaId: string
  selectedCity: ICity | null
  selectedCinema: ICinema | null
  loading: boolean
  loadingCinemas: boolean
  setCityId: (id: string) => void
  setCinemaId: (id: string) => void
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

function readStorage(key: string): string {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function writeStorage(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // ignore storage errors
  }
}

function pickDefaultCityId(cities: ICity[], preferredId?: string | null): string {
  if (preferredId && cities.some((city) => city._id === preferredId)) {
    return preferredId
  }

  const jakarta = cities.find((city) => city.name.toLowerCase() === 'jakarta')
  if (jakarta) return jakarta._id

  return cities[0]?._id ?? ''
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<ICity[]>([])
  const [cinemas, setCinemas] = useState<ICinema[]>([])
  const [cityId, setCityIdState] = useState(() => readStorage(CITY_STORAGE_KEY))
  const [cinemaId, setCinemaIdState] = useState(() => readStorage(CINEMA_STORAGE_KEY))
  const [loading, setLoading] = useState(true)
  const [loadingCinemas, setLoadingCinemas] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadCities = async () => {
      setLoading(true)
      try {
        const result = await cityService.getCities({
          isActive: true,
          limit: 100,
          sort: 'sortOrder',
          order: 'asc',
        })
        if (cancelled) return

        setCities(result.items)
        setCityIdState((prev) =>
          pickDefaultCityId(result.items, prev || readStorage(CITY_STORAGE_KEY)),
        )
      } catch {
        if (!cancelled) setCities([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCities()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!cityId) {
      setCinemas([])
      setCinemaIdState('')
      return
    }

    let cancelled = false
    setLoadingCinemas(true)

    const loadCinemas = async () => {
      try {
        const result = await cinemaService.getCinemas({
          cityId,
          isActive: true,
          limit: 100,
          sort: 'sortOrder',
          order: 'asc',
        })
        if (cancelled) return

        setCinemas(result.items)

        const preferred = readStorage(CINEMA_STORAGE_KEY)
        setCinemaIdState((prev) => {
          if (prev && result.items.some((cinema) => cinema._id === prev)) return prev
          if (preferred && result.items.some((cinema) => cinema._id === preferred)) {
            return preferred
          }
          return result.items[0]?._id ?? ''
        })
      } catch {
        if (!cancelled) {
          setCinemas([])
          setCinemaIdState('')
        }
      } finally {
        if (!cancelled) setLoadingCinemas(false)
      }
    }

    loadCinemas()
    return () => {
      cancelled = true
    }
  }, [cityId])

  useEffect(() => {
    writeStorage(CITY_STORAGE_KEY, cityId)
  }, [cityId])

  useEffect(() => {
    writeStorage(CINEMA_STORAGE_KEY, cinemaId)
  }, [cinemaId])

  const setCityId = useCallback((id: string) => {
    setCityIdState((prev) => {
      if (prev === id) return prev
      setCinemaIdState('')
      return id
    })
  }, [])

  const setCinemaId = useCallback((id: string) => {
    setCinemaIdState(id)
  }, [])

  const selectedCity = useMemo(
    () => cities.find((city) => city._id === cityId) ?? null,
    [cities, cityId],
  )

  const selectedCinema = useMemo(
    () => cinemas.find((cinema) => cinema._id === cinemaId) ?? null,
    [cinemas, cinemaId],
  )

  // Keep city in sync if a cinema from another city is chosen (defensive)
  useEffect(() => {
    if (!selectedCinema) return
    const cinemaCityId = getCinemaCityId(selectedCinema)
    if (cinemaCityId && cinemaCityId !== cityId) {
      setCityIdState(cinemaCityId)
    }
  }, [selectedCinema, cityId])

  return (
    <LocationContext.Provider
      value={{
        cities,
        cinemas,
        cityId,
        cinemaId,
        selectedCity,
        selectedCinema,
        loading,
        loadingCinemas,
        setCityId,
        setCinemaId,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationCity() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocationCity must be used within a LocationProvider')
  return ctx
}
