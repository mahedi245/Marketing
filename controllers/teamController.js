import { db } from '../config/database.js';

export async function getTeam(req, res) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const query = `
      SELECT
        m.id,
        m.name,
        m.phone,
        m.email,
        m.role,
        m.active,
        m.created_at,
        m.photo_data,
        COUNT(v.id) as total_visits
      FROM team_members m
      LEFT JOIN visits v ON m.id = v.member_id
      ${includeInactive ? '' : 'WHERE m.active = 1'}
      GROUP BY m.id
      ORDER BY m.name ASC
    `;
    const members = await db.prepare(query).all();
    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error in getTeam:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createMember(req, res) {
  try {
    const { name, phone, email, role, pin } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const officerPin = pin && pin.trim() ? pin.trim() : '1234';

    const result = await db.prepare(`
      INSERT INTO team_members (name, phone, email, role, pin, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(name.trim(), phone?.trim() || '', email?.trim() || '', role?.trim() || 'Marketing Officer', officerPin);

    const memberId = Number(result.lastInsertRowid);
    const newMember = await db.prepare('SELECT * FROM team_members WHERE id = ?').get(memberId);

    res.status(201).json({ success: true, data: newMember });
  } catch (error) {
    console.error('Error in createMember:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateMember(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, email, role, active, pin, photo_data } = req.body;

    // Fetch existing member to handle partial updates (like toggle status)
    const existing = await db.prepare('SELECT * FROM team_members WHERE id = ?').get(Number(id));
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const finalName = name !== undefined ? name.trim() : existing.name;
    if (!finalName) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    // Prepare update parameters
    const params = [
      finalName,
      phone !== undefined ? phone.trim() : (existing.phone || ''),
      email !== undefined ? email.trim() : (existing.email || ''),
      role !== undefined ? role.trim() : (existing.role || 'Marketing Officer'),
      active !== undefined ? (active ? 1 : 0) : existing.active,
      photo_data !== undefined ? photo_data : existing.photo_data
    ];

    let query = `
      UPDATE team_members
      SET name = ?, phone = ?, email = ?, role = ?, active = ?, photo_data = ?, updated_at = CURRENT_TIMESTAMP
    `;

    if (pin && pin.trim()) {
      query += `, pin = ? `;
      params.push(pin.trim());
    }

    query += ` WHERE id = ?`;
    params.push(Number(id));

    await db.prepare(query).run(...params);
    const updated = await db.prepare('SELECT * FROM team_members WHERE id = ?').get(Number(id));

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in updateMember:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function deleteMember(req, res) {
  try {
    const { id } = req.params;
    const memberId = Number(id);

    // Check if member has visits
    const { count } = await db.prepare('SELECT COUNT(*) as count FROM visits WHERE member_id = ?').get(memberId);

    if (count > 0) {
      // Soft delete to protect history
      await db.prepare('UPDATE team_members SET active = 0 WHERE id = ?').run(memberId);
      return res.json({ success: true, message: 'Member deactivated (has existing visit records)' });
    } else {
      // Hard delete
      await db.prepare('DELETE FROM team_members WHERE id = ?').run(memberId);
      return res.json({ success: true, message: 'Member deleted permanently' });
    }
  } catch (error) {
    console.error('Error in deleteMember:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
