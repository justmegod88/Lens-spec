let PRODUCTS = [];
const $ = (id) => document.getElementById(id);

function textOf(p){
  const parts = [
    p.manufacturer,
    p.product_name_ko,
    p.product_name_en,
    p.tech_name,
    (p.category||[]).join(" "),
    p.material,
    p.power_range,
    p.cylinder_range,
    p.axis_range,
    p.notes
  ].filter(Boolean);
  return parts.join(" ").toLowerCase();
}

function matchFilters(p, q, mfg, type){
  if(mfg && p.manufacturer !== mfg) return false;
  if(type){
    const cats = (p.category||[]);
    if(!cats.includes(type)) return false;
  }
  if(!q) return true;
  return textOf(p).includes(q.toLowerCase());
}

function badgeHtml(p){
  return (p.category||[]).map(c => `<span class="badge">${c}</span>`).join("");
}

function renderList(){
  const q = $("q").value.trim();
  const mfg = $("mfg").value;
  const type = $("type").value;

  const list = $("list");
  const filtered = PRODUCTS.filter(p => matchFilters(p, q, mfg, type));

  $("count").textContent = `검색 결과: ${filtered.length}개`;

  if(filtered.length === 0){
    list.innerHTML = `<div class="empty">검색 결과가 없어요. (필터를 '전체'로 바꾸거나 products.json에 제품을 추가하세요)</div>`;
    return;
  }

  list.innerHTML = filtered.map((p) => `
    <div class="card" data-id="${p.id}">
      <div><b>${p.product_name_ko}</b></div>
      <div class="meta">${p.manufacturer} · ${p.product_name_en || ""}</div>
      <div class="badges">${badgeHtml(p)}</div>
      <div class="meta">
        BC: ${(p.bc_mm||[]).join(", ") || "-"} · DIA: ${p.dia_mm ?? "-"}<br/>
        재질: ${p.material || "-"} · 함수율: ${p.water_content_percent ?? "-"}%
      </div>
    </div>
  `).join("");

  [...document.querySelectorAll(".card")].forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = Number(el.dataset.id);
      const p = PRODUCTS.find(x => x.id === id);
      showDetail(p);
    });
  });
}

function row(key, val){
  return `<tr><td class="key">${key}</td><td>${val ?? "-"}</td></tr>`;
}

function showDetail(p){
  if(!p) return;
  $("detail").classList.remove("hidden");
  $("d-title").textContent = `${p.manufacturer} | ${p.product_name_ko}`;
  $("d-link").href = p.source_url || "#";

  const bc = (p.bc_mm||[]).length ? p.bc_mm.join(", ") : "-";
  const cats = (p.category||[]).join(", ") || "-";

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

async function init(){
  const res = await fetch("data/products.json", { cache: "no-store" });
  PRODUCTS = await res.json();

  // 입력만으로 자동 갱신(선택)
  ["q","mfg","type"].forEach(id => $(id).addEventListener("input", renderList));

  // '확인' 버튼
  $("btnSearch").addEventListener("click", renderList);

  // 초기화
  $("btnClear").addEventListener("click", ()=>{
    $("q").value = "";
    $("mfg").value = "";
    $("type").value = "";
    renderList();
  });

  $("d-close").addEventListener("click", ()=> $("detail").classList.add("hidden"));

  renderList();
}

init();
