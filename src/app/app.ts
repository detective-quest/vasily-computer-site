import { loadDefaultCase } from '../cases/case-loader'

import type {
  CaseFile,
  FileKind,
} from '../core/types/case'

import { escapeHtml } from '../core/utilities/html'

import {
  downloadFile,
  openFileViewer,
} from '../viewers/viewer-manager'

import {
  createInitialState,
  getSelectedFile,
  getVisibleFiles,
  normalizeSelection,
  persistAppState,
  type AppState,
} from './app-state'

const fileTypeLabels: Record<
  FileKind,
  string
> = {
  pdf: 'PDF-документ',
  spreadsheet: 'Таблица',
  audio: 'Аудиофайл',
  image: 'Изображение',
  video: 'Видеофайл',
  text: 'Текстовый файл',
  archive: 'Архив',
  unknown: 'Файл',
}

const fileIcons: Record<
  FileKind,
  string
> = {
  pdf: 'PDF',
  spreadsheet: 'XLS',
  audio: 'AUD',
  image: 'IMG',
  video: 'VID',
  text: 'TXT',
  archive: 'ZIP',
  unknown: 'FILE',
}

function renderLoading(
  root: HTMLDivElement,
): void {
  root.innerHTML = `
    <main class="desktop">
      <section
        class="app-state-screen"
        role="status"
      >
        <div
          class="app-state-screen__indicator"
          aria-hidden="true"
        ></div>

        <p>
          Чтение содержимого
          накопителя...
        </p>
      </section>
    </main>
  `
}

function renderError(
  root: HTMLDivElement,
  error: unknown,
): void {
  const message =
    error instanceof Error
      ? error.message
      : 'Неизвестная ошибка.'

  root.innerHTML = `
    <main class="desktop">
      <section
        class="
          app-state-screen
          app-state-screen--error
        "
        role="alert"
      >
        <h1>
          Не удалось открыть накопитель
        </h1>

        <p>${escapeHtml(message)}</p>

        <p>
          Проверьте файлы JSON
          и перезапустите локальный сайт.
        </p>
      </section>
    </main>
  `
}

function getStatusLabel(
  file: CaseFile,
): string {
  if (file.status === 'hidden') {
    return 'Скрытый'
  }

  if (file.status === 'corrupted') {
    return 'Повреждён'
  }

  return 'Обычный'
}

function renderProperties(
  file: CaseFile | null,
): string {
  if (!file) {
    return `
      <h2 class="properties-panel__title">
        Свойства
      </h2>

      <div class="properties-panel__empty">
        <p>
          В папке нет доступных объектов.
        </p>
      </div>
    `
  }

  const canDownload =
    Boolean(file.source.downloadPath)

  const description = file.description
    ? `
      <p class="properties-panel__description">
        ${escapeHtml(file.description)}
      </p>
    `
    : ''

  return `
    <h2 class="properties-panel__title">
      Свойства
    </h2>

    <div
      class="
        properties-panel__file-icon
        properties-panel__file-icon--${file.kind}
      "
    >
      ${fileIcons[file.kind]}
    </div>

    <h3 class="properties-panel__filename">
      ${escapeHtml(file.name)}
    </h3>

    ${description}

    <dl class="file-properties">
      <div class="file-properties__row">
        <dt>Тип</dt>

        <dd>
          ${fileTypeLabels[file.kind]}
        </dd>
      </div>

      <div class="file-properties__row">
        <dt>Размер</dt>

        <dd>
          ${escapeHtml(file.sizeLabel)}
        </dd>
      </div>

      <div class="file-properties__row">
        <dt>Создан</dt>

        <dd>
          ${escapeHtml(file.createdAt)}
        </dd>
      </div>

      <div class="file-properties__row">
        <dt>Изменён</dt>

        <dd>
          ${escapeHtml(file.modifiedAt)}
        </dd>
      </div>

      <div class="file-properties__row">
        <dt>Атрибуты</dt>

        <dd>
          ${getStatusLabel(file)}
        </dd>
      </div>
    </dl>

    <div class="properties-panel__actions">
      <button
        class="
          action-button
          action-button--primary
        "
        type="button"
        data-action="open-selected"
      >
        Открыть
      </button>

      <button
        class="action-button"
        type="button"
        data-action="download-selected"
        ${canDownload ? '' : 'disabled'}
      >
        Скачать
      </button>
    </div>
  `
}

