const config = require('../config.json');
const { getDB, saveDB, getUser, saveUser, cooldown, setCooldown } = require('../lib/database');
const { fmt, rand, pick, tempoStr, getMentions, getText, reply, IMG } = require('../lib/helpers');
const { isOwner, isDono, isAdmin, isBotAdmin, numFromJid } = require('../lib/permissions');
const { sendMenu, MENUS } = require('./menu');
const { handlePrivate } = require('./privateHandler');

const POSICOES = ['Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante','PontaEsquerda','PontaDireita','Centroavante'];
const ESTILOS = ['Driblador','Finalizador','Cadenciador','Marcador','Velocista','Forte','Goleador','Artilheiro','Maestro'];
const CLUBES = ['Flamengo','Palmeiras','Corinthians','São Paulo','Santos','Vasco','Botafogo','Fluminense','Grêmio','Internacional','Cruzeiro','Atlético-MG'];
const CLUBES_EU = ['Real Madrid','Barcelona','Manchester City','PSG','Bayern','Liverpool','Inter Milan','Juventus','Arsenal','Chelsea'];
const CLUBES_RUINS_EU = ['Almería','Granada','Cádiz','Burnley','Sheffield','Frosinone','Salernitana','Lorient','Clermont'];

const LANCES_OPCOES = [
  { txt: 'Bicicleta', sucesso: '⚽ GOLAÇO DE BICICLETA! O estádio explode!', falha: '😱 Tentou bicicleta e a bola foi pra arquibancada!' },
  { txt: 'Cavadinha', sucesso: '🎯 CAVADINHA DELICIOSA! Goleiro mergulhou no nada!', falha: '😬 Cavadinha fraca, goleiro pegou tranquilo.' },
  { txt: 'Chute Forte', sucesso: '💥 CHUTE COLOCADO NO ÂNGULO! GOOOL!', falha: '🚫 Chutou na trave!' },
  { txt: 'Drible', sucesso: '🌀 DRIBLOU 3 e finalizou no canto! GOL!', falha: '😅 Perdeu a bola tentando drible.' },
  { txt: 'Cabeçada', sucesso: '🦅 SUBIU MAIS QUE TODO MUNDO! GOL DE CABEÇA!', falha: '❌ Cabeçada pra fora.' },
  { txt: 'Passe pro Atacante', sucesso: '🎁 ASSISTÊNCIA MAGISTRAL! Seu time marcou!', falha: '🚷 Passe interceptado.' }
];

function gerarLance() {
  const a = pick(LANCES_OPCOES); let b = pick(LANCES_OPCOES); let c = pick(LANCES_OPCOES);
  while (b === a) b = pick(LANCES_OPCOES);
  while (c === a || c === b) c = pick(LANCES_OPCOES);
  return [a,b,c];
}

const CARGOS = ['presidente','governador','prefeito'];
const EMPREGOS = [
  {n:'Entregador',s:[800,1500]},{n:'Pedreiro',s:[1200,2000]},
  {n:'Programador',s:[3000,6000]},{n:'Médico',s:[5000,9000]},
  {n:'Policial',s:[2000,4000]},{n:'Professor',s:[1800,3500]},
  {n:'Empresário',s:[6000,12000]},{n:'Motorista',s:[1500,2500]}
];
const ITENS_LOJA = {
  'chuteira': {nome:'👟 Chuteira Pro', preco: 5000, tipo:'equip', boost:'overall+2'},
  'luva': {nome:'🧤 Luva de Goleiro', preco: 3000, tipo:'equip'},
  'energetico': {nome:'⚡ Energético', preco: 500, tipo:'consumo', efeito:'energia+30'},
  'curativo': {nome:'🩹 Curativo', preco: 800, tipo:'consumo', efeito:'cura'},
  'vip_pack': {nome:'💎 Pack VIP (manual)', preco: 99999, tipo:'info'},
  'rolex': {nome:'⌚ Rolex de Ouro', preco: 50000, tipo:'luxo'},
  'carro': {nome:'🚗 Carro Esportivo', preco: 200000, tipo:'luxo'},
  'mansao': {nome:'🏰 Mansão', preco: 1000000, tipo:'imovel'}
};
const IMOVEIS = [
  {id:'kit', nome:'🏠 Kitnet', preco:50000, lucro:5000},
  {id:'casa', nome:'🏡 Casa', preco:200000, lucro:18000},
  {id:'mansao', nome:'🏰 Mansão', preco:1000000, lucro:90000},
  {id:'predio', nome:'🏢 Prédio Comercial', preco:5000000, lucro:500000}
];

