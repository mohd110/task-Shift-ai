/* =====================================================
   js/app.js
   Application entry point.

   LOAD ORDER (in index.html):
   1. css/variables.css
   2. css/base.css
   3. css/auth.css
   4. css/layout.css
   5. css/components.css
   6. css/calendar.css
   7. js/config.js
   8. js/components/toast.js
   9. js/components/helpers.js
   10. js/data/sheet.js
   11. js/pages/dashboard.js
   12. js/pages/calllogs.js
   13. js/pages/detail.js
   14. js/pages/analytics.js
   15. js/pages/calendar.js
   16. js/components/navigation.js
   17. js/app.js  ← this file (last)
   ===================================================== */

const App = {

  /* Called once when user enters the app shell */
  init() {
    Nav.init();
    Cal.render();
    Sheet.load();   // Fetches sheet data → triggers renderAll()
  },

  /* Called after every sheet load/refresh — updates all pages */
  renderAll() {
    Dashboard.render();
    CallLogs.render();
    Analytics.render();
    Cal.render();
    Cal.renderUpcoming();
  },

};
