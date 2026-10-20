# NASFON IMS TUTOR — Product Specification

Version: 1.0  
Status: Draft for approval  
Date: 20 October 2026  
Product: Offline inventory-management training app for shop owners

---

## 1. Purpose

NASFON IMS TUTOR prepares shop owners to use the real inventory software before they are given access to it. The trainee reads a short lesson, practices the same task in a realistic sandbox, passes a short quiz, and prints a certificate when finished.

The training must feel like a guided course, not a documentation site. Every module ends with a task the trainee performs inside the sandbox.

---

## 2. Audience and outcomes

**Audience:** Shop owners and their staff with basic phone or computer experience. No accounting or inventory knowledge assumed.

By the end, the trainee can:

1. Add, edit, search, and safely delete products.
2. Adjust stock directly and add new stock.
3. Create, edit, and safely delete customers.
4. Complete cash and credit sales, including discounts.
5. Generate a receipt and save it as PDF or PNG.
6. Record partial credit payments and identify overdue accounts.
7. Explain the Admin, Manager, and Cashier roles.
8. Export a backup and avoid common data-loss mistakes.

---

## 3. Scope

### In scope

- Course map, lessons, practice missions, quizzes, progress, certificate.
- Sandbox with Products, Customers, Sales, Credit Book, and Receipts.
- Role switching for Admin, Manager, and Cashier.
- Local data persistence, backup export/import, reset controls.
- Responsive, accessible, offline-first interface.

### Out of scope

- Real authentication, server, multi-device sync, or cloud storage.
- Cost price, profit reports, suppliers, purchase orders, tax/VAT, stock thresholds, barcode hardware.
- True PDF file generation. PDF is produced through the browser's print dialog; PNG is downloaded directly.
- Replicating exact real-software screenshots (none supplied). The layout is a clean, modern training shell with branding centralized for later alignment.

---

## 4. Experience overview

1. Trainee enters a name and starts the course.
2. Course map shows six core modules plus a final assessment.
3. Each module follows the same rhythm: **Learn → Practice → Check**.
4. Practice opens the sandbox at the relevant screen; missions are verified from app state.
5. Passing the quiz and completing all missions marks the module complete.
6. Completing all modules and the final quiz unlocks the certificate.

The sandbox is always available from the sidebar, so trainees can explore freely.

---

## 5. Functional requirements

### 5.1 Welcome and profile

- Name field (required, 2–60 characters), stored locally.
- Three-line explanation of how training works.
- Primary action: Start course, or Resume if progress exists.
- No account, email, or password.

### 5.2 Course map

- Overall progress ring with percentage.
- Module cards showing: number, title, short description, status (Not started, In progress, Complete), best quiz score.
- Primary action: Continue where the trainee left off.
- Welcome module is informational and not scored.

### 5.3 Lesson player

- 3–6 short steps per module, each with a heading and 2–4 sentences.
- Optional callout for a common mistake.
- "Key points" summary at the end.
- "Start practice" action linking to the relevant sandbox screen.
- Reading a lesson sets `lessonRead` for that module.

### 5.4 Sandbox

The sandbox is a working mock inventory app sharing one data store.

**Dashboard**
- Four stat cards only: products, units in stock, sales today, outstanding credit.
- Short list of recent sales.
- No charts, no decorative widgets.

**Products**
- Search by name or SKU.
- Table columns: name, SKU, category, unit, price, stock, actions.
- Add product: name, SKU, category, unit, selling price, opening stock. All required except opening stock (defaults to 0).
- SKU must be unique (case-insensitive). Duplicate SKU blocks save.
- Edit product: same fields, including stock.
- Add stock: quick numeric input that adds to current stock.
- Delete: confirmation modal. Sales keep a frozen snapshot, so history is not corrupted.
- Empty state with a single Add product action.

**Customers**
- Search by name or phone.
- Table columns: name, phone, outstanding balance, actions.
- Add/edit: name and phone required; address optional.
- Delete: blocked when balance is greater than zero, with a clear explanation. Otherwise confirmation modal.
- Customer detail modal shows balance, due date, sales, and payments.

