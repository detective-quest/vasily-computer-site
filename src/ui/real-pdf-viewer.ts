import type {
  CaseFile,
  CaseManifest,
} from '../core/types/case'

interface RenderedDocumentConfig {
  directory: string
  pageCount: number
}

interface RenderedDocumentViewerElements {
  window: HTMLElement
  title: HTMLElement
  pages: HTMLElement
  pageCount: HTMLElement
  minimizeButton: HTMLButtonElement
  maximizeButton: HTMLButtonElement
  closeButton: HTMLButtonElement
}

const renderedDocuments:
  Record<string, RenderedDocumentConfig> = {
    'contract-alliance-med-2023': {
      directory:
        'contract_alliance_med_2023',
      pageCount: 2,
    },

    'contract-medtechsnab-2024': {
      directory:
        'contract_medtechsnab_2024',
      pageCount: 4,
    },

    'contract-medical-technologies-2025': {
      directory:
        'contract_medical_technologies_2025',
      pageCount: 3,
    },

    'contract-pharmlogistic-2021': {
      directory:
        'contract_pharmlogistic_2021',
      pageCount: 3,
    },

    'vasily-will': {
      directory: 'will',
      pageCount: 3,
    },
  }

function findRenderedDocument(
  manifest: CaseManifest,
  fileId: string,
): CaseFile | null {
  if (!renderedDocuments[fileId]) {
    return null
  }

  return (
    manifest.files.find(
      (file) =>
        file.id === fileId,
    ) ??
    null
  )
}

function getBaseUrl(): string {
  return import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
}

function addCacheVersion(
  url: string,
): string {
  const separator =
    url.includes('?')
      ? '&'
      : '?'

  return `${url}${separator}viewer=rendered-v2`
}

function getPublicFileUrlCandidates(
  relativePath: string,
): string[] {
  const cleanPath =
    relativePath.replace(
      /^\/+/,
      '',
    )

  const rootUrl =
    new URL(
      `/${cleanPath}`,
      window.location.origin,
    ).toString()

  const baseUrl =
    new URL(
      `${getBaseUrl()}${cleanPath}`,
      window.location.origin,
    ).toString()

  const orderedCandidates =
    import.meta.env.DEV
      ? [
        rootUrl,
        baseUrl,
      ]
      : [
        baseUrl,
        rootUrl,
      ]

  return Array.from(
    new Set(
      orderedCandidates.map(
        addCacheVersion,
      ),
    ),
  )
}

function getPageUrlCandidates(
  config: RenderedDocumentConfig,
  pageNumber: number,
): string[] {
  const relativePath =
    [
      'content',
      'vasily-computer',
      'files',
      'rendered',
      config.directory,
      `page-${pageNumber}.webp`,
    ].join('/')

  return getPublicFileUrlCandidates(
    relativePath,
  )
}

