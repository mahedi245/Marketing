import { db } from '../config/database.js';

export async function seedInitialData() {
  const memberCountStmt = await db.prepare('SELECT COUNT(*) as count FROM team_members').get();
  const count = memberCountStmt ? memberCountStmt.count : 0;

  if (count > 0) {
    return; // Already seeded or has data
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
    },
    {
      member_id: memberIds[1],
      customer_name: 'Kabir Hossain',
      site_name: 'Apex Footwear Central Depot',
      address: 'Joydebpur Road, Gazipur',
      phone_number: '01819-223388',
      daysAgo: 0,
      status: 'Need Quotation',
      notes: 'Meeting with Procurement Manager. Send formal quotation by tomorrow.',
      followUpDays: 1
    },
    {
      member_id: memberIds[2],
      customer_name: 'Dr. Shahriar Rahman',
      site_name: 'Delta Care Hospital Annex',
      address: 'Mirpur-10, Dhaka',
      phone_number: '01912-776655',
      daysAgo: 1,
      status: 'Follow-up',
      notes: 'Initial presentation done. Need follow-up meeting with Managing Director.',
      followUpDays: 4
    },
    {
      member_id: memberIds[3],
      customer_name: 'Mizanur Rahman',
      site_name: 'Padma Textile Mills',
      address: 'Bhairab Road, Narayanganj',
      phone_number: '01611-334499',
      daysAgo: 2,
      status: 'Closed/Won',
      notes: 'Deal finalized for 6 months bulk order contract. Signed work order.',
      followUpDays: null
    },
    {
      member_id: memberIds[4],
      customer_name: 'Anisul Haque',
      site_name: 'Crown Properties Ltd',
      address: 'Sector 4, Uttara, Dhaka',
      phone_number: '01712-445588',
      daysAgo: 2,
      status: 'Need Quotation',
      notes: 'Quotation requested for 500 units.',
      followUpDays: 2
    },
    {
      member_id: memberIds[5],
      customer_name: 'Zahangir Alam',
      site_name: 'Dhaka Super Market Syndicate',
      address: 'Kaptan Bazar, Motijheel, Dhaka',
      phone_number: '01815-112299',
      daysAgo: 3,
      status: 'Interested',
      notes: 'Positive meeting, requested product sample pack.',
      followUpDays: 5
    },
    {
      member_id: memberIds[6],
      customer_name: 'Mustafa Kamal',
      site_name: 'Eastern Housing Plaza',
      address: 'Kakrail, Dhaka',
      phone_number: '01914-332211',
      daysAgo: 4,
      status: 'Follow-up',
      notes: 'Decision pending on board approval.',
      followUpDays: 7
    },
    {
      member_id: memberIds[7],
      customer_name: 'Nazmul Huda',
      site_name: 'Bengal Plastic Warehousing',
      address: 'Tejgaon I/A, Dhaka',
      phone_number: '01511-665544',
      daysAgo: 5,
      status: 'Not Interested',
      notes: 'Currently working with alternative existing vendor.',
      followUpDays: null
    },
    {
      member_id: memberIds[8],
      customer_name: 'Tareq Mahmud',
      site_name: 'Navana Heights',
      address: 'Gulshan 2, Dhaka',
      phone_number: '01713-998877',
      daysAgo: 6,
      status: 'Closed/Won',
      notes: 'Advance payment received. Delivery scheduled next week.',
      followUpDays: null
    },
    {
      member_id: memberIds[9],
      customer_name: 'Shamim Osman',
      site_name: 'Rupali Real Estate',
      address: 'Dhanmondi 27, Dhaka',
      phone_number: '01812-554433',
      daysAgo: 7,
      status: 'Interested',
      notes: 'Very interested in our new catalog. Follow-up after Eid holidays.',
      followUpDays: 6
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

  console.log(`[Database] Successfully seeded ${initialMembers.length} team members and ${sampleVisits.length} visit logs.`);
}
