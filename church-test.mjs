import { chromium } from 'playwright';

const BASE  = 'http://localhost:5173';
const EMAIL = 'shadrach.adamu@gmail.com';
const PASS  = 'Ubandomaadamu@24';

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox'],
});

const ctx  = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors  = [];
const results = [];

page.on('pageerror', e => errors.push({ page: page.url(), type: 'JS', msg: e.message }));
page.on('response',  r => {
  if (r.status() >= 400 && r.url().includes('9911'))
    errors.push({ page: page.url(), type: r.status(), msg: r.url().replace('http://localhost:9911','') });
});
// Track POST calls to diagnose form submissions
const posts = [];
page.on('request', r => { if (r.method() === 'POST' && r.url().includes('9911')) posts.push(r.url().replace('http://localhost:9911','')); });

const ss   = async (name) => page.screenshot({ path: `/tmp/ss-${name}.png`, fullPage: false });
const ok   = (s, n='') => { results.push({ s, status: '✅', n }); console.log(`  ✅ ${s}${n?' — '+n:''}`); };
const fail = (s, n='') => { results.push({ s, status: '❌', n }); console.log(`  ❌ ${s}${n?' — '+n:''}`); };
const info = (s, n='') => { results.push({ s, status: 'ℹ️', n }); console.log(`  ℹ️  ${s}${n?': '+n:''}`); };

const nav = async (path) => {
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 20000 });
  // Wait for any Suspense spinner to clear
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
};

// Click the LAST button matching text (avoids backdrop-blocked header buttons)
const clickLast = async (text) => {
  await page.locator(`button:has-text("${text}")`).last().click({ timeout: 10000 });
  await page.waitForTimeout(1000);
};

// Click first button by text using JS eval — bypasses Playwright z-index/visibility checks
const jsClick = async (text) => {
  const found = await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes(t) && !b.disabled);
    if (btn) { btn.click(); return true; }
    return false;
  }, text);
  await page.waitForTimeout(800);
  return found;
};

