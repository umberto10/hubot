// consts
const config = require('./hb.json');
const Discord = require('discord.js');
const hb = new Discord.Client();
const music = require('./yt-music');

// greetings routine when bot ready
hb.once('ready', () => {
    console.log('Ready!');
    console.log(hb.user);
    const chn = hb.channels.cache.get("708384452539056218"); // hubot-testy
    chn.send('Hello there!'); // greetings
    // set activity & status of hb - deprecated?
    hb.user.setStatus('dnd').then(() => console.log('status set to dnd'))
    .catch(console.error);

    hb.user.setActivity('Magiczni studenci WPPT i jak ich znaleźć', { type: 'WATCHING'})
    .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
    .catch(console.error);
});

// reconnecting
hb.once('reconnecting', () => {
    console.log('Reconnecting!');
});

// disconnect
hb.once('disconnect', () => {
    console.log('Disconnect!');
});

// activity on message
hb.on('message', message => {
    if (!message.content.startsWith(config.prefix) && !message.mentions.users.has(hb.user.id)) { return; }
    console.log(message.content);
    args = message.content.split(' ').slice(1);
    music.bot.vchan = message.member.voice.channel;
    switch (args[0]) {
        case 'ping': 
            message.channel.send('Pong!');
            break;
        case 'umrzyj':
            message.channel.send('Bye!').then(() => {
                hb.destroy();
            });
            break;
        /*case 'goaway': // dk how to stop playing after leaving soooooo...
            message.member.voice.channel.leave();
            break; */
        case 'yt':
            music.hbAddSong(message);
            break;
        case 'skip':
            music.hbSkipSong(message);
            break;
        case 'ytl':
            music.hbPlaylistMusic(message);
            break;
        case 'pause':
            music.hbPauseMusic(message);
            break;
        case 'resume':
            music.hbResumeMusic(message);
            break;
        case 'stop':
            music.hbStopMusic(message);
            break;
        case 'vol':
            music.setVol(message, args);
            break;
        case 'tabaka':
            message.reply('tabaka zniszczy Ci życie :c').then( msg => msg.delete({ timeout: 3000 }));
            break;
        case 'info':
            info(message);
            break;
        default:
            if (message.mentions.users.has(hb.user.id)) {
                 message.reply("Bobie jeden! :face_with_symbols_over_mouth:"); 
            } else {
                message.channel.send(`**Nie znam:** ${args}`);
            }
            break;
    }
});

// info about cmds
function info(message) {
    let info = `**[Hubobot komendy]**\n`;
    info += `\`ping\`\n`;
    info += `\`umrzyj\`\n`;
    info += `\`tabaka\`\n`;
    info += `\`yt\` *link/słowa_klucze*\n`;
    info += `\`ytl\` *link_do_playlisyt_z_yt*\n`;
    info += `\`pause/resume/stop**\`\n`;
    info += `\`vol\` *nr*\n`;
    message.channel.send(info);
}

// login to server
hb.login(config.token);
