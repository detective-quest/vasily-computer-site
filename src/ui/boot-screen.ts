import { loadDefaultCase } from '../cases/case-loader'

import { escapeHtml } from '../core/utilities/html'

const BOOT_STORAGE_KEY =
  'petrov-usb-site:boot-completed:v1'

const NORMAL_STEP_DELAY_MS = 650
const REDUCED_MOTION_STEP_DELAY_MS = 180

interface BootStep {
  progress: number
  message: string
}

const bootSteps: BootStep[] = [
  {
    progress: 8,
    message: 'Подключение устройства...',
  },
  {
    progress: 23,
    message: 'Чтение таблицы разделов...',
  },
  {
    progress: 41,
    message: 'Проверка файловой системы...',
  },
  {
    progress: 63,
    message: 'Поиск скрытых элементов...',
  },
  {
    progress: 82,
    message: 'Проверка целостности файлов...',
  },
  {
    progress: 100,
    message: 'Проверка завершена.',
  },
]

function wasBootCompleted(): boolean {
  try {
    return (
      window.localStorage.getItem(
        BOOT_STORAGE_KEY,
      ) === 'true'
    )
  } catch {
    return false
  }
}

function saveBootCompletion(): void {
  try {
    window.localStorage.setItem(
      BOOT_STORAGE_KEY,
      'true',
    )
  } catch {
    /*
     * Сайт продолжит работать,
     * даже если localStorage недоступен.
     */
  }
}

function shouldForceBoot(): boolean {
  const parameters =
    new URLSearchParams(
      window.location.search,
    )

  return parameters.get('boot') === '1'
}

export async function showBootScreen(
  root: HTMLDivElement,
): Promise<void> {
  const forceBoot = shouldForceBoot()

  if (
    wasBootCompleted() &&
    !forceBoot
  ) {
    return
  }

  let manifest

  try {
    manifest = await loadDefaultCase()
  } catch {
    /*
     * Ошибку загрузки покажет
     * основной модуль приложения.
     */
    return
  }

  const hiddenFilesCount =
    manifest.files.filter(
      (file) =>
        file.status === 'hidden',
    ).length

  const corruptedFilesCount =
    manifest.files.filter(
      (file) =>
        file.status === 'corrupted',
    ).length

  const totalFilesCount =
    manifest.files.length

  root.innerHTML = `
    <main class="boot-desktop">
      <section
        class="boot-screen"
        aria-label="Подключение съёмного накопителя"
      >
        <header class="boot-screen__header">
          <span
            class="boot-screen__status-light"
            aria-hidden="true"
          ></span>

          <span>
            ${escapeHtml(
              manifest.systemName,
            )}
          </span>
        </header>

        <div class="boot-screen__content">
          <div
            class="boot-screen__device-icon"
            aria-hidden="true"
          >
            <span>USB</span>
          </div>

          <p class="boot-screen__eyebrow">
            Обнаружено новое устройство
          </p>

          <h1 class="boot-screen__title">
            Съёмный накопитель
          </h1>

          <div class="boot-screen__device-name">
            <strong>
              ${escapeHtml(
                manifest.driveLabel,
              )}
            </strong>

            <span>
              ${escapeHtml(
                manifest.driveLetter,
              )}:
            </span>
          </div>

          <div
            class="boot-progress"
            role="progressbar"
            aria-label="Проверка накопителя"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="0"
          >
            <div class="boot-progress__track">
              <div
                class="boot-progress__fill"
                data-boot-progress-fill
              ></div>
            </div>

            <span
              class="boot-progress__value"
              data-boot-progress-value
            >
              0%
            </span>
          </div>

          <p
            class="boot-screen__message"
            data-boot-message
            aria-live="polite"
          >
            Подготовка проверки...
          </p>

          <section
            class="boot-summary"
            data-boot-summary
            hidden
          >
            <h2>
              Проверка завершена
            </h2>

            <dl class="boot-summary__list">
              <div>
                <dt>
                  Файловая система
                </dt>

                <dd>
                  Исправна
                </dd>
              </div>

              <div>
                <dt>
                  Объектов найдено
                </dt>

                <dd>
                  ${totalFilesCount}
                </dd>
              </div>

              <div>
                <dt>
                  Скрытых объектов
                </dt>

                <dd>
                  ${hiddenFilesCount}
                </dd>
              </div>

              <div>
                <dt>
                  Повреждённых файлов
                </dt>

                <dd>
                  ${corruptedFilesCount}
                </dd>
              </div>
            </dl>
          </section>

          <div class="boot-screen__actions">
            <button
              class="
                boot-button
                boot-button--secondary
              "
              type="button"
              data-boot-skip
            >
              Пропустить проверку
            </button>

            <button
              class="
                boot-button
                boot-button--primary
              "
              type="button"
              data-boot-open
              hidden
            >
              Открыть накопитель
            </button>
          </div>
        </div>

        <footer class="boot-screen__footer">
          <span>
            Устройство:
            ${escapeHtml(
              manifest.driveLabel,
            )}
          </span>

          <span>
            Состояние: подключено
          </span>
        </footer>
      </section>
    </main>
  `

  const progressElement =
    root.querySelector<HTMLElement>(
      '[role="progressbar"]',
    )

  const progressFill =
    root.querySelector<HTMLElement>(
      '[data-boot-progress-fill]',
    )

  const progressValue =
    root.querySelector<HTMLElement>(
      '[data-boot-progress-value]',
    )

  const messageElement =
    root.querySelector<HTMLElement>(
      '[data-boot-message]',
    )

  const summaryElement =
    root.querySelector<HTMLElement>(
      '[data-boot-summary]',
    )

  const skipButton =
    root.querySelector<HTMLButtonElement>(
      '[data-boot-skip]',
    )

  const openButton =
    root.querySelector<HTMLButtonElement>(
      '[data-boot-open]',
    )

  if (
    !progressElement ||
    !progressFill ||
    !progressValue ||
    !messageElement ||
    !summaryElement ||
    !skipButton ||
    !openButton
  ) {
    return
  }

  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

  const stepDelay =
    reducedMotion
      ? REDUCED_MOTION_STEP_DELAY_MS
      : NORMAL_STEP_DELAY_MS

  await new Promise<void>((resolve) => {
    let currentStepIndex = 0
    let timerId: number | null = null
    let isCompleted = false

    const finishBoot = (): void => {
      if (isCompleted) {
        return
      }

      isCompleted = true

      if (timerId !== null) {
        window.clearTimeout(timerId)
      }

      saveBootCompletion()
      resolve()
    }

    const showNextStep = (): void => {
      const step =
        bootSteps[currentStepIndex]

      if (!step) {
        summaryElement.hidden = false
        openButton.hidden = false
        skipButton.hidden = true

        openButton.focus()

        return
      }

      progressFill.style.width =
        `${step.progress}%`

      progressValue.textContent =
        `${step.progress}%`

      progressElement.setAttribute(
        'aria-valuenow',
        String(step.progress),
      )

      messageElement.textContent =
        step.message

      currentStepIndex += 1

      timerId = window.setTimeout(
        showNextStep,
        stepDelay,
      )
    }

    skipButton.addEventListener(
      'click',
      finishBoot,
      {
        once: true,
      },
    )

    openButton.addEventListener(
      'click',
      finishBoot,
      {
        once: true,
      },
    )

    showNextStep()
  })
}