const { google_API_KEY } = require('../../config.json');
const axios = require('axios');

async function getLatestVideo(channelId) {
        const url = `https://www.googleapis.com/youtube/v3/activities?part=snippet,contentDetails&channelId=${channelId}&maxResults=1&key=${google_API_KEY}`;
        console.log(url);

        const res = await axios.get(url);
        return res.data.items[0];
}

async function notifyYT(client) {
        console.log("ermm checking yt hting idk");

        const list = await client.youtubers.findAll();
        for (let youtuber of list) {
                const latest = await getLatestVideo(youtuber.channel_id);
                if (youtuber.last_upload === latest.contentDetails.upload.videoId) {
                        console.log(`no new vid by ${latest.snippet.channelTitle}`);
                        continue;
                };

                const channel = await client.channels.fetch(youtuber.notif_channel)
                channel.send({content: `new upload by **${latest.snippet.channelTitle}** wow!!\nhttps://youtu.be/${latest.contentDetails.upload.videoId}`});

                client.youtubers.update({ last_upload: latest.contentDetails.upload.videoId }, { where: { channel_id: youtuber.channel_id }})
        };
};


module.exports = {
        data: {
                name: "yt",
                aliases: ["youtube", "youtuber", "youtubers"],

        },
        
        extra: {
                notify: notifyYT
        },

        async execute(message) {
                const subcommand = message.reader.getString();
                switch (subcommand) {
                        case "add":
                                const id = message.reader.getString();
                                const notif_id = message.reader.getString();
                                if (!(id && notif_id)) {
                                        message.message.reply("needs yt channel id and notif channel id")
                                        break;
                                };
                                message.message.client.youtubers.create({
                                        channel_id: id,
                                        last_upload: "",
                                        notif_channel: notif_id
                                });
                                break;
                        case "remove":
                                const ch_id = message.reader.getString();
                                message.message.client.youtubers.destroy({ where: { channel_id: ch_id } });
                                break;
                        case "refresh":
                                message.message.reply("force refreshing...");
                                notifyYT(message.message.client);
                                break;
                        default:
                                message.message.reply("pls use following subcommands: add, remove, list");
                };
        
        }
};
