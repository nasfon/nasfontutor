(function () {
  "use strict";

  var IMS = (window.IMS = window.IMS || {});

  IMS.config = {
    brand: {
      name: "NASFON IMS TUTOR",
      shortName: "NASFON",
      tagline: "Learn inventory the right way, before the live shop system."
    },
    shop: {
      name: "NASFON Stores",
      address: "Lagos, Nigeria",
      phone: "+234 800 000 0000"
    },
    receipt: {
      thankYou: "Thank you for your business!",
      policy: "Goods sold are not returnable after 24 hours."
    },
    storageKey: "nasfon_ims_tutor_v1",
    currency: { code: "NGN", locale: "en-NG" },
    passMark: 0.8,
    defaultCreditDays: 14,
    categories: ["Dairy", "Grains", "Groceries", "Toiletries", "Drinks", "Bakery", "General"],
    roles: [
      {
        id: "admin",
        label: "Admin",
        user: "Nasfon Admin",
        description: "Full access, including settings and backup.",
        permissions: ["dashboard", "products", "customers", "sales", "credit", "receipts", "settings"]
      },
      {
        id: "manager",
        label: "Manager",
        user: "Ada Manager",
        description: "Products, customers, sales, credit, and receipts.",
        permissions: ["dashboard", "products", "customers", "sales", "credit", "receipts"]
      },
      {
        id: "cashier",
        label: "Cashier",
        user: "Tunde Cashier",
        description: "Sales and receipts only.",
        permissions: ["dashboard", "sales", "receipts"]
      }
    ]
  };

  IMS.esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  var moneyFormatter = new Intl.NumberFormat(IMS.config.currency.locale, {
    maximumFractionDigits: 0
  });

  IMS.money = function (value) {
    var number = Number(value);
    if (!isFinite(number)) number = 0;
    return "\u20a6" + moneyFormatter.format(Math.round(number));
  };

  IMS.parseMoney = function (value) {
    var number = Number(String(value == null ? "" : value).replace(/[^0-9.-]/g, ""));
    return isFinite(number) ? Math.round(number) : 0;
  };

  function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    var text = String(value);
    var date = /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(text + "T00:00:00") : new Date(text);
    return isNaN(date.getTime()) ? null : date;
  }

  IMS.formatDate = function (value) {
    var date = parseDate(value);
    if (!date) return "\u2014";
    return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
  };

  IMS.formatDateTime = function (value) {
    var date = parseDate(value);
    if (!date) return "\u2014";
    return date.toLocaleDateString("en-NG", {
      day: "2-digit", month: "short", year: "numeric"
    }) + ", " + date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  };

  IMS.formatTime = function (value) {
    var date = parseDate(value);
    if (!date) return "\u2014";
    return date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  };

  IMS.localDateISO = function (date) {
    var d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + month + "-" + day;
  };

  IMS.addDays = function (date, days) {
    var d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    d.setDate(d.getDate() + Number(days || 0));
    return IMS.localDateISO(d);
  };

  IMS.daysBetween = function (from, to) {
    var a = parseDate(from);
    var b = parseDate(to);
    if (!a || !b) return 0;
    var start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    var end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((end - start) / 86400000);
  };

  IMS.roleInfo = function (roleId) {
    return IMS.config.roles.find(function (role) { return role.id === roleId; }) || IMS.config.roles[0];
  };

  IMS.initials = function (name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  };

  IMS.icon = function (name, className) {
    return '<svg class="icon ' + (className || "") + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  };
})();
