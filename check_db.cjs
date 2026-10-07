const Database = require('node:sqlite').DatabaseSync;
const db = new Database('D:/Marketing/data/marketing.db');

const app_settings = db.prepare('SELECT * FROM app_settings').all();
console.log('--- ADMIN SETTINGS ---');
console.log(app_settings);

const members = db.prepare('SELECT id, name, pin, active FROM team_members').all();
console.log('--- TEAM MEMBERS ---');
console.log(members);
