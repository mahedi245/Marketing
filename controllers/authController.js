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

    const member = await db.prepare('SELECT id, name, role, phone, pin, active, photo_data FROM team_members WHERE id = ?').get(Number(memberId));

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
        phone: member.phone,
        photo_data: member.photo_data
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
    const currentAdminPin = row ? row.value : '25800';

    if (String(adminPin).trim() !== String(currentAdminPin).trim()) {
      return res.status(401).json({ success: false, error: 'Incorrect Admin PIN' });
    }

    const photoRow = await db.prepare("SELECT value FROM app_settings WHERE key = 'admin_photo_data'").get();
    const photoData = photoRow ? photoRow.value : null;

    res.json({
      success: true,
      isAdmin: true,
      token: ADMIN_TOKEN_KEY,
      photoData
    });
  } catch (error) {
    console.error('Error in adminLogin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateAdminProfile(req, res) {
  try {
    const { oldPin, newPin, photoData } = req.body;

    const row = await db.prepare("SELECT value FROM app_settings WHERE key = 'admin_pin'").get();
    const currentAdminPin = row ? row.value : '25800';

    if (String(oldPin).trim() !== String(currentAdminPin).trim()) {
      return res.status(401).json({ success: false, error: 'Current Admin PIN is incorrect' });
    }

    if (newPin && String(newPin).trim().length >= 4) {
      await db.prepare("UPDATE app_settings SET value = ? WHERE key = 'admin_pin'").run(String(newPin).trim());
    }

    if (photoData !== undefined) {
      const checkAdminPhoto = await db.prepare("SELECT value FROM app_settings WHERE key = 'admin_photo_data'").get();
      if (!checkAdminPhoto) {
        await db.prepare("INSERT INTO app_settings (key, value) VALUES ('admin_photo_data', ?)").run(photoData);
      } else {
        await db.prepare("UPDATE app_settings SET value = ? WHERE key = 'admin_photo_data'").run(photoData);
      }
    }

    res.json({ success: true, message: 'Admin Profile updated successfully' });
  } catch (error) {
    console.error('Error in updateAdminProfile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateOfficerProfile(req, res) {
  try {
    const { memberId, oldPin, newPin, photoData } = req.body;

    const member = await db.prepare('SELECT pin FROM team_members WHERE id = ?').get(Number(memberId));
    if (!member) {
      return res.status(404).json({ success: false, error: 'Officer not found' });
    }

    const currentPin = member.pin || '1234';
    if (String(oldPin).trim() !== String(currentPin).trim()) {
      return res.status(401).json({ success: false, error: 'Current PIN is incorrect' });
    }

    let query = 'UPDATE team_members SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (newPin && String(newPin).trim().length >= 4) {
      query += ', pin = ?';
      params.push(String(newPin).trim());
    }

    if (photoData !== undefined) {
       query += ', photo_data = ?';
       params.push(photoData);
    }

    query += ' WHERE id = ?';
    params.push(Number(memberId));

    await db.prepare(query).run(...params);

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error in updateOfficerProfile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Middleware helper to check if requester is Admin
export function verifyIsAdmin(req) {
  const token = req.headers['x-admin-token'] || req.query.adminToken;
  return token === ADMIN_TOKEN_KEY;
}
