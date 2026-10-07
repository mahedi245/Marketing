// Main Application Bootstrap & Tab Navigation - DTC Marketing

let currentTab = 'entry';

function switchTab(tabName) {
  const entryView = document.getElementById('viewEntry');
  const myVisitsView = document.getElementById('viewMyVisits');
  const dashboardView = document.getElementById('viewDashboard');

  const navBtnEntry = document.getElementById('navBtnEntry');
  const navBtnMyVisits = document.getElementById('navBtnMyVisits');
  const navBtnDashboard = document.getElementById('navBtnDashboard');

  // AUTHENTICATION CHECKS
  if (tabName === 'myVisits' && !api.getCurrentOfficer()) {
    document.getElementById('officerLoginModal').classList.remove('hidden');
    // Preload officers in modal dropdown
    loadTeamDropdown(document.getElementById('modalOfficerSelect'));
    return;
  }

  if (tabName === 'dashboard' && !api.isAdmin()) {
    document.getElementById('adminLoginModal').classList.remove('hidden');
    return;
  }

  currentTab = tabName;
  window.location.hash = tabName;

  // RESET VIEWS
  entryView.classList.add('hidden');
  myVisitsView.classList.add('hidden');
  dashboardView.classList.add('hidden');

  // RESET BUTTONS
  [navBtnEntry, navBtnMyVisits, navBtnDashboard].forEach(btn => {
    btn.classList.remove('bg-primary-600', 'text-white');
    btn.classList.add('text-zinc-300', 'hover:text-white');
  });

  // ACTIVATE SELECTED
  if (tabName === 'entry') {
    entryView.classList.remove('hidden');
    navBtnEntry.classList.add('bg-primary-600', 'text-white');
    navBtnEntry.classList.remove('text-zinc-300');
  }
  else if (tabName === 'myVisits') {
    myVisitsView.classList.remove('hidden');
    navBtnMyVisits.classList.add('bg-primary-600', 'text-white');
    navBtnMyVisits.classList.remove('text-zinc-300');
    if (window.fetchAndRenderMyVisits) fetchAndRenderMyVisits();
  }
  else if (tabName === 'dashboard') {
    dashboardView.classList.remove('hidden');
    navBtnDashboard.classList.add('bg-primary-600', 'text-white');
    navBtnDashboard.classList.remove('text-zinc-300');
    if (window.refreshDashboard) refreshDashboard();
  }
}

// Update User UI (Current Officer, Admin Badge, Entry Default Match)
function updateUserUI() {
  const currentOfficer = api.getCurrentOfficer();
  const isAdmin = api.isAdmin();

  const label = document.getElementById('currentOfficerLabel');
  const roleBadge = document.getElementById('roleBadge');
  const lockIcon = document.getElementById('dashboardLockIcon');

  if (isAdmin) {
    roleBadge.classList.remove('hidden');
    if (lockIcon) {
      lockIcon.classList.remove('text-primary-500');
      lockIcon.classList.add('text-emerald-500'); // Unlocked state color
    }
  } else {
    roleBadge.classList.add('hidden');
    if (lockIcon) {
      lockIcon.classList.remove('text-emerald-500');
      lockIcon.classList.add('text-primary-500');
    }
  }

  if (currentOfficer) {
    label.textContent = currentOfficer.name;
    // Auto sync entry dropdown to logged in officer
    const opt = document.getElementById('entryOfficer');
    if (opt && opt.value !== String(currentOfficer.id)) {
       opt.value = currentOfficer.id;
    }
  } else {
    label.textContent = t('nav_officer_btn');
  }
}

// Header Actions
document.getElementById('btnSwitchUser').addEventListener('click', () => {
    document.getElementById('officerLoginModal').classList.remove('hidden');
    loadTeamDropdown(document.getElementById('modalOfficerSelect'));
});

// Admin Login Logic
document.getElementById('adminPinForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pin = document.getElementById('adminPinInput').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await api.loginAdmin(pin);
    if (res.success) {
      closeAdminModal();
      document.getElementById('adminPinInput').value = '';
      showToast('Admin Access Granted');
      updateUserUI();
      switchTab('dashboard');
    } else {
      alert(res.error || 'Incorrect Admin PIN');
    }
  } finally {
    submitBtn.disabled = false;
  }
});

// Officer Login Logic
document.getElementById('officerPinForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const memberId = document.getElementById('modalOfficerSelect').value;
  const pin = document.getElementById('modalOfficerPin').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  if (!memberId) {
    alert('Please select an officer');
    submitBtn.disabled = false;
    return;
  }

  try {
    const res = await api.loginOfficer(memberId, pin);
    if (res.success) {
      closeOfficerModal();
      document.getElementById('modalOfficerPin').value = '';
      showToast(`Welcome back, ${res.officer.name}`);

      updateUserUI();
      // Auto-update the entry dropdown
      const entrySelect = document.getElementById('entryOfficer');
      if (entrySelect) entrySelect.value = res.officer.id;

      if (currentTab === 'dashboard' && !api.isAdmin()) {
        switchTab('myVisits');
      } else if (currentTab === 'myVisits') {
        switchTab('myVisits');
      }
    } else {
      alert(res.error || 'Incorrect PIN');
    }
  } finally {
    submitBtn.disabled = false;
  }
});

