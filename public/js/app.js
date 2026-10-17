// Main Application Bootstrap & Tab Navigation - DTC Marketing

let currentTab = 'entry';

function switchTab(tabName) {
  const entryView = document.getElementById('viewEntry');
  const myVisitsView = document.getElementById('viewMyVisits');
  const expensesView = document.getElementById('viewExpenses');
  const dashboardView = document.getElementById('viewDashboard');

  const navBtnEntry = document.getElementById('navBtnEntry');
  const navBtnMyVisits = document.getElementById('navBtnMyVisits');
  const navBtnExpenses = document.getElementById('navBtnExpenses');
  const navBtnDashboard = document.getElementById('navBtnDashboard');

  const navBtnEntryMob = document.getElementById('navBtnEntryMob');
  const navBtnMyVisitsMob = document.getElementById('navBtnMyVisitsMob');
  const navBtnExpensesMob = document.getElementById('navBtnExpensesMob');
  const navBtnDashboardMob = document.getElementById('navBtnDashboardMob');

  // AUTHENTICATION CHECKS
  if (tabName === 'myVisits' && !api.getCurrentOfficer()) {
    document.getElementById('officerLoginModal').classList.remove('hidden');
    // Preload officers in modal dropdown
    loadTeamDropdown(document.getElementById('modalOfficerSelect'));
    return;
  }

  if (tabName === 'expenses' && !api.getCurrentOfficer()) {
      document.getElementById('officerLoginModal').classList.remove('hidden');
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
  expensesView.classList.add('hidden');
  dashboardView.classList.add('hidden');

  // RESET BUTTONS
  [navBtnEntry, navBtnMyVisits, navBtnExpenses, navBtnDashboard, navBtnEntryMob, navBtnMyVisitsMob, navBtnExpensesMob, navBtnDashboardMob].forEach(btn => {
    if (btn) {
      btn.classList.remove('bg-primary-600', 'text-white');
      btn.classList.add('text-zinc-300', 'hover:text-white');
    }
  });

  // ACTIVATE SELECTED
  if (tabName === 'entry') {
    entryView.classList.remove('hidden');
    navBtnEntry?.classList.add('bg-primary-600', 'text-white');
    navBtnEntry?.classList.remove('text-zinc-300');
    navBtnEntryMob?.classList.add('bg-primary-600', 'text-white');
    navBtnEntryMob?.classList.remove('text-zinc-300');
  }
  else if (tabName === 'myVisits') {
    myVisitsView.classList.remove('hidden');
    navBtnMyVisits?.classList.add('bg-primary-600', 'text-white');
    navBtnMyVisits?.classList.remove('text-zinc-300');
    navBtnMyVisitsMob?.classList.add('bg-primary-600', 'text-white');
    navBtnMyVisitsMob?.classList.remove('text-zinc-300');
    if (window.fetchAndRenderMyVisits) fetchAndRenderMyVisits();
  }
  else if (tabName === 'expenses') {
    expensesView.classList.remove('hidden');
    navBtnExpenses?.classList.add('bg-primary-600', 'text-white');
    navBtnExpenses?.classList.remove('text-zinc-300');
    navBtnExpensesMob?.classList.add('bg-primary-600', 'text-white');
    navBtnExpensesMob?.classList.remove('text-zinc-300');
    if (window.initExpenses) initExpenses();
  }
  else if (tabName === 'dashboard') {
    dashboardView.classList.remove('hidden');
    navBtnDashboard?.classList.add('bg-primary-600', 'text-white');
    navBtnDashboard?.classList.remove('text-zinc-300');
    navBtnDashboardMob?.classList.add('bg-primary-600', 'text-white');
    navBtnDashboardMob?.classList.remove('text-zinc-300');
    if (window.refreshDashboard) refreshDashboard();
  }

  // Optionally update UI logic if context changes
  updateUserUI();
}

// Update User UI (Current Officer, Admin Badge, Entry Default Match)
function updateUserUI() {
  const currentOfficer = api.getCurrentOfficer();
  const isAdmin = api.isAdmin();

  // Who did we log into most recently?
  const lastLogged = localStorage.getItem('dtc_last_logged') || 'officer';

  // If we are on dashboard tab, prioritize Admin UI, else use recent
  const showAdminUI = isAdmin && (lastLogged === 'admin' || !currentOfficer || currentTab === 'dashboard');
  const showOfficerUI = currentOfficer && !showAdminUI;

  const label = document.getElementById('currentOfficerLabel');
  const roleBadge = document.getElementById('roleBadge');
  const lockIcon = document.getElementById('dashboardLockIcon');
  const navUserPhoto = document.getElementById('navUserPhoto');

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

  // Handle Photo & Label logic based on priority
  if (showAdminUI) {
    const adminPhoto = localStorage.getItem('dtc_admin_photo');
    if (adminPhoto && navUserPhoto) navUserPhoto.src = adminPhoto;
    else if (navUserPhoto) navUserPhoto.src = '/logo.png';

    label.textContent = 'Administrator';
  } else if (showOfficerUI) {
    if (navUserPhoto) navUserPhoto.src = currentOfficer.photo || '/logo.png';
    label.textContent = currentOfficer.name;
  } else {
    if (navUserPhoto) navUserPhoto.src = '/logo.png';
    label.textContent = t('nav_officer_btn');
  }

  // Always keep entry dropdown synced if officer exists, even if admin is displayed
  if (currentOfficer) {
    const opt = document.getElementById('entryOfficer');
    if (opt && opt.value !== String(currentOfficer.id)) {
       opt.value = currentOfficer.id;
    }
  }
}

// Fast Reverse Geocoding helper for photo watermark
async function getLiveAreaName(lat, long) {
  // 1. Try BigDataCloud (fast, client-side, CORS-friendly)
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 2500);
    const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}&localityLanguage=en`, { signal: ctrl.signal });
    clearTimeout(to);
    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const parts = [data.locality || data.city, data.principalSubdivision].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  } catch (e) {}

  // 2. Try server-side reverse geocoding proxy
  try {
    const sRes = await fetch(`/api/geocode/reverse?lat=${lat}&long=${long}`);
    if (sRes.ok) {
      const sData = await sRes.json();
      if (sData.success && sData.area) {
        return sData.area;
      }
    }
  } catch (e) {}

  // 3. Fallback to coordinates
  return `${lat.toFixed(4)}, ${long.toFixed(4)}`;
}

// Global Image Resizer & Preview utility with Live Geocoded Watermark
window.previewImage = function(event, imgId, hiddenInputId) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = async function() {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 640;
      const MAX_HEIGHT = 640;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // 1. Capture Live GPS Location immediately when photo is chosen/taken
      let areaName = '';
      let lat = null;
      let long = null;

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 7000,
            maximumAge: 15000
          });
        });
        lat = position.coords.latitude;
        long = position.coords.longitude;
        window.lastCapturedGps = { lat, long };
      } catch (geoErr) {
        console.warn('Geolocation capture in previewImage:', geoErr);
      }

      // 2. Resolve real area name from GPS coordinates
      if (lat && long && !(lat === 0 && long === 0)) {
        try {
          areaName = await getLiveAreaName(lat, long);
        } catch (e) {}
      }

      // 3. Fallback to typed address if GPS failed or is offline
      if (!areaName) {
        const addrInput = document.getElementById('entryAddress') || document.getElementById('editAddress');
        if (addrInput && addrInput.value.trim()) {
          areaName = addrInput.value.trim();
        } else {
          areaName = 'Dhaka';
        }
      }

      // 4. Auto-fill entryAddress field if empty with the live area
      const entryAddrInput = document.getElementById('entryAddress');
      if (entryAddrInput && !entryAddrInput.value.trim() && areaName && areaName !== 'Dhaka') {
        entryAddrInput.value = areaName;
      }

      const displayArea = areaName.length > 25 ? areaName.substring(0, 23) + '..' : areaName;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString();

      // Load Logo Image
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = function() {
        const padding = 12;
        const boxWidth = 260;
        const boxHeight = 64;
        const boxX = padding;
        const boxY = height - boxHeight - padding; // Bottom-Left Corner

        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
        ctx.fill();
        ctx.stroke();

        // Draw White Background Box for Logo to make it pop and larger
        const logoBgX = boxX + 8;
        const logoBgY = boxY + 8;
        const logoBgSize = 48;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(logoBgX, logoBgY, logoBgSize, logoBgSize, 8);
        ctx.fill();

        // Draw Logo inside white box
        ctx.drawImage(logoImg, logoBgX + 4, logoBgY + 4, 40, 40);

        // Draw DTC text and Live Area / Time
        const textStartX = boxX + 64;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('DTC Marketing', textStartX, boxY + 22);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '11px sans-serif';
        ctx.fillText(`📍 ${displayArea}`, textStartX, boxY + 39);

        ctx.fillStyle = '#f59e0b';
        ctx.font = '10px sans-serif';
        ctx.fillText(`⏰ ${dateStr}, ${timeStr}`, textStartX, boxY + 54);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        document.getElementById(imgId).src = dataUrl;
        document.getElementById(hiddenInputId).value = dataUrl;
      };

      logoImg.onerror = function() {
        const padding = 12;
        const boxWidth = 240;
        const boxHeight = 52;
        const boxX = padding;
        const boxY = height - boxHeight - padding; // Bottom-Left Corner

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('DTC Marketing', boxX + 10, boxY + 18);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '11px sans-serif';
        ctx.fillText(`📍 ${displayArea}`, boxX + 10, boxY + 33);

        ctx.fillStyle = '#f59e0b';
        ctx.font = '10px sans-serif';
        ctx.fillText(`⏰ ${dateStr}, ${timeStr}`, boxX + 10, boxY + 46);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        document.getElementById(imgId).src = dataUrl;
        document.getElementById(hiddenInputId).value = dataUrl;
      };

      logoImg.src = '/logo.png';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

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
      localStorage.setItem('dtc_last_logged', 'admin');
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
      localStorage.setItem('dtc_last_logged', 'officer');
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

// Change Officer PIN & Profile
function openChangeOfficerPinModal() {
  document.getElementById('changeOfficerPinModal').classList.remove('hidden');
  const select = document.getElementById('changePinOfficerSelect');
  if (typeof loadTeamDropdown === 'function') {
    loadTeamDropdown(select);
  }
  const currentOfficer = api.getCurrentOfficer();
  if (currentOfficer && select) {
    select.value = currentOfficer.id;
    if (currentOfficer.photo) {
      document.getElementById('officerProfilePreview').src = currentOfficer.photo;
    } else {
      document.getElementById('officerProfilePreview').src = '/logo.png';
    }
  }
}
function closeChangeOfficerPinModal() {
  document.getElementById('changeOfficerPinModal').classList.add('hidden');
  // Reset photo form state
  document.getElementById('officerProfilePreview').src = '/logo.png';
  document.getElementById('officerPhotoData').value = '';
}

document.getElementById('changeOfficerPinForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const memberId = document.getElementById('changePinOfficerSelect').value;
  const oldPin = document.getElementById('currentOfficerPinInput').value;
  const newPin = document.getElementById('newOfficerPinInput').value;
  const photoData = document.getElementById('officerPhotoData').value;

  if (!memberId) {
    alert('অনুগ্রহ করে কর্মকর্তা সিলেক্ট করুন');
    return;
  }

  try {
    const res = await api.changeOfficerPin(memberId, oldPin, newPin, photoData || undefined);
    if (res.success) {
      closeChangeOfficerPinModal();
      showToast('প্রোফাইল সফলভাবে আপডেট হয়েছে');
      document.getElementById('changeOfficerPinForm').reset();
      // Auto reconnect to fresh photo
      const currentOfficer = api.getCurrentOfficer();
      if (currentOfficer && String(currentOfficer.id) === String(memberId)) {
         if (photoData) localStorage.setItem('dtc_officer_photo', photoData);
         updateUserUI();
      }
    } else {
      alert(res.error || 'প্রোফাইল আপডেট ব্যর্থ হয়েছে');
    }
  } catch (err) {
    console.error(err);
    alert('ত্রুটি: ' + err.message);
  }
});

// Change Admin PIN & Profile
function openChangeAdminPinModal() {
  document.getElementById('changeAdminPinModal').classList.remove('hidden');
  const existingPhoto = localStorage.getItem('dtc_admin_photo');
  if (existingPhoto) {
     document.getElementById('adminProfilePreview').src = existingPhoto;
  }
}
function closeChangeAdminPinModal() {
  document.getElementById('changeAdminPinModal').classList.add('hidden');
  document.getElementById('adminPhotoData').value = '';
}

document.getElementById('changeAdminPinForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const oldPin = document.getElementById('currentAdminPinInput').value;
  const newPin = document.getElementById('newAdminPinInput').value;
  const photoData = document.getElementById('adminPhotoData').value;

  try {
    const res = await api.changeAdminPin(oldPin, newPin, photoData || undefined);
    if (res.success) {
      closeChangeAdminPinModal();
      showToast('Admin profile updated successfully');
      document.getElementById('changeAdminPinForm').reset();
      if (photoData) {
        localStorage.setItem('dtc_admin_photo', photoData);
      }
      updateUserUI();
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
  const langToggleBtnMob = document.getElementById('langToggleBtnMob');
  if (langToggleBtnMob) langToggleBtnMob.addEventListener('click', toggleLanguage);

  document.getElementById('navBtnEntry')?.addEventListener('click', () => switchTab('entry'));
  document.getElementById('navBtnMyVisits')?.addEventListener('click', () => switchTab('myVisits'));
  document.getElementById('navBtnExpenses')?.addEventListener('click', () => switchTab('expenses'));
  document.getElementById('navBtnDashboard')?.addEventListener('click', () => switchTab('dashboard'));

  document.getElementById('navBtnEntryMob')?.addEventListener('click', () => switchTab('entry'));
  document.getElementById('navBtnMyVisitsMob')?.addEventListener('click', () => switchTab('myVisits'));
  document.getElementById('navBtnExpensesMob')?.addEventListener('click', () => switchTab('expenses'));
  document.getElementById('navBtnDashboardMob')?.addEventListener('click', () => switchTab('dashboard'));

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
  window.openChangeOfficerPinModal = openChangeOfficerPinModal;
  window.closeChangeOfficerPinModal = closeChangeOfficerPinModal;
  window.handleAdminLogout = handleAdminLogout;
  window.handleLogoClick = handleLogoClick;

  await initEntryForm();
  if (typeof initDashboard === 'function') await initDashboard();

  updateUserUI();

  // Initialize Real-time Online Presence Poll (Heartbeat every 15s)
  const myClientId = 'client_' + Math.random().toString(36.substring(2, 9));
  async function pingPresence() {
    try {
      const officer = api.getCurrentOfficer();
      const name = officer ? officer.name : (api.isAdmin() ? 'Administrator' : 'Guest Officer');
      const res = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: myClientId, name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.activeCount === 'number') {
          const countEl = document.getElementById('liveOnlineCount');
          if (countEl) {
            countEl.textContent = `অনলাইন: ${data.activeCount} জন`;
          }
        }
      }
    } catch (e) {}
  }
  pingPresence();
  setInterval(pingPresence, 15000);

  const hash = window.location.hash.replace('#', '');
  if (hash === 'entry') switchTab('entry');
  else if (hash === 'myVisits') switchTab('myVisits');
  else if (hash === 'expenses') switchTab('expenses');
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

