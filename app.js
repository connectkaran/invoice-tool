const storageKey = "gst-invoice-generator-draft-v1";
const sellerKey = "gst-invoice-generator-seller-v1";
const orgKey = "gst-invoice-generator-organisation-v1";
const customersKey = "gst-invoice-generator-customers-v1";
const itemsKey = "gst-invoice-generator-items-v1";
const invoicesKey = "gst-invoice-generator-invoices-v1";
const settingsKey = "gst-invoice-generator-settings-v1";

const states = [
  ["01", "Jammu and Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"],
  ["04", "Chandigarh"], ["05", "Uttarakhand"], ["06", "Haryana"],
  ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"],
  ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"],
  ["13", "Nagaland"], ["14", "Manipur"], ["15", "Mizoram"],
  ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"],
  ["19", "West Bengal"], ["20", "Jharkhand"], ["21", "Odisha"],
  ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"],
  ["25", "Daman and Diu"], ["26", "Dadra and Nagar Haveli and Daman and Diu"],
  ["27", "Maharashtra"], ["29", "Karnataka"], ["30", "Goa"],
  ["31", "Lakshadweep"], ["32", "Kerala"], ["33", "Tamil Nadu"],
  ["34", "Puducherry"], ["35", "Andaman and Nicobar Islands"],
  ["36", "Telangana"], ["37", "Andhra Pradesh"], ["38", "Ladakh"],
  ["96", "Foreign Country"]
];

const form = document.getElementById("invoiceForm");
const itemsBody = document.getElementById("itemsBody");
const preview = document.getElementById("invoicePreview");
const validationList = document.getElementById("validationList");
const saveState = document.getElementById("saveState");

const els = {
  placeOfSupply: document.getElementById("placeOfSupply"),
  sellerState: document.getElementById("sellerState"),
  buyerState: document.getElementById("buyerState"),
  grandTotalStat: document.getElementById("grandTotalStat"),
  taxableStat: document.getElementById("taxableStat"),
  gstStat: document.getElementById("gstStat"),
  taxModeStat: document.getElementById("taxModeStat"),
  addItemBtn: document.getElementById("addItemBtn"),
  clearItemsBtn: document.getElementById("clearItemsBtn"),
  loadSampleBtn: document.getElementById("loadSampleBtn"),
  resetBtn: document.getElementById("resetBtn"),
  printBtn: document.getElementById("printBtn"),
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  importJsonInput: document.getElementById("importJsonInput"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  copySummaryBtn: document.getElementById("copySummaryBtn"),
  copySellerBtn: document.getElementById("copySellerBtn"),
  saveInvoiceBtn: document.getElementById("saveInvoiceBtn"),
  orgState: document.getElementById("orgState"),
  customerState: document.getElementById("customerState"),
  loadOrgIntoInvoiceBtn: document.getElementById("loadOrgIntoInvoiceBtn"),
  addCustomerBtn: document.getElementById("addCustomerBtn"),
  useCustomerBtn: document.getElementById("useCustomerBtn"),
  customersBody: document.getElementById("customersBody"),
  addMasterItemBtn: document.getElementById("addMasterItemBtn"),
  insertMasterItemBtn: document.getElementById("insertMasterItemBtn"),
  masterItemsBody: document.getElementById("masterItemsBody"),
  standalonePreview: document.getElementById("standalonePreview"),
  invoiceRegisterBody: document.getElementById("invoiceRegisterBody"),
  registerFromDate: document.getElementById("registerFromDate"),
  registerToDate: document.getElementById("registerToDate"),
  registerSearch: document.getElementById("registerSearch"),
  downloadSalesRegisterBtn: document.getElementById("downloadSalesRegisterBtn"),
  downloadInvoiceRegisterBtn: document.getElementById("downloadInvoiceRegisterBtn"),
  reportCards: document.getElementById("reportCards"),
  taxReportBody: document.getElementById("taxReportBody"),
  hsnReportBody: document.getElementById("hsnReportBody"),
  downloadGstr1Btn: document.getElementById("downloadGstr1Btn"),
  downloadHsnBtn: document.getElementById("downloadHsnBtn"),
  downloadBackupBtn: document.getElementById("downloadBackupBtn"),
  restoreBackupInput: document.getElementById("restoreBackupInput"),
  downloadMastersBtn: document.getElementById("downloadMastersBtn"),
  downloadCurrentDraftBtn: document.getElementById("downloadCurrentDraftBtn")
};

const defaultSettings = {
  invoicePrefix: "GST",
  nextNumber: 1,
  financialYear: "2026-27",
  defaultGstRate: "18",
  template: "smc",
  autosave: "Yes"
};

const defaultData = {
  invoiceType: "Tax Invoice",
  invoiceNo: "GST-2026-001",
  invoiceDate: today(),
  dueDate: "",
  placeOfSupply: "27",
  reverseCharge: "No",
  sellerName: "",
  sellerGstin: "",
  sellerPan: "",
  sellerState: "27",
  sellerAddress: "",
  buyerName: "",
  buyerGstin: "",
  buyerPan: "",
  buyerState: "27",
  buyerAddress: "",
  unregisteredBuyer: false,
  bankName: "",
  bankAccount: "",
  ifsc: "",
  upi: "",
  shipping: 0,
  otherCharges: 0,
  roundOffMode: "auto",
  roundOffManual: 0,
  notes: "Thank you for your business.",
  terms: "Payment due as per agreed terms. Interest may apply on delayed payment.",
  items: [
    { description: "Professional services", hsn: "9983", qty: 1, rate: 10000, discount: 0, gstRate: 18, cess: 0 }
  ]
};

function init() {
  populateStates();
  loadMasters();
  bindEvents();
  const saved = loadJson(storageKey) || {};
  loadData(Object.assign({}, defaultData, saved));
  render();
}

function populateStates() {
  const html = states.map(([code, name]) => `<option value="${code}">${code} - ${name}</option>`).join("");
  [els.placeOfSupply, els.sellerState, els.buyerState, els.orgState, els.customerState].forEach((select) => {
    if (!select) return;
    select.innerHTML = html;
  });
}

function bindEvents() {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });
  form.addEventListener("input", queueRender);
  form.addEventListener("change", queueRender);
  document.querySelectorAll("[data-org], [data-setting]").forEach((field) => {
    field.addEventListener("input", saveMastersFromForms);
    field.addEventListener("change", saveMastersFromForms);
  });
  [els.registerFromDate, els.registerToDate, els.registerSearch].forEach((field) => {
    field.addEventListener("input", renderRegistersAndReports);
    field.addEventListener("change", renderRegistersAndReports);
  });
  els.addItemBtn.addEventListener("click", () => {
    addItemRow({ description: "", hsn: "", qty: 1, rate: 0, discount: 0, gstRate: 18, cess: 0 });
    render();
  });
  els.clearItemsBtn.addEventListener("click", () => {
    itemsBody.innerHTML = "";
    addItemRow({ description: "", hsn: "", qty: 1, rate: 0, discount: 0, gstRate: 18, cess: 0 });
    render();
  });
  els.loadSampleBtn.addEventListener("click", () => {
    loadData(sampleData());
    render();
  });
  els.resetBtn.addEventListener("click", () => {
    if (!confirm("Reset this invoice draft?")) return;
    localStorage.removeItem(storageKey);
    loadData(defaultData);
    render();
  });
  els.printBtn.addEventListener("click", () => window.print());
  els.exportJsonBtn.addEventListener("click", exportDraft);
  els.importJsonInput.addEventListener("change", importDraft);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.copySummaryBtn.addEventListener("click", copySummary);
  els.copySellerBtn.addEventListener("click", saveSeller);
  els.saveInvoiceBtn.addEventListener("click", saveInvoiceToRegister);
  els.loadOrgIntoInvoiceBtn.addEventListener("click", loadOrganisationIntoInvoice);
  els.addCustomerBtn.addEventListener("click", addCustomer);
  els.useCustomerBtn.addEventListener("click", useSelectedCustomer);
  els.addMasterItemBtn.addEventListener("click", addMasterItem);
  els.insertMasterItemBtn.addEventListener("click", insertSelectedMasterItem);
  els.downloadSalesRegisterBtn.addEventListener("click", downloadSalesRegister);
  els.downloadInvoiceRegisterBtn.addEventListener("click", downloadInvoiceRegister);
  els.downloadGstr1Btn.addEventListener("click", downloadGstr1Summary);
  els.downloadHsnBtn.addEventListener("click", downloadHsnSummary);
  els.downloadBackupBtn.addEventListener("click", downloadBackup);
  els.restoreBackupInput.addEventListener("change", restoreBackup);
  els.downloadMastersBtn.addEventListener("click", downloadMasters);
  els.downloadCurrentDraftBtn.addEventListener("click", exportDraft);
  document.querySelectorAll(".template-card").forEach((button) => {
    button.addEventListener("click", () => selectTemplate(button.dataset.template));
  });
}

