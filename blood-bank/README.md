# Blood Bank Management System

**A front-end, admin-only web application for managing blood donors, donations, inventory, blood requests, compatibility checks and alerts.**

| | |
|---|---|
| **Course** | [Software Engineering 2] |
| **Student** | Rana Shazly (192400698) |
| **Supervisor** | [DR/ Ahmed Othman] |


---

## 1. Project Overview

The system gives a blood bank administrator one dashboard for the daily workflow of a blood bank: registering donors, recording and screening donations, tracking blood units until they are used or discarded, handling hospital and patient requests, and being warned about low stock and expiring blood.

**The Admin is the only user.** Donors, patients and hospitals are records managed by the Admin; they do not log in.

The project is a **front-end prototype**. It is built with plain HTML5, CSS3 and JavaScript (no frameworks, no backend). All data is stored in the browser's LocalStorage.

## 2. How to Run

1. Extract the project folder and keep its structure unchanged (see section 8).
2. Open `login.html` in a modern browser (Chrome or Edge recommended).
3. Sign in with the demo account:

| Username | Password |
|---|---|
| `admin` | `admin123` |

The dashboard charts use Chart.js, loaded from a CDN, so an internet connection is needed for the chart only. Everything else works offline.

**Resetting the demo data:** open the browser DevTools (`F12`), go to the Console, run `localStorage.clear()` and refresh the page.

## 3. Features

| Module | What the Admin can do |
|---|---|
| **Authentication** | Login with validation, show/hide password, logout, change password, session handling (the dashboard redirects to login if there is no session). |
| **Dashboard** | Summary cards (donors, available units, donations, pending requests, low-stock types, expiring units), blood-type inventory chart, open alerts, recent donations and requests. |
| **Donor Management** | Add, edit, view profile and donation history, activate/deactivate, search by name or ID, filter by blood type and eligibility. |
| **Donation Management** | Register a donation for an eligible donor, record screening result, accept or reject, search and filter by status and date. |
| **Blood Inventory** | Add units, discard units, search by unit ID, filter by blood type and status, automatic expiry detection. |
| **Blood Requests** | Create and edit requests, approve (with automatic allocation), issue units, reject or cancel, view full status history, filter by status, priority, blood type and date. |
| **Compatibility Checker** | Select a recipient blood type and see compatible donor types, available quantities, earliest expiry and an "expiring soon" flag. |
| **Alerts & Notifications** | Automatic alerts, activity notifications, unread counter on the bell, mark as read, resolve, filter by type and status. |
| **Settings** | Update the admin profile, change the password, set the minimum stock for each blood type, set the expiration warning period. |
| **Global features** | Global search (Enter in the top bar), click-to-sort on every table column, confirmation dialogs, toast messages, responsive layout. |

## 4. Business Rules

### Donors
- **Eligibility is calculated automatically**: age between 18 and 65, weight of at least 50 kg, and at least 56 days since the last donation. A donor who fails a rule is shown as *Ineligible* or *Deferred (56-day rule)*.
- **Active / Inactive is an Admin decision.** Donors are never deleted, because that would break their donation history. An inactive donor is shown as *Inactive* regardless of the rules and cannot be selected for a new donation.

### Donations
- Only donors with the status *Eligible* can be selected.
- A donation starts as **Pending** and can be processed **once**: it becomes either *Accepted* or *Rejected*.
- **Only an accepted donation with passed screening creates a blood unit.** A rejected donation never changes the inventory, and a donation with failed screening cannot be accepted.
- Accepting a donation also updates the donor's last donation date.

### Blood units
- One accepted donation produces **one unit of 450 ml**.
- **Expiration date = collection date + 42 days.**
- Statuses: *Available, Reserved, Used, Expired, Discarded*. An *Available* unit past its expiry date becomes *Expired* automatically.
- Expired, discarded and used units can never be allocated again. Only *Available* or *Expired* units can be discarded; discarded units stay in the table as a record.

