(function () {
  "use strict";

  var IMS = window.IMS;
  var KEY = IMS.config.storageKey;
  var memoryOnly = false;
  var state = load();

  function uid(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return (prefix || "id") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function isoAtDaysAgo(days, hour, minute) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, minute || 0, 0, 0);
    return d.toISOString();
  }

  function seedState() {
    var products = [
      { id: "p1", name: "Milo 400g", sku: "MILO-400", category: "Drinks", unit: "pcs", price: 1500, stock: 18, createdAt: isoAtDaysAgo(40, 8, 0) },
      { id: "p2", name: "Rice 5kg", sku: "RICE-5", category: "Grains", unit: "bag", price: 6500, stock: 10, createdAt: isoAtDaysAgo(40, 8, 5) },
      { id: "p3", name: "Sugar 1kg", sku: "SUG-1", category: "Groceries", unit: "pcs", price: 900, stock: 30, createdAt: isoAtDaysAgo(39, 8, 10) },
      { id: "p4", name: "Cooking Oil 1L", sku: "OIL-1", category: "Groceries", unit: "bottle", price: 1800, stock: 15, createdAt: isoAtDaysAgo(39, 8, 15) },
      { id: "p5", name: "Soap 200g", sku: "SOAP-2", category: "Toiletries", unit: "pcs", price: 450, stock: 40, createdAt: isoAtDaysAgo(38, 8, 20) },
      { id: "p6", name: "Soda 50cl", sku: "SODA-5", category: "Drinks", unit: "bottle", price: 300, stock: 48, createdAt: isoAtDaysAgo(38, 8, 25) },
      { id: "p7", name: "Bread Loaf", sku: "BRD-1", category: "Bakery", unit: "pcs", price: 700, stock: 12, createdAt: isoAtDaysAgo(37, 8, 30) },
      { id: "p8", name: "Test Item", sku: "TEST-1", category: "General", unit: "pcs", price: 100, stock: 5, createdAt: isoAtDaysAgo(36, 8, 35) }
    ];

    var customers = [
      { id: "c1", name: "Ngozi Obi", phone: "0803 555 0110", address: "14 Broad Street, Lagos", createdAt: isoAtDaysAgo(35, 9, 0) },
      { id: "c2", name: "Chinedu Eze", phone: "0806 555 0142", address: "8 Station Street, Lagos", createdAt: isoAtDaysAgo(34, 9, 5) },
      { id: "c3", name: "Amina Bello", phone: "0701 555 0166", address: "3 Central Avenue, Lagos", createdAt: isoAtDaysAgo(33, 9, 10) },
      { id: "c4", name: "Walk-in Demo", phone: "0800 000 0000", address: "", createdAt: isoAtDaysAgo(32, 9, 15) }
    ];

    var sales = [
      {
        id: "s1",
        receiptNo: "NSF-0001",
        createdAt: isoAtDaysAgo(0, 9, 15),
        cashier: "Nasfon Admin",
        role: "admin",
        customerId: null,
        customerName: null,
        items: [{ productId: "p6", name: "Soda 50cl", qty: 2, price: 300 }],
        subtotal: 600,
        discount: 0,
        total: 600,
        paymentMethod: "cash",
        amountPaid: 600,
        dueDate: null
      },
      {
        id: "s2",
        receiptNo: "NSF-0002",
        createdAt: isoAtDaysAgo(30, 14, 30),
        cashier: "Nasfon Admin",
        role: "admin",
        customerId: "c2",
        customerName: "Chinedu Eze",
        items: [{ productId: "p2", name: "Rice 5kg", qty: 1, price: 6500 }],
        subtotal: 6500,
        discount: 0,
        total: 6500,
        paymentMethod: "credit",
        amountPaid: 0,
        dueDate: IMS.addDays(new Date(), -16)
      }
    ];

    return ensureShape({
      version: 1,
      trainee: { name: "" },
      role: "admin",
      progress: {},
      flags: {},
      products: products,
      customers: customers,
      sales: sales,
      payments: [],
      receiptCounter: 2
    });
  }

  function ensureShape(raw) {
    var data = raw && typeof raw === "object" ? raw : {};
    var seed = null;
    if (!Array.isArray(data.products) || !Array.isArray(data.customers) || !Array.isArray(data.sales) || !Array.isArray(data.payments)) {
      seed = seedState();
    }
    var result = {
      version: 1,
      trainee: data.trainee && typeof data.trainee === "object" ? data.trainee : { name: "" },
      role: typeof data.role === "string" ? data.role : "admin",
      progress: data.progress && typeof data.progress === "object" ? data.progress : {},
      flags: data.flags && typeof data.flags === "object" ? data.flags : {},
      products: Array.isArray(data.products) ? data.products : seed.products,
      customers: Array.isArray(data.customers) ? data.customers : seed.customers,
      sales: Array.isArray(data.sales) ? data.sales : seed.sales,
      payments: Array.isArray(data.payments) ? data.payments : seed.payments,
      receiptCounter: Number(data.receiptCounter) || 0
    };

    if (!result.trainee.name) result.trainee.name = "";
    if (!IMS.roleInfo(result.role) || IMS.roleInfo(result.role).id !== result.role) result.role = "admin";

    var maxReceipt = 0;
    result.sales.forEach(function (sale) {
      var match = String(sale.receiptNo || "").match(/(\d+)$/);
      if (match) maxReceipt = Math.max(maxReceipt, Number(match[1]));
    });
    result.receiptCounter = Math.max(result.receiptCounter, maxReceipt);

    return result;
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return seedState();
      return ensureShape(JSON.parse(raw));
    } catch (error) {
      memoryOnly = true;
      return seedState();
    }
  }

  function save() {
    if (memoryOnly) return false;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      memoryOnly = true;
      return false;
    }
  }

  function trim(value) {
    return String(value == null ? "" : value).trim();
  }

  function findProduct(id) {
    return state.products.find(function (product) { return product.id === id; }) || null;
  }

  function findCustomer(id) {
    return state.customers.find(function (customer) { return customer.id === id; }) || null;
  }

  function findSale(id) {
    return state.sales.find(function (sale) { return sale.id === id; }) || null;
  }

  function getProgress(moduleId) {
    if (!state.progress[moduleId] || typeof state.progress[moduleId] !== "object") {
      state.progress[moduleId] = {
        lessonRead: false,
        quizScore: null,
        quizTotal: null,
        quizBest: null,
        quizBestTotal: null,
        quizPassed: false,
        missions: {}
      };
    }
    if (!state.progress[moduleId].missions || typeof state.progress[moduleId].missions !== "object") {
      state.progress[moduleId].missions = {};
    }
    return state.progress[moduleId];
  }

  function missionDone(moduleId, mission) {
    var progress = getProgress(moduleId);
    if (!mission || !mission.id) return false;
    if (progress.missions[mission.id]) return true;
    var complete = false;
    try {
      complete = Boolean(mission.check());
    } catch (error) {
      complete = false;
    }
    if (complete) {
      progress.missions[mission.id] = true;
      save();
    }
    return complete;
  }

  function customerBalance(customerId) {
    var owed = state.sales.reduce(function (sum, sale) {
      if (sale.paymentMethod === "credit" && sale.customerId === customerId) return sum + Number(sale.total || 0);
      return sum;
    }, 0);
    var paid = state.payments.reduce(function (sum, payment) {
      if (payment.customerId === customerId) return sum + Number(payment.amount || 0);
      return sum;
    }, 0);
    return Math.max(0, owed - paid);
  }

  function customerDueDate(customerId) {
    var dates = state.sales
      .filter(function (sale) { return sale.paymentMethod === "credit" && sale.customerId === customerId && sale.dueDate; })
      .map(function (sale) { return sale.dueDate; })
      .sort();
    return dates.length ? dates[0] : null;
  }

  function customerStatus(customerId) {
    var balance = customerBalance(customerId);
    if (balance <= 0) return { key: "settled", label: "Settled", days: null };
    var due = customerDueDate(customerId);
    if (!due) return { key: "current", label: "Current", days: null };
    var days = IMS.daysBetween(IMS.localDateISO(), due);
    if (days < 0) return { key: "overdue", label: "Overdue", days: days };
    if (days <= 3) return { key: "due-soon", label: "Due soon", days: days };
    return { key: "current", label: "Current", days: days };
  }

  function normalizeProduct(input) {
    var name = trim(input.name);
    var sku = trim(input.sku);
    var category = trim(input.category);
    var unit = trim(input.unit);
    var priceText = trim(input.price);
    var stockText = trim(input.stock);
    var price = priceText === "" ? NaN : Math.round(Number(priceText));
    var stock = stockText === "" ? 0 : Number(stockText);
    var errors = {};

    if (!name) errors.name = "Enter the product name.";
    else if (name.length > 80) errors.name = "Keep the name under 80 characters.";
    if (!sku) errors.sku = "Enter a SKU or barcode.";
    else if (sku.length > 40) errors.sku = "Keep the SKU under 40 characters.";
    if (!category) errors.category = "Enter a category.";
    if (!unit) errors.unit = "Enter a unit, for example pcs or bag.";
    if (!isFinite(price) || price <= 0) errors.price = "Enter a selling price greater than zero.";
    if (!isFinite(stock) || stock < 0 || Math.floor(stock) !== stock) errors.stock = "Stock must be a whole number, zero or more.";

    return {
      ok: Object.keys(errors).length === 0,
      errors: errors,
      value: { name: name, sku: sku, category: category, unit: unit, price: Math.max(0, price || 0), stock: Math.max(0, Math.floor(stock) || 0) }
    };
  }

  function skuTaken(sku, exceptId) {
    var needle = trim(sku).toLowerCase();
    return state.products.some(function (product) {
      return product.id !== exceptId && trim(product.sku).toLowerCase() === needle;
    });
  }

  function addProduct(input) {
    var result = normalizeProduct(input);
    if (!result.ok) return { ok: false, errors: result.errors };
    if (skuTaken(result.value.sku)) {
      return { ok: false, errors: { sku: "That SKU is already used by another product." } };
    }
    var product = {
      id: uid("product"),
      name: result.value.name,
      sku: result.value.sku,
      category: result.value.category,
      unit: result.value.unit,
      price: result.value.price,
      stock: result.value.stock,
      createdAt: new Date().toISOString()
    };
    state.products.push(product);
    save();
    return { ok: true, product: product };
  }

  function updateProduct(id, input) {
    var product = findProduct(id);
    if (!product) return { ok: false, errors: { name: "Product not found." } };
    var result = normalizeProduct(input);
    if (!result.ok) return { ok: false, errors: result.errors };
    if (skuTaken(result.value.sku, id)) {
      return { ok: false, errors: { sku: "That SKU is already used by another product." } };
    }
    product.name = result.value.name;
    product.sku = result.value.sku;
    product.category = result.value.category;
    product.unit = result.value.unit;
    product.price = result.value.price;
    product.stock = result.value.stock;
    save();
    return { ok: true, product: product };
  }

  function deleteProduct(id) {
    var before = state.products.length;
    state.products = state.products.filter(function (product) { return product.id !== id; });
    if (state.products.length === before) return { ok: false, error: "Product not found." };
    save();
    return { ok: true };
  }

  function addStock(id, qty) {
    var product = findProduct(id);
    if (!product) return { ok: false, error: "Product not found." };
    var quantity = Number(qty);
    if (!isFinite(quantity) || quantity <= 0 || Math.floor(quantity) !== quantity) {
      return { ok: false, error: "Enter a whole number greater than zero." };
    }
    product.stock = Number(product.stock || 0) + quantity;
    save();
    return { ok: true, product: product };
  }

  function normalizeCustomer(input) {
    var name = trim(input.name);
    var phone = trim(input.phone);
    var address = trim(input.address);
    var errors = {};
    if (!name) errors.name = "Enter the customer name.";
    else if (name.length > 80) errors.name = "Keep the name under 80 characters.";
    if (!phone) errors.phone = "Enter a phone number.";
    else if (phone.length < 7) errors.phone = "Enter a complete phone number.";
    return {
      ok: Object.keys(errors).length === 0,
      errors: errors,
      value: { name: name, phone: phone, address: address }
    };
  }

  function addCustomer(input) {
    var result = normalizeCustomer(input);
    if (!result.ok) return { ok: false, errors: result.errors };
    var customer = {
      id: uid("customer"),
      name: result.value.name,
      phone: result.value.phone,
      address: result.value.address,
      createdAt: new Date().toISOString()
    };
    state.customers.push(customer);
    save();
    return { ok: true, customer: customer };
  }

  function updateCustomer(id, input) {
    var customer = findCustomer(id);
    if (!customer) return { ok: false, errors: { name: "Customer not found." } };
    var result = normalizeCustomer(input);
    if (!result.ok) return { ok: false, errors: result.errors };
    customer.name = result.value.name;
    customer.phone = result.value.phone;
    customer.address = result.value.address;
    state.flags.customerEdited = true;
    save();
    return { ok: true, customer: customer };
  }

  function deleteCustomer(id) {
    var customer = findCustomer(id);
    if (!customer) return { ok: false, error: "Customer not found." };
    var balance = customerBalance(id);
    if (balance > 0) {
      state.flags.blockedCustomerDelete = true;
      save();
      return {
        ok: false,
        blocked: true,
        error: customer.name + " still owes " + IMS.money(balance) + ". Record the payment before deleting this customer."
      };
    }
    state.customers = state.customers.filter(function (item) { return item.id !== id; });
    save();
    return { ok: true };
  }

  function createSale(input) {
    var items = Array.isArray(input.items) ? input.items : [];
    if (!items.length) return { ok: false, error: "Add at least one product to the cart." };

    var combined = {};
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i];
      var product = findProduct(item.productId);
      var qty = Number(item.qty);
      if (!product) return { ok: false, error: "One of the products is no longer available." };
      if (!isFinite(qty) || qty <= 0 || Math.floor(qty) !== qty) {
        return { ok: false, error: "Each quantity must be a whole number greater than zero." };
      }
      combined[product.id] = (combined[product.id] || 0) + qty;
    }

    var saleItems = [];
    var subtotal = 0;
    var ids = Object.keys(combined);
    for (var j = 0; j < ids.length; j += 1) {
      var prod = findProduct(ids[j]);
      var quantity = combined[ids[j]];
      if (quantity > prod.stock) {
        return { ok: false, error: "Not enough stock for " + prod.name + ". Available: " + prod.stock + "." };
      }
      subtotal += quantity * prod.price;
      saleItems.push({ productId: prod.id, name: prod.name, qty: quantity, price: prod.price });
    }

    var discount = Math.round(Number(input.discount) || 0);
    if (discount < 0) discount = 0;
    if (discount > subtotal) return { ok: false, error: "The discount cannot be more than the subtotal." };

    var paymentMethod = input.paymentMethod === "credit" ? "credit" : "cash";
    var customer = input.customerId ? findCustomer(input.customerId) : null;
    if (paymentMethod === "credit" && !customer) {
      return { ok: false, error: "Choose a customer before recording a credit sale." };
    }

    var total = subtotal - discount;
    var dueDate = null;
    if (paymentMethod === "credit") {
      dueDate = input.dueDate || IMS.addDays(new Date(), IMS.config.defaultCreditDays);
      if (IMS.daysBetween(IMS.localDateISO(), dueDate) < 0) {
        return { ok: false, error: "The credit due date cannot be in the past." };
      }
    }

    var role = IMS.roleInfo(state.role);
    var sale = {
      id: uid("sale"),
      receiptNo: "NSF-" + String(state.receiptCounter + 1).padStart(4, "0"),
      createdAt: new Date().toISOString(),
      cashier: role.user,
      role: role.id,
      customerId: customer ? customer.id : null,
      customerName: customer ? customer.name : null,
      items: saleItems,
      subtotal: subtotal,
      discount: discount,
      total: total,
      paymentMethod: paymentMethod,
      amountPaid: paymentMethod === "cash" ? total : 0,
      dueDate: dueDate
    };

    saleItems.forEach(function (line) {
      var prod = findProduct(line.productId);
      if (prod) prod.stock = Math.max(0, Number(prod.stock || 0) - line.qty);
    });
    state.receiptCounter += 1;
    state.sales.push(sale);
    save();
    return { ok: true, sale: sale };
  }

  function addPayment(customerId, amount, note, date) {
    var customer = findCustomer(customerId);
    if (!customer) return { ok: false, error: "Customer not found." };
    var balance = customerBalance(customerId);
    var value = Math.round(Number(amount) || 0);
    if (balance <= 0) return { ok: false, error: "This customer has no outstanding balance." };
    if (value <= 0) return { ok: false, error: "Enter a payment greater than zero." };
    if (value > balance) {
      return { ok: false, error: "The payment cannot be more than the outstanding balance of " + IMS.money(balance) + "." };
    }
    var payment = {
      id: uid("payment"),
      customerId: customerId,
      amount: value,
      createdAt: date ? new Date(date + "T12:00:00").toISOString() : new Date().toISOString(),
      note: trim(note)
    };
    state.payments.push(payment);
    save();
    return { ok: true, payment: payment, balance: customerBalance(customerId) };
  }

  function customerSales(customerId) {
    return state.sales
      .filter(function (sale) { return sale.customerId === customerId; })
      .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
  }

  function customerPayments(customerId) {
    return state.payments
      .filter(function (payment) { return payment.customerId === customerId; })
      .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
  }

  function receivables() {
    return state.customers
      .map(function (customer) {
        var balance = customerBalance(customer.id);
        return {
          customer: customer,
          balance: balance,
          dueDate: customerDueDate(customer.id),
          status: customerStatus(customer.id)
        };
      })
      .filter(function (row) { return row.balance > 0; })
      .sort(function (a, b) {
        var rank = { overdue: 0, "due-soon": 1, current: 2 };
        var diff = (rank[a.status.key] == null ? 3 : rank[a.status.key]) - (rank[b.status.key] == null ? 3 : rank[b.status.key]);
        if (diff !== 0) return diff;
        return b.balance - a.balance;
      });
  }

  function stats() {
    var today = IMS.localDateISO();
    var units = state.products.reduce(function (sum, product) { return sum + Number(product.stock || 0); }, 0);
    var salesToday = state.sales.reduce(function (sum, sale) {
      return IMS.localDateISO(new Date(sale.createdAt)) === today ? sum + Number(sale.total || 0) : sum;
    }, 0);
    var outstanding = state.customers.reduce(function (sum, customer) {
      return sum + customerBalance(customer.id);
    }, 0);
    return {
      products: state.products.length,
      units: units,
      salesToday: salesToday,
      outstanding: outstanding,
      salesCount: state.sales.length
    };
  }

  function setRole(roleId) {
    var role = IMS.roleInfo(roleId);
    if (!role || role.id !== roleId) return false;
    state.role = roleId;
    if (roleId === "cashier") state.flags.roleCashier = true;
    save();
    return true;
  }

  function setName(name) {
    state.trainee.name = trim(name);
    save();
  }

  function markLessonRead(moduleId) {
    getProgress(moduleId).lessonRead = true;
    save();
  }

  function recordQuiz(moduleId, correct, total) {
    var progress = getProgress(moduleId);
    progress.quizScore = correct;
    progress.quizTotal = total;
    if (progress.quizBest == null || correct > progress.quizBest) {
      progress.quizBest = correct;
      progress.quizBestTotal = total;
    }
    var passed = total > 0 && correct / total >= IMS.config.passMark;
    if (passed) progress.quizPassed = true;
    save();
  }

  function setFlag(key, value) {
    if (!key) return;
    var next = value === undefined ? true : Boolean(value);
    if (state.flags[key] === next) return;
    state.flags[key] = next;
    save();
  }

  function flag(key) {
    return Boolean(state.flags[key]);
  }

  function resetPractice() {
    var seed = seedState();
    state.products = seed.products;
    state.customers = seed.customers;
    state.sales = seed.sales;
    state.payments = seed.payments;
    state.receiptCounter = seed.receiptCounter;
    state.role = "admin";
    save();
  }

  function resetProgress() {
    state.progress = {};
    state.flags = {};
    save();
  }

  function resetAll() {
    state = seedState();
    save();
  }

  function exportJSON() {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    var parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      return { ok: false, error: "That file is not valid JSON." };
    }
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: "That file does not contain a training backup." };
    }
    if (!Array.isArray(parsed.products) || !Array.isArray(parsed.customers) || !Array.isArray(parsed.sales) || !Array.isArray(parsed.payments)) {
      return { ok: false, error: "The backup is missing product, customer, sale, or payment data." };
    }
    state = ensureShape(parsed);
    save();
    return { ok: true };
  }

  IMS.store = {
    get state() { return state; },
    get memoryOnly() { return memoryOnly; },
    save: save,
    seed: seedState,
    productById: findProduct,
    customerById: findCustomer,
    saleById: findSale,
    getProgress: getProgress,
    missionDone: missionDone,
    customerBalance: customerBalance,
    customerDueDate: customerDueDate,
    customerStatus: customerStatus,
    customerSales: customerSales,
    customerPayments: customerPayments,
    receivables: receivables,
    stats: stats,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    addStock: addStock,
    addCustomer: addCustomer,
    updateCustomer: updateCustomer,
    deleteCustomer: deleteCustomer,
    createSale: createSale,
    addPayment: addPayment,
    setRole: setRole,
    setName: setName,
    markLessonRead: markLessonRead,
    recordQuiz: recordQuiz,
    setFlag: setFlag,
    flag: flag,
    resetPractice: resetPractice,
    resetProgress: resetProgress,
    resetAll: resetAll,
    exportJSON: exportJSON,
    importJSON: importJSON
  };
})();
