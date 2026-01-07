"use client"

import * as React from "react"

type ReadingMode = 'list' | 'reading'

interface ReadingModeContextType {
  mode: ReadingMode
  setMode: (mode: ReadingMode) => void
}

const ReadingModeContext = React.createContext<ReadingModeContextType | undefined>(
  undefined
)

export function ReadingModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ReadingMode>('list')

  // Load from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('reading-mode')
    if (saved === 'list' || saved === 'reading') {
      setModeState(saved)
    }
  }, [])

  // Save to localStorage when mode changes
  const setMode = React.useCallback((newMode: ReadingMode) => {
    setModeState(newMode)
    localStorage.setItem('reading-mode', newMode)
  }, [])

  return (
    <ReadingModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ReadingModeContext.Provider>
  )
}

export function useReadingMode() {
  const context = React.useContext(ReadingModeContext)
  if (context === undefined) {
    throw new Error('useReadingMode must be used within a ReadingModeProvider')
  }
  return context
}
