import './styles/variables.css'
import './styles/global.css'
import './styles/boot.css'
import './styles/layout.css'
import './styles/states.css'
import './styles/viewers.css'

import { createApp } from './app/app'
import { showBootScreen } from './ui/boot-screen'

const appElement =
  document.querySelector<HTMLDivElement>(
    '#app',
  )

if (!appElement) {
  throw new Error(
    'Не найден корневой элемент приложения #app.',
  )
}

/*
 * После проверки создаём отдельную константу
 * с точным типом HTMLDivElement.
 *
 * Благодаря этому TypeScript понимает,
 * что значение уже не может быть null.
 */
const appRoot: HTMLDivElement =
  appElement

async function startApplication(
  root: HTMLDivElement,
): Promise<void> {
  await showBootScreen(root)
  await createApp(root)
}

void startApplication(appRoot)