// Fill an input by finding it via its label text — bypasses wrong-element issues with .first()
const jsFillByLabel = async (labelText, value) => {
  const found = await page.evaluate(([lt, v]) => {
    const labels = [...document.querySelectorAll('label')];
    const label = labels.find(l => l.textContent?.includes(lt));
    if (!label) return false;
    const input = label.closest('div')?.querySelector('input, textarea, select');
    if (!input) return false;
    const setter = input.tagName === 'SELECT' ? null
      : Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        ?? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    if (setter) { setter.call(input, v); } else { input.value = v; }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, [labelText, value]);
  return found;
};

// Click LAST button by text using JS eval — used for form submit (avoids re-clicking the header trigger)
const jsClickLast = async (text) => {
  const found = await page.evaluate((t) => {
    const btns = [...document.querySelectorAll('button')].filter(b => b.textContent?.includes(t) && !b.disabled);
    if (btns.length > 0) { btns[btns.length - 1].click(); return true; }
    return false;
  }, text);
  await page.waitForTimeout(800);
  return found;
};

// Close any open drawer/modal: click Cancel button or the backdrop overlay
const closeDrawer = async () => {
  const cancelBtn = page.locator('button:has-text("Cancel")');
  if (await cancelBtn.count() > 0) {
    await cancelBtn.last().click({ timeout: 2000 }).catch(() => {});
  } else {
    // Click the semi-transparent backdrop (fixed overlay z-index:40)
    const backdrop = page.locator('div[style*="z-index: 40"]').first();
    if (await backdrop.count() > 0) {
      await backdrop.click({ force: true, timeout: 2000 }).catch(() => {});
    }
  }
  await page.waitForTimeout(600);
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
console.log('\n═══ LOGIN ═══');
await nav('/login');
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASS);
await page.click('button[type="submit"]');
await page.waitForURL(/\/(dashboard|onboard)/, { timeout: 15000 });
ok('Login', page.url().includes('dashboard') ? 'dashboard' : page.url());
await ss('01-dashboard');

// ─── MEMBERS ─────────────────────────────────────────────────────────────────
console.log('\n═══ MEMBERS ═══');
try {
  await nav('/members');
  // Wait for the table or empty state to render before counting rows
  await page.waitForSelector('table, [style*="Add your first member"]', { timeout: 10000 }).catch(() => {});
  const rows = await page.locator('tbody tr').count();
  info('Members list', rows + ' rows');
  await ss('03-members');

  // Use jsClick to bypass any overlay / z-index issues in headless mode
  const clicked = await jsClick('Add Member');
  if (!clicked) throw new Error('Add Member button not found in DOM');
  await page.fill('input[placeholder="John Doe"]', 'Test Member');
  await page.fill('input[placeholder="john@example.com"]', 'testmember@example.com');
  await page.fill('input[placeholder="+234..."]', '08099887766');
  await ss('04-add-member-form');
  await jsClickLast('Save Member');  // submit button text is "Save Member" not "Add Member"
  await page.waitForTimeout(2500);  // Wait for API POST + refetch
  const postsSoFar = [...posts];
  const memberPost = postsSoFar.find(p => p.includes('/members'));
  info('Members POST fired', memberPost ?? 'none');
  const after = await page.locator('tbody tr').count();
  after > rows ? ok('Add Member', 'appeared in list') : fail('Add Member', 'count unchanged — check backend required fields');
  await ss('05-members-after-add');
} catch(e) { fail('Members', e.message.slice(0,100)); }

// ─── MEMBER DETAIL ───────────────────────────────────────────────────────────
console.log('\n═══ MEMBER DETAIL ═══');
try {
  // Use JS eval to navigate since Playwright a[href] selector doesn't work in this app
  const navigated = await page.evaluate(() => {
    const link = [...document.querySelectorAll('a')].find(a => a.href.includes('/members/') && !a.href.includes('/api/'));
    if (link) { link.click(); return true; }
    return false;
  });
  if (navigated) {
    await page.waitForURL(/\/members\/.+/, { timeout: 10000 });
    await page.waitForTimeout(800);
    await ss('06-member-detail');
    ok('Member Detail', 'opened');
    await page.goBack(); await page.waitForTimeout(500);
  } else { info('Member Detail', 'no member link found in DOM'); }
} catch(e) { fail('Member Detail', e.message.slice(0,100)); }

// ─── PASTORS ─────────────────────────────────────────────────────────────────
console.log('\n═══ PASTORS ═══');
try {
  await nav('/pastors');
  await ss('07-pastors');
  // Button text is "Appoint Pastor" in PastorsPage
  if (await jsClick('Appoint Pastor')) {
    await page.waitForTimeout(500);
    await ss('08-add-pastor-form'); await closeDrawer();
    ok('Pastors add form', 'opens');
  } else { info('Pastors', 'no Appoint Pastor button found'); }
} catch(e) { fail('Pastors', e.message.slice(0,100)); }

// ─── FELLOWSHIPS ─────────────────────────────────────────────────────────────
console.log('\n═══ FELLOWSHIPS ═══');
try {
  await nav('/fellowships');
  await ss('09-fellowships');
  const addBtn = page.locator('button:has-text("Create"), button:has-text("New Fellowship"), button:has-text("Add Fellowship")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('10-add-fellowship-form'); await closeDrawer();
    ok('Fellowships add form', 'opens');
  } else { info('Fellowships', 'no add button found'); }
} catch(e) { fail('Fellowships', e.message.slice(0,100)); }

// ─── VOLUNTEERS ──────────────────────────────────────────────────────────────
console.log('\n═══ VOLUNTEERS ═══');
try {
  await nav('/volunteers');
  await ss('11-volunteers');
  ok('Volunteers page', 'loaded');
} catch(e) { fail('Volunteers', e.message.slice(0,100)); }

// ─── FAMILIES ────────────────────────────────────────────────────────────────
console.log('\n═══ FAMILIES ═══');
try {
  await nav('/families');
  await ss('12-families');
  const rows = await page.locator('tbody tr').count();
  info('Families list', rows + ' rows');

  const addBtn = page.locator('button:has-text("Add Family"), button:has-text("New Family")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('13-add-family-form'); await closeDrawer();
    ok('Families add form', 'opens');
  }

  const manageBtn = page.locator('button:has-text("Manage")').first();
  if (await manageBtn.count() > 0) {
    await manageBtn.click(); await page.waitForTimeout(1500);
    await ss('14-family-detail');
    const backBtn = page.locator('button:has-text("Back"), button:has-text("← Back")').first();
    if (await backBtn.count() > 0) await backBtn.click();
    ok('Family detail', 'opened');
  }
} catch(e) { fail('Families', e.message.slice(0,100)); }

// ─── PASTORAL ────────────────────────────────────────────────────────────────
console.log('\n═══ PASTORAL ═══');
try {
  await nav('/pastoral');
  await ss('15-pastoral');
  // Button is "Record Visitor"
  const addBtn = page.locator('button:has-text("Record Visitor"), button:has-text("Add Visitor"), button:has-text("New Visitor")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await page.fill('input[placeholder*="name" i]', 'John Doe Visitor');
    await page.fill('input[type="date"]', '2026-06-22');
    await ss('16-add-visitor-form');
    await jsClickLast('Record Visitor');
    ok('Add Visitor', 'submitted');
    await ss('15b-pastoral-after');
  } else { info('Pastoral', 'no Record Visitor button'); }
} catch(e) { fail('Pastoral', e.message.slice(0,100)); }

// ─── PROPERTY ────────────────────────────────────────────────────────────────
console.log('\n═══ PROPERTY ═══');
try {
  await nav('/property');
  await ss('17-property');
  const rows = await page.locator('tbody tr').count();
  info('Assets', rows + ' rows');

  if (await jsClick('Add Asset')) {
    // Use label-based selector to avoid hitting the search bar
    await jsFillByLabel('ASSET NAME', 'Test Piano');
    await ss('18-add-asset-form');
    await jsClickLast('Add Asset');  // click submit (not header trigger)
    await page.waitForTimeout(2000);
    const after = await page.locator('tbody tr').count();
    after > rows ? ok('Add Asset', 'appeared in list') : fail('Add Asset', 'count unchanged');
    await ss('19-property-after-add');
  } else { info('Property', 'Add Asset button not found'); }
} catch(e) { fail('Property', e.message.slice(0,100)); }

// ─── EVENTS ──────────────────────────────────────────────────────────────────
console.log('\n═══ EVENTS ═══');
try {
  await nav('/events');
  await ss('20-events');
  const count = await page.locator('tbody tr').count();
  info('Events', count + ' rows');

  if (await jsClick('Create Event') || await jsClick('New Event')) {
    // Placeholder: "e.g. Annual Conference 2026"
    await page.fill('input[placeholder*="Conference"], input[placeholder*="Annual"], input[placeholder*="title" i]', 'Test Church Conference').catch(() => {});
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() > 0) await dateInputs.first().fill('2026-08-01');
    if (await dateInputs.count() > 1) await dateInputs.nth(1).fill('2026-08-03');
    await ss('21-create-event-form');
    await jsClickLast('Create Event');  // click submit
    await page.waitForTimeout(2000);
    ok('Create Event', 'submitted');
    await ss('22-events-after');
  } else { info('Events', 'no Create Event button found'); }

  // Event detail via JS navigation (Playwright a[href] selector doesn't work in this app)
  const evtNavigated = await page.evaluate(() => {
    const link = [...document.querySelectorAll('a')].find(a => a.href.includes('/events/') && !a.href.includes('/api/'));
    if (link) { link.click(); return true; }
    return false;
  });
  if (evtNavigated) {
    await page.waitForURL(/\/events\/.+/, { timeout: 10000 });
    await page.waitForTimeout(800);
    await ss('23-event-detail');
    ok('Event Detail', 'opened');
    await page.goBack(); await page.waitForTimeout(500);
  } else { info('Events', 'no event detail link found'); }
} catch(e) { fail('Events', e.message.slice(0,100)); }

