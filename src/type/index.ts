import type React from "react"
export interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType
  path: string
  isActive?: boolean
  subItems?: SubMenuItem[]
}

export interface SubMenuItem {
  id: string
  label: string
  path: string
  isActive?: boolean
}

export interface SidebarProps {
  darkMode: boolean
  rtlMode: boolean
  onDarkModeToggle: () => void
  onRtlModeToggle: () => void
}
