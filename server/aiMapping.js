// ─────────────────────────────────────────────────────────────────────────────
// Azure OpenAI Integration
// ─────────────────────────────────────────────────────────────────────────────

const AZURE_OPENAI_ENDPOINT = "https://qa-reaidy-open-ai.openai.azure.com";
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT = "gpt-4";
const AZURE_OPENAI_API_VERSION = "2024-02-01";

// Request timeout: abort any single API call after this many ms
const API_TIMEOUT_MS = 20_000;

// ─────────────────────────────────────────────────────────────────────────────
// Core Executor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes a call to Azure OpenAI.
 *
 * @param {string} prompt The prompt to send to the model.
 * @param {boolean} requireJson Whether to force json_object response format.
 * @returns {Promise<any>} The parsed JSON response.
 */
async function executeAzureOpenAI(prompt, requireJson = true) {
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

  const payload = {
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2, // Low temperature for more deterministic JSON matching
  };

  if (requireJson) {
    payload.response_format = { type: "json_object" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_API_KEY
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const isRateLimit = response.status === 429;

      if (isRateLimit) {
        console.error(`⚠️ Azure OpenAI Rate Limited (429)`);
        throw { isRateLimit: true, message: "Rate limit exceeded" };
      }

      throw new Error(`Azure OpenAI API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const messageContent = data.choices[0]?.message?.content;

    if (!messageContent) {
      throw new Error("No content returned from Azure OpenAI");
    }

    return JSON.parse(messageContent);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Azure OpenAI request timed out after ${API_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  }
}

/**
 * Executes a freeform chat call to Azure OpenAI (does not require JSON).
 *
 * @param {Array} messages Conversation history
 * @returns {Promise<string>} The AI's text response
 */
async function generateChatResponse(messages) {
  const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

  const systemPrompt = {
    role: "system",
    content: "You are 'My Body Qode AI', a helpful and friendly personal health companion. You answer questions concisely about genomic profiles, fitness, sleep, and nutrition. Be conversational and approachable. Do not format your response as JSON, just use plain text."
  };

  // If the frontend didn't pass a system prompt, we prepend ours
  const payloadMessages = messages[0]?.role === 'system' ? messages : [systemPrompt, ...messages];

  const payload = {
    messages: payloadMessages,
    temperature: 0.7,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_API_KEY
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`⚠️ Azure OpenAI Chat API Error (Status ${response.status})`, errorData);
      throw new Error(`Azure OpenAI Chat Error: ${response.status}`);
    }

    const data = await response.json();
    const messageContent = data.choices[0]?.message?.content;

    if (!messageContent) {
      throw new Error("No content returned from Azure OpenAI Chat");
    }

    return messageContent;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Azure OpenAI Chat request timed out after ${API_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostic helpers
// ─────────────────────────────────────────────────────────────────────────────

function getKeyPoolStatus() {
  // Since we are using a single Azure OpenAI instance now, return a simpler status
  return [
    {
      label: "Azure OpenAI (gpt-4)",
      status: "available",
      cooldownSeconds: 0,
      failCount: 0
    }
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Bulk Match
// Matches a pasted list of names (e.g. from a lab's sample-received sheet)
// against existing registered users in our own database.
// ─────────────────────────────────────────────────────────────────────────────

async function attemptSmartBulkMatchWithAI(pastedText, users) {
  const rawNames = pastedText.split(/[\n\t,]+/).map(s => s.trim()).filter(Boolean);
  const locallyMatchedIds = new Set();
  const unmatchedNames = [];

  try {
    // 1. First attempt to do a local exact/partial match to save AI tokens and improve accuracy
    rawNames.forEach(rawName => {
      const lowerRaw = rawName.toLowerCase();
      // Try to find a user whose name exactly matches or matches without titles (Dr., Mr., etc)
      const match = users.find(u => {
        if (!u.full_name) return false;
        const lowerDbName = u.full_name.toLowerCase();
        return lowerDbName === lowerRaw ||
          lowerDbName.replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/i, '').trim() === lowerRaw.replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/i, '').trim();
      });

      if (match) {
        locallyMatchedIds.add(match.id);
      } else {
        unmatchedNames.push(rawName);
      }
    });

    console.log(`🤖 Bulk Match: Locally matched ${locallyMatchedIds.size} names. Sending ${unmatchedNames.length} names to AI.`);

    // If everything was matched locally, return immediately!
    if (unmatchedNames.length === 0) {
      return { matchedIds: Array.from(locallyMatchedIds), unmatchedNames: [] };
    }

    // 2. Prepare slim users array for AI (only send users that haven't been matched yet)
    const slimUsers = users
      .filter(u => !locallyMatchedIds.has(u.id))
      .map(u => ({
        id: u.id,
        n: u.full_name || '',
        e: u.email || '',
        p: u.phone || ''
      }));

    const BATCH_SIZE = 15;
    let aiMatchedIds = [];
    let aiUnmatchedNames = [];

    for (let i = 0; i < unmatchedNames.length; i += BATCH_SIZE) {
      const batchNames = unmatchedNames.slice(i, i + BATCH_SIZE);
      const prompt = `
        You are a data matching assistant for a healthcare application.
        The user provided a raw list of names that could not be matched perfectly via simple text comparison.

        Unmatched Raw Names:
        ${JSON.stringify(batchNames)}

        Here is the list of remaining users in our database (id, n=name, e=email, p=phone):
        ${JSON.stringify(slimUsers)}

        Your task is to match the people mentioned in the unmatched raw names to the remaining users in the database.
        Account for typos, partial names, or format differences.

        Return ONLY a JSON object with two keys:
        "matched_ids": containing an array of integers representing the IDs of the matched users.
        "unmatched_names": containing an array of strings representing the raw names from the "Unmatched Raw Names" list that could NOT be matched to any database user.
        {
          "matched_ids": [1, 5, 23],
          "unmatched_names": ["John Doe", "Unknown Person"]
        }
      `;

      try {
        const parsed = await executeAzureOpenAI(prompt, true);
        if (parsed.matched_ids) aiMatchedIds.push(...parsed.matched_ids);
        if (parsed.unmatched_names) aiUnmatchedNames.push(...parsed.unmatched_names);
      } catch (err) {
        console.error("Error matching batch:", err);
        aiUnmatchedNames.push(...batchNames);
      }
    }

    console.log(`🤖 Bulk Match: AI found ${aiMatchedIds.length} matches and ${aiUnmatchedNames.length} unmatched.`);

    // Combine local matches with AI matches
    return {
      matchedIds: [...Array.from(locallyMatchedIds), ...aiMatchedIds],
      unmatchedNames: aiUnmatchedNames
    };
  } catch (error) {
    console.error("Azure OpenAI Bulk Match Error:", error?.message || error);
    if (error.response) {
      console.error("Response data:", await error.response.text().catch(() => ''));
    }
    // Even if AI fails, return whatever we managed to match locally, and all the unmatched names
    return {
      matchedIds: Array.from(locallyMatchedIds),
      unmatchedNames: unmatchedNames
    };
  }
}

module.exports = {
  getKeyPoolStatus,
  attemptSmartBulkMatchWithAI,
  generateChatResponse,
};
