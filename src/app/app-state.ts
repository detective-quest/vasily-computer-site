import type {
  CaseFile,
  CaseManifest,
} from '../core/types/case'

const STORAGE_KEY =
  'petrov-usb-site:explorer-state:v1'

interface PersistedAppState {
  activeFolderId?: string
  showHidden?: boolean
}

export interface AppState {
  manifest: CaseManifest
  activeFolderId: string
  selectedFileId: string | null
  showHidden: boolean
  searchQuery: string
  mobileFoldersOpen: boolean
}

function readPersistedState(): PersistedAppState {
  try {
    const rawValue =
      window.localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return {}
    }

    return JSON.parse(
      rawValue,
    ) as PersistedAppState
  } catch {
    return {}
  }
}

export function createInitialState(
  manifest: CaseManifest,
): AppState {
  const persisted = readPersistedState()
  const defaultFolderId =
    manifest.folders[0]?.id

  if (!defaultFolderId) {
    throw new Error(
      'В расследовании не создано ни одной папки.',
    )
  }

  const savedFolderExists =
    manifest.folders.some(
      (folder) =>
        folder.id ===
        persisted.activeFolderId,
    )

  const activeFolderId =
    savedFolderExists
      ? persisted.activeFolderId!
      : defaultFolderId

  const state: AppState = {
    manifest,
    activeFolderId,
    selectedFileId: null,
    showHidden:
      persisted.showHidden ?? false,
    searchQuery: '',
    mobileFoldersOpen: false,
  }

  state.selectedFileId =
    getVisibleFiles(state)[0]?.id ?? null

  return state
}

export function persistAppState(
  state: AppState,
): void {
  const value: PersistedAppState = {
    activeFolderId: state.activeFolderId,
    showHidden: state.showHidden,
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(value),
  )
}

export function getVisibleFiles(
  state: AppState,
): CaseFile[] {
  const normalizedQuery =
    state.searchQuery
      .trim()
      .toLocaleLowerCase('ru-RU')

  return state.manifest.files.filter(
    (file) => {
      if (
        file.folderId !==
        state.activeFolderId
      ) {
        return false
      }

      if (
        file.status === 'hidden' &&
        !state.showHidden
      ) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const searchableText = [
        file.name,
        file.mimeType,
        file.description ?? '',
      ]
        .join(' ')
        .toLocaleLowerCase('ru-RU')

      return searchableText.includes(
        normalizedQuery,
      )
    },
  )
}

export function getSelectedFile(
  state: AppState,
): CaseFile | null {
  const visibleFiles =
    getVisibleFiles(state)

  return (
    visibleFiles.find(
      (file) =>
        file.id === state.selectedFileId,
    ) ?? null
  )
}

export function normalizeSelection(
  state: AppState,
): void {
  const visibleFiles =
    getVisibleFiles(state)

  const selectedFileIsVisible =
    visibleFiles.some(
      (file) =>
        file.id === state.selectedFileId,
    )

  if (!selectedFileIsVisible) {
    state.selectedFileId =
      visibleFiles[0]?.id ?? null
  }
}