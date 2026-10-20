(function () {
  "use strict";

  var IMS = window.IMS;
  var esc = IMS.esc;
  var money = IMS.money;

  function paymentLabel(method) {
    return method === "credit" ? "Credit" : "Cash";
  }

  function balanceDue(sale) {
    return Math.max(0, Number(sale.total || 0) - Number(sale.amountPaid || 0));
  }

  function build(sale) {
    return {
      shop: IMS.config.shop,
      receiptNo: sale.receiptNo,
      date: IMS.formatDateTime(sale.createdAt),
      cashier: sale.cashier,
      customer: sale.customerName || "Walk-in customer",
      hasCustomer: Boolean(sale.customerName),
      items: sale.items.map(function (item) {
        return {
          name: item.name,
          qty: item.qty,
          price: item.price,
          lineTotal: Number(item.qty) * Number(item.price)
        };
      }),
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      method: paymentLabel(sale.paymentMethod),
      amountPaid: sale.amountPaid,
      balance: balanceDue(sale),
      thankYou: IMS.config.receipt.thankYou,
      policy: IMS.config.receipt.policy
    };
  }

  function html(sale) {
    var data = build(sale);
    var itemRows = data.items.map(function (item) {
      return (
        '<div class="receipt-item">' +
          '<span class="receipt-item-name">' + esc(item.name) + '</span>' +
          '<span class="receipt-item-qty">' + item.qty + ' &times; ' + money(item.price) + '</span>' +
          '<span class="receipt-item-total">' + money(item.lineTotal) + '</span>' +
        '</div>'
      );
    }).join("");

    var discountRow = Number(data.discount) > 0
      ? '<div class="receipt-row"><span>Discount</span><span>-' + money(data.discount) + '</span></div>'
      : "";

    return (
      '<div class="receipt" role="document" aria-label="Receipt ' + esc(data.receiptNo) + '">' +
        '<div class="receipt-head">' +
          '<strong>' + esc(data.shop.name) + '</strong>' +
          '<span>' + esc(data.shop.address) + '</span>' +
          '<span>' + esc(data.shop.phone) + '</span>' +
        '</div>' +
        '<div class="receipt-meta">' +
          '<div class="receipt-row"><span>Receipt</span><span>' + esc(data.receiptNo) + '</span></div>' +
          '<div class="receipt-row"><span>Date</span><span>' + esc(data.date) + '</span></div>' +
          '<div class="receipt-row"><span>Cashier</span><span>' + esc(data.cashier) + '</span></div>' +
          '<div class="receipt-row"><span>Customer</span><span>' + esc(data.customer) + '</span></div>' +
        '</div>' +
        '<div class="receipt-items">' + itemRows + '</div>' +
        '<div class="receipt-summary">' +
          '<div class="receipt-row"><span>Subtotal</span><span>' + money(data.subtotal) + '</span></div>' +
          discountRow +
          '<div class="receipt-row total"><span>Total</span><span>' + money(data.total) + '</span></div>' +
          '<div class="receipt-row"><span>Payment</span><span>' + esc(data.method) + '</span></div>' +
          '<div class="receipt-row"><span>Amount paid</span><span>' + money(data.amountPaid) + '</span></div>' +
          '<div class="receipt-row"><span>Balance due</span><span>' + money(data.balance) + '</span></div>' +
        '</div>' +
        '<div class="receipt-foot">' +
          '<strong>' + esc(data.thankYou) + '</strong>' +
          '<span>' + esc(data.policy) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function print(sale) {
    if (!sale) return;
    var root = document.getElementById("print-root");
    if (!root) return;
    root.innerHTML = html(sale);
    document.body.classList.add("printing");
    IMS.store.setFlag("receiptPrinted");

    function cleanup() {
      document.body.classList.remove("printing");
      root.innerHTML = "";
    }

    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 2000);
  }

  function wrapText(text, font, maxWidth, ctx) {
    ctx.font = font;
    var words = String(text).split(/\s+/).filter(Boolean);
    var lines = [];
    var line = "";
    words.forEach(function (word) {
      var test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function truncateText(text, font, maxWidth, ctx) {
    ctx.font = font;
    var value = String(text);
    if (ctx.measureText(value).width <= maxWidth) return value;
    var ellipsis = "...";
    while (value.length > 1 && ctx.measureText(value + ellipsis).width > maxWidth) {
      value = value.slice(0, -1);
    }
    return value.replace(/\s+$/, "") + ellipsis;
  }

  function downloadPNG(sale) {
    if (!sale) return;
    var data = build(sale);
    var W = 384;
    var P = 22;
    var scale = 2;
    var measureCanvas = document.createElement("canvas");
    var measure = measureCanvas.getContext("2d");
    var ops = [];
    var y = P;

    var fontSans = '"Segoe UI", system-ui, -apple-system, sans-serif';
    var fontMono = 'Menlo, Consolas, "Liberation Mono", monospace';

    function font(size, weight, kind) {
      return (weight || 400) + " " + size + "px " + (kind === "mono" ? fontMono : fontSans);
    }

    function addText(text, options) {
      var opts = options || {};
      var f = opts.font || font(10.5, 400, "mono");
      var align = opts.align || "left";
      var x = P;
      if (align === "center") x = W / 2;
      if (align === "right") x = W - P;
      ops.push({ type: "text", text: text, font: f, color: opts.color || "#111827", x: x, y: y, align: align });
      measure.font = f;
      var lineHeight = opts.lineHeight || 14;
      y += lineHeight;
    }

    function addWrapped(text, options) {
      var opts = options || {};
      var f = opts.font || font(10.5, 400, "mono");
      var maxWidth = opts.maxWidth || (W - P * 2);
      var lines = wrapText(text, f, maxWidth, measure);
      lines.forEach(function (line) {
        addText(line, Object.assign({}, opts, { font: f, maxWidth: maxWidth, lineHeight: opts.lineHeight || 14 }));
      });
      return lines.length;
    }

    function addPair(label, value, options) {
      var opts = options || {};
      var f = opts.font || font(10.5, 400, "mono");
      ops.push({ type: "text", text: label, font: f, color: opts.color || "#111827", x: P, y: y, align: "left" });
      ops.push({ type: "text", text: value, font: f, color: opts.color || "#111827", x: W - P, y: y, align: "right" });
      y += opts.lineHeight || 15;
    }

    function addDivider() {
      ops.push({ type: "line", x1: P, x2: W - P, y: y });
      y += 10;
    }

    function gap(amount) { y += amount; }

    addText(data.shop.name, { font: font(15, 700, "sans"), align: "center", lineHeight: 20 });
    addText(data.shop.address, { font: font(10, 400, "mono"), align: "center", lineHeight: 14, color: "#475569" });
    addText(data.shop.phone, { font: font(10, 400, "mono"), align: "center", lineHeight: 14, color: "#475569" });
    gap(8);
    addDivider();
    addPair("Receipt", data.receiptNo);
    addPair("Date", data.date);
    addPair("Cashier", data.cashier);
    addPair("Customer", data.customer);
    addDivider();

    data.items.forEach(function (item) {
      var nameFont = font(11, 600, "mono");
      var qtyFont = font(9.5, 400, "mono");
      var totalFont = font(11, 700, "mono");
      var qtyText = item.qty + " \u00d7 " + money(item.price);
      var totalText = money(item.lineTotal);

      measure.font = qtyFont;
      var qtyWidth = measure.measureText(qtyText).width;
      measure.font = totalFont;
      var totalWidth = measure.measureText(totalText).width;

      var totalX = W - P;
      var qtyX = totalX - totalWidth - 10;
      var nameMax = Math.max(40, qtyX - qtyWidth - 10 - P);
      var nameText = truncateText(item.name, nameFont, nameMax, measure);

      ops.push({ type: "text", text: nameText, font: nameFont, color: "#111827", x: P, y: y, align: "left" });
      ops.push({ type: "text", text: qtyText, font: qtyFont, color: "#64748b", x: qtyX, y: y + 1, align: "right" });
      ops.push({ type: "text", text: totalText, font: totalFont, color: "#111827", x: totalX, y: y, align: "right" });
      y += 15;
      gap(4);
    });

    addDivider();
    addPair("Subtotal", money(data.subtotal));
    if (Number(data.discount) > 0) addPair("Discount", "-" + money(data.discount));
    addPair("Total", money(data.total), { font: font(12, 700, "mono"), lineHeight: 17 });
    addPair("Payment", data.method);
    addPair("Amount paid", money(data.amountPaid));
    addPair("Balance due", money(data.balance));
    addDivider();
    addText(data.thankYou, { font: font(10, 700, "sans"), align: "center", lineHeight: 15 });
    addWrapped(data.policy, { font: font(9.5, 400, "sans"), align: "center", lineHeight: 13, color: "#64748b", maxWidth: 300 });
    gap(P);

    var height = Math.ceil(y);
    var canvas = document.createElement("canvas");
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(height * scale);
    var ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, height);

    ops.forEach(function (op) {
      if (op.type === "text") {
        ctx.font = op.font;
        ctx.fillStyle = op.color;
        ctx.textAlign = op.align;
        ctx.textBaseline = "top";
        ctx.fillText(op.text, op.x, op.y);
      } else if (op.type === "line") {
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(op.x1, op.y);
        ctx.lineTo(op.x2, op.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    IMS.store.setFlag("receiptDownloaded");

    try {
      var link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "receipt-" + sale.receiptNo + ".png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      IMS.ui.toast("The image could not be created in this browser.", "error");
    }
  }

  IMS.receipt = {
    build: build,
    html: html,
    print: print,
    downloadPNG: downloadPNG,
    balanceDue: balanceDue
  };
})();
