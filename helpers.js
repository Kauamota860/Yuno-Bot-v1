const config = require('../config.json');

function fmt(n) { return 'R$ ' + Number(n).toLocaleString('pt-BR'); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function tempoStr(s) {
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
  return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
}
function getMentions(m) {
  const ctx = m.message?.extendedTextMessage?.contextInfo;
  return ctx?.mentionedJid || [];
}
function getText(m) {
  return m.message?.conversation
    || m.message?.extendedTextMessage?.text
    || m.message?.imageMessage?.caption
    || '';
}
async function reply(sock, m, text, opts = {}) {
  const jid = m.key.remoteJid;
  if (opts.image) {
    return sock.sendMessage(jid, { image: { url: opts.image }, caption: text, mentions: opts.mentions || [] }, { quoted: m });
  }
  return sock.sendMessage(jid, { text, mentions: opts.mentions || [] }, { quoted: m });
}
const IMG = config.image;

module.exports = { fmt, rand, pick, tempoStr, getMentions, getText, reply, IMG };
