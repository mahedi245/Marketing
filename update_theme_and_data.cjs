const fs = require('fs');
const path = require('path');
const Database = require('node:sqlite').DatabaseSync;

const BASE = 'D:/Marketing';

// 1. UPDATE THEME COLORS IN FILES
const filesToUpdate = [
  'public/index.html',
  'public/css/custom.css',
  'public/js/app.js',
  'public/js/entry.js',
  'public/js/dashboard.js',
  'public/js/team.js'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(BASE, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace Tailwind specific red classes with blue/navy equivalents
  content = content
    .replace(/red-500/g, 'blue-500')
    .replace(/red-600/g, 'blue-600')
    .replace(/red-700/g, 'blue-700')
    .replace(/red-800/g, 'blue-800')
    .replace(/red-900/g, 'slate-800') // for subtle dark backgrounds, slate fits navy better than blue-900
    .replace(/red-950/g, 'slate-900') 
    .replace(/red-400/g, 'blue-400')
    .replace(/red-300/g, 'blue-300')
    .replace(/red-200/g, 'blue-200')
    .replace(/red-100/g, 'blue-100')
    
    // Rose (often used in the previous design for highlights) -> Cyan
    .replace(/rose-500/g, 'cyan-500')
    .replace(/rose-400/g, 'cyan-400')
    .replace(/rose-900/g, 'cyan-900')
    .replace(/rose-950/g, 'cyan-950')
    
    // Hex colors in JS charts and CSS variables
    .replace(/dc2626/g, '2563eb') // deep red -> blue-600
    .replace(/e11d48/g, '3b82f6') // rose rgb -> blue-500
    .replace(/220, 38, 38/g, '37, 99, 235') // rgba red -> rgba blue
    
    // Custom names
    .replace(/red-glow/g, 'blue-glow');

  fs.writeFileSync(filePath, content);
});

// Fix any custom.css specific red-glow class name if partially replaced
const cssPath = path.join(BASE, 'public/css/custom.css');
if (fs.existsSync(cssPath)) {
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  cssContent = cssContent.replace('--dtc-red-', '--dtc-blue-');
  cssContent = cssContent.replace('text-dtc-red', 'text-dtc-blue');
  cssContent = cssContent.replace('bg-dtc-red', 'bg-dtc-blue');
  cssContent = cssContent.replace('border-dtc-red', 'border-dtc-blue');
  fs.writeFileSync(cssPath, cssContent);
}

// 2. INSERT 10 DUMMY RECORDS
const dbPath = path.join(BASE, 'data/marketing.db');
const db = new Database(dbPath);

// Ensure there is at least one team member, otherwise create one
let member = db.prepare('SELECT id FROM team_members LIMIT 1').get();
if (!member) {
  const insertRole = db.prepare('INSERT INTO team_members (name, role, phone, pin, active) VALUES (?, ?, ?, ?, ?)');
  const res = insertRole.run('Arifur Rahman', 'Marketing Manager', '01711223344', '1234', 1);
  member = { id: res.lastInsertRowid };
}

const dummyData = [
  { c: 'Rahim Traders', s: 'Gulshan Branch', a: 'Gulshan 1, Dhaka', p: '01811-111111', st: 'Interested', d: '0' },
  { c: 'Karim Enterprise', s: 'Mohakhali Project', a: 'Mohakhali DOHS', p: '01922-222222', st: 'Follow-up', d: '1' },
  { c: 'Anwar Group', s: 'Head Office', a: 'Motijheel, Dhaka', p: '01733-333333', st: 'Need Quotation', d: '2' },
  { c: 'Bengal Plastics', s: 'Tejgaon Factory', a: 'Tejgaon I/A', p: '01544-444444', st: 'Closed/Won', d: '3' },
  { c: 'RFL Showroom', s: 'Badda Outlet', a: 'Middle Badda, Dhaka', p: '01655-555555', st: 'Not Interested', d: '4' },
  { c: 'Jamuna Builders', s: 'Bashundhara Site', a: 'Block C, Bashundhara', p: '01766-666666', st: 'Interested', d: '5' },
  { c: 'Navana Real Estate', s: 'Banani Tower', a: 'Road 11, Banani', p: '01877-777777', st: 'Follow-up', d: '6' },
  { c: 'Meghna Group', s: 'Corporate Office', a: 'Gulshan 2, Dhaka', p: '01988-888888', st: 'Need Quotation', d: '7' },
  { c: 'City Bank', s: 'Dhanmondi Branch', a: 'Satmasjid Road', p: '01799-999999', st: 'Closed/Won', d: '8' },
  { c: 'Walton Plaza', s: 'Mirpur 10 Outlet', a: 'Mirpur 10 Golchottor', p: '01500-000000', st: 'Follow-up', d: '9' }
];

const insertVisit = db.prepare(`
  INSERT INTO visits (member_id, customer_name, site_name, address, phone_number, visit_date, status, notes)
  VALUES (?, ?, ?, ?, ?, date('now', '-' || ? || ' days'), ?, ?)
`);

let count = 0;
dummyData.forEach(item => {
  insertVisit.run(
    member.id,
    item.c,
    item.s,
    item.a,
    item.p,
    item.d,
    item.st,
    `Discussed new products and corporate packages with ${item.c}. Client seems responsive.`
  );
  count++;
});

console.log('SUCCESS: Theme updated to Navy Blue and ' + count + ' dummy records inserted.');
