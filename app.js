let PRODUCTS = [];
const $ = (id) => document.getElementById(id);

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
  if (category === "먼슬리" || category === "한달용") return "한달용";
  return category;
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
  return getCategories(p).map(c => {
    const label = normalizePeriod(c);
    return `<span class="badge">${label}</span>`;
  }).join("");
}

function row(key, val) {
  return `
    <tr>
      <td class="key">${key}</td>
      <td>${val ?? "-"}</td>
    </tr>
  `;
}

function detailInlineHtml(p) {
  const bc = Array.isArray(p.bc_mm) && p.bc_mm.length ? p.bc_mm.join(", ") : "-";
  const cats = getCategories(p).map(normalizePeriod).join(", ") || "-";

  return `
    <div class="inline-detail-card">
      <div class="detail-head">
        <h2>${p.product_name_ko || "-"}</h2>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <a href="${p.source_url || "#"}" target="_blank" rel="noreferrer">공식 페이지</a>
          <button class="btn inline-close-btn" type="button">닫기</button>
        </div>
      </div>
      <table class="spec">
        <tbody>
          ${row("제품명(영문)", p.product_name_en)}
          ${row("기술명/브랜드", p.tech_name)}
          ${row("타입", cats)}
          ${row("재질", p.material)}
          ${row("함수율(%)", p.water_content_percent)}
          ${row("Dk/t", p.dk_t)}
          ${row("UV 차단", p.uv_block === true ? "Yes" : p.uv_block === false ? "No" : "-")}
          ${row("BC (mm)", bc)}
          ${row("DIA (mm)", p.dia_mm)}
          ${row("도수 범위", p.power_range)}
          ${row("Cylinder 범위", p.cylinder_range)}
          ${row("Axis 범위", p.axis_range)}
          ${row("비고", p.notes)}
        </tbody>
      </table>
    </div>
  `;
}

function removeInlineDetails() {
  document.querySelectorAll(".inline-detail-row").forEach(el => el.remove());
  document.querySelectorAll(".card.open").forEach(el => el.classList.remove("open"));
}

function openInlineDetail(cardEl, product) {
  const grid = $("list");
  if (!grid || !cardEl || !product) return;

  const alreadyOpen = cardEl.classList.contains("open");

  removeInlineDetails();

  if (alreadyOpen) return;

  cardEl.classList.add("open");

  const detailRow = document.createElement("div");
  detailRow.className = "inline-detail-row";

  const colCount = window.innerWidth <= 768 ? 1 : 2;
  detailRow.style.gridColumn = `1 / span ${colCount}`;
  detailRow.innerHTML = detailInlineHtml(product);

  cardEl.insertAdjacentElement("afterend", detailRow);

  const closeBtn = detailRow.querySelector(".inline-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      removeInlineDetails();
    });
  }
}

function renderList() {
  const q = $("q") ? $("q").value.trim() : "";
  const type = $("type") ? $("type").value : "";
  const period = $("period") ? $("period").value : "";

  const list = $("list");
  if (!list) return;

  const filtered = PRODUCTS.filter(p => matchFilters(p, q, type, period));

  if ($("count")) {
    $("count").textContent = `검색 결과: ${filtered.length}개`;
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty">검색 결과가 없어요.</div>`;
    return;
  }

  list.innerHTML = filtered.map((p) => `
    <div class="card" data-id="${p.id}">
      <div><b>${p.product_name_ko || "-"}</b></div>
      <div class="meta">${p.product_name_en || ""}</div>
      <div class="badges">${badgeHtml(p)}</div>
      <div class="meta">
    </div>
  `).join("");

  document.querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", () => {
      const id = Number(el.dataset.id);
      const product = PRODUCTS.find(x => Number(x.id) === id);
      openInlineDetail(el, product);
    });
  });
}

async function init() {
  const list = $("list");

  try {
    const res = await fetch("data/products.json?ts=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    PRODUCTS = await res.json();
    if (!Array.isArray(PRODUCTS)) throw new Error("JSON 배열 아님");
  } catch (err) {
    console.error("products.json load error:", err);
    if (list) {
      list.innerHTML = `<div class="empty">products.json을 불러오지 못했어요.</div>`;
    }
    if ($("count")) $("count").textContent = "검색 결과: 0개";
    return;
  }

  ["q", "type", "period"].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", renderList);
    el.addEventListener("change", renderList);
  });

  $("btnSearch")?.addEventListener("click", renderList);

  $("btnClear")?.addEventListener("click", () => {
    if ($("q")) $("q").value = "";
    if ($("type")) $("type").value = "";
    if ($("period")) $("period").value = "";
    renderList();
  });

  renderList();

  window.addEventListener("resize", () => {
    removeInlineDetails();
  });
}

init();
