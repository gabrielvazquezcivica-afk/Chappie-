import yts from "yt-search";
import ytdl from "ytdl-core";
import fs from "fs";
import path from "path";

const handler = async (m, { conn, text, command }) => {
  if (!text || !text.trim()) {
    return m.reply("🔎 *Por favor ingresa el nombre de un video o una URL de YouTube.*");
  }

  await m.react("🎤");

  try {
    // Buscar el video en YouTube usando yts
    const res = await yts(text.trim());
    if (!res || !res.all || res.all.length === 0) {
      return m.reply("❌ *No se encontraron resultados para tu búsqueda.*");
    }

    const video = res.all[0];

    // Mensaje informativo
    const caption = `
╭─[ *YouTube Audio* ]─╮
│
│ 📝 *Título:* ${video.title}
│ 🧑🏻‍🎤 *Autor:* ${video.author.name}
│ ⏱️ *Duración:* ${video.duration.timestamp}
│ 👁️ *Vistas:* ${video.views.toLocaleString()}
│ 🔗 *Enlace:* ${video.url}
╰──────────────────╯

📥 *Descargando audio..*
`;

    // Descargar el thumbnail
    const thumbnailRes = await fetch(video.thumbnail);
    const thumbnail = await thumbnailRes.buffer();
    await conn.sendFile(m.chat, thumbnail, "thumb.jpg", caption, m);

    // Descargar el audio usando ytdl-core
    if (command === "play") {
      const outputDir = path.join(process.cwd(), "tmp");
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
      const outputFile = path.join(outputDir, `audio_${Date.now()}.mp3`);
      const audioStream = ytdl(video.url, { filter: "audioonly", quality: "highestaudio" });
      const writeStream = fs.createWriteStream(outputFile);

      audioStream.pipe(writeStream);

      writeStream.on("finish", async () => {
        await conn.sendFile(m.chat, outputFile, `${video.title}.mp3`, "", m, null, {
          mimetype: "audio/mpeg",
          ptt: false,
        });
        fs.unlinkSync(outputFile); // Limpia el archivo temporal
        await m.react("✅");
      });

      audioStream.on("error", (err) => {
        console.error("❌ Error al descargar audio:", err);
        m.reply("⚠️ *Ocurrió un error al descargar el audio.*");
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
    return m.reply("⚠️ *Ocurrió un error al procesar tu solicitud.*");
  }
};

handler.help = ["play"];
handler.tags = ["descargas", "youtube"];
handler.command = ["play"];

export default handler;