import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

// Cores de tema disponíveis (incluindo cores primárias de partidos)
export type ColorTheme = 
  | 'emerald'   // Verde Esmeralda (padrão)
  | 'blue'      // Azul
  | 'red'       // Vermelho
  | 'orange'    // Laranja
  | 'yellow'    // Amarelo
  | 'green'     // Verde Bandeira
  | 'purple'    // Roxo
  | 'pink'      // Rosa
  | 'cyan'      // Ciano
  | 'indigo'    // Índigo
  | 'teal'      // Teal
  | 'slate'     // Cinza

export const colorThemes: { id: ColorTheme; name: string; color: string }[] = [
  { id: 'emerald', name: 'Esmeralda', color: '#10b981' },
  { id: 'blue', name: 'Azul', color: '#3b82f6' },
  { id: 'red', name: 'Vermelho', color: '#ef4444' },
  { id: 'orange', name: 'Laranja', color: '#f97316' },
  { id: 'yellow', name: 'Amarelo', color: '#eab308' },
  { id: 'green', name: 'Verde', color: '#22c55e' },
  { id: 'purple', name: 'Roxo', color: '#a855f7' },
  { id: 'pink', name: 'Rosa', color: '#ec4899' },
  { id: 'cyan', name: 'Ciano', color: '#06b6d4' },
  { id: 'indigo', name: 'Índigo', color: '#6366f1' },
  { id: 'teal', name: 'Teal', color: '#14b8a6' },
  { id: 'slate', name: 'Cinza', color: '#64748b' },
]

interface ThemeContextType {
  theme: Theme
  colorTheme: ColorTheme
  backgroundImage: string | null
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  setColorTheme: (color: ColorTheme) => void
  setBackgroundImage: (url: string | null) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Tema claro como padrão para usuários logados
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dte-theme') as Theme
      if (saved) return saved
      // Padrão: tema claro
      return 'light'
    }
    return 'light'
  })

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dte-color-theme') as ColorTheme
      if (saved) return saved
    }
    return 'slate'
  })

  const [backgroundImage, setBackgroundImageState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dte-bg-image')
    }
    return null
  })

  // Aplicar tema claro/escuro
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('dte-theme', theme)
  }, [theme])

  // Aplicar tema de cor
  useEffect(() => {
    const root = window.document.documentElement
    // Remover todas as classes de tema de cor
    colorThemes.forEach(t => root.classList.remove(`theme-${t.id}`))
    // Adicionar a classe do tema atual
    root.classList.add(`theme-${colorTheme}`)
    localStorage.setItem('dte-color-theme', colorTheme)
  }, [colorTheme])

  // Aplicar imagem de fundo
  useEffect(() => {
    const root = window.document.documentElement
    if (backgroundImage) {
      root.classList.add('has-background-image')
      root.style.setProperty('--custom-bg-image', `url(${backgroundImage})`)
      localStorage.setItem('dte-bg-image', backgroundImage)
    } else {
      root.classList.remove('has-background-image')
      root.style.removeProperty('--custom-bg-image')
      localStorage.removeItem('dte-bg-image')
    }
  }, [backgroundImage])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const setColorTheme = (color: ColorTheme) => {
    setColorThemeState(color)
  }

  const setBackgroundImage = (url: string | null) => {
    setBackgroundImageState(url)
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colorTheme, 
      backgroundImage,
      toggleTheme, 
      setTheme, 
      setColorTheme,
      setBackgroundImage 
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
