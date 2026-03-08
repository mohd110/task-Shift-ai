/* =====================================================
   js/components/toast.js
   Global toast notification system.
   Usage: Toast.show('Your message here')
   ===================================================== */

const Toast = (() => {
  let _timer = null;

  function show(msg, duration = 3000) {
    const el = document.getElementById('toast');
    if (!el) return;
    clearTimeout(_timer);
    el.textContent = msg;
    el.classList.add('show');
    _timer = setTimeout(() => el.classList.remove('show'), duration);
  }

  return { show };
})();