// ─── SERVICE ─────────────────────────────────────────────────────────────────
console.log('\n═══ SERVICE ═══');
try {
  await nav('/service');
  await ss('24-service');

  // Schedule service (now requires startTime)
  await jsClick('Schedule Service');
  await page.fill('input[placeholder*="Service"]', 'Sunday Morning Service').catch(() => page.locator('input[type="text"]').first().fill('Sunday Morning Service'));
  await page.fill('input[type="date"]', '2026-06-28');
  await page.locator('select').first().selectOption('SUNDAY_SERVICE').catch(() => {});
  await page.fill('input[type="time"]', '09:00');
  await ss('25-schedule-service-form');
  await jsClickLast('Schedule Service');  // click submit
  await page.waitForTimeout(1500);
  ok('Schedule Service', 'submitted');
  await ss('26-service-after-schedule');

  // Switch to Sermon Library tab then add sermon
  const sermonTabClicked = await jsClick('Sermon Library');
  if (!sermonTabClicked) await jsClick('📖');
  await page.waitForTimeout(500);
  await jsClick('Add Sermon');
  await page.fill('input[placeholder*="title" i], input[placeholder*="sermon" i]', 'Walking in Faith').catch(() => page.locator('input[type="text"]').first().fill('Walking in Faith'));
  await page.locator('input[type="date"]').first().fill('2026-06-28').catch(() => {});
  await ss('27-add-sermon-form');
  await jsClickLast('Add Sermon');  // click submit
  await page.waitForTimeout(1000);
  ok('Add Sermon', 'submitted');
  await ss('28-service-after-sermon');
} catch(e) { fail('Service', e.message.slice(0,100)); }

