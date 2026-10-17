import { Router } from 'express';
import os from 'node:os';
import * as teamController from '../controllers/teamController.js';
import * as visitsController from '../controllers/visitsController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as authController from '../controllers/authController.js';
import * as expensesController from '../controllers/expensesController.js';

const router = Router();

// Authentication endpoints
router.post('/auth/officer-login', authController.officerLogin);
router.post('/auth/admin-login', authController.adminLogin);
router.post('/auth/change-admin-pin', authController.updateAdminProfile);
router.post('/auth/change-officer-pin', authController.updateOfficerProfile);

// Team endpoints
router.get('/team', teamController.getTeam);
router.post('/team', teamController.createMember);
router.put('/team/:id', teamController.updateMember);
router.delete('/team/:id', teamController.deleteMember);

// Visits endpoints
router.get('/visits', visitsController.getVisits);
router.get('/visits/search', visitsController.searchCustomerByPhone);
router.post('/visits', visitsController.createVisit);
router.get('/visits/:id', visitsController.getVisitById);
router.put('/visits/:id', visitsController.updateVisit);
router.delete('/visits/:id', visitsController.deleteVisit);

// Export
router.get('/export/csv', visitsController.exportCSV);

// Analytics & Dashboard
router.get('/dashboard/kpi', analyticsController.getDashboardKPI);
router.get('/dashboard/charts', analyticsController.getChartsData);

// Expenses endpoints
router.get('/expenses', expensesController.getExpenses);
router.post('/expenses', expensesController.createExpense);
router.post('/expenses/:id/approve', expensesController.approveExpense);
router.post('/expenses/:id/reject', expensesController.rejectExpense);

// System Network info for mobile connectivity
router.get('/info', (req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  res.json({
    success: true,
    data: {
      lanIp: addresses[0] || 'localhost',
      allIps: addresses,
      port: process.env.PORT || 3000,
      serverTime: new Date().toISOString()
    }
  });
});

// Fast server-side reverse geocode endpoint
router.get('/geocode/reverse', async (req, res) => {
  try {
    const { lat, long } = req.query;
    if (!lat || !long) {
      return res.status(400).json({ success: false, error: 'Missing coordinates' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}&zoom=16&addressdetails=1`;
    const response = await fetch(osmUrl, {
      headers: { 'User-Agent': 'DTCMarketingApp/1.0 (info@dhakatimber.com)' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const areaParts = [
        addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.road,
        addr.city || addr.town || addr.district || addr.state_district
      ].filter(Boolean);

      const area = areaParts.length > 0 ? areaParts.join(', ') : (data.display_name ? data.display_name.split(',').slice(0, 2).join(',') : 'Dhaka');
      return res.json({ success: true, area });
    }
    res.json({ success: true, area: null });
  } catch (err) {
    res.json({ success: true, area: null });
  }
});

export default router;
