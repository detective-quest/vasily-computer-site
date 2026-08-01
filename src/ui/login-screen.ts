import type {
  SystemConfig,
} from '../core/types/system'

import {
  escapeHtml,
} from '../core/utilities/html'

const LOGIN_STORAGE_KEY =
  'vasily-computer:unlocked:v1'

function readUnlockState(): boolean {
  try {
    return (
      window.sessionStorage.getItem(
        LOGIN_STORAGE_KEY,
      ) === 'true'
    )
  } catch {
    return false
  }
}

function saveUnlockState(): void {
  try {
    window.sessionStorage.setItem(
      LOGIN_STORAGE_KEY,
      'true',
    )
  } catch {
    // Сайт продолжит работать без sessionStorage.
  }
}

function shouldForceLogin(): boolean {
  const parameters =
    new URLSearchParams(
      window.location.search,
    )

  return parameters.get('lock') === '1'
}

function getInitials(
  displayName: string,
): string {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0),
    )
    .join('')
    .toLocaleUpperCase('ru-RU')

  return initials || 'ВК'
}

function formatTime(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date)
}

function formatDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    },
  ).format(date)
}

export async function showLoginScreen(
  root: HTMLDivElement,
  config: SystemConfig,
): Promise<void> {
  if (
    readUnlockState() &&
    !shouldForceLogin()
  ) {
    return
  }

  const initials =
    getInitials(
      config.profile.displayName,
    )

  root.innerHTML = `
    <main
      class="
        system-stage
        system-stage--login
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

      <header class="login-heading">
        <div class="login-heading__brand">
          <span
            class="
              login-heading__brand-mark
            "
            aria-hidden="true"
          >
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </span>

          <span>
            Персональный компьютер
          </span>
        </div>

        <div class="login-heading__status">
          <span aria-hidden="true"></span>
          Система готова
        </div>
      </header>

      <div class="login-time-block">
        <strong data-login-time></strong>
        <span data-login-date></span>
      </div>

      <section
        class="login-panel"
        data-login-panel
        aria-label="Вход в компьютер"
      >
        <div class="login-panel__top">
          <div
            class="
              login-panel__security
            "
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="
                  M12 3
                  L19 6
                  V11
                  C19 15.7 16.1 19.2 12 21
                  C7.9 19.2 5 15.7 5 11
                  V6
                  Z
                "
              ></path>

              <path
                d="
                  M9 12
                  L11 14
                  L15.5 9.5
                "
              ></path>
            </svg>

            <span>
              Защищённый профиль
            </span>
          </div>

          <span class="login-panel__device">
            Локальный доступ
          </span>
        </div>

        <div class="login-panel__identity">
          <div
            class="
              login-panel__avatar-shell
            "
          >
            <div
              class="login-panel__avatar"
              aria-hidden="true"
            >
              ${escapeHtml(initials)}
            </div>

            <span
              class="
                login-panel__avatar-status
              "
              title="Профиль доступен"
            ></span>
          </div>

          <h1 class="login-panel__name">
            ${escapeHtml(
              config.profile.displayName,
            )}
          </h1>

          <p class="login-panel__profile-type">
            Личный и рабочий профиль
          </p>
        </div>

        <form
          class="login-form"
          data-login-form
          novalidate
        >
          <label
            class="visually-hidden"
            for="computer-password"
          >
            Пароль
          </label>

          <div class="login-form__field">
            <span
              class="login-form__lock"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                ></rect>

                <path
                  d="
                    M8 10
                    V7.5
                    C8 5.6 9.6 4 12 4
                    C14.4 4 16 5.6 16 7.5
                    V10
                  "
                ></path>

                <path
                  d="
                    M12 14
                    V17
                  "
                ></path>
              </svg>
            </span>

            <input
              id="computer-password"
              class="login-form__input"
              type="password"
              inputmode="numeric"
              autocomplete="off"
              maxlength="${
                config.profile.password.length
              }"
              placeholder="Введите пароль"
              aria-describedby="login-error"
              data-login-input
            />

            <button
              class="
                login-form__visibility
              "
              type="button"
              aria-label="Показать пароль"
              aria-pressed="false"
              data-login-visibility
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="
                    M2.5 12
                    C4.8 7.8 8 6 12 6
                    C16 6 19.2 7.8 21.5 12
                    C19.2 16.2 16 18 12 18
                    C8 18 4.8 16.2 2.5 12
                    Z
                  "
                ></path>

                <circle
                  cx="12"
                  cy="12"
                  r="2.7"
                ></circle>
              </svg>
            </button>

            <button
              class="login-form__submit"
              type="submit"
              aria-label="Войти"
              data-login-submit
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M5 12 H18"></path>
                <path d="M13 7 L18 12 L13 17"></path>
              </svg>
            </button>
          </div>

          <p
            id="login-error"
            class="login-form__error"
            role="alert"
            data-login-error
            hidden
          >
            <strong>
              Неверный пароль
            </strong>

            <span>
              Проверьте введённые данные
              и повторите попытку.
            </span>
          </p>
        </form>

        <div class="login-panel__actions">
          <button
            class="
              login-panel__hint-button
            "
            type="button"
            aria-expanded="false"
            data-login-hint-button
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              ></circle>

              <path
                d="
                  M9.8 9
                  C10.1 7.7 11 7 12.3 7
                  C14 7 15.1 8 15.1 9.5
                  C15.1 11.7 12.3 11.8 12.3 14
                "
              ></path>

              <path d="M12.3 17 H12.31"></path>
            </svg>

            Забыли пароль?
          </button>
        </div>

        <div
          class="login-hint"
          data-login-hint
          hidden
        >
          <div class="login-hint__icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="
                  M8 17
                  H16
                "
              ></path>

              <path
                d="
                  M9 20
                  H15
                "
              ></path>

              <path
                d="
                  M8.8 14.5
                  C7.6 13.5 7 12.1 7 10.5
                  C7 7.5 9.2 5 12 5
                  C14.8 5 17 7.5 17 10.5
                  C17 12.1 16.4 13.5 15.2 14.5
                  C14.5 15.1 14.2 15.5 14.1 17
                  H9.9
                  C9.8 15.5 9.5 15.1 8.8 14.5
                  Z
                "
              ></path>
            </svg>
          </div>

          <div>
            <span class="login-hint__label">
              Подсказка владельца
            </span>

            <p>
              ${escapeHtml(
                config.profile.passwordHint,
              )}
            </p>
          </div>
        </div>
      </section>

      <footer class="login-system-bar">
        <div class="login-system-bar__left">
          <div
            class="
              login-system-bar__connection
            "
          >
            <span
              class="
                login-system-bar__connection-icon
              "
              aria-hidden="true"
            >
              <i></i>
              <i></i>
              <i></i>
            </span>

            <span>
              Сеть подключена
            </span>
          </div>
        </div>

        <div class="login-system-bar__right">
          <button
            class="
              login-system-bar__button
            "
            type="button"
            title="Раскладка клавиатуры"
          >
            РУС
          </button>

          <button
            class="
              login-system-bar__button
            "
            type="button"
            title="Звук"
            aria-label="Звук"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="
                  M5 10
                  H9
                  L14 6
                  V18
                  L9 14
                  H5
                  Z
                "
              ></path>

              <path
                d="
                  M17 9
                  C18 10 18.5 11 18.5 12
                  C18.5 13 18 14 17 15
                "
              ></path>
            </svg>
          </button>

          <button
            class="
              login-system-bar__button
              login-system-bar__button--power
            "
            type="button"
            title="Питание"
            aria-label="Питание"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="
                  M12 3
                  V11
                "
              ></path>

              <path
                d="
                  M7.3 6.7
                  C5.3 8.1 4 10.4 4 13
                  C4 17.4 7.6 21 12 21
                  C16.4 21 20 17.4 20 13
                  C20 10.4 18.7 8.1 16.7 6.7
                "
              ></path>
            </svg>
          </button>
        </div>
      </footer>
    </main>
  `

  const panel =
    root.querySelector<HTMLElement>(
      '[data-login-panel]',
    )

  const form =
    root.querySelector<HTMLFormElement>(
      '[data-login-form]',
    )

  const input =
    root.querySelector<HTMLInputElement>(
      '[data-login-input]',
    )

  const errorElement =
    root.querySelector<HTMLElement>(
      '[data-login-error]',
    )

  const hintButton =
    root.querySelector<HTMLButtonElement>(
      '[data-login-hint-button]',
    )

  const hintElement =
    root.querySelector<HTMLElement>(
      '[data-login-hint]',
    )

  const visibilityButton =
    root.querySelector<HTMLButtonElement>(
      '[data-login-visibility]',
    )

  const submitButton =
    root.querySelector<HTMLButtonElement>(
      '[data-login-submit]',
    )

  const timeElement =
    root.querySelector<HTMLElement>(
      '[data-login-time]',
    )

  const dateElement =
    root.querySelector<HTMLElement>(
      '[data-login-date]',
    )

  if (
    !panel ||
    !form ||
    !input ||
    !errorElement ||
    !hintButton ||
    !hintElement ||
    !visibilityButton ||
    !submitButton ||
    !timeElement ||
    !dateElement
  ) {
    throw new Error(
      'Не удалось создать экран входа.',
    )
  }

  const updateClock = (): void => {
    const now = new Date()

    timeElement.textContent =
      formatTime(now)

    dateElement.textContent =
      formatDate(now)
  }

  updateClock()

  const clockTimerId =
    window.setInterval(
      updateClock,
      1000,
    )

  input.addEventListener(
    'input',
    () => {
      input.value = input.value
        .replace(/\D/g, '')
        .slice(
          0,
          config.profile.password.length,
        )

      errorElement.hidden = true

      input.removeAttribute(
        'aria-invalid',
      )

      panel.classList.remove(
        'login-panel--error',
      )
    },
  )

  visibilityButton.addEventListener(
    'click',
    () => {
      const willShow =
        input.type === 'password'

      input.type =
        willShow
          ? 'text'
          : 'password'

      visibilityButton.setAttribute(
        'aria-pressed',
        String(willShow),
      )

      visibilityButton.setAttribute(
        'aria-label',
        willShow
          ? 'Скрыть пароль'
          : 'Показать пароль',
      )

      input.focus()
    },
  )

  hintButton.addEventListener(
    'click',
    () => {
      const willOpen =
        hintElement.hidden

      hintElement.hidden =
        !willOpen

      hintButton.setAttribute(
        'aria-expanded',
        String(willOpen),
      )
    },
  )

  await new Promise<void>((resolve) => {
    let isSubmitting = false

    form.addEventListener(
      'submit',
      (event) => {
        event.preventDefault()

        if (isSubmitting) {
          return
        }

        if (
          input.value !==
          config.profile.password
        ) {
          errorElement.hidden = false

          input.setAttribute(
            'aria-invalid',
            'true',
          )

          panel.classList.remove(
            'login-panel--error',
          )

          void panel.offsetWidth

          panel.classList.add(
            'login-panel--error',
          )

          input.select()

          return
        }

        isSubmitting = true

        saveUnlockState()

        window.clearInterval(
          clockTimerId,
        )

        input.disabled = true
        visibilityButton.disabled = true
        submitButton.disabled = true

        panel.classList.add(
          'login-panel--unlocking',
        )

        window.setTimeout(
          resolve,
          260,
        )
      },
    )

    window.requestAnimationFrame(
      () => {
        input.focus()
      },
    )
  })
}