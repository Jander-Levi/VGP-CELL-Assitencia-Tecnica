// app.js - SPA OS manager (ASCII-safe)
// 
// Objetivo: App de Ordens de Servico (O.S.) em SPA puro (ES Modules)
// - Roteamento por hash (#dashboard, #os-list, etc.)
// - CRUD de O.S. e Clientes via localStorage (espelho em IndexedDB)
// - Impressao de visualizacoes e termo de garantia
//
// Notas de manutencao:
// - Evitar acentos em strings para reduzir risco de mojibake
// - Alteracoes de UI ficam nas funcoes render* abaixo
// - Estrutura basica de O.S. esta descrita em gatherOSFromForm()
import {
  formatCurrencyBRL,
  parseCurrencyBRL,
  uid,
  todayISO,
  debounce,
  serializeForm,
  setFormValues,
  downloadJSON,
} from "./utils.js";
import {
  getAllOS,
  saveOS,
  deleteOS,
  getAllClients,
  saveClient,
  deleteClient,
  exportAll,
  importAll,
  getOSById,
  generateOSNumber,
} from "./storage.js";
import { saveToDatabase, deleteFromDatabase } from "./db.js";

// Router map
const routes = {
  dashboard: renderDashboard,
  "os-list": renderOSList,
  "os-new": () => renderOSForm(),
  "os-edit": (p) => renderOSForm(p?.id),
  "os-view": (p) => renderOSView(p?.id),
  warranty: (p) => renderWarranty(p?.id),
  clients: renderClients,
  settings: renderSettings,
};

// Refs
const view = document.getElementById("view");
const routeButtons = document.querySelectorAll(".menu-item");
const btnNewOS = document.getElementById("btnNewOS");
const globalSearch = document.getElementById("globalSearch");
const sidebar = document.getElementById("sidebar");

// Init
ensureUI();
routeButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    navigate(btn.dataset.route);
    closeMenu();
  })
);
btnNewOS?.addEventListener("click", () => navigate("os-new"));
globalSearch?.addEventListener(
  "input",
  debounce((e) => {
    const q = e.target.value.trim();
    if (!q) {
      if (location.hash.startsWith("#os-list")) updateOSList();
      return;
    }
    navigate("os-list", { q });
  }, 300)
);

document.addEventListener(
  "submit",
  (e) => {
    const t = e.target;
    if (t && (t.id === "osForm" || t.id === "clientForm")) e.preventDefault();
  },
  true
);

window.addEventListener("hashchange", routeFromHash);
routeFromHash();

function setActive(route) {
  routeButtons.forEach((b) =>
    b.classList.toggle("active", b.dataset.route === route)
  );
}
function navigate(route, params = {}) {
  const q = new URLSearchParams(params).toString();
  location.hash = `#${route}${q ? "?" + q : ""}`;
}
function routeFromHash() {
  const hash = location.hash.replace("#", "") || "dashboard";
  const [path, query] = hash.split("?");
  const params = Object.fromEntries(new URLSearchParams(query));
  const render = routes[path] || renderDashboard;
  setActive(path);
  render(params);
}

// UI helpers
// Ajustes de UI para navegacao mobile e identidade visual
function ensureUI() {
  const topbar = document.querySelector(".topbar");
  if (topbar && !document.getElementById("btnMenu")) {
    const btn = document.createElement("button");
    btn.id = "btnMenu";
    btn.className = "hamburger";
    btn.ariaLabel = "Abrir menu";
    btn.textContent = "Menu";
    btn.addEventListener("click", toggleMenu);
    topbar.prepend(btn);
    const brand = document.createElement("div");
    brand.className = "topbrand";
    brand.innerHTML =
      '<img src="assets/img/Logo.png" alt="VGP CELL" class="brand-logo" onerror="this.style.display=\'none\'"/><span class="brand-text">VGP CELL</span>';
    topbar.insertBefore(brand, topbar.children[1] || null);
    brand.style.cursor = "pointer";
    brand.addEventListener("click", () => navigate("dashboard"));
  }
  if (!document.getElementById("backdrop")) {
    const b = document.createElement("div");
    b.id = "backdrop";
    b.className = "backdrop";
    b.hidden = true;
    b.addEventListener("click", closeMenu);
    document.getElementById("app")?.appendChild(b);
  }
  sidebar?.classList.remove("open");
  const back = document.getElementById("backdrop");
  if (back) back.hidden = true;
  const sbBrand = document.querySelector(".sidebar .brand");
  if (sbBrand) {
    sbBrand.style.cursor = "pointer";
    sbBrand.addEventListener("click", () => {
      navigate("dashboard");
      closeMenu();
    });
  }
}
function toggleMenu() {
  const b = document.getElementById("backdrop");
  const opened = sidebar?.classList.toggle("open");
  if (b) b.hidden = !opened;
  const m = document.getElementById("btnMenu");
  if (m) m.setAttribute("aria-expanded", String(!!opened));
}
function closeMenu() {
  sidebar?.classList.remove("open");
  const b = document.getElementById("backdrop");
  if (b) b.hidden = true;
  const m = document.getElementById("btnMenu");
  if (m) m.setAttribute("aria-expanded", "false");
}