function createFolderItems(
  state: AppState,
): string {
  return state.manifest.folders
    .map(
      (folder) => `
        <button
          class="
            folder-tree__item
            ${
              folder.id ===
              state.activeFolderId
                ? 'folder-tree__item--active'
                : ''
            }
          "
          type="button"
          data-folder-id="${escapeHtml(
            folder.id,
          )}"
        >
          <span
            class="folder-tree__icon"
            aria-hidden="true"
          >
            ▰
          </span>

          <span>
            ${escapeHtml(folder.name)}
          </span>
        </button>
      `,
    )
    .join('')
}

function renderApp(
  root: HTMLDivElement,
  state: AppState,
): void {
  normalizeSelection(state)

  const activeFolder =
    state.manifest.folders.find(
      (folder) =>
        folder.id ===
        state.activeFolderId,
    )

  const visibleFiles =
    getVisibleFiles(state)

  const selectedFile =
    getSelectedFile(state)

  if (!activeFolder) {
    throw new Error(
      'Не удалось определить открытую папку.',
    )
  }

  const folderItems =
    createFolderItems(state)

  const fileRows = visibleFiles
    .map(
      (file) => `
        <button
          class="
            file-row
            ${
              file.id ===
              state.selectedFileId
                ? 'file-row--selected'
                : ''
            }
            ${
              file.status === 'hidden'
                ? 'file-row--hidden'
                : ''
            }
            ${
              file.status === 'corrupted'
                ? 'file-row--corrupted'
                : ''
            }
          "
          type="button"
          data-file-id="${escapeHtml(
            file.id,
          )}"
        >
          <span class="file-row__name">
            <span
              class="
                file-row__icon
                file-row__icon--${file.kind}
              "
              aria-hidden="true"
            >
              ${fileIcons[file.kind]}
            </span>

            <span class="file-row__filename">
              ${escapeHtml(file.name)}
            </span>

            ${
              file.status === 'hidden'
                ? `
                  <span class="file-row__badge">
                    скрытый
                  </span>
                `
                : ''
            }
          </span>

          <span class="file-row__type">
            ${fileTypeLabels[file.kind]}
          </span>

          <span class="file-row__size">
            ${escapeHtml(file.sizeLabel)}
          </span>

          <span class="file-row__date">
            ${escapeHtml(
              file.modifiedAt.split(
                ',',
              )[0] ?? file.modifiedAt,
            )}
          </span>
        </button>
      `,
    )
    .join('')

  const emptyState = `
    <div class="file-list__empty">
      <p>
        ${
          state.searchQuery
            ? 'По вашему запросу ничего не найдено.'
            : 'В этой папке нет доступных объектов.'
        }
      </p>
    </div>
  `

  root.innerHTML = `
    <main class="desktop">
      <section
        class="explorer-window"
        aria-label="
          Содержимое съёмного накопителя
          ${escapeHtml(
            state.manifest.driveLabel,
          )}
        "
      >
        <header class="system-bar">
          <div class="system-bar__drive">
            <span
              class="system-bar__indicator"
              aria-hidden="true"
            ></span>

            <span>
              ${escapeHtml(
                state.manifest.driveLabel,
              )}
              (${escapeHtml(
                state.manifest.driveLetter,
              )}:)
            </span>
          </div>

          <div class="system-bar__time">
            <span>
              ${escapeHtml(
                state.manifest.snapshotDate,
              )}
            </span>

            <span>
              ${escapeHtml(
                state.manifest.snapshotTime,
              )}
            </span>
          </div>
        </header>

        <nav
          class="toolbar"
          aria-label="Управление проводником"
        >
          <div class="toolbar__navigation">
            <button
              class="
                toolbar-button
                mobile-folders-button
              "
              type="button"
              data-action="open-mobile-folders"
              aria-label="Открыть список папок"
            >
              ☰
            </button>

            <button
              class="toolbar-button"
              type="button"
              aria-label="Назад"
              disabled
            >
              ←
            </button>

            <button
              class="toolbar-button"
              type="button"
              aria-label="На уровень выше"
              disabled
            >
              ↑
            </button>

            <button
              class="toolbar-button"
              type="button"
              aria-label="Обновить"
              data-action="refresh"
            >
              ↻
            </button>
          </div>

          <div class="address-bar">
            <span class="address-bar__drive">
              ${escapeHtml(
                state.manifest.driveLetter,
              )}:
            </span>

            <span class="address-bar__separator">
              \
            </span>

            <span>
              ${escapeHtml(activeFolder.name)}
            </span>
          </div>

          <label class="search">
            <span class="visually-hidden">
              Поиск файлов
            </span>

            <input
              id="search-input"
              class="search__input"
              type="search"
              placeholder="Поиск..."
              value="${escapeHtml(
                state.searchQuery,
              )}"
              autocomplete="off"
            />
          </label>

          <label class="hidden-files-toggle">
            <input
              id="hidden-files-toggle"
              type="checkbox"
              ${
                state.showHidden
                  ? 'checked'
                  : ''
              }
            />

            <span>Скрытые элементы</span>
          </label>
        </nav>

        <div class="explorer-layout">
          <aside class="folder-tree">
            <div class="folder-tree__drive">
              <span
                class="folder-tree__drive-icon"
                aria-hidden="true"
              >
                USB
              </span>

              <span>
                ${escapeHtml(
                  state.manifest.driveLabel,
                )}
                (${escapeHtml(
                  state.manifest.driveLetter,
                )}:)
              </span>
            </div>

            <div class="folder-tree__list">
              ${folderItems}
            </div>
          </aside>

          <section class="file-list">
            <header class="file-list__header">
              <span>Имя</span>
              <span>Тип</span>
              <span>Размер</span>
              <span>Изменён</span>
            </header>

            <div class="file-list__body">
              ${fileRows || emptyState}
            </div>
          </section>

          <aside class="properties-panel">
            ${renderProperties(selectedFile)}
          </aside>
        </div>

        <footer class="status-bar">
          <span>
            Объектов: ${visibleFiles.length}
          </span>

          <span>
            Свободно:
            ${escapeHtml(
              state.manifest.freeSpaceLabel,
            )}
            из
            ${escapeHtml(
              state.manifest.capacityLabel,
            )}
          </span>

          <span class="status-bar__connection">
            <span
              class="status-bar__indicator"
              aria-hidden="true"
            ></span>

            Накопитель подключён
          </span>
        </footer>

        <div
          class="
            mobile-folder-drawer
            ${
              state.mobileFoldersOpen
                ? 'mobile-folder-drawer--open'
                : ''
            }
          "
          aria-hidden="${
            state.mobileFoldersOpen
              ? 'false'
              : 'true'
          }"
        >
          <button
            class="mobile-folder-drawer__backdrop"
            type="button"
            data-action="close-mobile-folders"
            aria-label="Закрыть список папок"
          ></button>

          <aside
            class="mobile-folder-drawer__panel"
            aria-label="Папки накопителя"
          >
            <header
              class="mobile-folder-drawer__header"
            >
              <span>
                ${escapeHtml(
                  state.manifest.driveLabel,
                )}
                (${escapeHtml(
                  state.manifest.driveLetter,
                )}:)
              </span>

              <button
                class="mobile-folder-drawer__close"
                type="button"
                data-action="close-mobile-folders"
                aria-label="Закрыть"
              >
                ×
              </button>
            </header>

            <div class="folder-tree__list">
              ${folderItems}
            </div>
          </aside>
        </div>
      </section>
    </main>
  `
}