### Requests and allocation
- Every request needs valid requester, contact, blood type and quantity data. Hospital requests also require a hospital name.
- **Approve** allocates units automatically: compatible, unexpired, available units only; **same blood type first**, then compatible types; **earliest expiry first**. Allocation never exceeds the available stock, and a partial allocation is allowed (the Admin sees the units before confirming).
- Approved requests **reserve** the units. **Issue** changes them to *Used* and sets the request to *Fulfilled*, or *Partially Fulfilled* if fewer units than requested were issued.
- Rejecting or cancelling an approved request returns its reserved units to *Available*.
- Every status change is recorded in the request history. Priority (Emergency, Urgent, Normal) orders the table and raises an alert.

### Compatibility
- Standard ABO and Rh red blood cell rules are used.
- **This is preliminary guidance only and does not replace laboratory crossmatching or medical approval.**

### Alerts
| Alert | Condition | Cleared when |
|---|---|---|
| Low Stock | Available units of a type fall below its minimum | Stock returns to the minimum or above |
| Expiring | A unit expires within the warning period (default 7 days) | The unit is issued or discarded |
| Expired | A unit has passed its expiry date | The unit is discarded |
| Urgent Request | A pending request has Urgent or Emergency priority | The request is processed |
| Pending Request | A request has been pending for 2 days or more | The request is processed |
| Activity | Unit added or discarded; donation or request created, accepted, approved, issued or rejected | Marked read or resolved by the Admin |

Each condition has a unique key (for example `low:A+`), so **the same unresolved condition never produces a duplicate alert.** Alerts are regenerated whenever data changes or a page loads.

## 5. Data Model (LocalStorage key `bbms`)

All modules read and write one shared object, so a change in one module appears in the others immediately.

| Collection | Main fields |
|---|---|
| `donors` | id, name, age, gender, phone, email, address, bt (blood type), weight, last (last donation), reg (registration date), active |
| `donations` | id, donorId, donor, date, qty, screening, status |
| `units` | id, type, collected, expires, status |
| `requests` | id, type, patient, hospital, contact, bt, qty, date, priority, status, units, history |
| `alerts` | key, type, msg, date, status |
| `admin`, `min`, `warn` | admin account, minimum stock per blood type, expiration warning days |

## 6. Typical Workflow (for demonstration)

1. **Donors** > *Add donor*, then confirm the new donor shows as *Eligible*.
2. **Donations** > *Register donation* for that donor with screening *Passed*.
3. *Accept* the donation, then open **Inventory** and check that a new unit of the donor's blood type appears with an expiry date 42 days ahead.
4. **Requests** > *New request*, then use the **Compatibility Checker** to review compatible stock.
5. *Approve* the request, check the units shown for reservation, then confirm. The units become *Reserved*.
6. *Issue* the units. They become *Used* and the available stock decreases.
7. Open **Alerts** and check the low-stock and expiration alerts and the activity notifications.
8. Refresh the browser and confirm that the data is still there.

## 7. Technologies

- HTML5, CSS3 (responsive layout with Flexbox and Grid, CSS animations), JavaScript (ES6).
- Chart.js (CDN) for the dashboard chart.
- Inline SVG icons.
- LocalStorage for persistence, SessionStorage for the login session.

## 8. Project Structure

```
blood-bank/
├── login.html          Admin login page
├── index.html          Application shell (sidebar, top bar, page container)
├── css/
│   └── style.css       All styles
├── js/
│   ├── storage.js      Data layer: sample data, LocalStorage, eligibility,
│   │                   compatibility table, alert generation
│   └── app.js          Pages, tables, forms, modals, workflows, routing
├── img/
│   └── logo.png        System logo
└── README.md
```

## 9. Limitations and Future Work

- **Not production security.** Authentication is client-side only and the demo password is stored as plain text in LocalStorage. A real system needs a server, hashed passwords and role-based access.
- **No backend or multi-user support.** Data lives in one browser on one device; clearing the browser data deletes it.
- Blood unit details cannot be edited after creation (units can be added or discarded), and unit status is changed only through the workflows (donation, request, discard), not manually.
- Only red blood cell compatibility is covered; plasma, platelets and crossmatching are out of scope.
- Possible extensions: a backend with a database, report export (PDF/Excel), an audit log, a donor appointment calendar, and an Arabic/English interface.
