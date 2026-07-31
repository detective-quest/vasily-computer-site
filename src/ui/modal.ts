import { escapeHtml } from '../core/utilities/html'

export interface ModalOptions {
  title: string
  content: string
  className?: string
}

export function closeModal(
  root: HTMLElement,
): void {
  const dialog =
    root.querySelector<HTMLDialogElement>(
      '[data-app-modal]',
    )

  if (!dialog) {
    return
  }

  if (dialog.open) {
    dialog.close()
    return
  }

  dialog.remove()
}

export function openModal(
  root: HTMLElement,
  options: ModalOptions,
): HTMLDialogElement {
  closeModal(root)

  const dialog =
    document.createElement('dialog')

  dialog.className = [
    'viewer-dialog',
    options.className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  dialog.dataset.appModal = 'true'

  dialog.setAttribute(
    'aria-label',
    options.title,
  )

  dialog.innerHTML = `
    <section class="viewer-window">
      <header class="viewer-window__header">
        <h2 class="viewer-window__title">
          ${escapeHtml(options.title)}
        </h2>

        <button
          class="viewer-window__close"
          type="button"
          data-modal-close
          aria-label="Закрыть окно"
        >
          ×
        </button>
      </header>

      <div class="viewer-window__content">
        ${options.content}
      </div>
    </section>
  `

  dialog.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault()
      dialog.close()
    },
  )

  dialog.addEventListener(
    'close',
    () => {
      dialog.remove()
    },
    {
      once: true,
    },
  )

  dialog.addEventListener(
    'click',
    (event) => {
      if (event.target === dialog) {
        dialog.close()
        return
      }

      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      if (
        target.closest(
          '[data-modal-close]',
        )
      ) {
        dialog.close()
      }
    },
  )

  root.append(dialog)

  dialog.showModal()

  const closeButton =
    dialog.querySelector<HTMLButtonElement>(
      '[data-modal-close]',
    )

  closeButton?.focus()

  return dialog
}