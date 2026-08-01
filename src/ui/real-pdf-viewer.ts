import type {
  CaseFile,
  CaseManifest,
} from '../core/types/case'

interface RenderedDocumentConfig {
  directory: string
  pageCount: number
  mobileDocumentPath: string
}

interface MobilePlotParty {
  title: string
  lines: string[]
}

type MobilePlotBlock =
  | {
      kind: 'paragraph'
      text: string
    }
  | {
      kind: 'subheading'
      text: string
    }
  | {
      kind: 'list'
      items: string[]
    }
  | {
      kind: 'parties'
      left: MobilePlotParty
      right: MobilePlotParty
    }

interface MobilePlotSection {
  title: string
  blocks: MobilePlotBlock[]
}

interface MobilePlotDocument {
  eyebrow: string
  title: string
  subtitle: string
  dateline?: string
  meta: Array<{
    label: string
    value: string
  }>
  intro: string[]
  sections: MobilePlotSection[]
}

interface RenderedDocumentViewerElements {
  window: HTMLElement
  title: HTMLElement
  content: HTMLElement
  pageCount: HTMLElement
  minimizeButton: HTMLButtonElement
  maximizeButton: HTMLButtonElement
  closeButton: HTMLButtonElement
}

const MOBILE_READING_QUERY =
  '(max-width: 820px)'

const renderedDocuments:
  Record<string, RenderedDocumentConfig> = {
    'contract-alliance-med-2023': {
      directory:
        'contract_alliance_med_2023',
      pageCount: 2,
      mobileDocumentPath:
        'content/vasily-computer/mobile-documents/contract-alliance-med-2023.json',
    },

    'contract-medtechsnab-2024': {
      directory:
        'contract_medtechsnab_2024',
      pageCount: 4,
      mobileDocumentPath:
        'content/vasily-computer/mobile-documents/contract-medtechsnab-2024.json',
    },

    'contract-medical-technologies-2025': {
      directory:
        'contract_medical_technologies_2025',
      pageCount: 3,
      mobileDocumentPath:
        'content/vasily-computer/mobile-documents/contract-medical-technologies-2025.json',
    },

    'contract-pharmlogistic-2021': {
      directory:
        'contract_pharmlogistic_2021',
      pageCount: 3,
      mobileDocumentPath:
        'content/vasily-computer/mobile-documents/contract-pharmlogistic-2021.json',
    },

    'vasily-will': {
      directory: 'will',
      pageCount: 3,
      mobileDocumentPath:
        'content/vasily-computer/mobile-documents/vasily-will.json',
    },
  }

const mobileDocumentCache =
  new Map<string, MobilePlotDocument>()

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

  const orderedUrls =
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
    new Set(orderedUrls),
  )
}

function getPageUrlCandidates(
  config: RenderedDocumentConfig,
  pageNumber: number,
): string[] {
  return getPublicFileUrlCandidates(
    [
      'content',
      'vasily-computer',
      'files',
      'rendered',
      config.directory,
      `page-${pageNumber}.webp`,
    ].join('/'),
  )
}

async function loadMobileDocument(
  config: RenderedDocumentConfig,
): Promise<MobilePlotDocument> {
  const cached =
    mobileDocumentCache.get(
      config.mobileDocumentPath,
    )

  if (cached) {
    return cached
  }

  const candidates =
    getPublicFileUrlCandidates(
      config.mobileDocumentPath,
    )

  let lastError:
    unknown =
      new Error(
        'Мобильная версия документа не найдена.',
      )

  for (
    const candidate of candidates
  ) {
    try {
      const response =
        await fetch(
          candidate,
          {
            cache: 'no-store',
          },
        )

      if (!response.ok) {
        lastError =
          new Error(
            `Ошибка загрузки: ${response.status}`,
          )

        continue
      }

      const documentData =
        await response.json() as MobilePlotDocument

      mobileDocumentCache.set(
        config.mobileDocumentPath,
        documentData,
      )

      return documentData
    } catch (error: unknown) {
      lastError = error
    }
  }

  throw lastError
}

