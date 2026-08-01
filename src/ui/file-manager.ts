
import type {
  CaseFile,
  CaseFolder,
  CaseManifest,
} from '../core/types/case'

import {
  escapeHtml,
} from '../core/utilities/html'

const ROOT_FOLDER_ID =
  '__computer_root__'

type FolderTone =
  | 'blue'
  | 'teal'
  | 'purple'
  | 'amber'
  | 'steel'

interface FileManagerElements {
  window: HTMLElement
  title: HTMLElement
  address: HTMLElement
  breadcrumb: HTMLElement
  sidebar: HTMLElement
  content: HTMLElement
  status: HTMLElement
  search: HTMLInputElement
  backButton: HTMLButtonElement
  forwardButton: HTMLButtonElement
  upButton: HTMLButtonElement
  minimizeButton: HTMLButtonElement
  maximizeButton: HTMLButtonElement
  closeButton: HTMLButtonElement
}

function getFolderById(
  manifest: CaseManifest,
  folderId: string,
): CaseFolder | undefined {
  return manifest.folders.find(
    (folder) =>
      folder.id === folderId,
  )
}

function getChildFolders(
  manifest: CaseManifest,
  folderId: string,
): CaseFolder[] {
  return manifest.folders
    .filter((folder) => {
      if (
        folderId === ROOT_FOLDER_ID
      ) {
        return !folder.parentId
      }

      return (
        folder.parentId === folderId
      )
    })
    .sort((left, right) =>
      left.name.localeCompare(
        right.name,
        'ru-RU',
      ),
    )
}

function getFolderFiles(
  manifest: CaseManifest,
  folderId: string,
): CaseFile[] {
  if (
    folderId === ROOT_FOLDER_ID
  ) {
    return []
  }

  return manifest.files
    .filter(
      (file) =>
        file.folderId === folderId,
    )
    .sort((left, right) =>
      left.name.localeCompare(
        right.name,
        'ru-RU',
      ),
    )
}

function getSearchScopeFolderIds(
  manifest: CaseManifest,
  folderId: string,
): Set<string> {
  const result =
    new Set<string>()

  const pendingFolderIds =
    folderId === ROOT_FOLDER_ID
      ? getChildFolders(
          manifest,
          ROOT_FOLDER_ID,
        ).map((folder) =>
          folder.id,
        )
      : [folderId]

  while (pendingFolderIds.length > 0) {
    const nextFolderId =
      pendingFolderIds.shift()

    if (
      !nextFolderId ||
      result.has(nextFolderId)
    ) {
      continue
    }

    result.add(nextFolderId)

    const childFolderIds =
      getChildFolders(
        manifest,
        nextFolderId,
      ).map((folder) =>
        folder.id,
      )

    pendingFolderIds.push(
      ...childFolderIds,
    )
  }

  return result
}

function getSearchFolders(
  manifest: CaseManifest,
  folderId: string,
  searchQuery: string,
): CaseFolder[] {
  const scopeFolderIds =
    getSearchScopeFolderIds(
      manifest,
      folderId,
    )

  return manifest.folders
    .filter((folder) => {
      if (
        folder.id === folderId ||
        !scopeFolderIds.has(folder.id)
      ) {
        return false
      }

      return folder.name
        .toLocaleLowerCase('ru-RU')
        .includes(searchQuery)
    })
    .sort((left, right) => {
      const nameComparison =
        left.name.localeCompare(
          right.name,
          'ru-RU',
        )

      if (nameComparison !== 0) {
        return nameComparison
      }

      return left.id.localeCompare(
        right.id,
        'ru-RU',
      )
    })
}

function getSearchFiles(
  manifest: CaseManifest,
  folderId: string,
  searchQuery: string,
): CaseFile[] {
  const scopeFolderIds =
    getSearchScopeFolderIds(
      manifest,
      folderId,
    )

  return manifest.files
    .filter((file) =>
      scopeFolderIds.has(
        file.folderId,
      ) &&
      file.name
        .toLocaleLowerCase('ru-RU')
        .includes(searchQuery),
    )
    .sort((left, right) => {
      const nameComparison =
        left.name.localeCompare(
          right.name,
          'ru-RU',
        )

      if (nameComparison !== 0) {
        return nameComparison
      }

      return left.folderId.localeCompare(
        right.folderId,
        'ru-RU',
      )
    })
}