// Utils
// Funcoes utilitarias locais (data e sanitizacao de texto)
function fmtDateBR(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function strip(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Dashboard
// Dashboard - cards com contagem e ultimas O.S.
function renderDashboard() {
  const list = getAllOS();
  const n = (t) => strip(t).toLowerCase();
  const stats = {
    total: list.length,
    abertas: list.filter((x) => n(x.status) === "aberta").length,
    andamento: list.filter((x) =>
      ["em analise", "aguardando peca"].includes(n(x.status))
    ).length,
    concluidas: list.filter((x) =>
      ["concluida", "entregue"].includes(n(x.status))
    ).length,
  };
  view.innerHTML = `
    <div class="cards">
      <div class="card"><div class="label">Total O.S.</div><div class="value">${
        stats.total
      }</div></div>
      <div class="card"><div class="label">Abertas</div><div class="value">${
        stats.abertas
      }</div></div>
      <div class="card"><div class="label">Em Andamento</div><div class="value">${
        stats.andamento
      }</div></div>
      <div class="card"><div class="label">Concluidas/Entregues</div><div class="value">${
        stats.concluidas
      }</div></div>
    </div>
    <div class="panel">
      <div class="panel-header">Ultimas O.S.</div>
      <div class="panel-body">${renderTable(list.slice(0, 8))}</div>
    </div>`;
  bindListActions();
}

// OS list
// Lista de O.S. com filtro por status e busca global
function renderOSList(params = {}) {
  const list = getAllOS();
  const q = (params.q || "").toLowerCase();
  const status = params.status || "";
  const filtered = list.filter((item) => {
    const text = `${item.osNumber} ${item.client?.name || ""}`.toLowerCase();
    const okQ = q ? text.includes(q) : true;
    const okS = status
      ? strip(item.status).toLowerCase() === strip(status).toLowerCase()
      : true;
    return okQ && okS;
  });
  view.innerHTML = `
    <div class="panel">
      <div class="panel-header">Ordens de Servico</div>
      <div class="panel-body">
        <div class="toolbar" style="margin-bottom:10px;">
          <select id="filterStatus">
            <option value="">Todos os status</option>
            ${[
              "Aberta",
              "Em analise",
              "Aguardando peca",
              "Concluida",
              "Entregue",
            ]
              .map(
                (s) =>
                  `<option ${
                    strip(status) === strip(s) ? "selected" : ""
                  }>${s}</option>`
              )
              .join("")}
          </select>
          <button class="btn" id="btnClearFilters">Limpar filtros</button>
          <span class="badge">${filtered.length} resultados</span>
        </div>
        ${renderTable(filtered)}
      </div>
    </div>`;
  document.getElementById("filterStatus")?.addEventListener("change", (e) => {
    navigate("os-list", {
      q: globalSearch?.value?.trim() || "",
      status: e.target.value,
    });
  });
  document.getElementById("btnClearFilters")?.addEventListener("click", () => {
    if (globalSearch) globalSearch.value = "";
    navigate("os-list");
  });
  bindListActions();
}

// Tabela de O.S. (usa classe .stack para responsivo)
function renderTable(list) {
  if (!list.length) return '<div class="help">Nenhuma O.S. encontrada.</div>';
  return `
    <table class="table stack">
      <thead><tr><th>No. O.S.</th><th>Cliente</th><th>Modelo</th><th>Status</th><th>Data</th><th>Valor</th><th>Acoes</th></tr></thead>
      <tbody>
        ${list
          .map(
            (item) => `
          <tr data-id="${item.id}">
            <td data-label="No. O.S.">${item.osNumber}</td>
            <td data-label="Cliente">${item.client?.name || "-"}</td>
            <td data-label="Modelo">${item.device?.model || "-"}</td>
            <td data-label="Status"><span class="status ${statusClass(
              item.status
            )}">${item.status}</span></td>
            <td data-label="Data">${item.dateOpen || "-"}</td>
            <td data-label="Valor">${formatCurrencyBRL(
              item.finance?.total || 0
            )}</td>
            <td data-label="Acoes"><div class="toolbar">
              <button class="btn btn-ghost action-view">Visualizar</button>
              <button class="btn action-edit">Editar</button>
              <button class="btn btn-danger action-delete">Excluir</button>
            </div></td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}