async function handleMessage(sock, m) {
  const jid = m.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');
  const sender = isGroup ? (m.key.participant || m.participant) : jid;
  const text = getText(m).trim();
  if (!text) return;

  if (!isGroup) {
    if (isOwner(sender) && text.startsWith(config.prefix)) {
      // owner can use commands in private (mainly /darvip etc.)
    } else {
      return handlePrivate(sock, m);
    }
  }

  if (!text.startsWith(config.prefix)) return;
  const args = text.slice(config.prefix.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  const u = getUser(sender);
  // Check prison (block most commands)
  if (u.preso && Date.now() < u.presoAte && !['subornar','presos','status','menu','sugestao','bug'].includes(cmd)) {
    return reply(sock, m, `⛓️ Você está PRESO! Sai em ${tempoStr(Math.ceil((u.presoAte-Date.now())/1000))}\nUse /subornar para tentar fugir.`);
  }
  if (u.preso && Date.now() >= u.presoAte) { u.preso = false; saveUser(u); }

  try {
    await routeCommand(sock, m, cmd, args, sender, jid, u, isGroup);
  } catch (e) {
    console.error('cmd error:', e);
    await reply(sock, m, '❌ Erro ao executar comando: ' + e.message);
  }
}

async function routeCommand(sock, m, cmd, args, sender, jid, u, isGroup) {
  const R = (t, opts) => reply(sock, m, t, opts);
  const db = getDB();

  switch (cmd) {
    case 'menu': case 'help': case 'ajuda':
      return sendMenu(sock, m, 'principal');
    case 'futebol': return sendMenu(sock, m, 'futebol');
    case 'economia': return sendMenu(sock, m, 'economia');
    case 'negocios': return sendMenu(sock, m, 'negocios');
    case 'trabalho': return sendMenu(sock, m, 'trabalho');
    case 'cargos': return sendMenu(sock, m, 'cargos');
    case 'ilegal': return sendMenu(sock, m, 'ilegal');
    case 'cassino': return sendMenu(sock, m, 'cassino');
    case 'mercado': return sendMenu(sock, m, 'mercado');

    // ========= DONOS =========
    case 'donos': {
      const lista = (db.donos||[]).map(n=>'• @'+n).join('\n') || '(nenhum)';
      return R(`👑 *DONOS DO BOT*\n\n👤 Owner Principal: @${config.owner}\n\n${lista}`, { mentions: [config.owner+'@s.whatsapp.net', ...(db.donos||[]).map(n=>n+'@s.whatsapp.net')] });
    }
    case 'adddono': {
      if (!isOwner(sender)) return R('❌ Só o Owner principal.');
      const ment = getMentions(m); if (!ment[0]) return R('Use: /adddono @user');
      const num = numFromJid(ment[0]);
      if (!db.donos.includes(num)) db.donos.push(num); saveDB(db);
      return R(`👑 @${num} virou DONO!`, { mentions: [ment[0]] });
    }
    case 'rmdono': {
      if (!isOwner(sender)) return R('❌ Só o Owner principal.');
      const ment = getMentions(m); if (!ment[0]) return R('Use: /rmdono @user');
      const num = numFromJid(ment[0]);
      db.donos = db.donos.filter(x=>x!==num); saveDB(db);
      return R(`👋 @${num} não é mais dono.`, { mentions: [ment[0]] });
    }

    // ========= GROUP CONTROL =========
    case 'abrir': case 'fechar': {
      if (!isGroup) return R('Só em grupo.');
      if (!(await isAdmin(sock, jid, sender)) && !isDono(sender)) return R('❌ Só admins/donos.');
      if (!(await isBotAdmin(sock, jid))) return R('❌ Eu preciso ser admin do grupo.');
      await sock.groupSettingUpdate(jid, cmd === 'abrir' ? 'not_announcement' : 'announcement');
      return R(cmd === 'abrir' ? '🔓 Grupo ABERTO! Todos podem falar.' : '🔒 Grupo FECHADO! Só admins falam.');
    }

    // ========= SUGESTÃO / BUG =========
    case 'sugestao': {
      const txt = args.join(' '); if (!txt) return R('Use: /sugestao [sua sugestão]');
      db.sugestoes.push({ user: sender, txt, t: Date.now() }); saveDB(db);
      try { await sock.sendMessage(config.owner+'@s.whatsapp.net', { text: `💡 *Sugestão* de @${numFromJid(sender)}:\n\n${txt}`, mentions:[sender] }); } catch {}
      return R('✅ Sugestão enviada ao dono! Obrigado 💙');
    }
    case 'bug': {
      const txt = args.join(' '); if (!txt) return R('Use: /bug [descrição]');
      db.bugs.push({ user: sender, txt, t: Date.now() }); saveDB(db);
      try { await sock.sendMessage(config.owner+'@s.whatsapp.net', { text: `🐛 *Bug* de @${numFromJid(sender)}:\n\n${txt}`, mentions:[sender] }); } catch {}
      return R('🐛 Bug reportado! Vamos corrigir.');
    }

    // ========= VIP =========
    case 'vip': {
      return R(`💎 *VIP YUNO BOT*\n\nPreço: *${config.vipPrice}* (Pix)\nChave Pix: *${config.pixKey}*\n\nDepois do pagamento, envie comprovante no privado do dono.\n\n*Benefícios:*\n• +50% de moedas em todos os comandos\n• Cooldowns reduzidos pela metade\n• Tag 💎 no nome\n• Acesso a eventos exclusivos\n\nSeu status: ${u.vip ? '✅ VIP ATIVO' : '❌ Não VIP'}`, { image: IMG });
    }
    case 'darvip': {
      if (!isDono(sender)) return R('❌ Só donos.');
      const ment = getMentions(m); if (!ment[0]) return R('Use: /darvip @user');
      const tu = getUser(ment[0]); tu.vip = true; saveUser(tu);
      return R(`💎 VIP concedido para @${numFromJid(ment[0])}!`, { mentions: [ment[0]] });
    }
    case 'tirarvip': {
      if (!isDono(sender)) return R('❌ Só donos.');
      const ment = getMentions(m); if (!ment[0]) return R('Use: /tirarvip @user');
      const tu = getUser(ment[0]); tu.vip = false; saveUser(tu);
      return R(`👋 VIP removido de @${numFromJid(ment[0])}.`, { mentions: [ment[0]] });
    }

    // ========= FUTEBOL =========
    case 'jogar': {
      if (u.lance && u.lance.t > Date.now() - 120000) return R('⚽ Você já tem um lance pendente! Use /lance [1-3]');
      const cd = cooldown(u, 'jogar', 10*60*1000); if (cd) return R(`⏳ Aguarde ${tempoStr(cd)} pra jogar de novo.`);
      if (u.energia < 20) return R('😴 Energia baixa! Use /descansar.');
      if (u.lesao) return R('🤕 Você está lesionado! /medico ou /fisioterapia');
      const opts = gerarLance();
      u.lance = { opts, t: Date.now() };
      setCooldown(u, 'jogar'); u.energia -= 15; saveUser(u);
      const txt = `⚽ *PARTIDA EM ANDAMENTO!*\n\n${u.clube} x ${pick(CLUBES)}\n\n🎯 Sua chance! Escolha o lance:\n\n1️⃣ ${opts[0].txt}\n2️⃣ ${opts[1].txt}\n3️⃣ ${opts[2].txt}\n\nResponda com */lance 1*, */lance 2* ou */lance 3*`;
      return R(txt, { image: IMG });
    }
    case 'lance': {
      if (!u.lance) return R('Você não está em partida. Use /jogar');
      const i = parseInt(args[0]) - 1;
      if (isNaN(i) || i<0 || i>2) return R('Use: /lance 1, 2 ou 3');
      const escolha = u.lance.opts[i];
      const sucesso = Math.random() < (0.55 + u.overall*0.003);
      const grana = sucesso ? rand(2000, 8000) * (u.vip?1.5:1) : rand(0,500);
      const fama = sucesso ? rand(5,15) : -2;
      const seg = sucesso ? rand(50, 300) : 0;
      u.carteira += Math.floor(grana); u.fama = Math.max(0, u.fama+fama); u.seguidores += seg;
      if (sucesso) { u.pontosClube += 3; u.overall = Math.min(99, u.overall + (Math.random()<0.1?1:0)); }
      else { u.pontosClube += rand(0,1); }
      u.lance = null;
      // chance lesão
      let lesaoTxt = '';
      if (Math.random() < 0.08) { u.lesao = pick(['Torção','Estiramento','Pancada']); lesaoTxt = `\n🤕 LESÃO: ${u.lesao}!`; }
      // campeão
      let campTxt = '';
      if (u.pontosClube >= 90) {
        u.titulos++; u.pontosClube = 0; u.carteira += 100000; u.fama += 50;
        campTxt = `\n\n🏆🏆🏆 *${u.clube} É CAMPEÃO!* 🏆🏆🏆\n💰 +R$ 100.000 | ⭐ +50 fama | 🏆 Título!`;
      }
      saveUser(u);
      const txt = `${sucesso?escolha.sucesso:escolha.falha}\n\n💰 ${sucesso?'+':''}${fmt(Math.floor(grana))}\n⭐ Fama: ${fama>0?'+':''}${fama}\n📈 Seguidores: +${seg}\n🏟️ Pontos do clube: ${u.pontosClube}/90${lesaoTxt}${campTxt}`;
      return R(txt, { image: IMG });
    }
    case 'treino': {
      if (u.treinos >= 10) {
        const cd = cooldown(u, 'treino_cansado', 60*60*1000);
        if (cd) return R(`😩 Cansado! Aguarde ${tempoStr(cd)}.`);
        u.treinos = 0;
      }
      u.treinos++; u.overall = Math.min(99, u.overall + (Math.random()<0.4?1:0));
      u.energia = Math.max(0, u.energia - 8);
      if (u.treinos === 10) setCooldown(u, 'treino_cansado');
      saveUser(u);
      return R(`💪 Treino #${u.treinos}/10 concluído!\n⭐ OVR: ${u.overall}\n⚡ Energia: ${u.energia}`, { image: IMG });
    }
    case 'medico': {
      if (!u.lesao) return R('💚 Você está saudável!');
      if (u.carteira < 5000) return R('💸 Cirurgia custa R$ 5.000.');
      u.carteira -= 5000; u.lesao = null; saveUser(u);
      return R('🏥 Cirurgia bem-sucedida! Você está recuperado.', { image: IMG });
    }
    case 'descansar': {
      const cd = cooldown(u,'descansar',5*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      u.energia = Math.min(100, u.energia + 30); setCooldown(u,'descansar'); saveUser(u);
      return R(`😴 Descansou! ⚡ Energia: ${u.energia}/100`);
    }
    case 'academia': {
      const cd = cooldown(u,'academia',10*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      u.overall = Math.min(99, u.overall + 1); u.energia = Math.max(0, u.energia-5);
      setCooldown(u,'academia'); saveUser(u);
      return R(`🏋️ Físico melhorado! OVR: ${u.overall}`);
    }
    case 'coletiva': {
      const cd = cooldown(u,'coletiva',10*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      const f = rand(-3, 10); u.fama = Math.max(0, u.fama+f); setCooldown(u,'coletiva'); saveUser(u);
      return R(`🎤 Coletiva: ${f>0?'foi bem!':'polêmica...'} Fama ${f>0?'+':''}${f}`);
    }
    case 'tabela': {
      const top = Object.values(db.users).sort((a,b)=>b.pontosClube-a.pontosClube).slice(0,10);
      const t = top.map((x,i)=>`${i+1}. ${x.clube} - ${x.pontosClube}pts (@${numFromJid(x.jid)})`).join('\n');
      return R(`🏆 *TABELA DO CAMPEONATO*\n\n${t || 'Vazia'}`, { mentions: top.map(x=>x.jid) });
    }
    case 'jogador': {
      const sub = (args[0]||'').toLowerCase();
      if (sub === 'posicao') {
        const p = args[1];
        if (!p) return R(`Posições: ${POSICOES.join(', ')}\nUse: /jogador posicao [pos]`);
        const m2 = POSICOES.find(x=>x.toLowerCase()===p.toLowerCase());
        if (!m2) return R('Posição inválida.');
        u.posicao = m2; saveUser(u); return R(`✅ Posição: ${m2}`);
      }
      if (sub === 'estilo') {
        const p = args[1];
        if (!p) return R(`Estilos: ${ESTILOS.join(', ')}`);
        const m2 = ESTILOS.find(x=>x.toLowerCase()===p.toLowerCase());
        if (!m2) return R('Estilo inválido.');
        u.estilo = m2; saveUser(u); return R(`✅ Estilo: ${m2}`);
      }
      const nome = args.join(' ').trim();
      if (!nome) return R('Use: /jogador [Nome] | /jogador posicao [x] | /jogador estilo [x]');
      u.nome = nome; saveUser(u);
      return R(`✅ Nome na camisa: ${nome}`);
    }
    case 'patrocinio': {
      const cd = cooldown(u,'patrocinio',2*60*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      setCooldown(u,'patrocinio');
      if (u.fama < 20) { saveUser(u); return R('😬 Nenhum patrocinador se interessou. Aumente sua fama!'); }
      const v = rand(5000, 30000) + u.fama*100;
      u.carteira += v; saveUser(u);
      return R(`🤝 Patrocinador: ${pick(['Nike','Adidas','Puma','Mizuno','RedBull'])}\n💰 +${fmt(v)}`);
    }
    case 'transferencia': {
      const novo = pick(CLUBES.filter(c=>c!==u.clube));
      u.clube = novo; u.pontosClube = 0; saveUser(u);
      return R(`✍️ Transferido para *${novo}*!`);
    }
    case 'europas': {
      if (u.overall < 70) return R('🌍 Overall baixo pra Europa (mín 70).');
      const bom = Math.random() < 0.5;
      const novo = bom ? pick(CLUBES_EU) : pick(CLUBES_RUINS_EU);
      u.clube = novo; u.salario = bom ? 50000 : 15000;
      saveUser(u);
      return R(`✈️ Europa! Novo clube: *${novo}*\n💰 Salário: ${fmt(u.salario)}/sem`);
    }
    case 'renovartime': {
      const cd = cooldown(u,'renovar',3*60*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      u.salario = Math.floor(u.salario*1.2); setCooldown(u,'renovar'); saveUser(u);
      return R(`📝 Contrato renovado! Salário: ${fmt(u.salario)}`);
    }
    case 'historico': {
      return R(`📜 *Histórico de @${numFromJid(sender)}*\n\n👤 ${u.nome||'-'} | ${u.posicao||'-'} (${u.estilo||'-'})\n🏟️ ${u.clube}\n⭐ OVR: ${u.overall} | Fama: ${u.fama}\n🏆 Títulos: ${u.titulos}\n📈 Seguidores: ${u.seguidores}`, { mentions:[sender] });
    }
    case 'salario': {
      const cd = cooldown(u,'salario',24*60*60*1000); if (cd) return R(`⏳ Próximo salário em ${tempoStr(cd)}`);
      u.carteira += u.salario; setCooldown(u,'salario'); saveUser(u);
      return R(`💵 Salário: +${fmt(u.salario)}`);
    }
    case 'aposentar': {
      const ant = {titulos:u.titulos, fama:u.fama, ovr:u.overall};
      Object.assign(u, getUser('reset_'+sender));
      u.jid = sender; u.carteira = 1000;
      saveUser(u);
      return R(`👋 Aposentado! Carreira: 🏆${ant.titulos} ⭐${ant.fama} OVR${ant.ovr}`);
    }
    case 'instagram':
      return R(`📱 *Instagram @${numFromJid(sender)}*\n👥 Seguidores: ${u.seguidores}\n🌟 Fama: ${u.fama}\n📊 Engajamento: ${Math.min(100, u.fama+rand(0,20))}%`, {mentions:[sender]});
    case 'postar': {
      const cd = cooldown(u,'postar',10*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      const s = rand(10, 500); u.seguidores += s; setCooldown(u,'postar'); saveUser(u);
      return R(`📸 Postagem feita! +${s} seguidores`);
    }
    case 'viralizar': {
      const cd = cooldown(u,'viralizar',10*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      setCooldown(u,'viralizar');
      if (Math.random() < 0.2) { const s = rand(5000,30000); u.seguidores+=s; u.fama+=20; saveUser(u); return R(`🚀 VIRALIZOU MUNDIALMENTE! +${s} seguidores +20 fama!`, {image:IMG}); }
      saveUser(u); return R('😴 Não viralizou dessa vez.');
    }
    case 'entrevista': {
      const cd = cooldown(u,'entrevista',10*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      const f = rand(-10, 15); u.fama = Math.max(0, u.fama+f); setCooldown(u,'entrevista'); saveUser(u);
      return R(`🎙️ Entrevista: fama ${f>0?'+':''}${f}`);
    }
    case 'fama':
      return R(`🌍 Reputação: *${u.fama}* (${u.fama>100?'Lendário':u.fama>50?'Famoso':u.fama>20?'Conhecido':'Iniciante'})`);

    // ===== Relacionamentos =====
    case 'namorar': {
      if (u.namorado) return R('❤️ Já está num relacionamento!');
      const nomes = ['Bia','Carla','Júlia','Marina','Larissa','Letícia','Bruna','Ana','Lucas','Pedro','Rafael','Thiago'];
      u.namorado = pick(nomes); u.fidelidade = rand(40,100); u.relacionamento = 'Namorando';
      saveUser(u);
      return R(`💕 Você começou a namorar com *${u.namorado}*!\nFidelidade aparente: ${u.fidelidade}%`);
    }
    case 'relacionamento': {
      if (!u.namorado) return R('💔 Solteiro(a). Use /namorar');
      return R(`❤️ ${u.relacionamento} com *${u.namorado}*\nFidelidade: ${u.fidelidade}%`);
    }
    case 'date': {
      if (!u.namorado) return R('💔 Você está solteiro.');
      const cd = cooldown(u,'date',60*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      setCooldown(u,'date');
      const ev = rand(1,10);
      let msg = `💑 Date com ${u.namorado}!\n`;
      if (ev<=2) { u.carteira += rand(2000,10000); msg += `💸 Te ajudou financeiramente! +${fmt(2000)}+`; }
      else if (ev<=4) { u.fama += 10; msg += `📸 Foram fotografados! +10 fama`; }
      else if (ev<=5) { u.fidelidade = Math.min(100,u.fidelidade+10); msg += `❤️ Mais apaixonados!`; }
      else if (ev===6) { u.fidelidade -= 20; msg += `😡 Briga! Fidelidade -20`; }
      else if (ev===7 && Math.random()<0.3) { msg += `💍 ${u.namorado} pediu em CASAMENTO! 🥹 (responda com /namorar pra renovar)`; u.relacionamento='Casado'; }
      else if (ev===8 && u.fidelidade<50) { msg += `💔 ${u.namorado} te traiu! /terminar`; }
      else { msg += `🌹 Date tranquilo.`; }
      saveUser(u);
      return R(msg, { image: IMG });
    }
    case 'presentear': {
      if (!u.namorado) return R('💔 Solteiro');
      if (u.carteira<2000) return R('💸 Sem grana (R$2000)');
      u.carteira -= 2000; u.fidelidade = Math.min(100, u.fidelidade+15); saveUser(u);
      return R(`🎁 Presenteou ${u.namorado}! Fidelidade +15`);
    }
    case 'terminar': {
      if (!u.namorado) return R('💔 Já solteiro');
      const ex = u.namorado; u.namorado=null; u.relacionamento=null; u.fidelidade=100;
      saveUser(u);
      return R(`😢 Terminou com ${ex}.`);
    }

    // ===== Competições =====
    case 'torneios':
      return R(`🏆 *TORNEIOS*\n• /champions (OVR 75+)\n• /copamundo (precisa ser convocado)\n• /libertadores\n• /premios`);
    case 'champions': {
      if (u.overall<75) return R('⭐ OVR mín 75');
      const cd = cooldown(u,'champions',6*60*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      setCooldown(u,'champions');
      const win = Math.random()<0.3;
      if (win) { u.titulos++; u.carteira+=200000; u.fama+=80; saveUser(u); return R(`🏆 CAMPEÃO DA CHAMPIONS!\n+R$200.000 +80 fama`, {image:IMG}); }
      saveUser(u); return R('😔 Eliminado nas oitavas.');
    }
    case 'copamundo': {
      if (!u.copa) {
        if (u.overall>=80 && Math.random()<0.5) { u.copa=true; saveUser(u); return R('📞 CONVOCADO PARA A SELEÇÃO! Use /copamundo'); }
        saveUser(u); return R('🚫 Você não foi convocado. Treine mais!');
      }
      const cd = cooldown(u,'copa',7*24*60*60*1000); if (cd) return R(`⏳ Próxima Copa em ${tempoStr(cd)}`);
      setCooldown(u,'copa');
      const win = Math.random()<0.2;
      if (win) { u.titulos++; u.carteira+=500000; u.fama+=200; u.copa=false; saveUser(u); return R(`🏆🏆🏆 CAMPEÃO MUNDIAL! 🏆🏆🏆\n+R$500.000 +200 fama`, {image:IMG}); }
      u.copa=false; saveUser(u); return R('😭 Eliminado da Copa.');
    }
    case 'libertadores': {
      const cd = cooldown(u,'lib',6*60*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      setCooldown(u,'lib');
      if (Math.random()<0.35) { u.titulos++; u.carteira+=150000; u.fama+=60; saveUser(u); return R(`🏆 LIBERTADORES! +R$150k +60 fama`); }
      saveUser(u); return R('😔 Caiu na semi.');
    }
    case 'premios':
      return R(`🏅 *Premiações*\n🏆 Champions: R$200k\n🌍 Copa: R$500k\n🏆 Libertadores: R$150k\n🏆 Brasileirão: R$100k`);

    // ===== Eventos & Passe =====
    case 'evento': {
      const sub = (args[0]||'').toLowerCase();
      if (sub === 'resgatar') {
        const cd = cooldown(u,'evento_r',60*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
        const recompensas = [
          ()=>{u.carteira+=10000; return '+R$10.000';},
          ()=>{u.energia=100; return '⚡ Energia cheia';},
          ()=>{u.fama+=15; return '+15 fama';},
          ()=>{u.inventario.energetico=(u.inventario.energetico||0)+3; return '3x ⚡ Energéticos';},
          ()=>{u.overall=Math.min(99,u.overall+2); return '+2 OVR';}
        ];
        const r = pick(recompensas)(); setCooldown(u,'evento_r'); saveUser(u);
        return R(`🎁 Recompensa do evento: ${r}`);
      }
      return R(`🎉 *EVENTO DA SEMANA*\n⚽ Maratona dos Craques\n\nUse */evento resgatar* a cada 1h pra ganhar prêmios!`);
    }
    case 'passe': {
      const sub = (args[0]||'').toLowerCase();
      if (sub === 'resgatar') {
        const cd = cooldown(u,'passe_r',60*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
        u.passe++; u.carteira += 5000*u.passe; setCooldown(u,'passe_r'); saveUser(u);
        return R(`🎟️ Passe nível ${u.passe}! +${fmt(5000*u.passe)}`);
      }
      return R(`🎟️ *PASSE DA TEMPORADA*\nNível: ${u.passe}\nUse /passe resgatar (1h)`);
    }

    // ===== Saúde =====
    case 'energia': return R(`⚡ Energia: ${u.energia}/100`);
    case 'lesao': return R(u.lesao ? `🤕 Lesão: ${u.lesao}` : '💚 Saudável');
    case 'fisioterapia': {
      if (!u.lesao) return R('💚 Sem lesão');
      if (u.carteira<2000) return R('💸 R$2000 necessário');
      const cd = cooldown(u,'fisio',30*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      u.carteira-=2000; u.lesao=null; setCooldown(u,'fisio'); saveUser(u);
      return R('🩹 Recuperado!');
    }
    case 'hospital': {
      if (u.carteira<10000) return R('💸 R$10.000');
      u.carteira-=10000; u.lesao=null; u.energia=100; saveUser(u);
      return R('🏥 Tratamento completo!');
    }

    case 'status': {
      return R(`📊 *STATUS de @${numFromJid(sender)}*\n\n👤 Nome: ${u.nome||'-'}\n⚽ Posição: ${u.posicao||'-'}\n🔥 Estilo: ${u.estilo||'-'}\n⭐ OVR: ${u.overall}\n💰 Carteira: ${fmt(u.carteira)}\n🏦 Banco: ${fmt(u.banco)}\n🏆 Títulos: ${u.titulos}\n📈 Seguidores: ${u.seguidores}\n❤️ Relacionamento: ${u.namorado||'Solteiro'}\n⚡ Energia: ${u.energia}/100\n🩹 Lesão: ${u.lesao||'Nenhuma'}\n🌍 Fama: ${u.fama}\n🏟️ Clube: ${u.clube}\n📊 Pts: ${u.pontosClube}/90\n💎 VIP: ${u.vip?'✅':'❌'}`, {mentions:[sender], image:IMG});
    }

    // ========= ECONOMIA =========
    case 'carteira': return R(`💳 Carteira: ${fmt(u.carteira)}`);
    case 'banco': return R(`🏦 Banco: ${fmt(u.banco)}\n💸 Dívida: ${fmt(u.divida)}\n🚫 Bloqueado: ${u.bancoBloqueado?'Sim':'Não'}`);
    case 'dep': {
      if (u.bancoBloqueado) return R('🚫 Banco bloqueado.');
      let v = args[0]; if (!v) return R('Use: /dep [valor|tudo]');
      v = v==='tudo' ? u.carteira : parseInt(v);
      if (!v||v<=0||v>u.carteira) return R('❌ Valor inválido');
      const taxa = Math.floor(v*0.3); const liquido = v-taxa;
      u.carteira -= v; u.banco += liquido;
      if (db.presidente) {
        const pres = getUser(db.presidente); pres.carteira += taxa; saveUser(pres);
      }
      saveUser(u);
      return R(`📥 Depositado ${fmt(liquido)} (taxa 30% = ${fmt(taxa)} → Presidente)`);
    }
    case 'sacar': {
      if (u.bancoBloqueado) return R('🚫 Banco bloqueado.');
      let v = args[0]; if (!v) return R('Use: /sacar [valor|tudo]');
      v = v==='tudo'?u.banco:parseInt(v);
      if (!v||v<=0||v>u.banco) return R('❌ Valor inválido');
      u.banco-=v; u.carteira+=v; saveUser(u);
      return R(`📤 Sacado ${fmt(v)}`);
    }
    case 'pix': {
      const ment = getMentions(m); const v = parseInt(args[0]);
      if (!ment[0]||!v||v<=0) return R('Use: /pix [valor] @user');
      if (v>u.carteira) return R('💸 Sem grana');
      const tu = getUser(ment[0]); u.carteira-=v; tu.carteira+=v;
      saveUser(u); saveUser(tu);
      return R(`💸 Pix de ${fmt(v)} enviado para @${numFromJid(ment[0])}`, {mentions:[ment[0]]});
    }
    case 'ranking': {
      const top = Object.values(db.users).sort((a,b)=>(b.carteira+b.banco)-(a.carteira+a.banco)).slice(0,10);
      const t = top.map((x,i)=>`${i+1}. @${numFromJid(x.jid)} - ${fmt(x.carteira+x.banco)}`).join('\n');
      return R(`🏆 *RANKING DOS RICOS*\n\n${t}`, {mentions:top.map(x=>x.jid)});
    }

    // ========= NEGÓCIOS =========
    case 'imoveis': {
      const sub = args[0];
      if (sub === 'comprar') {
        const id = args[1]; const im = IMOVEIS.find(x=>x.id===id);
        if (!im) return R('Use: /imoveis comprar [kit|casa|mansao|predio]');
        if (u.imoveis.find(x=>x.id===id)) return R('Já tem esse');
        if (u.carteira<im.preco) return R('💸 Sem grana');
        u.carteira-=im.preco; u.imoveis.push({id:im.id, ultimoLucro:0}); saveUser(u);
        return R(`🏠 Comprou ${im.nome}!`);
      }
      const lista = IMOVEIS.map(x=>`• ${x.nome} - ${fmt(x.preco)} (lucro 12h: ${fmt(x.lucro)}) [/imoveis comprar ${x.id}]`).join('\n');
      const meus = u.imoveis.map(x=>IMOVEIS.find(i=>i.id===x.id).nome).join(', ')||'nenhum';
      return R(`🏢 *IMÓVEIS*\n\n${lista}\n\nSeus: ${meus}`);
    }
    case 'lucro': {
      if (!u.imoveis.length) return R('🏚️ Sem imóveis');
      let total = 0;
      for (const i of u.imoveis) {
        const def = IMOVEIS.find(x=>x.id===i.id);
        if (Date.now() - (i.ultimoLucro||0) >= 12*60*60*1000) {
          total += def.lucro; i.ultimoLucro = Date.now();
        }
      }
      if (!total) return R('⏳ Aguarde 12h desde o último lucro.');
      u.carteira += total; saveUser(u);
      return R(`📈 Lucro: +${fmt(total)}`);
    }
    case 'emprestar': {
      const ment = getMentions(m); const v = parseInt(args[0]);
      if (!ment[0]||!v) return R('Use: /emprestar @user [valor]');
      if (v>u.carteira) return R('💸 Sem grana');
      const tu = getUser(ment[0]);
      if (tu.credor) return R('❌ Pessoa já tem dívida');
      u.carteira -= v; tu.carteira += v; tu.divida = Math.floor(v*1.1); tu.credor = sender;
      u.devedores[ment[0]] = tu.divida;
      saveUser(u); saveUser(tu);
      return R(`🤝 Emprestou ${fmt(v)} para @${numFromJid(ment[0])} (juros 10%)`, {mentions:[ment[0]]});
    }
    case 'devedores': {
      const e = Object.entries(u.devedores||{});
      if (!e.length) return R('Ninguém te deve.');
      const t = e.map(([j,v])=>`• @${numFromJid(j)} - ${fmt(v)}`).join('\n');
      return R(`📜 *Devedores*\n${t}`, {mentions:e.map(([j])=>j)});
    }
    case 'pagaremp': {
      if (!u.divida||!u.credor) return R('💚 Sem dívida');
      if (u.carteira<u.divida) return R(`💸 Falta ${fmt(u.divida-u.carteira)}`);
      const cred = getUser(u.credor); u.carteira -= u.divida; cred.carteira += u.divida;
      delete cred.devedores[sender]; saveUser(cred);
      u.divida=0; u.credor=null; saveUser(u);
      return R('✅ Dívida quitada!');
    }
    case 'bolsafamilia': {
      const cd = cooldown(u,'bolsa',60*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      u.carteira+=1200; setCooldown(u,'bolsa'); saveUser(u);
      return R('🏠 Bolsa Família: +R$1.200');
    }

    // ========= TRABALHO =========
    case 'carreira': {
      const t = EMPREGOS.map(e=>`• ${e.n} - ${fmt(e.s[0])}-${fmt(e.s[1])} [/trabalhar ${e.n.toLowerCase()}]`).join('\n');
      return R(`👔 *EMPREGOS*\n${t}\n\nAtual: ${u.emprego||'desempregado'}`);
    }
    case 'trabalhar': {
      const cd = cooldown(u,'trabalhar',20*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      const arg = args[0];
      let emp;
      if (arg) emp = EMPREGOS.find(e=>e.n.toLowerCase()===arg.toLowerCase());
      else emp = pick(EMPREGOS);
      if (!emp) return R('Emprego inexistente. /carreira');
      u.emprego = emp.n;
      const v = rand(emp.s[0],emp.s[1]); u.carteira+=v; setCooldown(u,'trabalhar'); saveUser(u);
      return R(`💼 ${emp.n}: +${fmt(v)}`);
    }
    case 'diario': {
      const cd = cooldown(u,'diario',24*60*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      const v = rand(3000,8000); u.carteira+=v; setCooldown(u,'diario'); saveUser(u);
      return R(`📅 Diário: +${fmt(v)}`);
    }
    case 'passear': {
      const cd = cooldown(u,'passear',5*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      const v = rand(100,1500); u.carteira+=v; setCooldown(u,'passear'); saveUser(u);
      return R(`🚶 Achou ${fmt(v)} passeando`);
    }
    case 'explorar': {
      const cd = cooldown(u,'explorar',5*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      const v = rand(500,3000); u.carteira+=v; setCooldown(u,'explorar'); saveUser(u);
      return R(`🗺️ Explorou e achou ${fmt(v)}`);
    }

    // ========= CARGOS =========
    case 'superiores': {
      return R(`🏛️ *GOVERNO*\n👑 Presidente: ${db.presidente?'@'+numFromJid(db.presidente):'(vago)'}\n🏛️ Governador: ${db.governador?'@'+numFromJid(db.governador):'(vago)'}\n🏘️ Prefeito: ${db.prefeito?'@'+numFromJid(db.prefeito):'(vago)'}`, {mentions:[db.presidente,db.governador,db.prefeito].filter(Boolean)});
    }
    case 'presidente': {
      if (!(await isAdmin(sock,jid,sender)) && !isDono(sender)) return R('❌ Só admins/donos');
      const ment = getMentions(m); if (!ment[0]) return R('Use: /presidente @user');
      db.presidente = ment[0]; saveDB(db);
      const tu = getUser(ment[0]); tu.cargo='presidente'; saveUser(tu);
      return R(`👑 @${numFromJid(ment[0])} é o novo PRESIDENTE!`, {mentions:[ment[0]]});
    }
    case 'nomear': {
      if (!(await isAdmin(sock,jid,sender)) && !isDono(sender) && db.presidente!==sender) return R('❌ Só presidente/admin/dono');
      const ment = getMentions(m); const cargo = (args[1]||args[0]||'').toLowerCase();
      if (!ment[0]||!CARGOS.includes(cargo)) return R('Use: /nomear @user [presidente|governador|prefeito]');
      db[cargo] = ment[0]; saveDB(db);
      const tu = getUser(ment[0]); tu.cargo=cargo; saveUser(tu);
      return R(`⚖️ @${numFromJid(ment[0])} nomeado *${cargo}*!`, {mentions:[ment[0]]});
    }
    case 'demitir': {
      if (!(await isAdmin(sock,jid,sender)) && !isDono(sender)) return R('❌ Só admins/donos');
      const ment = getMentions(m); if (!ment[0]) return R('Use: /demitir @user');
      const tu = getUser(ment[0]); const c = tu.cargo;
      if (c) { db[c]=null; tu.cargo=null; saveDB(db); saveUser(tu); }
      return R(`🔥 @${numFromJid(ment[0])} demitido!`, {mentions:[ment[0]]});
    }
    case 'construir': {
      if (!(await isAdmin(sock,jid,sender)) && !isDono(sender)) return R('❌ Só admins/donos');
      const obra = args.join(' ')||'Praça';
      return R(`🏗️ Obra iniciada: *${obra}* 🚧`);
    }
    case 'perdoar': {
      if (!(await isAdmin(sock,jid,sender)) && !isDono(sender) && !u.cargo) return R('❌ Só admin/dono/cargo');
      const cd = cooldown(u,'perdoar',30*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      const ment = getMentions(m); if (!ment[0]) return R('Use: /perdoar @user');
      const tu = getUser(ment[0]);
      if (!tu.preso) return R('Não está preso');
      if (Math.random()<0.7) { tu.preso=false; saveUser(tu); setCooldown(u,'perdoar'); saveUser(u); return R(`🔓 @${numFromJid(ment[0])} foi solto!`,{mentions:[ment[0]]}); }
      setCooldown(u,'perdoar'); saveUser(u);
      return R('⚖️ Lei recusou o perdão!');
    }
    case 'bloquearbanco':
    case 'desbloquearbanco': {
      if (!(await isAdmin(sock,jid,sender)) && !isDono(sender)) return R('❌ Só admins/donos');
      const ment = getMentions(m); if (!ment[0]) return R(`Use: /${cmd} @user`);
      const tu = getUser(ment[0]); tu.bancoBloqueado = cmd==='bloquearbanco'; saveUser(tu);
      return R(`${cmd==='bloquearbanco'?'🚫 Bloqueado':'✅ Desbloqueado'}: @${numFromJid(ment[0])}`,{mentions:[ment[0]]});
    }

    // ========= CRIME =========
    case 'crime': {
      const cd = cooldown(u,'crime',15*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      setCooldown(u,'crime'); saveUser(u);
      if (Math.random()<0.35) {
        u.preso=true; u.presoAte=Date.now()+10*60*1000; saveUser(u);
        return R('🚔 PRESO no flagrante! 10min de cadeia.');
      }
      const v = rand(2000,15000); u.carteira+=v; saveUser(u);
      return R(`🔫 Crime: +${fmt(v)}`, {image:IMG});
    }
    case 'roubar': {
      const cd = cooldown(u,'roubar',60*60*1000); if (cd) return R(`⏳ ${tempoStr(cd)}`);
      const ment = getMentions(m); if (!ment[0]) return R('Use: /roubar @user');
      setCooldown(u,'roubar');
      if (Math.random()<0.4) { u.preso=true; u.presoAte=Date.now()+15*60*1000; saveUser(u); return R('🚔 Preso roubando! 15min'); }
      const tu = getUser(ment[0]);
      const v = Math.min(tu.carteira, rand(1000,20000));
      tu.carteira-=v; u.carteira+=v;
      saveUser(u); saveUser(tu);
      return R(`🥷 Roubou ${fmt(v)} de @${numFromJid(ment[0])}`, {mentions:[ment[0]]});
    }
    case 'assaltobanco': {
      const sub = args[0];
      const aId = jid;
      if (sub === 'finalizar') {
        const a = db.assaltos[aId];
        if (!a) return R('Nenhum assalto em andamento.');
        if (a.membros.length<2) return R('❌ Mínimo 2 pessoas');
        if (Math.random()<0.5) {
          for (const j of a.membros) { const x=getUser(j); x.preso=true; x.presoAte=Date.now()+20*60*1000; saveUser(x); }
          delete db.assaltos[aId]; saveDB(db);
          return R('🚔 ASSALTO FALHOU! Todos presos por 20min.', {mentions:a.membros});
        }
        const total = rand(50000, 300000); const por = Math.floor(total/a.membros.length);
        for (const j of a.membros) { const x=getUser(j); x.carteira+=por; saveUser(x); }
        delete db.assaltos[aId]; saveDB(db);
        return R(`🏦💰 ASSALTO BEM-SUCEDIDO!\nTotal: ${fmt(total)} | Por pessoa: ${fmt(por)}`, {mentions:a.membros, image:IMG});
      }
      if (u.carteira<10000) return R('💸 Taxa de R$10.000 pra entrar');
      if (!db.assaltos[aId]) db.assaltos[aId] = { membros: [], iniciado: Date.now() };
      if (db.assaltos[aId].membros.includes(sender)) return R('Já está no plano.');
      db.assaltos[aId].membros.push(sender);
      u.carteira -= 10000; saveUser(u); saveDB(db);
      return R(`🏦 Você entrou no assalto! (${db.assaltos[aId].membros.length} membros)\nQuando 2+ entrarem, use /assaltobanco finalizar`);
    }
    case 'presos': {
      const ps = Object.values(db.users).filter(x=>x.preso && Date.now()<x.presoAte);
      if (!ps.length) return R('🆓 Ninguém preso');
      return R(`⛓️ *PRESOS*\n${ps.map(x=>`• @${numFromJid(x.jid)} (${tempoStr(Math.ceil((x.presoAte-Date.now())/1000))})`).join('\n')}`, {mentions:ps.map(x=>x.jid)});
    }
    case 'subornar': {
      const sub = args[0];
      if (sub === 'pagar') {
        if (!u.suborno) return R('❌ Negocie primeiro: /subornar');
        if (u.carteira<u.suborno) return R(`💸 Falta ${fmt(u.suborno-u.carteira)}`);
        u.carteira-=u.suborno; u.preso=false; u.suborno=0; saveUser(u);
        return R('🤝 Suborno pago. Você está livre!');
      }
      if (!u.preso) return R('Você não está preso.');
      u.suborno = rand(5000, 30000); saveUser(u);
      return R(`🤝 Guarda aceita ${fmt(u.suborno)}. Use */subornar pagar*`);
    }

    // ========= CASSINO =========
    case 'tigrinho': case 'roleta': case 'blackjack': case 'dados': {
      const v = parseInt(args[0]); if (!v||v<=0||v>u.carteira) return R('Use: /'+cmd+' [valor]');
      const win = Math.random() < (cmd==='blackjack'?0.45:0.4);
      const mult = cmd==='dados'?2: cmd==='tigrinho'? (Math.random()<0.05?10:2.5):2.2;
      if (win) { const g = Math.floor(v*mult); u.carteira += (g-v); saveUser(u); return R(`🎰 GANHOU! +${fmt(g-v)}`); }
      u.carteira-=v; saveUser(u); return R(`💸 Perdeu ${fmt(v)}`);
    }

    // ========= MERCADO =========
    case 'loja': {
      const t = Object.entries(ITENS_LOJA).map(([id,i])=>`• ${i.nome} - ${fmt(i.preco)} [/comprar ${id}]`).join('\n');
      return R(`🏪 *LOJA*\n${t}`);
    }
    case 'comprar': {
      const id = args[0]; const it = ITENS_LOJA[id];
      if (!it) return R('Item inexistente. /loja');
      if (u.carteira<it.preco) return R('💸 Sem grana');
      u.carteira -= it.preco; u.inventario[id] = (u.inventario[id]||0)+1; saveUser(u);
      return R(`🛍️ Comprou ${it.nome}`);
    }
    case 'vender': {
      const id = args[0];
      if (id==='tudo') {
        let total=0; for (const [k,q] of Object.entries(u.inventario)) { const it=ITENS_LOJA[k]; if(it){total+=Math.floor(it.preco*0.5)*q;} }
        u.inventario = {}; u.carteira+=total; saveUser(u);
        return R(`🏷️ Vendeu tudo: +${fmt(total)}`);
      }
      const it = ITENS_LOJA[id]; if (!it||!u.inventario[id]) return R('Não tem');
      const v = Math.floor(it.preco*0.5); u.inventario[id]--; if(!u.inventario[id]) delete u.inventario[id];
      u.carteira+=v; saveUser(u);
      return R(`🏷️ Vendeu ${it.nome} por ${fmt(v)}`);
    }
    case 'inventario': {
      const e = Object.entries(u.inventario);
      if (!e.length) return R('🎒 Vazio');
      return R(`🎒 *INVENTÁRIO*\n${e.map(([k,q])=>`• ${ITENS_LOJA[k]?.nome||k} x${q}`).join('\n')}`);
    }
    case 'equipar': {
      const id = args[0];
      if (!u.inventario[id]) return R('Não tem esse item');
      return R(`✅ ${ITENS_LOJA[id]?.nome||id} equipado!`);
    }
    case 'daritem': {
      const ment = getMentions(m); const id = args[1]; const q = parseInt(args[2])||1;
      if (!ment[0]||!id) return R('Use: /daritem @user [item] [qtd]');
      if (!u.inventario[id]||u.inventario[id]<q) return R('Sem itens suficientes');
      const tu = getUser(ment[0]);
      u.inventario[id]-=q; if(!u.inventario[id]) delete u.inventario[id];
      tu.inventario[id] = (tu.inventario[id]||0)+q;
      saveUser(u); saveUser(tu);
      return R(`🎁 Enviou ${q}x ${ITENS_LOJA[id]?.nome||id} para @${numFromJid(ment[0])}`,{mentions:[ment[0]]});
    }

    default:
      return; // comando inexistente: ignorar
  }
}

module.exports = { handleMessage };
