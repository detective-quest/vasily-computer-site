import type {
  CaseFile,
  FileStatus,
} from '../core/types/case'

import { escapeHtml } from '../core/utilities/html'

import { openModal } from '../ui/modal'

import pdfWorkerUrl from
  'pdfjs-dist/build/pdf.worker.min.mjs?url'

type PdfJsLibrary =
  typeof import('pdfjs-dist')

const PDF_MIN_ZOOM = 0.75
const PDF_MAX_ZOOM = 2
const PDF_ZOOM_STEP = 0.25
const PDF_MAX_FIT_WIDTH = 920
const PDF_MIN_OUTPUT_SCALE = 2
const PDF_MAX_OUTPUT_SCALE = 3

let pdfJsLibraryPromise:
  Promise<PdfJsLibrary> | null = null

function getStatusLabel(
  status: FileStatus,
): string {
  if (status === 'hidden') {
    return 'Скрытый'
  }

  if (status === 'corrupted') {
    return 'Повреждён'
  }

  return 'Обычный'
}

function getFileTypeLabel(
  file: CaseFile,
): string {
  if (file.kind === 'pdf') {
    return 'PDF-документ'
  }

  if (file.kind === 'spreadsheet') {
    return 'Электронная таблица'
  }

  if (file.kind === 'text') {
    return 'Текстовый файл'
  }

  if (file.kind === 'image') {
    return 'Изображение'
  }

  if (file.kind === 'audio') {
    return 'Аудиофайл'
  }

  if (file.kind === 'video') {
    return 'Видеофайл'
  }

  if (file.kind === 'archive') {
    return 'Архив'
  }

  return 'Файл'
}