let renderTimer = null;
function queueRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, 80);
}

function loadData(data) {
  const merged = Object.assign({}, defaultData, data || {});
  Object.keys(merged).forEach((key) => {
    const field = form.elements[key];
    if (!field || key === "items") return;
    if (field.type === "checkbox") field.checked = Boolean(merged[key]);
    else field.value = merged[key] === null || merged[key] === undefined ? "" : merged[key];
  });
  itemsBody.innerHTML = "";
  (merged.items && merged.items.length ? merged.items : defaultData.items).forEach(addItemRow);
}

function addItemRow(item) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input class="desc-input item-description" value="${attr(item.description)}" placeholder="Item or service"></td>
    <td><input class="item-hsn" value="${attr(item.hsn)}" placeholder="HSN/SAC"></td>
    <td><input class="item-qty" type="number" min="0" step="0.001" value="${num(item.qty, 1)}"></td>
    <td><input class="item-rate" type="number" min="0" step="0.01" value="${num(item.rate, 0)}"></td>
    <td><input class="item-discount" type="number" min="0" max="100" step="0.01" value="${num(item.discount, 0)}"></td>
    <td>
      <select class="item-gst">
        ${[0, 0.25, 3, 5, 12, 18, 28].map((rate) => `<option value="${rate}"${Number(item.gstRate) === rate ? " selected" : ""}>${rate}%</option>`).join("")}
      </select>
    </td>
    <td><input class="item-cess" type="number" min="0" step="0.01" value="${num(item.cess, 0)}"></td>
    <td class="amount-cell">Rs. 0.00</td>
    <td><button class="remove-item" type="button" title="Remove item">x</button></td>
  `;
  row.querySelector(".remove-item").addEventListener("click", () => {
    if (itemsBody.rows.length > 1) row.remove();
    else {
      row.querySelector(".item-description").value = "";
      row.querySelector(".item-hsn").value = "";
      row.querySelector(".item-qty").value = "1";
      row.querySelector(".item-rate").value = "0";
      row.querySelector(".item-discount").value = "0";
      row.querySelector(".item-gst").value = "18";
      row.querySelector(".item-cess").value = "0";
    }
    render();
  });
  itemsBody.appendChild(row);
}

function collectData() {
  const data = {};
  Array.from(form.elements).forEach((field) => {
    if (!field.name) return;
    data[field.name] = field.type === "checkbox" ? field.checked : field.value;
  });
  data.items = Array.from(itemsBody.rows).map((row) => ({
    description: row.querySelector(".item-description").value.trim(),
    hsn: row.querySelector(".item-hsn").value.trim(),
    qty: number(row.querySelector(".item-qty").value),
    rate: number(row.querySelector(".item-rate").value),
    discount: number(row.querySelector(".item-discount").value),
    gstRate: number(row.querySelector(".item-gst").value),
    cess: number(row.querySelector(".item-cess").value)
  }));
  data.shipping = number(data.shipping);
  data.otherCharges = number(data.otherCharges);
  data.roundOffManual = number(data.roundOffManual);
  return data;
}

function calculate(data) {
  const intraState = data.sellerState === data.placeOfSupply;
  const itemRows = data.items.map((item) => {
    const gross = item.qty * item.rate;
    const discountAmount = gross * clamp(item.discount, 0, 100) / 100;
    const taxable = Math.max(0, gross - discountAmount);
    const gst = taxable * item.gstRate / 100;
    const cess = number(item.cess);
    const total = taxable + gst + cess;
    return Object.assign({}, item, { gross, discountAmount, taxable, gst, cess, total });
  });
  const taxable = sum(itemRows, "taxable");
  const gst = sum(itemRows, "gst");
  const cess = sum(itemRows, "cess");
  const subtotal = taxable + gst + cess + data.shipping + data.otherCharges;
  let roundOff = 0;
  if (data.roundOffMode === "auto") roundOff = Math.round(subtotal) - subtotal;
  if (data.roundOffMode === "manual") roundOff = data.roundOffManual;
  const grandTotal = subtotal + roundOff;
  return {
    intraState,
    itemRows,
    taxable: round2(taxable),
    gst: round2(gst),
    cgst: intraState ? round2(gst / 2) : 0,
    sgst: intraState ? round2(gst / 2) : 0,
    igst: intraState ? 0 : round2(gst),
    cess: round2(cess),
    subtotal: round2(subtotal),
    roundOff: round2(roundOff),
    grandTotal: round2(grandTotal)
  };
}

function render() {
  const data = collectData();
  const totals = calculate(data);
  Array.from(itemsBody.rows).forEach((row, index) => {
    row.querySelector(".amount-cell").textContent = money(totals.itemRows[index] ? totals.itemRows[index].total : 0);
  });
  renderStats(totals);
  renderValidation(data, totals);
  renderPreview(data, totals);
  syncStandalonePreview();
  renderRegistersAndReports();
  if (getSettings().autosave !== "No") saveDraft(data);
}

function switchView(view) {
  document.querySelectorAll(".nav-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  document.querySelectorAll(".app-view").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}View`));
  if (view === "livePreview") syncStandalonePreview();
  if (view === "invoiceRegister" || view === "reports") renderRegistersAndReports();
}