function getFolderLocationLabel(
  manifest: CaseManifest,
  folderId: string,
): string {
  const pathLabels =
    getFolderPath(
      manifest,
      folderId,
    )
      .slice(1)
      .map((pathFolderId) =>
        getFolderLabel(
          manifest,
          pathFolderId,
        ),
      )

  return pathLabels.length > 0
    ? pathLabels.join(' › ')
    : 'Этот компьютер'
}

function getFolderParentLocationLabel(
  manifest: CaseManifest,
  folder: CaseFolder,
): string {
  if (!folder.parentId) {
    return 'Этот компьютер'
  }

  return getFolderLocationLabel(
    manifest,
    folder.parentId,
  )
}

function getFolderParentId(
  manifest: CaseManifest,
  folderId: string,
): string | null {
  if (
    folderId === ROOT_FOLDER_ID
  ) {
    return null
  }

  const folder =
    getFolderById(
      manifest,
      folderId,
    )

  return (
    folder?.parentId ??
    ROOT_FOLDER_ID
  )
}

function getFolderLabel(
  manifest: CaseManifest,
  folderId: string,
): string {
  if (
    folderId === ROOT_FOLDER_ID
  ) {
    return 'Этот компьютер'
  }

  return (
    getFolderById(
      manifest,
      folderId,
    )?.name ??
    'Папка'
  )
}

function getFolderPath(
  manifest: CaseManifest,
  folderId: string,
): string[] {
  if (
    folderId === ROOT_FOLDER_ID
  ) {
    return [ROOT_FOLDER_ID]
  }

  const result: string[] = []
  const visited =
    new Set<string>()

  let currentId:
    string | undefined =
      folderId

  while (
    currentId &&
    !visited.has(currentId)
  ) {
    visited.add(currentId)
    result.unshift(currentId)

    const folder =
      getFolderById(
        manifest,
        currentId,
      )

    currentId =
      folder?.parentId
  }

  result.unshift(ROOT_FOLDER_ID)

  return result
}

function getRootFolderId(
  manifest: CaseManifest,
  folderId: string,
): string {
  if (
    folderId === ROOT_FOLDER_ID
  ) {
    return ROOT_FOLDER_ID
  }

  const path =
    getFolderPath(
      manifest,
      folderId,
    )

  return (
    path[1] ??
    ROOT_FOLDER_ID
  )
}

function getFolderTone(
  manifest: CaseManifest,
  folderId: string,
): FolderTone {
  const rootFolderId =
    getRootFolderId(
      manifest,
      folderId,
    )

  if (
    rootFolderId === 'work'
  ) {
    return 'teal'
  }

  if (
    rootFolderId === 'personal'
  ) {
    return 'purple'
  }

  if (
    rootFolderId === 'events'
  ) {
    return 'amber'
  }

  if (
    rootFolderId === 'archive' ||
    rootFolderId === 'trash'
  ) {
    return 'steel'
  }

  return 'blue'
}

function getFolderIconMarkup(
  tone: FolderTone,
): string {
  return `
    <svg
      class="
        file-manager-folder-icon
        file-manager-folder-icon--${tone}
      "
      viewBox="0 0 72 72"
      aria-hidden="true"
    >
      <ellipse
        class="folder-icon__shadow"
        cx="36"
        cy="61"
        rx="25"
        ry="5"
      ></ellipse>

      <path
        class="folder-icon__back"
        d="
          M8 20
          C8 17.8 9.8 16 12 16
          H29
          L35 22
          H60
          C62.2 22 64 23.8 64 26
          V53
          C64 55.2 62.2 57 60 57
          H12
          C9.8 57 8 55.2 8 53
          Z
        "
      ></path>

      <path
        class="folder-icon__front"
        d="
          M7 30
          H30
          L35 35
          H65
          L61 57
          H12
          C9.2 57 7 54.8 7 52
          Z
        "
      ></path>

      <path
        class="folder-icon__shine"
        d="
          M12 33
          H29
          L34 38
          H59
        "
      ></path>
    </svg>
  `
}

