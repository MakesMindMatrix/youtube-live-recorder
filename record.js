import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createObjectCsvWriter } from "csv-writer";

dotenv.config();

const API_KEY = process.env.YT_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

let nextPageToken = null;
let liveChatId = null;
let videoId = null;
let allMessages = [];
let polling = false;
let shuttingDown = false;
let errorCount = 0;
let videoTitle = "";

const MAX_ERRORS = 3;

// Ensure output folder exists
const outputDir = path.join(process.cwd(), "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Sanitize title for filename
function sanitizeTitle(title) {
  return title
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .substring(0, 60); // limit length
}

// Generate filename with VIDEO_ID
function getTimestampFilename() {
  const now = new Date();
  const formatted = now
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .split(".")[0];

  const cleanTitle = sanitizeTitle(videoTitle);

  return `live_${cleanTitle}_${videoId}_${formatted}.csv`;
}



// Save CSV safely
async function saveCSV() {
  if (allMessages.length === 0) {
    console.log("No messages captured. Nothing to save.");
    process.exit();
  }

  const filePath = path.join(outputDir, getTimestampFilename());

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "message_id", title: "MESSAGE_ID" },
      { id: "video_id", title: "VIDEO_ID" },
      { id: "user_name", title: "USER_NAME" },
      { id: "user_channel_id", title: "USER_CHANNEL_ID" },
      { id: "message", title: "MESSAGE" },
      { id: "published_at", title: "PUBLISHED_AT" }
    ]
  });

  await csvWriter.writeRecords(allMessages);

  console.log("CSV saved at:", filePath);
  process.exit();
}

// Graceful shutdown
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("\nShutting down safely...");
  polling = false;
  await saveCSV();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", async (err) => {
  console.error("Unexpected error:", err.message);
  await shutdown();
});

// Check if channel is live
async function checkIfLive() {
  try {
    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          channelId: CHANNEL_ID,
          eventType: "live",
          type: "video",
          key: API_KEY
        }
      }
    );
    

    if (res.data.items.length > 0) {
      videoId = res.data.items[0].id.videoId;
      console.log("Live detected:", videoId);
      await getLiveChatId();
    } else {
      console.log("No live found. Checking again in 30 seconds...");
      setTimeout(checkIfLive, 30000);
    }
  } catch (err) {
    console.error("Error checking live:", err.message);
    setTimeout(checkIfLive, 30000);
  }
}

// Get liveChatId
async function getLiveChatId() {
  try {
    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos",
      {
        params: {
          part: "liveStreamingDetails,snippet",
          id: videoId,
          key: API_KEY
        }
      }
    );

    videoTitle = res.data.items[0]?.snippet?.title || "live";

    liveChatId =
      res.data.items[0]?.liveStreamingDetails?.activeLiveChatId;

    if (!liveChatId) {
      console.log("Live chat not ready yet. Retrying...");
      setTimeout(getLiveChatId, 10000);
      return;
    }

    console.log("LiveChatId obtained.");
    polling = true;
    fetchMessages();
  } catch (err) {
    console.error("Error getting liveChatId:", err.message);
    setTimeout(getLiveChatId, 10000);
  }
}

// Poll chat messages (STABLE)
async function fetchMessages() {
  if (!polling) return;

  try {
    const res = await axios.get(
      "https://www.googleapis.com/youtube/v3/liveChat/messages",
      {
        params: {
          liveChatId,
          part: "snippet,authorDetails",
          pageToken: nextPageToken || undefined,
          key: API_KEY
        }
      }
    );

    errorCount = 0; // reset on success

    const { items, nextPageToken: newToken, pollingIntervalMillis } =
      res.data;

    for (const item of items) {
      allMessages.push({
        message_id: item.id,
        video_id: videoId,
        user_name: item.authorDetails.displayName,
        user_channel_id: item.authorDetails.channelId,
        message: item.snippet.displayMessage,
        published_at: item.snippet.publishedAt
      });
    }

    nextPageToken = newToken;

    setTimeout(fetchMessages, pollingIntervalMillis);

  } catch (err) {
    errorCount++;

    console.log(`Live API error (${errorCount}/${MAX_ERRORS})`);

    if (errorCount >= MAX_ERRORS) {
      console.log("Live confirmed ended.");
      polling = false;
      await saveCSV();
    } else {
      setTimeout(fetchMessages, 5000);
    }
  }
}

// Start
console.log("Monitoring channel for live stream...");
checkIfLive();
