const FORMSPREE_URL = "https://formspree.io/f/xdeawdwd";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"];

const form = document.querySelector("#contact-form");
const submitButton = document.querySelector("#submit-button");
const submitLabel = document.querySelector("#submit-label");
const errorBox = document.querySelector("#form-error");
const successBox = document.querySelector("#form-success");

function readStorage(key) {
  try {
    return sessionStorage.getItem(key) || "";
  } catch (error) {
    return "";
  }
}

function writeStorage(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
  }
}

function fillUtmFields() {
  const params = new URLSearchParams(window.location.search);

  UTM_KEYS.forEach((key) => {
    const fromUrl = (params.get(key) || "").trim().toLowerCase();

    if (fromUrl) {
      writeStorage(key, fromUrl);
    }

    form.elements[key].value = fromUrl || readStorage(key);
  });
}

function showError(text) {
  errorBox.textContent = text;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}

function showSuccess() {
  form.classList.add("hidden");
  successBox.classList.remove("hidden");
  successBox.focus();
}

function setSending(isSending) {
  submitButton.disabled = isSending;
  submitLabel.textContent = isSending ? "Sending..." : "Send message";
}

async function handleSubmit(event) {
  event.preventDefault();
  hideError();

  if (form.elements.website.value !== "") {
    showSuccess();
    return;
  }

  if (!form.reportValidity()) {
    return;
  }

  setSending(true);

  const data = Object.fromEntries(new FormData(form));
  delete data.website;
  data.created_at = new Date().toISOString();
  data.page_url = window.location.href;
  data._subject = `New contact from ${data.name}`;

  try {
    const response = await fetch(FORMSPREE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(`Formspree answered with status ${response.status}: ${JSON.stringify(result.errors || result)}`);
    }

    showSuccess();
  } catch (error) {
    console.error("Contact form error:", error);
    showError("Something went wrong. Please try again.");
    setSending(false);
  }
}

fillUtmFields();
form.addEventListener("submit", handleSubmit);