function getFileIconClass(
  file: CaseFile,
): string {
  if (
    file.status === 'corrupted'
  ) {
    return 'corrupted'
  }

  if (
    file.kind === 'spreadsheet'
  ) {
    return 'spreadsheet'
  }

  if (
    file.kind === 'audio'
  ) {
    return 'audio'
  }

  if (
    file.kind === 'archive'
  ) {
    return 'archive'
  }

  if (
    file.kind === 'text'
  ) {
    return 'text'
  }

  return 'document'
}

function getFileIconMarkup(
  file: CaseFile,
): string {
  const iconClass =
    getFileIconClass(file)

  return `
    <svg
      class="
        file-manager-file-icon
        file-manager-file-icon--${iconClass}
      "
      viewBox="0 0 72 72"
      aria-hidden="true"
    >
      <ellipse
        class="file-icon__shadow"
        cx="36"
        cy="62"
        rx="21"
        ry="4"
      ></ellipse>

      <path
        class="file-icon__sheet"
        d="
          M18 9
          H44
          L56 21
          V58
          C56 60.2 54.2 62 52 62
          H20
          C17.8 62 16 60.2 16 58
          V13
          C16 10.8 17.8 9 18 9
          Z
        "
      ></path>

      <path
        class="file-icon__fold"
        d="
          M44 9
          V19
          C44 20.1 44.9 21 46 21
          H56
          Z
        "
      ></path>

      <path
        class="file-icon__line"
        d="M24 31 H48"
      ></path>

      <path
        class="file-icon__line"
        d="M24 38 H48"
      ></path>

      <path
        class="file-icon__line"
        d="M24 45 H42"
      ></path>
    </svg>
  `
}

function renderBreadcrumb(
  manifest: CaseManifest,
  folderId: string,
): string {
  return getFolderPath(
    manifest,
    folderId,
  )
    .map(
      (pathFolderId, index) => {
        const label =
          getFolderLabel(
            manifest,
            pathFolderId,
          )

        return `
          ${
            index > 0
              ? `
                <span
                  class="
                    file-manager-breadcrumb__separator
                  "
                  aria-hidden="true"
                >
                  ›
                </span>
              `
              : ''
          }

          <button
            class="
              file-manager-breadcrumb__item
            "
            type="button"
            data-breadcrumb-folder-id="${escapeHtml(
              pathFolderId,
            )}"
          >
            ${escapeHtml(label)}
          </button>
        `
      },
    )
    .join('')
}

function renderSidebar(
  manifest: CaseManifest,
  currentFolderId: string,
): string {
  const currentRootId =
    getRootFolderId(
      manifest,
      currentFolderId,
    )

  const rootFolders =
    getChildFolders(
      manifest,
      ROOT_FOLDER_ID,
    )

  return `
    <button
      class="
        file-manager-sidebar__item
        ${
          currentFolderId ===
          ROOT_FOLDER_ID
            ? 'is-active'
            : ''
        }
      "
      type="button"
      data-sidebar-folder-id="${ROOT_FOLDER_ID}"
    >
      <span
        class="
          file-manager-sidebar__computer
        "
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24">
          <rect
            x="3"
            y="4"
            width="18"
            height="13"
            rx="2"
          ></rect>

          <path d="M8 21 H16"></path>
          <path d="M12 17 V21"></path>
        </svg>
      </span>

      <span>Этот компьютер</span>
    </button>

    <div
      class="
        file-manager-sidebar__divider
      "
    ></div>

    ${rootFolders
      .map((folder) => {
        const tone =
          getFolderTone(
            manifest,
            folder.id,
          )

        const isActive =
          currentRootId === folder.id

        return `
          <button
            class="
              file-manager-sidebar__item
              ${
                isActive
                  ? 'is-active'
                  : ''
              }
            "
            type="button"
            data-sidebar-folder-id="${escapeHtml(
              folder.id,
            )}"
          >
            <span
              class="
                file-manager-sidebar__folder
                file-manager-sidebar__folder--${tone}
              "
              aria-hidden="true"
            ></span>

            <span>
              ${escapeHtml(folder.name)}
            </span>
          </button>
        `
      })
      .join('')}
  `
}

