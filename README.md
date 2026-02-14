📺 YouTube Live Chat Recorder

A Node.js script that automatically:

Detects when your YouTube channel goes live

Captures all live chat messages in real-time

Saves them locally as a CSV file

Includes video title, video ID, and timestamp in filename

Safely saves data even if you stop the script manually

🚀 What This Project Does

When you run the script:

It checks if your YouTube channel is currently live.

If not live → it keeps checking every 30 seconds.

If live detected:

Fetches video ID

Fetches liveChatId

Starts collecting chat messages

When:

Live ends automatically
OR

You press Ctrl + C

It generates a CSV file inside the output/ folder.

📂 Folder Structure
youtube-live-recorder/
│
├── record.js          # Main script
├── package.json       # Node dependencies
├── .env               # API credentials (NOT committed)
├── .env.example       # Sample env file
├── .gitignore
└── output/            # Generated CSV files

📄 CSV File Format

Generated file name format:

live_<VideoTitle>_<VideoID>_<YYYY-MM-DD_HH-MM-SS>.csv


Example:

live_Way_forward_Your_Internship_Journey_kBS84zZvPkU_2026-02-14_07-15-12.csv


CSV Columns:

Column	Description
MESSAGE_ID	Unique YouTube message ID
VIDEO_ID	YouTube video ID
USER_NAME	Display name of commenter
USER_CHANNEL_ID	Commenter's channel ID
MESSAGE	Chat message text
PUBLISHED_AT	Timestamp of message
🛠 Requirements

Node.js v18+

YouTube Data API v3 enabled

Google Cloud API Key

Your YouTube Channel ID

🔑 Setup Instructions
1️⃣ Clone the Repository
git clone https://github.com/MakesMindMatrix/youtube-live-recorder.git
cd youtube-live-recorder

2️⃣ Install Dependencies
npm install

3️⃣ Enable YouTube API

Go to Google Cloud Console

Create a project

Enable YouTube Data API v3

Create API Key

Restrict it to:

YouTube Data API v3

4️⃣ Configure Environment Variables

Create a .env file:

YT_API_KEY=YOUR_API_KEY_HERE
CHANNEL_ID=YOUR_CHANNEL_ID_HERE


Example:

YT_API_KEY=AIzaSyCxxxxxxxxxxxx
CHANNEL_ID=UC8s4wYXXXXXXXXXXXXXXXXXX

▶️ How To Run

Start the script:

node record.js


Behavior:

If no live → waits

If live detected → records chat

If live ends → saves CSV

If you press Ctrl+C → safely saves CSV

🛡 Stability Features

Retries API failures (prevents false shutdown)

Safe shutdown handler (Ctrl+C saves data)

Prevents file overwrite

Sanitizes video title for safe filenames

⚠️ Important Notes

You must run the script during the live stream.

YouTube API does NOT allow fetching chat after live ends.

Do NOT commit .env file (API key security).

📌 Future Improvements (Optional)

SuperChat tracking

Real-time message counter

Google Drive upload

Database storage

Sentiment analysis

Lead extraction from chat

👨‍💻 Author

Renuka Prasad BS
MindMatrix.io