// Close Modals
function closeAdminModal() { document.getElementById('adminLoginModal').classList.add('hidden'); }
function openAdminModal() { document.getElementById('adminLoginModal').classList.remove('hidden'); }
function closeOfficerModal() { document.getElementById('officerLoginModal').classList.add('hidden'); }

// Change Admin PIN
function openChangeAdminPinModal() { document.getElementById('changeAdminPinModal').classList.remove('hidden'); }
function closeChangeAdminPinModal() { document.getElementById('changeAdminPinModal').classList.add('hidden'); }

document.getElementById('changeAdminPinForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const oldPin = document.getElementById('currentAdminPinInput').value;
  const newPin = document.getElementById('newAdminPinInput').value;
  try {
    const res = await api.changeAdminPin(oldPin, newPin);
    if (res.success) {
      closeChangeAdminPinModal();
      showToast('Admin PIN changed successfully');
      document.getElementById('changeAdminPinForm').reset();
    } else {
      alert(res.error);
    }
  } catch (err) {
    console.error(err);
  }
});

function handleAdminLogout() {
  api.logoutAdmin();
  updateUserUI();
  switchTab('entry');
  showToast('Admin Logged Out');
}

function handleLogoClick() {
  switchTab('entry');
}

document.addEventListener('DOMContentLoaded', async () => {
  updateDOMTranslations();

  const langToggleBtn = document.getElementById('langToggleBtn');
  if (langToggleBtn) langToggleBtn.addEventListener('click', toggleLanguage);

  document.getElementById('navBtnEntry')?.addEventListener('click', () => switchTab('entry'));
  document.getElementById('navBtnMyVisits')?.addEventListener('click', () => switchTab('myVisits'));
  document.getElementById('navBtnDashboard')?.addEventListener('click', () => switchTab('dashboard'));

  document.getElementById('navBtnShare')?.addEventListener('click', () => {
      if(typeof openShareModal === 'function') openShareModal();
  });

  document.getElementById('editVisitForm')?.addEventListener('submit', handleSaveEdit);
  document.getElementById('addMemberForm')?.addEventListener('submit', handleAddMember);

  // Expose for onClick bindings
  window.closeAdminModal = closeAdminModal;
  window.openAdminModal = openAdminModal;
  window.closeOfficerModal = closeOfficerModal;
  window.openChangeAdminPinModal = openChangeAdminPinModal;
  window.closeChangeAdminPinModal = closeChangeAdminPinModal;
  window.handleAdminLogout = handleAdminLogout;
  window.handleLogoClick = handleLogoClick;

  await initEntryForm();
  if (typeof initDashboard === 'function') await initDashboard();

  updateUserUI();

  const hash = window.location.hash.replace('#', '');
  if (hash === 'entry') switchTab('entry');
  else if (hash === 'myVisits') switchTab('myVisits');
  else if (hash === 'dashboard') switchTab('dashboard');
  else switchTab('entry'); // Default to entry always
});

/* ========================================== */
/*           THEME SWITCHER LOGIC             */
/* ========================================== */
function openThemeConfigModal() {
  document.getElementById('themeConfigModal').classList.remove('hidden');
  const grid = document.getElementById('themeSelectorGrid');
  grid.innerHTML = '';

  const currentThemeIdx = Number(localStorage.getItem('dtc_theme_index')) || 0;

  // Uses THEMES array defined in index.html <head>
  THEMES.forEach((theme, idx) => {
    const isSelected = idx === currentThemeIdx;

    // Create button
    const btn = document.createElement('button');
    btn.className = `flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
      isSelected ? 'border-zinc-300 ring-2 ring-offset-2 ring-offset-zinc-900 bg-zinc-800' : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700'
    }`;
    btn.onclick = () => selectAndSaveTheme(idx);

    if (isSelected) btn.style.setProperty('--tw-ring-color', theme.colors['500']);

    btn.innerHTML = `
      <div class="w-8 h-8 rounded-full mb-2 shadow-lg" style="background: linear-gradient(135deg, ${theme.colors['400']}, ${theme.colors['600']})"></div>
      <span class="text-[10px] font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}">${theme.name}</span>
    `;
    grid.appendChild(btn);
  });
}

function closeThemeConfigModal() {
  document.getElementById('themeConfigModal').classList.add('hidden');
}

function selectAndSaveTheme(index) {
  localStorage.setItem('dtc_theme_index', index);
  if (typeof applyTheme === 'function') {
    applyTheme(index);
  }
  showToast('Theme updated to ' + THEMES[index].name);
  openThemeConfigModal(); // Re-render grid to show selection

  if (typeof refreshCharts === 'function') {
    refreshCharts();
  }
}

window.openThemeConfigModal = openThemeConfigModal;
window.closeThemeConfigModal = closeThemeConfigModal;

