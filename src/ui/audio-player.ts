import type {
  CaseFile,
  CaseManifest,
} from '../core/types/case'

interface AudioPlayerElements {
  window: HTMLElement
  title: HTMLElement
  state: HTMLElement
  audio: HTMLAudioElement
  playButton: HTMLButtonElement
  playIcon: HTMLElement
  playText: HTMLElement
  seek: HTMLInputElement
  currentTime: HTMLElement
  duration: HTMLElement
  volume: HTMLInputElement
  minimizeButton: HTMLButtonElement
  maximizeButton: HTMLButtonElement
  closeButton: HTMLButtonElement
}

function isHostedAudio(
  file: CaseFile,
): boolean {
  return (
    file.kind === 'audio' &&
    file.source.provider === 'pages' &&
    Boolean(
      file.source.previewPath ||
      file.source.downloadPath,
    )
  )
}

function findHostedAudio(
  manifest: CaseManifest,
  fileId: string,
): CaseFile | null {
  const file =
    manifest.files.find(
      (item) =>
        item.id === fileId,
    )

  if (
    !file ||
    !isHostedAudio(file)
  ) {
    return null
  }

  return file
}

function getBaseUrl(): string {
  return import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
}

function getAudioUrlCandidates(
  file: CaseFile,
): string[] {
  if (file.source.provider !== 'pages') {
    return []
  }

  const sourcePath =
    file.source.previewPath ||
    file.source.downloadPath

  if (!sourcePath) {
    return []
  }

  const cleanPath =
    sourcePath.replace(
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

function formatTime(
  seconds: number,
): string {
  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return '--:--'
  }

  const totalSeconds =
    Math.floor(seconds)

  const minutes =
    Math.floor(
      totalSeconds / 60,
    )

  const remainingSeconds =
    totalSeconds % 60

  return [
    String(minutes),
    String(remainingSeconds)
      .padStart(2, '0'),
  ].join(':')
}

function createPlayerWindow(
  desktopShell: HTMLElement,
): AudioPlayerElements {
  const windowElement =
    document.createElement('section')

  windowElement.className =
    'document-viewer-window audio-player-window'

  windowElement.dataset
    .audioPlayerWindow = ''

  windowElement.innerHTML = `
    <header class="document-viewer-titlebar">
      <div class="document-viewer-titlebar__identity">
        <span
          class="
            document-viewer-titlebar__icon
            audio-player-titlebar__icon
          "
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="
                M9 18
                V6
                L19 4
                V16
              "
            ></path>

            <circle
              cx="6.5"
              cy="18"
              r="2.5"
            ></circle>

            <circle
              cx="16.5"
              cy="16"
              r="2.5"
            ></circle>
          </svg>
        </span>

        <div>
          <strong data-audio-player-title>
            Аудиозапись
          </strong>

          <span>
            Проигрыватель аудио
          </span>
        </div>
      </div>

      <div class="document-viewer-titlebar__controls">
        <button
          type="button"
          title="Свернуть"
          aria-label="Свернуть"
          data-audio-player-minimize
        >
          —
        </button>

        <button
          type="button"
          title="Развернуть"
          aria-label="Развернуть"
          data-audio-player-maximize
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
          data-audio-player-close
        >
          ×
        </button>
      </div>
    </header>

    <div class="document-viewer-toolbar">
      <span class="document-viewer-toolbar__state">
        <i aria-hidden="true"></i>

        <span data-audio-player-state>
          Готово к воспроизведению
        </span>
      </span>

      <span class="audio-player-toolbar__format">
        MP3
      </span>
    </div>

    <main class="audio-player-body">
      <section class="audio-player-card">
        <div
          class="audio-player-visual"
          aria-hidden="true"
        >
          <span class="audio-player-visual__disc">
            <i></i>
          </span>

          <span class="audio-player-visual__waves">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </span>
        </div>

        <div class="audio-player-information">
          <span>
            Локальная аудиозапись
          </span>

          <strong data-audio-player-file-name>
            REC_001.mp3
          </strong>

          <small>
            MPEG Audio
          </small>
        </div>

        <div class="audio-player-progress">
          <input
            type="range"
            min="0"
            max="1000"
            step="1"
            value="0"
            aria-label="Позиция воспроизведения"
            data-audio-player-seek
          >

          <div class="audio-player-progress__times">
            <time data-audio-player-current-time>
              0:00
            </time>

            <time data-audio-player-duration>
              --:--
            </time>
          </div>
        </div>

        <div class="audio-player-controls">
          <button
            class="audio-player-play-button"
            type="button"
            aria-label="Воспроизвести"
            data-audio-player-play
          >
            <span
              class="audio-player-play-button__icon"
              data-audio-player-play-icon
              aria-hidden="true"
            >
              ▶
            </span>

            <span data-audio-player-play-text>
              Воспроизвести
            </span>
          </button>

          <label class="audio-player-volume">
            <span>
              Громкость
            </span>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value="0.85"
              aria-label="Громкость"
              data-audio-player-volume
            >
          </label>
        </div>

        <audio
          preload="metadata"
          data-audio-player-audio
        ></audio>
      </section>
    </main>

    <footer class="document-viewer-statusbar">
      <span>
        Локальное хранилище
      </span>

      <span>
        Аудиозапись MP3
      </span>
    </footer>
  `

  desktopShell.append(
    windowElement,
  )

  const title =
    windowElement.querySelector<HTMLElement>(
      '[data-audio-player-title]',
    )

  const fileName =
    windowElement.querySelector<HTMLElement>(
      '[data-audio-player-file-name]',
    )

  const state =
    windowElement.querySelector<HTMLElement>(
      '[data-audio-player-state]',
    )

  const audio =
    windowElement.querySelector<HTMLAudioElement>(
      '[data-audio-player-audio]',
    )

  const playButton =
    windowElement.querySelector<HTMLButtonElement>(
      '[data-audio-player-play]',
    )

  const playIcon =
    windowElement.querySelector<HTMLElement>(
      '[data-audio-player-play-icon]',
    )

  const playText =
    windowElement.querySelector<HTMLElement>(
      '[data-audio-player-play-text]',
    )

  const seek =
    windowElement.querySelector<HTMLInputElement>(
      '[data-audio-player-seek]',
    )

  const currentTime =
    windowElement.querySelector<HTMLElement>(
      '[data-audio-player-current-time]',
    )

  const duration =
    windowElement.querySelector<HTMLElement>(
      '[data-audio-player-duration]',
    )

  const volume =
    windowElement.querySelector<HTMLInputElement>(
      '[data-audio-player-volume]',
    )

  const minimizeButton =
    windowElement.querySelector<HTMLButtonElement>(
      '[data-audio-player-minimize]',
    )

  const maximizeButton =
    windowElement.querySelector<HTMLButtonElement>(
      '[data-audio-player-maximize]',
    )

  const closeButton =
    windowElement.querySelector<HTMLButtonElement>(
      '[data-audio-player-close]',
    )

  if (
    !title ||
    !fileName ||
    !state ||
    !audio ||
    !playButton ||
    !playIcon ||
    !playText ||
    !seek ||
    !currentTime ||
    !duration ||
    !volume ||
    !minimizeButton ||
    !maximizeButton ||
    !closeButton
  ) {
    windowElement.remove()

    throw new Error(
      'Не удалось создать аудиоплеер.',
    )
  }

  fileName.dataset
    .audioPlayerFileName = ''

  return {
    window: windowElement,
    title,
    state,
    audio,
    playButton,
    playIcon,
    playText,
    seek,
    currentTime,
    duration,
    volume,
    minimizeButton,
    maximizeButton,
    closeButton,
  }
}

function updatePlayButton(
  elements: AudioPlayerElements,
): void {
  const isPlaying =
    !elements.audio.paused &&
    !elements.audio.ended

  elements.playIcon.textContent =
    isPlaying
      ? 'Ⅱ'
      : '▶'

  elements.playText.textContent =
    isPlaying
      ? 'Пауза'
      : 'Воспроизвести'

  elements.playButton.setAttribute(
    'aria-label',
    isPlaying
      ? 'Поставить на паузу'
      : 'Воспроизвести',
  )

  elements.window.classList.toggle(
    'audio-player-window--playing',
    isPlaying,
  )
}

export function attachAudioPlayer(
  root: HTMLDivElement,
  manifest: CaseManifest,
): void {
  const desktopShell =
    root.querySelector<HTMLElement>(
      '[data-desktop-shell]',
    )

  if (!desktopShell) {
    throw new Error(
      'Не найден рабочий стол для аудиоплеера.',
    )
  }

  let elements:
    AudioPlayerElements | null =
      null

  let sourceCandidates:
    string[] = []

  let sourceIndex =
    0

  let isSeeking =
    false

  const loadCurrentSource =
    (): void => {
      if (!elements) {
        return
      }

      const sourceUrl =
        sourceCandidates[sourceIndex]

      if (!sourceUrl) {
        elements.state.textContent =
          'Не удалось загрузить аудиозапись'

        elements.seek.disabled =
          true

        return
      }

      elements.audio.src =
        sourceUrl

      elements.audio.load()
    }

  const closePlayer =
    (): void => {
      sourceCandidates = []

      if (!elements) {
        return
      }

      elements.audio.pause()
      elements.audio.removeAttribute('src')
      elements.audio.load()

      elements.window.remove()

      elements = null
    }

  const bindPlayerEvents =
    (
      playerElements:
        AudioPlayerElements,
    ): void => {
      playerElements.audio.volume =
        Number(
          playerElements.volume.value,
        )

      playerElements.playButton
        .addEventListener(
          'click',
          () => {
            if (
              playerElements.audio.paused
            ) {
              void playerElements.audio
                .play()
                .catch(
                  () => {
                    playerElements.state
                      .textContent =
                        'Воспроизведение недоступно'
                  },
                )

              return
            }

            playerElements.audio.pause()
          },
        )

      playerElements.audio
        .addEventListener(
          'loadedmetadata',
          () => {
            playerElements.duration
              .textContent =
                formatTime(
                  playerElements.audio
                    .duration,
                )

            playerElements.seek.disabled =
              false

            playerElements.state
              .textContent =
                'Готово к воспроизведению'
          },
        )

      playerElements.audio
        .addEventListener(
          'timeupdate',
          () => {
            playerElements.currentTime
              .textContent =
                formatTime(
                  playerElements.audio
                    .currentTime,
                )

            if (
              isSeeking ||
              !Number.isFinite(
                playerElements.audio
                  .duration,
              ) ||
              playerElements.audio
                .duration <= 0
            ) {
              return
            }

            playerElements.seek.value =
              String(
                Math.round(
                  (
                    playerElements.audio
                      .currentTime /
                    playerElements.audio
                      .duration
                  ) * 1000,
                ),
              )
          },
        )

      playerElements.audio
        .addEventListener(
          'play',
          () => {
            playerElements.state
              .textContent =
                'Воспроизведение'

            updatePlayButton(
              playerElements,
            )
          },
        )

      playerElements.audio
        .addEventListener(
          'pause',
          () => {
            if (
              !playerElements.audio
                .ended
            ) {
              playerElements.state
                .textContent =
                  'Пауза'
            }

            updatePlayButton(
              playerElements,
            )
          },
        )

      playerElements.audio
        .addEventListener(
          'ended',
          () => {
            playerElements.audio
              .currentTime = 0

            playerElements.seek.value =
              '0'

            playerElements.currentTime
              .textContent =
                '0:00'

            playerElements.state
              .textContent =
                'Воспроизведение завершено'

            updatePlayButton(
              playerElements,
            )
          },
        )

      playerElements.audio
        .addEventListener(
          'error',
          () => {
            sourceIndex += 1

            if (
              sourceIndex <
              sourceCandidates.length
            ) {
              loadCurrentSource()

              return
            }

            playerElements.state
              .textContent =
                'Не удалось загрузить аудиозапись'

            playerElements.seek.disabled =
              true
          },
        )

      playerElements.seek
        .addEventListener(
          'pointerdown',
          () => {
            isSeeking = true
          },
        )

      playerElements.seek
        .addEventListener(
          'input',
          () => {
            if (
              !Number.isFinite(
                playerElements.audio
                  .duration,
              ) ||
              playerElements.audio
                .duration <= 0
            ) {
              return
            }

            const nextTime =
              (
                Number(
                  playerElements.seek
                    .value,
                ) /
                1000
              ) *
              playerElements.audio
                .duration

            playerElements.currentTime
              .textContent =
                formatTime(nextTime)
          },
        )

      playerElements.seek
        .addEventListener(
          'change',
          () => {
            if (
              Number.isFinite(
                playerElements.audio
                  .duration,
              ) &&
              playerElements.audio
                .duration > 0
            ) {
              playerElements.audio
                .currentTime =
                  (
                    Number(
                      playerElements.seek
                        .value,
                    ) /
                    1000
                  ) *
                  playerElements.audio
                    .duration
            }

            isSeeking = false
          },
        )

      playerElements.seek
        .addEventListener(
          'pointerup',
          () => {
            isSeeking = false
          },
        )

      playerElements.volume
        .addEventListener(
          'input',
          () => {
            playerElements.audio.volume =
              Number(
                playerElements.volume
                  .value,
              )
          },
        )

      playerElements.closeButton
        .addEventListener(
          'click',
          closePlayer,
        )

      playerElements.minimizeButton
        .addEventListener(
          'click',
          () => {
            playerElements.window.hidden =
              true
          },
        )

      playerElements.maximizeButton
        .addEventListener(
          'click',
          () => {
            const isMaximized =
              playerElements.window
                .classList
                .toggle(
                  'document-viewer-window--maximized',
                )

            playerElements.maximizeButton
              .setAttribute(
                'title',
                isMaximized
                  ? 'Восстановить размер'
                  : 'Развернуть',
              )

            playerElements.maximizeButton
              .setAttribute(
                'aria-label',
                isMaximized
                  ? 'Восстановить размер'
                  : 'Развернуть',
              )
          },
        )
    }

  const openFile = (
    file: CaseFile,
  ): void => {
    const candidates =
      getAudioUrlCandidates(file)

    if (candidates.length === 0) {
      return
    }

    if (!elements) {
      elements =
        createPlayerWindow(
          desktopShell,
        )

      bindPlayerEvents(elements)
    }

    const currentElements =
      elements

    currentElements.audio.pause()

    sourceCandidates =
      candidates

    sourceIndex = 0
    isSeeking = false

    currentElements.window.hidden =
      false

    currentElements.title.textContent =
      file.name

    const fileName =
      currentElements.window
        .querySelector<HTMLElement>(
          '[data-audio-player-file-name]',
        )

    if (fileName) {
      fileName.textContent =
        file.name
    }

    currentElements.state.textContent =
      'Загрузка аудиозаписи'

    currentElements.seek.value =
      '0'

    currentElements.seek.disabled =
      true

    currentElements.currentTime
      .textContent =
        '0:00'

    currentElements.duration
      .textContent =
        '--:--'

    currentElements.window
      .classList
      .remove(
        'audio-player-window--playing',
      )

    updatePlayButton(
      currentElements,
    )

    loadCurrentSource()
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

    return findHostedAudio(
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

        closePlayer()

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