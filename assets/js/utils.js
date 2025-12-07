export function getCurrency(){ return localStorage.getItem("qaysar_currency") || "JOD"; }
export function setCurrency(cur){ localStorage.setItem("qaysar_currency", cur); }

export function getTheme(){ return localStorage.getItem("qaysar_theme") || "dark"; }
export function setTheme(t){ localStorage.setItem("qaysar_theme", t); }
export function applyTheme(){ document.documentElement.setAttribute("data-theme", getTheme()); }

export function formatMoney(amount, currency){
  const n = Number(amount || 0);
  if (currency === "USD") return `$ ${n.toFixed(2)}`;
  return `${n.toFixed(2)} د.أ`;
}

export function convertPrice(price, fromCurrency, usdToJod){
  const p = Number(price || 0);
  const rate = Number(usdToJod || 0.72);
  if (fromCurrency === "USD") return { USD: p, JOD: p * rate };
  return { JOD: p, USD: rate ? (p / rate) : 0 };
}

export async function copyText(text){
  try{ await navigator.clipboard.writeText(text); return true; }
  catch{
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return true;
  }
}

export function qs(name){ return new URLSearchParams(location.search).get(name); }

let toastTimeout;
export function showToast(message, type="info"){
  let el = document.getElementById("toast");
  if (!el){
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  const icon = type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️";
  el.textContent = `${icon} ${message}`;
  el.className = "";
  el.id = "toast";
  el.classList.add("visible");
  if (type === "success") el.classList.add("success");
  if (type === "error") el.classList.add("error");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=> el.classList.remove("visible"), 3200);
}