**Sales**
- Two-column layout on desktop: product search/list on the left, cart on the right. Stacked on mobile.
- Add product to cart; quantity cannot exceed available stock.
- Sale-level discount as a fixed Naira amount; cannot exceed subtotal.
- Optional customer selector.
- Payment method: Cash or Credit.
- Credit requires a customer and records a due date (default 14 days, editable).
- Cash sets amount paid equal to total.
- Credit sets amount paid to zero and adds the total to the customer's balance.
- Completing a sale decrements stock, creates a receipt number, and opens receipt preview.
- Empty cart and insufficient stock are blocked with inline messages.
- No change calculator, no split payments.

**Credit Book**
- Customer list with balance, due date, and status (Current, Due soon, Overdue).
- Record payment: amount and date; amount cannot exceed balance.
- Payment history per customer.
- Overdue accounts are visibly labelled, not distinguished by color alone.
- Balances are derived: credit sales total minus payments.

**Receipts**
- List of completed sales with receipt number, date, customer, total, and actions.
- Actions: View, Print / Save PDF, Download PNG.

### 5.5 Quizzes

- Four multiple-choice questions per core module; ten in the final assessment.
- One correct answer each, four options.
- Immediate feedback after each answer with a one-line explanation.
- Pass mark: 80% (4/4 for module quizzes, 8/10 for the final).
- Retry allowed; latest score shown, best score retained for display.
- Answers are not persisted between attempts.

### 5.6 Progress and certificate

- Module complete when: lesson read, all missions verified, quiz passed.
- Progress ring counts six core modules plus the final assessment.
- Certificate requires all seven units complete.
- Certificate shows trainee name, date, final score, and a signature line.
- Print-friendly certificate page.

### 5.7 Settings and data safety

- Edit trainee name.
- Export all data as a versioned JSON file.
- Import JSON with validation; invalid files are rejected without touching existing data.
- Reset practice data (products, customers, sales, payments, roles) while keeping course progress, with confirmation.
- Reset course progress while keeping practice data, with confirmation.
- Reset everything, with confirmation.
- Explicit note that this is a training simulation and not the live shop system.

---

## 6. Module plan

### Module 1 — Products

**Lesson steps**
1. What a product record is and why one record equals one sellable item.
2. The five fields: name, SKU/barcode, category, unit, selling price.
3. Adding stock and editing stock directly.
4. Editing versus deleting, and why deletion needs care.
5. Finding products with search.

**Practice missions**
- Add "Peak Milk 400g" with SKU `MILK-400`, category Dairy, unit pcs, price ₦1,200, stock 24.
- Edit its price to ₦1,250.
- Add 12 units so stock becomes 36.
- Delete the seeded "Test Item" product.

Mission completion is sticky: once verified, it stays complete even if stock later changes through sales.

**Quiz topics:** required fields, unique SKU, price vs stock, effect of delete on sales history.

### Module 2 — Customers

**Lesson steps**
1. Why customer records matter, especially for credit.
2. Creating and editing a customer.
3. Reading a customer's balance.
4. Safe deletion rules.

**Practice missions**
- Add "Grace Okafor" with phone `0803 555 0199`.
- Edit Grace's phone number.
- Attempt to delete Chinedu Eze, who has an overdue balance, and observe the block.
- Delete the seeded zero-balance customer "Walk-in Demo".

**Quiz topics:** required fields, delete conditions, where balances come from, editing details.

### Module 3 — Sales

**Lesson steps**
1. Sales screen layout.
2. Building a cart and changing quantities.
3. Applying a discount.
4. Cash versus credit.
5. How a sale changes stock.

**Practice missions**
- Complete a cash sale of 2 × Peak Milk 400g.
- Complete a credit sale of 1 × Rice 5kg to Grace Okafor.
- Complete a sale with a ₦200 discount.

**Quiz topics:** credit requires a customer, stock decrement, discount limits, payment method behavior.

### Module 4 — Receipts

**Lesson steps**
1. What a receipt proves and which fields matter.
2. Reading the receipt preview.
3. Printing and choosing Save as PDF in the browser dialog.
4. Downloading a PNG copy.

**Practice missions**
- Open the most recent receipt.
- Start the print/save-PDF flow.
- Download a receipt PNG.

**Quiz topics:** receipt number and date, customer and cashier fields, balance due meaning, PDF versus PNG.

### Module 5 — Credit Book

