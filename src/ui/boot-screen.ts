import type {
  SystemConfig,
} from '../core/types/system'

import {
  escapeHtml,
} from '../core/utilities/html'

const BOOT_STORAGE_KEY =
  'vasily-computer:boot-completed:v1'

const NORMAL_STEP_DELAY_MS = 680
const REDUCED_MOTION_STEP_DELAY_MS = 120

const NORMAL_FINISH_DELAY_MS = 460
const REDUCED_MOTION_FINISH_DELAY_MS = 80

function readBootCompletion(): boolean {
  try {
    return (
      window.sessionStorage.getItem(
        BOOT_STORAGE_KEY,
      ) === 'true'
    )
  } catch {
    return false
  }
}

function saveBootCompletion(): void {
  try {
    window.sessionStorage.setItem(
      BOOT_STORAGE_KEY,
      'true',
    )
  } catch {
    // Сайт продолжит работать без sessionStorage.
  }
}

function shouldForceBoot(): boolean {
  const parameters =
    new URLSearchParams(
      window.location.search,
    )

  return parameters.get('boot') === '1'
}

function wait(
  delayMs: number,
): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      delayMs,
    )
  })
}

export async function showBootScreen(
  root: HTMLDivElement,
  config: SystemConfig,
): Promise<void> {
  if (
    readBootCompletion() &&
    !shouldForceBoot()
  ) {
    return
  }

  const messages = config.boot.messages

  root.innerHTML = `
    <main
      class="
        system-stage
        system-stage--boot
      "
    >
      <div
        class="system-backdrop"
        aria-hidden="true"
      >
        <span
          class="
            system-backdrop__orb
            system-backdrop__orb--blue
          "
        ></span>

        <span
          class="
            system-backdrop__orb
            system-backdrop__orb--teal
          "
        ></span>

        <span
          class="
            system-backdrop__orb
            system-backdrop__orb--amber
          "
        ></span>

        <span
          class="
            system-backdrop__grid
          "
        ></span>

        <span
          class="
            system-backdrop__grain
          "
        ></span>

        <span
          class="
            system-backdrop__vignette
          "
        ></span>
      </div>

      <section
        class="computer-boot"
        aria-label="Запуск компьютера"
      >
        <div
          class="
            computer-boot__logo-shell
          "
          aria-hidden="true"
        >
          <div
            class="computer-boot__logo"
          >
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        <p class="computer-boot__eyebrow">
          Персональная система
        </p>

        <h1 class="computer-boot__title">
          ${escapeHtml(
            config.profile.displayName,
          )}
        </h1>

        <p class="computer-boot__subtitle">
          Локальный профиль · защищённый доступ
        </p>

        <div class="computer-boot__panel">
          <div
            class="
              computer-boot__status-line
            "
          >
            <span
              class="
                computer-boot__pulse
              "
              aria-hidden="true"
            ></span>

            <span
              data-boot-message
              aria-live="polite"
            >
              ${escapeHtml(
                messages[0] ??
                  'Запуск системы',
              )}
            </span>
          </div>

          <div
            class="computer-boot__progress"
            role="progressbar"
            aria-label="Загрузка системы"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="0"
          >
            <div
              class="
                computer-boot__progress-fill
              "
              data-boot-progress
            ></div>

            <div
              class="
                computer-boot__progress-shine
              "
              aria-hidden="true"
            ></div>
          </div>

          <div
            class="computer-boot__steps"
            aria-hidden="true"
          >
            ${messages
              .map(
                () => `
                  <span
                    data-boot-step
                  ></span>
                `,
              )
              .join('')}
          </div>
        </div>

        <p class="computer-boot__footer">
          Подготовка локальных служб
        </p>
      </section>
    </main>
  `

  const progressElement =
    root.querySelector<HTMLElement>(
      '[role="progressbar"]',
    )

  const progressFill =
    root.querySelector<HTMLElement>(
      '[data-boot-progress]',
    )

  const messageElement =
    root.querySelector<HTMLElement>(
      '[data-boot-message]',
    )

  const stepElements =
    Array.from(
      root.querySelectorAll<HTMLElement>(
        '[data-boot-step]',
      ),
    )

  if (
    !progressElement ||
    !progressFill ||
    !messageElement
  ) {
    throw new Error(
      'Не удалось создать загрузочный экран.',
    )
  }

  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

  const stepDelay =
    reducedMotion
      ? REDUCED_MOTION_STEP_DELAY_MS
      : NORMAL_STEP_DELAY_MS

  const finishDelay =
    reducedMotion
      ? REDUCED_MOTION_FINISH_DELAY_MS
      : NORMAL_FINISH_DELAY_MS

  for (
    let index = 0;
    index < messages.length;
    index += 1
  ) {
    const message = messages[index]

    const progress = Math.round(
      ((index + 1) / messages.length) *
        100,
    )

    messageElement.textContent =
      message

    progressFill.style.width =
      `${progress}%`

    progressElement.setAttribute(
      'aria-valuenow',
      String(progress),
    )

    stepElements.forEach(
      (stepElement, stepIndex) => {
        stepElement.classList.toggle(
          'is-active',
          stepIndex === index,
        )

        stepElement.classList.toggle(
          'is-complete',
          stepIndex < index,
        )
      },
    )

    await wait(stepDelay)
  }

  stepElements.forEach(
    (stepElement) => {
      stepElement.classList.remove(
        'is-active',
      )

      stepElement.classList.add(
        'is-complete',
      )
    },
  )

  saveBootCompletion()

  await wait(finishDelay)
}