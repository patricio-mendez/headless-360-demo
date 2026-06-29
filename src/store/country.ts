import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CountryCode } from '@/lib/marketTickers'

interface CountryState {
  country: CountryCode
  setCountry: (country: CountryCode) => void
}

export const useCountryStore = create<CountryState>()(
  persist(
    (set) => ({
      country: 'CL',
      setCountry: (country) => set({ country }),
    }),
    {
      name: 'headless360-country',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