function hasPdfPreview(
  file: CaseFile,
): boolean {
  const previewPath =
    file.source.previewPath

  if (!previewPath) {
    return false
  }

  if (
    file.kind === 'pdf' ||
    file.kind === 'spreadsheet'
  ) {
    return true
  }

  try {
    const previewUrl = new URL(
      previewPath,
      window.location.origin,
    )

    return previewUrl.pathname
      .toLowerCase()
      .endsWith('.pdf')
  } catch {
    return previewPath
      .split(/[?#]/, 1)[0]
      .toLowerCase()
      .endsWith('.pdf')
  }
}

async function getPdfJsLibrary():
Promise<PdfJsLibrary> {
  if (!pdfJsLibraryPromise) {
    pdfJsLibraryPromise =
      import('pdfjs-dist')
        .then((pdfJsLibrary) => {
          pdfJsLibrary
            .GlobalWorkerOptions
            .workerSrc = pdfWorkerUrl

          return pdfJsLibrary
        })
  }

  return pdfJsLibraryPromise
}

/**
 * Возвращает правильное имя скачиваемого файла.
 *
 * Отображаемое имя таблицы может заканчиваться на .xlsx,
 * хотя реально для скачивания используется PDF-копия.
 * Поэтому расширение берётся из downloadPath.
 */
function getDownloadFileName(
  file: CaseFile,
): string {
  const downloadPath =
    file.source.downloadPath

  if (!downloadPath) {
    return file.name
  }

  try {
    const downloadUrl = new URL(
      downloadPath,
      window.location.origin,
    )

    const pathFileName =
      decodeURIComponent(
        downloadUrl.pathname
          .split('/')
          .filter(Boolean)
          .at(-1) ?? '',
      )

    const pathExtensionMatch =
      pathFileName.match(
        /(\.[a-zA-Z0-9]+)$/,
      )

    const pathExtension =
      pathExtensionMatch?.[1]

    if (!pathExtension) {
      return file.name
    }

    const displayNameWithoutExtension =
      file.name.replace(
        /\.[^.]+$/,
        '',
      )

    return (
      displayNameWithoutExtension +
      pathExtension.toLowerCase()
    )
  } catch {
    return file.name
  }
}

function renderFileDetails(
  file: CaseFile,
): string {
  return `
    <dl class="viewer-details">
      <div class="viewer-details__row">
        <dt>Имя</dt>
        <dd>${escapeHtml(file.name)}</dd>
      </div>

      <div class="viewer-details__row">
        <dt>Тип</dt>
        <dd>
          ${escapeHtml(
            getFileTypeLabel(file),
          )}
        </dd>
      </div>

      <div class="viewer-details__row">
        <dt>Размер</dt>
        <dd>
          ${escapeHtml(file.sizeLabel)}
        </dd>
      </div>

      <div class="viewer-details__row">
        <dt>Создан</dt>
        <dd>
          ${escapeHtml(file.createdAt)}
        </dd>
      </div>

      <div class="viewer-details__row">
        <dt>Изменён</dt>
        <dd>
          ${escapeHtml(file.modifiedAt)}
        </dd>
      </div>

      <div class="viewer-details__row">
        <dt>Атрибуты</dt>
        <dd>
          ${getStatusLabel(file.status)}
        </dd>
      </div>
    </dl>
  `
}

function renderMobileFileDetails(
  file: CaseFile,
): string {
  return `
    <dl
      class="
        viewer-details
        viewer-details--mobile
      "
    >
      <div class="viewer-details__row">
        <dt>Тип</dt>
        <dd>
          ${escapeHtml(
            getFileTypeLabel(file),
          )}
        </dd>
      </div>

      <div class="viewer-details__row">
        <dt>Размер</dt>
        <dd>
          ${escapeHtml(file.sizeLabel)}
        </dd>
      </div>

      <div class="viewer-details__row">
        <dt>Изменён</dt>
        <dd>
          ${escapeHtml(file.modifiedAt)}
        </dd>
      </div>
    </dl>
  `
}

function renderDownloadLink(
  file: CaseFile,
): string {
  const downloadPath =
    file.source.downloadPath

  if (!downloadPath) {
    return ''
  }

  const downloadFileName =
    getDownloadFileName(file)

  return `
    <a
      class="viewer-action"
      href="${escapeHtml(downloadPath)}"
      download="${escapeHtml(
        downloadFileName,
      )}"
    >
      Скачать файл
    </a>
  `
}

function renderPdfCanvasShell(
  displayName: string,
  previewPath: string,
  isLazy = false,
): string {
  return `
    <div
      class="pdf-viewer"
      data-pdf-viewer
      data-pdf-path="${escapeHtml(
        previewPath,
      )}"
      data-pdf-name="${escapeHtml(
        displayName,
      )}"
      ${
        isLazy
          ? 'data-pdf-lazy="true"'
          : ''
      }
    >
      <div class="pdf-viewer__toolbar">
        <div
          class="pdf-viewer__controls"
          aria-label="Масштаб документа"
        >
          <button
            class="pdf-viewer__control"
            type="button"
            data-pdf-zoom-out
            aria-label="Уменьшить масштаб"
          >
            −
          </button>

          <span
            class="pdf-viewer__zoom-value"
            data-pdf-zoom-value
          >
            100%
          </span>

          <button
            class="pdf-viewer__control"
            type="button"
            data-pdf-zoom-in
            aria-label="Увеличить масштаб"
          >
            +
          </button>
        </div>
      </div>

      <div
        class="pdf-viewer__pages"
        data-pdf-pages
        aria-live="polite"
      >
        <div
          class="pdf-viewer__status"
          data-pdf-status
        >
          Загрузка документа…
        </div>
      </div>
    </div>
  `
}

function renderTranscript(
  file: CaseFile,
): string {
  const transcriptPath =
    file.source.transcriptPath

  if (!transcriptPath) {
    return ''
  }

  return `
    <details class="audio-transcript">
      <summary>
        Показать расшифровку
      </summary>

      <div class="audio-transcript__content">
        ${renderPdfCanvasShell(
          'Расшифровка аудиозаписи',
          transcriptPath,
          true,
        )}
      </div>
    </details>
  `
}

function renderUnavailablePreview(
  file: CaseFile,
): string {
  return `
    <div class="viewer-message">
      <div
        class="viewer-message__icon"
        aria-hidden="true"
      >
        FILE
      </div>

      <h3>
        Предварительный просмотр
        пока не подключён
      </h3>

      <p>
        Объект уже существует в структуре
        накопителя, но настоящий файл
        ещё не добавлен в проект.
      </p>
    </div>

    ${renderFileDetails(file)}

    <div class="viewer-actions">
      ${renderDownloadLink(file)}

      <button
        class="
          viewer-action
          viewer-action--secondary
        "
        type="button"
        data-modal-close
      >
        Закрыть
      </button>
    </div>
  `
}

function renderPdfViewer(
  file: CaseFile,
  previewPath: string,
): string {
  return `
    ${renderPdfCanvasShell(
      file.name,
      previewPath,
    )}

    ${renderMobileFileDetails(file)}

    <div class="viewer-actions">
      ${renderDownloadLink(file)}

      <button
        class="
          viewer-action
          viewer-action--secondary
        "
        type="button"
        data-modal-close
      >
        Закрыть
      </button>
    </div>
  `
}

function renderImageViewer(
  file: CaseFile,
  previewPath: string,
): string {
  return `
    <div class="image-viewer">
      <img
        class="image-viewer__image"
        src="${escapeHtml(previewPath)}"
        alt="${escapeHtml(file.name)}"
      />
    </div>

    <div class="viewer-actions">
      ${renderDownloadLink(file)}

      <button
        class="
          viewer-action
          viewer-action--secondary
        "
        type="button"
        data-modal-close
      >
        Закрыть
      </button>
    </div>
  `
}

function renderAudioViewer(
  file: CaseFile,
  previewPath: string,
): string {
  return `
    <div class="audio-viewer">
      <div
        class="audio-viewer__icon"
        aria-hidden="true"
      >
        AUD
      </div>

      <audio
        class="audio-viewer__player"
        controls
        preload="metadata"
        src="${escapeHtml(previewPath)}"
      >
        Ваш браузер не поддерживает
        воспроизведение аудио.
      </audio>

      ${renderTranscript(file)}
    </div>

    <div class="viewer-actions">
      ${renderDownloadLink(file)}

      <button
        class="
          viewer-action
          viewer-action--secondary
        "
        type="button"
        data-modal-close
      >
        Закрыть
      </button>
    </div>
  `
}

function renderVideoViewer(
  file: CaseFile,
  previewPath: string,
): string {
  return `
    <div class="video-viewer">
      <video
        class="video-viewer__player"
        controls
        preload="metadata"
        src="${escapeHtml(previewPath)}"
      >
        Ваш браузер не поддерживает
        воспроизведение видео.
      </video>
    </div>

    <div class="viewer-actions">
      ${renderDownloadLink(file)}

      <button
        class="
          viewer-action
          viewer-action--secondary
        "
        type="button"
        data-modal-close
      >
        Закрыть
      </button>
    </div>
  `
}

function renderTextViewer(
  file: CaseFile,
  previewPath: string,
): string {
  return `
    <iframe
      class="
        viewer-frame
        viewer-frame--text
      "
      src="${escapeHtml(previewPath)}"
      title="${escapeHtml(file.name)}"
    ></iframe>

    <div class="viewer-actions">
      ${renderDownloadLink(file)}

      <button
        class="
          viewer-action
          viewer-action--secondary
        "
        type="button"
        data-modal-close
      >
        Закрыть
      </button>
    </div>
  `
}

function renderArchiveViewer(
  file: CaseFile,
): string {
  return `
    <div class="viewer-message">
      <div
        class="viewer-message__icon"
        aria-hidden="true"
      >
        ZIP
      </div>

      <h3>
        Предварительный просмотр
        архива недоступен
      </h3>

      <p>
        Архив можно сохранить
        на устройство, если для него
        подключён файл скачивания.
      </p>
    </div>

    ${renderFileDetails(file)}

    <div class="viewer-actions">
      ${renderDownloadLink(file)}

      <button
        class="
          viewer-action
          viewer-action--secondary
        "
        type="button"
        data-modal-close
      >
        Закрыть
      </button>
    </div>
  `
}

function renderCorruptedFile(
  file: CaseFile,
): string {
  const errorCode =
    file.kind === 'audio'
      ? 'AUD-041'
      : 'FS-019'

  return `
    <div
      class="
        viewer-message
        viewer-message--error
      "
    >
      <div
        class="viewer-message__icon"
        aria-hidden="true"
      >
        !
      </div>

      <h3>
        Не удалось открыть файл
      </h3>

      <p>
        Файл повреждён или содержит
        неподдерживаемые данные.
      </p>

      <p class="viewer-message__code">
        Код ошибки:
        ${errorCode}
      </p>
    </div>

    ${renderFileDetails(file)}

    <div class="viewer-actions">
      <button
        class="
          viewer-action
          viewer-action--secondary
        "
        type="button"
        data-modal-close
      >
        Закрыть
      </button>
    </div>
  `
}

function createViewerContent(
  file: CaseFile,
): string {
  if (file.status === 'corrupted') {
    return renderCorruptedFile(file)
  }

  const previewPath =
    file.source.previewPath

  if (!previewPath) {
    if (file.kind === 'archive') {
      return renderArchiveViewer(file)
    }

    return renderUnavailablePreview(file)
  }

  if (hasPdfPreview(file)) {
    return renderPdfViewer(
      file,
      previewPath,
    )
  }

  if (file.kind === 'image') {
    return renderImageViewer(
      file,
      previewPath,
    )
  }

  if (file.kind === 'audio') {
    return renderAudioViewer(
      file,
      previewPath,
    )
  }

  if (file.kind === 'video') {
    return renderVideoViewer(
      file,
      previewPath,
    )
  }

  if (file.kind === 'text') {
    return renderTextViewer(
      file,
      previewPath,
    )
  }

  return renderUnavailablePreview(file)
}

function createPdfErrorMessage(
  displayName: string,
  previewPath: string,
): HTMLDivElement {
  const errorElement =
    document.createElement('div')

  errorElement.className =
    'pdf-viewer__error'

  errorElement.innerHTML = `
    <div
      class="pdf-viewer__error-icon"
      aria-hidden="true"
    >
      PDF
    </div>

    <h3>Не удалось показать документ</h3>

    <p>
      Встроенный просмотр недоступен.
      Файл можно открыть отдельно.
    </p>

    <a
      class="viewer-action"
      href="${escapeHtml(previewPath)}"
      target="_blank"
      rel="noopener"
      aria-label="Открыть ${escapeHtml(
        displayName,
      )} отдельно"
    >
      Открыть отдельно
    </a>
  `

  return errorElement
}

function setPdfControlsDisabled(
  viewer: HTMLElement,
  disabled: boolean,
): void {
  const controls =
    viewer.querySelectorAll<
      HTMLButtonElement
    >(
      '[data-pdf-zoom-out], ' +
      '[data-pdf-zoom-in]',
    )

  controls.forEach((control) => {
    control.disabled = disabled
  })
}

async function initialisePdfViewer(
  viewer: HTMLElement,
): Promise<void> {
  if (
    viewer.dataset.pdfInitialised ===
    'true'
  ) {
    return
  }

  viewer.dataset.pdfInitialised = 'true'

  const previewPath =
    viewer.dataset.pdfPath

  const displayName =
    viewer.dataset.pdfName ??
    'Документ'

  const pagesElement =
    viewer.querySelector<HTMLElement>(
      '[data-pdf-pages]',
    )

  const zoomOutButton =
    viewer.querySelector<HTMLButtonElement>(
      '[data-pdf-zoom-out]',
    )

  const zoomInButton =
    viewer.querySelector<HTMLButtonElement>(
      '[data-pdf-zoom-in]',
    )

  const zoomValueElement =
    viewer.querySelector<HTMLElement>(
      '[data-pdf-zoom-value]',
    )

  if (
    !previewPath ||
    !pagesElement ||
    !zoomOutButton ||
    !zoomInButton ||
    !zoomValueElement
  ) {
    return
  }

  let loadingTask:
    ReturnType<PdfJsLibrary['getDocument']> |
    null = null

  let isClosed = false
  let zoom = 1
  let renderVersion = 0

  const dialog =
    viewer.closest<HTMLDialogElement>(
      'dialog',
    )

  const cleanUp = (): void => {
    isClosed = true
    renderVersion += 1

    if (loadingTask) {
      void loadingTask.destroy()
    }
  }

  dialog?.addEventListener(
    'close',
    cleanUp,
    {
      once: true,
    },
  )

  const updateZoomControls = (): void => {
    zoomValueElement.textContent =
      `${Math.round(zoom * 100)}%`

    zoomOutButton.disabled =
      zoom <= PDF_MIN_ZOOM

    zoomInButton.disabled =
      zoom >= PDF_MAX_ZOOM
  }

  try {
    setPdfControlsDisabled(
      viewer,
      true,
    )

    const pdfJsLibrary =
      await getPdfJsLibrary()

    if (isClosed) {
      return
    }

    loadingTask =
      pdfJsLibrary.getDocument({
        url: previewPath,
      })

    const pdfDocument =
      await loadingTask.promise

    if (isClosed) {
      return
    }

    const renderPages =
      async (): Promise<void> => {
        const currentRenderVersion =
          ++renderVersion

        setPdfControlsDisabled(
          viewer,
          true,
        )

        const statusElement =
          document.createElement('div')

        statusElement.className =
          'pdf-viewer__status'

        statusElement.textContent =
          'Подготовка страниц…'

        pagesElement.replaceChildren(
          statusElement,
        )

        const availableWidth =
          Math.min(
            Math.max(
              pagesElement.clientWidth - 24,
              260,
            ),
            PDF_MAX_FIT_WIDTH,
          )

        for (
          let pageNumber = 1;
          pageNumber <=
            pdfDocument.numPages;
          pageNumber += 1
        ) {
          if (
            isClosed ||
            currentRenderVersion !==
              renderVersion
          ) {
            return
          }

          statusElement.textContent =
            `Загрузка страницы ` +
            `${pageNumber} из ` +
            `${pdfDocument.numPages}…`

          const page =
            await pdfDocument.getPage(
              pageNumber,
            )

          const originalViewport =
            page.getViewport({
              scale: 1,
            })

          const fitScale =
            availableWidth /
            originalViewport.width

          const pageScale =
            Math.min(
              Math.max(
                fitScale * zoom,
                0.25,
              ),
              4,
            )

          const viewport =
            page.getViewport({
              scale: pageScale,
            })

          const outputScale =
            Math.min(
              Math.max(
                window.devicePixelRatio || 1,
                PDF_MIN_OUTPUT_SCALE,
              ),
              PDF_MAX_OUTPUT_SCALE,
            )

          const pageElement =
            document.createElement(
              'section',
            )

          pageElement.className =
            'pdf-viewer__page'

          pageElement.setAttribute(
            'aria-label',
            `Страница ${pageNumber} ` +
              `из ${pdfDocument.numPages}`,
          )

          const canvas =
            document.createElement(
              'canvas',
            )

          canvas.className =
            'pdf-viewer__canvas'

          canvas.dir = 'ltr'

          const canvasContext =
            canvas.getContext('2d', {
              alpha: false,
            })

          if (!canvasContext) {
            throw new Error(
              'Canvas 2D context is unavailable.',
            )
          }

          canvas.width =
            Math.floor(
              viewport.width *
              outputScale,
            )

          canvas.height =
            Math.floor(
              viewport.height *
              outputScale,
            )

          canvas.style.width =
            `${Math.floor(
              viewport.width,
            )}px`

          canvas.style.height =
            `${Math.floor(
              viewport.height,
            )}px`

          const pageLabel =
            document.createElement('div')

          pageLabel.className =
            'pdf-viewer__page-label'

          pageLabel.textContent =
            `Страница ${pageNumber} ` +
            `из ${pdfDocument.numPages}`

          pageElement.append(
            canvas,
            pageLabel,
          )

          if (pageNumber === 1) {
            pagesElement.replaceChildren(
              pageElement,
            )
          } else {
            pagesElement.append(
              pageElement,
            )
          }

          const transform =
            outputScale !== 1
              ? [
                  outputScale,
                  0,
                  0,
                  outputScale,
                  0,
                  0,
                ]
              : undefined

          const renderTask =
            page.render({
              canvas,
              canvasContext,
              transform,
              viewport,
            })

          await renderTask.promise
        }

        if (
          isClosed ||
          currentRenderVersion !==
            renderVersion
        ) {
          return
        }

        updateZoomControls()
      }

    zoomOutButton.addEventListener(
      'click',
      () => {
        zoom = Math.max(
          PDF_MIN_ZOOM,
          zoom - PDF_ZOOM_STEP,
        )

        updateZoomControls()
        void renderPages()
      },
    )

    zoomInButton.addEventListener(
      'click',
      () => {
        zoom = Math.min(
          PDF_MAX_ZOOM,
          zoom + PDF_ZOOM_STEP,
        )

        updateZoomControls()
        void renderPages()
      },
    )

    updateZoomControls()
    await renderPages()
  } catch (error) {
    if (isClosed) {
      return
    }

    console.error(
      'Не удалось отобразить PDF.',
      error,
    )

    pagesElement.replaceChildren(
      createPdfErrorMessage(
        displayName,
        previewPath,
      ),
    )

    setPdfControlsDisabled(
      viewer,
      true,
    )
  }
}

function initialisePdfViewers(
  dialog: HTMLDialogElement,
): void {
  const viewers =
    dialog.querySelectorAll<HTMLElement>(
      '[data-pdf-viewer]',
    )

  viewers.forEach((viewer) => {
    if (
      viewer.dataset.pdfLazy !==
      'true'
    ) {
      void initialisePdfViewer(viewer)
      return
    }

    const details =
      viewer.closest<HTMLDetailsElement>(
        'details',
      )

    if (!details) {
      void initialisePdfViewer(viewer)
      return
    }

    const startWhenOpened = (): void => {
      if (details.open) {
        void initialisePdfViewer(viewer)
      }
    }

    details.addEventListener(
      'toggle',
      startWhenOpened,
    )

    startWhenOpened()
  })
}

export function openFileViewer(
  root: HTMLElement,
  file: CaseFile,
): void {
  const title =
    file.status === 'corrupted'
      ? 'Ошибка открытия файла'
      : file.name

  const dialog = openModal(root, {
    title,
    content: createViewerContent(file),
    className:
      hasPdfPreview(file)
        ? 'viewer-dialog--pdf'
        : `viewer-dialog--${file.kind}`,
  })

  initialisePdfViewers(dialog)
}

export function downloadFile(
  root: HTMLElement,
  file: CaseFile,
): void {
  const downloadPath =
    file.source.downloadPath

  if (!downloadPath) {
    openModal(root, {
      title: 'Скачивание недоступно',
      content: `
        <div class="viewer-message">
          <div
            class="viewer-message__icon"
            aria-hidden="true"
          >
            ↓
          </div>

          <h3>
            Файл ещё не подключён
          </h3>

          <p>
            Для объекта
            «${escapeHtml(file.name)}»
            пока не указан файл
            для скачивания.
          </p>
        </div>

        <div class="viewer-actions">
          <button
            class="
              viewer-action
              viewer-action--secondary
            "
            type="button"
            data-modal-close
          >
            Закрыть
          </button>
        </div>
      `,
    })

    return
  }

  const link =
    document.createElement('a')

  link.href = downloadPath

  link.download =
    getDownloadFileName(file)

  link.rel = 'noopener'

  document.body.append(link)

  link.click()
  link.remove()
}
