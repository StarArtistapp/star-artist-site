import { createClient } from "https://cdn.jsdelivr.net/npm/@base44/sdk@0.8.44/+esm";

const APP_ID = "6a8fc205554241a0eaee3aed";
const base44 = createClient({ appId: APP_ID });

let betaStatus = null;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setButtonLabel(button, label) {
  if (!button) return;
  const star = '<span aria-hidden="true">★</span>';
  button.innerHTML = `${label} ${star}`;
}

function syncCapacityLabels() {
  const isFull = Boolean(betaStatus?.isFull);
  document.querySelectorAll(".signup-form button[type='submit']").forEach((button) => {
    const form = button.closest(".signup-form");
    if (form?.dataset.source === "founding_beta") {
      setButtonLabel(button, isFull ? "Join the Waitlist" : "Join the Beta");
    } else {
      setButtonLabel(button, isFull ? "Join the Waitlist" : "Request Access");
    }
  });
}

async function loadBetaStatus() {
  try {
    const response = await base44.functions.invoke("getBetaStatus");
    betaStatus = response?.data || null;
    syncCapacityLabels();
  } catch (error) {
    console.warn("Star Artist beta status unavailable; defaulting to Founding Beta CTA.", error);
  }
}

function successMessage(result) {
  const waitlisted = result?.status === "Waitlist" || (result?.alreadyApplied && result?.status === "Waitlist");
  if (waitlisted) return "You’re on the waitlist. We’ll be in touch when the next spots open.";
  if (result?.alreadyApplied) return "You’re already on the Star Artist early-access list.";
  return "Your request for the Star Artist Founding Beta has been received.";
}

function attachSecondaryForm(host, email) {
  const template = document.querySelector("#secondary-form-template");
  if (!template || host.querySelector(".secondary-prompt")) return;

  const fragment = template.content.cloneNode(true);
  const prompt = fragment.querySelector(".secondary-prompt");
  const toggle = fragment.querySelector(".secondary-toggle");
  const form = fragment.querySelector(".secondary-form");
  const status = fragment.querySelector(".secondary-status");

  toggle.addEventListener("click", () => {
    form.hidden = !form.hidden;
    if (!form.hidden) {
      toggle.textContent = "Tell us a little about your business ↓";
      form.querySelector("input, select, textarea")?.focus();
    } else {
      toggle.textContent = "Tell us a little about your business →";
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Saving…";
    const button = form.querySelector("button[type='submit']");
    button.disabled = true;

    const fields = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await base44.functions.invoke("updateBetaSignupDetails", { email, ...fields });
      if (response?.data?.success) {
        status.textContent = "Thank you — your details are saved.";
        button.textContent = "Saved";
      } else {
        status.textContent = response?.data?.error || "Could not save. Please try again.";
        button.disabled = false;
      }
    } catch (error) {
      console.error(error);
      status.textContent = "Could not save. Please try again.";
      button.disabled = false;
    }
  });

  host.appendChild(prompt);
}

function attachSignupForm(form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const input = form.querySelector("input[name='email']");
    const button = form.querySelector("button[type='submit']");
    const errorEl = form.querySelector(".form-error");
    const successEl = form.querySelector(".form-success");
    const email = input.value.trim();

    errorEl.textContent = "";
    successEl.textContent = "";

    if (!emailPattern.test(email)) {
      errorEl.textContent = "Please enter a valid email address.";
      input.focus();
      return;
    }

    const originalLabel = button.textContent.trim();
    button.disabled = true;
    button.textContent = "Submitting…";

    try {
      const response = await base44.functions.invoke("submitBetaSignup", {
        email,
        signup_source: form.dataset.source || "landing_page"
      });
      const result = response?.data || {};

      if (!result.success) {
        throw new Error(result.error || "Something went wrong. Please try again.");
      }

      successEl.textContent = successMessage(result);
      input.disabled = true;
      setButtonLabel(button, result?.status === "Waitlist" ? "Waitlisted" : "Submitted");
      attachSecondaryForm(successEl, email);
    } catch (error) {
      console.error(error);
      errorEl.textContent = error?.message || "Something went wrong. Please try again.";
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
}

document.querySelectorAll(".signup-form").forEach(attachSignupForm);
loadBetaStatus();
