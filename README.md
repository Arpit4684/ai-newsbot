# AI NewsBot: A Smarter, Secure News Digest in Your Inbox

**AI NewsBot** is an intelligent, personal news digest system built entirely on Google Apps Script. It fetches daily news from multiple sources, uses the Google Gemini API for advanced summarization and analysis, and delivers a beautiful, dark-themed digest directly to your email.

It's designed for users who want a secure, automated, and highly-curated news experience on the topics they care about, without the noise.

---

## 🚀 Features

-   **Robust Multi-Source Fetching:** Primarily uses **NewsData.io** for fresh news and intelligently falls back to **GNews API** to ensure you never miss a beat.
-   **Advanced AI Content Generation:** Goes beyond simple summaries. For each article, Google Gemini generates:
    -   A concise **3-4 bullet-point summary**.
    -   An insightful **Editor's Commentary** in italics.
    -   A **Sentiment Analysis** badge (Positive, Negative, Neutral) for a quick emotional read.
-   **Secure and Automated:**
    -   **Zero Hardcoded Keys:** Uses Google Apps Script's `PropertiesService` to keep your API keys safe and out of the codebase.
    -   **Fully Automated:** Schedule daily, weekly, or custom delivery using built-in Google Apps Script triggers.
-   **Highly Precise Content Filtering:**
    -   **Strictly "Yesterday's News":** Fetches and filters articles published *only* on the previous calendar day (UTC) for a true daily digest.
    -   **Quality Control:** Ignores articles with insufficient content to ensure meaningful summaries.
-   **Professionally Designed Dark Mode Email:**
    -   A clean, mobile-friendly, and responsive HTML layout.
    -   Intelligently handles missing images to avoid broken layouts.

---

## 🧩 Tech Stack

| Component | Tech Used |
| :--- | :--- |
| **Scripting Engine** | Google Apps Script (JavaScript) |
| **AI Generation** | Google Gemini API (gemini-2.5-flash) |
| **News Sources** | NewsData.io API (Primary), GNews API (Fallback) |
| **Secret Management** | Apps Script `PropertiesService` |
| **Email Delivery** | GmailApp (Google Workspace) |
| **Deployment** | Google Apps Script Platform |

---

## 📦 Setup and Deployment (5 Minutes)

This project runs entirely on Google Apps Script, so no local environment or cloning is needed.

#### Step 1: Create a New Apps Script Project
1.  Go to [script.google.com](https://script.google.com) and click **New project**.
2.  Give your project a name, like "AI NewsBot".

#### Step 2: Paste the Code
1.  Delete the default `function myFunction() {}` code in the editor.
2.  Copy the entire content of the `ai_newsbot.gs` script file.
3.  Paste it into the `Code.gs` file in your new Apps Script project.
4.  Click the **Save project** (💾) icon.

#### Step 3: Securely Store Your API Keys
This project uses `PropertiesService` to keep your API keys secure. You must add them to the script's properties.

1.  In your Apps Script project, click the **Project Settings** (⚙️) icon on the left sidebar.
2.  Scroll down to the **Script Properties** section and click **Add script property**.
3.  Add the following three properties one by one. **The names must be exact.**

| Property (Name) | Value |
| :--- | :--- |
| `NEWSDATA_API_KEY` | `your-newsdata.io-api-key` |
| `GNEWS_API_KEY` | `your-gnews-api-key` |
| `GEMINI_API_KEY` | `your-google-gemini-api-key` |

4.  Click **Save script properties** after adding all three keys.

#### Step 4: Set Up the Automated Trigger
1.  Click the **Triggers** (⏰) icon on the left sidebar.
2.  Click **Add Trigger** in the bottom-right corner.
3.  Configure the trigger with these settings:
    -   **Choose which function to run:** `sendNewsDigest`
    -   **Choose which deployment to run:** `Head`
    -   **Select event source:** `Time-driven`
    -   **Select type of time based trigger:** `Day timer`
    -   **Select time of day:** `8am - 9am` (or your preferred time)
4.  Click **Save**. You will be asked to authorize the script's permissions. **Accept them.** The script needs permission to fetch URLs and send an email to you.

**That's it! Your AI NewsBot is now active and will deliver your first digest at the scheduled time.**

---

## 🛣️ Roadmap

-   [✅] Secure API key management with `PropertiesService`
-   [✅] News fetching from ~~SerpAPI~~ **NewsData.io** + GNews fallback
-   [✅] Advanced Gemini AI summarization, commentary, and sentiment analysis
-   [✅] Professional HTML email layout (dark theme)
-   [⬜️] Add a "light theme" option, configurable via a script property.
-   [⬜️] Build a simple React frontend to configure topics and settings.
-   [⬜️] Package as a browser extension for even easier setup.
-   [⬜️] Deploy on Google Cloud or a serverless function for more complex workflows.

---

## 🙋‍♂️ Author

**Arpit Singh**
*Passionate about AI + Automation + UX Design*

---

## 📄 License

[MIT License](https://opensource.org/licenses/MIT) — free to use and modify. Please provide credit if you use it in your own projects.
