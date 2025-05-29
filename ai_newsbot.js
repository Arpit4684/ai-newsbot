
// --- AI NEWSBOT FINAL (Dark Theme + Gemini + Fresh News) ---

function sendNewsDigest() {
  const serpApiKey = "YOUR_SERPAPI_KEY";
  const gnewsApiKey = "YOUR_GNEWS_API_KEY";
  const geminiApiKey = "YOUR_GEMINI_API_KEY";

  const email = Session.getActiveUser().getEmail();
  const topics = ["Stock Market India", "AI trends", "Politics criticism", "Solar Power India", "Tech"];
  const allNews = {};
  const today = new Date().toISOString().split("T")[0];

  topics.forEach(topic => {
    allNews[topic] = [];

    const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(topic)}&tbm=nws&tbs=qdr:d&num=2&api_key=${serpApiKey}`;
    const serpResponse = UrlFetchApp.fetch(serpUrl);
    const serpArticles = JSON.parse(serpResponse.getContentText()).news_results || [];

    serpArticles.forEach(article => {
      allNews[topic].push({
        title: article.title,
        link: article.link,
        source: article.source,
        content: article.snippet || "No description.",
        image: article.thumbnail || ""
      });
    });

    Utilities.sleep(1500);

    const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&max=2&from=${today}&token=${gnewsApiKey}`;
    const gnewsResponse = UrlFetchApp.fetch(gnewsUrl);
    const gnewsArticles = JSON.parse(gnewsResponse.getContentText()).articles || [];

    gnewsArticles.forEach(article => {
      allNews[topic].push({
        title: article.title,
        link: article.url,
        source: article.source.name,
        content: article.description || "No description.",
        image: article.image || ""
      });
    });

    Utilities.sleep(1500);
  });

  // --- HTML Email Layout (Dark Theme) ---
  let html = `
    <div style="max-width:600px;margin:auto;font-family:Inter,sans-serif;background:#1a202c;padding:20px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.5);">
      <h2 style="font-size:24px;color:#edf2f7;margin-bottom:8px">Your Daily News Digest</h2>
      <p style="font-size:14px;color:#a0aec0;margin-bottom:24px">Curated articles for you</p>
  `;

  for (let topic in allNews) {
    html += `<h3 style="color:#90cdf4;font-size:18px;margin-top:24px">${topic}</h3>`;

    allNews[topic].forEach(article => {
      const bullets = getGeminiSummaryBullets(article.content, geminiApiKey);
      Utilities.sleep(6000);

      const image = (!article.image || article.image.includes("thumb") || article.image.length < 30) ? "" : article.image;

      html += `
        <div style="background:#2d3748;border-radius:8px;margin-top:16px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="width:70px; vertical-align:top; padding-right:14px;">
                ${image ? `<img src="${image}" width="60" height="60" style="border-radius:6px; object-fit:cover; display:block;" onerror="this.style.display='none';">` : ""}
              </td>
              <td style="vertical-align:top;">
                <h4 style="font-size:15px; margin:0 0 6px 0; color:#e2e8f0; line-height:1.5;">
                  <a href="${article.link}" target="_blank" style="color:#63b3ed; text-decoration:none;">${article.title}</a>
                </h4>
                <p style="margin:0 0 8px 0; color:#cbd5e0; font-size:12px;"><strong>Source:</strong> ${article.source}</p>
              </td>
            </tr>
          </table>
          <ul style="color:#edf2f7; font-size:14px; margin:12px 0 0 0; padding-left:20px;">
            ${bullets.map(point => `<li style="margin-bottom:6px;">${point}</li>`).join('')}
          </ul>
        </div>`;
    });
  }

  html += `</div>`;

  GmailApp.sendEmail(email, "Your News Digest", "View in HTML", { htmlBody: html });
}

// --- Gemini Summarization (3–4 Bullet Points, Gemini 2.0 Flash) ---
function getGeminiSummaryBullets(text, apiKey) {
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

  const prompt = '\nSummarize the following article into 3 to 4 clear bullet points.\nEach should be a standalone, informative sentence.\nAvoid intros, headings or conclusions. Return only the bullet points.\n\n + text + \n';

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
    const raw = JSON.parse(response.getContentText())?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    Logger.log("Gemini raw output:\n" + raw);

    let bullets = raw
      .split(/\n+/)
      .filter(line => line.trim().startsWith("-"))
      .map(line => line.replace(/^[-\s]+/, '').trim());

    if (bullets.length === 0 && raw.trim()) {
      bullets = raw.trim().split(/(?<=\.)\s+/).slice(0, 3);
    }

    return bullets.length > 0 ? bullets : ["(No summary available)"];
  } catch (e) {
    Logger.log("Gemini Error: " + e.toString());
    return ["(Summary unavailable)"];
  }
}
