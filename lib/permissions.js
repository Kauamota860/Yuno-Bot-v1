const { getDB } = require('./database');
const config = require('../config.json');

function numFromJid(j) { return j.split('@')[0].split(':')[0]; }

function isOwner(jid) {
  return config.ownerNumbers.includes(numFromJid(jid));
}
function isDono(jid) {
  if (isOwner(jid)) return true;
  const db = getDB();
  return (db.donos || []).includes(numFromJid(jid));
}
async function isAdmin(sock, groupJid, userJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const p = meta.participants.find(x => x.id === userJid);
    return p && (p.admin === 'admin' || p.admin === 'superadmin');
  } catch { return false; }
}
async function isBotAdmin(sock, groupJid) {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const me = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const p = meta.participants.find(x => x.id === me);
    return p && (p.admin === 'admin' || p.admin === 'superadmin');
  } catch { return false; }
}
module.exports = { isOwner, isDono, isAdmin, isBotAdmin, numFromJid };