function statusClass(s) {
  const n = strip(s).toLowerCase();
  return n === "aberta"
    ? "aberta"
    : n === "em analise"
    ? "analise"
    : n === "aguardando peca"
    ? "peca"
    : n === "concluida"
    ? "concluida"
    : "entregue";
}
// Acoes da tabela (visualizar, editar, excluir)
function bindListActions() {
  view.querySelectorAll(".action-edit").forEach((b) =>
    b.addEventListener("click", (e) => {
      const id = e.target.closest("tr").dataset.id;
      navigate("os-edit", { id });
    })
  );
  view.querySelectorAll(".action-delete").forEach((b) =>
    b.addEventListener("click", async (e) => {
      const id = e.target.closest("tr").dataset.id;
      if (confirm("Deseja excluir esta O.S.?")) {
        deleteOS(id);
        try {
          await deleteFromDatabase(id);
        } catch {}
        updateOSList();
      }
    })
  );
  view.querySelectorAll(".action-view").forEach((b) =>
    b.addEventListener("click", (e) => {
      const id = e.target.closest("tr").dataset.id;
      navigate("os-view", { id });
    })
  );
}
function updateOSList() {
  const hash = location.hash.replace("#", "");
  const [path, q] = hash.split("?");
  if (path !== "os-list") return;
  renderOSList(Object.fromEntries(new URLSearchParams(q)));
}

