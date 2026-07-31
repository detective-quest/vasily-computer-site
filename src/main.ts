import './styles/variables.css'
import './styles/global.css'
import './styles/boot.css'
import './styles/layout.css'
import './styles/states.css'
import './styles/viewers.css'

import {
  createApp,
} from './app/app'

import {
  loadSystemConfig,
} from './cases/system-loader'

import {
  escapeHtml,
} from './core/utilities/html'

import {
  showBootScreen,
} from './ui/boot-screen'

import {
  showLoginScreen,
} from './ui/login-screen'

const appElement =
  document.querySelector<HTMLDivElement>(
    '#app',
  )

if (!appElement) {
  throw new Error(
    'Не найден корневой элемент приложения #app.',
  )
}

const appRoot: HTMLDivElement =
  appElement

function renderStartupError(
  root: HTMLDivElement,
  error: unknown,
): void {
  const message =
    error instanceof Error
      ? error.message
      : 'Неизвестная ошибка.'

  root.innerHTML = `
    <main
      class="
        system-stage
        system-stage--error
      "
    >
      <section
        class="startup-error"
        role="alert"
      >
        <h1>
          Не удалось запустить компьютер
        </h1>

        <p>
          ${escapeHtml(message)}
        </p>

        <p>
          Проверьте файлы конфигурации
          и обновите страницу.
        </p>
      </section>
    </main>
  `
}

async function startApplication(
  root: HTMLDivElement,
): Promise<void> {
  try {
    const systemConfig =
      await loadSystemConfig()

    await showBootScreen(
      root,
      systemConfig,
    )

    await showLoginScreen(
      root,
      systemConfig,
    )

    await createApp(root)
  } catch (error: unknown) {
    renderStartupError(
      root,
      error,
    )
  }
}

void startApplication(appRoot)