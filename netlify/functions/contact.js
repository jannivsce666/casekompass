const https = require("https");

function decodeForm(body) {
  const params = new URLSearchParams(body || "");
  const result = {};
  for (const [key, value] of params.entries()) {
    if (key in result) {
      if (Array.isArray(result[key])) result[key].push(value);
      else result[key] = [result[key], value];
    } else {
      result[key] = value;
    }
  }
  return result;
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function compactLines(lines) {
  return lines
    .map((l) => String(l || "").trim())
    .filter(Boolean)
    .join("\n");
}

function formatValue(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
  return String(value);
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
          resolve({ statusCode: res.statusCode || 0, ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300, body: data });
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }

  try {
    const contentType = event.headers["content-type"] || event.headers["Content-Type"] || "";
    let data = {};

    if (contentType.includes("application/json")) {
      data = JSON.parse(event.body || "{}");
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      data = decodeForm(event.body);
    } else {
      // Try JSON first, fall back to form decode
      try {
        data = JSON.parse(event.body || "{}");
      } catch {
        data = decodeForm(event.body);
      }
    }

    // Honeypot (bots will fill hidden field)
    if (data.company) {
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: true }),
      };
    }

    const apiKey = process.env.MAILGUN_API_KEY || process.env.API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const apiBase = (process.env.MAILGUN_API_BASE || "https://api.mailgun.net").replace(/\/$/, "");

    if (!apiKey || !domain || !toEmail) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "Server not configured (MAILGUN_API_KEY or API_KEY / MAILGUN_DOMAIN / CONTACT_TO_EMAIL)",
        }),
      };
    }

    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const role = String(data.rolle || "").trim();
    const topic = String(data.anliegen || "").trim();
    const needs = asArray(data.bedarf).map((n) => String(n).trim()).filter(Boolean);
    const message = String(data.nachricht || "").trim();

    if (!email || !message) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Bitte E‑Mail und Nachricht angeben." }),
      };
    }

    const subject = `Kontaktformular – ${name || "Unbekannt"} (${email})`;

    const knownBlock = compactLines([
      `Name: ${name || "-"}`,
      `E-Mail: ${email}`,
      `Rolle: ${role || "-"}`,
      `Anliegen: ${topic || "-"}`,
      `Bedarf: ${needs.length ? needs.join(", ") : "-"}`,
      "",
      "Nachricht:",
      message,
    ]);

    const allFields = Object.keys(data)
      .filter((k) => k !== "company")
      .sort((a, b) => a.localeCompare(b))
      .map((k) => `${k}: ${formatValue(data[k]) || "-"}`);

    const text = compactLines([
      knownBlock,
      "",
      "---",
      "Alle Formularfelder:",
      ...allFields,
    ]);

    const url = `${apiBase}/v3/${domain}/messages`;
    const auth = Buffer.from(`api:${apiKey}`).toString("base64");

    const form = new URLSearchParams();
    form.set("from", process.env.CONTACT_FROM || `casekompass.de Kontaktformular <postmaster@${domain}>`);
    form.set("to", toEmail);
    form.set("subject", subject);
    form.set("text", text);
    // Let you reply directly to the sender
    form.set("h:Reply-To", email);

    const resp = await postForm(
      url,
      {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      form.toString()
    );

    if (!resp.ok) {
      return {
        statusCode: 502,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "E-Mail Versand fehlgeschlagen",
          status: resp.statusCode,
          detail: String(resp.body || "").slice(0, 500),
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Server error" }),
    };
  }
};
