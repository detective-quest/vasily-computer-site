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
    /*
     * Сайт продолжит работать,
     * даже если sessionStorage недоступен.
     */
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
        part[0] ?? '',
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
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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

  const initials = getInitials(
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
        class="login-noise"
        aria-hidden="true"
      ></div>

      <section
        class="login-screen"
        aria-label="Вход в компьютер"
      >
        <div
          class="login-screen__avatar"
          aria-hidden="true"
        >
          ${escapeHtml(initials)}
        </div>

        <h1 class="login-screen__name">
          ${escapeHtml(
            config.profile.displayName,
          )}
        </h1>

        <p class="login-screen__device">
          Личный профиль
        </p>

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
            <input
              id="computer-password"
              class="login-form__input"
              type="password"
              inputmode="numeric"
              autocomplete="off"
              maxlength="8"
              placeholder="Пароль"
              aria-describedby="login-error"
              data-login-input
            />

            <button
              class="login-form__submit"
              type="submit"
              aria-label="Войти"
            >
              <span aria-hidden="true">
                →
              </span>
            </button>
          </div>

          <p
            id="login-error"
            class="login-form__error"
            role="alert"
            data-login-error
            hidden
          >
            Неверный пароль.
            Проверьте введённые данные
            и повторите попытку.
          </p>
        </form>

        <button
          class="
            login-screen__hint-button
          "
          type="button"
          aria-expanded="false"
          data-login-hint-button
        >
          Забыли пароль?
        </button>

        <div
          class="login-hint"
          data-login-hint
          hidden
        >
          <span class="login-hint__label">
            Подсказка
          </span>

          <p>
            ${escapeHtml(
              config.profile.passwordHint,
            )}
          </p>
        </div>
      </section>

      <footer class="login-status">
        <div
          class="
            login-status__connection
          "
        >
          <span aria-hidden="true"></span>

          Сеть подключена
        </div>

        <div class="login-status__clock">
          <strong
            data-login-time
          ></strong>

          <span
            data-login-date
          ></span>
        </div>
      </footer>
    </main>
  `

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

  const timeElement =
    root.querySelector<HTMLElement>(
      '[data-login-time]',
    )

  const dateElement =
    root.querySelector<HTMLElement>(
      '[data-login-date]',
    )

  if (
    !form ||
    !input ||
    !errorElement ||
    !hintButton ||
    !hintElement ||
    !timeElement ||
    !dateElement
  ) {
    return
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
    form.addEventListener(
      'submit',
      (event) => {
        event.preventDefault()

        if (
          input.value !==
          config.profile.password
        ) {
          errorElement.hidden = false

          input.setAttribute(
            'aria-invalid',
            'true',
          )

          input.select()

          return
        }

        saveUnlockState()

        window.clearInterval(
          clockTimerId,
        )

        resolve()
      },
    )

    window.requestAnimationFrame(
      () => {
        input.focus()
      },
    )
  })
}