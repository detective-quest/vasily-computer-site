import type {
  CaseFile,
  CaseManifest,
} from '../core/types/case'

import type {
  DocumentCatalog,
  VirtualDocument,
  VirtualDocumentItem,
  VirtualSpreadsheet,
  VirtualTextDocument,
} from '../core/types/document'

import {
  escapeHtml,
} from '../core/utilities/html'

interface ViewerElements {
  window: HTMLElement
  title: HTMLElement
  subtitle: HTMLElement
  body: HTMLElement
  closeButton: HTMLButtonElement
  minimizeButton: HTMLButtonElement
  maximizeButton: HTMLButtonElement
}

function findFile(
  manifest: CaseManifest,
  fileId: string,
): CaseFile | undefined {
  return manifest.files.find(
    (file) =>
      file.id === fileId,
  )
}

function findDocument(
  catalog: DocumentCatalog,
  fileId: string,
): VirtualDocumentItem | undefined {
  return catalog.items.find(
    (item) =>
      item.fileId === fileId,
  )
}

function getViewerTypeLabel(
  document: VirtualDocumentItem,
): string {
  if (
    document.view === 'spreadsheet'
  ) {
    return 'Электронная таблица'
  }

  if (
    document.view === 'text'
  ) {
    return 'Текстовый документ'
  }

  return 'Просмотр документа'
}

function renderMetadata(
  document: VirtualDocument,
): string {
  if (
    !document.metadata ||
    document.metadata.length === 0
  ) {
    return ''
  }

  return `
    <dl class="document-paper__metadata">
      ${document.metadata
        .map(
          (item) => `
            <div>
              <dt>
                ${escapeHtml(item.label)}
              </dt>

              <dd>
                ${escapeHtml(item.value)}
              </dd>
            </div>
          `,
        )
        .join('')}
    </dl>
  `
}

function renderDocument(
  document: VirtualDocument,
): string {
  return `
    <div class="document-viewer__canvas">
      <article class="document-paper">
        <header class="document-paper__header">
          <span class="document-paper__stamp">
            Внутренняя копия
          </span>

          <h1>
            ${escapeHtml(document.title)}
          </h1>

          ${
            document.subtitle
              ? `
                <p>
                  ${escapeHtml(
                    document.subtitle,
                  )}
                </p>
              `
              : ''
          }

          ${renderMetadata(document)}
        </header>

        <div class="document-paper__content">
          ${document.sections
            .map(
              (section) => `
                <section class="document-paper__section">
                  ${
                    section.heading
                      ? `
                        <h2>
                          ${escapeHtml(
                            section.heading,
                          )}
                        </h2>
                      `
                      : ''
                  }

                  ${
                    section.paragraphs
                      ?.map(
                        (paragraph) => `
                          <p>
                            ${escapeHtml(
                              paragraph,
                            )}
                          </p>
                        `,
                      )
                      .join('') ??
                    ''
                  }

                  ${
                    section.bullets &&
                    section.bullets.length > 0
                      ? `
                        <ul>
                          ${section.bullets
                            .map(
                              (bullet) => `
                                <li>
                                  ${escapeHtml(
                                    bullet,
                                  )}
                                </li>
                              `,
                            )
                            .join('')}
                        </ul>
                      `
                      : ''
                  }
                </section>
              `,
            )
            .join('')}
        </div>

        <footer class="document-paper__footer">
          Персональный компьютер · локальная копия
        </footer>
      </article>
    </div>
  `
}

