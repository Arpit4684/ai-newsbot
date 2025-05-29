# ai-newsbot
AI-powered News Digest Bot using Gemini, SerpAPI, and GNews

AI NewsBot is a personal AI-powered email digest system that fetches relevant news from multiple sources, summarizes them using Google Gemini AI, and delivers them in a visually optimized HTML email. Designed with customization and automation in mind, it’s built for users who want curated news on topics they care about — delivered straight to their inbox.

⸻

🚀 Features
- Multi-source news fetching: Uses SerpAPI and GNews API to fetch daily news.
- AI summarization: Google Gemini 2.0 Flash API generates 3–4 bullet-point summaries per article.
- Dark mode email layout: Responsive, beautiful HTML layout with image previews and category grouping.
- Daily automation: Schedule delivery using Google Apps Script triggers.
- Easy customization: Control topics, number of articles, and frequency.

⸻

🧩 Tech Stack

Component	Tech Used

- Scripting Engine	Google Apps Script (JavaScript)
- AI Summarization	Google Gemini API
- News Sources	SerpAPI, GNews API
- Email Delivery	GmailApp (Google Workspace)
- Deployment	Google Apps Script
- Future Frontend	Planned with React


⸻

📦 Installation

1: Clone this Repository

-    git clone https://github.com/Arpit4684/ai-newsbot.git

2: Set up .env (example)

Create a .env.example file for reference:

- SERP_API_KEY=your-serpapi-key
- GNEWS_API_KEY=your-gnews-key
- GEMINI_API_KEY=your-gemini-key

3: Open Google Apps Script
	-	Go to https://script.google.com
	-	Paste contents of ai_newsbot_dark_theme.js
	-	Replace placeholders with your real API keys

4: Schedule It
	-	Go to Triggers
	-	Add Trigger → Choose sendNewsDigest
	-	Set type to Time-based (e.g., daily at 9AM)

⸻

## 📷 Sample Output

This is a screenshot of the AI NewsBot email layout (dark mode):

<img src="https://github.com/user-attachments/assets/c85a3c64-a028-4643-be9f-ab42f480f5f1" width="260" />


🛣️ Roadmap
-	News fetching from SerpAPI + GNews
-	Gemini AI summarization in bullet points
-	HTML email layout (light & dark themes)
-	React frontend to configure preferences
-	Browser extension version
-	Deploy on Google Cloud or serverless function

⸻

🙋‍♂️ Author

Arpit Singh
Passionate about AI + Automation + UX Design

⸻

📄 License

MIT License — free to use and modify with credit.
