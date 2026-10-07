import { db } from '../config/database.js';

// Secret token for admin sessions
const ADMIN_TOKEN_KEY = 'DTC_ADMIN_AUTHENTICATED_SESSION';

export async function officerLogin(req, res) {
  try {
    const { memberId, pin } = req.body;

    if (!memberId) {
      return res.status(400).json({ success: false, error: 'Officer is required' });
    }
    if (!pin) {
      return res.status(400).json({ success: false, error: 'PIN is required' });
    }

    const member = await db.prepare('SELECT id, name, role, phone, pin, active FROM team_members WHERE id = ?').get(Number(memberId));

    if (!member || !member.active) {
      return res.status(404).json({ success: false, error: 'Officer not found or inactive' });
    }

    const officerPin = member.pin || '1234';
    if (String(pin).trim() !== String(officerPin).trim()) {
      return res.status(401).json({ success: false, error: 'Incorrect PIN. Default is 1234.' });
    }

    // Return officer session
    res.json({
      success: true,
      officer: {
        id: member.id,
        name: member.name,
        role: member.role,
        phone: member.phone
      },
      token: `officer_${member.id}`
    });
  } catch (error) {
    console.error('Error in officerLogin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function adminLogin(req, res) {
  try {
    const { adminPin } = req.body;

    if (!adminPin) {
      return res.status(400).json({ success: false, error: 'Admin PIN is required' });
    }

    const row = await db.prepare("SELECT value FROM app_settings WHERE key = 'admin_pin'").get();
    const currentAdminPin = row ? row.value : '8888';

    if (String(adminPin).trim() !== String(currentAdminPin).trim()) {
      return res.status(401).json({ success: false, error: 'Incorrect Admin PIN' });
    }

    res.json({
      success: true,
      isAdmin: true,
      token: ADMIN_TOKEN_KEY
    });
  } catch (error) {
    console.error('Error in adminLogin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function changeAdminPin(req, res) {
  try {
    const { oldPin, newPin } = req.body;

    if (!newPin || String(newPin).trim().length < 4) {
      return res.status(400).json({ success: false, error: 'New PIN must be at least 4 digits' });
    }

    const row = await db.prepare("SELECT value FROM app_settings WHERE key = 'admin_pin'").get();
    const currentAdminPin = row ? row.value : '8888';

    if (String(oldPin).trim() !== String(currentAdminPin).trim()) {
      return res.status(401).json({ success: false, error: 'Current Admin PIN is incorrect' });
    }

    await db.prepare("UPDATE app_settings SET value = ? WHERE key = 'admin_pin'").run(String(newPin).trim());

    res.json({ success: true, message: 'Admin PIN updated successfully' });
  } catch (error) {
    console.error('Error in changeAdminPin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function changeOfficerPin(req, res) {
  try {
    const { memberId, oldPin, newPin } = req.body;

    if (!newPin || String(newPin).trim().length < 4) {
      return res.status(400).json({ success: false, error: 'New PIN must be at least 4 digits' });
    }

    const member = await db.prepare('SELECT pin FROM team_members WHERE id = ?').get(Number(memberId));

    if (!member) {
      return res.status(404).json({ success: false, error: 'Officer not found' });
    }

    const currentPin = member.pin || '1234';
    if (String(oldPin).trim() !== String(currentPin).trim()) {
      return res.status(401).json({ success: false, error: 'Current PIN is incorrect' });
    }

    await db.prepare('UPDATE team_members SET pin = ? WHERE id = ?').run(String(newPin).trim(), Number(memberId));

    res.json({ success: true, message: 'Officer PIN updated successfully' });
  } catch (error) {
    console.error('Error in changeOfficerPin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Middleware helper to check if requester is Admin
export function verifyIsAdmin(req) {
  const token = req.headers['x-admin-token'] || req.query.adminToken;
  return token === ADMIN_TOKEN_KEY;
}
