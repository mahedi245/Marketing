import { db } from '../config/database.js';

export async function seedInitialData() {
  const seeded = await db.prepare("SELECT value FROM app_settings WHERE key = 'demo_seeded'").get();
  if (seeded) {
    return; // Already initialized once
  }

  const memberCountStmt = await db.prepare('SELECT COUNT(*) as count FROM team_members').get();
  const count = memberCountStmt ? memberCountStmt.count : 0;

  if (count > 0) {
    await db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('demo_seeded', '1')").run();
    return;
  }

  console.log('[Database] Seeding initial 10 marketing team members and sample visits...');

  const initialMembers = [
    { name: 'Tanvir Ahmed', phone: '01711-223344', email: 'tanvir@marketing.com', role: 'Senior Executive', active: 1 },
    { name: 'Rafiqul Islam', phone: '01819-334455', email: 'rafiq@marketing.com', role: 'Marketing Officer', active: 1 },
    { name: 'Nusrat Jahan', phone: '01912-445566', email: 'nusrat@marketing.com', role: 'Field Specialist', active: 1 },
    { name: 'Shakib Al Hasan', phone: '01611-556677', email: 'shakib@marketing.com', role: 'Territory Officer', active: 1 },
    { name: 'Mehedi Hasan', phone: '01712-667788', email: 'mehedi@marketing.com', role: 'Marketing Officer', active: 1 },
    { name: 'Farhana Akter', phone: '01815-778899', email: 'farhana@marketing.com', role: 'Relationship Executive', active: 1 },
    { name: 'Kamrul Hassan', phone: '01914-889900', email: 'kamrul@marketing.com', role: 'Field Officer', active: 1 },
    { name: 'Arifur Rahman', phone: '01511-990011', email: 'arif@marketing.com', role: 'Marketing Associate', active: 1 },
    { name: 'Sajid Khan', phone: '01713-112233', email: 'sajid@marketing.com', role: 'Field Officer', active: 1 },
    { name: 'Sumaiya Kabir', phone: '01812-223344', email: 'sumaiya@marketing.com', role: 'Senior Executive', active: 1 }
  ];

  const memberIds = [];
  for (const m of initialMembers) {
    const result = await db.prepare(`
      INSERT INTO team_members (name, phone, email, role, active)
      VALUES (?, ?, ?, ?, ?)
    `).run(m.name, m.phone, m.email, m.role, m.active);
    memberIds.push(Number(result.lastInsertRowid));
  }

  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];

  const sampleVisits = [
    {
      member_id: memberIds[0],
      customer_name: 'Engr. Mahbubul Alam',
      site_name: 'Green City Project',
      address: 'Plot 45, Road 11, Banani, Dhaka',
      phone_number: '01711-889900',
      daysAgo: 0,
      status: 'Interested',
      notes: 'Discussed material supplies. Client requested brochure and price estimate.',
      followUpDays: 3
    }
  ];

  for (const visit of sampleVisits) {
    const vDate = new Date(today);
    vDate.setDate(today.getDate() - visit.daysAgo);

    let fDate = null;
    if (visit.followUpDays !== null) {
      const followDate = new Date(today);
      followDate.setDate(today.getDate() + visit.followUpDays);
      fDate = formatDate(followDate);
    }

    await db.prepare(`
      INSERT INTO visits (member_id, customer_name, site_name, address, phone_number, visit_date, status, notes, next_follow_up_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      visit.member_id,
      visit.customer_name,
      visit.site_name,
      visit.address,
      visit.phone_number,
      formatDate(vDate),
      visit.status,
      visit.notes,
      fDate
    );
  }

  await db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('demo_seeded', '1')").run();
  console.log(`[Database] Successfully seeded initial demo data.`);
}
