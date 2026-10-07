import { db } from '../config/database.js';
import { verifyIsAdmin } from './authController.js';

export async function getVisits(req, res) {
  try {
    const isAdmin = verifyIsAdmin(req);
    const officerId = req.headers['x-officer-id'] || req.query.officerId;

    let effectiveMemberId = req.query.memberId;
    if (!isAdmin) {
      if (!officerId) {
        return res.status(403).json({ success: false, error: 'Access denied. Please select your officer profile or unlock Admin access.' });
      }
      effectiveMemberId = Number(officerId); // Strictly force to this officer's own records
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const {
      search,
      status,
      startDate,
      endDate,
      followUpOnly,
      sortBy = 'visit_date',
      sortOrder = 'DESC'
    } = req.query;

    const whereClauses = [];
    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push(`(
        v.customer_name LIKE ? OR
        v.site_name LIKE ? OR
        v.address LIKE ? OR
        v.phone_number LIKE ? OR
        v.notes LIKE ?
      )`);
      params.push(term, term, term, term, term);
    }

    if (effectiveMemberId) {
      whereClauses.push('v.member_id = ?');
      params.push(Number(effectiveMemberId));
    }

    if (status) {
      whereClauses.push('v.status = ?');
      params.push(status);
    }

    if (startDate) {
      whereClauses.push('v.visit_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('v.visit_date <= ?');
      params.push(endDate);
    }

    if (followUpOnly === 'true') {
      whereClauses.push('v.next_follow_up_date IS NOT NULL AND v.next_follow_up_date != ""');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matching
    const countSql = `
      SELECT COUNT(*) as total
      FROM visits v
      JOIN team_members m ON v.member_id = m.id
      ${whereSql}
    `;
    const countRes = await db.prepare(countSql).get(...params);
    const total = countRes ? countRes.total : 0;

    // Validate safe sort columns
    const allowedSortColumns = {
      visit_date: 'v.visit_date',
      customer_name: 'v.customer_name',
      site_name: 'v.site_name',
      status: 'v.status',
      created_at: 'v.created_at',
      member_name: 'm.name'
    };
    const sortCol = allowedSortColumns[sortBy] || 'v.visit_date';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Query data
    const querySql = `
      SELECT
        v.id,
        v.member_id,
        m.name as member_name,
        m.role as member_role,
        v.customer_name,
        v.site_name,
        v.address,
        v.phone_number,
        v.visit_date,
        v.status,
        v.notes,
        v.next_follow_up_date,
        v.created_at
      FROM visits v
      JOIN team_members m ON v.member_id = m.id
      ${whereSql}
      ORDER BY ${sortCol} ${sortDir}, v.id DESC
      LIMIT ? OFFSET ?
    `;

    const data = await db.prepare(querySql).all(...params, limit, offset);

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getVisits:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getVisitById(req, res) {
  try {
    const { id } = req.params;
    const visit = await db.prepare(`
      SELECT
        v.*,
        m.name as member_name,
        m.role as member_role
      FROM visits v
      JOIN team_members m ON v.member_id = m.id
      WHERE v.id = ?
    `).get(Number(id));

    if (!visit) {
      return res.status(404).json({ success: false, error: 'Visit record not found' });
    }

    const isAdmin = verifyIsAdmin(req);
    const officerId = req.headers['x-officer-id'] || req.query.officerId;

    if (!isAdmin && Number(visit.member_id) !== Number(officerId)) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this record' });
    }

    res.json({ success: true, data: visit });
  } catch (error) {
    console.error('Error in getVisitById:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createVisit(req, res) {
  try {
    const {
      member_id,
      customer_name,
      site_name,
      address,
      phone_number,
      visit_date,
      status,
      notes,
      next_follow_up_date
    } = req.body;

    if (!member_id) {
      return res.status(400).json({ success: false, error: 'Marketing officer is required' });
    }
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }
    if (!site_name || !site_name.trim()) {
      return res.status(400).json({ success: false, error: 'Site/Company name is required' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, error: 'Address is required' });
    }
    if (!phone_number || !phone_number.trim()) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    if (!visit_date) {
      return res.status(400).json({ success: false, error: 'Visit date is required' });
    }
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const result = await db.prepare(`
      INSERT INTO visits (
        member_id,
        customer_name,
        site_name,
        address,
        phone_number,
        visit_date,
        status,
        notes,
        next_follow_up_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(member_id),
      customer_name.trim(),
      site_name.trim(),
      address.trim(),
      phone_number.trim(),
      visit_date,
      status,
      notes ? notes.trim() : '',
      next_follow_up_date || null
    );

    const newId = Number(result.lastInsertRowid);
    const newVisit = await db.prepare(`
      SELECT v.*, m.name as member_name
      FROM visits v
      JOIN team_members m ON v.member_id = m.id
      WHERE v.id = ?
    `).get(newId);

    res.status(201).json({ success: true, data: newVisit });
  } catch (error) {
    console.error('Error in createVisit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateVisit(req, res) {
  try {
    const { id } = req.params;
    const {
      member_id,
      customer_name,
      site_name,
      address,
      phone_number,
      visit_date,
      status,
      notes,
      next_follow_up_date
    } = req.body;

    // Check ownership or admin
    const existing = await db.prepare('SELECT member_id FROM visits WHERE id = ?').get(Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const isAdmin = verifyIsAdmin(req);
    const officerId = req.headers['x-officer-id'] || req.query.officerId;

    if (!isAdmin && Number(existing.member_id) !== Number(officerId)) {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    await db.prepare(`
      UPDATE visits SET
        member_id = ?,
        customer_name = ?,
        site_name = ?,
        address = ?,
        phone_number = ?,
        visit_date = ?,
        status = ?,
        notes = ?,
        next_follow_up_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      Number(member_id || existing.member_id),
      customer_name.trim(),
      site_name.trim(),
      address.trim(),
      phone_number.trim(),
      visit_date,
      status,
      notes ? notes.trim() : '',
      next_follow_up_date || null,
      Number(id)
    );

    const updated = await db.prepare(`
      SELECT v.*, m.name as member_name
      FROM visits v
      JOIN team_members m ON v.member_id = m.id
      WHERE v.id = ?
    `).get(Number(id));

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in updateVisit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteVisit(req, res) {
  try {
    const { id } = req.params;

    const existing = await db.prepare('SELECT member_id FROM visits WHERE id = ?').get(Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    const isAdmin = verifyIsAdmin(req);
    const officerId = req.headers['x-officer-id'] || req.query.officerId;

    if (!isAdmin && Number(existing.member_id) !== Number(officerId)) {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    await db.prepare('DELETE FROM visits WHERE id = ?').run(Number(id));
    res.json({ success: true, message: 'Visit record deleted successfully' });
  } catch (error) {
    console.error('Error in deleteVisit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function exportCSV(req, res) {
  try {
    const isAdmin = verifyIsAdmin(req);
    const officerId = req.headers['x-officer-id'] || req.query.officerId;

    let effectiveMemberId = req.query.memberId;
    if (!isAdmin) {
      if (!officerId) {
        return res.status(403).json({ success: false, error: 'Unauthorized export' });
      }
      effectiveMemberId = Number(officerId);
    }

    const {
      search,
      status,
      startDate,
      endDate
    } = req.query;

    const whereClauses = [];
    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push(`(
        v.customer_name LIKE ? OR
        v.site_name LIKE ? OR
        v.address LIKE ? OR
        v.phone_number LIKE ? OR
        v.notes LIKE ?
      )`);
      params.push(term, term, term, term, term);
    }

    if (effectiveMemberId) {
      whereClauses.push('v.member_id = ?');
      params.push(Number(effectiveMemberId));
    }

    if (status) {
      whereClauses.push('v.status = ?');
      params.push(status);
    }

    if (startDate) {
      whereClauses.push('v.visit_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('v.visit_date <= ?');
      params.push(endDate);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT
        v.id,
        v.visit_date,
        m.name as officer_name,
        v.customer_name,
        v.site_name,
        v.address,
        v.phone_number,
        v.status,
        v.notes,
        v.next_follow_up_date
      FROM visits v
      JOIN team_members m ON v.member_id = m.id
      ${whereSql}
      ORDER BY v.visit_date DESC, v.id DESC
    `;

    const rows = await db.prepare(sql).all(...params);

    const headers = [
      'ID',
      'Visit Date',
      'Marketing Officer',
      'Customer Name',
      'Site / Organization',
      'Address',
      'Phone Number',
      'Status',
      'Discussion Notes',
      'Next Follow-up Date'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = '﻿'; // UTF-8 BOM for Microsoft Excel
    csvContent += headers.map(escapeCsv).join(',') + '\r\n';

    for (const r of rows) {
      const row = [
        r.id,
        r.visit_date,
        r.officer_name,
        r.customer_name,
        r.site_name,
        r.address,
        r.phone_number,
        r.status,
        r.notes,
        r.next_follow_up_date || 'N/A'
      ];
      csvContent += row.map(escapeCsv).join(',') + '\r\n';
    }

    const filename = `DTC_marketing_visits_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error in exportCSV:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
