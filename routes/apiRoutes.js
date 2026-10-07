import { Router } from 'express';
import os from 'node:os';
import * as teamController from '../controllers/teamController.js';
import * as visitsController from '../controllers/visitsController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as authController from '../controllers/authController.js';

const router = Router();

// Authentication endpoints
router.post('/auth/officer-login', authController.officerLogin);
router.post('/auth/admin-login', authController.adminLogin);
router.post('/auth/change-admin-pin', authController.changeAdminPin);
router.post('/auth/change-officer-pin', authController.changeOfficerPin);

// Team endpoints
router.get('/team', teamController.getTeam);
router.post('/team', teamController.createMember);
router.put('/team/:id', teamController.updateMember);
router.delete('/team/:id', teamController.deleteMember);

// Visits endpoints
router.get('/visits', visitsController.getVisits);
router.post('/visits', visitsController.createVisit);
router.get('/visits/:id', visitsController.getVisitById);
router.put('/visits/:id', visitsController.updateVisit);
router.delete('/visits/:id', visitsController.deleteVisit);

// Export
router.get('/export/csv', visitsController.exportCSV);

// Analytics & Dashboard
router.get('/dashboard/kpi', analyticsController.getDashboardKPI);
router.get('/dashboard/charts', analyticsController.getChartsData);

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

export default router;