// OS form
// Formulario de criacao/edicao da O.S.
function renderOSForm(id) {
  const editing = !!id;
  const os = editing ? getOSById(id) || {} : {};
  const osNumber = editing ? os.osNumber : generateOSNumber();
  const clients = getAllClients();
  const clientOptions = clients
    .map(
      (c) =>
        `<option value="${c.name} - ${c.phone}" data-id="${c.id}"></option>`
    )
    .join("");

  view.innerHTML = `
    <form id="osForm" class="form panel" onsubmit="return false;">
      <div class="panel-header">${editing ? "Editar O.S." : "Nova O.S."}</div>
      <div class="panel-body">
        <input type="hidden" name="id" value="${os.id || uid("os")}">
        <input type="hidden" name="dataId" value="${os.dataId || ""}">
        <div class="grid cols-4">
          <div class="field"><label>Numero da O.S</label><input name="osNumber" value="${osNumber}" readonly></div>
          <div class="field"><label>Data de abertura</label><input type="date" name="dateOpen" value="${
            os.dateOpen || todayISO()
          }"></div>
          <div class="field"><label>Status</label><select name="status">${[
            "Aberta",
            "Em analise",
            "Aguardando peca",
            "Concluida",
            "Entregue",
          ]
            .map(
              (s) =>
                `<option ${
                  strip(os.status) === strip(s) ? "selected" : ""
                }>${s}</option>`
            )
            .join("")}</select></div>
          <div class="field"><label>Prazo de entrega</label><input type="date" name="dueDate" value="${
            os.dueDate || ""
          }"></div>
        </div>
        <div class="grid cols-3">
          <div class="field"><label>Tecnico responsavel</label><input name="technician" value="${
            os.technician || ""
          }"></div>
          <div class="field"><label>Atendente</label><input name="attendant" value="${
            os.attendant || ""
          }"></div>
          <div class="field"><label>Forma de pagamento</label><select name="paymentMethod">${[
            "Pix",
            "Cartao",
            "Dinheiro",
          ]
            .map(
              (m) =>
                `<option ${
                  os.finance?.paymentMethod === m ? "selected" : ""
                }>${m}</option>`
            )
            .join("")}</select></div>
        </div>

        <div class="panel" style="margin-top:8px;">
          <div class="panel-header">Cliente</div>
          <div class="panel-body grid cols-3">
            <div class="field"><label>Buscar cliente</label><input list="clientList" id="clientPicker" placeholder="Nome - Telefone"><datalist id="clientList">${clientOptions}</datalist><div class="help">Selecione para preencher os campos</div></div>
            <div></div><div></div>
            <div class="field"><label>Nome completo</label><input name="client.name" value="${
              os.client?.name || ""
            }" required></div>
            <div class="field"><label>CPF</label><input name="client.cpf" value="${
              os.client?.cpf || ""
            }"></div>
            <div class="field"><label>Telefone / WhatsApp</label><input name="client.phone" value="${
              os.client?.phone || ""
            }" required></div>
            <div class="field" style="grid-column:1/-1;"><label>Endereco</label><input name="client.address" value="${
              os.client?.address || ""
            }"></div>
          </div>
        </div>

        <div class="panel" style="margin-top:8px;">
          <div class="panel-header">Aparelho</div>
          <div class="panel-body grid cols-3">
            <div class="field"><label>Marca</label><input name="device.brand" value="${
              os.device?.brand || ""
            }"></div>
            <div class="field"><label>Modelo</label><input name="device.model" value="${
              os.device?.model || ""
            }" required></div>
            <div class="field"><label>Cor</label><input name="device.color" value="${
              os.device?.color || ""
            }"></div>
            <div class="field"><label>Condicao fisica</label><input name="device.condition" value="${
              os.device?.condition || ""
            }"></div>
            <div class="field"><label>Acessorios deixados</label><input name="device.accessories" value="${
              os.device?.accessories || ""
            }"></div>
            <div class="field" style="grid-column:1/-1;"><label>Relato do cliente</label><textarea name="device.report">${
              os.device?.report || ""
            }</textarea></div>
            <div class="field" style="grid-column:1/-1;"><label>Servico executado</label><textarea name="device.service">${
              os.device?.service ||
              normalizeServices(os.device?.servicesList || [])
                .map((s) => s.name)
                .join(", ") ||
              ""
            }</textarea></div>
          </div>
        </div>

        <div class="panel" style="margin-top:8px;">
          <div class="panel-header">Financeiro</div>
          <div class="panel-body grid cols-4">
            <div class="field"><label>Valor da mao de obra</label><input name="finance.labor" value="${formatCurrencyBRL(
              os.finance?.labor || 0
            )}" placeholder="0,00"></div>
            <div class="field"><label>Desconto (%)</label><input type="number" min="0" max="100" step="1" name="finance.discountPercent" value="${
              os.finance?.discountPercent ?? 0
            }"></div>
            <div class="field"><label>Valor total</label><input name="finance.total" value="${formatCurrencyBRL(
              os.finance?.total || 0
            )}" readonly></div>
            <div class="field"><label>Status do pagamento</label><select name="finance.paymentStatus">${[
              "Pendente",
              "Pago",
            ]
              .map(
                (s) =>
                  `<option ${
                    os.finance?.paymentStatus === s ? "selected" : ""
                  }>${s}</option>`
              )
              .join("")}</select></div>
          </div>
        </div>

        <div class="panel" style="margin-top:8px;">
          <div class="panel-header">Outros</div>
          <div class="panel-body grid cols-1">
            <div class="field"><label>Observacoes gerais</label><textarea name="notes">${
              os.notes || ""
            }</textarea></div>
          </div>
        </div>

        <div class="row" style="justify-content:flex-end; margin-top:10px;">
          <button type="button" class="btn" id="btnPrint">Imprimir / PDF</button>
          <button type="button" class="btn" id="btnCancel">Cancelar</button>
          <button class="btn btn-primary">${
            editing ? "Salvar alteracoes" : "Criar O.S."
          }</button>
        </div>
      </div>
    </form>`;

  const form = document.getElementById("osForm");
  if (editing) setFormValues(form, flattenOS(os));

  const clientPicker = document.getElementById("clientPicker");
  clientPicker?.addEventListener("change", () => {
    const val = clientPicker.value;
    const c = getAllClients().find((x) => `${x.name} - ${x.phone}` === val);
    if (c) fillClient(form, c);
  });

  // Recalcula total (mao de obra - desconto%)
  const recalc = () => {
    const labor = parseCurrencyBRL(form.elements["finance.labor"].value);
    const p = Number(form.elements["finance.discountPercent"].value || 0);
    const total = Math.max(
      0,
      labor - labor * (Math.max(0, Math.min(100, p)) / 100)
    );
    form.elements["finance.total"].value = formatCurrencyBRL(total);
  };
  form.elements["finance.labor"].addEventListener("input", recalc);
  form.elements["finance.labor"].addEventListener(
    "blur",
    (e) =>
      (e.target.value = formatCurrencyBRL(parseCurrencyBRL(e.target.value)))
  );
  form.elements["finance.discountPercent"].addEventListener("input", recalc);
  recalc();

  document
    .getElementById("btnCancel")
    ?.addEventListener("click", () => navigate("os-list"));
  document
    .getElementById("btnPrint")
    ?.addEventListener("click", () => window.print());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = gatherOSFromForm(form);
    const prev = editing ? getOSById(data.id) || null : null;
    const nowIso = new Date().toISOString();
    if (prev) {
      data.history = (prev.history || []).slice();
      const entry = buildChangeEntry(prev, data, nowIso);
      if (entry.details.length) data.history.push(entry);
    } else {
      data.history = [{ ts: nowIso, title: "O.S. criada", details: [] }];
    }
    const allClients = getAllClients();
    const existing = allClients.find(
      (c) => c.name === data.client.name && c.phone === data.client.phone
    );
    const clientSaved = saveClient({ ...(existing || {}), ...data.client });
    data.client.id = clientSaved.id;
    saveOS(data);
    try {
      await saveToDatabase(data);
    } catch {}
    navigate("os-view", { id: data.id });
  });
}

