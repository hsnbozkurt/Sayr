const { Client, MessageEmbed } = require('discord.js');
const client = new Client();
const { token, dbname } = require('./config.json');
const Keyv = require('keyv');
const db = new Keyv(`sqlite://./${dbname}.sqlite`);
const globalPrefix = 'gizliprefix';
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
});
client.on('guildCreate', async guildo => {
	db.set(`prefix.${guildo.id}`, '*');
	db.set(`Puanlar.${guildo.id}`, []);
	db.set(`Atlama.${guildo.id}`, 1);
	client.user.setActivity(`${client.guilds.cache.size} Sunucudaki ${client.users.cache.size} Oyuncuyu`, { type: 'WATCHING' });
});
client.on('message', async message => {
	if (message.author.bot) return;
	if (message.channel.id == await db.get(`Okanal.${message.guild.id}`)) {
		db.get(`Sayı.${message.guild.id}`).then(async Sayı => {
			// eslint-disable-next-line prefer-const
			let sonkisi = await db.get(`Sonkisi.${message.guild.id}`);
			if (!sonkisi) {
				message.delete();
				await db.set(`Sonkisi.${message.guild.id}`, 1);
			}
			else if (sonkisi == message.author.id) {
				message.delete();
				message.channel.send('Üst Üste Yazamazsın').then(m2 => {
					const ms = '20000';
					m2.delete({ timeout: ms });
				});
			}
			else if (sonkisi !== message.author.id) {
				let atlama = await db.get(`Atlama.${message.guild.id}`);
				if (!atlama) {
					atlama = 1;
					await db.set(`Atlama.${message.guild.id}`, atlama);
				}
				if (message.content == Sayı + atlama) {
					await db.set(`Sonkisi.${message.guild.id}`, message.author.id);
					let Puanlar = await db.get(`Puanlar.${message.guild.id}`);
					if (!Puanlar) {Puanlar = [];}
					const puan = Puanlar.find(p => p.id == message.author.id);
					if (!puan) {
						Puanlar.push({
							id : message.author.id,
							puan :1,
						});
						message.delete();
						await db.set(`Puanlar.${message.guild.id}`, Puanlar);
					}
					puan.puan = puan.puan + 1;
					await db.set(`Puanlar.${message.guild.id}`, Puanlar);
					await db.set(`Sayı.${message.guild.id}`, Sayı + atlama);
					let nick = '';
					if (message.member.nickname) {nick = message.member.nickname;}
					else {nick = message.author.username;}
					// eslint-disable-next-line prefer-const
					let webhooks = await message.channel.fetchWebhooks(), webhook = webhooks.find(wh => wh.name == 'Sayr');
					if (!webhook) webhook = await message.channel.createWebhook('Sayr').catch(() => null);
					if (webhook) {
						webhook.send(message.content, { username:nick, avatarURL:message.author.displayAvatarURL({ dynamic:true }) }).then(m => client.channels.fetch(m.channel_id).then(c=> c.messages.fetch(m.id).then(m2 => m2.react('✅'))));
						message.delete();
					}
				}
				else {return message.delete();}
			}
		});
	}

	let args;
	// handle messages in a guild
	if (message.guild) {
		let prefix;

		if (message.content.startsWith(globalPrefix)) {
			prefix = globalPrefix;
		}
		else {
			// check the guild-level prefix
			const guildPrefix = await db.get(`prefix.${message.guild.id}`);
			if (message.content.startsWith(guildPrefix)) prefix = guildPrefix;
		}

		// if we found a prefix, setup args; otherwise, this isn't a command
		if (!prefix) return;
		args = message.content.slice(prefix.length).trim().split(/\s+/);
	}
	else {
		// handle DMs
		return message.channel.send('https://discord.com/oauth2/authorize?client_id=' + client.user.id + '&permissions=0&scope=bot');
	}

	// get the first space-delimited argument after the prefix as the command
	const command = args.shift().toLowerCase();
	if (command == 'ayarlar') {
		if (!message.member.hasPermission('MANAGE_GUILD')) {return message.reply('Bu Menüye Erişemezsin');}
		else if (args[0].toLowerCase() == 'atlama') {
			if (!args[1]) {
				const atlama = await db.get(`Atlama.${message.guild.id}`);
				const embed = new MessageEmbed()
					.setAuthor(`${message.guild.name} Atlama Ayarı Açıklaması`, message.guild.iconURL({ dynamic:true }))
					.setFooter(`${message.author.username} Tarafından İstendi`, message.author.displayAvatarURL({ dynamic:true }))
					.setTimestamp(Date.now())
					.setDescription(`Atlama Oyun Sırasında Atlanacak Sayıyı Belirler \n Şuanda Atlanan Sayı ${atlama} \n ⚠️ Uyarı Sayı Değiştirildiğinde Oyun Yeniden Başlar`)
					.setColor('RANDOM');
				message.channel.send(embed);
			}
			else if (isNaN(args[1])) {
				const atlama = await db.get(`Atlama.${message.guild.id}`);
				const embed = new MessageEmbed()
					.setAuthor(`${message.guild.name} Atlama Ayarı Açıklaması`, message.guild.iconURL({ dynamic:true }))
					.setFooter(`${message.author.username} Tarafından İstendi`, message.author.displayAvatarURL({ dynamic:true }))
					.setTimestamp(Date.now())
					.setDescription(`Atlama Oyun Sırasında Atlanacak Sayıyı Belirler \n Şuanda Atlanan Sayı ${atlama} \n ⚠️ Uyarı Sayı Değiştirildiğinde Oyun Yeniden Başlar
⚠️ Bu Bir Bug Değil Geçersiz Sayı Girdiğin İçin Bu Mesajı Aldın`)
					.setColor('RANDOM');
				message.channel.send(embed);
			}
			else if (!isNaN(args[1])) {
				await db.set(`Atlama.${message.guild.id}`, Number(args[1]));
				await db.set(`Sayı.${message.guild.id}`, 0);
				const embed = new MessageEmbed()
					.setAuthor(`${message.guild.name} Ayarlar`, message.guild.iconURL({ dynamic:true }))
					.setFooter(`${message.author.username} Tarafından İstendi`, message.author.displayAvatarURL({ dynamic:true }))
					.setTimestamp(Date.now())
					.setDescription(`✅ Atlanacak Sayı ${args[1]} Olarak Değiştirildi`)
					.setColor('RANDOM');
				message.channel.send(embed);
			}
		}
	}
	if (command == 'prefix') {
		if (message.member.hasPermission('MANAGE_GUILD')) {
			if (args.length) {
				await db.set('prefix.' + message.guild.id, args[0]);
				return message.channel.send(`Başarıyla prefixi \`${args[0]}\` olarak değiştirdin`);
			}
		}
		return message.channel.send(`Prefix is \`${await db.get('prefix.' + message.guild.id)}\``);
	}
	else if (command == 'oyna') {
		if (message.mentions.channels.first()) {
			if (message.member.hasPermission('MANAGE_CHANNELS')) {
				await db.set(`Okanal.${message.guild.id}`, message.mentions.channels.first().id);
				await db.set(`Sayı.${message.guild.id}`, 0);
				message.mentions.channels.first().send('Oyun Başladı! İyi Oyunlar');
			}
			else {return message.channel.send('🚫 Üzgünüm Ama Oyunu Başlatmak İçin Kanalları Yönet Yetkin Olması Lazıms');}
		}
	}
	if (command.toLowerCase() == 'sıralama') {
		let str = '';
		db.get(`Puanlar.${message.guild.id}`).then(puanlar => {
			puanlar.sort(function(a, b) {
				return a.puan - b.puan;
			});
			puanlar.reverse();
			puanlar = puanlar.slice(0, 10);
			puanlar.forEach((puan, index) => {
				str = str + `${index + 1}. <@${puan.id}> Puanı : ${puan.puan} \n`;
			});
			const emb = new MessageEmbed()
				.setDescription(str)
				.setColor('RANDOM')
				.setAuthor(`${message.guild.name} Puan Sıralaması`, message.guild.iconURL({ dynamic:true }))
				.setFooter(`${message.author.username} Tarafından İstendi`, message.author.displayAvatarURL({ dynamic:true }))
				.setTimestamp(Date.now());
			message.channel.send(emb);
		});
	}
	if (command.toLowerCase() == 'puan') {
		if (message.mentions.members.first()) {
			db.get(`Puanlar.${message.guild.id}`).then(puanlar => {
				let str = 's';
				puanlar.sort(function(a, b) {
					return a.puan - b.puan;
				});
				puanlar.reverse();
				const puan = puanlar.find(p => p.id == message.mentions.members.first().id);
				const sıra = puanlar.findIndex(p => p.id == message.mentions.members.first().id);
				const toplamkisi = puanlar.length;
				if (sıra == 0) {
					str = `${message.guild.name} Deki Herkesten Daha Fazla Puana Sahipsin , Tebrikler`;
					const embed = new MessageEmbed()
						.setAuthor(`${message.guild.name} Puan Sıralaması`, message.guild.iconURL({ dynamic:true }))
						.setFooter(`${message.author.username} Tarafından İstendi`, message.author.displayAvatarURL({ dynamic:true }))
						.setTimestamp(Date.now())
						.setColor('RANDOM')
						.setDescription(`${toplamkisi} Kişi Arasında ${sıra + 1}. Sıradasın Puanın ${puan.puan} \n ${str}`);
					message.channel.send(embed);
				}
				else {
					const onpuan = puanlar[sıra - 1];
					message.guild.members.fetch(onpuan.id).then(önkisi => {
						str = `Önündeki <@${önkisi.user.id}> yi Geçmek için ${onpuan.puan - puan.puan + 1} Puana ihtiyacın var`;
						const embed = new MessageEmbed()
							.setAuthor(`${message.guild.name} Puan Sıralaması`, message.guild.iconURL({ dynamic:true }))
							.setFooter(`${message.author.username} Tarafından İstendi`, message.author.displayAvatarURL({ dynamic:true }))
							.setTimestamp(Date.now())
							.setColor('RANDOM')
							.setDescription(`${toplamkisi} Kişi Arasında ${sıra + 1}. Sıradasın Puanın ${puan.puan} \n ${str}`);
						message.channel.send(embed);
					});
				}
			});
		}
		else {
			db.get(`Puanlar.${message.guild.id}`).then(puanlar => {
				let str = 's';
				puanlar.sort(function(a, b) {
					return a.puan - b.puan;
				});
				puanlar.reverse();
				const puan = puanlar.find(p => p.id == message.author.id);
				const sıra = puanlar.findIndex(p => p.id == message.author.id);
				const toplamkisi = puanlar.length;
				if (sıra == 0) {
					str = `${message.guild.name} Deki Herkesten Daha Fazla Puana Sahipsin , Tebrikler`;
					const embed = new MessageEmbed()
						.setAuthor(`${message.guild.name} Puan Sıralaması`, message.guild.iconURL({ dynamic:true }))
						.setFooter(`${message.author.username} Tarafından İstendi`, message.author.displayAvatarURL({ dynamic:true }))
						.setTimestamp(Date.now())
						.setColor('RANDOM')
						.setDescription(`${toplamkisi} Kişi Arasında ${sıra + 1}. Sıradasın Puanın ${puan.puan} \n ${str}`);
					message.channel.send(embed);
				}
				else {
					const onpuan = puanlar[sıra - 1];
					message.guild.members.fetch(onpuan.id).then(önkisi => {
						str = `Önündeki <@${önkisi.user.id}> u Geçmek için ${onpuan.puan - puan.puan + 1} Puana ihtiyacın var`;
						const embed = new MessageEmbed()
							.setAuthor(`${message.guild.name} Puan Sıralaması`, message.guild.iconURL({ dynamic:true }))
							.setFooter(`${message.author.username} Tarafından İstendi`, message.author.displayAvatarURL({ dynamic:true }))
							.setTimestamp(Date.now())
							.setColor('RANDOM')
							.setDescription(`${toplamkisi} Kişi Arasında ${sıra + 1}. Sıradasın Puanın ${puan.puan} \n ${str}`);
						message.channel.send(embed);
					});
				}
			});
		}
	}
});

client.login(token);