// Administrator & Officer Dashboard Logic - Red & Black Theme

let trendChartInstance = null;
let statusChartInstance = null;
let currentFilters = {
  page: 1, limit: 25, search: '', memberId: '', status: '',
  startDate: '', endDate: '', followUpOnly: '',
  sortBy: 'visit_date', sortOrder: 'DESC'
};

let myVisitsFilters = {
  page: 1, limit: 15, search: ''
};

async function initDashboard() {
  setupFilterListeners();

  // Expose global methods early
  window.fetchAndRenderMyVisits = fetchAndRenderMyVisits;

  window.addEventListener('languageChanged', () => {
    if(!document.getElementById('viewDashboard').classList.contains('hidden')){
      refreshKPIs();
      fetchAndRenderVisits();
      refreshCharts();
    }
    if(!document.getElementById('viewMyVisits').classList.contains('hidden')){
      fetchAndRenderMyVisits();
    }
  });

  // Auto-refresh Dashboard every 15 seconds in background for real-time live data sync
  setInterval(() => {
    if (!document.getElementById('viewDashboard').classList.contains('hidden') && api.isAdmin()) {
      refreshKPIs();
      fetchAndRenderVisits();
      refreshCharts();
    }
    if (!document.getElementById('viewMyVisits').classList.contains('hidden')) {
      fetchAndRenderMyVisits();
    }
  }, 15000);
}

async function refreshDashboard() {
  if (api.isAdmin()) {
    await Promise.all([
      refreshKPIs(),
      refreshCharts(),
      loadFilterOfficers(),
      fetchAndRenderVisits()
    ]);
  }
}