**Lesson steps**
1. How a credit sale becomes a balance.
2. Due dates and overdue accounts.
3. Recording a partial payment.
4. Why a debtor customer cannot be deleted.

**Practice missions**
- Record a ₦1,000 payment for Grace Okafor.
- Open the overdue account belonging to Chinedu Eze.

**Quiz topics:** balance calculation, partial payments, overdue meaning, customer deletion rule.

### Module 6 — Users and data safety

**Lesson steps**
1. The three roles and what each can see.
2. Least privilege: give staff only what they need.
3. Shared-login risks and logging out.
4. Backups, exports, and safe resets.

**Practice missions**
- Switch to the Cashier role.
- Try to open Products as Cashier and observe the restriction.
- Switch back to Admin.
- Export a backup file.

**Quiz topics:** role permissions, restricted access, backup purpose, safe reset behavior.

### Module 7 — Final assessment

- Ten questions covering products, customers, sales, receipts, credit, and roles.
- Pass mark 8/10.
- On pass with all modules complete, unlock the certificate.
- Final checklist of real-world habits.

### Role permission matrix

| Area | Admin | Manager | Cashier |
|---|---|---|---|
| Dashboard | Full | Full | Full |
| Products | Full | Full | No access |
| Customers | Full | Full | No access |
| Sales and receipts | Full | Full | Full |
| Credit Book | Full | Full | No access |
| Settings, backup, users | Full | No access | No access |

Role switching is available in the top bar for training purposes. If a restricted route is opened directly, the page shows a plain explanation and no editable data.

---

## 7. Business rules

1. Prices are whole Naira. Format example: ₦1,250. No kobo, no VAT line.
2. SKU is unique and case-insensitive.
3. Stock cannot go below zero; sales are blocked when quantity exceeds stock.
4. A sale stores a snapshot of item name and price. Later product edits or deletion never change past receipts.
5. Credit sale requires a customer. Due date defaults to 14 days from the sale date.
6. Customer balance equals unpaid credit sales minus recorded payments.
7. Overpayment and payment above balance are blocked.
8. Customer deletion is blocked when balance is greater than zero.
9. Product deletion requires confirmation; the product disappears from the catalogue but remains in past receipts.
10. Receipt numbers are sequential in the form `NSF-0001`, stored in state to avoid reuse.
11. Discount is a fixed Naira amount and cannot exceed subtotal.
12. Role permissions are enforced in both navigation and route rendering.
13. All displayed user input is escaped before rendering.

---

## 8. Receipt specification

**Header**
- Shop name, address, phone.
- Default placeholders: `NASFON Stores`, `Lagos, Nigeria`, `+234 800 000 0000`, editable in config.

**Metadata**
- Receipt number, date and time, cashier name, customer name when present.

**Body**
- Item lines: quantity × unit price, line total.
- Subtotal.
- Discount (shown only when greater than zero).
- Total.

**Payment block**
- Payment method.
- Amount paid.
- Balance due (credit sales; zero for cash).

**Footer**
- "Thank you for your business!"
- Default return policy: "Goods sold are not returnable after 24 hours."
- Both editable in config.

**Output behavior**
- Preview opens in a modal with Print / Save PDF, Download PNG, and Close.
- Print uses a dedicated print stylesheet and the browser's Save as PDF option.
- PNG is drawn by a dedicated canvas renderer at 2× scale, using the same content and a monospace receipt style. Download filename: `receipt-NSF-0001.png`.
- The two renderers must stay in sync through one shared receipt data object.

---

## 9. Data model

Single root object stored under `nasfon_ims_tutor_v1`.

```
{
  version: 1,
  trainee: { name: "" },
  role: "admin" | "manager" | "cashier",
  progress: {
    [moduleId]: {
      lessonRead: boolean,
      quizScore: number | null,
      quizBest: number | null,
      missions: { [missionId]: boolean }
    }
  },
  products: [{
    id, name, sku, category, unit, price, stock, createdAt
  }],
  customers: [{
    id, name, phone, address, createdAt
  }],
  sales: [{
    id, receiptNo, createdAt, cashier, role,
    customerId | null, customerName | null,
    items: [{ productId, name, qty, price }],
    subtotal, discount, total,
    paymentMethod: "cash" | "credit",
    amountPaid, dueDate | null
  }],
  payments: [{
    id, customerId, amount, createdAt, note
  }],
  receiptCounter: number
}
```