export async function createApp(
  root: HTMLDivElement,
): Promise<void> {
  renderLoading(root)

  try {
    const manifest =
      await loadDefaultCase()

    const state =
      createInitialState(manifest)

    let lastFileClickId:
      | string
      | null = null

    let lastFileClickAt = 0

    const render = (): void => {
      renderApp(root, state)
    }

    root.addEventListener(
      'click',
      (event) => {
        const target = event.target

        if (!(target instanceof Element)) {
          return
        }

        const folderButton =
          target.closest<HTMLElement>(
            '[data-folder-id]',
          )

        if (folderButton?.dataset.folderId) {
          state.activeFolderId =
            folderButton.dataset.folderId

          state.searchQuery = ''
          state.selectedFileId = null
          state.mobileFoldersOpen = false

          normalizeSelection(state)
          persistAppState(state)
          render()

          return
        }

        const fileButton =
          target.closest<HTMLElement>(
            '[data-file-id]',
          )

        if (fileButton?.dataset.fileId) {
          const fileId =
            fileButton.dataset.fileId

          const now = Date.now()

          const isRepeatedClick =
            lastFileClickId === fileId &&
            now - lastFileClickAt < 550

          lastFileClickId = fileId
          lastFileClickAt = now

          state.selectedFileId = fileId

          render()

          const selectedFile =
            getSelectedFile(state)

          const isMobile =
            window.matchMedia(
              '(max-width: 720px)',
            ).matches

          if (
            selectedFile &&
            (isMobile || isRepeatedClick)
          ) {
            openFileViewer(
              root,
              selectedFile,
            )
          }

          return
        }

        if (
          target.closest(
            '[data-action="open-mobile-folders"]',
          )
        ) {
          state.mobileFoldersOpen = true
          render()

          return
        }

        if (
          target.closest(
            '[data-action="close-mobile-folders"]',
          )
        ) {
          state.mobileFoldersOpen = false
          render()

          return
        }

        if (
          target.closest(
            '[data-action="open-selected"]',
          )
        ) {
          const selectedFile =
            getSelectedFile(state)

          if (selectedFile) {
            openFileViewer(
              root,
              selectedFile,
            )
          }

          return
        }

        if (
          target.closest(
            '[data-action="download-selected"]',
          )
        ) {
          const selectedFile =
            getSelectedFile(state)

          if (selectedFile) {
            downloadFile(
              root,
              selectedFile,
            )
          }

          return
        }

        if (
          target.closest(
            '[data-action="refresh"]',
          )
        ) {
          render()
        }
      },
    )

    root.addEventListener(
      'change',
      (event) => {
        const target = event.target

        if (
          !(
            target instanceof
            HTMLInputElement
          )
        ) {
          return
        }

        if (
          target.id ===
          'hidden-files-toggle'
        ) {
          state.showHidden =
            target.checked

          normalizeSelection(state)
          persistAppState(state)
          render()
        }
      },
    )

    root.addEventListener(
      'input',
      (event) => {
        const target = event.target

        if (
          !(
            target instanceof
            HTMLInputElement
          ) ||
          target.id !== 'search-input'
        ) {
          return
        }

        state.searchQuery =
          target.value

        normalizeSelection(state)
        render()

        const searchInput =
          root.querySelector<HTMLInputElement>(
            '#search-input',
          )

        if (searchInput) {
          searchInput.focus()

          searchInput.setSelectionRange(
            state.searchQuery.length,
            state.searchQuery.length,
          )
        }
      },
    )

    render()
  } catch (error) {
    renderError(root, error)
  }
}