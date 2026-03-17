/* =====================================================
   js/components/navigation.js
   Handles all page switching inside the app shell
   and screen switching between auth/app screens.
   ===================================================== */

const Nav = (() => {

  /* ── Switch between app pages (dashboard, calls, etc.) ── */
  function switchPage(name) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));

    document.getElementById('page-' + name)?.classList.add('active');
    document.querySelector(`[data-page="${name}"]`)?.classList.add('active');

    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = CONFIG.PAGE_TITLES[name] || '';

    // Re-render calendar grid when visiting that page
    if (name === 'calendar') Cal.render();
  }

  /* ── Switch between top-level screens (auth → app) ── */
  function goTo(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    if (id === 'screen-app' && typeof App !== 'undefined') {
      App.init();
    }
  }

  /* ── Bind sidebar nav links ── */
  function init() {
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
      link.addEventListener('click', () => switchPage(link.dataset.page));
    });

    // Bind tab groups
    document.querySelectorAll('.tabs').forEach(group => {
      group.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
          group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        });
      });
    });

    // Bind hamburger menu for mobile
    const hamburger = document.getElementById('hamburger-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (hamburger && sidebar && overlay) {
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      });

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });

      // Close sidebar when clicking a nav link on mobile
      document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
          }
        });
      });
    }
  }

  return { init, switchPage, goTo };
})();

/* goTo() and switchPage() are declared early in index.html <head>
   so inline onclick handlers work before scripts load.
   Here we upgrade them to use Nav once it is ready. */
window.goTo = function (id) { Nav.goTo(id); }
window.switchPage = function (name) { Nav.switchPage(name); }