function flattenOS(os) {
  const out = { ...os };
  if (os.client)
    Object.entries(os.client).forEach(([k, v]) => (out[`client.${k}`] = v));
  if (os.device)
    Object.entries(os.device).forEach(([k, v]) => (out[`device.${k}`] = v));
  if (os.finance)
    Object.entries(os.finance).forEach(([k, v]) => {
      const key = `finance.${k}`;
      out[key] = ["labor", "total"].includes(k) ? formatCurrencyBRL(v) : v;
    });
  return out;
}
function fillClient(form, c) {
  setFormValues(form, {
    "client.name": c.name,
    "client.cpf": c.cpf || "",
    "client.phone": c.phone || "",
    "client.address": c.address || "",
  });
}
// Coleta dados do formulario e monta objeto O.S.
function gatherOSFromForm(form) {
  const d = serializeForm(form);
  const existing = getOSById(d.id);
  return {
    id: d.id,
    dataId: d.dataId || "",
    osNumber: d.osNumber,
    dateOpen: d.dateOpen,
    status: d.status,
    technician: d.technician,
    attendant: d.attendant,
    dueDate: d.dueDate,
    client: {
      name: d["client.name"],
      cpf: d["client.cpf"],
      phone: d["client.phone"],
      address: d["client.address"],
    },
    device: {
      brand: d["device.brand"],
      model: d["device.model"],
      color: d["device.color"],
      condition: d["device.condition"],
      accessories: d["device.accessories"],
      report: d["device.report"],
      service: d["device.service"],
      warranty: existing?.device?.warranty || 90,
    },
    finance: {
      labor: parseCurrencyBRL(d["finance.labor"]),
      discountPercent: Number(d["finance.discountPercent"] || 0),
      total: parseCurrencyBRL(d["finance.total"]),
      paymentMethod: d["paymentMethod"],
      paymentStatus: d["finance.paymentStatus"],
    },
    notes: d.notes || "",
    history: existing?.history || [],
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// OS view
// Visualizacao de O.S. (com secoes e botoes de acoes)
function renderOSView(id) {
  const os = getOSById(id);
  if (!os) {
    view.innerHTML = '<div class="help">O.S. nao encontrada.</div>';
    return;
  }
  view.innerHTML = `
    <div class="panel">
      <div class="panel-header">O.S. ${os.osNumber}</div>
      <div class="panel-body">
        <div class="toolbar" style="justify-content:flex-end; margin-bottom:8px;">
          <button class="btn" id="vPrint">Imprimir / PDF</button>
          <button class="btn" id="vWarranty">Termo de Garantia</button>
          <button class="btn" id="vEdit">Editar</button>
          <button class="btn btn-danger" id="vDelete">Excluir</button>
        </div>
        ${sectionGrid("Identificacao", [
          ["Numero", os.osNumber],
          ["Abertura", os.dateOpen || "-"],
          ["Status", os.status],
          ["Tecnico", os.technician || "-"],
          ["Atendente", os.attendant || "-"],
          ["Prazo", os.dueDate || "-"],
        ])}
        ${sectionGrid("Cliente", [
          ["Nome", os.client?.name || "-"],
          ["CPF", os.client?.cpf || "-"],
          ["Telefone", os.client?.phone || "-"],
          ["Endereco", os.client?.address || "-"],
        ])}
        ${sectionGrid("Aparelho", [
          ["Marca", os.device?.brand || "-"],
          ["Modelo", os.device?.model || "-"],
          ["Cor", os.device?.color || "-"],
          ["Condicao", os.device?.condition || "-"],
          ["Acessorios", os.device?.accessories || "-"],
        ])}
        ${sectionText("Servico executado", os.device?.service || "")}
        ${sectionGrid("Financeiro", [
          ["Mao de obra", formatCurrencyBRL(os.finance?.labor)],
          ["Desconto", (os.finance?.discountPercent ?? 0) + "%"],
          ["Total", formatCurrencyBRL(os.finance?.total)],
          ["Pagamento", os.finance?.paymentMethod || "-"],
          ["Status", os.finance?.paymentStatus || "-"],
        ])}
        ${sectionText("Observacoes", os.notes)}
        ${renderHistory(os.history)}
        <div class="help">ID integracao (data-id): ${os.dataId || "-"}</div>
      </div>
    </div>`;
  document
    .getElementById("vPrint")
    ?.addEventListener("click", () => window.print());
  document
    .getElementById("vWarranty")
    ?.addEventListener("click", () => navigate("warranty", { id }));
  document
    .getElementById("vEdit")
    ?.addEventListener("click", () => navigate("os-edit", { id }));
  document.getElementById("vDelete")?.addEventListener("click", async () => {
    if (confirm("Excluir esta O.S.?")) {
      deleteOS(id);
      try {
        await deleteFromDatabase(id);
      } catch {}
      navigate("os-list");
    }
  });
}
function sectionGrid(title, rows) {
  return `<div class="panel" style="margin:10px 0;"><div class="panel-header">${title}</div><div class="panel-body"><div class="grid cols-3">${rows
    .map(
      ([k, v]) =>
        `<div class="field"><label>${k}</label><div>${v || "-"}</div></div>`
    )
    .join("")}</div></div></div>`;
}
function sectionText(title, text) {
  return `<div class="panel" style="margin:10px 0;"><div class="panel-header">${title}</div><div class="panel-body"><div>${(
    text || "-"
  ).replace(/\n/g, "<br>")}</div></div></div>`;
}

// Historico: limita a 12 itens recentes (mais novo primeiro)
function renderHistory(hist) {
  const list = Array.isArray(hist) ? [...hist].reverse() : [];
  if (!list.length) return "";
  return `<div class="panel" style="margin:10px 0;"><div class="panel-header">Historico</div><div class="panel-body">${list
    .slice(0, 12)
    .map(
      (h) =>
        `<div class="field" style="margin-bottom:8px;"><label>${fmtDateBR(
          h.ts
        )} - ${h.title || "Alteracoes"}</label><div>${(h.details || [])
          .map((d) => "- " + d)
          .join("<br>")}</div></div>`
    )
    .join("")}</div></div>`;
}
// Gera descricao das alteracoes relevantes para o historico
function buildChangeEntry(prev, next, ts) {
  const details = [];
  if (prev.status !== next.status)
    details.push(`Status: ${prev.status || "-"} -> ${next.status}`);
  if ((prev.finance?.labor || 0) !== (next.finance?.labor || 0))
    details.push(
      `Mao de obra: ${formatCurrencyBRL(
        prev.finance?.labor || 0
      )} -> ${formatCurrencyBRL(next.finance?.labor || 0)}`
    );
  if (
    (prev.finance?.discountPercent || 0) !==
    (next.finance?.discountPercent || 0)
  )
    details.push(
      `Desconto: ${prev.finance?.discountPercent || 0}% -> ${
        next.finance?.discountPercent || 0
      }%`
    );
  if ((prev.finance?.total || 0) !== (next.finance?.total || 0))
    details.push(
      `Total: ${formatCurrencyBRL(
        prev.finance?.total || 0
      )} -> ${formatCurrencyBRL(next.finance?.total || 0)}`
    );
  if ((prev.device?.service || "") !== (next.device?.service || ""))
    details.push("Servico executado atualizado");
  return { ts, title: "Alteracoes salvas", details };
}

// Normaliza valores de servicos para { name }
function normalizeServices(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => (typeof s === "string" ? { name: s } : { name: s?.name || "" }))
    .filter((s) => s.name);
}

// Clients
// Tela de Clientes: CRUD simples
function renderClients() {
  const list = getAllClients();
  view.innerHTML = `
    <div class="panel">
      <div class="panel-header">Clientes</div>
      <div class="panel-body">
        <form id="clientForm" class="grid cols-4" style="margin-bottom:12px;">
          <input type="hidden" name="id">
          <div class="field"><label>Nome</label><input name="name" required></div>
          <div class="field"><label>CPF</label><input name="cpf"></div>
          <div class="field"><label>Telefone</label><input name="phone" required></div>
          <div class="field" style="grid-column:1/-1;"><label>Endereco</label><input name="address"></div>
          <div class="row" style="justify-content:flex-end; grid-column:1/-1;">
            <button type="reset" class="btn">Limpar</button>
            <button class="btn btn-primary">Salvar</button>
          </div>
        </form>
        <table class="table stack">
          <thead><tr><th>Nome</th><th>Telefone</th><th></th></tr></thead>
          <tbody>
            ${list
              .map(
                (c) =>
                  `<tr data-id="${c.id}"><td data-label="Nome">${
                    c.name
                  }</td><td data-label="Telefone">${
                    c.phone || "-"
                  }</td><td class="toolbar" data-label="Acoes"><button class="btn action-edit">Editar</button><button class="btn btn-danger action-delete">Excluir</button></td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>`;
  const form = document.getElementById("clientForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    saveClient({
      id: d.id,
      name: d.name,
      cpf: d.cpf,
      phone: d.phone,
      address: d.address,
    });
    renderClients();
  });
  view.querySelectorAll(".action-edit").forEach((b) =>
    b.addEventListener("click", (e) => {
      const id = e.target.closest("tr").dataset.id;
      const c = getAllClients().find((x) => x.id === id);
      if (c)
        Object.entries(c).forEach(([k, v]) => {
          const el = form.elements[k];
          if (el) el.value = v ?? "";
        });
    })
  );
  view.querySelectorAll(".action-delete").forEach((b) =>
    b.addEventListener("click", (e) => {
      const id = e.target.closest("tr").dataset.id;
      if (confirm("Excluir cliente?")) {
        deleteClient(id);
        renderClients();
      }
    })
  );
}

// Settings
// Tela de Configuracoes: exportar/importar (backup)
function renderSettings() {
  view.innerHTML = `
    <div class="panel">
      <div class="panel-header">Configuracoes / Backup</div>
      <div class="panel-body grid cols-2">
        <div class="field"><label>Exportar dados (JSON)</label><div class="row"><button class="btn btn-primary" id="btnExport">Exportar</button></div><div class="help">Inclui O.S., clientes e sequencia de numeracao</div></div>
        <div class="field"><label>Importar dados (JSON)</label><input type="file" id="fileImport" accept="application/json"></div>
      </div>
    </div>`;
  document.getElementById("btnExport")?.addEventListener("click", () => {
    downloadJSON(
      `backup_vgp_${new Date().toISOString().slice(0, 10)}.json`,
      exportAll()
    );
  });
  document
    .getElementById("fileImport")
    ?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const payload = JSON.parse(text);
        importAll(payload);
        alert("Importacao concluida.");
      } catch (err) {
        alert("Falha ao importar: " + err.message);
      }
    });
}

// Warranty
// Termo de Garantia: documento imprimivel com dados da O.S.
function renderWarranty(id) {
  const os = getOSById(id);
  if (!os) {
    view.innerHTML = '<div class="help">O.S. nao encontrada.</div>';
    return;
  }
  const warrantyDays = Number(os.device?.warranty || 90);
  const today = fmtDateBR(new Date().toISOString());
  const brand = os.device?.brand || "-";
  const model = os.device?.model || "";
  const color = os.device?.color || "-";
  const condition = os.device?.condition || "-";
  const cName = os.client?.name || "-";
  const cPhone = os.client?.phone || "-";
  const cCPF = os.client?.cpf || "-";
  const cAddr = os.client?.address || "-";
  view.innerHTML = `
    <div class="doc panel">
      <header>
        <div><img src="assets/img/Logo.png" class="logo" alt="Logo" onerror="this.style.display='none'"><div style="font-weight:800;">VGP CELL - Assistencia Tecnica</div></div>
        <div class="meta">No. O.S.: <strong>${
          os.osNumber
        }</strong><br>Data: ${today}</div>
      </header>
      <h1>Termo de Garantia</h1>
      <div class="box">
        <div class="rowline"><div class="line"><span class="label">Cliente</span><br>${cName}</div><div class="line"><span class="label">Telefone</span><br>${cPhone}</div></div>
        <div class="rowline"><div class="line"><span class="label">CPF</span><br>${cCPF}</div><div class="line"><span class="label">Endereco</span><br>${cAddr}</div></div>
      </div>
      <div class="box">
        <div class="rowline"><div class="line"><span class="label">Marca / Modelo</span><br>${brand} ${model}</div><div class="line"><span class="label">Cor</span><br>${color}</div></div>
        <div class="rowline"><div class="line"><span class="label">Condicao</span><br>${condition}</div></div>
        <div class="rowline"><div class="line"><span class="label">Garantia (dias)</span><br><input id="wDays" type="number" min="0" value="${warrantyDays}" style="max-width:120px;"></div></div>
      </div>
      <div class="box">
        <ol class="list">
          <li>Garantia de 90 dias conforme art. 26, II, CDC.</li>
          <li>Apps, instalacao/atualizacao e sistema operacional nao fazem parte da garantia.</li>
          <li>Limpeza e conservacao do aparelho nao fazem parte da garantia.</li>
          <li>Sem documento (nota/termo) que comprove o servico, a garantia e invalida.</li>
          <li>Falhas apos atualizacoes de sistema ou apps nao fazem parte da garantia.</li>
          <li>Garantia valida apenas para o item/servico descrito neste termo/OS/nota.</li>
        </ol>
        <div class="watermark">Validade prevista: ${warrantyDays} dias a partir da retirada/entrega.</div>
      </div>
      <div class="box"><div class="rowline"><div>Data: ${today}</div><div>Marca: ${brand}</div></div><div style="margin-top:8px; font-weight:700;">${warrantyDays} DIAS DE GARANTIA</div></div>
      <div class="box"><p>Confirmo que li este termo, fui orientado sobre seu conteudo e testei o aparelho, que se encontra em perfeito estado estetico e de funcionamento no ato da retirada.</p><div class="sign"><div class="slot"><div class="dash"></div><div>Cliente: ${
        os.client?.name || ""
      }</div></div><div class="slot"><div class="dash"></div><div>De acordo</div></div></div></div>
      <div class="toolbar" style="justify-content:flex-end; margin-top:12px;"><label class="row"><input type="checkbox" id="wAccept"> Cliente aceita os termos</label><button class="btn" id="wSave">Salvar garantia</button><button class="btn btn-primary" id="wPrint">Imprimir / Salvar PDF</button><button class="btn" id="wBack">Voltar</button></div>
    </div>`;
  document
    .getElementById("wBack")
    ?.addEventListener("click", () => navigate("os-view", { id }));
  document
    .getElementById("wPrint")
    ?.addEventListener("click", () => window.print());
  document.getElementById("wSave")?.addEventListener("click", () => {
    const days = Number(document.getElementById("wDays").value || 0);
    os.device = os.device || {};
    os.device.warranty = days;
    saveOS(os);
    alert("Garantia atualizada.");
  });
}