/* ========================================================= */
/*                   MY VISITS (OFFICER)                     */
/* ========================================================= */
async function fetchAndRenderMyVisits() {
  const officer = api.getCurrentOfficer();
  if (!officer) return;

  // 1. Fetch personal KPIs
  try {
    const kpiRes = await api.getDashboardKPI();
    if (kpiRes.success) {
      document.getElementById('myKpiTotal').textContent = kpiRes.data.totalVisits || 0;
      document.getElementById('myKpiToday').textContent = kpiRes.data.visitsToday || 0;
      document.getElementById('myKpiMonth').textContent = kpiRes.data.visitsThisMonth || 0;
      document.getElementById('myKpiFollowup').textContent = kpiRes.data.pendingFollowUps || 0;
    }
  } catch(e) {}

  // 2. Fetch personal table
  const tbody = document.getElementById('myVisitsTableBody');
  const paginationContainer = document.getElementById('myTablePagination');
  if(!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-zinc-500">Loading...</td></tr>`;

  try {
    const res = await api.getVisits({
      page: myVisitsFilters.page,
      limit: myVisitsFilters.limit,
      search: myVisitsFilters.search,
      memberId: officer.id // Force API self-check
    });

    if (!res.success || !res.data || res.data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-10 text-center text-zinc-500">
            <svg class="w-10 h-10 mx-auto mb-2 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p>${t('no_records')}</p>
          </td>
        </tr>`;
      if(paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    tbody.innerHTML = '';
    res.data.forEach(v => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors text-sm';
      const statusBadge = getStatusBadgeHTML(v.status);
      tr.innerHTML = `
        <td class="py-3 px-3 font-semibold text-zinc-200 whitespace-nowrap">${v.visit_date}</td>
        <td class="py-3 px-3">
          <div class="font-bold text-white">${escapeHtml(v.customer_name)}</div>
          <div class="text-xs text-zinc-400 font-medium">${escapeHtml(v.site_name)}</div>
        </td>
        <td class="py-3 px-3">
          <a href="tel:${escapeHtml(v.phone_number)}" class="inline-flex items-center text-xs font-bold text-primary-500 hover:text-primary-400">
            ${escapeHtml(v.phone_number)}
          </a>
          <div class="text-xs text-zinc-500 line-clamp-1 truncate max-w-[150px]" title="${escapeHtml(v.address)}">${escapeHtml(v.address)}</div>
        </td>
        <td class="py-3 px-3">${statusBadge}</td>
        <td class="py-3 px-3 max-w-[200px]">
          <div class="text-xs text-zinc-400 line-clamp-2">${escapeHtml(v.notes || '--')}</div>
          ${v.next_follow_up_date ? `
            <div class="mt-1 inline-flex items-center text-[10px] uppercase font-bold tracking-wider text-amber-500 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-900/50">
              🗓️ ${v.next_follow_up_date}
            </div>` : ''}
        </td>
        <td class="py-3 px-3 text-right whitespace-nowrap">
          <button onclick="openEditModal(${v.id})" class="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors mr-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    renderMyVisitsPagination(res.pagination);

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-primary-500">Error loading records.</td></tr>`;
  }
}

document.getElementById('myTableSearch')?.addEventListener('input', (e) => {
  myVisitsFilters.search = e.target.value.trim();
  myVisitsFilters.page = 1;
  setTimeout(fetchAndRenderMyVisits, 300);
});

document.getElementById('myVisitsExportBtn')?.addEventListener('click', () => {
  const url = api.getExportUrl({ search: myVisitsFilters.search });
  window.open(url, '_blank');
});

function renderMyVisitsPagination(pagination) {
  const container = document.getElementById('myTablePagination');
  if(!container || !pagination) return;
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) {
    container.innerHTML = `<span class="text-xs text-zinc-500">Showing all <b>${total}</b> records</span>`;
    return;
  }
  container.innerHTML = `
    <div class="text-xs text-zinc-500">Page ${page} of ${totalPages}</div>
    <div class="flex space-x-1 border border-zinc-800 rounded-lg overflow-hidden">
      <button onclick="myVisitsFilters.page=${page-1}; fetchAndRenderMyVisits()" ${page <= 1 ? 'disabled class="px-2 py-1 bg-zinc-900 text-zinc-700"' : 'class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"'}>Prev</button>
      <button onclick="myVisitsFilters.page=${page+1}; fetchAndRenderMyVisits()" ${page >= totalPages ? 'disabled class="px-2 py-1 bg-zinc-900 text-zinc-700"' : 'class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"'}>Next</button>
    </div>
  `;
}


/* ========================================================= */
/*                   ADMIN DASHBOARD Kpis / Charts           */
/* ========================================================= */
async function refreshKPIs() {
  try {
    const res = await api.getDashboardKPI();
    if (res.success) {
      const data = res.data;
      document.getElementById('kpiTotal').textContent = data.totalVisits || 0;
      document.getElementById('kpiToday').textContent = data.visitsToday || 0;
      document.getElementById('kpiMonth').textContent = data.visitsThisMonth || 0;
      document.getElementById('kpiClosed').textContent = data.closedWonCount || 0;
      document.getElementById('kpiFollowup').textContent = data.pendingFollowUps || 0;

      const topPerfEl = document.getElementById('kpiTopPerformer');
      if (topPerfEl && data.topPerformer) {
        if (data.topPerformer.name && data.topPerformer.name !== 'None') {
          topPerfEl.innerHTML = `
            <div class="text-base font-bold text-white truncate max-w-full">${data.topPerformer.name}</div>
            <div class="text-xs font-semibold text-cyan-500">${data.topPerformer.visit_count} ${t('kpi_visits')}</div>
          `;
        } else {
          topPerfEl.innerHTML = `<div class="text-sm text-zinc-600 font-medium mt-1">--</div>`;
        }
      }
    }
  } catch (err) { console.error('Error fetching KPIs:', err); }
}

async function refreshCharts() {
  try {
    const res = await api.getChartsData();
    if (!res.success) return;

    const { trend, statusDistribution } = res.data;

    // Line Chart (Red Trend)
    const trendCtx = document.getElementById('trendChart')?.getContext('2d');
    if (trendCtx) {
      if (trendChartInstance) trendChartInstance.destroy();
      const labels = trend.map((t) => t.visit_date);
      const counts = trend.map((t) => t.count);

      const theme500 = getComputedStyle(document.documentElement).getPropertyValue('--theme-500').trim() || '#3b82f6';

      // Gradient fill for line
      const grad = trendCtx.createLinearGradient(0, 0, 0, 300);

      // Parse hex to rgba for gradient
      let r = 59, g = 130, b = 246; // fallback blue-500
      if(theme500.startsWith('#') && theme500.length >= 7) {
         r = parseInt(theme500.slice(1,3), 16);
         g = parseInt(theme500.slice(3,5), 16);
         b = parseInt(theme500.slice(5,7), 16);
      }
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);

      trendChartInstance = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [{
            label: t('kpi_total'),
            data: counts.length ? counts : [0],
            borderColor: theme500,
            backgroundColor: grad,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#fff',
            pointBorderColor: theme500,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } }, // tooltip configs can be added
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0, color: '#a1a1aa' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            x: {
              ticks: { color: '#a1a1aa' },
              grid: { display: false }
            }
          }
        }
      });
    }

    // Doughnut Chart (Status)
    const statusCtx = document.getElementById('statusChart')?.getContext('2d');
    if (statusCtx) {
      if (statusChartInstance) statusChartInstance.destroy();

      const statusColors = {
        'Interested': '#10b981', // Emerald
        'Follow-up': '#f59e0b',  // Amber
        'Need Quotation': '#3b82f6', // Blue
        'Closed/Won': '#8b5cf6', // Purple
        'Not Interested': '#52525b' // Zinc
      };

      const labels = statusDistribution.map((s) => s.status);
      const counts = statusDistribution.map((s) => s.count);
      const bgColors = labels.map((l) => statusColors[l] || '#52525b');

      statusChartInstance = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['No Data'],
          datasets: [{
            data: counts.length ? counts : [1],
            backgroundColor: counts.length ? bgColors : ['#27272a'], // Zinc-800
            borderWidth: 2,
            borderColor: '#18181b' // Zinc-900 (matches card bg)
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, color: '#d4d4d8', font: { size: 11 } }
            }
          },
          cutout: '70%'
        }
      });
    }
  } catch (err) { console.error('Error charts:', err); }
}

