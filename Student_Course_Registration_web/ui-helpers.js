'use strict';

Object.assign(SystemController.prototype, {
  /* -------------------- Toast & Confirmation Modal UI -------------------- */

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className =
      'toast-enter pointer-events-auto rounded-2xl shadow-lg border p-4 flex items-start gap-3 text-white transition-all duration-300';

    let bgClass = 'bg-[#10B981] border-emerald-400';
    let iconSvg = `<svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;

    if (type === 'error') {
      bgClass = 'bg-[#EF4444] border-red-400';
      iconSvg = `<svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    } else if (type === 'info') {
      bgClass = 'bg-[#1E3A8A] border-blue-400';
      iconSvg = `<svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }

    toast.classList.add(...bgClass.split(' '));
    toast.innerHTML = `
      ${iconSvg}
      <div class="flex-1 text-xs sm:text-sm font-semibold leading-snug">${this.escapeHtml(message)}</div>
      <button type="button" class="text-white/80 hover:text-white cursor-pointer" aria-label="Close">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;

    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(1rem)';
      setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('button').addEventListener('click', dismiss);
    container.appendChild(toast);
    setTimeout(dismiss, 4800);
  },


  showConfirm({ title, message, confirmLabel = 'Confirm', isDanger = true }) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirm-modal');
      const titleEl = document.getElementById('confirm-title');
      const msgEl = document.getElementById('confirm-message');
      const okBtn = document.getElementById('confirm-ok-btn');
      const cancelBtn = document.getElementById('confirm-cancel-btn');
      const iconWrap = document.getElementById('confirm-icon-wrapper');

      titleEl.textContent = title;
      msgEl.textContent = message;
      okBtn.textContent = confirmLabel;

      if (isDanger) {
        okBtn.className =
          'px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#EF4444] hover:bg-red-600 transition shadow-sm cursor-pointer';
        iconWrap.className =
          'w-11 h-11 rounded-xl bg-red-50 text-[#EF4444] flex items-center justify-center shrink-0';
      } else {
        okBtn.className =
          'px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] transition shadow-sm cursor-pointer';
        iconWrap.className =
          'w-11 h-11 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0';
      }

      modal.classList.remove('hidden');

      const cleanup = (result) => {
        modal.classList.add('hidden');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      };

      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
    });
  },


  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
});
