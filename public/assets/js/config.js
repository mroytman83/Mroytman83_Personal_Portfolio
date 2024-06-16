require('dotenv').config();

const key_map = new Map();

key_map.set("open_ai_key", process.env.OPENAI_API_KEY);
key_map.set("smtp_out", process.env.SMTP_OUT);
key_map.set("smtp_pass", process.env.SMTP_PASS);
key_map.set("smtp_in", process.env.SMTP_IN);
key_map.set("smtp_host", process.env.SMTP_HOST);

module.exports = key_map;