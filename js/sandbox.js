(function () {
  "use strict";

  var IMS = window.IMS;
  var store = IMS.store;
  var esc = IMS.esc;
  var money = IMS.money;

  var saleState = {
    cart: [],
    discount: 0,
    customerId: "",
    payment: "cash",
    dueDate: "",
    search: ""
  };

  function roleInfo() {
    return IMS.roleInfo(store.state.role);
  }

  function formValues(form) {
    var values = {};
    new FormData(form).forEach(function (value, key) {
      values[key] = value;
    });
    return values;
  }

  function showErrors(form, errors) {
    Array.prototype.forEach.call(form.querySelectorAll(".input, .select, textarea"), function (input) {
      input.classList.remove("invalid");
      input.removeAttribute("aria-invalid");
    });
    Array.prototype.forEach.call(form.querySelectorAll("[data-error]"), function (node) {
      node.textContent = "";
    });
    Object.keys(errors || {}).forEach(function (name) {
      var input = form.elements[name];
      var node = form.querySelector('[data-error="' + name + '"]');
      if (input) {
        input.classList.add("invalid");
        input.setAttribute("aria-invalid", "true");
      }
      if (node) node.textContent = errors[name];
    });
    var first = form.querySelector(".invalid");
    if (first) first.focus();
  }

  function pageHead(title, description, actions) {
    return (
      '<div class="page-head">' +
        '<div><h1>' + esc(title) + '</h1><p>' + esc(description) + '</p></div>' +
        (actions ? '<div class="page-actions">' + actions + '</div>' : "") +
      '</div>'
    );
  }

  function emptyState(title, text, actionHtml) {
    return (
      '<div class="empty">' +
        IMS.icon("box") +
        '<h3>' + esc(title) + '</h3>' +
        '<p>' + esc(text) + '</p>' +
        (actionHtml || "") +
      '</div>'
    );
  }

  function missionPanel(moduleId) {
    var module = IMS.moduleById(moduleId);
    if (!module || !module.missions || !module.missions.length) return "";
    var done = 0;
    var items = module.missions.map(function (mission) {
      var complete = store.missionDone(module.id, mission);
      if (complete) done += 1;
      return (
        '<li class="mission ' + (complete ? "complete" : "") + '">' +
          '<span class="check-dot">' + IMS.icon("check") + '</span>' +
          '<span>' + esc(mission.text) + '</span>' +
        '</li>'
      );
    }).join("");
    var percent = Math.round((done / module.missions.length) * 100);
    return (
      '<div class="missions">' +
        '<div class="missions-head">' +
          '<h3>' + esc(module.title) + ' practice missions</h3>' +
          '<span class="pill ' + (done === module.missions.length ? "pill-green" : "pill-blue") + '">' + done + ' / ' + module.missions.length + '</span>' +
        '</div>' +
        '<div class="mission-progress"><span style="width:' + percent + '%"></span></div>' +
        '<ul class="mission-list">' + items + '</ul>' +
        (done === module.missions.length
          ? '<div class="callout green" style="margin-top:14px">' + IMS.icon("check") + '<span>All practice missions complete. Finish the quiz to complete this module.</span></div>'
          : "") +
      '</div>'
    );
  }

  function statusPill(status) {
    var cls = status.key === "overdue" ? "pill-red" : status.key === "due-soon" ? "pill-amber" : status.key === "settled" ? "pill-gray" : "pill-green";
    return '<span class="pill ' + cls + '">' + esc(status.label) + '</span>';
  }

  function paymentPill(method) {
    return method === "credit"
      ? '<span class="pill pill-amber">Credit</span>'
      : '<span class="pill pill-green">Cash</span>';
  }

  function renderDashboard() {
    var stats = store.stats();
    var recent = store.state.sales.slice().sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    }).slice(0, 6);
    var recentRows = recent.map(function (sale) {
      return (
        '<tr data-search="' + esc(sale.receiptNo + " " + (sale.customerName || "walk-in")) + '">' +
          '<td data-label="Receipt"><span class="table-name">' + esc(sale.receiptNo) + '</span></td>' +
          '<td data-label="Date">' + esc(IMS.formatDateTime(sale.createdAt)) + '</td>' +
          '<td data-label="Customer">' + esc(sale.customerName || "Walk-in") + '</td>' +
          '<td data-label="Payment">' + paymentPill(sale.paymentMethod) + '</td>' +
          '<td data-label="Total" class="text-right"><strong>' + money(sale.total) + '</strong></td>' +
          '<td data-label="Actions"><div class="row-actions"><button class="btn-icon" data-action="receipt-view" data-id="' + esc(sale.id) + '" title="View receipt" aria-label="View receipt ' + esc(sale.receiptNo) + '">' + IMS.icon("eye", "icon-sm") + '</button></div></td>' +
        '</tr>'
      );
    }).join("");

    return (
      pageHead("Practice dashboard", "You are practising as " + roleInfo().label + ". Changes here are saved on this device.") +
      '<div class="stat-grid">' +
        '<div class="card stat-card"><div class="stat-icon">' + IMS.icon("box") + '</div><div><div class="stat-value">' + stats.products + '</div><div class="stat-label">Products</div></div></div>' +
        '<div class="card stat-card"><div class="stat-icon gray">' + IMS.icon("grid") + '</div><div><div class="stat-value">' + stats.units + '</div><div class="stat-label">Units in stock</div></div></div>' +
        '<div class="card stat-card"><div class="stat-icon green">' + IMS.icon("cart") + '</div><div><div class="stat-value">' + money(stats.salesToday) + '</div><div class="stat-label">Sales today</div></div></div>' +
        '<div class="card stat-card"><div class="stat-icon amber">' + IMS.icon("wallet") + '</div><div><div class="stat-value">' + money(stats.outstanding) + '</div><div class="stat-label">Outstanding credit</div></div></div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-pad" style="padding-bottom:0">' +
          '<div class="section-head"><div><h2>Recent sales</h2><p>Latest receipts from this training shop.</p></div>' +
            '<a class="btn btn-secondary btn-sm" href="#/practice/receipts">All receipts</a>' +
          '</div>' +
        '</div>' +
        (recent.length
          ? '<div class="table-wrap"><table><thead><tr><th>Receipt</th><th>Date</th><th>Customer</th><th>Payment</th><th class="text-right">Total</th><th></th></tr></thead><tbody>' + recentRows + '</tbody></table></div>'
          : emptyState("No sales yet", "Complete a sale to see it here.", '<a class="btn btn-primary" href="#/practice/sales">Go to sales</a>')) +
      '</div>' +
      '<div class="callout" style="margin-top:18px">' + IMS.icon("info") + '<span>This is a training copy. Nothing here touches your live shop.</span></div>'
    );
  }

  function renderProducts() {
    var rows = store.state.products.map(function (product) {
      return (
        '<tr data-search="' + esc((product.name + " " + product.sku + " " + product.category + " " + product.unit).toLowerCase()) + '">' +
          '<td data-label="Product"><div class="table-name">' + esc(product.name) + '</div><div class="table-sub">' + esc(product.sku) + ' &middot; ' + esc(product.category) + '</div></td>' +
          '<td data-label="Unit">' + esc(product.unit) + '</td>' +
          '<td data-label="Price">' + money(product.price) + '</td>' +
          '<td data-label="Stock"><span class="pill ' + (product.stock > 0 ? "pill-green" : "pill-red") + '">' + product.stock + ' in stock</span></td>' +
          '<td data-label="Actions"><div class="row-actions">' +
            '<button class="btn-icon" data-action="stock-add" data-id="' + esc(product.id) + '" title="Add stock" aria-label="Add stock to ' + esc(product.name) + '">' + IMS.icon("plus", "icon-sm") + '</button>' +
            '<button class="btn-icon" data-action="product-edit" data-id="' + esc(product.id) + '" title="Edit product" aria-label="Edit ' + esc(product.name) + '">' + IMS.icon("edit", "icon-sm") + '</button>' +
            '<button class="btn-icon danger" data-action="product-delete" data-id="' + esc(product.id) + '" title="Delete product" aria-label="Delete ' + esc(product.name) + '">' + IMS.icon("trash", "icon-sm") + '</button>' +
          '</div></td>' +
        '</tr>'
      );
    }).join("");

    return (
      pageHead("Products", "Add, edit, restock, and remove products from the catalogue.", '<button class="btn btn-primary" data-action="product-add">' + IMS.icon("plus") + 'Add product</button>') +
      missionPanel("products") +
      (store.state.products.length
        ? '<div class="card">' +
            '<div class="card-pad" style="padding-bottom:14px">' +
              '<div class="search-bar">' +
                '<div class="input-wrap">' + IMS.icon("search") + '<input class="input" type="search" placeholder="Search by name or SKU" data-filter="#products-table tbody tr" aria-label="Search products"></div>' +
              '</div>' +
            '</div>' +
            '<div class="table-wrap"><table id="products-table"><thead><tr><th>Product</th><th>Unit</th><th>Price</th><th>Stock</th><th class="text-right">Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '</div>'
        : '<div class="card">' + emptyState("No products yet", "Add your first product to start selling.", '<button class="btn btn-primary" data-action="product-add">Add product</button>') + '</div>')
    );
  }

  function renderCustomers() {
    var rows = store.state.customers.map(function (customer) {
      var balance = store.customerBalance(customer.id);
      var status = store.customerStatus(customer.id);
      return (
        '<tr data-search="' + esc((customer.name + " " + customer.phone).toLowerCase()) + '">' +
          '<td data-label="Customer"><div class="table-name">' + esc(customer.name) + '</div><div class="table-sub">' + esc(customer.address || "No address") + '</div></td>' +
          '<td data-label="Phone">' + esc(customer.phone) + '</td>' +
          '<td data-label="Balance"><span class="balance ' + (balance > 0 ? "due" : "") + '">' + money(balance) + '</span> ' + (balance > 0 ? statusPill(status) : "") + '</td>' +
          '<td data-label="Actions"><div class="row-actions">' +
            '<button class="btn-icon" data-action="customer-detail" data-id="' + esc(customer.id) + '" title="View customer" aria-label="View ' + esc(customer.name) + '">' + IMS.icon("eye", "icon-sm") + '</button>' +
            '<button class="btn-icon" data-action="customer-edit" data-id="' + esc(customer.id) + '" title="Edit customer" aria-label="Edit ' + esc(customer.name) + '">' + IMS.icon("edit", "icon-sm") + '</button>' +
            '<button class="btn-icon danger" data-action="customer-delete" data-id="' + esc(customer.id) + '" title="Delete customer" aria-label="Delete ' + esc(customer.name) + '">' + IMS.icon("trash", "icon-sm") + '</button>' +
          '</div></td>' +
        '</tr>'
      );
    }).join("");

    return (
      pageHead("Customers", "Keep contact details and balances accurate.", '<button class="btn btn-primary" data-action="customer-add">' + IMS.icon("plus") + 'Add customer</button>') +
      missionPanel("customers") +
      (store.state.customers.length
        ? '<div class="card">' +
            '<div class="card-pad" style="padding-bottom:14px">' +
              '<div class="search-bar">' +
                '<div class="input-wrap">' + IMS.icon("search") + '<input class="input" type="search" placeholder="Search by name or phone" data-filter="#customers-table tbody tr" aria-label="Search customers"></div>' +
              '</div>' +
            '</div>' +
            '<div class="table-wrap"><table id="customers-table"><thead><tr><th>Customer</th><th>Phone</th><th>Balance</th><th class="text-right">Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '</div>'
        : '<div class="card">' + emptyState("No customers yet", "Add a customer before recording credit.", '<button class="btn btn-primary" data-action="customer-add">Add customer</button>') + '</div>')
    );
  }

  function cartLines() {
    return saleState.cart.map(function (line) {
      var product = store.productById(line.productId);
      if (!product) return null;
      return { product: product, qty: line.qty, lineTotal: product.price * line.qty };
    }).filter(Boolean);
  }

  function cartTotals() {
    var subtotal = cartLines().reduce(function (sum, line) { return sum + line.lineTotal; }, 0);
    var discount = Math.min(Math.max(0, Math.round(Number(saleState.discount) || 0)), subtotal);
    return { subtotal: subtotal, discount: discount, total: subtotal - discount };
  }

  function ensureDueDate() {
    if (!saleState.dueDate) saleState.dueDate = IMS.addDays(new Date(), IMS.config.defaultCreditDays);
  }

  function renderSales() {
    ensureDueDate();
    var totals = cartTotals();
    var lines = cartLines();
    var products = store.state.products;
    var customerOptions = ['<option value="">Walk-in customer</option>'].concat(store.state.customers.map(function (customer) {
      return '<option value="' + esc(customer.id) + '"' + (saleState.customerId === customer.id ? " selected" : "") + '>' + esc(customer.name) + '</option>';
    })).join("");

    var productRows = products.map(function (product) {
      var disabled = product.stock <= 0;
      return (
        '<button class="product-row" data-action="cart-add" data-id="' + esc(product.id) + '" data-search="' + esc((product.name + " " + product.sku + " " + product.category).toLowerCase()) + '"' + (disabled ? " disabled" : "") + '>' +
          '<span class="pr-main"><strong>' + esc(product.name) + '</strong><span class="pr-meta">' + esc(product.sku) + ' &middot; ' + esc(product.category) + ' &middot; ' + esc(product.unit) + '</span></span>' +
          '<span class="pr-price">' + money(product.price) + '</span>' +
          '<span class="pr-stock"><span class="pill ' + (product.stock > 0 ? "pill-green" : "pill-red") + '">' + product.stock + ' left</span></span>' +
          '<span class="pr-add">' + IMS.icon("plus", "icon-sm") + '</span>' +
        '</button>'
      );
    }).join("");

    var cartHtml = lines.length
      ? lines.map(function (line) {
          return (
            '<div class="cart-line">' +
              '<div class="cl-name">' + esc(line.product.name) + '<div class="cl-sub">' + money(line.product.price) + ' each</div></div>' +
              '<div class="qty-control">' +
                '<button type="button" data-action="cart-dec" data-id="' + esc(line.product.id) + '" aria-label="Reduce quantity">&minus;</button>' +
                '<span>' + line.qty + '</span>' +
                '<button type="button" data-action="cart-inc" data-id="' + esc(line.product.id) + '" aria-label="Increase quantity">+</button>' +
              '</div>' +
              '<button class="btn-icon danger" data-action="cart-remove" data-id="' + esc(line.product.id) + '" title="Remove" aria-label="Remove ' + esc(line.product.name) + '">' + IMS.icon("close", "icon-sm") + '</button>' +
            '</div>'
          );
        }).join("")
      : '<div class="cart-empty">' + IMS.icon("cart") + '<p style="margin-top:6px">Cart is empty. Select a product to begin.</p></div>';

    return (
      pageHead("Sales", "Build a cart, choose cash or credit, then complete the sale.") +
      missionPanel("sales") +
      '<div class="sales-layout">' +
        '<div class="card card-pad">' +
          '<div class="search-bar" style="margin-bottom:14px">' +
            '<div class="input-wrap">' + IMS.icon("search") + '<input class="input" type="search" placeholder="Search products" data-filter="#sales-products .product-row" aria-label="Search products"></div>' +
          '</div>' +
          (products.length
            ? '<div class="product-list" id="sales-products">' +
                '<div class="product-list-head" aria-hidden="true"><span>Product</span><span>Price</span><span>Stock</span><span></span></div>' +
                productRows +
              '</div>'
            : emptyState("No products", "Add products before making a sale.", '<a class="btn btn-primary" href="#/practice/products">Add products</a>')) +
        '</div>' +
        '<div class="card card-pad cart-panel">' +
          '<div class="row-between" style="margin-bottom:14px"><h2 style="font-size:16px">Cart</h2><span class="pill pill-gray">' + lines.length + ' item' + (lines.length === 1 ? "" : "s") + '</span></div>' +
          '<div class="cart-lines">' + cartHtml + '</div>' +
          '<div class="cart-fields">' +
            '<div class="field"><label for="sale-customer">Customer</label><select class="select" id="sale-customer" data-change="sale-customer">' + customerOptions + '</select><div class="help">Required for credit sales.</div></div>' +
            '<div class="payment-options">' +
              '<label class="radio-card ' + (saleState.payment === "cash" ? "checked" : "") + '"><input type="radio" name="sale-payment" value="cash" data-change="sale-payment"' + (saleState.payment === "cash" ? " checked" : "") + '>Cash</label>' +
              '<label class="radio-card ' + (saleState.payment === "credit" ? "checked" : "") + '"><input type="radio" name="sale-payment" value="credit" data-change="sale-payment"' + (saleState.payment === "credit" ? " checked" : "") + '>Credit</label>' +
            '</div>' +
            (saleState.payment === "credit"
              ? '<div class="field"><label for="sale-due">Credit due date</label><input class="input" type="date" id="sale-due" value="' + esc(saleState.dueDate) + '" data-change="sale-due"></div>'
              : "") +
            '<div class="field"><label for="sale-discount">Discount (\u20a6)</label><input class="input" type="number" id="sale-discount" min="0" step="1" value="' + saleState.discount + '" data-change="sale-discount"></div>' +
          '</div>' +
          '<div class="summary-row"><span>Subtotal</span><span>' + money(totals.subtotal) + '</span></div>' +
          '<div class="summary-row"><span>Discount</span><span>-' + money(totals.discount) + '</span></div>' +
          '<div class="summary-row total"><span>Total</span><span class="summary-total">' + money(totals.total) + '</span></div>' +
          '<button class="btn btn-primary btn-block" data-action="checkout"' + (lines.length ? "" : " disabled") + ' style="margin-top:14px">' + IMS.icon("check") + 'Complete sale</button>' +
          '<p class="help" style="margin-top:10px">Stock updates automatically when the sale completes.</p>' +
        '</div>' +
      '</div>'
    );
  }

  function renderCredit() {
    var rows = store.receivables();
    var total = rows.reduce(function (sum, row) { return sum + row.balance; }, 0);
    var tableRows = rows.map(function (row) {
      return (
        '<tr data-search="' + esc((row.customer.name + " " + row.customer.phone).toLowerCase()) + '">' +
          '<td data-label="Customer"><div class="table-name">' + esc(row.customer.name) + '</div><div class="table-sub">' + esc(row.customer.phone) + '</div></td>' +
          '<td data-label="Due date">' + (row.dueDate ? esc(IMS.formatDate(row.dueDate)) : "\u2014") + '</td>' +
          '<td data-label="Status">' + statusPill(row.status) + '</td>' +
          '<td data-label="Balance" class="text-right"><span class="balance due">' + money(row.balance) + '</span></td>' +
          '<td data-label="Actions"><div class="row-actions">' +
            '<button class="btn btn-secondary btn-sm" data-action="customer-detail" data-id="' + esc(row.customer.id) + '">View</button>' +
            '<button class="btn btn-primary btn-sm" data-action="credit-pay" data-id="' + esc(row.customer.id) + '">Record payment</button>' +
          '</div></td>' +
        '</tr>'
      );
    }).join("");

    return (
      pageHead("Credit Book", "Track what customers owe, when it is due, and payments received.") +
      missionPanel("credit") +
      '<div class="card card-pad" style="margin-bottom:16px"><div class="row-between">' +
        '<div><div class="small muted">Total outstanding</div><div class="stat-value" style="color:#b45309">' + money(total) + '</div></div>' +
        '<div class="pill ' + (rows.some(function (row) { return row.status.key === "overdue"; }) ? "pill-red" : "pill-green") + '">' + rows.length + ' account' + (rows.length === 1 ? "" : "s") + ' with a balance</div>' +
      '</div></div>' +
      (rows.length
        ? '<div class="card"><div class="table-wrap"><table><thead><tr><th>Customer</th><th>Due date</th><th>Status</th><th class="text-right">Balance</th><th class="text-right">Actions</th></tr></thead><tbody>' + tableRows + '</tbody></table></div></div>'
        : '<div class="card">' + emptyState("No outstanding credit", "When you record a credit sale, the customer appears here.", '<a class="btn btn-primary" href="#/practice/sales">Go to sales</a>') + '</div>')
    );
  }

  function renderReceipts() {
    var sales = store.state.sales.slice().sort(function (a, b) {
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
    var rows = sales.map(function (sale) {
      return (
        '<tr data-search="' + esc((sale.receiptNo + " " + (sale.customerName || "walk-in") + " " + sale.cashier).toLowerCase()) + '">' +
          '<td data-label="Receipt"><div class="table-name">' + esc(sale.receiptNo) + '</div><div class="table-sub">' + esc(IMS.formatDateTime(sale.createdAt)) + '</div></td>' +
          '<td data-label="Customer">' + esc(sale.customerName || "Walk-in") + '</td>' +
          '<td data-label="Cashier">' + esc(sale.cashier) + '</td>' +
          '<td data-label="Payment">' + paymentPill(sale.paymentMethod) + '</td>' +
          '<td data-label="Total" class="text-right"><strong>' + money(sale.total) + '</strong></td>' +
          '<td data-label="Actions"><div class="row-actions">' +
            '<button class="btn-icon" data-action="receipt-view" data-id="' + esc(sale.id) + '" title="View receipt" aria-label="View receipt ' + esc(sale.receiptNo) + '">' + IMS.icon("eye", "icon-sm") + '</button>' +
            '<button class="btn-icon" data-action="receipt-print" data-id="' + esc(sale.id) + '" title="Print or save PDF" aria-label="Print receipt ' + esc(sale.receiptNo) + '">' + IMS.icon("printer", "icon-sm") + '</button>' +
            '<button class="btn-icon" data-action="receipt-download" data-id="' + esc(sale.id) + '" title="Download PNG" aria-label="Download receipt ' + esc(sale.receiptNo) + ' as PNG">' + IMS.icon("download", "icon-sm") + '</button>' +
          '</div></td>' +
        '</tr>'
      );
    }).join("");

    return (
      pageHead("Receipts", "View, print, save as PDF, or download any receipt.") +
      missionPanel("receipts") +
      (sales.length
        ? '<div class="card">' +
            '<div class="card-pad" style="padding-bottom:14px"><div class="search-bar"><div class="input-wrap">' + IMS.icon("search") + '<input class="input" type="search" placeholder="Search receipt, customer, or cashier" data-filter="#receipts-table tbody tr" aria-label="Search receipts"></div></div></div>' +
            '<div class="table-wrap"><table id="receipts-table"><thead><tr><th>Receipt</th><th>Customer</th><th>Cashier</th><th>Payment</th><th class="text-right">Total</th><th class="text-right">Actions</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
          '</div>'
        : '<div class="card">' + emptyState("No receipts yet", "Complete a sale to create your first receipt.", '<a class="btn btn-primary" href="#/practice/sales">Go to sales</a>') + '</div>')
    );
  }

  function render(tab) {
    switch (tab) {
      case "products": return renderProducts();
      case "customers": return renderCustomers();
      case "sales": return renderSales();
      case "credit": return renderCredit();
      case "receipts": return renderReceipts();
      default: return renderDashboard();
    }
  }
  function openProductForm(id) {
    var product = id ? store.productById(id) : null;
    var title = product ? "Edit product" : "Add product";
    var subtitle = product ? "Update the details or stock for this product." : "Create one record for one sellable item.";
    var categoryOptions = IMS.config.categories.map(function (category) {
      return '<option value="' + esc(category) + '"></option>';
    }).join("");
    var body =
      '<form id="product-form" novalidate>' +
        '<div class="form-grid">' +
          '<div class="field full"><label for="pf-name">Product name</label><input class="input" id="pf-name" name="name" maxlength="80" value="' + esc(product ? product.name : "") + '" autocomplete="off"><div class="field-error" data-error="name"></div></div>' +
          '<div class="field"><label for="pf-sku">SKU / barcode</label><input class="input" id="pf-sku" name="sku" maxlength="40" value="' + esc(product ? product.sku : "") + '" autocomplete="off"><div class="field-error" data-error="sku"></div></div>' +
          '<div class="field"><label for="pf-category">Category</label><input class="input" id="pf-category" name="category" list="category-list" value="' + esc(product ? product.category : "") + '" autocomplete="off"><datalist id="category-list">' + categoryOptions + '</datalist><div class="field-error" data-error="category"></div></div>' +
          '<div class="field"><label for="pf-unit">Unit</label><input class="input" id="pf-unit" name="unit" value="' + esc(product ? product.unit : "pcs") + '" autocomplete="off"><div class="field-error" data-error="unit"></div></div>' +
          '<div class="field"><label for="pf-price">Selling price (\u20a6)</label><input class="input" id="pf-price" name="price" type="number" min="0" step="1" value="' + esc(product ? product.price : "") + '"><div class="field-error" data-error="price"></div></div>' +
          '<div class="field full"><label for="pf-stock">Stock quantity</label><input class="input" id="pf-stock" name="stock" type="number" min="0" step="1" value="' + esc(product ? product.stock : 0) + '"><div class="field-error" data-error="stock"></div><div class="help">' + (product ? "Editing this corrects the current stock count." : "Opening stock. You can add more later.") + '</div></div>' +
        '</div>' +
      '</form>';
    var footer =
      '<button class="btn btn-secondary" data-action="modal-close">Cancel</button>' +
      '<button class="btn btn-primary" type="submit" form="product-form">' + (product ? "Save changes" : "Add product") + '</button>';

    var modal = IMS.ui.openModal({ title: title, subtitle: subtitle, body: body, footer: footer });
    var form = modal.querySelector("#product-form");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var values = formValues(form);
      var result = product ? store.updateProduct(product.id, values) : store.addProduct(values);
      if (!result.ok) {
        showErrors(form, result.errors);
        return;
      }
      IMS.ui.closeModal();
      IMS.ui.toast(product ? "Product updated." : "Product added.");
      refresh();
    });
    form.elements.name.focus();
  }

  function openStockForm(id) {
    var product = store.productById(id);
    if (!product) return;
    var body =
      '<form id="stock-form" novalidate>' +
        '<div class="callout" style="margin-bottom:16px">' + IMS.icon("box") + '<span><strong>' + esc(product.name) + '</strong><br>Current stock: ' + product.stock + ' ' + esc(product.unit) + '</span></div>' +
        '<div class="field"><label for="sf-qty">Units to add</label><input class="input" id="sf-qty" name="qty" type="number" min="1" step="1" value="1" autofocus><div class="field-error" data-error="qty"></div></div>' +
      '</form>';
    var footer =
      '<button class="btn btn-secondary" data-action="modal-close">Cancel</button>' +
      '<button class="btn btn-primary" type="submit" form="stock-form">Add stock</button>';
    var modal = IMS.ui.openModal({ title: "Add stock", subtitle: "Increase the quantity on hand.", body: body, footer: footer, size: "slim" });
    var form = modal.querySelector("#stock-form");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var result = store.addStock(product.id, form.elements.qty.value);
      if (!result.ok) {
        showErrors(form, { qty: result.error });
        return;
      }
      IMS.ui.closeModal();
      IMS.ui.toast("Stock updated to " + result.product.stock + ".");
      refresh();
    });
    form.elements.qty.focus();
    form.elements.qty.select();
  }

  function confirmDeleteProduct(id) {
    var product = store.productById(id);
    if (!product) return;
    var body =
      '<p>Delete <strong>' + esc(product.name) + '</strong> from the catalogue?</p>' +
      '<div class="callout warn" style="margin-top:14px">' + IMS.icon("alert") + '<span>Past receipts keep their saved product details. This action cannot be undone.</span></div>';
    var footer =
      '<button class="btn btn-secondary" data-action="modal-close">Cancel</button>' +
      '<button class="btn btn-danger" id="confirm-product-delete">Delete product</button>';
    var modal = IMS.ui.openModal({ title: "Delete product?", body: body, footer: footer, size: "slim" });
    modal.querySelector("#confirm-product-delete").addEventListener("click", function () {
      store.deleteProduct(id);
      IMS.ui.closeModal();
      IMS.ui.toast("Product deleted.");
      refresh();
    });
  }
  function openCustomerForm(id) {
    var customer = id ? store.customerById(id) : null;
    var body =
      '<form id="customer-form" novalidate>' +
        '<div class="form-grid">' +
          '<div class="field full"><label for="cf-name">Customer name</label><input class="input" id="cf-name" name="name" maxlength="80" value="' + esc(customer ? customer.name : "") + '" autocomplete="off"><div class="field-error" data-error="name"></div></div>' +
          '<div class="field full"><label for="cf-phone">Phone number</label><input class="input" id="cf-phone" name="phone" value="' + esc(customer ? customer.phone : "") + '" autocomplete="off"><div class="field-error" data-error="phone"></div></div>' +
          '<div class="field full"><label for="cf-address">Address (optional)</label><textarea id="cf-address" name="address" rows="2">' + esc(customer ? customer.address : "") + '</textarea><div class="field-error" data-error="address"></div></div>' +
        '</div>' +
      '</form>';
    var footer =
      '<button class="btn btn-secondary" data-action="modal-close">Cancel</button>' +
      '<button class="btn btn-primary" type="submit" form="customer-form">' + (customer ? "Save changes" : "Add customer") + '</button>';
    var modal = IMS.ui.openModal({ title: customer ? "Edit customer" : "Add customer", subtitle: customer ? "Keep contact details current." : "Name and phone are required.", body: body, footer: footer });
    var form = modal.querySelector("#customer-form");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var values = formValues(form);
      var result = customer ? store.updateCustomer(customer.id, values) : store.addCustomer(values);
      if (!result.ok) {
        showErrors(form, result.errors);
        return;
      }
      IMS.ui.closeModal();
      IMS.ui.toast(customer ? "Customer updated." : "Customer added.");
      refresh();
    });
    form.elements.name.focus();
  }

  function deleteCustomerFlow(id) {
    var customer = store.customerById(id);
    if (!customer) return;
    var balance = store.customerBalance(id);
    if (balance > 0) {
      var result = store.deleteCustomer(id);
      var body =
        '<div class="callout danger">' + IMS.icon("alert") + '<span>' + esc(result.error || "This customer still has a balance.") + '</span></div>' +
        '<p class="small muted" style="margin-top:14px">Record a payment in the Credit Book first. Deleting the record would hide money that is still owed.</p>';
      IMS.ui.openModal({
        title: "Cannot delete this customer",
        body: body,
        footer: '<button class="btn btn-primary" data-action="modal-close">Understood</button>',
        size: "slim"
      });
      refresh();
      return;
    }
    var body2 =
      '<p>Delete <strong>' + esc(customer.name) + '</strong> from your customer list?</p>' +
      '<div class="callout warn" style="margin-top:14px">' + IMS.icon("alert") + '<span>Past receipts keep the customer name. This action cannot be undone.</span></div>';
    var modal = IMS.ui.openModal({
      title: "Delete customer?",
      body: body2,
      footer: '<button class="btn btn-secondary" data-action="modal-close">Cancel</button><button class="btn btn-danger" id="confirm-customer-delete">Delete customer</button>',
      size: "slim"
    });
    modal.querySelector("#confirm-customer-delete").addEventListener("click", function () {
      var result2 = store.deleteCustomer(id);
      if (!result2.ok) {
        IMS.ui.closeModal();
        IMS.ui.toast(result2.error, "error");
        return;
      }
      IMS.ui.closeModal();
      IMS.ui.toast("Customer deleted.");
      refresh();
    });
  }

  function openCustomerDetail(id) {
    var customer = store.customerById(id);
    if (!customer) return;
    var balance = store.customerBalance(id);
    var status = store.customerStatus(id);
    var due = store.customerDueDate(id);
    var sales = store.customerSales(id);
    var payments = store.customerPayments(id);

    if (status.key === "overdue") store.setFlag("overdueViewed");

    var salesHtml = sales.length
      ? sales.map(function (sale) {
          return '<div class="row-between" style="padding:8px 0;border-bottom:1px solid var(--border)">' +
            '<div><div class="table-name" style="font-size:13px">' + esc(sale.receiptNo) + '</div><div class="table-sub">' + esc(IMS.formatDateTime(sale.createdAt)) + ' &middot; ' + (sale.paymentMethod === "credit" ? "Credit" : "Cash") + '</div></div>' +
            '<strong>' + money(sale.total) + '</strong>' +
          '</div>';
        }).join("")
      : '<p class="small muted">No sales recorded.</p>';

    var paymentsHtml = payments.length
      ? payments.map(function (payment) {
          return '<div class="row-between" style="padding:8px 0;border-bottom:1px solid var(--border)">' +
            '<div><div class="table-name" style="font-size:13px">' + money(payment.amount) + '</div><div class="table-sub">' + esc(IMS.formatDate(payment.createdAt)) + (payment.note ? " &middot; " + esc(payment.note) : "") + '</div></div>' +
          '</div>';
        }).join("")
      : '<p class="small muted">No payments recorded.</p>';

    var body =
      '<div class="row-between" style="margin-bottom:16px">' +
        '<div><div class="small muted">Outstanding balance</div><div class="stat-value ' + (balance > 0 ? "" : "muted") + '">' + money(balance) + '</div></div>' +
        '<div style="text-align:right"><div class="small muted">Status</div><div style="margin-top:5px">' + statusPill(status) + '</div></div>' +
      '</div>' +
      '<div class="form-grid" style="margin-bottom:18px">' +
        '<div class="field"><span class="small muted">Phone</span><strong style="font-size:13px">' + esc(customer.phone) + '</strong></div>' +
        '<div class="field"><span class="small muted">Due date</span><strong style="font-size:13px">' + (due ? esc(IMS.formatDate(due)) : "\u2014") + '</strong></div>' +
        '<div class="field full"><span class="small muted">Address</span><strong style="font-size:13px">' + esc(customer.address || "\u2014") + '</strong></div>' +
      '</div>' +
      '<h3 style="font-size:14px;margin-bottom:8px">Credit sales</h3>' + salesHtml +
      '<h3 style="font-size:14px;margin:18px 0 8px">Payments</h3>' + paymentsHtml;
    var footer = '<button class="btn btn-secondary" data-action="modal-close">Close</button>' +
      (balance > 0 ? '<button class="btn btn-primary" data-action="credit-pay" data-id="' + esc(id) + '">Record payment</button>' : "");
    IMS.ui.openModal({ title: customer.name, subtitle: "Customer account", body: body, footer: footer });
    refresh();
  }

  function openPaymentForm(id) {
    var customer = store.customerById(id);
    if (!customer) return;
    var balance = store.customerBalance(id);
    if (balance <= 0) {
      IMS.ui.toast("This customer has no outstanding balance.", "error");
      return;
    }
    var body =
      '<form id="payment-form" novalidate>' +
        '<div class="callout" style="margin-bottom:16px">' + IMS.icon("wallet") + '<span><strong>' + esc(customer.name) + '</strong><br>Outstanding: ' + money(balance) + '</span></div>' +
        '<div class="form-grid">' +
          '<div class="field"><label for="pay-amount">Amount received (\u20a6)</label><input class="input" id="pay-amount" name="amount" type="number" min="1" max="' + balance + '" step="1" value="' + balance + '"><div class="field-error" data-error="amount"></div></div>' +
          '<div class="field"><label for="pay-date">Payment date</label><input class="input" id="pay-date" name="date" type="date" value="' + IMS.localDateISO() + '"><div class="field-error" data-error="date"></div></div>' +
          '<div class="field full"><label for="pay-note">Note (optional)</label><input class="input" id="pay-note" name="note" maxlength="80" placeholder="e.g. part payment"><div class="field-error" data-error="note"></div></div>' +
        '</div>' +
      '</form>';
    var footer =
      '<button class="btn btn-secondary" data-action="modal-close">Cancel</button>' +
      '<button class="btn btn-primary" type="submit" form="payment-form">Record payment</button>';
    var modal = IMS.ui.openModal({ title: "Record payment", subtitle: "Reduce this customer's outstanding balance.", body: body, footer: footer, size: "slim" });
    var form = modal.querySelector("#payment-form");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var values = formValues(form);
      var result = store.addPayment(id, values.amount, values.note, values.date);
      if (!result.ok) {
        showErrors(form, { amount: result.error });
        return;
      }
      IMS.ui.closeModal();
      IMS.ui.toast("Payment recorded. New balance: " + money(result.balance) + ".");
      refresh();
    });
    form.elements.amount.focus();
    form.elements.amount.select();
  }
  function syncSaleForm() {
    var customerSelect = document.getElementById("sale-customer");
    if (customerSelect) saleState.customerId = customerSelect.value;
    var discountInput = document.getElementById("sale-discount");
    if (discountInput) saleState.discount = Math.max(0, Math.round(Number(discountInput.value) || 0));
    var paymentInput = document.querySelector('input[name="sale-payment"]:checked');
    if (paymentInput) saleState.payment = paymentInput.value;
    var dueInput = document.getElementById("sale-due");
    if (dueInput && paymentInput && paymentInput.value === "credit") saleState.dueDate = dueInput.value;
  }

  function addToCart(productId) {
    var product = store.productById(productId);
    if (!product) return;
    if (product.stock <= 0) {
      IMS.ui.toast("This product is out of stock.", "error");
      return;
    }
    syncSaleForm();
    var line = saleState.cart.find(function (item) { return item.productId === productId; });
    if (line) {
      if (line.qty + 1 > product.stock) {
        IMS.ui.toast("Only " + product.stock + " units available.", "error");
        return;
      }
      line.qty += 1;
    } else {
      saleState.cart.push({ productId: productId, qty: 1 });
    }
    refresh();
  }

  function changeQty(productId, delta) {
    syncSaleForm();
    var product = store.productById(productId);
    var line = saleState.cart.find(function (item) { return item.productId === productId; });
    if (!line || !product) return;
    var next = line.qty + delta;
    if (next > product.stock) {
      IMS.ui.toast("Only " + product.stock + " units available.", "error");
      return;
    }
    if (next <= 0) {
      saleState.cart = saleState.cart.filter(function (item) { return item.productId !== productId; });
    } else {
      line.qty = next;
    }
    refresh();
  }

  function removeFromCart(productId) {
    syncSaleForm();
    saleState.cart = saleState.cart.filter(function (item) { return item.productId !== productId; });
    refresh();
  }

  function checkout() {
    syncSaleForm();
    var result = store.createSale({
      items: saleState.cart,
      discount: saleState.discount,
      customerId: saleState.customerId,
      paymentMethod: saleState.payment,
      dueDate: saleState.dueDate
    });
    if (!result.ok) {
      IMS.ui.toast(result.error, "error");
      return;
    }
    saleState.cart = [];
    saleState.discount = 0;
    saleState.customerId = "";
    saleState.payment = "cash";
    saleState.dueDate = "";
    IMS.ui.toast("Sale completed. " + result.sale.receiptNo + " created.");
    refresh();
    viewReceipt(result.sale.id, false);
  }
  function viewReceipt(saleId, markViewed) {
    var sale = store.saleById(saleId);
    if (!sale) return;
    if (markViewed !== false) store.setFlag("receiptViewed");
    var body = IMS.receipt.html(sale);
    var footer =
      '<button class="btn btn-secondary" data-action="modal-close">Close</button>' +
      '<button class="btn btn-secondary" data-action="receipt-download" data-id="' + esc(sale.id) + '">' + IMS.icon("download") + 'Download PNG</button>' +
      '<button class="btn btn-primary" data-action="receipt-print" data-id="' + esc(sale.id) + '">' + IMS.icon("printer") + 'Print / Save PDF</button>';
    IMS.ui.openModal({ title: "Receipt " + sale.receiptNo, subtitle: "Preview before printing or downloading.", body: body, footer: footer, size: "slim" });
    refresh();
  }

  function printReceipt(saleId) {
    var sale = store.saleById(saleId);
    if (!sale) return;
    IMS.receipt.print(sale);
    refresh();
  }

  function downloadReceipt(saleId) {
    var sale = store.saleById(saleId);
    if (!sale) return;
    IMS.receipt.downloadPNG(sale);
    refresh();
  }

  function resetSales() {
    saleState = { cart: [], discount: 0, customerId: "", payment: "cash", dueDate: "", search: "" };
  }

  IMS.sandbox = {
    render: render,
    missionPanel: missionPanel,
    refresh: function () { refresh(); },
    resetSales: resetSales,
    openProductForm: openProductForm,
    openStockForm: openStockForm,
    confirmDeleteProduct: confirmDeleteProduct,
    openCustomerForm: openCustomerForm,
    deleteCustomerFlow: deleteCustomerFlow,
    openCustomerDetail: openCustomerDetail,
    openPaymentForm: openPaymentForm,
    addToCart: addToCart,
    changeQty: changeQty,
    removeFromCart: removeFromCart,
    checkout: checkout,
    viewReceipt: viewReceipt,
    printReceipt: printReceipt,
    downloadReceipt: downloadReceipt,
    syncSaleForm: syncSaleForm,
    getSaleState: function () { return saleState; }
  };

  function refresh() {
    if (IMS.app && typeof IMS.app.refresh === "function") IMS.app.refresh();
  }
})();
