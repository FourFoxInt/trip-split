import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const themes = {
  light: {
    bg: '#fdf8f2',
    card: '#ffffff',
    border: '#e8c5a8',
    heading: '#1e3a5f',
    accent: '#3d6491',
    muted: '#d97757',
    subtle: '#f4e9d8',
    divider: '#e8c5a8',
    danger: '#c0624e',
    success: '#5a8a6a',
  },
  dark: {
    bg: '#1a2738',
    card: '#243650',
    border: '#3d4f6b',
    heading: '#f4e9d8',
    accent: '#d97757',
    muted: '#d4a48b',
    subtle: '#3d4f6b',
    divider: '#3d4f6b',
    danger: '#c0624e',
    success: '#5a8a6a',
  }
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    localStorage.setItem('theme', mode)
  }, [mode])

  const toggle = () => setMode(m => m === 'light' ? 'dark' : 'light')
  const theme = themes[mode]

  return (
    <ThemeContext.Provider value={{ theme, mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)