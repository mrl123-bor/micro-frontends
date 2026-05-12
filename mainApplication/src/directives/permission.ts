import { watch } from 'vue'
import type { Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/stores/permission'

function codesFrom(binding: DirectiveBinding): string[] {
  const v = binding.value
  if (v == null || v === false) return []
  if (Array.isArray(v)) return v.map(String).filter(Boolean)
  return [String(v)]
}

function check(
  binding: DirectiveBinding,
  store: ReturnType<typeof usePermissionStore>,
): boolean {
  const codes = codesFrom(binding)
  if (!codes.length) return true
  if (binding.modifiers.all) return store.hasAllPerms(codes)
  return store.hasAnyPerm(codes)
}

const cleanups = new WeakMap<HTMLElement, () => void>()

function setDisabled(el: HTMLElement, off: boolean) {
  const btn = el.matches('button') ? el : el.querySelector('button')
  if (btn instanceof HTMLButtonElement) {
    btn.disabled = off
    return
  }
  el.toggleAttribute('disabled', off)
  el.classList.toggle('perm-disabled', off)
  el.setAttribute('aria-disabled', off ? 'true' : 'false')
  el.style.pointerEvents = off ? 'none' : ''
  el.style.opacity = off ? '0.5' : ''
}

function apply(
  el: HTMLElement,
  binding: DirectiveBinding,
  store: ReturnType<typeof usePermissionStore>,
) {
  const ok = check(binding, store)
  if (binding.modifiers.disable) {
    setDisabled(el, !ok)
    el.style.removeProperty('display')
    return
  }
  el.style.display = ok ? '' : 'none'
  setDisabled(el, false)
  el.classList.remove('perm-disabled')
  el.removeAttribute('aria-disabled')
  el.style.pointerEvents = ''
  el.style.opacity = ''
}

export const vPermission: Directive<HTMLElement, string | string[] | undefined> = {
  mounted(el, binding) {
    const store = usePermissionStore()
    const run = () => apply(el, binding, store)
    run()
    const stop = watch(
      () =>
        `${store.source}\0${store.roles.join('\0')}\0${store.perms.join('\0')}`,
      run,
      { flush: 'post' },
    )
    cleanups.set(el, stop)
  },
  updated(el, binding) {
    apply(el, binding, usePermissionStore())
  },
  unmounted(el) {
    cleanups.get(el)?.()
    cleanups.delete(el)
  },
}
