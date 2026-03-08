# Task Shit Ai — Voice AI Dashboard

A clean, structured frontend for your VAPI voice agent + n8n automation.
Pulls live data from your Google Sheet automatically.

## Project Structure

```
task-shit-ai/
│
├── index.html                  ← Entry point — open this in your browser
│
├── css/
│   ├── variables.css           ← Design tokens (colors, fonts, spacing)
│   ├── base.css                ← Reset + body defaults + animations
│   ├── auth.css                ← Sign Up, Login, Success screen styles
│   ├── layout.css              ← Sidebar + top navbar shell
│   ├── components.css          ← Cards, tables, badges, tabs, progress bars
│   └── calendar.css            ← Calendar grid + toast + modal
│
├── js/
│   ├── config.js               ← ⚙️ API keys + page titles (edit this)
│   │
│   ├── data/
│   │   └── sheet.js            ← Google Sheets fetch + column mapping
│   │
│   ├── components/
│   │   ├── helpers.js          ← Shared utility functions (dates, badges, etc.)
│   │   ├── toast.js            ← Toast notification system
│   │   └── navigation.js       ← Page routing + sidebar nav binding
│   │
│   ├── pages/
│   │   ├── dashboard.js        ← Dashboard stats + recent calls
│   │   ├── calllogs.js         ← Call logs table + search/filter
│   │   ├── detail.js           ← Single call detail view
│   │   ├── analytics.js        ← Analytics metrics + intent table
│   │   └── calendar.js         ← Calendar grid + upcoming appointments
│   │
│   └── app.js                  ← Entry point — boots the app
│
└── pages/                      ← HTML reference/documentation files
    ├── signup.html             ← Sign Up screen markup reference
    ├── success.html            ← Success screen markup reference
    ├── login.html              ← Login screen markup reference
    ├── dashboard.html          ← Dashboard page markup reference
    ├── calllogs.html           ← Call Logs page markup reference
    ├── detail.html             ← Detail page markup reference
    ├── analytics.html          ← Analytics page markup reference
    ├── calendar.html           ← Calendar page markup reference
    └── settings.html           ← Settings page markup reference
```

## How to run

Just open `index.html` in a browser. No build step needed.

> For full live data, serve via a local server:
> ```
> npx serve .
> # or
> python3 -m http.server 3000
> ```

## Configuration

Edit `js/config.js` to update your Google Sheet connection:

```js
const CONFIG = {
  SHEET_ID : 'your-sheet-id-here',
  API_KEY  : 'your-google-api-key-here',
  TAB_NAME : 'Sheet1',
};
```

## Adding a new page

1. Create `pages/yourpage.html` with the markup
2. Create `js/pages/yourpage.js` with a `YourPage = { render() {} }` object
3. Add a `<div class="page-content" id="page-yourpage">` in `index.html`
4. Add a nav link `<div class="nav-link" data-page="yourpage">` in the sidebar
5. Add `'yourpage': 'Page Title'` to `CONFIG.PAGE_TITLES` in `js/config.js`
6. Call `YourPage.render()` inside `App.renderAll()` in `js/app.js`
7. Add `<script src="js/pages/yourpage.js"></script>` in `index.html`