**Derived values (not stored)**
- Customer balance.
- Overdue status from earliest unpaid due date.
- Dashboard statistics.

**Identifiers:** `crypto.randomUUID()` with a timestamp fallback.
**Dates:** ISO strings in storage; local formatting in the interface.

---

## 10. Technical architecture

### Files

```
index.html          shell, SVG sprite, script order
css/styles.css      tokens, layout, components, print styles
js/config.js        brand, shop profile, demo users, footer, module order
js/store.js         seed data, storage, validation, CRUD, derived credit
js/lessons.js       module content, missions, quiz questions, final quiz
js/sandbox.js       sandbox screens and interactions
js/receipt.js       receipt data builder, print flow, canvas PNG
js/app.js           hash router, course, quiz, progress, certificate, settings
assets/logo.svg     simple wordmark mark
```

- Classic scripts only, loaded in order. No ES modules, so double-clicking `index.html` works.
- Hash routes: `#/`, `#/course`, `#/module/:id`, `#/practice/:tab`, `#/quiz/:id`, `#/progress`, `#/certificate`, `#/settings`.
- Central render function: state change → save → re-render current route.
- Templates use escaped interpolation for all user-entered text.
- Event delegation per screen; no framework, no build step, no network requests.
- localStorage failure falls back to in-memory state with a visible warning.

### Browser support

Latest Chrome, Edge, Firefox, and Safari. Requires localStorage, canvas, and print. If a browser blocks local storage on `file://`, the intended fallback is running `python3 -m http.server` in the project folder.

---

## 11. Design specification

**Direction:** clean, modern, restrained. One clear primary action per screen. No gradients, illustrations, or decorative charts.

**Tokens**
- Background: `#F8FAFC`
- Surface: `#FFFFFF`
- Primary: `#2563EB`
- Primary hover: `#1D4ED8`
- Accent/success: `#10B981`
- Warning: `#F59E0B`
- Danger: `#DC2626`
- Text: `#0F172A`
- Muted text: `#64748B`
- Border: `#E2E8F0`
- Radius: 12px cards, 8px inputs, 999px pills
- Spacing scale: 4, 8, 12, 16, 24, 32, 48
- Shadow: single soft shadow on cards and modals

**Typography**
- System stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
- Page title 24–28px, section title 18px, body 15–16px, helper 13px.

**Layout**
- Desktop: 240px sidebar, 64px top bar, content max-width 1120px.
- Mobile: top bar with menu, slide-in sidebar, single-column content.
- Lesson pages: content max-width 720px for readability.

**Components**
- Buttons: primary, secondary, ghost, danger; 40px height; visible focus ring.
- Inputs with persistent labels; inline error text below the field.
- Tables collapse to labelled cards on mobile.
- Modals: centred, max 560px, focus trapped, Escape closes.
- Toasts: short confirmations, top-right, auto-dismiss.
- Mission panel: compact checklist with pass/not-yet states.
- Status pills include text, not color alone.

**SVG icon set (inline sprite, 20px strokes):** dashboard, box, users, cart, receipt, wallet, shield, book, check, plus, edit, trash, search, print, download, upload, close, chevron, menu, arrow-right, alert, settings, refresh, logout.

No emoji, no icon fonts, no external assets.

---

## 12. Accessibility and responsive behavior

- Semantic landmarks, one page heading, logical tab order.
- All form controls labelled; errors announced in text.
- Focus visible on every interactive element.
- Modals keep focus inside and return focus on close.
- Minimum 44px touch targets on mobile.
- Tested at 360px, 768px, and 1280px.
- Respect reduced motion for modal and drawer transitions.

---

## 13. Error handling and edge cases

| Case | Behavior |
|---|---|
| Duplicate SKU | Block save, field-level message |
| Missing required field | Block save, inline message |
| Sale quantity above stock | Block add/checkout with message |
| Discount above subtotal | Block checkout with message |
| Credit sale without customer | Block checkout with message |
| Payment above balance | Block with remaining balance shown |
| Delete customer with balance | Block with explanation |
| Invalid import file | Reject, keep existing data, show reason |
| localStorage unavailable | In-memory mode with warning banner |
| Direct access to restricted route | Permission notice, no data controls |
| Empty product/customer/sale lists | Helpful empty state with primary action |
| Double-click on checkout | Button disabled during completion to prevent duplicate sales |

