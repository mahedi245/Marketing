import { db } from '../config/database.js';
import { verifyIsAdmin } from './authController.js';

export async function getDashboardKPI(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7); // YYYY-MM
    const isAdmin = verifyIsAdmin(req);
    const officerId = req.headers['x-officer-id'] || req.query.officerId;

    if (!isAdmin && !officerId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (isAdmin) {
      // Global Company KPIs for Admin using combined single-query conditional aggregation
      const [countsRes, topPerformer, statusCounts] = await Promise.all([
        db.prepare(`
          SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN visit_date = ? THEN 1 END) as today,
            COUNT(CASE WHEN strftime('%Y-%m', visit_date) = ? THEN 1 END) as thisMonth,
            COUNT(CASE WHEN status = 'Closed/Won' THEN 1 END) as closedWon,
            COUNT(CASE WHEN next_follow_up_date IS NOT NULL AND next_follow_up_date >= ? THEN 1 END) as pending
          FROM visits
        `).get(today, currentMonth, today),
        db.prepare(`
          SELECT m.id, m.name, COUNT(v.id) as visit_count
          FROM visits v
          JOIN team_members m ON v.member_id = m.id
          GROUP BY m.id
          ORDER BY visit_count DESC
          LIMIT 1
        `).get(),
        db.prepare(`
          SELECT status, COUNT(*) as count
          FROM visits
          GROUP BY status
        `).all()
      ]);

      const totalVisits = countsRes ? countsRes.total : 0;
      const visitsToday = countsRes ? countsRes.today : 0;
      const visitsThisMonth = countsRes ? countsRes.thisMonth : 0;
      const closedWonCount = countsRes ? countsRes.closedWon : 0;
      const pendingFollowUps = countsRes ? countsRes.pending : 0;

      return res.json({
        success: true,
        data: {
          isAdmin: true,
          totalVisits,
          visitsToday,
          visitsThisMonth,
          closedWonCount,
          pendingFollowUps,
          topPerformer: topPerformer || { name: 'None', visit_count: 0 },
          statusCounts
        }
      });
    } else {
      // Officer's Personal KPIs (My Stats) - combined single query
      const mId = Number(officerId);

      const countsRes = await db.prepare(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN visit_date = ? THEN 1 END) as today,
          COUNT(CASE WHEN strftime('%Y-%m', visit_date) = ? THEN 1 END) as thisMonth,
          COUNT(CASE WHEN status = 'Closed/Won' THEN 1 END) as closedWon,
          COUNT(CASE WHEN next_follow_up_date IS NOT NULL AND next_follow_up_date >= ? THEN 1 END) as pending
        FROM visits
        WHERE member_id = ?
      `).get(today, currentMonth, today, mId);

      return res.json({
        success: true,
        data: {
          isAdmin: false,
          totalVisits: countsRes ? countsRes.total : 0,
          visitsToday: countsRes ? countsRes.today : 0,
          visitsThisMonth: countsRes ? countsRes.thisMonth : 0,
          closedWonCount: countsRes ? countsRes.closedWon : 0,
          pendingFollowUps: countsRes ? countsRes.pending : 0
        }
      });
    }
  } catch (error) {
    console.error('Error in getDashboardKPI:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getChartsData(req, res) {
  try {
    const isAdmin = verifyIsAdmin(req);
    const officerId = req.headers['x-officer-id'] || req.query.officerId;

    if (!isAdmin && !officerId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (isAdmin) {
      // Global charts running concurrently
      const [trendData, statusData, memberData] = await Promise.all([
        db.prepare(`
          SELECT visit_date, COUNT(*) as count
          FROM visits
          WHERE visit_date >= date('now', '-30 days')
          GROUP BY visit_date
          ORDER BY visit_date ASC
        `).all(),
        db.prepare(`
          SELECT status, COUNT(*) as count
          FROM visits
          GROUP BY status
          ORDER BY count DESC
        `).all(),
        db.prepare(`
          SELECT m.name, COUNT(v.id) as count
          FROM team_members m
          LEFT JOIN visits v ON m.id = v.member_id
          WHERE m.active = 1
          GROUP BY m.id
          ORDER BY count DESC
          LIMIT 10
        `).all()
      ]);

      return res.json({
        success: true,
        data: {
          trend: trendData,
          statusDistribution: statusData,
          memberPerformance: memberData
        }
      });
    } else {
      // Officer's Personal charts running concurrently
      const mId = Number(officerId);

      const [trendData, statusData] = await Promise.all([
        db.prepare(`
          SELECT visit_date, COUNT(*) as count
          FROM visits
          WHERE member_id = ? AND visit_date >= date('now', '-30 days')
          GROUP BY visit_date
          ORDER BY visit_date ASC
        `).all(mId),
        db.prepare(`
          SELECT status, COUNT(*) as count
          FROM visits
          WHERE member_id = ?
          GROUP BY status
          ORDER BY count DESC
        `).all(mId)
      ]);

      return res.json({
        success: true,
        data: {
          trend: trendData,
          statusDistribution: statusData,
          memberPerformance: []
        }
      });
    }
  } catch (error) {
    console.error('Error in getChartsData:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
