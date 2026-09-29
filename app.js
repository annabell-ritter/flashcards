"use strict";

const STORAGE_KEY = "flashcards.cards";
const STATUSES = ["new", "known", "learning"];
const STATUS_LABELS = { new: "New", known: "Known", learning: "Still learning" };

// ---- Storage ----

function isValidCard(card) {
  return (
    card !== null &&
    typeof card === "object" &&
    typeof card.id === "string" &&
    typeof card.question === "string" &&
    typeof card.answer === "string" &&
    card.question.trim() !== "" &&
    card.answer.trim() !== ""
  );
}

// Returns an empty list when the value is missing, malformed, or storage is unavailable.
function loadCards() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    return [];
  }
  if (raw === null) {
    return [];
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return [];
  }
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(isValidCard).map((card) => ({
    id: card.id,
    question: card.question,
    answer: card.answer,
    status: STATUSES.includes(card.status) ? card.status : "new",
  }));
}

function saveCards() {
  let saved = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cards));
  } catch (err) {
    saved = false;
  }
  els.storageWarning.hidden = saved;
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- State ----

const state = {
  cards: loadCards(),
  reviewIndex: 0,
  flipped: false,
  editingId: null,
};

const els = {
  stats: document.getElementById("stats"),
  storageWarning: document.getElementById("storage-warning"),
  form: document.getElementById("card-form"),
  question: document.getElementById("question"),
  answer: document.getElementById("answer"),
  formError: document.getElementById("form-error"),
  reviewEmpty: document.getElementById("review-empty"),
  reviewActive: document.getElementById("review-active"),
  reviewDone: document.getElementById("review-done"),
  progress: document.getElementById("progress"),
  flashcard: document.getElementById("flashcard"),
  faceFront: document.getElementById("face-front"),
  faceBack: document.getElementById("face-back"),
  cardQuestion: document.getElementById("card-question"),
  cardAnswer: document.getElementById("card-answer"),
  markKnown: document.getElementById("mark-known"),
  markLearning: document.getElementById("mark-learning"),
  doneSummary: document.getElementById("done-summary"),
  restart: document.getElementById("restart"),
  listEmpty: document.getElementById("list-empty"),
  cardList: document.getElementById("card-list"),
};

function countByStatus() {
  const counts = { new: 0, known: 0, learning: 0 };
  for (const card of state.cards) {
    counts[card.status] += 1;
  }
  return counts;
}

function isReviewActive() {
  return state.cards.length > 0 && state.reviewIndex < state.cards.length;
}

// Shows the front of the next card without animating, so its answer never flashes into view.
function resetFlipInstantly() {
  state.flipped = false;
  els.flashcard.classList.add("no-animation");
  els.flashcard.classList.remove("is-flipped");
  void els.flashcard.offsetWidth;
  els.flashcard.classList.remove("no-animation");
}

// Checks both fields and shows an error. Returns the trimmed values, or null when invalid.
function readCardFields(questionEl, answerEl, errorEl) {
  const question = questionEl.value.trim();
  const answer = answerEl.value.trim();
  questionEl.setAttribute("aria-invalid", String(question === ""));
  answerEl.setAttribute("aria-invalid", String(answer === ""));
  if (question === "" || answer === "") {
    errorEl.textContent = "Enter both a question and an answer.";
    (question === "" ? questionEl : answerEl).focus();
    return null;
  }
  errorEl.textContent = "";
  return { question, answer };
}

// ---- Rendering ----

function renderStats() {
  const total = state.cards.length;
  if (total === 0) {
    els.stats.textContent = "";
    return;
  }
  const counts = countByStatus();
  const noun = total === 1 ? "card" : "cards";
  els.stats.textContent =
    `${total} ${noun} · ${counts.known} known · ${counts.learning} still learning · ${counts.new} new`;
}

function renderReview() {
  const total = state.cards.length;
  const isEmpty = total === 0;
  const isDone = !isEmpty && state.reviewIndex >= total;

  els.reviewEmpty.hidden = !isEmpty;
  els.reviewDone.hidden = !isDone;
  els.reviewActive.hidden = isEmpty || isDone;

  if (isDone) {
    const counts = countByStatus();
    els.doneSummary.textContent =
      `You reviewed all ${total} ${total === 1 ? "card" : "cards"}. ` +
      `Known: ${counts.known}. Still learning: ${counts.learning}.`;
    return;
  }
  if (isEmpty) {
    return;
  }

  const card = state.cards[state.reviewIndex];
  els.progress.textContent = `Card ${state.reviewIndex + 1} of ${total}`;
  els.cardQuestion.textContent = card.question;
  els.cardAnswer.textContent = card.answer;
  els.flashcard.classList.toggle("is-flipped", state.flipped);
  els.faceFront.setAttribute("aria-hidden", String(state.flipped));
  els.faceBack.setAttribute("aria-hidden", String(!state.flipped));
}

function renderList() {
  els.listEmpty.hidden = state.cards.length > 0;
  els.cardList.replaceChildren(
    ...state.cards.map((card) =>
      card.id === state.editingId ? renderEditItem(card) : renderCardItem(card)
    )
  );
}

function makeButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderCardItem(card) {
  const item = document.createElement("li");
  item.className = "card-item";
  item.dataset.id = card.id;

  const question = document.createElement("p");
  question.className = "card-item-question";
  question.textContent = card.question;
  const answer = document.createElement("p");
  answer.className = "card-item-answer";
  answer.textContent = card.answer;

  const footer = document.createElement("div");
  footer.className = "card-item-footer";
  const badge = document.createElement("span");
  badge.className = `badge badge-${card.status}`;
  badge.textContent = STATUS_LABELS[card.status];

  const buttons = document.createElement("div");
  buttons.className = "card-item-buttons";
  const edit = makeButton("Edit", "btn btn-small btn-secondary", () => startEdit(card.id));
  edit.classList.add("js-edit");
  edit.setAttribute("aria-label", `Edit card: ${card.question}`);
  const del = makeButton("Delete", "btn btn-small btn-danger", () => deleteCard(card.id));
  del.setAttribute("aria-label", `Delete card: ${card.question}`);
  buttons.append(edit, del);

  footer.append(badge, buttons);
  item.append(question, answer, footer);
  return item;
}

function renderEditItem(card) {
  const item = document.createElement("li");
  item.className = "card-item is-editing";
  item.dataset.id = card.id;

  const form = document.createElement("form");
  form.className = "card-form";
  form.noValidate = true;

  const fields = [
    ["Question", "question", card.question],
    ["Answer", "answer", card.answer],
  ].map(([labelText, name, value]) => {
    const id = `edit-${name}-${card.id}`;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = labelText;
    const textarea = document.createElement("textarea");
    textarea.id = id;
    textarea.name = name;
    textarea.rows = 2;
    textarea.value = value;
    form.append(label, textarea);
    return textarea;
  });
  const [questionEl, answerEl] = fields;

  const error = document.createElement("p");
  error.className = "form-error";
  error.setAttribute("role", "alert");

  const buttons = document.createElement("div");
  buttons.className = "card-item-buttons";
  const save = document.createElement("button");
  save.type = "submit";
  save.className = "btn btn-small btn-primary";
  save.textContent = "Save";
  const cancel = makeButton("Cancel", "btn btn-small btn-secondary", () => stopEdit(card.id));
  buttons.append(save, cancel);

  form.append(error, buttons);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = readCardFields(questionEl, answerEl, error);
    if (values) {
      saveEdit(card.id, values);
    }
  });
  form.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      stopEdit(card.id);
    }
  });

  item.append(form);
  return item;
}

function render() {
  renderStats();
  renderReview();
  renderList();
}

function focusInItem(id, selector) {
  const item = els.cardList.querySelector(`[data-id="${CSS.escape(id)}"]`);
  const target = item && item.querySelector(selector);
  if (target) {
    target.focus();
  }
}

// ---- Actions ----

function addCard(event) {
  event.preventDefault();
  const values = readCardFields(els.question, els.answer, els.formError);
  if (!values) {
    return;
  }
  state.cards.push({ id: createId(), question: values.question, answer: values.answer, status: "new" });
  saveCards();
  els.form.reset();
  els.question.focus();
  render();
}

function startEdit(id) {
  state.editingId = id;
  renderList();
  focusInItem(id, "textarea");
}

function stopEdit(id) {
  state.editingId = null;
  renderList();
  focusInItem(id, ".js-edit");
}

function saveEdit(id, values) {
  const card = state.cards.find((c) => c.id === id);
  if (!card) {
    return;
  }
  card.question = values.question;
  card.answer = values.answer;
  saveCards();
  state.editingId = null;
  render();
  focusInItem(id, ".js-edit");
}

function deleteCard(id) {
  const index = state.cards.findIndex((card) => card.id === id);
  if (index === -1 || !window.confirm("Delete this card?")) {
    return;
  }
  state.cards.splice(index, 1);
  if (index < state.reviewIndex) {
    state.reviewIndex -= 1;
  } else if (index === state.reviewIndex) {
    resetFlipInstantly();
  }
  saveCards();
  render();
}

function flipCard() {
  state.flipped = !state.flipped;
  renderReview();
}

function markCard(status) {
  const card = state.cards[state.reviewIndex];
  if (!card) {
    return;
  }
  card.status = status;
  saveCards();
  state.reviewIndex += 1;
  resetFlipInstantly();
  render();
  // Move focus off the mark button so the next Space press flips the new card.
  (isReviewActive() ? els.flashcard : els.restart).focus();
}

function restartReview() {
  state.reviewIndex = 0;
  resetFlipInstantly();
  render();
  els.flashcard.focus();
}

// Space flips the card from anywhere on the page, except while typing or on another button.
function handleKeydown(event) {
  if (event.key !== " " || !isReviewActive()) {
    return;
  }
  const target = event.target;
  if (target instanceof Element && target.closest("textarea, input, select, button, a")) {
    return;
  }
  event.preventDefault();
  flipCard();
}

// Enter adds the card. Shift+Enter still inserts a line break.
function handleFormKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
    return;
  }
  if (event.target instanceof HTMLTextAreaElement) {
    event.preventDefault();
    els.form.requestSubmit();
  }
}

els.form.addEventListener("submit", addCard);
els.form.addEventListener("keydown", handleFormKeydown);
els.flashcard.addEventListener("click", flipCard);
els.markKnown.addEventListener("click", () => markCard("known"));
els.markLearning.addEventListener("click", () => markCard("learning"));
els.restart.addEventListener("click", restartReview);
document.addEventListener("keydown", handleKeydown);

render();
