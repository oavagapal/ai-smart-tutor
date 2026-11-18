const $ = (id) => document.getElementById(id);
let lastTeacherMessage = "Hello! Ready to learn together?";
let currentMode = "study";
let chapterMaterial = "";
let recognition = null;
let busy = false;

function setTeacher(message, speak = false) {
  lastTeacherMessage = message;
  $("speechBubble").textContent = message.length > 115 ? message.slice(0,112) + "…" : message;
  if (speak) speakText(message);
}

function speakText(text) {
  if (!("speechSynthesis" in window)) {
    $("voiceNote").textContent =
      "Speech synthesis is not supported by this browser.";
    return;
  }

  // Clean Markdown before speaking
  const cleanText = String(text)
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = "en-IN";
  utterance.rate = 0.96;

  utterance.onstart = () =>
    $("teacher").classList.add("teacher-speaking");

  utterance.onend = () =>
    $("teacher").classList.remove("teacher-speaking");

  utterance.onerror = () =>
    $("teacher").classList.remove("teacher-speaking");

  window.speechSynthesis.speak(utterance);
}

  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.96;
  utterance.onstart = () => $("teacher").classList.add("teacher-speaking");
  utterance.onend = utterance.onerror = () => $("teacher").classList.remove("teacher-speaking");
  window.speechSynthesis.speak(utterance);
}
function addMessage(text, who = "teacher") {
  const el = document.createElement("div");
  el.className = "message " + (who === "student" ? "student-message" : "teacher-message");
  el.textContent = text;
  $("chatLog").appendChild(el);
  $("chatLog").scrollTop = $("chatLog").scrollHeight;
}
function board(title, body) {
  $("whiteboard").innerHTML = `<div class="board-content"><h3>${escapeHtml(title)}</h3>${body}</div>`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function renderAnswer(text, title = "Professor Nova's lesson") {
  const safe = escapeHtml(text).replace(/^###?\s+(.+)$/gm, "<b>$1</b>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  board(title, `<div class="ai-answer">${safe}</div>`);
}
function startLesson() {
  const subject = $("subject").value;
  const chapter = $("chapter").value.trim();
  if (!chapter) { $("chapter").focus(); $("chapter").placeholder = "Please enter your chapter name first"; return; }
  if (!window.pdfjsLib) $("fileNote").textContent = "PDF reader library did not load. Check your internet connection; TXT and Markdown import still work.";
  else pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  $("lessonTitle").textContent = `${subject} · ${chapter}`;
  $("setup").classList.add("hidden");
  $("classroom").classList.remove("hidden");
  board("Lesson: " + chapter, `<p>Welcome to your ${escapeHtml(subject)} lesson.</p><p>Choose <b>Study</b>, <b>Explain</b>, <b>Q&A</b>, <b>Practice</b> or <b>Test</b> to begin.</p><div class="chalk-note">Your teacher will stay visible throughout the lesson.</div>`);
  setTeacher(`Welcome! Today we are learning ${chapter}. Which learning mode shall we start with?`, true);
  addMessage(`Welcome! We are ready to study ${chapter}. Choose a mode below or ask me a question.`);
}
function setBusy(value) {
  busy = value;
  $("sendQuestion").disabled = value;
  $("sendQuestion").textContent = value ? "Thinking…" : "Send ↑";
  document.querySelectorAll(".mode").forEach(b => b.disabled = value);
}
async function askAI({ mode = currentMode, question = "" } = {}) {
  const endpoint = $("apiEndpoint").value.trim().replace(/\/$/, "");
  if (!endpoint) {
    const msg = "The AI connection is not configured yet. Add the secure AI service URL on the start screen. Your chapter and teacher are ready, but this session cannot generate live AI answers until the backend is deployed.";
    addMessage(msg); setTeacher(msg, true); return;
  }
  if (!$("aiConsent").checked) {
    const msg = "Before using live AI, please enable the consent checkbox on the start screen. Your question and chapter text may be sent to the AI provider. You can use the app without AI if you prefer.";
    addMessage(msg); setTeacher(msg, true); return;
  }
  if (busy) return;
  setBusy(true);
  const subject = $("subject").value;
  const chapter = $("chapter").value.trim();
  const material = chapterMaterial || $("chapterText").value.trim();
  const loading = "I'm preparing your chapter-based answer. One moment…";
  setTeacher(loading); addMessage(loading);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, chapter, mode, question, material: material.slice(0, 24000) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `AI service error (${response.status}).`);
    if (!data.answer) throw new Error("The AI service returned no answer.");
    addMessage(data.answer); setTeacher(data.answer, true); renderAnswer(data.answer, modeLabel(mode));
  } catch (error) {
    const msg = `I couldn't reach the AI service: ${error.message} Please check the service URL, internet connection and backend setup.`;
    addMessage(msg); setTeacher(msg, true);
  } finally { setBusy(false); }
}
function modeLabel(mode) {
  return ({study:"Chapter Study Notes", explain:"Teacher's Explanation", qa:"Question & Answer", practice:"Practice Questions", test:"Chapter Test"})[mode] || "Lesson";
}
function changeMode(mode) {
  currentMode = mode;
  document.querySelectorAll(".mode").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
  const prompts = {
    study: "Prepare concise but useful notes for this chapter, with key terms, definitions and examples.",
    explain: "Teach this chapter from the basics, step by step, in easy language.",
    qa: "I am ready for your questions about this chapter.",
    practice: "Create original practice questions from this chapter, with an answer key at the end so I can attempt first.",
    test: "Create a 10-question chapter test with marks and instructions. Do not show answers or hints."
  };
  board(modeLabel(mode), `<p>${escapeHtml(prompts[mode])}</p><div class="chalk-note">Professor Nova stays beside the whiteboard in every learning mode.</div>`);
  if (mode === "qa") { const msg = prompts.qa; setTeacher(msg, true); addMessage(msg); }
  else askAI({ mode, question: prompts[mode] });
}
function respond(question) {
  addMessage(question, "student");
  askAI({ mode: "qa", question });
}

