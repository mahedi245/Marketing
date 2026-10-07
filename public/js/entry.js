// Mobile Quick Visit Entry Logic - DTC Marketing
let selectedStatus = 'Interested';

async function initEntryForm() {
  const form = document.getElementById('visitEntryForm');
  const officerSelect = document.getElementById('entryOfficer');
  const dateInput = document.getElementById('entryDate');
  const statusChips = document.querySelectorAll('.status-chip');
  const resetBtn = document.getElementById('entryResetBtn');

  // Set default date to today
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Load team members
  const currentOfficer = api.getCurrentOfficer();
  await loadTeamDropdown(officerSelect, currentOfficer?.id);

  // Status chip selection (Red & Black aesthetic)
  statusChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      statusChips.forEach((c) => {
        c.classList.remove('ring-2', 'ring-primary-600', 'ring-offset-2', 'ring-offset-zinc-900', 'font-bold', 'scale-105');
      });
      chip.classList.add('ring-2', 'ring-primary-600', 'ring-offset-2', 'ring-offset-zinc-900', 'font-bold', 'scale-105');
      selectedStatus = chip.getAttribute('data-status');
    });
  });

  // Select initial default status chip
  const defaultChip = document.querySelector(`.status-chip[data-status="${selectedStatus}"]`);
  if (defaultChip) {
    defaultChip.classList.add('ring-2', 'ring-primary-600', 'ring-offset-2', 'ring-offset-zinc-900', 'font-bold', 'scale-105');
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const memberId = officerSelect.value;
      const customerName = document.getElementById('entryCustomer').value.trim();
      const siteName = document.getElementById('entrySite').value.trim();
      const address = document.getElementById('entryAddress').value.trim();
      const phoneNumber = document.getElementById('entryPhone').value.trim();
      const visitDate = dateInput.value;
      const notes = document.getElementById('entryNotes').value.trim();
      const nextFollowUp = document.getElementById('entryFollowUp').value;

      if (!memberId) {
        alert(t('officer_placeholder'));
        officerSelect.focus();
        return;
      }
      if (!customerName) {
        alert(t('customer_placeholder'));
        document.getElementById('entryCustomer').focus();
        return;
      }
      if (!siteName) {
        alert(t('site_placeholder'));
        document.getElementById('entrySite').focus();
        return;
      }
      if (!address) {
        alert(t('address_placeholder'));
        document.getElementById('entryAddress').focus();
        return;
      }
      if (!phoneNumber) {
        alert(t('phone_placeholder'));
        document.getElementById('entryPhone').focus();
        return;
      }

      const submitBtn = document.getElementById('entrySubmitBtn');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        ${t('btn_saving')}
      `;

      try {
        const payload = {
          member_id: Number(memberId),
          customer_name: customerName,
          site_name: siteName,
          address: address,
          phone_number: phoneNumber,
          visit_date: visitDate,
          status: selectedStatus,
          notes: notes,
          next_follow_up_date: nextFollowUp || null
        };

        const result = await api.createVisit(payload);

        if (result.success) {
          // Remember last chosen officer for speed
          localStorage.setItem('last_officer_id', memberId);

          showToast(t('success_toast'));

          // Reset inputs except officer and date
          document.getElementById('entryCustomer').value = '';
          document.getElementById('entrySite').value = '';
          document.getElementById('entryAddress').value = '';
          document.getElementById('entryPhone').value = '';
          document.getElementById('entryNotes').value = '';
          document.getElementById('entryFollowUp').value = '';

          // Reset status to Interested
          selectedStatus = 'Interested';
          statusChips.forEach((c) => {
            c.classList.remove('ring-2', 'ring-primary-600', 'ring-offset-2', 'ring-offset-zinc-900', 'font-bold', 'scale-105');
          });
          const initialChip = document.querySelector(`.status-chip[data-status="Interested"]`);
          if (initialChip) {
            initialChip.classList.add('ring-2', 'ring-primary-600', 'ring-offset-2', 'ring-offset-zinc-900', 'font-bold', 'scale-105');
          }

          document.getElementById('entryCustomer').focus();

          // Refresh My Visits if user switches there
          if (window.fetchAndRenderMyVisits) {
            window.fetchAndRenderMyVisits();
          }
        } else {
          alert('Error: ' + (result.error || 'Could not save visit'));
        }
      } catch (err) {
        console.error('Error submitting visit:', err);
        alert('Network error. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Reset form button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('entryCustomer').value = '';
      document.getElementById('entrySite').value = '';
      document.getElementById('entryAddress').value = '';
      document.getElementById('entryPhone').value = '';
      document.getElementById('entryNotes').value = '';
      document.getElementById('entryFollowUp').value = '';
    });
  }
}

async function loadTeamDropdown(selectEl, selectedId = null) {
  if (!selectEl) return;
  try {
    const res = await api.getTeam();
    if (res.success) {
      selectEl.innerHTML = `<option value="">${t('officer_placeholder')}</option>`;
      const lastId = selectedId || localStorage.getItem('dtc_officer_id') || localStorage.getItem('last_officer_id');

      res.data.forEach((m) => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = `${m.name} (${m.role || 'Officer'})`;
        if (lastId && String(m.id) === String(lastId)) {
          option.selected = true;
        }
        selectEl.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error loading team dropdown:', err);
  }
}

function showToast(message) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'fixed bottom-5 right-5 z-50 flex items-center bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800/60 theme-glow-sm transition-all duration-300 transform translate-y-16 opacity-0';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-slate-900 border border-primary-700 text-primary-400 flex items-center justify-center mr-3 shrink-0">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
    <span class="font-bold text-sm text-zinc-100">${message}</span>
  `;

  toast.classList.remove('translate-y-16', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-16', 'opacity-0');
  }, 3500);
}

window.initEntryForm = initEntryForm;
window.loadTeamDropdown = loadTeamDropdown;
window.showToast = showToast;
