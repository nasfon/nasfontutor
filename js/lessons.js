(function () {
  "use strict";

  var IMS = window.IMS;
  var store = IMS.store;

  function productBySku(sku) {
    var needle = String(sku).toLowerCase();
    return store.state.products.find(function (product) {
      return String(product.sku || "").toLowerCase() === needle;
    }) || null;
  }

  function customerByName(name) {
    var needle = String(name).toLowerCase();
    return store.state.customers.find(function (customer) {
      return String(customer.name || "").toLowerCase() === needle;
    }) || null;
  }

  var modules = [
    {
      id: "products",
      order: 1,
      title: "Products",
      short: "Add, edit, stock, and safely remove products.",
      icon: "box",
      practice: "products",
      intro: "Every item you sell needs one clean record. In this module you add a product, update its price, add stock, and remove a test item.",
      steps: [
        {
          title: "One product, one record",
          body: "A product record represents one item you sell and count. If the same drink comes in a small and a large bottle, create a separate record for each size. Clean records make stock and receipts accurate."
        },
        {
          title: "The five fields",
          body: "Each product has a name, SKU or barcode, category, unit, and selling price. The SKU is the product's identity inside the system, so it must be unique. Use a short, consistent code such as MILK-400.",
          callout: "Never reuse a SKU for a different product. Two products with the same SKU cannot be told apart."
        },
        {
          title: "Stock is a moving number",
          body: "Stock is how many units you currently have. Sales reduce it automatically. You can also edit it directly when correcting a count, or use Add stock when new units arrive."
        },
        {
          title: "Edit carefully, delete rarely",
          body: "Editing changes the product going forward. Deleting removes it from the catalogue, but past receipts keep their own copy of the name and price. That means old receipts stay correct even after a product is deleted."
        },
        {
          title: "Find products with search",
          body: "Use the search box to find a product by name or SKU. Searching is faster and safer than scrolling, especially when the catalogue grows."
        }
      ],
      keyPoints: [
        "One record per sellable item.",
        "SKU must be unique and consistent.",
        "Sales reduce stock automatically.",
        "Deleting a product does not change past receipts."
      ],
      missions: [
        {
          id: "add-peak-milk",
          text: 'Add a product named "Peak Milk 400g" with SKU MILK-400, category Dairy, unit pcs, price \u20a61,200 and opening stock 24.',
          check: function () {
            var product = productBySku("MILK-400");
            return Boolean(product && product.name === "Peak Milk 400g" && product.category === "Dairy" && product.unit === "pcs" && Number(product.stock) >= 24);
          }
        },
        {
          id: "edit-price",
          text: "Edit Peak Milk 400g so the selling price is \u20a61,250.",
          check: function () {
            var product = productBySku("MILK-400");
            return Boolean(product && Number(product.price) === 1250);
          }
        },
        {
          id: "add-stock",
          text: "Add 12 units of stock to Peak Milk 400g so the stock becomes 36.",
          check: function () {
            var product = productBySku("MILK-400");
            return Boolean(product && Number(product.stock) >= 36);
          }
        },
        {
          id: "delete-test-item",
          text: 'Delete the seeded "Test Item" product using the delete confirmation.',
          check: function () {
            return !store.state.products.some(function (product) {
              return String(product.name).toLowerCase() === "test item";
            });
          }
        }
      ],
      quiz: [
        {
          q: "Which product field must be unique?",
          options: ["Category", "SKU or barcode", "Unit", "Selling price"],
          answer: 1,
          explain: "The SKU identifies a product, so no two products may share one."
        },
        {
          q: "A product has 6 units in stock. You add 10 units. What is the new stock?",
          options: ["10", "6", "16", "60"],
          answer: 2,
          explain: "Adding stock increases the existing quantity: 6 + 10 = 16."
        },
        {
          q: "What happens to a past receipt after its product is deleted?",
          options: ["The receipt is deleted too", "The receipt keeps its saved product name and price", "The total becomes zero", "The receipt can no longer be printed"],
          answer: 1,
          explain: "Receipts store a snapshot, so deleting a product does not rewrite history."
        },
        {
          q: "What does editing a product's selling price change?",
          options: ["The price used for future sales", "The stock count", "All past receipts", "The SKU"],
          answer: 0,
          explain: "A price edit applies going forward. Past receipts keep the price that was charged."
        }
      ]
    },
    {
      id: "customers",
      order: 2,
      title: "Customers",
      short: "Create, edit, and safely remove customer records.",
      icon: "users",
      practice: "customers",
      intro: "Customer records hold the contact details and credit history you need. You will add a customer, edit their details, and learn why a debtor cannot be deleted.",
      steps: [
        {
          title: "Why customer records matter",
          body: "A customer record links a person to their phone number, purchases, and outstanding balance. Without it, credit sales become guesswork and reminders are impossible."
        },
        {
          title: "Create and edit",
          body: "Name and phone number are required. An address is optional. Keep the phone number current because it is how you follow up on credit."
        },
        {
          title: "Where balances come from",
          body: "A balance is not typed in by hand. It is the total of unpaid credit sales minus the payments you record in the Credit Book."
        },
        {
          title: "Safe deletion",
          body: "A customer who still owes money cannot be deleted. Record the payment first. Customers with a zero balance can be removed after you confirm.",
          callout: "The system blocks deleting a debtor on purpose. Deleting the record would hide the debt without collecting it."
        }
      ],
      keyPoints: [
        "Name and phone are required.",
        "Balances come from credit sales and payments.",
        "Debtors cannot be deleted until they settle.",
        "Editing details never changes past receipts."
      ],
      missions: [
        {
          id: "add-grace",
          text: 'Add a customer named "Grace Okafor" with phone 0803 555 0199.',
          check: function () {
            return Boolean(customerByName("Grace Okafor"));
          }
        },
        {
          id: "edit-grace",
          text: "Edit Grace Okafor's details and save the change.",
          check: function () {
            return Boolean(customerByName("Grace Okafor")) && store.flag("customerEdited");
          }
        },
        {
          id: "block-delete-debtor",
          text: "Try to delete Chinedu Eze, who has an overdue balance, and read the block message.",
          check: function () {
            var chinedu = customerByName("Chinedu Eze");
            return store.flag("blockedCustomerDelete") && Boolean(chinedu) && store.customerBalance(chinedu.id) > 0;
          }
        },
        {
          id: "delete-walkin",
          text: 'Delete the seeded zero-balance customer "Walk-in Demo".',
          check: function () {
            return !customerByName("Walk-in Demo");
          }
        }
      ],
      quiz: [
        {
          q: "Which customer fields are required?",
          options: ["Name only", "Name and phone", "Phone and address", "Address only"],
          answer: 1,
          explain: "Name and phone are required; address is optional."
        },
        {
          q: "A customer owes \u20a62,500. What happens when you try to delete them?",
          options: ["They are deleted", "The balance is cleared automatically", "Deletion is blocked until the balance is settled", "The balance moves to another customer"],
          answer: 2,
          explain: "A debtor cannot be deleted, because that would hide money still owed."
        },
        {
          q: "Where does a customer's outstanding balance come from?",
          options: ["A number typed on the customer form", "Unpaid credit sales minus recorded payments", "The number of receipts printed", "The customer's address"],
          answer: 1,
          explain: "The balance is calculated from credit sales and payments."
        },
        {
          q: "What should you do before deleting a customer who owes money?",
          options: ["Delete their sales", "Record the payment until the balance is zero", "Change their phone number", "Print a blank receipt"],
          answer: 1,
          explain: "Settle the balance first, then deletion is allowed."
        }
      ]
    },
    {
      id: "sales",
      order: 3,
      title: "Sales",
      short: "Build a cart, apply a discount, and take cash or credit.",
      icon: "cart",
      practice: "sales",
      intro: "The sales screen turns a customer request into a receipt and updates stock. You will complete cash sales, a credit sale, and a discounted sale.",
      steps: [
        {
          title: "Know the screen",
          body: "Products are on the left and the cart is on the right. On a phone the cart sits below the product list. Search for the item, then add it to the cart."
        },
        {
          title: "Quantities and stock",
          body: "Use the quantity controls to set how many units the customer is buying. The system refuses a quantity larger than the stock you have."
        },
        {
          title: "Discounts",
          body: "A discount is a fixed Naira amount taken off the sale. It cannot be larger than the subtotal. The receipt shows the discount as its own line."
        },
        {
          title: "Cash or credit",
          body: "Cash means the customer pays the full total now. Credit adds the total to the selected customer's balance and sets a due date. A credit sale always needs a customer record.",
          callout: "Do not record a credit sale as cash. It makes the till look full when the money has not arrived."
        },
        {
          title: "Stock changes immediately",
          body: "Completing a sale reduces stock for every item in the cart. That is why the stock figure on the Products screen stays trustworthy."
        }
      ],
      keyPoints: [
        "Credit sales require a customer.",
        "Stock cannot go below zero.",
        "Discounts are fixed Naira amounts.",
        "A completed sale creates a numbered receipt."
      ],
      missions: [
        {
          id: "cash-sale",
          text: "Complete a cash sale of 2 \u00d7 Peak Milk 400g.",
          check: function () {
            return store.state.sales.some(function (sale) {
              return sale.paymentMethod === "cash" && sale.items.some(function (item) {
                return item.name === "Peak Milk 400g" && Number(item.qty) >= 2;
              });
            });
          }
        },
        {
          id: "credit-sale",
          text: "Complete a credit sale of 1 \u00d7 Rice 5kg to Grace Okafor.",
          check: function () {
            return store.state.sales.some(function (sale) {
              return sale.paymentMethod === "credit" && sale.customerName === "Grace Okafor" && sale.items.some(function (item) {
                return item.name === "Rice 5kg";
              });
            });
          }
        },
        {
          id: "discount-sale",
          text: "Complete any sale with a \u20a6200 discount.",
          check: function () {
            return store.state.sales.some(function (sale) {
              return Number(sale.discount) >= 200;
            });
          }
        }
      ],
      quiz: [
        {
          q: "When is a customer required?",
          options: ["For every cash sale", "Only for credit sales", "Only when a discount is used", "Never"],
          answer: 1,
          explain: "Credit needs a person to owe the balance, so a customer record is required."
        },
        {
          q: "Stock is 2 units and the cart has 3. What happens at checkout?",
          options: ["Stock becomes -1", "The sale is blocked", "The system adds more stock", "The sale completes without a receipt"],
          answer: 1,
          explain: "Stock cannot go below zero, so the sale is blocked until the quantity is corrected."
        },
        {
          q: "What is the maximum discount on a \u20a63,000 sale?",
          options: ["Any amount", "\u20a63,000", "\u20a6300", "Discounts are not allowed"],
          answer: 1,
          explain: "The discount cannot exceed the subtotal."
        },
        {
          q: "On a cash sale, how much is recorded as paid?",
          options: ["Zero", "Half the total", "The full total", "The customer's balance"],
          answer: 2,
          explain: "Cash sales are paid in full at the time of sale."
        }
      ]
    },
    {
      id: "receipts",
      order: 4,
      title: "Receipts",
      short: "Read, print, save as PDF, and download a receipt.",
      icon: "receipt",
      practice: "receipts",
      intro: "A receipt is proof of a sale for both the shop and the customer. You will inspect a receipt, start the save-as-PDF flow, and download a PNG copy.",
      steps: [
        {
          title: "What a receipt proves",
          body: "Every receipt shows the shop, receipt number, date, cashier, items, totals, and payment status. The receipt number and date make the transaction easy to find later."
        },
        {
          title: "Read the totals",
          body: "Subtotal is the value of the items before discount. The total is what the customer should pay. For a credit sale, balance due shows how much is still owed."
        },
        {
          title: "Save as PDF",
          body: "Open the receipt preview and choose Print / Save PDF. In the browser dialog, select the Save as PDF destination, then confirm. No extra software is needed.",
          callout: "The browser print window is the PDF tool. Choose Save as PDF, not a physical printer."
        },
        {
          title: "Download a PNG",
          body: "Download PNG produces an image of the same receipt. It is useful for sending proof through chat when the customer cannot receive a printed copy."
        }
      ],
      keyPoints: [
        "Every sale gets a unique receipt number.",
        "Cash receipts show a zero balance due.",
        "PDF comes from the browser print dialog.",
        "PNG is a direct image download."
      ],
      missions: [
        {
          id: "view-receipt",
          text: "Open the preview of the most recent receipt.",
          check: function () { return store.flag("receiptViewed"); }
        },
        {
          id: "print-receipt",
          text: "Start the Print / Save PDF flow for a receipt.",
          check: function () { return store.flag("receiptPrinted"); }
        },
        {
          id: "download-receipt",
          text: "Download a receipt as a PNG image.",
          check: function () { return store.flag("receiptDownloaded"); }
        }
      ],
      quiz: [
        {
          q: "What is the balance due on a cash receipt?",
          options: ["The total", "Half the total", "Zero", "The discount"],
          answer: 2,
          explain: "Cash sales are paid in full, so there is no balance left."
        },
        {
          q: "How do you save a receipt as PDF?",
          options: ["Use Download PNG", "Use the browser's Print / Save PDF dialog", "Edit the receipt number", "Record a payment"],
          answer: 1,
          explain: "The browser print dialog provides the Save as PDF option."
        },
        {
          q: "Which pair helps you find a past transaction?",
          options: ["Category and unit", "Receipt number and date", "Supplier and stock", "Discount and cashier"],
          answer: 1,
          explain: "Receipt number and date are the key references for a transaction."
        },
        {
          q: "What does Download PNG produce?",
          options: ["A new sale", "An image copy of the receipt", "A customer record", "A stock adjustment"],
          answer: 1,
          explain: "PNG saves the receipt as an image that can be shared or stored."
        }
      ]
    },
    {
      id: "credit",
      order: 5,
      title: "Credit Book",
      short: "Track balances, due dates, and partial payments.",
      icon: "wallet",
      practice: "credit",
      intro: "The Credit Book shows who owes money and when it is due. You will record a partial payment and inspect an overdue account.",
      steps: [
        {
          title: "Credit becomes a balance",
          body: "When a credit sale is completed, the total is added to that customer's balance. No cash is recorded at that moment, because the money has not arrived yet."
        },
        {
          title: "Due dates and status",
          body: "Every credit sale gets a due date. An account is Current when there is time left, Due soon when the date is close, and Overdue when the due date has passed and money is still owed."
        },
        {
          title: "Partial payments",
          body: "Customers can pay part of what they owe. Record the amount received, and the balance goes down. A payment cannot be larger than the outstanding balance."
        },
        {
          title: "Protect the record",
          body: "Never delete a customer to make a debt disappear. The system blocks it, and the Credit Book keeps the history you need to follow up.",
          callout: "Check the overdue list every day. Small debts are easier to collect than old ones."
        }
      ],
      keyPoints: [
        "Balance equals unpaid credit sales minus payments.",
        "Due dates decide Current, Due soon, and Overdue.",
        "Partial payments reduce the balance.",
        "Debtors cannot be deleted."
      ],
      missions: [
        {
          id: "record-payment",
          text: "Record a \u20a61,000 payment for Grace Okafor in the Credit Book.",
          check: function () {
            var grace = customerByName("Grace Okafor");
            if (!grace) return false;
            return store.state.payments.some(function (payment) {
              return payment.customerId === grace.id && Number(payment.amount) === 1000;
            });
          }
        },
        {
          id: "view-overdue",
          text: "Open the overdue account belonging to Chinedu Eze.",
          check: function () { return store.flag("overdueViewed"); }
        }
      ],
      quiz: [
        {
          q: "How is a customer's outstanding balance calculated?",
          options: ["Credit sales plus payments", "Credit sales minus payments", "Cash sales minus stock", "The number of receipts"],
          answer: 1,
          explain: "Start with unpaid credit sales and subtract recorded payments."
        },
        {
          q: "A customer owes \u20a66,500 and pays \u20a61,000. What is the new balance?",
          options: ["\u20a66,500", "\u20a61,000", "\u20a65,500", "\u20a67,500"],
          answer: 2,
          explain: "6,500 minus 1,000 leaves 5,500."
        },
        {
          q: "When is an account overdue?",
          options: ["As soon as a credit sale is made", "When the due date has passed and a balance remains", "When the customer pays in full", "When a receipt is printed"],
          answer: 1,
          explain: "Overdue means the due date has passed while money is still owed."
        },
        {
          q: "Why can a customer with a balance not be deleted?",
          options: ["Their phone number is missing", "Deleting would hide money still owed", "They have no receipts", "The system is offline"],
          answer: 1,
          explain: "The debt must be settled first so the record stays honest."
        }
      ]
    },
    {
      id: "roles",
      order: 6,
      title: "Users & Data Safety",
      short: "Understand roles, permissions, and backups.",
      icon: "shield",
      practice: "settings",
      intro: "Different staff need different access. You will switch roles to see how the menu changes, then export a backup of the training data.",
      steps: [
        {
          title: "Three roles",
          body: "Admin has full access. Manager handles products, customers, sales, credit, and receipts. Cashier works on sales and receipts only."
        },
        {
          title: "Least privilege",
          body: "Give each person only the access their job needs. A cashier does not need to edit products or delete customers. Fewer permissions mean fewer costly mistakes."
        },
        {
          title: "Shared logins are risky",
          body: "When staff share one login, receipts show the wrong cashier and actions cannot be traced. Use a separate account per person and log out when leaving the till."
        },
        {
          title: "Backups protect the shop",
          body: "Export a backup regularly and keep it somewhere safe. If a device is lost or data is cleared, the backup is what lets you recover.",
          callout: "Reset buttons are for training only. On the live system, never reset data unless you are certain of the outcome."
        }
      ],
      keyPoints: [
        "Admin: everything.",
        "Manager: no settings or user control.",
        "Cashier: sales and receipts only.",
        "Export backups and keep logins personal."
      ],
      missions: [
        {
          id: "switch-cashier",
          text: "Switch the role selector to Cashier.",
          check: function () { return store.flag("roleCashier"); }
        },
        {
          id: "restricted-access",
          text: "As Cashier, try to open Products or Customers and read the restriction message.",
          check: function () { return store.flag("restrictedAttempt"); }
        },
        {
          id: "switch-back-admin",
          text: "Switch the role selector back to Admin.",
          check: function () { return store.state.role === "admin" && store.flag("roleCashier"); }
        },
        {
          id: "export-backup",
          text: "Export a backup file from Settings.",
          check: function () { return store.flag("backupExported"); }
        }
      ],
      quiz: [
        {
          q: "Which areas can a Cashier use?",
          options: ["Products and customers", "Sales and receipts", "Credit Book and settings", "Everything"],
          answer: 1,
          explain: "Cashiers are limited to selling and issuing receipts."
        },
        {
          q: "Which area is unavailable to a Manager?",
          options: ["Products", "Customers", "Sales", "Settings and backup"],
          answer: 3,
          explain: "Settings, backup, and user control stay with the Admin."
        },
        {
          q: "What does least privilege mean?",
          options: ["Everyone gets full access", "Staff get only the access their job needs", "Only the owner can sell", "Passwords are shared"],
          answer: 1,
          explain: "Least privilege limits access to what is necessary for the role."
        },
        {
          q: "Why export a backup?",
          options: ["To print receipts faster", "To recover data if something is lost", "To change product prices", "To delete customers"],
          answer: 1,
          explain: "A backup is a recovery copy of your data."
        }
      ]
    },
    {
      id: "final",
      order: 7,
      title: "Final Assessment",
      short: "Ten questions across the whole course.",
      icon: "award",
      practice: null,
      intro: "This assessment covers products, customers, sales, receipts, credit, and roles. Score at least 8 out of 10 to pass. Complete every module to unlock the certificate.",
      steps: [],
      keyPoints: [
        "One product record per sellable item.",
        "Credit always needs a customer and a due date.",
        "Stock changes with sales and stock additions.",
        "Receipts are saved as PDF or PNG.",
        "Settle debts before deleting a customer.",
        "Give staff only the access they need."
      ],
      missions: [],
      final: true,
      quiz: [
        {
          q: "Which product field must be unique?",
          options: ["Category", "SKU or barcode", "Unit", "Stock"],
          answer: 1,
          explain: "The SKU is the product's unique identity."
        },
        {
          q: "Stock is 20. A cash sale of 3 units is completed. What is the stock now?",
          options: ["23", "20", "17", "3"],
          answer: 2,
          explain: "A sale reduces stock: 20 - 3 = 17."
        },
        {
          q: "What is required for a credit sale?",
          options: ["A discount", "A customer record", "A printed receipt first", "An empty cart"],
          answer: 1,
          explain: "Credit must be attached to a customer who owes the balance."
        },
        {
          q: "After a product is deleted, what happens to its past receipts?",
          options: ["They are deleted", "They keep the saved name and price", "Their totals change", "They become credit sales"],
          answer: 1,
          explain: "Receipts keep a snapshot of the sale."
        },
        {
          q: "A customer has an outstanding balance. What happens when you try to delete them?",
          options: ["They are deleted", "The balance is cleared", "Deletion is blocked", "The balance becomes a discount"],
          answer: 2,
          explain: "Debtors must settle before deletion."
        },
        {
          q: "A customer owes \u20a66,500 and pays \u20a62,000. What remains?",
          options: ["\u20a68,500", "\u20a66,500", "\u20a64,500", "\u20a62,000"],
          answer: 2,
          explain: "6,500 - 2,000 = 4,500."
        },
        {
          q: "Can a Cashier edit product prices?",
          options: ["Yes, always", "Only on weekends", "No, products are restricted for Cashiers", "Yes, after a sale"],
          answer: 2,
          explain: "Cashiers only have sales and receipts access."
        },
        {
          q: "How is a receipt saved as PDF?",
          options: ["Through Download PNG", "Through the browser Print / Save PDF dialog", "By recording a payment", "By editing the receipt number"],
          answer: 1,
          explain: "The browser print dialog provides Save as PDF."
        },
        {
          q: "What is the main purpose of exporting a backup?",
          options: ["Faster checkout", "Recovering data after loss", "Changing roles", "Deleting products"],
          answer: 1,
          explain: "A backup protects data so it can be restored."
        },
        {
          q: "A \u20a63,000 sale has a \u20a6500 discount. What is the total?",
          options: ["\u20a63,500", "\u20a63,000", "\u20a62,500", "\u20a6500"],
          answer: 2,
          explain: "3,000 - 500 = 2,500."
        }
      ]
    }
  ];

  modules.sort(function (a, b) { return a.order - b.order; });

  IMS.modules = modules;
  IMS.moduleById = function (id) {
    return modules.find(function (module) { return module.id === id; }) || null;
  };
  IMS.coreModules = modules.filter(function (module) { return !module.final; });
})();
