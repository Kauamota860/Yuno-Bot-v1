const config = require('../config.json');
async function handlePrivate(sock, m) {
  const jid = m.key.remoteJid;
  const text = `🤖 *${config.botName}*\n\nOlá! Eu funciono apenas em grupos.\n\nEntre no grupo oficial pra usar todos os meus comandos:\n\n👉 ${config.groupLink}\n\n💎 Para comprar VIP (${config.vipPrice}) envie o Pix para a chave: *${config.pixKey}* e depois mande o comprovante aqui.`;
  try {
    await sock.sendMessage(jid, { image: { url: config.image }, caption: text });
  } catch {
    await sock.sendMessage(jid, { text });
  }
}
module.exports = { handlePrivate };
