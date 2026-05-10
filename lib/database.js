const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

function load(file, def) {
  const p = path.join(DIR, file);
  if (!fs.existsSync(p)) { fs.writeFileSync(p, JSON.stringify(def, null, 2)); return def; }
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return def; }
}
function save(file, data) {
  fs.writeFileSync(path.join(DIR, file), JSON.stringify(data, null, 2));
}

function getDB() { return load('db.json', { users: {}, groups: {}, donos: [], sugestoes: [], bugs: [], assaltos: {}, presidente: null, governador: null, prefeito: null }); }
function saveDB(db) { save('db.json', db); }

function getUser(jid) {
  const db = getDB();
  if (!db.users[jid]) {
    db.users[jid] = {
      jid, nome: null, posicao: null, estilo: null, overall: 60,
      energia: 100, treinos: 0, lesao: null, fama: 0, seguidores: 0,
      clube: 'Sem Clube', pontosClube: 0, titulos: 0, salario: 5000,
      carteira: 1000, banco: 0, divida: 0, credor: null, devedores: {},
      relacionamento: null, namorado: null, fidelidade: 100,
      emprego: null, preso: false, presoAte: 0, suborno: 0,
      inventario: {}, vip: false, instagram: 0, copa: false,
      cooldowns: {}, lance: null, partida: null, passe: 0, evento: 0,
      cargo: null, bancoBloqueado: false, imoveis: []
    };
    saveDB(db);
  }
  return db.users[jid];
}
function saveUser(u) { const db = getDB(); db.users[u.jid] = u; saveDB(db); }

function cooldown(user, key, ms) {
  const now = Date.now();
  const last = user.cooldowns[key] || 0;
  if (now - last < ms) return Math.ceil((ms - (now - last)) / 1000);
  return 0;
}
function setCooldown(user, key) { user.cooldowns[key] = Date.now(); }

module.exports = { getDB, saveDB, getUser, saveUser, cooldown, setCooldown };