$("startLesson").addEventListener("click", startLesson);
$("changeChapter").addEventListener("click", () => {
  window.speechSynthesis?.cancel(); $("teacher").classList.remove("teacher-speaking");
  $("classroom").classList.add("hidden"); $("setup").classList.remove("hidden");
});
document.querySelectorAll(".mode").forEach(b => b.addEventListener("click", () => changeMode(b.dataset.mode)));
$("sendQuestion").addEventListener("click", () => {
  const q = $("questionInput").value.trim(); if (!q || busy) return;
  $("questionInput").value = ""; respond(q);
});
$("questionInput").addEventListener("keydown", e => { if (e.key === "Enter") $("sendQuestion").click(); });
$("speakLast").addEventListener("click", () => speakText(lastTeacherMessage));
$("stopVoice").addEventListener("click", () => { window.speechSynthesis?.cancel(); $("teacher").classList.remove("teacher-speaking"); });
$("clearBoard").addEventListener("click", () => board("Whiteboard cleared", "<p>Choose a learning mode to put lesson content back on the board.</p>"));

async function extractPdfText(file) {
  if (!window.pdfjsLib) throw new Error("PDF reader library is unavailable. Check your internet connection and reload the app.");
  if (file.size > 25 * 1024 * 1024) throw new Error("This PDF is larger than 25 MB. Please choose a smaller file.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  if (pdf.numPages > 100) throw new Error("This PDF has more than 100 pages. Please upload one chapter or a smaller section.");
  let pages = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(" "));
    $("fileNote").textContent = `Reading PDF on this device… page ${pageNo} of ${pdf.numPages}`;
  }
  return pages.join("\n\n").slice(0, 24000);
}
$("chapterFile").addEventListener("change", async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      chapterMaterial = await extractPdfText(file);
      if (!chapterMaterial.trim()) throw new Error("No selectable text was found. This may be a scanned PDF; copy its text into the chapter box instead.");
      $("chapterText").value = chapterMaterial;
      $("fileNote").textContent = `${file.name} read on this device. Extracted text is held in this page session only.`;
    } else if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".md") || file.name.toLowerCase().endsWith(".txt")) {
      chapterMaterial = (await file.text()).slice(0, 24000);
      $("chapterText").value = chapterMaterial;
      $("fileNote").textContent = `${file.name} loaded for this session only.`;
    } else throw new Error("Please choose a PDF, TXT or Markdown file.");
  } catch (error) { $("fileNote").textContent = error.message; }
  e.target.value = "";
});
$("micButton").addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { $("voiceNote").textContent = "Voice input is not available in this browser. Please type your question."; return; }
  recognition = new SpeechRecognition(); recognition.lang = "en-IN"; recognition.interimResults = false;
  recognition.onresult = e => { $("questionInput").value = e.results[0][0].transcript; $("sendQuestion").click(); };
  recognition.onerror = () => $("voiceNote").textContent = "Microphone could not start. Check browser permission or type your question.";
  recognition.start();
});
