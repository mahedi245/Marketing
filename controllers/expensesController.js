import { db } from '../config/database.js';
import { verifyIsAdmin } from './authController.js';

export async function getExpenses(req, res) {
  try {
    const isAdmin = verifyIsAdmin(req);
    const officerId = req.headers['x-officer-id'] || req.query.officerId;

    let whereSql = '';
    const params = [];

    if (!isAdmin) {
      if (!officerId) {
        return res.status(403).json({ success: false, error: 'Access denied.' });
      }
      whereSql = 'WHERE e.member_id = ?';
      params.push(Number(officerId));
    } else if (req.query.memberId) {
      whereSql = 'WHERE e.member_id = ?';
      params.push(Number(req.query.memberId));
    }

    const expenses = await db.prepare(`
      SELECT e.*, m.name as member_name
      FROM expenses e
      JOIN team_members m ON e.member_id = m.id
      ${whereSql}
      ORDER BY e.expense_date DESC
    `).all(...params);

    res.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Error in getExpenses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createExpense(req, res) {
  try {
    const { member_id, visit_id, amount, description, category, expense_date } = req.body;

    // Check ownership
    const isAdmin = verifyIsAdmin(req);
    const officerId = req.headers['x-officer-id'] || req.query.officerId;

    if (!isAdmin && Number(member_id) !== Number(officerId)) {
        return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const result = await db.prepare(`
      INSERT INTO expenses (member_id, visit_id, amount, description, category, expense_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(Number(member_id), visit_id ? Number(visit_id) : null, Number(amount), description, category, expense_date);

    // If it's a visit-related expense, we keep the link established by visit_id.

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    console.error('Error in createExpense:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function approveExpense(req, res) {
  try {
    const isAdmin = verifyIsAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }
    const { id } = req.params;
    await db.prepare('UPDATE expenses SET status = ? WHERE id = ?').run('Approved', Number(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function rejectExpense(req, res) {
  try {
    const isAdmin = verifyIsAdmin(req);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized.' });
    }
    const { id } = req.params;
    await db.prepare('UPDATE expenses SET status = ? WHERE id = ?').run('Rejected', Number(id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
