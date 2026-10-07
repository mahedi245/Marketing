// API Client for DTC Marketing
const API_BASE = '/api';

const api = {
  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const adminToken = localStorage.getItem('dtc_admin_token');
    const officerId = localStorage.getItem('dtc_officer_id');

    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }
    if (officerId) {
      headers['x-officer-id'] = officerId;
    }
    return headers;
  },

  // Auth
  async loginOfficer(memberId, pin) {
    const res = await fetch(`${API_BASE}/auth/officer-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, pin })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('dtc_officer_id', data.officer.id);
      localStorage.setItem('dtc_officer_name', data.officer.name);
      localStorage.setItem('dtc_officer_role', data.officer.role);
      if (data.officer.photo_data) {
        localStorage.setItem('dtc_officer_photo', data.officer.photo_data);
      } else {
        localStorage.removeItem('dtc_officer_photo');
      }
    }
    return data;
  },

  async loginAdmin(adminPin) {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('dtc_admin_token', data.token);
      if (data.photoData) {
        localStorage.setItem('dtc_admin_photo', data.photoData);
      } else {
        localStorage.removeItem('dtc_admin_photo');
      }
    }
    return data;
  },

  async changeAdminPin(oldPin, newPin, photoData = undefined) {
    const res = await fetch(`${API_BASE}/auth/change-admin-pin`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ oldPin, newPin, photoData })
    });
    return await res.json();
  },

  async changeOfficerPin(memberId, oldPin, newPin, photoData = undefined) {
    const res = await fetch(`${API_BASE}/auth/change-officer-pin`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ memberId, oldPin, newPin, photoData })
    });
    return await res.json();
  },

  isAdmin() {
    return !!localStorage.getItem('dtc_admin_token');
  },

  getCurrentOfficer() {
    const id = localStorage.getItem('dtc_officer_id');
    if (!id) return null;
    return {
      id: Number(id),
      name: localStorage.getItem('dtc_officer_name'),
      role: localStorage.getItem('dtc_officer_role'),
      photo: localStorage.getItem('dtc_officer_photo')
    };
  },

  logoutAdmin() {
    localStorage.removeItem('dtc_admin_token');
    localStorage.removeItem('dtc_admin_photo');
  },

  logoutOfficer() {
    localStorage.removeItem('dtc_officer_id');
    localStorage.removeItem('dtc_officer_name');
    localStorage.removeItem('dtc_officer_role');
    localStorage.removeItem('dtc_officer_photo');
  },

  // Team
  async getTeam(includeInactive = false) {
    const res = await fetch(`${API_BASE}/team?includeInactive=${includeInactive}`, {
      headers: this.getAuthHeaders()
    });
    return await res.json();
  },

  async createTeamMember(memberData) {
    const res = await fetch(`${API_BASE}/team`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(memberData)
    });
    return await res.json();
  },

  async updateTeamMember(id, memberData) {
    const res = await fetch(`${API_BASE}/team/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(memberData)
    });
    return await res.json();
  },

  async deleteTeamMember(id) {
    const res = await fetch(`${API_BASE}/team/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return await res.json();
  },

  // Visits
  async getVisits(filters = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    }
    const res = await fetch(`${API_BASE}/visits?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });
    return await res.json();
  },

  async getVisitById(id) {
    const res = await fetch(`${API_BASE}/visits/${id}`, {
      headers: this.getAuthHeaders()
    });
    return await res.json();
  },

  async createVisit(visitData) {
    const res = await fetch(`${API_BASE}/visits`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(visitData)
    });
    return await res.json();
  },

  async updateVisit(id, visitData) {
    const res = await fetch(`${API_BASE}/visits/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(visitData)
    });
    return await res.json();
  },

  async deleteVisit(id) {
    const res = await fetch(`${API_BASE}/visits/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return await res.json();
  },

  // Analytics
  async getDashboardKPI() {
    const res = await fetch(`${API_BASE}/dashboard/kpi`, {
      headers: this.getAuthHeaders()
    });
    return await res.json();
  },

  async getChartsData() {
    const res = await fetch(`${API_BASE}/dashboard/charts`, {
      headers: this.getAuthHeaders()
    });
    return await res.json();
  },

  // Network Info
  async getInfo() {
    const res = await fetch(`${API_BASE}/info`);
    return await res.json();
  },

  // Export URL
  getExportUrl(filters = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    }
    const adminToken = localStorage.getItem('dtc_admin_token');
    const officerId = localStorage.getItem('dtc_officer_id');
    if (adminToken) params.append('adminToken', adminToken);
    if (officerId) params.append('officerId', officerId);

    return `${API_BASE}/export/csv?${params.toString()}`;
  }
};

window.api = api;
