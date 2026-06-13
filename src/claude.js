/**
 * Claude API wrapper with retry + model fallback
 */

import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

const RETRY_CONFIG = [
  { model: "claude-sonnet-4-6", delay: 0 },
  { model: "claude-haiku-4-5-20251001", delay: 2000 },
  { model: "claude-haiku-4-5-20251001", delay: 5000 },
];

function createProxyAgent() {
  const proxy = process.env.OUTBOUND_PROXY;
  const auth = process.env.OUTBOUND_PROXY_AUTH;
  if (!proxy || !auth) return null;
  return new HttpsProxyAgent(`http://${auth}@${proxy}`);
}

/**
 * Call Claude API with messages
 * @param {Array} messages - Array of {role, content} messages
 * @param {Object} options - { system, maxTokens, temperature }
 * @returns {string|null} - Reply text or null on failure
 */
export async function callClaude(messages, options = {}) {
  const { system, maxTokens = 300, temperature = 0.45 } = options;

  for (let attempt = 0; attempt < RETRY_CONFIG.length; attempt++) {
    const { model, delay } = RETRY_CONFIG[attempt];

    if (delay > 0) {
      console.log(`[Claude] Waiting ${delay / 1000}s before retry (attempt ${attempt + 1})...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const axiosConfig = {
        method: "POST",
        url: "https://api.anthropic.com/v1/messages",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        data: {
          model,
          system,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
        timeout: 30000,
        validateStatus: () => true,
      };

      const agent = createProxyAgent();
      if (agent) {
        axiosConfig.httpsAgent = agent;
        axiosConfig.httpAgent = agent;
      }

      const response = await axios(axiosConfig);

      if (response.status < 200 || response.status >= 300) {
        const errorText = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
        console.error(`[Claude] API error (attempt ${attempt + 1}, ${model}): ${response.status} ${errorText}`);

        // Human-readable hints for common errors
        if (response.status === 401) {
          console.error(`[Claude] ⚠️  Your ANTHROPIC_API_KEY is invalid or expired. Double-check it at https://console.anthropic.com/settings/keys`);
        } else if (response.status === 403) {
          console.error(`[Claude] ⚠️  Your Anthropic account may not have billing enabled. Add a payment method at https://console.anthropic.com/settings/billing`);
        } else if (response.status === 429) {
          console.error(`[Claude] ⚠️  Rate limited — too many requests. The agent will retry automatically.`);
        } else if (response.status === 529) {
          console.error(`[Claude] ⚠️  Anthropic API is temporarily overloaded. The agent will retry automatically.`);
        }

        if (attempt === RETRY_CONFIG.length - 1) return null;
        continue;
      }

      const text = response.data?.content?.[0]?.text?.trim();
      if (!text) {
        console.error(`[Claude] Empty response (attempt ${attempt + 1})`);
        if (attempt === RETRY_CONFIG.length - 1) return null;
        continue;
      }

      if (attempt > 0) console.log(`[Claude] Success on attempt ${attempt + 1} with ${model}`);
      return text;
    } catch (error) {
      console.error(`[Claude] Request failed (attempt ${attempt + 1}, ${model}): ${error.message}`);
      if (attempt === RETRY_CONFIG.length - 1) return null;
    }
  }

  return null;
}

export default callClaude;
