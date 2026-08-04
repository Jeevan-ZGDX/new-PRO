import { type ReactNode } from 'react'
import { AuthContext, useAuthProvider } from '@comp-dash/hooks'

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthProvider()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
