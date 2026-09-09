renderNav();

const RESET_KEY = "salonhub_resets";
function getResets() { return JSON.parse(localStorage.getItem(RESET_KEY) || "[]"); }
function saveResets(list) { localStorage.setItem(RESET_KEY, JSON.stringify(list)); }

const token = qs("token");
const email = (qs("email") || "").toLowerCase();
const reset = getResets().find((r) => r.token === token && r.email.toLowerCase() === email);
const valid = reset && reset.expires > Date.now();

if (!valid) {
  document.getElementById("reset-form").style.display = "none";
  document.getElementById("invalid-link").style.display = "block";
} else {
  const errorBox = document.getElementById("form-error");
  document.getElementById("reset-form").addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.classList.remove("is-visible");

    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;
    if (password !== confirm) {
      errorBox.textContent = "Those passwords don't match.";
      errorBox.classList.add("is-visible");
      return;
    }

    const users = DB.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      errorBox.textContent = "We couldn't find that account anymore.";
      errorBox.classList.add("is-visible");
      return;
    }
    user.password = password;
    DB.saveUsers(users);
    saveResets(getResets().filter((r) => r.token !== token));

    window.location.href = "login.html?reset=1";
  });
}