function renderFolderCard(
  manifest: CaseManifest,
  folder: CaseFolder,
  detailText?: string,
): string {
  const tone =
    getFolderTone(
      manifest,
      folder.id,
    )

  const childCount =
    getChildFolders(
      manifest,
      folder.id,
    ).length

  const fileCount =
    getFolderFiles(
      manifest,
      folder.id,
    ).length

  const totalCount =
    childCount + fileCount

  const resolvedDetailText =
    detailText ??
    (
      totalCount === 0
        ? 'Папка'
        : `Элементов: ${totalCount}`
    )

  return `
    <button
      class="file-manager-item"
      type="button"
      data-file-manager-folder
      data-folder-id="${escapeHtml(
        folder.id,
      )}"
      aria-label="Открыть папку ${escapeHtml(
        folder.name,
      )}"
    >
      <span
        class="
          file-manager-item__icon
        "
      >
        ${getFolderIconMarkup(tone)}
      </span>

      <span
        class="
          file-manager-item__details
        "
      >
        <strong>
          ${escapeHtml(folder.name)}
        </strong>

        <small>
          ${escapeHtml(
            resolvedDetailText,
          )}
        </small>
      </span>
    </button>
  `
}

function renderFileCard(
  file: CaseFile,
  detailText?: string,
): string {
  const resolvedDetailText =
    detailText ??
    file.sizeLabel

  return `
    <button
      class="
        file-manager-item
        file-manager-item--file
      "
      type="button"
      data-file-manager-file
      data-file-id="${escapeHtml(
        file.id,
      )}"
      data-file-name="${escapeHtml(
        file.name,
      )}"
    >
      <span
        class="
          file-manager-item__icon
        "
      >
        ${getFileIconMarkup(file)}
      </span>

      <span
        class="
          file-manager-item__details
        "
      >
        <strong>
          ${escapeHtml(file.name)}
        </strong>

        <small>
          ${escapeHtml(
            resolvedDetailText,
          )}
        </small>
      </span>
    </button>
  `
}

function closeSystemMenu(
  root: HTMLDivElement,
): void {
  const menu =
    root.querySelector<HTMLElement>(
      '[data-system-menu]',
    )

  const menuButton =
    root.querySelector<HTMLButtonElement>(
      '[data-system-menu-button]',
    )

  if (menu) {
    menu.hidden = true
  }

  menuButton?.setAttribute(
    'aria-expanded',
    'false',
  )
}

