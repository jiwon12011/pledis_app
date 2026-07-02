// 공용 토스트
let host: HTMLElement | null = null;

export function toast(message: string, ms = 2400) {
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    host.setAttribute('role', 'status');
    document.body.appendChild(host);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = message;
  host.appendChild(t);
  while (host.children.length > 3) host.firstElementChild!.remove();
  window.setTimeout(() => {
    t.classList.add('out');
    window.setTimeout(() => t.remove(), 350);
  }, ms);
}
