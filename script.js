const bmiForm = document.getElementById("bmiForm");
const resetBtn = document.getElementById("resetBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const themeBtn = document.getElementById("themeBtn");

const unitButtons = document.querySelectorAll(".unit-btn");
const metricInputs = document.querySelector(".metric-inputs");
const imperialInputs = document.querySelector(".imperial-inputs");

const heightCm = document.getElementById("heightCm");
const weightKg = document.getElementById("weightKg");
const heightFt = document.getElementById("heightFt");
const heightIn = document.getElementById("heightIn");
const weightLb = document.getElementById("weightLb");

const errorText = document.getElementById("errorText");
const bmiValue = document.getElementById("bmiValue");
const categoryTitle = document.getElementById("categoryTitle");
const categoryText = document.getElementById("categoryText");
const resultLabel = document.getElementById("resultLabel");
const progressFill = document.getElementById("progressFill");
const tipsBox = document.getElementById("tipsBox");
const tipsText = document.getElementById("tipsText");

const lastBmi = document.getElementById("lastBmi");
const lastCategory = document.getElementById("lastCategory");
const historyCount = document.getElementById("historyCount");
const historyList = document.getElementById("historyList");
const emptyHistory = document.getElementById("emptyHistory");

const STORAGE_KEYS = {
  theme: "bmi_theme_v2",
  history: "bmi_history_v2",
  unit: "bmi_unit_v2"
};

let currentUnit = localStorage.getItem(STORAGE_KEYS.unit) || "metric";
let currentTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";
let history = loadStorage(STORAGE_KEYS.history, []);

applyTheme(currentTheme);
setUnit(currentUnit);
renderHistory();
updateHistoryCount();

unitButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentUnit = button.dataset.unit;
    localStorage.setItem(STORAGE_KEYS.unit, currentUnit);
    setUnit(currentUnit);
    clearResult();
    hideError();
  });
});

themeBtn.addEventListener("click", () => {
  currentTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(currentTheme);
  localStorage.setItem(STORAGE_KEYS.theme, currentTheme);
});

bmiForm.addEventListener("submit", event => {
  event.preventDefault();
  calculateBMI();
});

resetBtn.addEventListener("click", () => {
  bmiForm.reset();
  hideError();
  clearResult();
});

clearHistoryBtn.addEventListener("click", () => {
  history = [];
  saveStorage(STORAGE_KEYS.history, history);
  renderHistory();
  updateHistoryCount();
});

function calculateBMI() {
  hideError();

  let bmi = 0;
  let formattedInputs = "";

  if (currentUnit === "metric") {
    const h = parseFloat(heightCm.value);
    const w = parseFloat(weightKg.value);

    if (!isValidNumber(h) || !isValidNumber(w)) {
      showError("Lütfen geçerli boy ve kilo değerleri gir.");
      return;
    }

    if (h <= 0 || w <= 0) {
      showError("Değerler sıfırdan büyük olmalı.");
      return;
    }

    bmi = w / Math.pow(h / 100, 2);
    formattedInputs = `${h.toFixed(0)} cm • ${w.toFixed(1)} kg`;
  } else {
    const ft = parseFloat(heightFt.value);
    const inch = parseFloat(heightIn.value);
    const lb = parseFloat(weightLb.value);

    if (!isValidNumber(ft) || !isValidNumber(inch) || !isValidNumber(lb)) {
      showError("Lütfen geçerli boy ve kilo değerleri gir.");
      return;
    }

    if (ft < 0 || inch < 0 || lb <= 0) {
      showError("Değerler sıfırdan büyük olmalı.");
      return;
    }

    const totalInches = (ft * 12) + inch;
    if (totalInches <= 0) {
      showError("Boy değeri sıfırdan büyük olmalı.");
      return;
    }

    bmi = (703 * lb) / Math.pow(totalInches, 2);
    formattedInputs = `${ft.toFixed(0)} ft ${inch.toFixed(0)} in • ${lb.toFixed(1)} lb`;
  }

  if (!Number.isFinite(bmi)) {
    showError("Hesaplama sırasında bir hata oluştu.");
    return;
  }

  const roundedBmi = bmi.toFixed(1);
  const category = getCategory(bmi);

  updateResult(roundedBmi, category);
  saveToHistory({
    bmi: roundedBmi,
    category: category.label,
    details: formattedInputs,
    unit: currentUnit,
    createdAt: new Date().toISOString()
  });

  renderHistory();
  updateHistoryCount();
}