async function loadFilterOfficers() {
  const filterOfficerSelect = document.getElementById('filterOfficer');
  if (!filterOfficerSelect) return;
  try {
    const res = await api.getTeam();
    if (res.success) {
      const currentVal = filterOfficerSelect.value;
      filterOfficerSelect.innerHTML = `<option value="">${t('filter_all_members')}</option>`;
      res.data.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        if (String(m.id) === String(currentVal)) opt.selected = true;
        filterOfficerSelect.appendChild(opt);
      });
    }
  } catch (err) {}
}


/* ========================================================= */
/*                   ADMIN FILTER & TABLE LOGIC              */
/* ========================================================= */
function setupFilterListeners() {
  const searchInput = document.getElementById('tableSearch');
  const filterOfficer = document.getElementById('filterOfficer');
  const filterStatus = document.getElementById('filterStatus');
  const filterStartDate = document.getElementById('filterStartDate');
  const filterEndDate = document.getElementById('filterEndDate');
  const exportBtn = document.getElementById('exportCsvBtn');

  // Debounced Search
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = e.target.value.trim();
        currentFilters.page = 1;
        fetchAndRenderVisits();
      }, 300);
    });
  }

  [filterOfficer, filterStatus, filterStartDate, filterEndDate].forEach(el => {
    if(el) {
      el.addEventListener('change', (e) => {
        const key = e.target.id.replace('filter', '');
        const filterKey = key.charAt(0).toLowerCase() + key.slice(1); // 'Officer' -> 'officer' but mapped mapped slightly diff
        // manual mapping
        if(e.target.id.includes('Officer')) currentFilters.memberId = e.target.value;
        if(e.target.id.includes('Status')) currentFilters.status = e.target.value;
        if(e.target.id.includes('StartDate')) currentFilters.startDate = e.target.value;
        if(e.target.id.includes('EndDate')) currentFilters.endDate = e.target.value;

        currentFilters.page = 1;
        fetchAndRenderVisits();
      });
    }
  });

  document.querySelectorAll('.filter-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-preset').forEach((b) => {
        b.classList.remove('bg-primary-600', 'text-white');
        b.classList.add('bg-zinc-800', 'text-zinc-300');
      });
      btn.classList.add('bg-primary-600', 'text-white');
      btn.classList.remove('bg-zinc-800', 'text-zinc-300');

      const preset = btn.getAttribute('data-preset');
      const today = new Date();
      const formatDate = (d) => d.toISOString().split('T')[0];

      currentFilters.startDate = '';
      currentFilters.endDate = '';
      currentFilters.followUpOnly = '';

      if (preset === 'today') {
        currentFilters.startDate = formatDate(today);
        currentFilters.endDate = formatDate(today);
      } else if (preset === 'week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        currentFilters.startDate = formatDate(lastWeek);
        currentFilters.endDate = formatDate(today);
      } else if (preset === 'month') {
        currentFilters.startDate = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
        currentFilters.endDate = formatDate(today);
      } else if (preset === 'followup') {
        currentFilters.followUpOnly = 'true';
      }

      const fStart = document.getElementById('filterStartDate');
      const fEnd = document.getElementById('filterEndDate');
      if (fStart) fStart.value = currentFilters.startDate;
      if (fEnd) fEnd.value = currentFilters.endDate;

      currentFilters.page = 1;
      fetchAndRenderVisits();
    });
  });

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const url = api.getExportUrl(currentFilters);
      window.open(url, '_blank');
    });
  }
}