// ─── ACTIVITY ────────────────────────────────────────────────────────────────
console.log('\n═══ ACTIVITY ═══');
try {
  await nav('/activity');
  await ss('29-activity');
  ok('Activity page', 'loaded');
  const addBtn = page.locator('button[style*="gradient"], button:has-text("Add"), button:has-text("New"), button:has-text("Log")').first();
  if (await addBtn.count() > 0) {
    const btnText = await addBtn.innerText();
    info('Activity CTA', btnText);
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('30-activity-form'); await closeDrawer();
  }
} catch(e) { fail('Activity', e.message.slice(0,100)); }

// ─── COLLECTIONS ─────────────────────────────────────────────────────────────
console.log('\n═══ COLLECTIONS ═══');
try {
  await nav('/collections');
  await ss('31-collections');
  const rows = await page.locator('tbody tr').count();
  info('Contribution rows', rows);

  await page.click('button:has-text("Log Contribution")');
  await page.waitForTimeout(500);
  const mSel = page.locator('select').first();
  if (await mSel.locator('option').count() > 1) await mSel.selectOption({ index: 1 });
  await page.locator('select').nth(1).selectOption('OFFERING');
  await page.locator('select').nth(2).selectOption('POS');
  await page.fill('input[type="number"]', '10000');
  await page.fill('input[type="date"]', '2026-06-22');
  await ss('32-log-contribution-form');
  await page.locator('button:has-text("Log Contribution")').last().click();
  await page.waitForTimeout(1500);
  const after = await page.locator('tbody tr').count();
  after > rows ? ok('Log Contribution', 'appeared in list') : fail('Log Contribution', 'count unchanged');

  // Register Pledge
  await page.click('button:has-text("Register Pledge")');
  await page.waitForTimeout(500);
  const pSel = page.locator('select').first();
  if (await pSel.locator('option').count() > 1) await pSel.selectOption({ index: 1 });
  await page.fill('input[placeholder*="Building"]', 'Building Fund 2026');
  await page.fill('input[type="number"]', '50000');
  await page.fill('input[type="date"]', '2026-12-31');
  await ss('33-pledge-form');
  await jsClickLast('Register Pledge');
  ok('Register Pledge', 'submitted');
} catch(e) { fail('Collections', e.message.slice(0,100)); }

// ─── EXPENSES ────────────────────────────────────────────────────────────────
console.log('\n═══ EXPENSES ═══');
try {
  await nav('/expenses');
  const rows = await page.locator('tbody tr').count();
  info('Expense rows', rows);

  // Add category first
  await page.click('button:has-text("Add Category")');
  await page.waitForTimeout(500);
  await page.fill('input[placeholder*="Utilities"]', 'Office Supplies');
  await jsClickLast('Add Category');
  await page.waitForTimeout(1000); ok('Add Category', 'submitted');

  await nav('/expenses');

  // Log expense
  await jsClick('Log Expense');
  const catSel = page.locator('select').first();
  const catOpts = await catSel.locator('option').count();
  info('Categories available', catOpts - 1 + ' cats');
  if (catOpts > 1) {
    await catSel.selectOption({ index: 1 });
    await jsFillByLabel('RECIPIENT / VENDOR', 'Test Vendor Co');
    await page.fill('input[type="number"]', '5000');
    await page.fill('input[type="date"]', '2026-06-22');
    await ss('36-log-expense-form');
    await jsClickLast('Log Expense');  // click submit (not header trigger)
    await page.waitForTimeout(2000);
    const after = await page.locator('tbody tr').count();
    after > rows ? ok('Log Expense', 'appeared in list') : fail('Log Expense', 'count unchanged');
    await ss('37-expenses-after-add');
  } else { fail('Log Expense', 'no categories'); await closeDrawer(); }

  // Allocate Budget
  await nav('/expenses');
  await jsClick('Allocate Budget');
  const bSel = page.locator('select').first();
  if (await bSel.locator('option').count() > 1) {
    await bSel.selectOption({ index: 1 });
    await page.fill('input[type="number"]', '100000');
    const d = page.locator('input[type="date"]');
    await d.first().fill('2026-07-01'); await d.nth(1).fill('2026-07-31');
    await ss('38-allocate-budget-form');
    await jsClickLast('Allocate Budget');  // click submit
    await page.waitForTimeout(1000); ok('Allocate Budget', 'submitted');
  } else { fail('Allocate Budget', 'no categories'); await closeDrawer(); }
} catch(e) { fail('Expenses', e.message.slice(0,100)); }

