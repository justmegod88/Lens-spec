let PRODUCTS = [];
const $ = (id) => document.getElementById(id);
let openProductId = null;

function textOf(p) {
  const parts = [
    p.manufacturer || "",
    p.product_name_ko || "",
    p.product_name_en || "",
    p.tech_name || "",
    Array.isArray(p.category) ? p.category.join(" ") : "",
    p.material || "",
    p.power_range || "",
    p.cylinder_range || "",
    p.axis_range || "",
    p.notes || ""
  ];
  return parts.join(" ").toLowerCase();
}

function normalizePeriod(category) {
  if (category === "원데이") return "원데이";
  if (category === "2주") return "2주";
  if (category === "먼슬리") return "한달용";
  if (category === "한달용") return "한달용";
  return category;
}


function escapeHtml(value) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function brandHtml(value) {
  const escaped = escapeHtml(value).replace(/®/g, "");
  return escaped
    .replace(/ACUVUE/gi, (match) => `${match}<sup class="reg">®</sup>`)
    .replace(/아큐브/g, `아큐브<sup class="reg">®</sup>`);
}

function getCategories(p) {
  return Array.isArray(p.category) ? p.category : [];
}

function isAcuvue(p) {
  return (p.manufacturer || "").includes("아큐브");
}

function hasTypeCategory(categories, type) {
  if (!type) return true;
  return categories.includes(type);
}

function hasPeriodCategory(categories, period) {
  if (!period) return true;
  return categories.map(normalizePeriod).includes(period);
}

function matchFilters(p, q, type, period) {
  if (!isAcuvue(p)) return false;

  const categories = getCategories(p);

  if (!hasTypeCategory(categories, type)) return false;
  if (!hasPeriodCategory(categories, period)) return false;

  if (!q) return true;
  return textOf(p).includes(q.toLowerCase());
}

function badgeHtml(p) {
  return getCategories(p)
    .map((c) => `<span class="badge">${normalizePeriod(c)}</span>`)
    .join("");
}

function row(label, value) {
  return `
    <tr>
      <td class="key">${label}</td>
      <td>${brandHtml(value)}</td>
    </tr>
  `;
}

function detailHtml(p) {
  const bc = Array.isArray(p.bc_mm) && p.bc_mm.length ? p.bc_mm.join(", ") : "-";
  const cats = getCategories(p).map(normalizePeriod).join(", ") || "-";

  return `
    <div class="card-detail-inner">
      <div class="detail-head">
        <div>
          <div style="font-weight:700; font-size:18px;">상세 정보</div>
        </div>

      </div>

      <table class="spec">
        <tbody>
          ${row("제품명(영문)", p.product_name_en)}
          ${row("타입", cats)}
          ${row("기술명/브랜드", p.tech_name)}
          ${row("재질", p.material)}
          ${row("함수율(%)", p.water_content_percent)}
          ${row("Dk/t", p.dk_t)}
          ${row("UV 차단", p.uv_block === true ? "Yes" : p.uv_block === false ? "No" : "-")}
          ${row("BC (mm)", bc)}
          ${row("DIA (mm)", p.dia_mm)}
          ${row("도수 범위", p.power_range)}
          ${row("Cylinder 범위", p.cylinder_range)}
          ${row("Axis 범위", p.axis_range)}
          ${row("가입도 범위", p.notes)}
        </tbody>
      </table>
    </div>
  `;
}

function renderList() {
  const q = $("q") ? $("q").value.trim() : "";
  const type = $("type") ? $("type").value : "";
  const period = $("period") ? $("period").value : "";

  const list = $("list");
  if (!list) return;

  const filtered = PRODUCTS.filter((p) => matchFilters(p, q, type, period));

  if ($("count")) {
    $("count").textContent = `검색 결과: ${filtered.length}개`;
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty">검색 결과가 없어요.</div>`;
    return;
  }

  list.innerHTML = filtered.map((p) => {
    const isOpen = Number(openProductId) === Number(p.id);

    return `
      <div class="card ${isOpen ? "open" : ""}" data-id="${p.id}">
        <div class="card-summary">
          <div><b>${brandHtml(p.product_name_ko || "-")}</b></div>
          <div class="meta">${brandHtml(p.product_name_en || "")}</div>
          <div class="badges">${badgeHtml(p)}</div>
        </div>
        <img class="product-thumb" src="${p.id}.png" alt="" loading="lazy" onerror="this.style.display='none'" />
        ${isOpen ? `<div class="card-detail">${detailHtml(p)}</div>` : ""}
      </div>
    `;
  }).join("");

  document.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("click", (e) => {
      const clickedLink = e.target.closest("a");
      if (clickedLink) return;

      const id = Number(el.dataset.id);

      if (openProductId === id) {
        openProductId = null;
      } else {
        openProductId = id;
      }

      renderList();

      const activeCard = document.querySelector(`.card[data-id="${id}"]`);
      if (activeCard) {
        activeCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });
}

async function init() {
  const list = $("list");

  try {
    const res = await fetch("products.json?ts=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    PRODUCTS = await res.json();
    if (!Array.isArray(PRODUCTS)) throw new Error("JSON 배열 아님");
  } catch (err) {
    console.error("products.json load error:", err);
    if (list) {
      list.innerHTML = `<div class="empty">products.json을 불러오지 못했어요.</div>`;
    }
    if ($("count")) {
      $("count").textContent = "검색 결과: 0개";
    }
    return;
  }

  ["q", "type", "period"].forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => {
      openProductId = null;
      renderList();
    });
    el.addEventListener("change", () => {
      openProductId = null;
      renderList();
    });
  });

  $("btnSearch")?.addEventListener("click", () => {
    openProductId = null;
    renderList();
  });

  $("btnClear")?.addEventListener("click", () => {
    if ($("q")) $("q").value = "";
    if ($("type")) $("type").value = "";
    if ($("period")) $("period").value = "";
    openProductId = null;
    renderList();
  });

  renderList();
}

init();
