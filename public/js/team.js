// Team Management & Mobile Network Sharing - Red & Black Theme

let allMembersList = [];

async function openTeamModal() {
  document.getElementById('teamModal').classList.remove('hidden');
  await renderTeamList();
}

function closeTeamModal() {
  document.getElementById('teamModal').classList.add('hidden');
  cancelEditMember();
}

async function renderTeamList() {
  const tbody = document.getElementById('teamTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-zinc-500">Loading team...</td></tr>`;

  try {
    const res = await api.getTeam(true);
    if (!res.success || !res.data) return;

    allMembersList = res.data;
    tbody.innerHTML = '';
    res.data.forEach((m) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-zinc-800 hover:bg-zinc-800/50 text-sm transition-colors';

      tr.innerHTML = `
        <td class="py-3 px-3 font-semibold text-white">
          ${escapeHtml(m.name)}
        </td>
        <td class="py-3 px-3 text-zinc-400">
          ${escapeHtml(m.role || 'Officer')}
        </td>
        <td class="py-3 px-3 text-zinc-400 font-mono text-xs">
          ${escapeHtml(m.phone || '--')}
        </td>
        <td class="py-3 px-3 text-center font-bold text-primary-500">
          ${m.total_visits || 0}
        </td>
        <td class="py-3 px-3 text-right whitespace-nowrap">
          <span class="inline-block px-2 py-0.5 text-[10px] uppercase rounded-lg ${m.active ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/80' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'} font-bold">
            ${m.active ? 'Active' : 'Inactive'}
          </span>
          <button onclick="toggleMemberActive(${m.id}, ${m.active ? 0 : 1})" class="ml-2 text-xs font-semibold ${m.active ? 'text-zinc-500 hover:text-zinc-300' : 'text-emerald-500 hover:text-emerald-400'}" title="${m.active ? 'Disable' : 'Enable'}">
            ${m.active ? 'Disable' : 'Enable'}
          </button>
          <button onclick="editMember(${m.id})" class="ml-2 text-primary-400 hover:text-primary-300 transition-colors" title="Edit">
            <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
          <button onclick="deleteMember(${m.id})" class="ml-2 text-rose-500 hover:text-rose-400 transition-colors" title="Delete">
            <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error rendering team list:', err);
  }
}

async function handleAddMember(e) {
  e.preventDefault();
  const name = document.getElementById('newMemberName').value.trim();
  const role = document.getElementById('newMemberRole').value.trim();
  const phone = document.getElementById('newMemberPhone').value.trim();
  const pin = document.getElementById('newMemberPin').value.trim();

  if (!name) {
    alert('Please enter member name');
    return;
  }

  try {
    const res = await api.createTeamMember({ name, role, phone, pin });
    if (res.success) {
      document.getElementById('addMemberForm').reset();
      showToast('New team member added!');
      await renderTeamList();
      // Reload dropdowns
      const entryOfficer = document.getElementById('entryOfficer');
      const filterOfficer = document.getElementById('filterOfficer');
      if (entryOfficer) loadTeamDropdown(entryOfficer, api.getCurrentOfficer()?.id);
      if (filterOfficer) loadTeamDropdown(filterOfficer, '');
    } else {
      alert('Error: ' + res.error);
    }
  } catch (err) {
    console.error('Error adding member:', err);
  }
}

function editMember(id) {
  const m = allMembersList.find(x => x.id === id);
  if (!m) return;
  document.getElementById('addMemberForm').classList.add('hidden');
  document.getElementById('editMemberForm').classList.remove('hidden');

  document.getElementById('editMemberId').value = m.id;
  document.getElementById('editMemberName').value = m.name;
  document.getElementById('editMemberRole').value = m.role || '';
  document.getElementById('editMemberPhone').value = m.phone || '';
  document.getElementById('editMemberPin').value = ''; // Don't prefill existing pin
}

function cancelEditMember() {
  document.getElementById('editMemberForm').classList.add('hidden');
  document.getElementById('addMemberForm').classList.remove('hidden');
  document.getElementById('editMemberForm').reset();
}

async function handleEditMemberSave(e) {
  e.preventDefault();
  const id = document.getElementById('editMemberId').value;
  const name = document.getElementById('editMemberName').value.trim();
  const role = document.getElementById('editMemberRole').value.trim();
  const phone = document.getElementById('editMemberPhone').value.trim();
  const pin = document.getElementById('editMemberPin').value.trim();

  try {
    const payload = { name, role, phone };
    if (pin) payload.pin = pin;

    const res = await api.updateTeamMember(id, payload);
    if (res.success) {
      showToast('Member details updated!');
      cancelEditMember();
      await renderTeamList();
      reloadDropdowns();
    } else alert('Error: ' + res.error);
  } catch (err) {
    console.error(err);
  }
}

let memberToDeleteId = null;

function deleteMember(id) {
  memberToDeleteId = id;
  document.getElementById('deleteMemberModal').classList.remove('hidden');
}

function closeDeleteMemberModal() {
  memberToDeleteId = null;
  document.getElementById('deleteMemberModal').classList.add('hidden');
}

async function executeDeleteMember() {
  if (!memberToDeleteId) return;
  try {
    const res = await api.deleteTeamMember(memberToDeleteId);
    if (res.success) {
      showToast(res.message || 'Member deleted.');
      closeDeleteMemberModal();
      await renderTeamList();
      reloadDropdowns();
    } else {
      alert('Error: ' + res.error);
    }
  } catch (err) {
    console.error(err);
  }
}

function reloadDropdowns() {
  const entryOfficer = document.getElementById('entryOfficer');
  const filterOfficer = document.getElementById('filterOfficer');
  if (entryOfficer) loadTeamDropdown(entryOfficer, api.getCurrentOfficer()?.id);
  if (filterOfficer) loadTeamDropdown(filterOfficer, '');
}

async function toggleMemberActive(id, newStatus) {
  try {
    const res = await api.updateTeamMember(id, { active: newStatus });
    if (res.success) {
      renderTeamList();
      reloadDropdowns();
    }
  } catch (err) {
    console.error('Error toggling member status:', err);
  }
}

// Mobile QR & Network Sharing Modal
async function openShareModal() {
  document.getElementById('shareModal').classList.remove('hidden');
  try {
    const res = await api.getInfo();
    if (res.success) {
      const lanIp = res.data.lanIp;
      const port = res.data.port;
      const mobileUrl = `http://${lanIp}:${port}`;

      document.getElementById('shareUrlInput').value = mobileUrl;

      // Generate QR Code dynamically
      const qrImg = document.getElementById('shareQrCode');
      if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileUrl)}`;
      }
    }
  } catch (err) {
    console.error('Error opening share modal:', err);
  }
}

function closeShareModal() {
  document.getElementById('shareModal').classList.add('hidden');
}

function copyShareUrl() {
  const input = document.getElementById('shareUrlInput');
  input.select();
  document.execCommand('copy');
  showToast('Link copied to clipboard!');
}

// Escape helper for HTML rendering
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('editMemberForm')?.addEventListener('submit', handleEditMemberSave);
});

window.openTeamModal = openTeamModal;
window.closeTeamModal = closeTeamModal;
window.handleAddMember = handleAddMember;
window.toggleMemberActive = toggleMemberActive;
window.editMember = editMember;
window.cancelEditMember = cancelEditMember;
window.deleteMember = deleteMember;
window.closeDeleteMemberModal = closeDeleteMemberModal;
window.executeDeleteMember = executeDeleteMember;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.copyShareUrl = copyShareUrl;
window.escapeHtml = escapeHtml;