function renderSpreadsheet(
  spreadsheet: VirtualSpreadsheet,
): string {
  return `
    <div class="spreadsheet-viewer">
      <header class="spreadsheet-viewer__heading">
        <div>
          <span>
            Рабочая книга
          </span>

          <h1>
            ${escapeHtml(
              spreadsheet.title,
            )}
          </h1>

          ${
            spreadsheet.subtitle
              ? `
                <p>
                  ${escapeHtml(
                    spreadsheet.subtitle,
                  )}
                </p>
              `
              : ''
          }
        </div>

        <div
          class="spreadsheet-viewer__status"
        >
          Локальная копия
        </div>
      </header>

      <div class="spreadsheet-viewer__sheet">
        <table>
          <thead>
            <tr>
              <th class="spreadsheet-viewer__row-number">
                №
              </th>

              ${spreadsheet.columns
                .map(
                  (column) => `
                    <th>
                      ${escapeHtml(column)}
                    </th>
                  `,
                )
                .join('')}
            </tr>
          </thead>

          <tbody>
            ${spreadsheet.rows
              .map(
                (row, rowIndex) => `
                  <tr>
                    <th class="spreadsheet-viewer__row-number">
                      ${rowIndex + 1}
                    </th>

                    ${spreadsheet.columns
                      .map(
                        (
                          _column,
                          columnIndex,
                        ) => `
                          <td>
                            ${escapeHtml(
                              row[columnIndex] ??
                                '',
                            )}
                          </td>
                        `,
                      )
                      .join('')}
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>

      ${
        spreadsheet.note
          ? `
            <footer class="spreadsheet-viewer__note">
              ${escapeHtml(
                spreadsheet.note,
              )}
            </footer>
          `
          : ''
      }
    </div>
  `
}

function renderTextDocument(
  document: VirtualTextDocument,
): string {
  return `
    <div class="text-document-viewer">
      <article class="text-document">
        <header>
          <span>
            TXT
          </span>

          <h1>
            ${escapeHtml(document.title)}
          </h1>

          ${
            document.subtitle
              ? `
                <p>
                  ${escapeHtml(
                    document.subtitle,
                  )}
                </p>
              `
              : ''
          }
        </header>

        <pre>${escapeHtml(
          document.lines.join('\n'),
        )}</pre>
      </article>
    </div>
  `
}

function renderCorruptedFile(
  file: CaseFile,
): string {
  return `
    <div class="corrupted-viewer">
      <div class="corrupted-viewer__symbol">
        <span></span>
        <strong>!</strong>
      </div>

      <h1>
        Не удалось открыть файл
      </h1>

      <p class="corrupted-viewer__filename">
        ${escapeHtml(file.name)}
      </p>

      <div class="corrupted-viewer__message">
        <strong>
          Структура документа повреждена
        </strong>

        <span>
          Система не смогла прочитать содержимое файла.
          Повторное открытие не изменит результат.
        </span>
      </div>

      <dl>
        <div>
          <dt>Тип</dt>
          <dd>${escapeHtml(file.mimeType)}</dd>
        </div>

        <div>
          <dt>Состояние</dt>
          <dd>Повреждён</dd>
        </div>

        <div>
          <dt>Источник</dt>
          <dd>Локальное хранилище</dd>
        </div>
      </dl>
    </div>
  `
}

function renderMissingPreview(
  file: CaseFile,
): string {
  return `
    <div class="document-viewer-missing">
      <div aria-hidden="true">
        □
      </div>

      <h1>
        Предварительный просмотр недоступен
      </h1>

      <p>
        Для файла
        «${escapeHtml(file.name)}»
        ещё не подготовлено содержимое.
      </p>
    </div>
  `
}

function createViewerWindow(
  desktopShell: HTMLElement,
): ViewerElements {
  const windowElement =
    document.createElement('section')

  windowElement.className =
    'document-viewer-window'

  windowElement.dataset
    .documentViewerWindow = ''

  windowElement.innerHTML = `
    <header class="document-viewer-titlebar">
      <div class="document-viewer-titlebar__identity">
        <span
          class="document-viewer-titlebar__icon"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="
                M6 3
                H14
                L19 8
                V21
                H6
                Z
              "
            ></path>

            <path d="M14 3 V8 H19"></path>
            <path d="M9 12 H16"></path>
            <path d="M9 16 H16"></path>
          </svg>
        </span>

        <div>
          <strong
            data-document-viewer-title
          >
            Просмотр документа
          </strong>

          <span
            data-document-viewer-subtitle
          >
            Локальный файл
          </span>
        </div>
      </div>

      <div class="document-viewer-titlebar__controls">
        <button
          type="button"
          title="Свернуть"
          aria-label="Свернуть"
          data-document-viewer-minimize
        >
          —
        </button>

        <button
          type="button"
          title="Развернуть"
          aria-label="Развернуть"
          data-document-viewer-maximize
        >
          <span
            class="document-viewer-control-square"
            aria-hidden="true"
          ></span>
        </button>

        <button
          class="document-viewer-titlebar__close"
          type="button"
          title="Закрыть"
          aria-label="Закрыть"
          data-document-viewer-close
        >
          ×
        </button>
      </div>
    </header>

    <div class="document-viewer-toolbar">
      <span class="document-viewer-toolbar__state">
        <i aria-hidden="true"></i>
        Готово к просмотру
      </span>

      <span
        class="document-viewer-toolbar__type"
        data-document-viewer-type
      >
        Просмотр документа
      </span>
    </div>

    <main
      class="document-viewer-body"
      data-document-viewer-body
    ></main>

    <footer class="document-viewer-statusbar">
      <span>
        Локальное хранилище
      </span>

      <span>
        Только просмотр
      </span>
    </footer>
  `

  desktopShell.append(
    windowElement,
  )

  const title =
    windowElement.querySelector<HTMLElement>(
      '[data-document-viewer-title]',
    )

  const subtitle =
    windowElement.querySelector<HTMLElement>(
      '[data-document-viewer-subtitle]',
    )

  const body =
    windowElement.querySelector<HTMLElement>(
      '[data-document-viewer-body]',
    )

  const closeButton =
    windowElement.querySelector<HTMLButtonElement>(
      '[data-document-viewer-close]',
    )

  const minimizeButton =
    windowElement.querySelector<HTMLButtonElement>(
      '[data-document-viewer-minimize]',
    )

  const maximizeButton =
    windowElement.querySelector<HTMLButtonElement>(
      '[data-document-viewer-maximize]',
    )

  if (
    !title ||
    !subtitle ||
    !body ||
    !closeButton ||
    !minimizeButton ||
    !maximizeButton
  ) {
    windowElement.remove()

    throw new Error(
      'Не удалось создать просмотрщик документов.',
    )
  }

  return {
    window: windowElement,
    title,
    subtitle,
    body,
    closeButton,
    minimizeButton,
    maximizeButton,
  }
}

export function attachDocumentViewer(
  root: HTMLDivElement,
  manifest: CaseManifest,
  catalog: DocumentCatalog,
): void {
  const desktopShell =
    root.querySelector<HTMLElement>(
      '[data-desktop-shell]',
    )

  if (!desktopShell) {
    throw new Error(
      'Не найден рабочий стол для просмотрщика документов.',
    )
  }

  let elements:
    ViewerElements | null = null

  const openFile = (
    fileId: string,
  ): void => {
    const file =
      findFile(
        manifest,
        fileId,
      )

    if (!file) {
      return
    }

    const documentItem =
      findDocument(
        catalog,
        fileId,
      )

    if (!elements) {
      elements =
        createViewerWindow(
          desktopShell,
        )

      elements.closeButton
        .addEventListener(
          'click',
          () => {
            elements?.window.remove()
            elements = null
          },
        )

      elements.minimizeButton
        .addEventListener(
          'click',
          () => {
            if (elements) {
              elements.window.hidden =
                true
            }
          },
        )

      elements.maximizeButton
        .addEventListener(
          'click',
          () => {
            if (!elements) {
              return
            }

            const isMaximized =
              elements.window.classList
                .toggle(
                  'document-viewer-window--maximized',
                )

            elements.maximizeButton
              .setAttribute(
                'title',
                isMaximized
                  ? 'Восстановить размер'
                  : 'Развернуть',
              )

            elements.maximizeButton
              .setAttribute(
                'aria-label',
                isMaximized
                  ? 'Восстановить размер'
                  : 'Развернуть',
              )
          },
        )
    }

    elements.window.hidden = false

    elements.title.textContent =
      file.name

    if (
      file.status === 'corrupted'
    ) {
      elements.subtitle.textContent =
        'Повреждённый файл'

      elements.body.innerHTML =
        renderCorruptedFile(file)

      return
    }

    if (!documentItem) {
      elements.subtitle.textContent =
        'Предварительный просмотр'

      elements.body.innerHTML =
        renderMissingPreview(file)

      return
    }

    elements.subtitle.textContent =
      getViewerTypeLabel(
        documentItem,
      )

    const typeElement =
      elements.window
        .querySelector<HTMLElement>(
          '[data-document-viewer-type]',
        )

    if (typeElement) {
      typeElement.textContent =
        getViewerTypeLabel(
          documentItem,
        )
    }

    if (
      documentItem.view === 'document'
    ) {
      elements.body.innerHTML =
        renderDocument(
          documentItem,
        )

      return
    }

    if (
      documentItem.view === 'spreadsheet'
    ) {
      elements.body.innerHTML =
        renderSpreadsheet(
          documentItem,
        )

      return
    }

    elements.body.innerHTML =
      renderTextDocument(
        documentItem,
      )
  }

  const handleFileInteraction = (
    event: Event,
    allowSingleTap: boolean,
  ): void => {
    const target =
      event.target

    if (!(target instanceof Element)) {
      return
    }

    const fileElement =
      target.closest<HTMLElement>(
        '[data-file-manager-file]',
      )

    const fileId =
      fileElement?.dataset.fileId

    if (!fileId) {
      return
    }

    if (
      event.type === 'click' &&
      !allowSingleTap
    ) {
      return
    }

    event.preventDefault()
    event.stopImmediatePropagation()

    openFile(fileId)
  }

  root.addEventListener(
    'dblclick',
    (event) => {
      handleFileInteraction(
        event,
        true,
      )
    },
    true,
  )

  root.addEventListener(
    'click',
    (event) => {
      const allowSingleTap =
        window.matchMedia(
          '(pointer: coarse)',
        ).matches ||
        window.matchMedia(
          '(max-width: 820px)',
        ).matches

      handleFileInteraction(
        event,
        allowSingleTap,
      )
    },
    true,
  )

  root.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key === 'Escape' &&
        elements &&
        !elements.window.hidden
      ) {
        elements.window.remove()
        elements = null
      }
    },
  )
}