async function fetchAndRenderVisits() {
  const tbody = document.getElementById('visitsTableBody');
  const paginationContainer = document.getElementById('tablePagination');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-zinc-500">Loading data...</td></tr>`;

  try {
    const res = await api.getVisits(currentFilters);
    if (!res.success || !res.data || res.data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-zinc-600">
            <svg class="w-12 h-12 mx-auto mb-3 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p>${t('no_records')}</p>
          </td>
        </tr>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    tbody.innerHTML = '';
    res.data.forEach((v) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-zinc-800/80 hover:bg-zinc-800/40 transition-colors text-sm';
      const statusBadge = getStatusBadgeHTML(v.status);

      tr.innerHTML = `
        <td class="py-3 px-3 font-semibold text-zinc-300 whitespace-nowrap">${v.visit_date}</td>
        <td class="py-3 px-3">
          <div class="font-bold text-white">${escapeHtml(v.member_name)}</div>
          <div class="text-[11px] text-zinc-400 capitalize">${escapeHtml(v.member_role || '')}</div>
        </td>
        <td class="py-3 px-3">
          <div class="font-bold text-zinc-200">${escapeHtml(v.customer_name)}</div>
          <div class="text-xs text-primary-400 font-medium">${escapeHtml(v.site_name)}</div>
        </td>
        <td class="py-3 px-3">
          <a href="tel:${escapeHtml(v.phone_number)}" class="inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300">
             ${escapeHtml(v.phone_number)}
          </a>
          <div class="text-xs text-zinc-500 line-clamp-1 truncate max-w-[150px]">${escapeHtml(v.address)}</div>
        </td>
        <td class="py-3 px-3">${statusBadge}</td>
        <td class="py-3 px-3 max-w-[200px]">
          <div class="text-[11px] text-zinc-400 leading-tight line-clamp-2">${escapeHtml(v.notes || '--')}</div>
          ${v.next_follow_up_date ? `
            <div class="mt-1 inline-flex items-center text-[10px] font-bold text-amber-500 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/50">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              ${v.next_follow_up_date}
            </div>
          ` : ''}
        </td>
        <td class="py-3 px-3 text-right whitespace-nowrap">
          <button onclick="openEditModal(${v.id})" class="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors mr-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
          <button onclick="confirmDeleteVisit(${v.id})" class="p-1.5 text-cyan-500 hover:text-cyan-400 hover:bg-cyan-950/50 rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    renderPagination(res.pagination);
  } catch (err) {
    console.error('Error fetching admin visits:', err);
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-cyan-500">Failed to load data.</td></tr>`;
  }
}

function getStatusBadgeHTML(status) {
  let badgeClass = 'badge-interested';
  let label = status;

  switch (status) {
    case 'Interested':
      badgeClass = 'badge-interested'; label = t('status_interested'); break;
    case 'Follow-up':
      badgeClass = 'badge-follow-up'; label = t('status_followup'); break;
    case 'Need Quotation':
      badgeClass = 'badge-need-quotation'; label = t('status_quotation'); break;
    case 'Closed/Won':
      badgeClass = 'badge-closed-won'; label = t('status_closed'); break;
    case 'Not Interested':
      badgeClass = 'badge-not-interested'; label = t('status_not_interested'); break;
  }
  return `<span class="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-lg uppercase tracking-wider ${badgeClass}">${label}</span>`;
}

function renderPagination(pagination) {
  const container = document.getElementById('tablePagination');
  if (!container || !pagination) return;

  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) {
    container.innerHTML = `<span class="text-xs text-zinc-500">Total <b>${total}</b> records</span>`;
    return;
  }

  container.innerHTML = `
    <div class="flex items-center justify-between w-full">
      <div class="text-xs text-zinc-500">Pg <b>${page}</b> of <b>${totalPages}</b> (${total})</div>
      <div class="flex space-x-1 border border-zinc-800 rounded-lg overflow-hidden">
        <button onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled class="px-2.5 py-1 text-xs bg-zinc-900 text-zinc-700"' : 'class="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300"'}>Prev</button>
        <button onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled class="px-2.5 py-1 text-xs bg-zinc-900 text-zinc-700"' : 'class="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300"'}>Next</button>
      </div>
    </div>
  `;
}

function changePage(newPage) {
  currentFilters.page = newPage;
  fetchAndRenderVisits();
}

// Global Exports
window.initDashboard = initDashboard;
window.refreshDashboard = refreshDashboard;
window.changePage = changePage;

// Edit & Delete logic is safely shared since Officer & Admin both hit this modal logic if permitted
async function openEditModal(visitId) {
  try {
    const res = await api.getVisitById(visitId);
    if (!res.success) return;
    const v = res.data;
    document.getElementById('editVisitId').value = v.id;
    document.getElementById('editCustomer').value = v.customer_name;
    document.getElementById('editSite').value = v.site_name;
    document.getElementById('editAddress').value = v.address;
    document.getElementById('editPhone').value = v.phone_number;
    document.getElementById('editDate').value = v.visit_date;
    document.getElementById('editStatus').value = v.status;
    document.getElementById('editNotes').value = v.notes || '';
    document.getElementById('editFollowUp').value = v.next_follow_up_date || '';

    await loadTeamDropdown(document.getElementById('editOfficer'), v.member_id);
    document.getElementById('editModal').classList.remove('hidden');
  } catch (err) {}
}
function closeEditModal() { document.getElementById('editModal').classList.add('hidden'); }

async function handleSaveEdit(e) {
  e.preventDefault();
  const id = document.getElementById('editVisitId').value;
  const payload = {
    member_id: Number(document.getElementById('editOfficer').value),
    customer_name: document.getElementById('editCustomer').value.trim(),
    site_name: document.getElementById('editSite').value.trim(),
    address: document.getElementById('editAddress').value.trim(),
    phone_number: document.getElementById('editPhone').value.trim(),
    visit_date: document.getElementById('editDate').value,
    status: document.getElementById('editStatus').value,
    notes: document.getElementById('editNotes').value.trim(),
    next_follow_up_date: document.getElementById('editFollowUp').value || null
  };
  try {
    const res = await api.updateVisit(id, payload);
    if (res.success) {
      closeEditModal();
      showToast('Record updated successfully');
      if (document.getElementById('viewDashboard') && !document.getElementById('viewDashboard').classList.contains('hidden')) {
        fetchAndRenderVisits();
        refreshKPIs();
        refreshCharts();
      }
      if (document.getElementById('viewMyVisits') && !document.getElementById('viewMyVisits').classList.contains('hidden')) {
        fetchAndRenderMyVisits();
      }
    } else alert(res.error);
  } catch (err) {}
}

let visitToDeleteId = null;
function confirmDeleteVisit(id) {
  visitToDeleteId = id;
  document.getElementById('deleteModal').classList.remove('hidden');
}
function closeDeleteModal() {
  visitToDeleteId = null;
  document.getElementById('deleteModal').classList.add('hidden');
}
async function executeDeleteVisit() {
  if (!visitToDeleteId) return;
  try {
    const res = await api.deleteVisit(visitToDeleteId);
    if (res.success) {
      closeDeleteModal();
      showToast('Record deleted.');
      if (!document.getElementById('viewDashboard').classList.contains('hidden')) {
         fetchAndRenderVisits();
         refreshKPIs();
         refreshCharts();
      }
      if (!document.getElementById('viewMyVisits').classList.contains('hidden')) fetchAndRenderMyVisits();
    }
  } catch (err) {}
}

window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.handleSaveEdit = handleSaveEdit;
window.confirmDeleteVisit = confirmDeleteVisit;
window.closeDeleteModal = closeDeleteModal;
window.executeDeleteVisit = executeDeleteVisit;
