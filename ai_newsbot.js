// --- AI NEWSBOT UPDATED: NewsData.io + GNews Fallback + Gemini HTML + Image Fallback ---

/**
 * Main function to send the news digest.
 * Fetches news, processes it, generates HTML via Gemini, and sends an email.
 */
function sendNewsDigest() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const newsDataApiKey = scriptProperties.getProperty('NEWSDATA_API_KEY');
  const gnewsApiKey = scriptProperties.getProperty('GNEWS_API_KEY');
  const geminiApiKey = scriptProperties.getProperty('GEMINI_API_KEY');
  const email = Session.getActiveUser().getEmail(); // Sends to the active user's email
  const topics = ["India", "Cricket", "AI innovation", "World football", "Indian Stock market and trade"];
  const allNews = {};

  // --- Date Calculation for "Yesterday" (UTC-based for strictness) ---
  const now = new Date();
  // Get today's date at 00:00:00 UTC
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Get yesterday's date at 00:00:00 UTC
  const yesterdayUtc = new Date(todayUtc);
  yesterdayUtc.setUTCDate(todayUtc.getUTCDate() - 1); // Subtract one day from UTC date

  // For GNews API 'from' parameter (YYYY-MM-DD format based on UTC yesterday)
  const yesterdayISO = yesterdayUtc.toISOString().split("T")[0];

  /**
   * Helper function to check if an article's date falls *strictly* within yesterday's UTC calendar day.
   * @param {string} articleDateString The date string from the news API.
   * @returns {boolean} True if the date is yesterday UTC, false otherwise.
   */
  function isDateYesterdayUtc(articleDateString) {
    try {
      const articleDate = new Date(articleDateString); // Parse the article's date string
      // Normalize the article's date to the start of its UTC calendar day
      const articleDateUtcNormalized = new Date(Date.UTC(
        articleDate.getUTCFullYear(),
        articleDate.getUTCMonth(),
        articleDate.getUTCDate()
      ));
      // Compare the normalized UTC timestamps
      return articleDateUtcNormalized.getTime() === yesterdayUtc.getTime();
    } catch (e) {
      Logger.log("Error parsing article date: " + articleDateString + " - " + e.toString());
      return false; // If date string is invalid or unparseable, treat as not yesterday
    }
  }

  // --- MINIMUM CONTENT LENGTH REQUIREMENT for Article Summary ---
  // Articles must have at least this many characters in their description/content
  // for Gemini to generate meaningful summaries and commentary.
  const MIN_CONTENT_LENGTH = 150; // You can adjust this value (e.g., to 100, 200, etc.)

  // --- Fetch News for Each Topic ---
  topics.forEach(topic => {
    allNews[topic] = []; // Initialize array for current topic

    // --- NewsData.io (Using the 'latest' endpoint with strict UTC client-side filtering) ---
    // The free NewsData.io 'latest' endpoint is delayed by 12 hours and does not support
    // precise date filtering. We fetch a larger set of 'latest' and then strictly filter by UTC yesterday.
    try {
      // Increased 'size' to 5 to get more articles, increasing the chance of finding yesterday's.
      const newsDataUrl = `https://newsdata.io/api/1/news?apikey=${newsDataApiKey}&q=${encodeURIComponent(topic)}&language=en&country=in&category=top&size=5`;
      const response = UrlFetchApp.fetch(newsDataUrl);
      const articles = JSON.parse(response.getContentText()).results || [];

      articles.forEach(article => {
        // Prioritize 'description', then 'content' for summary input
        const articleContent = article.description || article.content || "";

        // Apply all filters: yesterday's date, and minimum content length
        if (article.pubDate && isDateYesterdayUtc(article.pubDate) && articleContent.length >= MIN_CONTENT_LENGTH) {
          // NewsData.io may provide image_url; if not, use placeholder for consistency before Gemini processes
          let image = article.image_url || "https://placehold.co/90x90/E2E8F0/4A5568?text=News";
          allNews[topic].push({
            title: article.title,
            link: article.link,
            source: article.source_id,
            content: articleContent, // 'content' field is passed for Gemini's processing
            image: image
          });
        }
      });
    } catch (e) {
      Logger.log("NewsData.io (Latest) failed for topic: " + topic + ". Error: " + e.toString());
    }

    Utilities.sleep(1500); // Pause to respect API rate limits (NewsData.io has a 10 requests/min limit on free tier)

    // --- GNews Fallback (Using 'from' parameter and strict UTC client-side filtering as safeguard) ---
    // GNews API's 'from' parameter for specific dates usually works better than NewsData.io's 'latest'.
    // The client-side filter provides an additional layer of certainty against any older articles.
    try {
      // Increased 'max' to 5 to get more articles, increasing the chance of finding yesterday's.
      // 'from' parameter requests articles published from yesterdayISO (UTC date).
      const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&max=5&from=${yesterdayISO}&sortby=relevance&token=${gnewsApiKey}`;
      const gnewsResponse = UrlFetchApp.fetch(gnewsUrl);
      const gnewsArticles = JSON.parse(gnewsResponse.getContentText()).articles || [];

      gnewsArticles.forEach(article => {
        // GNews typically only has 'description' for summary input
        const articleContent = article.description || "";

        // Apply all filters: yesterday's date, and minimum content length
        if (article.publishedAt && isDateYesterdayUtc(article.publishedAt) && articleContent.length >= MIN_CONTENT_LENGTH) {
          // GNews may provide image_url; if not, use placeholder for consistency before Gemini processes
          allNews[topic].push({
            title: article.title,
            link: article.url,
            source: article.source.name,
            content: articleContent, // 'content' field is passed for Gemini's processing
            image: article.image || "https://placehold.co/90x90/E2E8F0/4A5568?text=News"
          });
        }
      });
    } catch (e) {
      Logger.log("GNews failed for topic: " + topic + ". Error: " + e.toString());
    }

    Utilities.sleep(1500); // Pause to respect API rate limits (GNews has a 100 requests/day limit on free tier)
  });

  // --- Prepare News for Gemini (Filter out empty topics if desired, but keeping all if they have content) ---
  const filteredNewsForGemini = {};
  for (const topic in allNews) {
    // Only send topics to Gemini that actually have articles after filtering
    // This maintains categories with one article, as requested.
    if (allNews[topic].length > 0) {
      filteredNewsForGemini[topic] = allNews[topic];
    }
  }

  // --- Generate HTML with Gemini and Send Email ---
  // Only articles from yesterday (UTC) and with sufficient content will be in filteredNewsForGemini.
  // Gemini is prompted to handle missing images gracefully and avoid stray images.
  const html = getGeminiOptimizedHTML(filteredNewsForGemini, geminiApiKey);
  GmailApp.sendEmail(email, "Your News Digest", "View in HTML", { htmlBody: html });
}

/**
 * Fetches news data, constructs a prompt for Gemini, and generates an optimized HTML news digest.
 * This function is designed to be used within Google Apps Script.
 *
 * @param {Object} allNews An object where keys are topics and values are arrays of article objects.
 * Each article object should have: title, link, source, content (for AI summary), image.
 * @param {string} apiKey Your Google Gemini API Key.
 * @returns {string} The generated HTML content for the news digest, or an error message HTML.
 */
function getGeminiOptimizedHTML(allNews, apiKey) {
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

  // Use backticks (`) for multi-line string.
  // Escape any backticks within the prompt's text with a backslash (\`).
  const prompt = `
You are an expert email layout designer and editor with 10+ years of experience.

**You have access to the following tools/functions:**

1.  **\`summarize_article(article_text: str) -> Dict[str, Union[List[str], str]]\`**:
    This function takes the raw \`article_text\` as input and generates a concise summary along with an editor's interpretation.
    * **Step 1: Identify Main Idea:** Determine the central theme and core subject matter of the article.
    * **Step 2: Extract Key Information:** Pull out the most crucial facts and important details presented.
    * **Step 3: Condense to Bullet Points:** Formulate a brief and clear summary that captures the essence of the article in 3-4 bullet points.
    * **Step 4: Generate Editor's Commentary:** Create one insightful, detailed, and rich italicized sentence that adds to the reader's understanding, based on the article's content and relevance to a general reader.
    * **Returns:** A dictionary with two keys: \`bullet_points\` (List[str]) containing the 3-4 summary points, and \`editor_commentary\` (str) containing the single italicized sentence.

2.  **\`analyze_article_sentiment(article_text: str) -> str\`**:
    This function takes the raw \`article_text\` as input and performs sentiment analysis.
    * **Returns:** A string indicating the overall sentiment (e.g., "positive", "negative", "neutral", "mixed").

Create a well-structured, mobile-friendly, dark-themed HTML layout for a daily news digest. **STRICTLY ADHERE to the topic grouping provided in the JSON data.** When generating content, **assume the results of \`summarize_article\` (both bullet points and editor's commentary) will be used directly, and the sentiment badge will be dynamically generated using the output of the \`analyze_article_sentiment\` function.**

### Layout Requirements:
-   Use a dark background and light text.
-   For each topic:
    -   Display the topic name in a large, bold section header.
-   For each article must include:
    -   Show a card-like block with:
        -   A preview image at the top.
        -   The title in bold and linked (fontsize: 17px).
        -   Source label (small, grey text) (font size: 12px).
        -   **A small sentiment badge should appear next to the Source label.**
            * **The text within this badge must be the direct string output of the \`analyze_article_sentiment\` function.**
            * **The HTML for this badge should directly embed the background color based on the sentiment output:**
                - Positive: <span style="background-color: #28a745 !important; color: #ffffff !important; padding: 3px 6px; border-radius: 4px; font-size: 10px; margin-left: 5px; display: inline-block;">Positive</span>
                - Negative: <span style="background-color: #dc3545 !important; color: #ffffff !important; padding: 3px 6px; border-radius: 4px; font-size: 10px; margin-left: 5px; display: inline-block;">Negative</span>
                - Neutral: <span style="background-color: #6c757d !important; color: #ffffff !important; padding: 3px 6px; border-radius: 4px; font-size: 10px; margin-left: 5px; display: inline-block;">Neutral</span>
                - Mixed: <span style="background-color: #ffc107 !important; color: #212529 !important; padding: 3px 6px; border-radius: 4px; font-size: 10px; margin-left: 5px; display: inline-block;">Mixed</span>.
        -   3–4 bullet points as summary (white bullets, left aligned) (font size: 14px). **These bullet points are the \`bullet_points\` output of the \`summarize_article\` function.**
        -   One italicized sentence below the bullets (font size: 13px): an editor's commentary or interpretation. **This italicized sentence is the \`editor_commentary\` output of the \`summarize_article\` function.**
        -   **IMPORTANT**: If an article's 'image' field is "https://placehold.co/90x90/E2E8F0/4A5568?text=News" or empty, **DO NOT** generate an image tag or any image container for that article. Just omit the image entirely.
-   **CRITICAL**: Do **NOT** include any generic, default, or concluding images that are not directly provided as an 'image' URL within an article's JSON data. **ONLY** include images that are specific to an article and available in its 'image' field.
-   Optimise the color scheme to current professional newsletter standards.

Ensure consistent padding, margin, and card spacing. Use \`<div>\` or \`<table>\` layout, no JavaScript or \`<style>\` tags. Keep HTML clean.

Return **only** the HTML content starting from \`<div>...</div>\` that I can inject directly into Gmail.

Here is the news grouped by topic:
${JSON.stringify(allNews)}
`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(endpoint, options);
    let raw = JSON.parse(response.getContentText())?.candidates?.[0]?.content?.parts?.[0]?.text || "<div>(No content)</div>";
    raw = raw.replace(/```html|```/gi, '').trim();

    // --- NEW POST-PROCESSING STEP TO CLEAN UP MALFORMED HTML ---
    // This regex looks for an opening img tag followed by any characters until the end of the string
    // or until another opening div/table tag (indicating proper structure might resume).
    // It's aggressive to catch partial tags at the end.
    raw = raw.replace(/<img[^>]*$/g, ''); // Removes any incomplete <img> tag at the very end
    raw = raw.replace(/<div\s*style=['"]?[^>]*$/g, ''); // Removes incomplete div tag if it appears at the end
    raw = raw.replace(/<table\s*style=['"]?[^>]*$/g, ''); // Removes incomplete table tag if it appears at the end
    raw = raw.trim(); // Trim whitespace again after cleaning

    Logger.log("Gemini HTML Output (cleaned):\n" + raw);
    return raw;
  } catch (e) {
    Logger.log("Gemini HTML generation failed: " + e.toString());
    return "<div style='background:#1a202c;color:#edf2f7;padding:20px;'>Sorry, your news digest could not be generated today.</div>";
  }
}
