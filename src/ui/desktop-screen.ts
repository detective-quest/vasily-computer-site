import type {
  SystemConfig,
  SystemDesktopIcon,
} from '../core/types/system'

import {
  escapeHtml,
} from '../core/utilities/html'

const LOGIN_STORAGE_KEY =
  'vasily-computer:unlocked:v1'

let noticeTimerId:
  number | null = null

function formatClockTime(
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

function formatClockDate(
  date: Date,
): string {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(date)
}

function getDesktopIconClass(
  icon: SystemDesktopIcon,
): string {
  if (icon.targetId === 'mail') {
    return 'mail'
  }

  if (icon.targetId === 'trash') {
    return 'trash'
  }

  if (icon.type === 'folder') {
    return 'folder'
  }

  return 'application'
}

function getDesktopIconMarkup(
  icon: SystemDesktopIcon,
): string {
  const iconClass =
    getDesktopIconClass(icon)

  if (iconClass === 'mail') {
    return `
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path
          d="
            M10 17
            H54
            V47
            H10
            Z
          "
        ></path>

        <path
          d="
            M11 19
            L32 35
            L53 19
          "
        ></path>

        <path
          d="
            M11 45
            L25 32
          "
        ></path>

        <path
          d="
            M53 45
            L39 32
          "
        ></path>
      </svg>
    `
  }

  if (iconClass === 'trash') {
    return `
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path
          d="
            M19 20
            H45
            L42 51
            H22
            Z
          "
        ></path>

        <path
          d="
            M16 16
            H48
          "
        ></path>

        <path
          d="
            M26 16
            L28 11
            H36
            L38 16
          "
        ></path>

        <path d="M28 27 V44"></path>
        <path d="M36 27 V44"></path>
      </svg>
    `
  }

  if (iconClass === 'folder') {
    return `
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <path
          d="
            M8 18
            H27
            L32 23
            H56
            V49
            H8
            Z
          "
        ></path>

        <path
          d="
            M8 22
            H56
          "
        ></path>
      </svg>
    `
  }

  return `
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <rect
        x="12"
        y="12"
        width="40"
        height="40"
        rx="8"
      ></rect>

      <path d="M24 24 H40"></path>
      <path d="M24 32 H40"></path>
      <path d="M24 40 H35"></path>
    </svg>
  `
}

function renderDesktopIcon(
  icon: SystemDesktopIcon,
): string {
  const iconClass =
    getDesktopIconClass(icon)

  return `
    <button
      class="desktop-icon"
      type="button"
      data-desktop-icon
      data-target-id="${escapeHtml(
        icon.targetId,
      )}"
      data-target-label="${escapeHtml(
        icon.label,
      )}"
      aria-label="Открыть ${escapeHtml(
        icon.label,
      )}"
    >
      <span
        class="
          desktop-icon__image
          desktop-icon__image--${iconClass}
        "
      >
        ${getDesktopIconMarkup(icon)}
      </span>

      <span class="desktop-icon__label">
        ${escapeHtml(icon.label)}
      </span>
    </button>
  `
}

function renderMenuItem(
  icon: SystemDesktopIcon,
): string {
  const iconClass =
    getDesktopIconClass(icon)

  return `
    <button
      class="system-menu__item"
      type="button"
      data-menu-open
      data-target-id="${escapeHtml(
        icon.targetId,
      )}"
      data-target-label="${escapeHtml(
        icon.label,
      )}"
    >
      <span
        class="
          system-menu__item-icon
          system-menu__item-icon--${iconClass}
        "
        aria-hidden="true"
      >
        ${getDesktopIconMarkup(icon)}
      </span>

      <span>
        ${escapeHtml(icon.label)}
      </span>
    </button>
  `
}

function createProfileInitials(
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

function lockComputer(): void {
  try {
    window.sessionStorage.removeItem(
      LOGIN_STORAGE_KEY,
    )
  } catch {
    // Перезагрузка всё равно откроет экран входа.
  }

  const url =
    new URL(window.location.href)

  url.searchParams.delete('boot')
  url.searchParams.set('lock', '1')

  window.location.assign(
    `${url.pathname}${url.search}${url.hash}`,
  )
}

export function showDesktopScreen(
  root: HTMLDivElement,
  config: SystemConfig,
): void {
  const desktopIcons =
    config.desktop.icons

  const initials =
    createProfileInitials(
      config.profile.displayName,
    )

  root.innerHTML = `
    <main
      class="desktop-shell"
      data-desktop-shell
    >
      <div
        class="desktop-wallpaper"
        aria-hidden="true"
      >
        <div
          class="
            desktop-wallpaper__geometry
          "
        ></div>

        <div
          class="
            desktop-wallpaper__grain
          "
        ></div>

        <div
          class="
            desktop-wallpaper__vignette
          "
        ></div>
      </div>

      <section
        class="desktop-workspace"
        aria-label="Рабочий стол"
      >
        <div class="desktop-icons">
          ${desktopIcons
            .map(renderDesktopIcon)
            .join('')}
        </div>
      </section>

      <aside
        class="system-menu"
        data-system-menu
        hidden
      >
        <header class="system-menu__profile">
          <div
            class="system-menu__avatar"
            aria-hidden="true"
          >
            ${escapeHtml(initials)}
          </div>

          <div>
            <strong>
              ${escapeHtml(
                config.profile.displayName,
              )}
            </strong>

            <span>
              Личный профиль
            </span>
          </div>
        </header>

        <div class="system-menu__applications">
          ${desktopIcons
            .map(renderMenuItem)
            .join('')}
        </div>

        <footer class="system-menu__footer">
          <button
            class="system-menu__lock"
            type="button"
            data-lock-computer
          >
            <span aria-hidden="true">
              ◉
            </span>

            Заблокировать
          </button>
        </footer>
      </aside>

      <div
        class="desktop-notice"
        role="status"
        aria-live="polite"
        data-desktop-notice
        hidden
      ></div>

      <footer class="taskbar">
        <div class="taskbar__left">
          <button
            class="taskbar__system-button"
            type="button"
            aria-label="Главное меню"
            aria-expanded="false"
            data-system-menu-button
          >
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div class="taskbar__divider"></div>

          <button
            class="taskbar__application"
            type="button"
            data-taskbar-open
            data-target-id="documents"
            data-target-label="Файловый менеджер"
            aria-label="Файловый менеджер"
          >
            <svg
              viewBox="0 0 64 64"
              aria-hidden="true"
            >
              <path
                d="
                  M8 18
                  H27
                  L32 23
                  H56
                  V49
                  H8
                  Z
                "
              ></path>

              <path d="M8 22 H56"></path>
            </svg>
          </button>

          <button
            class="taskbar__application"
            type="button"
            data-taskbar-open
            data-target-id="mail"
            data-target-label="Почта"
            aria-label="Почта"
          >
            <svg
              viewBox="0 0 64 64"
              aria-hidden="true"
            >
              <path
                d="
                  M10 17
                  H54
                  V47
                  H10
                  Z
                "
              ></path>

              <path
                d="
                  M11 19
                  L32 35
                  L53 19
                "
              ></path>
            </svg>
          </button>
        </div>

        <div class="taskbar__right">
          <div
            class="taskbar__network"
            title="Сеть подключена"
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div
            class="taskbar__volume"
            title="Звук"
          >
            <span aria-hidden="true">
              ◖
            </span>
          </div>

          <div class="taskbar__clock">
            <strong
              data-desktop-time
            ></strong>

            <span
              data-desktop-date
            ></span>
          </div>
        </div>
      </footer>
    </main>
  `

  const iconButtons =
    Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        '[data-desktop-icon]',
      ),
    )

  const openButtons =
    Array.from(
      root.querySelectorAll<HTMLButtonElement>(
        `
          [data-menu-open],
          [data-taskbar-open]
        `,
      ),
    )

  const menu =
    root.querySelector<HTMLElement>(
      '[data-system-menu]',
    )

  const menuButton =
    root.querySelector<HTMLButtonElement>(
      '[data-system-menu-button]',
    )

  const lockButton =
    root.querySelector<HTMLButtonElement>(
      '[data-lock-computer]',
    )

  const notice =
    root.querySelector<HTMLElement>(
      '[data-desktop-notice]',
    )

  const timeElement =
    root.querySelector<HTMLElement>(
      '[data-desktop-time]',
    )

  const dateElement =
    root.querySelector<HTMLElement>(
      '[data-desktop-date]',
    )

  if (
    !menu ||
    !menuButton ||
    !lockButton ||
    !notice ||
    !timeElement ||
    !dateElement
  ) {
    throw new Error(
      'Не удалось создать рабочий стол.',
    )
  }

  const closeMenu = (): void => {
    menu.hidden = true

    menuButton.setAttribute(
      'aria-expanded',
      'false',
    )
  }

  const selectDesktopIcon = (
    selectedButton:
      HTMLButtonElement | null,
  ): void => {
    iconButtons.forEach((button) => {
      const isSelected =
        button === selectedButton

      button.classList.toggle(
        'desktop-icon--selected',
        isSelected,
      )

      button.setAttribute(
        'aria-pressed',
        String(isSelected),
      )
    })
  }

  const showTemporaryNotice = (
    label: string,
  ): void => {
    if (noticeTimerId !== null) {
      window.clearTimeout(
        noticeTimerId,
      )
    }

    notice.textContent =
      `${label}: окно будет подключено на следующем этапе.`

    notice.hidden = false

    noticeTimerId =
      window.setTimeout(
        () => {
          notice.hidden = true
          noticeTimerId = null
        },
        2600,
      )
  }

  const openTarget = (
    button: HTMLButtonElement,
  ): void => {
    const label =
      button.dataset.targetLabel ??
      'Приложение'

    showTemporaryNotice(label)
    closeMenu()
  }

  iconButtons.forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        selectDesktopIcon(button)
      },
    )

    button.addEventListener(
      'dblclick',
      () => {
        openTarget(button)
      },
    )

    button.addEventListener(
      'keydown',
      (event) => {
        if (
          event.key !== 'Enter' &&
          event.key !== ' '
        ) {
          return
        }

        event.preventDefault()
        openTarget(button)
      },
    )
  })

  openButtons.forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        openTarget(button)
      },
    )
  })

  menuButton.addEventListener(
    'click',
    () => {
      const willOpen =
        menu.hidden

      menu.hidden =
        !willOpen

      menuButton.setAttribute(
        'aria-expanded',
        String(willOpen),
      )
    },
  )

  lockButton.addEventListener(
    'click',
    lockComputer,
  )

  root.addEventListener(
    'click',
    (event) => {
      const target =
        event.target

      if (!(target instanceof Element)) {
        return
      }

      if (
        !target.closest(
          '[data-desktop-icon]',
        )
      ) {
        selectDesktopIcon(null)
      }

      if (
        menu.hidden ||
        target.closest(
          '[data-system-menu]',
        ) ||
        target.closest(
          '[data-system-menu-button]',
        )
      ) {
        return
      }

      closeMenu()
    },
  )

  const updateClock = (): void => {
    const now = new Date()

    timeElement.textContent =
      formatClockTime(now)

    dateElement.textContent =
      formatClockDate(now)
  }

  updateClock()

  window.setInterval(
    updateClock,
    1000,
  )
}