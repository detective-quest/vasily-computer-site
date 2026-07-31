export type DesktopIconType =
  | 'folder'
  | 'application'

export interface SystemProfile {
  displayName: string
  password: string
  passwordHint: string
}

export interface SystemBootConfig {
  messages: string[]
}

export interface SystemWallpaper {
  type: 'gradient'
  preset: string
}

export interface SystemDesktopIcon {
  id: string
  type: DesktopIconType
  targetId: string
  label: string
}

export interface SystemDesktopConfig {
  wallpaper: SystemWallpaper
  icons: SystemDesktopIcon[]
}

export interface SystemConfig {
  id: string
  profile: SystemProfile
  boot: SystemBootConfig
  desktop: SystemDesktopConfig
}