function loadMasters() {
  fillDataFields("org", Object.assign({
    name: "", gstin: "", pan: "", state: "27", phone: "", email: "", address: "",
    bankName: "", bankAccount: "", ifsc: "", upi: "", notes: defaultData.notes, terms: defaultData.terms
  }, loadJson(orgKey) || {}));
  fillDataFields("setting", Object.assign({}, defaultSettings, loadJson(settingsKey) || {}));
  updateTemplateCards(getSettings().template);
  renderCustomers();
  renderMasterItems();
  renderRegistersAndReports();
}

function saveMastersFromForms() {
  localStorage.setItem(orgKey, JSON.stringify(readDataFields("org")));
  localStorage.setItem(settingsKey, JSON.stringify(readDataFields("setting")));
}

function readDataFields(type) {
  const data = {};
  document.querySelectorAll(`[data-${type}]`).forEach((field) => {
    data[field.dataset[toCamel(type)]] = field.value;
  });
  return data;
}

function fillDataFields(type, data) {
  document.querySelectorAll(`[data-${type}]`).forEach((field) => {
    const key = field.dataset[toCamel(type)];
    field.value = data[key] === undefined || data[key] === null ? "" : data[key];
  });
}

function toCamel(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function getSettings() {
  const settings = Object.assign({}, defaultSettings, readDataFields("setting"), loadJson(settingsKey) || {});
  settings.template = normalizeTemplate(settings.template);
  return settings;
}

function normalizeTemplate(template) {
  return template === "shalini" ? "shalini" : "smc";
}

function loadOrganisationIntoInvoice() {
  const org = readDataFields("org");
  setFormValue("sellerName", org.name);
  setFormValue("sellerGstin", org.gstin);
  setFormValue("sellerPan", org.pan);
  setFormValue("sellerState", org.state || "27");
  setFormValue("sellerAddress", org.address);
  setFormValue("bankName", org.bankName);
  setFormValue("bankAccount", org.bankAccount);
  setFormValue("ifsc", org.ifsc);
  setFormValue("upi", org.upi);
  if (org.notes) setFormValue("notes", org.notes);
  if (org.terms) setFormValue("terms", org.terms);
  render();
}

function addCustomer() {
  const formData = readDataFields("customer");
  if (!formData.name) {
    alert("Enter a customer name first.");
    return;
  }
  const customers = loadJson(customersKey) || [];
  const key = normalizeKey(formData.gstin || formData.name);
  const next = customers.filter((item) => normalizeKey(item.gstin || item.name) !== key);
  next.push(Object.assign({ id: Date.now() }, formData));
  localStorage.setItem(customersKey, JSON.stringify(next.sort((a, b) => a.name.localeCompare(b.name))));
  fillDataFields("customer", { state: formData.state || "27" });
  renderCustomers();
}

function renderCustomers() {
  const customers = loadJson(customersKey) || [];
  if (!els.customersBody) return;
  els.customersBody.innerHTML = customers.length ? customers.map((customer, index) => `
    <tr>
      <td><input name="selectedCustomer" type="radio" value="${index}"></td>
      <td>${escapeHtml(customer.name)}</td>
      <td>${escapeHtml(customer.gstin || "")}</td>
      <td>${escapeHtml(stateName(customer.state))}</td>
      <td>${escapeHtml(customer.phone || "")}</td>
      <td><button type="button" data-delete-customer="${index}">Delete</button></td>
    </tr>`).join("") : `<tr><td colspan="6" class="empty-row">No customers saved yet.</td></tr>`;
  els.customersBody.querySelectorAll("[data-delete-customer]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = (loadJson(customersKey) || []).filter((_, index) => index !== Number(button.dataset.deleteCustomer));
      localStorage.setItem(customersKey, JSON.stringify(next));
      renderCustomers();
    });
  });
}

function useSelectedCustomer() {
  const selected = document.querySelector("input[name='selectedCustomer']:checked");
  const customer = selected ? (loadJson(customersKey) || [])[Number(selected.value)] : readDataFields("customer");
  if (!customer || !customer.name) {
    alert("Select or enter a customer first.");
    return;
  }
  setFormValue("buyerName", customer.name);
  setFormValue("buyerGstin", customer.gstin);
  setFormValue("buyerPan", customer.pan);
  setFormValue("buyerState", customer.state || "27");
  setFormValue("buyerAddress", customer.address);
  render();
  switchView("createDocument");
}

function addMasterItem() {
  const item = readDataFields("master-item");
  if (!item.description) {
    alert("Enter an item or service description first.");
    return;
  }
  const items = loadJson(itemsKey) || [];
  const key = normalizeKey(item.description);
  const next = items.filter((row) => normalizeKey(row.description) !== key);
  next.push({
    id: Date.now(),
    description: item.description,
    hsn: item.hsn,
    qty: number(item.qty) || 1,
    rate: number(item.rate),
    discount: 0,
    gstRate: number(item.gstRate),
    cess: number(item.cess)
  });
  localStorage.setItem(itemsKey, JSON.stringify(next.sort((a, b) => a.description.localeCompare(b.description))));
  renderMasterItems();
}

function renderMasterItems() {
  const items = loadJson(itemsKey) || [];
  if (!els.masterItemsBody) return;
  els.masterItemsBody.innerHTML = items.length ? items.map((item, index) => `
    <tr>
      <td><input name="selectedMasterItem" type="radio" value="${index}"></td>
      <td>${escapeHtml(item.description)}</td>
      <td>${escapeHtml(item.hsn || "")}</td>
      <td>${money(item.rate)}</td>
      <td>${formatNumber(item.gstRate)}%</td>
      <td><button type="button" data-delete-master-item="${index}">Delete</button></td>
    </tr>`).join("") : `<tr><td colspan="6" class="empty-row">No items or services saved yet.</td></tr>`;
  els.masterItemsBody.querySelectorAll("[data-delete-master-item]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = (loadJson(itemsKey) || []).filter((_, index) => index !== Number(button.dataset.deleteMasterItem));
      localStorage.setItem(itemsKey, JSON.stringify(next));
      renderMasterItems();
    });
  });
}

