const axios = require('axios');
const fs = require('fs');
const moment = require('moment-timezone');
const cache = './.temp';

async function stream(url, type) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const path = `${cache}/${Date.now()}.${type}`;
        fs.writeFileSync(path, response.data);
        setTimeout(() => fs.unlinkSync(path), 1000 * 60);
        return fs.createReadStream(path);
    } catch (error) {
        console.error(error);
    }
}

function formatted(number) {
    switch (true) {
        case number >= 1000000:
            return (number / 1000000).toFixed(1) + "M";
        case number >= 1000:
            return (number / 1000).toFixed(1) + "k";
        default:
            return number;
    }
}

module.exports = {
    name: "atd",
    alias: ['autodown'],
    author: "Nguyên Blue",
    category: "GROUPS",
    version: "1.0",
    nopre: false,
    admin: true,
    wait: 3,
    desc: "autodown khi phát hiện liên kết",
    async onCall({ message }) {
        // Implement as needed
    },
    async onMessage({ message }) {
        try {
            if (!message.body) return;

            const urls = message.body.match(
                /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
            );

            if (!urls) return;

            for (const url of urls) {
                if (/tiktok/.test(url)) {
                    // Handle TikTok URLs
                    const host = 'https://www.tikwm.com';
                    const res = await axios.get(`${host}/api`, {
                        params: {
                            url: url,
                            count: 12,
                            cursor: 0,
                            hd: 1
                        }
                    });

                    message.react("⏱️");
                    let attachment = [];

                    if (res.data && res.data.data) {
                        const data = res.data.data;

                        if (data.play && !data.images) {
                            const path = `${cache}/${Date.now()}.mp4`;
                            const response = await axios.get(data.play, { responseType: "arraybuffer" });
                            const buffer = Buffer.from(response.data);
                            fs.writeFileSync(path, buffer);
                            attachment.push(fs.createReadStream(path));
                        }

                        if (data.images) {
                            for (let i = 0; i < data.images.length; i++) {
                                const path = `${cache}/${i + 1}.jpg`;
                                const response = await axios.get(data.images[i], { responseType: "arraybuffer" });
                                const buffer = Buffer.from(response.data);
                                fs.writeFileSync(path, buffer);
                                attachment.push(fs.createReadStream(path));
                            }
                        }

                        await message.send({
                            body: `${data.title || "Không Có Tiêu Đề"}\n👀 ${formatted(data.play_count)} | ❤ ${formatted(data.digg_count)} | 💬 ${formatted(data.comment_count)} | 🔄 ${formatted(data.share_count)}`,
                            attachment,
                        }, message.threadID);

                        message.react("✅");
                    }
                } else if (/capcut/.test(url)) {
                    // Handle CapCut URLs
                    const linkapi = "https://apitntxtrick.onlitegix.com/capcut";
                    const res = await axios.get(`${linkapi}?url=${url}`);
                    const { title, description, usage, video } = res.data;

                    message.react("⏱️");
                    let attachment = [];

                    if (video) {
                        const path = `${cache}/${Date.now()}.mp4`;
                        const response = await axios.get(video, { responseType: "arraybuffer" });
                        const buffer = Buffer.from(response.data);
                        fs.writeFileSync(path, buffer);
                        attachment.push(fs.createReadStream(path));
                    }

                    await message.send({
                        body: `
📝 Tiêu đề: ${title || "Không Có Tiêu Đề"} 
🗒 Mô tả: ${description || "Không Có Mô Tả"}
📸 Lượt dùng: ${usage || "Không Có Dữ Liệu"}
🌸 Tự động tải video từ CapCut
`,
                        attachment,
                    }, message.threadID);

                    message.react("✅");
                } else if (/youtu\.be|youtube\.com/.test(url)) {
                    // Handle YouTube URLs
                    const linkapi = "https://apitntxtrick.onlitegix.com/downall";
                    const res = await axios.get(`${linkapi}?link=${url}`);
                    const { title, medias } = res.data.data;

                    message.react("⏱️");
                    let attachment = [];

                    if (medias && medias.url) {
                        const stream = await axios.get(medias.url[5], { responseType: "stream" }); // MP3
                        attachment.push(stream.data);

                        // Optional: Download and send the video file
                        const videoStream = await axios.get(medias.url[0], { responseType: "stream" }); // Video
                        attachment.push(videoStream.data);
                    }

                    await message.send({
                        body: `📝 Tiêu đề: ${title}`,
                        attachment,
                    }, message.threadID);

                    message.react("✅");
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
};