export function attachFileManager(
  root: HTMLDivElement,
  manifest: CaseManifest,
): void {
  const desktopShell =
    root.querySelector<HTMLElement>(
      '[data-desktop-shell]',
    )

  if (!desktopShell) {
    throw new Error(
      'Не найден рабочий стол для файлового менеджера.',
    )
  }

  let elements:
    FileManagerElements | null = null

  let currentFolderId =
    'documents'

  let history: string[] = [
    currentFolderId,
  ]

  let historyIndex = 0

  let selectedItem:
    HTMLElement | null = null

  let toastTimerId:
    number | null = null

  const taskbarButton =
    root.querySelector<HTMLButtonElement>(
      `
        [data-taskbar-open]
        [data-target-id="documents"]
      `,
    ) ??
    root.querySelector<HTMLButtonElement>(
      `
        [data-taskbar-open][data-target-id="documents"]
      `,
    )

  const setTaskbarState = (
    isOpen: boolean,
    isActive: boolean,
  ): void => {
    if (!taskbarButton) {
      return
    }

    taskbarButton.classList.toggle(
      'taskbar__application--open',
      isOpen,
    )

    taskbarButton.classList.toggle(
      'taskbar__application--active',
      isActive,
    )
  }

  const showWindowToast = (
    message: string,
  ): void => {
    if (!elements) {
      return
    }

    let toast =
      elements.window.querySelector<HTMLElement>(
        '[data-file-manager-toast]',
      )

    if (!toast) {
      toast =
        document.createElement('div')

      toast.className =
        'file-manager-toast'

      toast.dataset.fileManagerToast =
        ''

      elements.window.append(toast)
    }

    toast.textContent = message
    toast.hidden = false

    if (
      toastTimerId !== null
    ) {
      window.clearTimeout(
        toastTimerId,
      )
    }

    toastTimerId =
      window.setTimeout(
        () => {
          if (toast) {
            toast.hidden = true
          }

          toastTimerId = null
        },
        2400,
      )
  }

  const updateNavigationButtons =
    (): void => {
      if (!elements) {
        return
      }

      elements.backButton.disabled =
        historyIndex <= 0

      elements.forwardButton.disabled =
        historyIndex >=
        history.length - 1

      elements.upButton.disabled =
        getFolderParentId(
          manifest,
          currentFolderId,
        ) === null
    }

  const clearSelection =
    (): void => {
      selectedItem?.classList.remove(
        'is-selected',
      )

      selectedItem = null
    }

  const selectItem = (
    item: HTMLElement,
  ): void => {
    clearSelection()

    selectedItem = item

    selectedItem.classList.add(
      'is-selected',
    )
  }

  const renderCurrentFolder =
    (): void => {
      if (!elements) {
        return
      }

      clearSelection()

      const folderLabel =
        getFolderLabel(
          manifest,
          currentFolderId,
        )

      const searchQuery =
        elements.search.value
          .trim()
          .toLocaleLowerCase('ru-RU')

      const isSearching =
        searchQuery.length > 0

      const folders =
        isSearching
          ? getSearchFolders(
              manifest,
              currentFolderId,
              searchQuery,
            )
          : getChildFolders(
              manifest,
              currentFolderId,
            )

      const files =
        isSearching
          ? getSearchFiles(
              manifest,
              currentFolderId,
              searchQuery,
            )
          : getFolderFiles(
              manifest,
              currentFolderId,
            )

      elements.title.textContent =
        `Файловый менеджер — ${folderLabel}`

      elements.address.textContent =
        getFolderPath(
          manifest,
          currentFolderId,
        )
          .map((folderId) =>
            getFolderLabel(
              manifest,
              folderId,
            ),
          )
          .join('  ›  ')

      elements.breadcrumb.innerHTML =
        renderBreadcrumb(
          manifest,
          currentFolderId,
        )

      elements.sidebar.innerHTML =
        renderSidebar(
          manifest,
          currentFolderId,
        )

      if (
        folders.length === 0 &&
        files.length === 0
      ) {
        elements.content.innerHTML = `
          <div
            class="
              file-manager-empty
            "
          >
            <div
              class="
                file-manager-empty__icon
              "
              aria-hidden="true"
            >
              ${
                isSearching
                  ? '⌕'
                  : '□'
              }
            </div>

            <strong>
              ${
                isSearching
                  ? 'Ничего не найдено'
                  : 'Папка пока пустая'
              }
            </strong>

            <span>
              ${
                isSearching
                  ? 'Совпадений в этой папке и вложенных папках нет.'
                  : 'Файлы будут добавлены на следующем этапе.'
              }
            </span>
          </div>
        `
      } else {
        elements.content.innerHTML = `
          <div
            class="
              file-manager-items
            "
          >
            ${folders
              .map((folder) =>
                renderFolderCard(
                  manifest,
                  folder,
                  isSearching
                    ? getFolderParentLocationLabel(
                        manifest,
                        folder,
                      )
                    : undefined,
                ),
              )
              .join('')}

            ${files
              .map((file) =>
                renderFileCard(
                  file,
                  isSearching
                    ? `${getFolderLocationLabel(
                        manifest,
                        file.folderId,
                      )} · ${file.sizeLabel}`
                    : undefined,
                ),
              )
              .join('')}
          </div>
        `
      }

      const itemCount =
        folders.length +
        files.length

      elements.status.textContent =
        isSearching
          ? `Найдено элементов: ${itemCount}`
          : `Папок: ${folders.length} · Файлов: ${files.length}`

      updateNavigationButtons()
    }

  const setCurrentFolder = (
    folderId: string,
    addToHistory: boolean,
  ): void => {
    const folderExists =
      folderId === ROOT_FOLDER_ID ||
      Boolean(
        getFolderById(
          manifest,
          folderId,
        ),
      )

    if (!folderExists) {
      return
    }

    currentFolderId = folderId

    if (addToHistory) {
      history =
        history.slice(
          0,
          historyIndex + 1,
        )

      history.push(folderId)
      historyIndex =
        history.length - 1
    }

    if (elements) {
      elements.search.value = ''
    }

    renderCurrentFolder()
  }

  const createWindow =
    (): FileManagerElements => {
      const windowElement =
        document.createElement('section')

      windowElement.className =
        'file-manager-window'

      windowElement.dataset.fileManagerWindow =
        ''

      windowElement.innerHTML = `
        <header
          class="
            file-manager-titlebar
          "
        >
          <div
            class="
              file-manager-titlebar__identity
            "
          >
            <span
              class="
                file-manager-titlebar__icon
              "
              aria-hidden="true"
            >
              ${getFolderIconMarkup(
                'blue',
              )}
            </span>

            <div>
              <strong
                data-file-manager-title
              >
                Файловый менеджер
              </strong>

              <span>
                Персональный компьютер
              </span>
            </div>
          </div>

          <div
            class="
              file-manager-titlebar__controls
            "
          >
            <button
              type="button"
              aria-label="Свернуть"
              title="Свернуть"
              data-file-manager-minimize
            >
              <span aria-hidden="true">
                —
              </span>
            </button>

            <button
              type="button"
              aria-label="Развернуть"
              title="Развернуть"
              data-file-manager-maximize
            >
              <span
                class="
                  file-manager-control-square
                "
                aria-hidden="true"
              ></span>
            </button>

            <button
              class="
                file-manager-titlebar__close
              "
              type="button"
              aria-label="Закрыть"
              title="Закрыть"
              data-file-manager-close
            >
              <span aria-hidden="true">
                ×
              </span>
            </button>
          </div>
        </header>

        <div
          class="
            file-manager-toolbar
          "
        >
          <div
            class="
              file-manager-toolbar__navigation
            "
          >
            <button
              type="button"
              aria-label="Назад"
              title="Назад"
              data-file-manager-back
            >
              ←
            </button>

            <button
              type="button"
              aria-label="Вперёд"
              title="Вперёд"
              data-file-manager-forward
            >
              →
            </button>

            <button
              type="button"
              aria-label="На уровень выше"
              title="На уровень выше"
              data-file-manager-up
            >
              ↑
            </button>
          </div>

          <div
            class="
              file-manager-address
            "
          >
            <span
              class="
                file-manager-address__icon
              "
              aria-hidden="true"
            >
              ▣
            </span>

            <span
              data-file-manager-address
            ></span>
          </div>

          <label
            class="
              file-manager-search
            "
          >
            <span
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              autocomplete="off"
              placeholder="Поиск в папке и внутри"
              aria-label="Поиск в текущей папке и вложенных папках"
              data-file-manager-search
            />
          </label>
        </div>

        <div
          class="
            file-manager-breadcrumb
          "
          data-file-manager-breadcrumb
        ></div>

        <div
          class="
            file-manager-layout
          "
        >
          <aside
            class="
              file-manager-sidebar
            "
            data-file-manager-sidebar
          ></aside>

          <main
            class="
              file-manager-content
            "
            data-file-manager-content
            tabindex="0"
          ></main>
        </div>

        <footer
          class="
            file-manager-statusbar
          "
        >
          <span
            data-file-manager-status
          ></span>

          <span>
            Локальное хранилище
          </span>
        </footer>
      `

      desktopShell.append(
        windowElement,
      )

      const result:
        FileManagerElements = {
          window: windowElement,

          title:
            windowElement.querySelector<HTMLElement>(
              '[data-file-manager-title]',
            )!,

          address:
            windowElement.querySelector<HTMLElement>(
              '[data-file-manager-address]',
            )!,

          breadcrumb:
            windowElement.querySelector<HTMLElement>(
              '[data-file-manager-breadcrumb]',
            )!,

          sidebar:
            windowElement.querySelector<HTMLElement>(
              '[data-file-manager-sidebar]',
            )!,

          content:
            windowElement.querySelector<HTMLElement>(
              '[data-file-manager-content]',
            )!,

          status:
            windowElement.querySelector<HTMLElement>(
              '[data-file-manager-status]',
            )!,

          search:
            windowElement.querySelector<HTMLInputElement>(
              '[data-file-manager-search]',
            )!,

          backButton:
            windowElement.querySelector<HTMLButtonElement>(
              '[data-file-manager-back]',
            )!,

          forwardButton:
            windowElement.querySelector<HTMLButtonElement>(
              '[data-file-manager-forward]',
            )!,

          upButton:
            windowElement.querySelector<HTMLButtonElement>(
              '[data-file-manager-up]',
            )!,

          minimizeButton:
            windowElement.querySelector<HTMLButtonElement>(
              '[data-file-manager-minimize]',
            )!,

          maximizeButton:
            windowElement.querySelector<HTMLButtonElement>(
              '[data-file-manager-maximize]',
            )!,

          closeButton:
            windowElement.querySelector<HTMLButtonElement>(
              '[data-file-manager-close]',
            )!,
        }

      result.backButton.addEventListener(
        'click',
        () => {
          if (historyIndex <= 0) {
            return
          }

          historyIndex -= 1

          currentFolderId =
            history[historyIndex]

          result.search.value = ''

          renderCurrentFolder()
        },
      )

      result.forwardButton.addEventListener(
        'click',
        () => {
          if (
            historyIndex >=
            history.length - 1
          ) {
            return
          }

          historyIndex += 1

          currentFolderId =
            history[historyIndex]

          result.search.value = ''

          renderCurrentFolder()
        },
      )

      result.upButton.addEventListener(
        'click',
        () => {
          const parentId =
            getFolderParentId(
              manifest,
              currentFolderId,
            )

          if (parentId) {
            setCurrentFolder(
              parentId,
              true,
            )
          }
        },
      )

      result.search.addEventListener(
        'input',
        renderCurrentFolder,
      )

      result.minimizeButton.addEventListener(
        'click',
        () => {
          result.window.hidden = true

          setTaskbarState(
            true,
            false,
          )
        },
      )

      result.maximizeButton.addEventListener(
        'click',
        () => {
          const isMaximized =
            result.window.classList.toggle(
              'file-manager-window--maximized',
            )

          result.maximizeButton.setAttribute(
            'aria-label',
            isMaximized
              ? 'Восстановить размер'
              : 'Развернуть',
          )

          result.maximizeButton.setAttribute(
            'title',
            isMaximized
              ? 'Восстановить размер'
              : 'Развернуть',
          )
        },
      )

      result.closeButton.addEventListener(
        'click',
        () => {
          result.window.remove()

          elements = null

          setTaskbarState(
            false,
            false,
          )
        },
      )

      result.breadcrumb.addEventListener(
        'click',
        (event) => {
          const target =
            event.target

          if (!(target instanceof Element)) {
            return
          }

          const button =
            target.closest<HTMLButtonElement>(
              '[data-breadcrumb-folder-id]',
            )

          const folderId =
            button?.dataset
              .breadcrumbFolderId

          if (folderId) {
            setCurrentFolder(
              folderId,
              true,
            )
          }
        },
      )

      result.sidebar.addEventListener(
        'click',
        (event) => {
          const target =
            event.target

          if (!(target instanceof Element)) {
            return
          }

          const button =
            target.closest<HTMLButtonElement>(
              '[data-sidebar-folder-id]',
            )

          const folderId =
            button?.dataset
              .sidebarFolderId

          if (folderId) {
            setCurrentFolder(
              folderId,
              true,
            )
          }
        },
      )

      result.content.addEventListener(
        'click',
        (event) => {
          const target =
            event.target

          if (!(target instanceof Element)) {
            return
          }

          const item =
            target.closest<HTMLElement>(
              `
                [data-file-manager-folder],
                [data-file-manager-file]
              `,
            )

          if (!item) {
            clearSelection()
            return
          }

          selectItem(item)

          const coarsePointer =
            window.matchMedia(
              '(pointer: coarse)',
            ).matches

          if (
            coarsePointer &&
            item.dataset.folderId
          ) {
            setCurrentFolder(
              item.dataset.folderId,
              true,
            )
          }
        },
      )

      result.content.addEventListener(
        'dblclick',
        (event) => {
          const target =
            event.target

          if (!(target instanceof Element)) {
            return
          }

          const folderItem =
            target.closest<HTMLElement>(
              '[data-file-manager-folder]',
            )

          if (
            folderItem?.dataset.folderId
          ) {
            setCurrentFolder(
              folderItem.dataset.folderId,
              true,
            )

            return
          }

          const fileItem =
            target.closest<HTMLElement>(
              '[data-file-manager-file]',
            )

          if (fileItem) {
            const fileName =
              fileItem.dataset.fileName ??
              'Файл'

            showWindowToast(
              `Просмотр файла «${fileName}» подключим следующим этапом.`,
            )
          }
        },
      )

      result.content.addEventListener(
        'keydown',
        (event) => {
          if (
            event.key !== 'Enter'
          ) {
            return
          }

          const activeElement =
            document.activeElement

          if (
            !(
              activeElement instanceof
              HTMLElement
            )
          ) {
            return
          }

          const folderId =
            activeElement.dataset.folderId

          if (folderId) {
            setCurrentFolder(
              folderId,
              true,
            )
          }
        },
      )

      result.window.addEventListener(
        'mousedown',
        () => {
          result.window.classList.add(
            'file-manager-window--focused',
          )
        },
      )

      return result
    }

  const openWindow = (
    folderId: string,
  ): void => {
    const validFolderId =
      folderId === ROOT_FOLDER_ID ||
      getFolderById(
        manifest,
        folderId,
      )
        ? folderId
        : 'documents'

    if (!elements) {
      currentFolderId =
        validFolderId

      history = [
        validFolderId,
      ]

      historyIndex = 0

      elements =
        createWindow()

      renderCurrentFolder()
    } else {
      elements.window.hidden = false

      if (
        currentFolderId !==
        validFolderId
      ) {
        setCurrentFolder(
          validFolderId,
          true,
        )
      }
    }

    elements.window.classList.add(
      'file-manager-window--focused',
    )

    setTaskbarState(
      true,
      true,
    )

    closeSystemMenu(root)
  }

  const isFolderTarget = (
    targetId: string | undefined,
  ): targetId is string => {
    if (!targetId) {
      return false
    }

    return Boolean(
      getFolderById(
        manifest,
        targetId,
      ),
    )
  }
    /*
   * На телефонах и узких экранах папки
   * рабочего стола открываются одним нажатием.
   * На компьютере сохраняется двойной клик.
   */
  root.addEventListener(
    'click',
    (event) => {
      const useSingleTap =
        window.matchMedia(
          '(pointer: coarse)',
        ).matches ||
        window.matchMedia(
          '(max-width: 820px)',
        ).matches

      if (!useSingleTap) {
        return
      }

      const target =
        event.target

      if (!(target instanceof Element)) {
        return
      }

      const button =
        target.closest<HTMLButtonElement>(
          '[data-desktop-icon]',
        )

      const targetId =
        button?.dataset.targetId

      if (
        !isFolderTarget(targetId)
      ) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      openWindow(targetId)
    },
    true,
  )

  root.addEventListener(
    'dblclick',
    (event) => {
      const target =
        event.target

      if (!(target instanceof Element)) {
        return
      }

      const button =
        target.closest<HTMLButtonElement>(
          '[data-desktop-icon]',
        )

      const targetId =
        button?.dataset.targetId

      if (
        !isFolderTarget(targetId)
      ) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      openWindow(targetId)
    },
    true,
  )

  root.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key !== 'Enter' &&
        event.key !== ' '
      ) {
        return
      }

      const target =
        event.target

      if (!(target instanceof Element)) {
        return
      }

      const button =
        target.closest<HTMLButtonElement>(
          '[data-desktop-icon]',
        )

      const targetId =
        button?.dataset.targetId

      if (
        !isFolderTarget(targetId)
      ) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      openWindow(targetId)
    },
    true,
  )

  root.addEventListener(
    'click',
    (event) => {
      const target =
        event.target

      if (!(target instanceof Element)) {
        return
      }

      const button =
        target.closest<HTMLButtonElement>(
          `
            [data-menu-open],
            [data-taskbar-open]
          `,
        )

      if (!button) {
        return
      }

      const targetId =
        button.dataset.targetId

      if (
        !isFolderTarget(targetId)
      ) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      const isTaskbarButton =
        button.hasAttribute(
          'data-taskbar-open',
        )

      if (
        isTaskbarButton &&
        elements &&
        !elements.window.hidden
      ) {
        elements.window.hidden = true

        setTaskbarState(
          true,
          false,
        )

        return
      }

      openWindow(targetId)
    },
    true,
  )
    }