function createViewerWindow(
  desktopShell: HTMLElement,
): RenderedDocumentViewerElements {
  const windowElement =
    document.createElement('section')

  windowElement.className =
    'document-viewer-window real-pdf-window'

  windowElement.dataset
    .realPdfWindow = ''

  windowElement.dataset
    .renderedDocumentViewer = 'v2'

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
          <strong data-real-pdf-title>
            Просмотр документа
          </strong>

          <span>
            Просмотр документа
          </span>
        </div>
      </div>

      <div class="document-viewer-titlebar__controls">
        <button
          type="button"
          title="Свернуть"
          aria-label="Свернуть"
          data-real-pdf-minimize
        >
          —
        </button>

        <button
          type="button"
          title="Развернуть"
          aria-label="Развернуть"
          data-real-pdf-maximize
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
          data-real-pdf-close
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

      <span class="real-document-toolbar__label">
        Просмотр документа
      </span>
    </div>

    <main
      class="
        document-viewer-body
        real-pdf-body
      "
    >
      <div
        class="real-document-pages"
        data-real-document-pages
      ></div>
    </main>

    <footer class="document-viewer-statusbar">
      <span>
        Локальное хранилище
      </span>

      <span data-real-document-page-count>
        Страниц: 0
      </span>
    </footer>
  `

  desktopShell.append(
    windowElement,
  )

  const title =
    windowElement.querySelector<HTMLElement>(
      '[data-real-pdf-title]',
    )

  const pages =
    windowElement.querySelector<HTMLElement>(
      '[data-real-document-pages]',
    )

  const pageCount =
    windowElement.querySelector<HTMLElement>(
      '[data-real-document-page-count]',
    )

  const minimizeButton =
    windowElement.querySelector<HTMLButtonElement>(
      '[data-real-pdf-minimize]',
    )

  const maximizeButton =
    windowElement.querySelector<HTMLButtonElement>(
      '[data-real-pdf-maximize]',
    )

  const closeButton =
    windowElement.querySelector<HTMLButtonElement>(
      '[data-real-pdf-close]',
    )

  if (
    !title ||
    !pages ||
    !pageCount ||
    !minimizeButton ||
    !maximizeButton ||
    !closeButton
  ) {
    windowElement.remove()

    throw new Error(
      'Не удалось создать просмотрщик документа.',
    )
  }

  return {
    window: windowElement,
    title,
    pages,
    pageCount,
    minimizeButton,
    maximizeButton,
    closeButton,
  }
}

function createPageElement(
  file: CaseFile,
  config: RenderedDocumentConfig,
  pageNumber: number,
): HTMLElement {
  const pageElement =
    document.createElement('figure')

  pageElement.className =
    'real-document-page'

  pageElement.dataset
    .realDocumentPage =
      String(pageNumber)

  const loadingElement =
    document.createElement('span')

  loadingElement.className =
    'real-document-page__loading'

  loadingElement.textContent =
    `Загрузка страницы ${pageNumber}…`

  const imageElement =
    document.createElement('img')

  imageElement.className =
    'real-document-page__image'

  imageElement.alt =
    `${file.name}, страница ${pageNumber}`

  imageElement.draggable =
    false

  imageElement.decoding =
    'async'

  imageElement.loading =
    pageNumber === 1
      ? 'eager'
      : 'lazy'

  const pageUrlCandidates =
    getPageUrlCandidates(
      config,
      pageNumber,
    )

  let currentCandidateIndex =
    0

  const loadCurrentCandidate =
    (): void => {
      const candidateUrl =
        pageUrlCandidates[
          currentCandidateIndex
        ]

      if (!candidateUrl) {
        imageElement.remove()

        loadingElement.className =
          'real-document-page__error'

        loadingElement.textContent =
          `Не удалось загрузить страницу ${pageNumber}.`

        return
      }

      imageElement.src =
        candidateUrl
    }

  imageElement.addEventListener(
    'load',
    () => {
      loadingElement.remove()

      pageElement.classList.add(
        'real-document-page--loaded',
      )
    },
  )

  imageElement.addEventListener(
    'error',
    () => {
      currentCandidateIndex += 1

      if (
        currentCandidateIndex <
        pageUrlCandidates.length
      ) {
        loadCurrentCandidate()

        return
      }

      imageElement.remove()

      loadingElement.className =
        'real-document-page__error'

      loadingElement.textContent =
        `Не удалось загрузить страницу ${pageNumber}.`
    },
  )

  pageElement.append(
    loadingElement,
    imageElement,
  )

  loadCurrentCandidate()

  return pageElement
}

function renderDocumentPages(
  elements: RenderedDocumentViewerElements,
  file: CaseFile,
  config: RenderedDocumentConfig,
): void {
  elements.pages.replaceChildren()

  const fragment =
    document.createDocumentFragment()

  for (
    let pageNumber = 1;
    pageNumber <= config.pageCount;
    pageNumber += 1
  ) {
    fragment.append(
      createPageElement(
        file,
        config,
        pageNumber,
      ),
    )
  }

  elements.pages.append(
    fragment,
  )

  elements.pageCount.textContent =
    `Страниц: ${config.pageCount}`

  const body =
    elements.pages.closest<HTMLElement>(
      '.real-pdf-body',
    )

  if (body) {
    body.scrollTop = 0
  }
}

export function attachRealPdfViewer(
  root: HTMLDivElement,
  manifest: CaseManifest,
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
    RenderedDocumentViewerElements | null =
      null

  const closeViewer =
    (): void => {
      if (!elements) {
        return
      }

      elements.pages.replaceChildren()
      elements.window.remove()

      elements = null
    }

  const openFile = (
    file: CaseFile,
  ): void => {
    const config =
      renderedDocuments[file.id]

    if (!config) {
      return
    }

    if (!elements) {
      elements =
        createViewerWindow(
          desktopShell,
        )

      elements.closeButton
        .addEventListener(
          'click',
          closeViewer,
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

    elements.window.hidden =
      false

    elements.title.textContent =
      file.name

    renderDocumentPages(
      elements,
      file,
      config,
    )
  }

  const getFileFromTarget = (
    target: EventTarget | null,
  ): CaseFile | null => {
    if (!(target instanceof Element)) {
      return null
    }

    const fileElement =
      target.closest<HTMLElement>(
        '[data-file-manager-file]',
      )

    const fileId =
      fileElement?.dataset.fileId

    if (!fileId) {
      return null
    }

    return findRenderedDocument(
      manifest,
      fileId,
    )
  }

  root.addEventListener(
    'dblclick',
    (event) => {
      const file =
        getFileFromTarget(
          event.target,
        )

      if (!file) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      openFile(file)
    },
    true,
  )

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

      const file =
        getFileFromTarget(
          event.target,
        )

      if (!file) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      openFile(file)
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
        event.preventDefault()
        event.stopImmediatePropagation()

        closeViewer()

        return
      }

      if (
        event.key !== 'Enter' &&
        event.key !== ' '
      ) {
        return
      }

      const file =
        getFileFromTarget(
          event.target,
        )

      if (!file) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()

      openFile(file)
    },
    true,
  )
}