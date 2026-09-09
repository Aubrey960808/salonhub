renderNav();
redirectIfLoggedIn();

const cityList = document.getElementById("city-list");
allCities().forEach((c) => {
  const opt = document.createElement("option");
  opt.value = c;
  cityList.appendChild(opt);
});

let selectedRole = qs("role") === "provider" ? "provider" : "customer";

const roleButtons = document.querySelectorAll("#role-toggle button");
const providerFields = document.getElementById("provider-fields");
const providerTypeSelect = document.getElementById("providerType");
const categoryField = document.getElementById("category-field");

function applyRoleUI() {
  roleButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.role === selectedRole));
  providerFields.style.display = selectedRole === "provider" ? "block" : "none";
  document.getElementById("bizname").required = selectedRole === "provider";
}
applyRoleUI();

roleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedRole = btn.dataset.role;
    applyRoleUI();
  });
});

const documentField = document.getElementById("document-field");
const documentInput = document.getElementById("regDocument");

function applyProviderTypeUI() {
  const isSalon = providerTypeSelect.value === "salon";
  categoryField.style.display = isSalon ? "none" : "block";
  documentField.style.display = isSalon ? "block" : "none";
}
applyProviderTypeUI();
providerTypeSelect.addEventListener("change", applyProviderTypeUI);

const errorBox = document.getElementById("form-error");
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.add("is-visible");
}

const MAX_DOC_BYTES = 3 * 1024 * 1024; // 3MB — keeps localStorage usage sane

document.getElementById("signup-form").addEventListener("submit", (e) => {
  e.preventDefault();
  errorBox.classList.remove("is-visible");

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const city = document.getElementById("city").value.trim();
  const providerType = providerTypeSelect.value;
  const isSalon = selectedRole === "provider" && providerType === "salon";

  const users = DB.getUsers();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    showError("An account with that email already exists. Try logging in instead.");
    return;
  }

  const file = documentInput.files[0];
  if (isSalon) {
    if (!file) { showError("Please upload proof of business registration to sign up as a salon."); return; }
    if (file.size > MAX_DOC_BYTES) { showError("That file is too large — please upload something under 3MB."); return; }
  }

  if (isSalon && file) {
    const reader = new FileReader();
    reader.onload = () => finishSignup({ name: file.name, type: file.type, dataUrl: reader.result });
    reader.onerror = () => showError("We couldn't read that file — please try a different one.");
    reader.readAsDataURL(file);
  } else {
    finishSignup(null);
  }

  function finishSignup(document_) {
    const id = (selectedRole === "provider" ? "p" : "c") + Date.now();
    const baseUser = {
      id, role: selectedRole, name, email, password, phone, city,
      image: `https://i.pravatar.cc/300?u=${encodeURIComponent(email)}`,
      createdAt: new Date().toISOString()
    };

    let newUser;
    if (selectedRole === "provider") {
      const bizname = document.getElementById("bizname").value.trim() || name;
      const bio = document.getElementById("bio").value.trim() || "New provider on SalonHub.";
      newUser = {
        ...baseUser,
        name: bizname,
        providerType,
        category: providerType === "housecall" ? document.getElementById("category").value : null,
        bio,
        cover: `https://picsum.photos/seed/${encodeURIComponent(bizname)}/640/420`,
        services: [],
        slots: [],
        verified: false,
        registrationDocument: document_,
        registrationStatus: isSalon ? "submitted" : "not_required"
      };
    } else {
      newUser = baseUser;
    }

    const freshUsers = DB.getUsers();
    freshUsers.push(newUser);
    DB.saveUsers(freshUsers);
    DB.setSession(newUser.id);

    window.location.href = selectedRole === "provider" ? "dashboard-provider.html?welcome=1" : "dashboard-customer.html";
  }
});
