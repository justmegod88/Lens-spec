let PRODUCTS = [];
const $ = (id) => document.getElementById(id);

function textOf(p) {
  const parts = [
    p.product_name_ko,
    p.product_name_en,
    p.tech_name,
    (p.category || []).join(" "),
    p.material,
    p.power_range,
    p.cylinder_range,
    p.axis_range,
    p.notes
  ].filter(Boolean);

  return parts.join(" ").toLowerCase();
}

function normalizePeriod(category) {
  if (category === "원데이") return "원데이";
  if (category === "2주") return "2주";
  if (category === "먼슬리" || category === "한달용") return "한달용";
  return category;
}

function hasPeriodCategory(categories, period) {
  if (!period) return true;
  const normalized = (categories || []).map(normalizePeriod);
  return normalized.includes(period);
}

function hasTypeCategory(categories, type) {
  if (!type) return true;
  return (categories || []).includes(type);
}

function matchFilters(p, q, type, period) {
  // 아큐브만 노출
  if (p.manufacturer !== "아큐브") return false;

  const categories = p.category || [];

  if (!hasTypeCategory(categories, type)) return false;
  if (!hasPeriodCategory(categories, period)) return false;

  if (!q) return true;
  return textOf(p).includes(q.toLowerCase());
}

function badgeHtml(p) {
  return (p.category || []).map(c => {
    const label = normalizePeriod(c);
    return `<span class="badge">${label}</span>`;
  }).join("");
}

function renderList() {
  const q = $("q").value.trim();
  const type = $("type").value;
  const period = $("period").value;

  const list = $("list");
  const filtered = PRODUCTS.filter(p => matchFilters(p, q, type, period));

  $("count").textContent = `검색 결과: ${filtered.length}개`;

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty">검색 결과가 없어요. 검색어를 바꾸거나 필터를 해제해보세요.</div>`;
    return;
  }

  list.innerHTML = filtered.map((p) => `
    <div class="card" data-id="${p.id}">
      <div><b>${p.product_name_ko}</b></div>
      <div class="meta">${p.product_name_en || ""}</div>
      <div class="badges">${badgeHtml(p)}</div>
      <div class="meta">
        BC: ${(p.bc_mm || []).join(", ") || "-"} · DIA: ${p.dia_mm ?? "-"}<br/>
        재질: ${p.material || "-"} · 함수율: ${p.water_content_percent ?? "-"}%
      </div>
      <div class="meta">
        도수 범위: ${p.power_range || "-"}
      </div>
    </div>
  `).join("");

  [...document.querySelectorAll(".card")].forEach(el => {
    el.addEventListener("click", () => {
      const id = Number(el.dataset.id);
      const p = PRODUCTS.find(x => x.id === id);
      showDetail(p);
    });
  });
}

function row(key, val) {
  return `<tr><td class="key">${key}</td><td>${val ?? "-"}</td></tr>`;
}

function showDetail(p) {
  if (!p) return;

  $("detail").classList.remove("hidden");
  $("d-title").textContent = p.product_name_ko;
  $("d-link").href = p.source_url || "#";

  const bc = (p.bc_mm || []).length ? p.bc_mm.join(", ") : "-";
  const cats = (p.category || []).map(normalizePeriod).join(", ") || "-";

  $("d-table").innerHTML =
    row("제품명(영문)", p.product_name_en) +
    row("기술명/브랜드", p.tech_name) +
    row("타입", cats) +
    row("재질", p.material) +
    row("함수율(%)", p.water_content_percent) +
    row("Dk/t", p.dk_t) +
    row("UV 차단", p.uv_block === true ? "Yes" : p.uv_block === false ? "No" : "-") +
    row("BC (mm)", bc) +
    row("DIA (mm)", p.dia_mm) +
    row("도수 범위", p.power_range) +
    row("Cylinder 범위", p.cylinder_range) +
    row("Axis 범위", p.axis_range) +
    row("비고", p.notes) +
    row("출처", p.source_url ? `<a href="${p.source_url}" target="_blank" rel="noreferrer">${p.source_url}</a>` : "-");
}

async function init() {
  const res = await fetch("products.json", { cache: "no-store" });
  PRODUCTS = await res.json();

  ["q", "type", "period"].forEach(id => {
    $(id).addEventListener("input", renderList);
    $(id).addEventListener("change", renderList);
  });

  $("btnSearch").addEventListener("click", renderList);

  $("btnClear").addEventListener("click", () => {
    $("q").value = "";
    $("type").value = "";
    $("period").value = "";
    renderList();
  });

  $("d-close").addEventListener("click", () => {
    $("detail").classList.add("hidden");
  });

  renderList();
}

init();
