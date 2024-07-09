const express = require('express');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Directory to store downloaded audio files
const AUDIO_DIR = path.join(__dirname, 'audio');

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR);
}

app.get('/api/ytdl/dlaudio', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    const format = audioFormats[0]; // Pilih format audio pertama yang tersedia
    const fileName = `${uuidv4()}.mp3`;
    const filePath = path.join(AUDIO_DIR, fileName);

    const audioStream = ytdl(url, { format });

    audioStream.pipe(fs.createWriteStream(filePath));

    audioStream.on('end', () => {
      res.json({
        status: 'success',
        author: 'galih si pelampiasan',
        code: 200,
        data: {
          audio_url: `http://localhost:${PORT}/audio/${fileName}`
        }
      });
    });

    audioStream.on('error', (error) => {
      console.error('Error: ', error);
      res.status(500).json({ error: 'Failed to process URL' });
    });

  } catch (error) {
    console.error('Error: ', error);
    res.status(500).json({ error: 'Failed to process URL' });
  }
});

// Endpoint to serve audio files
app.get('/audio/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(AUDIO_DIR, fileName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

const server = createServer(app);

// Tambahkan ini untuk menjalankan server pada port tertentu
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