---

## 14. Seed data

**Products (8)**
| Name | SKU | Category | Unit | Price | Stock |
|---|---|---|---|---|---|
| Milo 400g | MILO-400 | Drinks | pcs | 1,500 | 18 |
| Rice 5kg | RICE-5 | Grains | bag | 6,500 | 10 |
| Sugar 1kg | SUG-1 | Groceries | pcs | 900 | 30 |
| Cooking Oil 1L | OIL-1 | Groceries | bottle | 1,800 | 15 |
| Soap 200g | SOAP-2 | Toiletries | pcs | 450 | 40 |
| Soda 50cl | SODA-5 | Drinks | bottle | 300 | 48 |
| Bread Loaf | BRD-1 | Bakery | pcs | 700 | 12 |
| Test Item | TEST-1 | General | pcs | 100 | 5 |

**Customers (4):** Ngozi Obi, Chinedu Eze, Amina Bello, Walk-in Demo (zero balance). Grace Okafor is added by the trainee in Module 2 and is required for the credit-sale missions.

**Users (3):** Nasfon Admin, Ada Manager, Tunde Cashier.

**Sample activity**
- One cash sale today: 2 × Soda 50cl, receipt `NSF-0001`.
- One overdue credit sale 30 days ago: 1 × Rice 5kg to Chinedu Eze, due 16 days ago, unpaid, receipt `NSF-0002`.
- Products Peak Milk 400g and Test Item are seeded intentionally: Peak Milk does not exist yet, so the trainee must add it; Test Item exists so the trainee can practise deletion.
- Receipt counter at 2, so the next sale is `NSF-0003`.
- No payments recorded initially.

Sample data is small on purpose. Trainees add the rest through missions.

---

## 15. Acceptance criteria

1. The app opens offline from `index.html` with no console errors.
2. A trainee can finish every lesson, mission, and quiz; progress survives reload.
3. All module completion rules and the certificate unlock work.
4. Product create, edit, stock addition, search, and guarded delete work.
5. Customer create, edit, guarded delete, and balance display work.
6. Cash and credit sales, discounts, stock decrement, and receipt numbering work.
7. Credit balances, due dates, overdue labels, partial payments, and overpayment blocking work.
8. Receipt preview, print/PDF flow, and PNG download contain every required field.
9. Role switching correctly hides and blocks restricted areas.
10. Backup export/import and the three reset actions behave safely.
11. Layout works at 360px, 768px, and 1280px without horizontal scrolling.
12. Interface text is escaped; no user input can inject markup.
13. No external libraries, fonts, images, or network calls.

---

## 16. Build order

1. Shell, design tokens, router, SVG sprite.
2. Store, seed data, persistence, escaping.
3. Products.
4. Customers.
5. Sales and receipt preview.
6. Print and PNG receipt output.
7. Credit Book.
8. Roles, settings, backup, resets.
9. Lesson content, quizzes, missions, progress, certificate.
10. Responsive and accessibility pass; final manual test.

Each phase is checked in the browser before moving on.

---

## 17. Assumptions and configurable values

- Shop profile, receipt footer, brand name, and currency are placeholders in `js/config.js`.
- No real-software screenshots were provided, so the layout is a clean training shell that can later be aligned to the live product.
- One trainee profile per browser; no multi-user accounts.
- Naira formatting uses `Intl.NumberFormat("en-NG")` with zero decimals.
- PDF means the browser print dialog's Save as PDF; no PDF library is used.
- Training data is fictional and safe to reset.

---

## 18. Approval and status

Approved and implemented.

Implementation notes:

- Mission completion is persisted once verified, so later sales do not undo a completed mission.
- Seed data was adjusted so training missions are not already complete on first launch: Milo 400g replaces the seeded Peak Milk record, and Ngozi Obi replaces the seeded Grace Okafor record.
- The visual shell is a clean training layout because no real-software screenshots were supplied. Brand and shop details remain centralised in `js/config.js`.