// ─── BRANCHES ────────────────────────────────────────────────────────────────
console.log('\n═══ BRANCHES ═══');
try {
  await nav('/branches');
  await ss('39-branches'); ok('Branches page', 'loaded');
  const addBtn = page.locator('button:has-text("Add Branch"), button:has-text("New Branch"), button:has-text("Create Branch")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('40-add-branch-form'); await closeDrawer(); ok('Branch add form', 'opens');
  }
} catch(e) { fail('Branches', e.message.slice(0,100)); }

// ─── PROJECTS ────────────────────────────────────────────────────────────────
console.log('\n═══ PROJECTS ═══');
try {
  await nav('/projects');
  await ss('41-projects'); ok('Projects page', 'loaded');
  const addBtn = page.locator('button:has-text("Add Project"), button:has-text("New Project"), button:has-text("Create Project")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('42-add-project-form'); await closeDrawer(); ok('Project add form', 'opens');
  }
} catch(e) { fail('Projects', e.message.slice(0,100)); }

// ─── PRAYER ──────────────────────────────────────────────────────────────────
console.log('\n═══ PRAYER ═══');
try {
  await nav('/prayer');
  await ss('43-prayer'); ok('Prayer page', 'loaded');
  const addBtn = page.locator('button:has-text("Add Prayer"), button:has-text("New Request"), button:has-text("Submit Prayer"), button:has-text("Submit Request")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('44-add-prayer-form'); await closeDrawer(); ok('Prayer add form', 'opens');
  }
} catch(e) { fail('Prayer', e.message.slice(0,100)); }

// ─── CHILDREN ────────────────────────────────────────────────────────────────
console.log('\n═══ CHILDREN ═══');
try {
  await nav('/children');
  await ss('45-children'); ok('Children page', 'loaded');
  const addBtn = page.locator('button:has-text("Add Child"), button:has-text("Register Child"), button:has-text("New Child")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('46-add-child-form'); await closeDrawer(); ok('Children add form', 'opens');
  }
} catch(e) { fail('Children', e.message.slice(0,100)); }

// ─── COMMUNICATION ───────────────────────────────────────────────────────────
console.log('\n═══ COMMUNICATION ═══');
try {
  await nav('/communication');
  await ss('47-communication'); ok('Communication page', 'loaded');
  const addBtn = page.locator('button:has-text("Compose"), button:has-text("Send"), button:has-text("New Message"), button:has-text("New Campaign")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('48-communication-form'); await closeDrawer(); ok('Communication form', 'opens');
  }
} catch(e) { fail('Communication', e.message.slice(0,100)); }

// ─── LMS ─────────────────────────────────────────────────────────────────────
console.log('\n═══ LMS ═══');
try {
  await nav('/lms');
  await ss('49-lms'); ok('LMS page', 'loaded');
  const addBtn = page.locator('button:has-text("Add Course"), button:has-text("New Course"), button:has-text("Create Course")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('50-add-course-form'); await closeDrawer(); ok('LMS add form', 'opens');
  }
} catch(e) { fail('LMS', e.message.slice(0,100)); }

// ─── HR ──────────────────────────────────────────────────────────────────────
console.log('\n═══ HR ═══');
try {
  await nav('/hr');
  await ss('51-hr'); ok('HR page', 'loaded');
  const addBtn = page.locator('button:has-text("Add Staff"), button:has-text("New Staff"), button:has-text("Add Employee")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('52-add-staff-form'); await closeDrawer(); ok('HR add form', 'opens');
  }
} catch(e) { fail('HR', e.message.slice(0,100)); }

