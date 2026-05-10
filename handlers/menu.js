const config = require('../config.json');
const { IMG, reply } = require('../lib/helpers');

const MENUS = {
  principal: `╔══✦══╗
   🤖 *YUNO BOT* 🤖
╚══✦══╝

▸ */futebol* - Carreira de Jogador
▸ */economia* - Banco & Perfil
▸ */negocios* - Empresas & Imóveis
▸ */trabalho* - Empregos & RPG
▸ */cargos* - Governo (Admins)
▸ */ilegal* - Crime & Roubo
▸ */cassino* - Jogos de Azar
▸ */mercado* - Loja & Itens
▸ */vip* - Benefícios VIP
▸ */sugestao* [texto] - Enviar sugestão
▸ */bug* [texto] - Reportar bug
▸ */abrir* */fechar* - Admins/Donos
▸ */donos* - Lista de Donos

Use o prefixo *${config.prefix}* antes de cada comando.`,

  futebol: `⚽ *MENU CARREIRA DE JOGADOR* ⚽

🏃 *Ações:*
▪️ /jogar - Entrar em campo (10min)
▪️ /lance [1-3] - Decidir lance da partida
▪️ /treino - Treinar (10x, depois 1h)
▪️ /medico - Ir ao DM/Cirurgia
▪️ /descansar - Recuperar energia (5min)
▪️ /academia - Físico (10min)
▪️ /coletiva - Entrevista (10min)

💼 *Carreira:*
▪️ /tabela - Tabela do campeonato
▪️ /jogador posicao [pos]
▪️ /jogador estilo [estilo]
▪️ /jogador [Nome]
▪️ /patrocinio (2h)
▪️ /transferencia
▪️ /europas
▪️ /renovartime (3h)
▪️ /historico
▪️ /salario (1 dia)
▪️ /aposentar

📱 *Vida Social:*
▪️ /instagram /postar /viralizar
▪️ /entrevista /fama

❤️ *Relacionamento:*
▪️ /namorar /relacionamento /date
▪️ /presentear /terminar

🏆 *Competições:*
▪️ /torneios /champions /copamundo
▪️ /libertadores /premios

🎉 *Eventos:*
▪️ /evento /evento resgatar
▪️ /passe /passe resgatar

🛒 /loja /inventario /equipar /comprar /vip

🩹 /energia /lesao /fisioterapia /hospital
📊 /status`,

  economia: `🏦 *BANCO & PERFIL*
💳 /carteira
🏦 /banco
📥 /dep [valor|tudo] (30% pro Presidente)
📤 /sacar [valor|tudo]
💸 /pix [valor] @user
🏆 /ranking`,

  negocios: `💼 *NEGÓCIOS*
🏢 /imoveis
📈 /lucro (12h)
🤝 /emprestar @user [valor]
📜 /devedores
💵 /pagaremp
🏠 /bolsafamilia (1h)`,

  trabalho: `⛏️ *TRABALHO & RPG*
👔 /carreira
💼 /trabalhar (20min)
📅 /diario (1x dia)
🚶 /passear (5min)
🗺️ /explorar (5min)`,

  cargos: `🏛️ *CARGOS & GOVERNO* (Admins/Donos)
🏛️ /superiores
⚖️ /nomear @user [presidente|governador|prefeito]
🔥 /demitir @user
🏗️ /construir [obra]
🔓 /perdoar @user (30min)
🚫 /bloquearbanco @user
✅ /desbloquearbanco @user
📌 /presidente @user (define o presidente)`,

  ilegal: `☢️ *CRIME & ILEGAL*
🔫 /crime (15min)
🥷 /roubar @user (1h)
🏦 /assaltobanco (mín 2 + R$10k)
🏦 /assaltobanco finalizar
⛓️ /presos
🤝 /subornar
💰 /subornar pagar`,

  cassino: `🎲 *CASSINO*
🐯 /tigrinho [valor]
🎰 /roleta [valor]
🃏 /blackjack [valor]
🎲 /dados [valor]`,

  mercado: `🛒 *LOJA & ITENS*
🏪 /loja
🛍️ /comprar [item]
🏷️ /vender [item|tudo]
🎒 /inventario
🎁 /daritem @user [item] [qtd]`
};

async function sendMenu(sock, m, key = 'principal') {
  await reply(sock, m, MENUS[key] || MENUS.principal, { image: IMG });
}

module.exports = { sendMenu, MENUS };