function getCategory(bmi) {
  if (bmi < 18.5) {
    return {
      label: "Underweight",
      description: "Your BMI is below the healthy range.",
      tip: "Dengeli öğünler, yeterli protein ve düzenli uyku ile sağlıklı bir plan oluşturabilirsin."
    };
  }

  if (bmi < 25) {
    return {
      label: "Normal",
      description: "Your BMI is in the healthy range.",
      tip: "Düzenli hareket, dengeli beslenme ve su tüketimi iyi bir rutindir."
    };
  }

  if (bmi < 30) {
    return {
      label: "Overweight",
      description: "Your BMI is above the healthy range.",
      tip: "Yürüyüş, kuvvet antrenmanı ve porsiyon kontrolü fayda sağlayabilir."
    };
  }

  return {
    label: "Obese",
    description: "Your BMI is well above the healthy range.",
    tip: "Kişisel ve güvenli bir plan için bir sağlık uzmanıyla görüşmek iyi olabilir."
  };
}

function updateResult(bmi, category) {
  bmiValue.textContent = bmi;
  categoryTitle.textContent = category.label;
  categoryText.textContent = category.description;
  resultLabel.textContent = category.label;
  tipsText.textContent = category.tip;
  tipsBox.classList.remove("hidden");

  lastBmi.textContent = bmi;
  lastCategory.textContent = category.label;

  const progress = Math.min((parseFloat(bmi) / 40) * 100, 100);
  progressFill.style.width = `${progress}%`;

  const ringColor = getProgressColor(parseFloat(bmi));
  const degree = (progress / 100) * 360;
  document.querySelector(".meter").style.background =
    `conic-gradient(${ringColor} 0deg ${degree}deg, rgba(148, 163, 184, 0.18) ${degree}deg 360deg)`;
}

function getProgressColor(bmi) {
  if (bmi < 18.5) return "#3b82f6";
  if (bmi < 25) return "#16a34a";
  if (bmi < 30) return "#f59e0b";
  return "#dc2626";
}

function saveToHistory(item) {
  history.unshift({ id: createId(), ...item });
  history = history.slice(0, 8);
  saveStorage(STORAGE_KEYS.history, history);
}

function renderHistory() {
  historyList.innerHTML = "";

  if (!history.length) {
    emptyHistory.classList.remove("hidden");
    return;
  }

  emptyHistory.classList.add("hidden");

  history.forEach(item => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerHTML = `
      <div class="history-top">
        <span class="history-meta">${formatDate(item.createdAt)}</span>
        <span class="history-values">${item.bmi} BMI • ${item.category}</span>
      </div>
      <p class="history-details">${item.details} (${item.unit})</p>
    `;
    historyList.appendChild(li);
  });
}

function updateHistoryCount() {
  historyCount.textContent = String(history.length);
}

function setUnit(unit) {
  unitButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.unit === unit);
  });

  metricInputs.classList.toggle("hidden", unit !== "metric");
  imperialInputs.classList.toggle("hidden", unit !== "imperial");
}

function clearResult() {
  bmiValue.textContent = "--";
  categoryTitle.textContent = "No calculation yet";
  categoryText.textContent = "Enter your height and weight to see your BMI score and category.";
  resultLabel.textContent = "Ready";
  progressFill.style.width = "0%";
  document.querySelector(".meter").style.background =
    "conic-gradient(var(--primary) 0deg, rgba(148, 163, 184, 0.18) 0deg)";
  tipsBox.classList.add("hidden");
  lastBmi.textContent = "--";
  lastCategory.textContent = "--";
}

function showError(message) {
  errorText.textContent = message;
  errorText.classList.remove("hidden");
}

function hideError() {
  errorText.classList.add("hidden");
  errorText.textContent = "";
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeBtn.textContent = theme === "dark" ? "☀️ Theme" : "🌙 Theme";
}

function isValidNumber(value) {
  return typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value);
}

function loadStorage(key, fallbackValue) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId() {
  return `bmi_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}