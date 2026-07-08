(function () {
  function previewNode() {
    return document.getElementById("invoicePreview");
  }

  function currentTemplate() {
    const template = (typeof getSettings === "function" && getSettings().template) || "smc";
    return template === "shalini" ? "shalini" : "smc";
  }

  function applyTemplateClass(template) {
    const preview = previewNode();
    if (!preview) return;
    Array.from(preview.classList).forEach((className) => {
      if (className.indexOf("template-") === 0) preview.classList.remove(className);
    });
    preview.classList.add(`template-${template || "classic"}`);
  }

  function updateTemplateCards(template) {
    document.querySelectorAll(".template-card").forEach((button) => {
      button.classList.toggle("active", button.dataset.template === template);
    });
  }

  function statePlainName(code) {
    const list = [
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
    const found = list.find((item) => item[0] === String(code));
    return found ? found[1].toUpperCase() : "-";
  }

  function rowsFor(totals) {
    return (totals.itemRows || []).filter((item) => item.description || item.taxable || item.total);
  }

  window.renderShaliniTemplate = function renderShaliniTemplate(data, totals) {
    const serviceRows = rowsFor(totals);
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
  };

  window.renderSmcTemplate = function renderSmcTemplate(data, totals) {
    const serviceRows = rowsFor(totals);
    const state = statePlainName(data.placeOfSupply || data.buyerState);
    const stateCode = data.placeOfSupply || data.buyerState || "";
    const rate = serviceRows[0] ? serviceRows[0].gstRate : 18;
    const taxRows = totals.intraState
      ? `<tr><td colspan="2">Add: CGST @ ${formatNumber(rate / 2)}%</td><td>${money(totals.cgst)}</td></tr><tr><td colspan="2">Add: SGST @ ${formatNumber(rate / 2)}%</td><td>${money(totals.sgst)}</td></tr>`
      : `<tr><td colspan="2">Add: IGST @ ${formatNumber(rate)}%</td><td>${money(totals.igst)}</td></tr>`;
    return `
      <div class="invoice-page excel-template smc-template">
        <div class="letterhead-space" aria-hidden="true"></div>
        <h2>TAX INVOICE</h2>
        <div class="smc-info-grid">
          <strong>Client Name & Address</strong><span>State Name:-</span><span>${escapeHtml(state)}</span><span>Bill No:-</span><strong>${escapeHtml(data.invoiceNo || "-")}</strong>
          <strong>${escapeHtml(data.buyerName || "-")}</strong><span>State Code:-</span><span>${escapeHtml(stateCode)}</span><span>Date:-</span><strong>${formatDate(data.invoiceDate) || "-"}</strong>
          <span>${nl(data.buyerAddress || "-")}</span><span>GSTIN:-</span><span>${escapeHtml(data.buyerGstin || "Unregistered")}</span><span>PAN:-</span><span>AEBFS7086P</span>
          <span></span><span>RCM:-</span><span>${escapeHtml(data.reverseCharge || "No")}</span><span>GSTIN:-</span><span>21AEBFS7086P1ZI</span>
          <span></span><span></span><span></span><span>UDYAM:</span><span>UDYAM-OD-30-0005408</span>
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
          <strong>Sanjay Mittal, FCA</strong>
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
  };

  const baseRenderPreview = window.renderPreview;
  window.renderPreview = function renderPreviewWithExcelTemplates(data, totals) {
    const template = currentTemplate();
    applyTemplateClass(template);
    if (template === "shalini") {
      previewNode().innerHTML = window.renderShaliniTemplate(data, totals);
      return;
    }
    if (template === "smc") {
      previewNode().innerHTML = window.renderSmcTemplate(data, totals);
      return;
    }
    baseRenderPreview(data, totals);
    applyTemplateClass(template);
  };

  window.syncStandalonePreview = function syncStandalonePreviewWithTemplates() {
    const standalone = document.getElementById("standalonePreview");
    const preview = previewNode();
    if (!standalone || !preview) return;
    standalone.innerHTML = `<section class="${escapeHtml(preview.className)}">${preview.innerHTML}</section>`;
  };

  window.selectTemplate = function selectTemplateWithExcelSamples(template) {
    updateTemplateCards(template);
    const settings = getSettings();
    settings.template = template;
    fillDataFields("setting", settings);
    settings.template = template === "shalini" ? "shalini" : "smc";
    localStorage.setItem("gst-invoice-generator-settings-v1", JSON.stringify(settings));
    render();
    window.syncStandalonePreview();
  };

  updateTemplateCards(currentTemplate());
  render();
})();
