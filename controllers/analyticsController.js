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
      // Global Company KPIs for Admin using Promise.all for parallel queries
      const [totalRes, todayRes, monthRes, wonRes, followUpRes, topPerformer, statusCounts] = await Promise.all([
        db.prepare('SELECT COUNT(*) as total FROM visits').get(),
        db.prepare('SELECT COUNT(*) as today FROM visits WHERE visit_date = ?').get(today),
        db.prepare("SELECT COUNT(*) as thisMonth FROM visits WHERE strftime('%Y-%m', visit_date) = ?").get(currentMonth),
        db.prepare("SELECT COUNT(*) as closedWon FROM visits WHERE status = 'Closed/Won'").get(),
        db.prepare('SELECT COUNT(*) as pending FROM visits WHERE next_follow_up_date IS NOT NULL AND next_follow_up_date >= ?').get(today),
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

      const totalVisits = totalRes ? totalRes.total : 0;
      const visitsToday = todayRes ? todayRes.today : 0;
      const visitsThisMonth = monthRes ? monthRes.thisMonth : 0;
      const closedWonCount = wonRes ? wonRes.closedWon : 0;
      const pendingFollowUps = followUpRes ? followUpRes.pending : 0;

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
      // Officer's Personal KPIs (My Stats)
      const mId = Number(officerId);

      const [totalRes, todayRes, monthRes, wonRes, followUpRes] = await Promise.all([
        db.prepare('SELECT COUNT(*) as total FROM visits WHERE member_id = ?').get(mId),
        db.prepare('SELECT COUNT(*) as today FROM visits WHERE member_id = ? AND visit_date = ?').get(mId, today),
        db.prepare("SELECT COUNT(*) as thisMonth FROM visits WHERE member_id = ? AND strftime('%Y-%m', visit_date) = ?").get(mId, currentMonth),
        db.prepare("SELECT COUNT(*) as closedWon FROM visits WHERE member_id = ? AND status = 'Closed/Won'").get(mId),
        db.prepare('SELECT COUNT(*) as pending FROM visits WHERE member_id = ? AND next_follow_up_date IS NOT NULL AND next_follow_up_date >= ?').get(mId, today)
      ]);

      return res.json({
        success: true,
        data: {
          isAdmin: false,
          totalVisits: totalRes ? totalRes.total : 0,
          visitsToday: todayRes ? todayRes.today : 0,
          visitsThisMonth: monthRes ? monthRes.thisMonth : 0,
          closedWonCount: wonRes ? wonRes.closedWon : 0,
          pendingFollowUps: followUpRes ? followUpRes.pending : 0
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
      // Global charts
      const trendData = await db.prepare(`
        SELECT visit_date, COUNT(*) as count
        FROM visits
        WHERE visit_date >= date('now', '-30 days')
        GROUP BY visit_date
        ORDER BY visit_date ASC
      `).all();

      const statusData = await db.prepare(`
        SELECT status, COUNT(*) as count
        FROM visits
        GROUP BY status
        ORDER BY count DESC
      `).all();

      const memberData = await db.prepare(`
        SELECT m.name, COUNT(v.id) as count
        FROM team_members m
        LEFT JOIN visits v ON m.id = v.member_id
        WHERE m.active = 1
        GROUP BY m.id
        ORDER BY count DESC
        LIMIT 10
      `).all();

      return res.json({
        success: true,
        data: {
          trend: trendData,
          statusDistribution: statusData,
          memberPerformance: memberData
        }
      });
    } else {
      // Officer's Personal charts
      const mId = Number(officerId);

      const trendData = await db.prepare(`
        SELECT visit_date, COUNT(*) as count
        FROM visits
        WHERE member_id = ? AND visit_date >= date('now', '-30 days')
        GROUP BY visit_date
        ORDER BY visit_date ASC
      `).all(mId);

      const statusData = await db.prepare(`
        SELECT status, COUNT(*) as count
        FROM visits
        WHERE member_id = ?
        GROUP BY status
        ORDER BY count DESC
      `).all(mId);

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