function insertSelectedMasterItem() {
  const selected = document.querySelector("input[name='selectedMasterItem']:checked");
  const item = selected ? (loadJson(itemsKey) || [])[Number(selected.value)] : readDataFields("master-item");
  if (!item || !item.description) {
    alert("Select or enter an item first.");
    return;
  }
  addItemRow({
    description: item.description,
    hsn: item.hsn,
    qty: number(item.qty) || 1,
    rate: number(item.rate),
    discount: 0,
    gstRate: number(item.gstRate || getSettings().defaultGstRate),
    cess: number(item.cess)
  });
  render();
  switchView("createDocument");
}

function saveInvoiceToRegister() {
  const data = collectData();
  const totals = calculate(data);
  const issues = [];
  if (!data.invoiceNo) issues.push("invoice number");
  if (!data.sellerName) issues.push("seller");
  if (!data.buyerName) issues.push("buyer");
  if (!data.items.some((item) => item.description && item.qty > 0)) issues.push("item");
  if (issues.length) {
    alert("Complete the missing " + issues.join(", ") + " before saving.");
    return;
  }
  const invoices = loadJson(invoicesKey) || [];
  const record = {
    id: Date.now(),
    savedAt: new Date().toISOString(),
    data,
    totals,
    invoiceNo: data.invoiceNo,
    invoiceDate: data.invoiceDate,
    buyerName: data.buyerName,
    buyerGstin: data.unregisteredBuyer ? "" : data.buyerGstin,
    placeOfSupply: data.placeOfSupply,
    taxable: totals.taxable,
    cgst: totals.cgst,
    sgst: totals.sgst,
    igst: totals.igst,
    cess: totals.cess,
    grandTotal: totals.grandTotal
  };
  const next = invoices.filter((invoice) => invoice.invoiceNo !== data.invoiceNo);
  next.push(record);
  localStorage.setItem(invoicesKey, JSON.stringify(next.sort((a, b) => String(a.invoiceDate).localeCompare(String(b.invoiceDate)))));
  saveState.textContent = "Invoice saved to register";
  renderRegistersAndReports();
}

function renderRegistersAndReports() {
  renderInvoiceRegister();
  renderReports();
}

