import { type ReactNode } from 'react'
import { useColorScheme } from 'react-native'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