// ─── FACILITY ────────────────────────────────────────────────────────────────
console.log('\n═══ FACILITY ═══');
try {
  await nav('/facility');
  await ss('53-facility'); ok('Facility page', 'loaded');
  const addBtn = page.locator('button:has-text("Add Facility"), button:has-text("Book"), button:has-text("New Facility")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('54-facility-form'); await closeDrawer(); ok('Facility form', 'opens');
  }
} catch(e) { fail('Facility', e.message.slice(0,100)); }

// ─── USERS ───────────────────────────────────────────────────────────────────
console.log('\n═══ USERS ═══');
try {
  await nav('/users');
  await ss('55-users'); ok('Users page', 'loaded');
  const addBtn = page.locator('button:has-text("Add User"), button:has-text("Create User"), button:has-text("Invite User")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('56-add-user-form'); await closeDrawer(); ok('User add form', 'opens');
  }
} catch(e) { fail('Users', e.message.slice(0,100)); }

// ─── ROLES ───────────────────────────────────────────────────────────────────
console.log('\n═══ ROLES ═══');
try {
  await nav('/roles');
  await ss('57-roles'); ok('Roles page', 'loaded');
  const addBtn = page.locator('button:has-text("Add Role"), button:has-text("Create Role"), button:has-text("New Role")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('58-add-role-form'); await closeDrawer(); ok('Role add form', 'opens');
  }
} catch(e) { fail('Roles', e.message.slice(0,100)); }

// ─── REPORTS ─────────────────────────────────────────────────────────────────
console.log('\n═══ REPORTS ═══');
try {
  await nav('/reports');
  await ss('59-reports'); ok('Reports page', 'loaded');
} catch(e) { fail('Reports', e.message.slice(0,100)); }

// ─── BILLING ─────────────────────────────────────────────────────────────────
console.log('\n═══ BILLING ═══');
try {
  await nav('/billing');
  await page.waitForTimeout(1500);
  await ss('60-billing');
  const plans = await page.locator('[style*="borderRadius"]:has-text("Plan")').count();
  info('Billing plans visible', plans);
  ok('Billing page', 'loaded');
} catch(e) { fail('Billing', e.message.slice(0,100)); }

// ─── TEMPLATES ───────────────────────────────────────────────────────────────
console.log('\n═══ TEMPLATES ═══');
try {
  await nav('/templates');
  await ss('61-templates'); ok('Templates page', 'loaded');
} catch(e) { fail('Templates', e.message.slice(0,100)); }

// ─── WORKFLOWS ───────────────────────────────────────────────────────────────
console.log('\n═══ WORKFLOWS ═══');
try {
  await nav('/workflows');
  await ss('62-workflows'); ok('Workflows page', 'loaded');
} catch(e) { fail('Workflows', e.message.slice(0,100)); }

// ─── CEMETERY ────────────────────────────────────────────────────────────────
console.log('\n═══ CEMETERY ═══');
try {
  await nav('/cemetery');
  await ss('63-cemetery'); ok('Cemetery page', 'loaded');
  const addBtn = page.locator('button:has-text("Add"), button:has-text("New Record"), button:has-text("Register")').first();
  if (await addBtn.count() > 0) {
    await addBtn.click(); await page.waitForTimeout(500);
    await ss('64-cemetery-form'); await closeDrawer(); ok('Cemetery form', 'opens');
  }
} catch(e) { fail('Cemetery', e.message.slice(0,100)); }

// ─── SETTINGS ────────────────────────────────────────────────────────────────
console.log('\n═══ SETTINGS ═══');
try {
  await nav('/settings');
  await ss('65-settings'); ok('Settings page', 'loaded');
} catch(e) { fail('Settings', e.message.slice(0,100)); }

await browser.close();

// ─── REPORT ──────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('FULL TEST REPORT');
console.log('═'.repeat(60));
results.forEach(r => console.log(`${r.status} ${r.s}${r.n?' — '+r.n:''}`));

if (errors.length > 0) {
  console.log('\n─── BACKEND / JS ERRORS ───');
  const seen = new Set();
  errors.forEach(e => { const k=`${e.type}|${e.msg}`; if(!seen.has(k)){seen.add(k);console.log(`  [${e.type}] ${e.msg}`);}});
} else {
  console.log('\n✅ Zero errors recorded');
}
console.log('\n─── ALL POST REQUESTS MADE ───');
posts.forEach(p => console.log(' ', p));