function createViewerWindow(
  desktopShell: HTMLElement,
): RenderedDocumentViewerElements {
  const windowElement =
    document.createElement('section')

  windowElement.className =
    'document-viewer-window real-pdf-window'

  windowElement.dataset.realPdfWindow =
    ''

  windowElement.dataset.renderedDocumentViewer =
    'mobile-html-v1'

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
        class="real-document-content"
        data-real-document-content
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

  const content =
    windowElement.querySelector<HTMLElement>(
      '[data-real-document-content]',
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
    !content ||
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
    content,
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

  pageElement.dataset.realDocumentPage =
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

  const candidates =
    getPageUrlCandidates(
      config,
      pageNumber,
    )

  let candidateIndex = 0

  const loadCandidate =
    (): void => {
      const candidate =
        candidates[candidateIndex]

      if (!candidate) {
        imageElement.remove()

        loadingElement.className =
          'real-document-page__error'

        loadingElement.textContent =
          `Не удалось загрузить страницу ${pageNumber}.`

        return
      }

      imageElement.src =
        candidate
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
      candidateIndex += 1

      if (
        candidateIndex <
        candidates.length
      ) {
        loadCandidate()

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

  loadCandidate()

  return pageElement
}

function renderDesktopPages(
  elements: RenderedDocumentViewerElements,
  file: CaseFile,
  config: RenderedDocumentConfig,
): void {
  const pages =
    document.createElement('div')

  pages.className =
    'real-document-pages'

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

  pages.append(fragment)

  elements.content.className =
    'real-document-content real-document-content--pages'

  elements.content.replaceChildren(
    pages,
  )
}

function createTextElement(
  tagName:
    | 'p'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'span',
  className: string,
  text: string,
): HTMLElement {
  const element =
    document.createElement(tagName)

  element.className =
    className

  element.textContent =
    text

  return element
}

function createPartyElement(
  party: MobilePlotParty,
): HTMLElement {
  const card =
    document.createElement('section')

  card.className =
    'real-mobile-document__party'

  card.append(
    createTextElement(
      'h3',
      'real-mobile-document__party-title',
      party.title,
    ),
  )

  party.lines.forEach(
    (line) => {
      card.append(
        createTextElement(
          'p',
          'real-mobile-document__party-line',
          line,
        ),
      )
    },
  )

  return card
}

function createMobileBlock(
  block: MobilePlotBlock,
): HTMLElement {
  if (
    block.kind === 'paragraph'
  ) {
    return createTextElement(
      'p',
      'real-mobile-document__paragraph',
      block.text,
    )
  }

  if (
    block.kind === 'subheading'
  ) {
    return createTextElement(
      'h3',
      'real-mobile-document__subheading',
      block.text,
    )
  }

  if (
    block.kind === 'list'
  ) {
    const list =
      document.createElement('ul')

    list.className =
      'real-mobile-document__list'

    block.items.forEach(
      (item) => {
        const listItem =
          document.createElement('li')

        listItem.textContent =
          item

        list.append(listItem)
      },
    )

    return list
  }

  const parties =
    document.createElement('div')

  parties.className =
    'real-mobile-document__parties'

  parties.append(
    createPartyElement(
      block.left,
    ),
    createPartyElement(
      block.right,
    ),
  )

  return parties
}

function createMobileDocumentElement(
  documentData: MobilePlotDocument,
): HTMLElement {
  const article =
    document.createElement('article')

  article.className =
    'real-mobile-document'

  const header =
    document.createElement('header')

  header.className =
    'real-mobile-document__header'

  header.append(
    createTextElement(
      'span',
      'real-mobile-document__eyebrow',
      documentData.eyebrow,
    ),
    createTextElement(
      'h1',
      'real-mobile-document__title',
      documentData.title,
    ),
    createTextElement(
      'p',
      'real-mobile-document__subtitle',
      documentData.subtitle,
    ),
  )

  if (documentData.dateline) {
    header.append(
      createTextElement(
        'p',
        'real-mobile-document__dateline',
        documentData.dateline,
      ),
    )
  }

  const meta =
    document.createElement('dl')

  meta.className =
    'real-mobile-document__meta'

  documentData.meta.forEach(
    (item) => {
      const group =
        document.createElement('div')

      const term =
        document.createElement('dt')

      term.textContent =
        item.label

      const description =
        document.createElement('dd')

      description.textContent =
        item.value

      group.append(
        term,
        description,
      )

      meta.append(group)
    },
  )

  header.append(meta)
  article.append(header)

  documentData.intro.forEach(
    (paragraph) => {
      article.append(
        createTextElement(
          'p',
          'real-mobile-document__intro',
          paragraph,
        ),
      )
    },
  )

  documentData.sections.forEach(
    (sectionData) => {
      const section =
        document.createElement('section')

      section.className =
        'real-mobile-document__section'

      section.append(
        createTextElement(
          'h2',
          'real-mobile-document__section-title',
          sectionData.title,
        ),
      )

      sectionData.blocks.forEach(
        (block) => {
          section.append(
            createMobileBlock(block),
          )
        },
      )

      article.append(section)
    },
  )

  const footer =
    document.createElement('footer')

  footer.className =
    'real-mobile-document__footer'

  footer.textContent =
    'Персональный компьютер · локальная копия'

  article.append(footer)

  return article
}

function createLoadingState(): HTMLElement {
  return createTextElement(
    'p',
    'real-mobile-document-state',
    'Подготовка документа к чтению…',
  )
}

function createErrorState(): HTMLElement {
  return createTextElement(
    'p',
    'real-mobile-document-state real-mobile-document-state--error',
    'Не удалось загрузить мобильную версию документа.',
  )
}

function resetScrollPosition(
  elements: RenderedDocumentViewerElements,
): void {
  const body =
    elements.content.closest<HTMLElement>(
      '.real-pdf-body',
    )

  if (!body) {
    return
  }

  body.scrollTop = 0
  body.scrollLeft = 0
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

  const mobileReadingMedia =
    window.matchMedia(
      MOBILE_READING_QUERY,
    )

  let elements:
    RenderedDocumentViewerElements | null =
      null

  let currentFile:
    CaseFile | null =
      null

  let renderRequestId = 0

  const renderCurrentFile =
    async (): Promise<void> => {
      if (
        !elements ||
        !currentFile
      ) {
        return
      }

      const currentElements =
        elements

      const currentDocument =
        currentFile

      const config =
        renderedDocuments[
          currentDocument.id
        ]

      if (!config) {
        return
      }

      renderRequestId += 1

      const requestId =
        renderRequestId

      currentElements.pageCount.textContent =
        `Страниц: ${config.pageCount}`

      if (
        !mobileReadingMedia.matches
      ) {
        renderDesktopPages(
          currentElements,
          currentDocument,
          config,
        )

        resetScrollPosition(
          currentElements,
        )

        return
      }

      currentElements.content.className =
        'real-document-content real-document-content--mobile'

      currentElements.content.replaceChildren(
        createLoadingState(),
      )

      resetScrollPosition(
        currentElements,
      )

      try {
        const documentData =
          await loadMobileDocument(
            config,
          )

        if (
          requestId !== renderRequestId ||
          elements !== currentElements ||
          currentFile !== currentDocument
        ) {
          return
        }

        currentElements.content.replaceChildren(
          createMobileDocumentElement(
            documentData,
          ),
        )

        resetScrollPosition(
          currentElements,
        )
      } catch {
        if (
          requestId !== renderRequestId ||
          elements !== currentElements
        ) {
          return
        }

        currentElements.content.replaceChildren(
          createErrorState(),
        )
      }
    }

  const closeViewer =
    (): void => {
      renderRequestId += 1
      currentFile = null

      if (!elements) {
        return
      }

      elements.content
        .replaceChildren()

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

    currentFile = file

    elements.window.hidden =
      false

    elements.title.textContent =
      file.name

    void renderCurrentFile()
  }

  mobileReadingMedia.addEventListener(
    'change',
    () => {
      void renderCurrentFile()
    },
  )

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
