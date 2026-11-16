# AI Smart Tutor — Prototype 2 (AI + PDF integration)

A chapter-based Android-installable PWA with a persistent cartoon teacher, whiteboard, local PDF text extraction, voice features and an optional live AI tutor connection.

## What's implemented
- Subject/chapter workflow and the always-visible Professor Nova cartoon teacher.
- Study, Explain, Q&A, Practice and Test modes call a live AI endpoint when configured.
- PDF text extraction runs in the browser using PDF.js. The PDF file itself is not uploaded by the PDF reader.
- TXT and Markdown import; chapter text is held in page memory only.
- Before AI requests, the learner must tick a consent checkbox. The selected chapter text (up to 24,000 characters) and question are sent to the configured AI backend/provider for that answer.
- Responses API requests use `store: false`; the app itself has no login, database, Firebase, permanent profile, chat history or progress storage.
- Browser speech synthesis and speech recognition where supported.
- PWA app-shell cache. Do not use the app's AI mode offline.

## Important privacy and age note
The PDF is parsed locally, but when the learner chooses to use live AI, the extracted chapter text and question leave the device and are sent through the backend to the AI provider. Do not upload personal, confidential or sensitive documents. An adult/teacher should supervise API account setup, provider terms, and any possible costs. Never share an API key in chat, a GitHub repository, or frontend code. The backend provider may process request data under its own policies; `store: false` requests non-persistent Responses API handling but does not mean the entire network path is offline or that no provider processing occurs.

## Deploy the secure AI backend (Cloudflare Worker)
1. An adult/project administrator should create a Cloudflare account and a Worker named `ai-smart-tutor-api`.
2. Deploy `worker.js` (the `wrangler.toml` file is a starting configuration).
3. In Worker settings, set the variable `ALLOWED_ORIGIN` to the exact GitHub Pages origin, e.g. `https://YOUR-USERNAME.github.io` (no path and no trailing slash). If your Pages site uses a custom domain, use that exact origin instead.
4. Add a Worker secret named `OPENAI_API_KEY` using Cloudflare's secret/environment-variable interface. Do not put the key in `wrangler.toml`, `index.html`, `app.js`, or GitHub.
5. Optional variable: `OPENAI_MODEL` (default in this project: `gpt-5.5`). Confirm the model is available to the API project.
6. Configure Cloudflare rate limiting / abuse protection for the Worker. CORS is a browser access control, not authentication; it does not stop direct non-browser requests.
7. Copy the deployed Worker HTTPS URL. In the app's start screen, paste it into **AI service URL**. That URL remains in page memory only; it is not saved.
8. Tick the AI data-use consent checkbox before starting AI activities.

The Worker calls the OpenAI Responses API and never sends the API key to the browser. Official API reference: https://developers.openai.com/api/reference/resources/responses/methods/create

## PDF behavior and limits
- PDF.js loads from a pinned CDN version, so the first PDF import requires internet access.
- The PDF file is read in the browser. Up to 25 MB and 100 pages are accepted; extracted text is capped at 24,000 characters for this prototype.
- Image-only/scanned PDFs do not contain selectable text and are not OCR'd in this version.
- AI requests include the extracted text only after consent and when an AI activity is requested.

## Publish to GitHub Pages
Upload the PWA files (`index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`) to the Pages repository. Keep `worker.js`, `wrangler.toml`, and this README in the project source if you want, but they are not required to be served by Pages. Enable HTTPS. Open the Pages URL in Android Chrome and choose **Install app / Add to Home screen**.

## Testing checklist
- [ ] Open the Pages URL over HTTPS; app shell loads.
- [ ] Import a text-based PDF; extracted text appears in the chapter material box.
- [ ] Try a scanned PDF; app explains that selectable text is needed.
- [ ] Configure Worker URL and consent; ask a chapter question.
- [ ] Test Study, Explain, Practice and Test modes.
- [ ] Verify teacher remains visible in all modes and voice can be stopped.
- [ ] Confirm no API key is present in browser files or GitHub.
- [ ] Confirm Worker rate limiting is configured before sharing the app publicly.
