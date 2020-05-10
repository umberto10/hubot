const config = require('./hb.json');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const search = require('youtube-search');

var music = {
    bot: {
        queue: [],
        volume: 0.05
    },

    // check and join voice channel
    checkJoinVoice: (message, f) => {
        if (!message.member.voice.channel) {
            message.reply("musisz na voice wbić debilu :man_shrugging:");
            return;
        }
        message.member.voice.channel.join().then(connection => {
            console.log("joined channel");
            if (!music.bot.dispatcher) { music.bot.connection = connection }
            f(message);
        });
    },

    // play music if silence
    playMusic: (message) => {
        if (music.bot.dispatcher) { return }
        music.hbPlayMusic(message, music.bot.connection);
    },

    // add video to queue
    add2Queue: (message, video) => {
        music.bot.queue.push(video);
        message.channel.send(`**Dodałem:** \`${video.title}\`\n`).then(msg => msg.delete({ timeout: 4000 }));
    },

    // song chooser
    hbChooseMusic: function (message, videos) {
        res = '';
        for (let i = 0; i < videos.length; i++) {
            res += `**[${i}]:**  \`${videos[i].title}\`\n`;
        }
        res += `**[${videos.length}]** \`Nie ma nic dla mnie...\`\n`;
        res += `**Wybieraj między** \`0 - ${videos.length}\``;

        message.channel.send(res).then(msg => {
            const filter = m => !isNaN(m.content) && m.content <= videos.length && m.content >= 0;
            const collector = message.channel.createMessageCollector(filter);

            collector.once('collect', m => {
                msg.delete();
                m.delete();
                if (m.content == videos.length) {
                    message.channel.send('Koniec granka').then(msg => msg.delete({ timeout: 5000 }));
                    return;
                }
                music.checkJoinVoice(message, () => {
                    // add to queue
                    music.add2Queue(message, videos[m.content]);
                    // play music
                    music.playMusic(message);
                });
            });
        });
    },

    // play first song in queue
    hbPlayMusic: function (message) {
        console.log(music.bot.queue);
        const video = music.bot.queue.shift();
        const next = music.bot.queue.length ? music.bot.queue[0].title : 'Koniec';
        const streamOptions = { seek: 0, volume: music.bot.volume };
        const stream = ytdl(video.link, { filter: 'audioonly' });

        // play and info
        music.bot.dispatcher = music.bot.connection.play(stream, streamOptions);
        res = `**Gram:** \`${video.title}\`\n`;
        res += `**Następne:** \`${next}\``;
        message.channel.send(res).then(msg => msg.delete({ timeout: 100000 }));

        // after song ended
        music.bot.dispatcher.on("finish", fin => {
            if (music.bot.queue.length) { return music.hbPlayMusic(message) }
            console.log("left channel");
        });
    },

    // add new song to queue
    hbAddSong: function (message) {
        const kwords = message.content.split(' ').slice(2);
        console.log(kwords[0]);
        return kwords[0].match(/http*/g) ? music.hbPlayLink(message) : music.searchOnYt(message);
    },

    // play from link
    hbPlayLink: function (message) {
        console.log("playlink")
        const kwords = message.content.split(' ').slice(2);
        ytdl(kwords[0], (err, info) => {
            music.add2Queue(message, { title: info.title, link: kwords[0] });
            music.checkJoinVoice(message, music.playMusic);
        });
    },

    // search for songs on yt
    searchOnYt: function (message) {
        const kwords = message.content.split(' ').slice(2).join(' ');
        const opts = {
            maxResults: 10,
            key: config.ytKey
        };
        search(kwords, opts, function (err, results) {
            if (err) return console.log(err);
            return music.hbChooseMusic(message, results); // json like
        });
    },

    // play playlist from yt
    hbPlaylistMusic: function (message) {
        music.checkJoinVoice(message, () => {
            const link = message.content.split(' ')[2];
            ytpl(link, (err, playlist) => {
                if (err) return console.log(err);
                playlist.items.forEach(i => {
                    if ("[Deleted video]" !== (i.title)) {
                        music.bot.queue.push({
                            link: i.url_simple,
                            title: i.title
                        });
                    }
                });
                music.playMusic(message);
            });
        });
    },

    // set volume
    setVol: function (message, agrs) {
        if (!music.bot.dispatcher) { return message.reply("Neeee"); }
        message.delete();
        if (isNaN(args[1])) return message.channel.reply('Pojebało?').then(msg => { msg.delete({ timeout: 5000 }) });
        message.reply(`Ustawiam vol na ${args[1]}`).then(msg => msg.delete({ timeout: 3000 }));
        music.bot.volume = args[1] / 100;
        music.bot.dispatcher.setVolume(music.bot.volume);
    },

    // skip song
    hbSkipSong: function (message) {
        message.delete({ timeout: 1000 })
        if (!music.bot.queue.length) {
            message.reply('Koniec piosenek :c').then(() => msg => msg.delete({ timeout: 5000 }));
            music.bot.dispatcher.end();
            music.bot.dispatcher = null;
            return;
        }
        music.hbPlayMusic(message);
    },

    // pause music
    hbPauseMusic: function (message) {
        message.delete({ timeout: 1000 })
        if (!music.bot.dispatcher) { return message.reply("Nic nie gra :v"); }
        if (music.bot.dispatcher.paused) { return message.reply("Już zapauzowany jestem ćwoku!"); }
        music.bot.dispatcher.pause();
    },

    // resume music
    hbResumeMusic: function (message) {
        message.delete({ timeout: 1000 })
        if (!music.bot.dispatcher) { return message.reply("Nic nie gra :v"); }
        if (!music.bot.dispatcher.paused) { return message.reply("Przecie gra piosenka"); }
        music.bot.dispatcher.resume();
    },

    // stop all muisc
    hbStopMusic: function (message) {
        music.bot.queue = [];
        music.bot.dispatcher.end();
    }
}

module.exports = music;