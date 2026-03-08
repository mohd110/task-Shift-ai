/* =====================================================
   js/config.js
   Central configuration for the Task Shit Ai app.
   Update SHEET_ID and API_KEY here — nowhere else.
   ===================================================== */

const CONFIG = {

  /* ── Google Sheets connection ── */
  SHEET_ID : '1H9C81_RQ9HXvTuHH1bLVYxkIXR8yL3QJ-56NoZYUu5s',
  API_KEY  : 'AIzaSyCkXCIehSGvkXDAX6pryfkh_vcodX8PIpU',
  TAB_NAME : 'Sheet1',   // Exact tab name at the bottom of your sheet
  WEB_APP_URL: '',      // App Script URL for saving new appointments

  /* ── App navigation page titles ── */
  PAGE_TITLES: {
    dashboard : 'Dashboard Overview',
    analytics : 'Analytics',
    calllogs  : 'Call Logs',
    detail    : 'Call Detail',
    calendar  : 'Calendar',
    settings  : 'Settings',
  },

};
