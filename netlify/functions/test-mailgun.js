const https = require("https");

function pickEnv(keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return { key, value };
  }
  return { key: null, value: null };
}

function looksLikeMailgunHttpApiKey(value) {
  // Heuristic only (do not hard-fail): Mailgun HTTP API keys are commonly
  // prefixed with "key-", but some accounts show a hex-with-dashes token.
  const v = String(value || "").trim();
  if (!v) return false;
  if (v.startsWith("key-")) return true;
  return /^[a-f0-9]{32}-[a-f0-9]{8}-[a-f0-9]{8}$/i.test(v);
}

function postForm(url, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const statusCode = res.statusCode || 0;
          resolve({ statusCode, ok: statusCode >= 200 && statusCode < 300, body: data });
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }

  const pickedKey = pickEnv(["MAILGUN_API_KEY", "API_KEY"]);
  const apiKey = pickedKey.value;
  const domain = process.env.MAILGUN_DOMAIN;
  const apiBase = (process.env.MAILGUN_API_BASE || "https://api.mailgun.net").replace(/\/$/, "");

  // Defaults match the Java sample as closely as possible
  const to = process.env.TEST_TO_EMAIL || process.env.CONTACT_TO_EMAIL || "casekompass@gmx.de";
  const toName = process.env.TEST_TO_NAME || "Johannes Piperidis";
  const subject = process.env.TEST_SUBJECT || `Hello ${toName}`;
  const text =
    process.env.TEST_TEXT ||
    `Congratulations ${toName}, you just sent an email with Mailgun! You are truly awesome!`;

  if (!apiKey || !domain) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: "Missing MAILGUN_API_KEY/API_KEY or MAILGUN_DOMAIN",
        missing: {
          MAILGUN_DOMAIN: !domain,
          MAILGUN_API_KEY_or_API_KEY: !apiKey,
        },
      }),
    };
  }

  try {
    const url = `${apiBase}/v3/${domain}/messages`;
    const auth = Buffer.from(`api:${apiKey}`).toString("base64");

    const form = new URLSearchParams();
    form.set("from", `Mailgun Sandbox <postmaster@${domain}>`);
    form.set("to", `${toName} <${to}>`);
    form.set("subject", subject);
    form.set("text", text);

    const resp = await postForm(
      url,
      {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      form.toString()
    );

    console.log("mailgun_test", {
      status: resp.statusCode,
      ok: resp.ok,
      domain,
      to,
      preview: String(resp.body || "").slice(0, 500),
    });

    return {
      statusCode: resp.ok ? 200 : 502,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: resp.ok,
        status: resp.statusCode,
        response: String(resp.body || "").slice(0, 2000),
        used: { apiBase, domain, to, apiKeyEnv: pickedKey.key },
        warnings: looksLikeMailgunHttpApiKey(apiKey)
          ? []
          : [
              "The provided key does not look like a Mailgun HTTP API key (usually starts with 'key-'). Make sure you're using the Mailgun API key (HTTP), not an SMTP password or other token.",
            ],
      }),
    };
  } catch (e) {
    console.log("mailgun_test_error", String(e && e.message ? e.message : e));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Server error" }),
    };
  }
};
