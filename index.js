const express = require('express');
const ytdl = require('ytdl-core');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (like index.html) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.get("/download", async (req, res) => {
  const videoURL = req.query.videoURL;
  if (!videoURL) {
    return res.status(400).send("Video URL is required.");
  }
  
  try {
    const info = await ytdl.getInfo(videoURL);
    // Clean the video title to create a safe filename
    const title = info.videoDetails.title
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_');

    // Determine the quality based on request parameters
    // If the user selects a resolution, try to pick that progressive format
    let qualityOption = req.query.quality || 'highest';
    if (req.query.resolution) {
      const desiredResolution = req.query.resolution;
      // Look for a progressive format (has both audio and video) matching the desired resolution
      const format = info.formats.find(
        (f) => f.qualityLabel === desiredResolution && f.hasAudio && f.hasVideo
      );
      if (!format) {
        return res.status(404).send("Requested resolution is not available for this video.");
      }
      // Use the itag of the desired format for downloading
      qualityOption = format.itag;
    }
    
    // Send the video as an attachment
    res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
    ytdl(videoURL, { quality: qualityOption })
      .pipe(res)
      .on('error', err => console.error("Stream error:", err));
      
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred: " + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});