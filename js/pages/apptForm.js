/* =====================================================
   js/pages/apptForm.js
   Handles the "Add Appointment" Modal UI and sending
   data back to Google Sheets.
   ===================================================== */

const ApptForm = (() => {
  let modalEl;
  let formEl;
  let submitBtn;

  // Initialize Elements
  function init() {
    modalEl = document.getElementById('modal-add-appt');
    formEl = document.getElementById('form-add-appt');
    submitBtn = document.getElementById('btn-save-appt');
  }

  // Open the Modal
  function open() {
    if(!modalEl) init();
    if(modalEl) {
       modalEl.classList.add('open');
       // Pre-fill date to today if empty
       const dateEl = document.getElementById('appt-date');
       if(dateEl && !dateEl.value) {
          dateEl.valueAsDate = new Date();
       }
    }
  }

  // Close the Modal
  function close() {
    if(modalEl) {
       modalEl.classList.remove('open');
       if(formEl) formEl.reset();
    }
  }

  // Submit Handler
  async function submit(e) {
    e.preventDefault();
    if(!formEl || !submitBtn) return;
    
    // 1. Gather Data
    const name = document.getElementById('appt-name').value.trim();
    const phone = document.getElementById('appt-phone').value.trim();
    const email = document.getElementById('appt-email').value.trim();
    const purpose = document.getElementById('appt-purpose').value.trim();
    const date = document.getElementById('appt-date').value;
    const time = document.getElementById('appt-time').value;

    const formattedTime = new Date(`${date}T${time}`).toISOString(); // ISO Format for sheet consistency
    const now = new Date().toISOString();

    // The data object mirroring Google Sheet Columns
    const newRecord = {
      'Name': name,
      'Number': phone,
      'Email': email,
      'Purpose of call': purpose,
      'Booked': 'Yes', // Inherently a booking
      'Time': formattedTime,
      'Key Notes': 'Manually Added via Dashboard.',
      'Call Started': now,
      'Call ended': now,
      'Transcript': ''
    };

    try {
      // 2. Lock UI
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;

      // 3. Post to Google Apps Script Web App (If configured)
      if (CONFIG.WEB_APP_URL) {
         // Because we are calling cross-origin to a Google Script, simple no-cors is best to avoid CORS preflight failures on client-side requests
         await fetch(CONFIG.WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRecord)
         });
         // no-cors returns opaque response, so we assume success if no JS exception
      } else {
         console.warn("No WEB_APP_URL configured in config.js. Saving locally only.");
      }

      // 4. Update Local Memory & UI Instantly
      Sheet.rows.push(newRecord);
      App.renderAll(); // Auto-refreshes Calendar, Dashboard, etc.
      
      Toast.show('✓ Appointment saved successfully!');
      close();

    } catch (err) {
       console.error("Error saving appointment:", err);
       Toast.show('⚠ Error saving appointment. Check console.');
    } finally {
       submitBtn.textContent = 'Save Appointment';
       submitBtn.disabled = false;
    }
  }

  return { open, close, submit };
})();