function filteredInvoices() {
  const invoices = loadJson(invoicesKey) || [];
  const from = els.registerFromDate ? els.registerFromDate.value : "";
  const to = els.registerToDate ? els.registerToDate.value : "";
  const search = normalizeKey(els.registerSearch ? els.registerSearch.value : "");
  return invoices.filter((invoice) => {
    if (from && invoice.invoiceDate < from) return false;
    if (to && invoice.invoiceDate > to) return false;
    if (search) {
      const haystack = normalizeKey([invoice.invoiceNo, invoice.buyerName, invoice.buyerGstin].join(" "));
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function renderInvoiceRegister() {
  if (!els.invoiceRegisterBody) return;
  const invoices = filteredInvoices();
  els.invoiceRegisterBody.innerHTML = invoices.length ? invoices.map((invoice) => `
    <tr>
      <td>${escapeHtml(invoice.invoiceNo)}</td>
      <td>${formatDate(invoice.invoiceDate)}</td>
      <td>${escapeHtml(invoice.buyerName)}</td>
      <td>${escapeHtml(invoice.buyerGstin || "Unregistered")}</td>
      <td>${money(invoice.taxable)}</td>
      <td>${money(invoice.cgst)}</td>
      <td>${money(invoice.sgst)}</td>
      <td>${money(invoice.igst)}</td>
      <td>${money(invoice.grandTotal)}</td>
      <td><button type="button" data-load-invoice="${escapeHtml(invoice.invoiceNo)}">Load</button></td>
    </tr>`).join("") : `<tr><td colspan="10" class="empty-row">No invoices saved yet. Use Save Invoice from Create Document.</td></tr>`;
  els.invoiceRegisterBody.querySelectorAll("[data-load-invoice]").forEach((button) => {
    button.addEventListener("click", () => {
      const invoice = (loadJson(invoicesKey) || []).find((item) => item.invoiceNo === button.dataset.loadInvoice);
      if (!invoice) return;
      loadData(invoice.data);
      render();
      switchView("createDocument");
    });
  });
}

function renderReports() {
  if (!els.reportCards) return;
  const invoices = filteredInvoices();
  const totals = invoices.reduce((acc, invoice) => {
    acc.count += 1;
    acc.taxable += number(invoice.taxable);
    acc.gst += number(invoice.cgst) + number(invoice.sgst) + number(invoice.igst) + number(invoice.cess);
    acc.total += number(invoice.grandTotal);
    return acc;
  }, { count: 0, taxable: 0, gst: 0, total: 0 });
  els.reportCards.innerHTML = [
    reportCard("Invoices", totals.count),
    reportCard("Taxable Sales", money(totals.taxable)),
    reportCard("GST Liability", money(totals.gst)),
    reportCard("Invoice Value", money(totals.total))
  ].join("");
  renderTaxReport(invoices);
  renderHsnReport(invoices);
}

function renderTaxReport(invoices) {
  const rows = taxReportRows(invoices);
  els.taxReportBody.innerHTML = rows.length ? rows.map((row) => `
    <tr><td>${row.rate}%</td><td>${money(row.taxable)}</td><td>${money(row.cgst)}</td><td>${money(row.sgst)}</td><td>${money(row.igst)}</td><td>${money(row.total)}</td></tr>
  `).join("") : `<tr><td colspan="6" class="empty-row">No tax data yet.</td></tr>`;
}

function renderHsnReport(invoices) {
  const rows = hsnReportRows(invoices);
  els.hsnReportBody.innerHTML = rows.length ? rows.map((row) => `
    <tr><td>${escapeHtml(row.hsn || "-")}</td><td>${escapeHtml(row.description)}</td><td>${money(row.taxable)}</td><td>${money(row.gst)}</td></tr>
  `).join("") : `<tr><td colspan="4" class="empty-row">No HSN data yet.</td></tr>`;
}

function taxReportRows(invoices) {
  const map = new Map();
  invoices.forEach((invoice) => {
    (invoice.totals.itemRows || []).forEach((item) => {
      const key = String(item.gstRate);
      const row = map.get(key) || { rate: item.gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
      const gst = number(item.gst);
      row.taxable += number(item.taxable);
      if (invoice.totals.intraState) {
        row.cgst += gst / 2;
        row.sgst += gst / 2;
      } else {
        row.igst += gst;
      }
      row.total += number(item.total);
      map.set(key, row);
    });
  });
  return Array.from(map.values()).sort((a, b) => a.rate - b.rate);
}

function hsnReportRows(invoices) {
  const map = new Map();
  invoices.forEach((invoice) => {
    (invoice.totals.itemRows || []).forEach((item) => {
      const key = `${item.hsn || "-"}|${item.description || "-"}`;
      const row = map.get(key) || { hsn: item.hsn, description: item.description || "-", taxable: 0, gst: 0 };
      row.taxable += number(item.taxable);
      row.gst += number(item.gst) + number(item.cess);
      map.set(key, row);
    });
  });
  return Array.from(map.values()).sort((a, b) => String(a.hsn).localeCompare(String(b.hsn)));
}

function reportCard(label, value) {
  return `<div class="report-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function downloadSalesRegister() {
  const rows = salesRegisterRows(filteredInvoices());
  download("sales-register.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv");
}

function downloadInvoiceRegister() {
  const rows = [
    ["Invoice No", "Date", "Customer", "GSTIN", "Place of Supply", "Taxable", "CGST", "SGST", "IGST", "Cess", "Total"]
  ];
  filteredInvoices().forEach((invoice) => rows.push([
    invoice.invoiceNo,
    invoice.invoiceDate,
    invoice.buyerName,
    invoice.buyerGstin || "Unregistered",
    stateName(invoice.placeOfSupply),
    invoice.taxable,
    invoice.cgst,
    invoice.sgst,
    invoice.igst,
    invoice.cess,
    invoice.grandTotal
  ]));
  download("invoice-register.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv");
}

function salesRegisterRows(invoices) {
  const rows = [
    ["Invoice Date", "Invoice No", "Customer", "GSTIN", "State", "Item", "HSN/SAC", "Qty", "Rate", "GST %", "Taxable", "CGST", "SGST", "IGST", "Cess", "Line Total", "Invoice Total"]
  ];
  invoices.forEach((invoice) => {
    (invoice.totals.itemRows || []).forEach((item) => {
      const gst = number(item.gst);
      rows.push([
        invoice.invoiceDate,
        invoice.invoiceNo,
        invoice.buyerName,
        invoice.buyerGstin || "Unregistered",
        stateName(invoice.placeOfSupply),
        item.description,
        item.hsn,
        item.qty,
        item.rate,
        item.gstRate,
        round2(item.taxable),
        invoice.totals.intraState ? round2(gst / 2) : 0,
        invoice.totals.intraState ? round2(gst / 2) : 0,
        invoice.totals.intraState ? 0 : round2(gst),
        round2(item.cess),
        round2(item.total),
        invoice.grandTotal
      ]);
    });
  });
  return rows;
}

function downloadGstr1Summary() {
  const rows = [["GST Rate", "Taxable", "CGST", "SGST", "IGST", "Total"]];
  taxReportRows(filteredInvoices()).forEach((row) => rows.push([row.rate, round2(row.taxable), round2(row.cgst), round2(row.sgst), round2(row.igst), round2(row.total)]));
  download("gstr-1-summary.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv");
}

function downloadHsnSummary() {
  const rows = [["HSN/SAC", "Description", "Taxable", "GST"]];
  hsnReportRows(filteredInvoices()).forEach((row) => rows.push([row.hsn, row.description, round2(row.taxable), round2(row.gst)]));
  download("hsn-summary.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv");
}

function downloadBackup() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    draft: collectData(),
    organisation: readDataFields("org"),
    settings: readDataFields("setting"),
    customers: loadJson(customersKey) || [],
    items: loadJson(itemsKey) || [],
    invoices: loadJson(invoicesKey) || []
  };
  download("gst-invoice-tool-backup.json", JSON.stringify(backup, null, 2), "application/json");
}

function restoreBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backup = JSON.parse(String(reader.result || "{}"));
      if (backup.organisation) localStorage.setItem(orgKey, JSON.stringify(backup.organisation));
      if (backup.settings) localStorage.setItem(settingsKey, JSON.stringify(backup.settings));
      if (backup.customers) localStorage.setItem(customersKey, JSON.stringify(backup.customers));
      if (backup.items) localStorage.setItem(itemsKey, JSON.stringify(backup.items));
      if (backup.invoices) localStorage.setItem(invoicesKey, JSON.stringify(backup.invoices));
      if (backup.draft) {
        localStorage.setItem(storageKey, JSON.stringify(backup.draft));
        loadData(backup.draft);
      }
      loadMasters();
      render();
      alert("Backup restored.");
    } catch (error) {
      alert("Could not restore backup: " + error.message);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function downloadMasters() {
  const masters = {
    organisation: readDataFields("org"),
    settings: readDataFields("setting"),
    customers: loadJson(customersKey) || [],
    items: loadJson(itemsKey) || []
  };
  download("gst-invoice-masters.json", JSON.stringify(masters, null, 2), "application/json");
}

function selectTemplate(template) {
  template = normalizeTemplate(template);
  updateTemplateCards(template);
  const settings = getSettings();
  settings.template = template;
  fillDataFields("setting", settings);
  localStorage.setItem(settingsKey, JSON.stringify(settings));
  applyTemplateClass(template);
  render();
  syncStandalonePreview();
}

function updateTemplateCards(template) {
  document.querySelectorAll(".template-card").forEach((button) => {
    button.classList.toggle("active", button.dataset.template === template);
  });
}

function applyTemplateClass(template) {
  template = normalizeTemplate(template);
  if (!preview) return;
  Array.from(preview.classList).forEach((className) => {
    if (className.indexOf("template-") === 0) preview.classList.remove(className);
  });
  preview.classList.add(`template-${template}`);
}

function syncStandalonePreview() {
  if (!els.standalonePreview || !preview) return;
  els.standalonePreview.innerHTML = `<section class="${escapeHtml(preview.className)}">${preview.innerHTML}</section>`;
}

function setFormValue(name, value) {
  const field = form.elements[name];
  if (!field) return;
  if (field.type === "checkbox") field.checked = Boolean(value);
  else field.value = value === undefined || value === null ? "" : value;
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function renderStats(totals) {
  els.grandTotalStat.textContent = money(totals.grandTotal);
  els.taxableStat.textContent = money(totals.taxable);
  els.gstStat.textContent = money(totals.gst + totals.cess);
  els.taxModeStat.textContent = totals.intraState ? "CGST + SGST" : "IGST";
}

function renderValidation(data, totals) {
  const issues = [];
  if (!data.sellerName) issues.push(["bad", "Seller business name is required."]);
  if (!validGstin(data.sellerGstin)) issues.push(["bad", "Seller GSTIN should be a valid 15-character GSTIN."]);
  if (data.sellerGstin && data.sellerGstin.slice(0, 2) !== data.sellerState) issues.push(["warn", "Seller GSTIN state code does not match seller state."]);
  if (!data.buyerName) issues.push(["bad", "Buyer name is required."]);
  if (!data.unregisteredBuyer && data.buyerGstin && !validGstin(data.buyerGstin)) issues.push(["bad", "Buyer GSTIN appears invalid."]);
  if (data.buyerGstin && data.buyerGstin.slice(0, 2) !== data.buyerState) issues.push(["warn", "Buyer GSTIN state code does not match buyer state."]);
  if (data.sellerPan && !validPan(data.sellerPan)) issues.push(["warn", "Seller PAN should be 10 characters in standard PAN format."]);
  if (data.buyerPan && !validPan(data.buyerPan)) issues.push(["warn", "Buyer PAN should be 10 characters in standard PAN format."]);
  if (!data.items.some((item) => item.description && item.qty > 0 && item.rate >= 0)) issues.push(["bad", "Add at least one invoice item with description, quantity, and rate."]);
  data.items.forEach((item, index) => {
    if (item.description && !item.hsn) issues.push(["warn", `Line ${index + 1}: HSN/SAC is blank.`]);
  });
  if (totals.grandTotal < 0) issues.push(["bad", "Invoice total cannot be negative."]);
  if (!issues.length) issues.push(["ok", "Invoice looks complete. GST split and totals are ready."]);
  validationList.innerHTML = issues.map(([level, text]) => `<div class="validation-item ${level === "ok" ? "" : level}">${escapeHtml(text)}</div>`).join("");
}

function renderPreview(data, totals) {
  const template = normalizeTemplate(getSettings().template);
  applyTemplateClass(template);
  if (template === "shalini") {
    preview.innerHTML = renderShaliniTemplate(data, totals);
    return;
  }
  preview.innerHTML = renderSmcTemplate(data, totals);
  return;
  const taxRows = taxSummary(totals.itemRows, totals.intraState);
  preview.innerHTML = `
    <div class="invoice-page">
      <div class="invoice-title-row">
        <div>
          <h2>${escapeHtml(data.invoiceType || "Tax Invoice")}</h2>
          <p>${escapeHtml(data.reverseCharge === "Yes" ? "Reverse charge applicable" : "Reverse charge not applicable")}</p>
        </div>
        <div class="invoice-meta">
          <p><strong>No:</strong> ${escapeHtml(data.invoiceNo || "-")}</p>
          <p><strong>Date:</strong> ${formatDate(data.invoiceDate)}</p>
          <p><strong>Due:</strong> ${formatDate(data.dueDate) || "-"}</p>
          <p><strong>Place of supply:</strong> ${escapeHtml(stateName(data.placeOfSupply))}</p>
        </div>
      </div>

      <div class="party-grid">
        ${partyBox("Supplier", data.sellerName, data.sellerAddress, data.sellerGstin, data.sellerPan, data.sellerState)}
        ${partyBox("Recipient", data.buyerName, data.buyerAddress, data.unregisteredBuyer ? "Unregistered" : data.buyerGstin, data.buyerPan, data.buyerState)}
      </div>

      <table class="preview-table">
        <thead>
          <tr>
            <th>#</th><th>Description</th><th>HSN/SAC</th><th class="num">Qty</th>
            <th class="num">Rate</th><th class="num">Taxable</th><th class="num">GST</th><th class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          ${totals.itemRows.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(item.description || "-")}</td>
              <td>${escapeHtml(item.hsn || "-")}</td>
              <td class="num">${formatNumber(item.qty)}</td>
              <td class="num">${money(item.rate)}</td>
              <td class="num">${money(item.taxable)}</td>
              <td class="num">${item.gstRate}%</td>
              <td class="num">${money(item.total)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <table class="tax-table">
        <thead>${totals.intraState
          ? "<tr><th>GST Rate</th><th class=\"num\">Taxable</th><th class=\"num\">CGST</th><th class=\"num\">SGST</th><th class=\"num\">Cess</th></tr>"
          : "<tr><th>GST Rate</th><th class=\"num\">Taxable</th><th class=\"num\">IGST</th><th class=\"num\">Cess</th></tr>"}
        </thead>
        <tbody>${taxRows}</tbody>
      </table>

      <div class="invoice-bottom">
        <div>
          <div class="note-box"><strong>Payment:</strong><br>${paymentHtml(data)}</div>
          <div class="note-box"><strong>Notes:</strong><br>${nl(data.notes || "-")}</div>
          <div class="note-box"><strong>Terms:</strong><br>${nl(data.terms || "-")}</div>
        </div>
        <div>
          <div class="total-box">
            ${totalRow("Taxable value", totals.taxable)}
            ${totalRow("CGST", totals.cgst)}
            ${totalRow("SGST", totals.sgst)}
            ${totalRow("IGST", totals.igst)}
            ${totalRow("Cess", totals.cess)}
            ${totalRow("Shipping", data.shipping)}
            ${totalRow("Other charges", data.otherCharges)}
            ${totalRow("Round off", totals.roundOff)}
            <div class="total-row grand"><span>Total</span><strong>${money(totals.grandTotal)}</strong></div>
          </div>
          <div class="amount-words">Amount in words: ${escapeHtml(amountInWords(Math.round(totals.grandTotal)))}</div>
        </div>
      </div>

      <div class="signature-row">
        <p class="placeholder">Computer generated invoice. Please verify statutory details before issue.</p>
        <div class="signature-box">Authorised Signatory<br>${escapeHtml(data.sellerName || "")}</div>
      </div>
    </div>
  `;
}

function renderShaliniTemplate(data, totals) {
  const serviceRows = totals.itemRows.filter((item) => item.description || item.taxable || item.total);
  const gross = totals.taxable + totals.cess;
  return `
    <div class="invoice-page excel-template shalini-template">
      <div class="letterhead-space" aria-hidden="true"></div>
      <div class="excel-two-col">
        <section>
          <h3>Client Name & Address</h3>
          <strong>${escapeHtml(data.buyerName || "-")}</strong>
          <p>${nl(data.buyerAddress || "-")}</p>
        </section>
        <section>
          <h3>Invoice Details</h3>
          <p><span>Invoice No:-</span><strong>${escapeHtml(data.invoiceNo || "-")}</strong></p>
          <p><span>Invoice Date:-</span><strong>${formatDate(data.invoiceDate) || "-"}</strong></p>
          <p><span>PAN:-</span><strong>AMGPA5806N</strong></p>
        </section>
      </div>

      <table class="excel-line-table">
        <thead><tr><th>Description of Service</th><th>Amount</th></tr></thead>
        <tbody>
          ${serviceRows.map((item) => `<tr><td><strong>${escapeHtml(item.description || "Professional services rendered")}</strong><br>${escapeHtml(item.hsn ? "HSN/SAC: " + item.hsn : "")}</td><td>${money(item.taxable + item.cess)}</td></tr>`).join("")}
          <tr class="excel-total"><td>GROSS TOTAL</td><td>${money(gross)}</td></tr>
        </tbody>
      </table>

      <div class="excel-value-grid">
        <strong>Total Invoice Value (in figures)</strong><span>${money(gross)}</span>
        <strong>Total Invoice Value (in words)</strong><span>${escapeHtml(amountInWords(Math.round(gross)))}</span>
      </div>

      <p class="excel-note">* Not registered under GST. No GST applicable on above services.</p>

      <div class="excel-signature">
        <strong>Shalini Mittal</strong>
        <span>Proprietor</span>
      </div>

      <div class="excel-bank-block">
        <h3>Bank Details:-</h3>
        <p>Shalini Mittal</p>
        <p>ICICI Bank Limited</p>
        <p>Rourkela Branch</p>
        <p>Savings Account</p>
        <p>A/c No.:- 150301505805</p>
        <p>IFSC Code:- ICIC0001503</p>
      </div>
    </div>
  `;
}

function renderSmcTemplate(data, totals) {
  const serviceRows = totals.itemRows.filter((item) => item.description || item.taxable || item.total);
  const state = statePlainName(data.placeOfSupply || data.buyerState);
  const stateCode = data.placeOfSupply || data.buyerState || "";
  const taxRows = totals.intraState
    ? `<tr><td colspan="2">Add: CGST @ ${formatNumber((serviceRows[0] ? serviceRows[0].gstRate : 18) / 2)}%</td><td>${money(totals.cgst)}</td></tr><tr><td colspan="2">Add: SGST @ ${formatNumber((serviceRows[0] ? serviceRows[0].gstRate : 18) / 2)}%</td><td>${money(totals.sgst)}</td></tr>`
    : `<tr><td colspan="2">Add: IGST @ ${formatNumber(serviceRows[0] ? serviceRows[0].gstRate : 18)}%</td><td>${money(totals.igst)}</td></tr>`;
  return `
    <div class="invoice-page excel-template smc-template">
      <div class="letterhead-space" aria-hidden="true"></div>
      <h2>TAX INVOICE</h2>
      <div class="smc-info-grid">
        <strong>Client Name & Address</strong><span>State Name:-</span><span>${escapeHtml(state)}</span><span>Bill No:-</span><strong>${escapeHtml(data.invoiceNo || "-")}</strong>
        <strong>${escapeHtml(data.buyerName || "-")}</strong><span>State Code:-</span><span>${escapeHtml(stateCode)}</span><span>Date:-</span><strong>${formatDate(data.invoiceDate) || "-"}</strong>
        <span>${nl(data.buyerAddress || "-")}</span><span>GSTIN:-</span><span>${escapeHtml(data.buyerGstin || "Unregistered")}</span><span>PAN:-</span><span>AEBFS7086P</span>
          <span></span><span>RCM:-</span><span>${escapeHtml(data.reverseCharge || "No")}</span><span>GSTIN:-</span><span>21AEBFS7086P1ZI</span>
        <span></span><span></span><span></span><span>UDYAM:</span><span>${escapeHtml(data.udyam || "UDYAM-OD-30-0005408")}</span>
      </div>

      <table class="excel-line-table smc-lines">
        <thead><tr><th>Service Description</th><th>SAC</th><th>Amount</th></tr></thead>
        <tbody>
          ${serviceRows.map((item) => `<tr><td><strong>${escapeHtml(item.description || "Professional services rendered in connection with")}</strong></td><td>${escapeHtml(item.hsn || "9982")}</td><td>${money(item.taxable + item.cess)}</td></tr>`).join("")}
          ${taxRows}
          <tr class="excel-total"><td colspan="2">GROSS TOTAL</td><td>${money(totals.grandTotal)}</td></tr>
        </tbody>
      </table>

      <div class="excel-value-grid">
        <strong>Total Invoice Value (in figures)</strong><span>${money(totals.grandTotal)}</span>
        <strong>Total Invoice Value (in words)</strong><span>${escapeHtml(amountInWords(Math.round(totals.grandTotal)))}</span>
      </div>

      <div class="excel-signature">
        <strong>For S. Mittal & Co.</strong>
        <span>Chartered Accountants,</span>
        <span class="signature-gap"></span>
        <strong>${escapeHtml(data.authorisedSignatory || "Sanjay Mittal, FCA")}</strong>
        <span>Partner.</span>
      </div>

      <div class="smc-bank-grid">
        <div>
          <h3>Bank Details:-</h3>
          <p>S. Mittal & Co.</p>
          <p>HDFC Bank Limited</p>
          <p>Rourkela Branch</p>
          <p>Current Account</p>
          <p>A/c No.:- 50200072199782</p>
          <p>IFSC Code:- HDFC0005380</p>
        </div>
        <div>
          <h3>Bank Details:-</h3>
          <p>S. Mittal & Co.</p>
          <p>Karur Vysya Bank</p>
          <p>Rourkela Branch</p>
          <p>Current Account</p>
          <p>A/c No.:- 3205135000004581</p>
          <p>IFSC Code:- KVBL0003205</p>
        </div>
      </div>
    </div>
  `;
}

function partyBox(title, name, address, gstin, pan, stateCode) {
  return `<div class="party-box">
    <h3>${title}</h3>
    <strong>${escapeHtml(name || "-")}</strong>
    <p>${nl(address || "-")}</p>
    <p><strong>GSTIN:</strong> ${escapeHtml(gstin || "-")}</p>
    <p><strong>PAN:</strong> ${escapeHtml(pan || "-")}</p>
    <p><strong>State:</strong> ${escapeHtml(stateName(stateCode))}</p>
  </div>`;
}

function taxSummary(items, intraState) {
  const map = new Map();
  items.forEach((item) => {
    const key = String(item.gstRate);
    const row = map.get(key) || { rate: item.gstRate, taxable: 0, gst: 0, cess: 0 };
    row.taxable += item.taxable;
    row.gst += item.gst;
    row.cess += item.cess;
    map.set(key, row);
  });
  return Array.from(map.values()).sort((a, b) => a.rate - b.rate).map((row) => {
    if (intraState) {
      return `<tr><td>${row.rate}%</td><td class="num">${money(row.taxable)}</td><td class="num">${money(row.gst / 2)}</td><td class="num">${money(row.gst / 2)}</td><td class="num">${money(row.cess)}</td></tr>`;
    }
    return `<tr><td>${row.rate}%</td><td class="num">${money(row.taxable)}</td><td class="num">${money(row.gst)}</td><td class="num">${money(row.cess)}</td></tr>`;
  }).join("");
}

function totalRow(label, value) {
  if (!value) return "";
  return `<div class="total-row"><span>${escapeHtml(label)}</span><strong>${money(value)}</strong></div>`;
}

function paymentHtml(data) {
  const lines = [
    data.bankName ? `Bank: ${escapeHtml(data.bankName)}` : "",
    data.bankAccount ? `Account: ${escapeHtml(data.bankAccount)}` : "",
    data.ifsc ? `IFSC: ${escapeHtml(data.ifsc)}` : "",
    data.upi ? `UPI: ${escapeHtml(data.upi)}` : ""
  ].filter(Boolean);
  return lines.length ? lines.join("<br>") : "-";
}

function saveDraft(data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
  saveState.textContent = "Autosaved " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function saveSeller() {
  const data = collectData();
  const seller = {
    sellerName: data.sellerName,
    sellerGstin: data.sellerGstin,
    sellerPan: data.sellerPan,
    sellerState: data.sellerState,
    sellerAddress: data.sellerAddress,
    bankName: data.bankName,
    bankAccount: data.bankAccount,
    ifsc: data.ifsc,
    upi: data.upi
  };
  localStorage.setItem(sellerKey, JSON.stringify(seller));
  saveState.textContent = "Seller saved";
}

function exportDraft() {
  download("gst-invoice-draft.json", JSON.stringify(collectData(), null, 2), "application/json");
}

function importDraft(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      loadData(JSON.parse(String(reader.result || "{}")));
      render();
    } catch (error) {
      alert("Could not import draft JSON: " + error.message);
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function exportCsv() {
  const data = collectData();
  const totals = calculate(data);
  const rows = [["Invoice No", data.invoiceNo], ["Invoice Date", data.invoiceDate], ["Seller", data.sellerName], ["Buyer", data.buyerName], []];
  rows.push(["Description", "HSN/SAC", "Qty", "Rate", "Discount %", "GST %", "Taxable", "GST", "Cess", "Total"]);
  totals.itemRows.forEach((item) => rows.push([item.description, item.hsn, item.qty, item.rate, item.discount, item.gstRate, item.taxable, item.gst, item.cess, item.total]));
  rows.push([]);
  rows.push(["Taxable", totals.taxable], ["CGST", totals.cgst], ["SGST", totals.sgst], ["IGST", totals.igst], ["Cess", totals.cess], ["Round Off", totals.roundOff], ["Grand Total", totals.grandTotal]);
  download("gst-invoice.csv", rows.map((row) => row.map(csvCell).join(",")).join("\n"), "text/csv");
}

function copySummary() {
  const data = collectData();
  const totals = calculate(data);
  const text = `${data.invoiceType} ${data.invoiceNo}\nSeller: ${data.sellerName}\nBuyer: ${data.buyerName}\nTaxable: ${money(totals.taxable)}\nGST: ${money(totals.gst + totals.cess)}\nTotal: ${money(totals.grandTotal)}`;
  navigator.clipboard.writeText(text).then(() => {
    saveState.textContent = "Summary copied";
  }).catch(() => {
    alert(text);
  });
}

function sampleData() {
  const seller = loadJson(sellerKey) || {};
  return Object.assign({}, defaultData, seller, {
    invoiceNo: "GST-2026-042",
    invoiceDate: today(),
    dueDate: "",
    placeOfSupply: "27",
    reverseCharge: "No",
    sellerName: seller.sellerName || "S. Mittal & Co.",
    sellerGstin: seller.sellerGstin || "21AEBFS7086P1ZI",
    sellerPan: seller.sellerPan || "AEBFS7086P",
    sellerState: seller.sellerState || "21",
    sellerAddress: seller.sellerAddress || "Rourkela, Odisha",
    buyerName: "Connect Karan Private Limited",
    buyerGstin: "27AAACC1234D1Z7",
    buyerPan: "AAACC1234D",
    buyerState: "27",
    buyerAddress: "Andheri East, Mumbai, Maharashtra",
    bankName: seller.bankName || "HDFC Bank Limited",
    bankAccount: seller.bankAccount || "50200072199782",
    ifsc: seller.ifsc || "HDFC0005380",
    upi: seller.upi || "",
    shipping: 0,
    otherCharges: 500,
    items: [
      { description: "GST compliance advisory", hsn: "9982", qty: 1, rate: 18000, discount: 0, gstRate: 18, cess: 0 },
      { description: "Accounting automation setup", hsn: "9983", qty: 2, rate: 7500, discount: 10, gstRate: 18, cess: 0 }
    ]
  });
}

function validGstin(value) {
  const text = String(value || "").toUpperCase().trim();
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(text);
}

function validPan(value) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(value || "").toUpperCase().trim());
}

function amountInWords(numValue) {
  if (!isFinite(numValue)) return titleCaseAmountWords("Rupees zero only");
  if (numValue === 0) return titleCaseAmountWords("Rupees zero only");
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  function belowHundred(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  function belowThousand(n) {
    return (n >= 100 ? ones[Math.floor(n / 100)] + " hundred " : "") + belowHundred(n % 100);
  }
  let n = Math.abs(Math.round(numValue));
  const parts = [];
  [["crore", 10000000], ["lakh", 100000], ["thousand", 1000]].forEach(([label, value]) => {
    if (n >= value) {
      parts.push(belowThousand(Math.floor(n / value)).trim() + " " + label);
      n %= value;
    }
  });
  if (n) parts.push(belowThousand(n).trim());
  return titleCaseAmountWords("Rupees " + parts.join(" ").replace(/\s+/g, " ") + " only");
}

function titleCaseAmountWords(value) {
  return String(value || "").replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function stateName(code) {
  const found = states.find((item) => item[0] === String(code));
  return found ? `${found[0]} - ${found[1]}` : "-";
}

function statePlainName(code) {
  const found = states.find((item) => item[0] === String(code));
  return found ? found[1].toUpperCase() : "-";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value + "T00:00:00");
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function num(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, number(value)));
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + number(row[key]), 0);
}

function round2(value) {
  return Math.round(number(value) * 100) / 100;
}

function money(value) {
  return "Rs. " + number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(value) {
  return number(value).toLocaleString("en-IN", { maximumFractionDigits: 3 });
}

function nl(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function attr(value) {
  return escapeHtml(String(value === null || value === undefined ? "" : value));
}

function escapeHtml(value) {
  return String(value === null || value === undefined ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function csvCell(value) {
  return `"${String(value === null || value === undefined ? "" : value).replace(/"/g, '""')}"`;
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

function loadJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (error) {
    return null;
  }
}

init();
