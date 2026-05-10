# 🤖 Yuno Bot — WhatsApp Bot (Termux)

Bot completo de WhatsApp em Node.js + Baileys, com sistema de futebol (carreira), economia, governo, crime, cassino, loja, eventos, namoro e muito mais.

## ⚙️ Como rodar no Termux

1) Instale o Termux pela F-Droid (a versão da Play Store está desatualizada).

2) Abra o Termux e cole comando por comando:

```bash
pkg update && pkg upgrade -y
pkg install nodejs git unzip -y
termux-setup-storage
```

3) Coloque o `yuno-bot.zip` na pasta **Download** do celular e copie para a HOME do Termux:

```bash
cp /sdcard/Download/yuno-bot.zip ~
cd ~
unzip yuno-bot.zip
cd yuno-bot
```

4) Instale as dependências (pode demorar alguns minutos):

```bash
npm install
```

5) Inicie o Bot:

```bash
node index.js
```

6) Vai aparecer um **QR Code** no terminal. No WhatsApp:
**Configurações → Aparelhos conectados → Conectar um aparelho** → escaneie.

7) Pronto! O bot já está conectado. A sessão fica salva em `auth_info/`, então não precisa escanear de novo.

## 🛠️ Como manter rodando

- **Não feche o Termux**. Para que continue rodando com tela apagada:
```bash
termux-wake-lock
```
- Se cair, é só rodar `node index.js` de novo.
- Reinício automático em segundo plano (opcional):
```bash
npm install -g pm2
pm2 start index.js --name yuno
pm2 save
```

## 👑 Configurar Donos

- Owner principal: **5585992886293** (já configurado em `config.json`)
- Adicionar mais donos no grupo: `/adddono @user`
- Remover: `/rmdono @user`
- Listar donos: `/donos`

## 💎 Sistema VIP (manual via Pix)

- O usuário paga **R$ 4,00** via Pix na chave **85992886293**
- Envia comprovante no privado do dono
- Dono executa: `/darvip @user`

## 📋 Comandos principais

Use `/menu` no grupo pra ver tudo. Categorias:
- `/futebol` — Carreira de Jogador (com partidas dinâmicas via `/jogar` + `/lance`)
- `/economia` — Banco, Pix, depósitos
- `/negocios` — Imóveis, empréstimos, bolsa-família
- `/trabalho` — Empregos
- `/cargos` — Governo (admins/donos)
- `/ilegal` — Crime, roubo, assalto a banco
- `/cassino` — Tigrinho, roleta, blackjack, dados
- `/mercado` — Loja & inventário
- `/abrir` `/fechar` — Controle do grupo (admins/donos)
- `/sugestao` `/bug` — Feedback

## ⚠️ Aviso

- Baileys é uma biblioteca **não-oficial**. Use número secundário; existe risco de ban pelo WhatsApp.
- O bot só processa comandos em **grupos**. No privado ele divulga o link do grupo automaticamente.

Bom jogo! ⚽💎
