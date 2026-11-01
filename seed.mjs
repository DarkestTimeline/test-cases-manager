/**
 * Seed script — QA Test Case Manager
 *
 * Wipes and refills projects, modules, test_cases, suites, runs, and
 * run_results with realistic volume so the app looks/behaves like it has
 * real usage. Real `profiles` rows are left untouched and reused for
 * `started_by`.
 *
 * Creates four projects, each with its own modules, cases, suites and runs:
 *   DEMO     Demo Storefront         the original demo data (web)
 *   DEMOIOS  Demo Storefront — iOS   a platform variant of the same product
 *   DEMOAPI  Demo Storefront — API   a different kind of test target
 *   LEGACY   Legacy Portal           small and ARCHIVED, for archived-project UI
 *
 * Case IDs use the project code (DEMO-01, DEMOIOS-01, ...); numbering is
 * assigned per project by the database, not by this script.
 *
 * Setup:
 *   npm install @supabase/supabase-js dotenv
 *
 * .env.local must contain:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   (service role, NOT the anon key — bypasses RLS)
 *
 * Run:
 *   node seed.mjs
 *   (it will print the target Supabase project URL and ask you to type "yes"
 *   before wiping anything — read that line before confirming)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'node:readline/promises';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---------- random helpers ----------

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function weightedPick(pairs) {
  const total = pairs.reduce((sum, [, weight]) => sum + weight, 0);
  let r = Math.random() * total;
  for (const [value, weight] of pairs) {
    if (r < weight) return value;
    r -= weight;
  }
  return pairs[pairs.length - 1][0];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// Same format the app shows: project code + number padded to two digits.
const caseCode = (projectCode, seqNumber) =>
  `${projectCode}-${String(seqNumber).padStart(2, '0')}`;

// ---------- content ----------

// DEMO: the original demo data, unchanged.
const DEMO_MODULES = [
  { name: 'Authentication', description: 'Login, signup, password reset, session handling' },
  { name: 'User Profile & Settings', description: 'Profile editing, preferences, account management' },
  { name: 'Checkout & Payments', description: 'Cart, payment methods, order confirmation' },
  { name: 'Search & Filtering', description: 'Search results, filters, sorting, pagination' },
  { name: 'Notifications', description: 'In-app and email notification delivery and preferences' },
  { name: 'Admin Dashboard', description: 'User management, reporting, system configuration' },
];

const DEMO_CASE_TEMPLATES = {
  'Authentication': [
    ['Login with valid credentials', 'User is on the login page with an active account', 'Log in with a correct email and password', 'User is redirected to the dashboard and a session is created'],
    ['Login with incorrect password', 'User is on the login page', 'Enter a valid email with an incorrect password and submit', 'An "invalid credentials" error is shown and no session is created'],
    ['Login with unregistered email', 'User is on the login page', 'Enter an email not associated with any account', 'An "invalid credentials" error is shown, without revealing the account does not exist'],
    ['Password reset request', 'User has an existing account', 'Request a password reset using the account email', 'A reset email is sent and a confirmation message is shown'],
    ['Password reset with expired token', 'User has requested a password reset more than 24 hours ago', 'Open the reset link and attempt to set a new password', 'An "expired link" message is shown and the password is not changed'],
    ['Signup with invite code', 'User has a valid invite code', 'Complete signup using the invite code, email, and password', 'Account is created and user is redirected to onboarding'],
    ['Signup with invalid invite code', 'User does not have a valid invite code', 'Attempt to sign up using a made-up invite code', 'Signup is blocked with an "invalid invite code" error'],
    ['Session persists after refresh', 'User is logged in', 'Refresh the page', 'User remains logged in and lands on the same view'],
    ['Logout clears session', 'User is logged in', 'Click logout', 'User is redirected to the login page and cannot access protected routes'],
    ['Account deactivation blocks login', 'User account has been deactivated by an admin', 'Attempt to log in with valid credentials', 'Login is blocked with an "account inactive" message'],
  ],
  'User Profile & Settings': [
    ['Update display name', 'User is logged in and on the settings page', 'Change the display name and save', 'The new display name is saved and reflected across the app'],
    ['Update display name with empty value', 'User is on the settings page', 'Clear the display name field and attempt to save', 'A validation error is shown and the previous name is retained'],
    ['Change email address', 'User is logged in', 'Enter a new valid email and confirm the change', 'A confirmation is sent to the new address before the change takes effect'],
    ['Upload profile avatar', 'User is on the settings page', 'Upload a valid image file as an avatar', 'The avatar is updated and visible in the header'],
    ['Upload oversized avatar file', 'User is on the settings page', 'Attempt to upload an image exceeding the size limit', 'An error is shown and the previous avatar is unchanged'],
    ['Toggle notification preferences', 'User is on the settings page', 'Disable email notifications and save', 'Preference is saved and no further emails are sent for that category'],
    ['View own role and permissions', 'User is logged in', 'Navigate to the settings/profile page', 'Correct role (e.g. tester, admin) is displayed'],
    ['Change password from settings', 'User is logged in', 'Enter current password and a new password, then save', 'Password is updated and future logins require the new password'],
    ['Change password with wrong current password', 'User is logged in', 'Enter an incorrect current password when attempting to change it', 'Change is rejected with an appropriate error'],
    ['Settings changes are per-user', 'Two user accounts exist', 'Change settings on account A and check account B', 'Account B settings remain unaffected'],
  ],
  'Checkout & Payments': [
    ['Complete checkout with valid card', 'Cart has at least one item', 'Proceed through checkout using a valid test card', 'Order is confirmed and a confirmation page/email is shown'],
    ['Checkout with declined card', 'Cart has at least one item', 'Use a card that simulates a decline', 'An error is shown and the order is not created'],
    ['Empty cart blocks checkout', 'Cart is empty', 'Attempt to proceed to checkout', 'User is redirected or blocked with a message that the cart is empty'],
    ['Apply valid discount code', 'Cart has items and a valid discount code exists', 'Enter the discount code at checkout', 'Discount is applied and the total updates correctly'],
    ['Apply expired discount code', 'Cart has items', 'Enter an expired discount code', 'An "expired code" error is shown and total is unchanged'],
    ['Order confirmation displays correct total', 'Checkout has been completed', 'View the order confirmation page', 'Line items, tax, and total match what was charged'],
    ['Remove item during checkout', 'Cart has multiple items, checkout in progress', 'Remove one item before finalizing payment', 'Total recalculates correctly and checkout proceeds with remaining items'],
    ['Saved payment method reused', 'User has a saved payment method', 'Select the saved method at checkout', 'Checkout completes without re-entering card details'],
    ['Order appears in order history', 'An order has been placed', 'Navigate to order history', 'The new order appears with correct status and details'],
    ['Concurrent checkout does not double-charge', 'Cart has items', 'Submit checkout, then rapidly double-click submit', 'Only one order/charge is created'],
  ],
  'Search & Filtering': [
    ['Search returns relevant results', 'Items exist matching a known keyword', 'Search using that keyword', 'Matching items are returned, ranked by relevance'],
    ['Search with no matches', 'No items match a made-up keyword', 'Search using that keyword', 'An empty state is shown with no results'],
    ['Filter by single category', 'Items exist across multiple categories', 'Apply a single category filter', 'Only items in that category are shown'],
    ['Combine multiple filters', 'Items exist across categories and statuses', 'Apply two filters at once', 'Only items matching both filters are shown'],
    ['Clear all filters', 'Multiple filters are applied', 'Click "clear filters"', 'All filters reset and the full result set is shown'],
    ['Sort results ascending/descending', 'A results list is shown', 'Toggle the sort order on a sortable column', 'Results reorder correctly in both directions'],
    ['Pagination advances correctly', 'Result set exceeds one page', 'Navigate to the next page', 'The next set of results loads without duplicates or gaps'],
    ['Search is case-insensitive', 'An item exists with a known-case title', 'Search using the opposite case', 'The item is still returned'],
    ['Filter state persists on refresh', 'A filter is applied', 'Refresh the page', 'Filter selection persists (or resets, per the intended design) consistently'],
    ['Search handles special characters', 'Items exist in the system', 'Search using special characters (e.g. %, &, ")', 'Search does not error and returns a sensible result or empty state'],
  ],
  'Notifications': [
    ['In-app notification on new assignment', 'User is assigned a new test run', 'Trigger the assignment', 'An in-app notification appears for the assigned user'],
    ['Email notification on run completion', 'User has email notifications enabled', 'Complete a test run assigned to that user', 'A completion email is sent to the correct address'],
    ['Disabled category sends no notification', 'User has disabled a specific notification category', 'Trigger an event in that category', 'No notification is sent for that category'],
    ['Mark notification as read', 'User has unread notifications', 'Open and view a notification', 'Notification is marked as read and unread count decreases'],
    ['Mark all as read', 'User has multiple unread notifications', 'Click "mark all as read"', 'All notifications are marked read and count resets to zero'],
    ['Notification links to correct item', 'A notification exists for a specific run or case', 'Click the notification', 'User is navigated directly to the relevant run or case'],
    ['Notifications list is scoped per user', 'Two users have different notifications', 'Log in as each user separately', 'Each user sees only their own notifications'],
    ['Bulk action triggers single summary notification', 'A bulk operation affecting many items is performed', 'Complete the bulk action', 'A single summary notification is sent rather than one per item'],
  ],
  'Admin Dashboard': [
    ['Admin can view all users', 'Logged in as an admin', 'Navigate to the user management page', 'A list of all users with roles and status is shown'],
    ['Admin can deactivate a user', 'Logged in as an admin, target user is active', 'Deactivate the target user', 'User status changes to inactive and they can no longer log in'],
    ['Non-admin cannot access admin panel', 'Logged in as a non-admin user', 'Attempt to navigate directly to the admin panel URL', 'Access is blocked or redirected'],
    ['Admin can reactivate a deactivated user', 'A user is currently deactivated', 'Reactivate the user', 'User status changes to active and login is restored'],
    ['Admin can view pass-rate reporting', 'Test runs with results exist', 'Open the reporting dashboard', 'Pass rate trends render correctly based on actual run data'],
    ['Admin can filter reports by date range', 'Runs exist across multiple dates', 'Apply a date range filter on the dashboard', 'Only data within that range is reflected in the charts'],
    ['Coverage gaps report is accurate', 'Some test cases have never been run', 'Open the coverage gap view', 'Test cases with no run history are correctly listed'],
    ['Admin actions are audit-visible', 'An admin performs a user management action', 'Check for any activity/audit trail', 'The action is attributable to the acting admin'],
  ],
};

// ---------- other projects ----------
// Each project is independent: its own modules, cases, suites and runs.

const IOS_MODULES = [
  { name: 'Authentication', description: 'Sign in, biometrics, and session handling on iOS' },
  { name: 'Push Notifications', description: 'Permission, delivery, and deep links from push' },
  { name: 'Checkout & Apple Pay', description: 'Cart, Apple Pay, saved cards, order confirmation' },
  { name: 'Offline & Connectivity', description: 'Caching, offline banner, and sync after reconnect' },
];

const IOS_CASE_TEMPLATES = {
  'Authentication': [
    ['Login with valid credentials', 'App is installed and the user has an active account', 'Enter a correct email and password and tap Sign in', 'The home screen opens and a session is stored'],
    ['Login with Face ID', 'Face ID is enrolled and enabled for the app', 'Launch the app and authenticate with Face ID', 'The user is signed in without typing credentials'],
    ['Face ID falls back to passcode after failures', 'Face ID is enabled for the app', 'Fail Face ID twice, then enter the device passcode', 'The passcode prompt appears and a correct passcode signs the user in'],
    ['Login with incorrect password', 'User is on the sign-in screen', 'Enter a valid email with a wrong password', 'An "invalid credentials" message is shown and the user stays signed out'],
    ['Session persists after app relaunch', 'User is signed in', 'Force-quit the app and open it again', 'The user is still signed in'],
    ['Logout clears stored credentials', 'User is signed in', 'Tap Log out in Settings', 'The user returns to the sign-in screen and Face ID sign-in is no longer offered'],
    ['Password reset link opens the app', 'User requested a password reset email on this device', 'Tap the reset link in the email', 'The app opens directly on the reset password screen'],
    ['Expired session prompts re-login', 'User session has expired on the server', 'Open any screen that needs the server', 'The user is asked to sign in again without losing their place'],
  ],
  'Push Notifications': [
    ['Permission prompt on first launch', 'Fresh install, notifications not yet decided', 'Complete onboarding to the point where push is requested', 'The iOS permission prompt is shown once, with the app\'s explanation'],
    ['Push received in the foreground', 'Notifications are allowed and the app is open', 'Send a test push to the device', 'An in-app banner is shown instead of a system alert'],
    ['Push received in the background', 'Notifications are allowed and the app is backgrounded', 'Send a test push to the device', 'A system notification appears on the lock screen'],
    ['Tapping a push opens the related screen', 'A push about a specific order was delivered', 'Tap the notification', 'The app opens directly on that order\'s detail screen'],
    ['Badge count updates', 'Several unread notifications exist', 'Read one notification in the app', 'The app icon badge decreases by one'],
    ['Disabling push in iOS Settings stops delivery', 'Notifications are allowed', 'Turn off notifications for the app in iOS Settings, then send a push', 'No notification is shown and the app handles the change gracefully'],
    ['Quiet hours are respected', 'User has set quiet hours in the app', 'Send a push during quiet hours', 'The notification is delivered silently or held until quiet hours end'],
  ],
  'Checkout & Apple Pay': [
    ['Complete checkout with Apple Pay', 'Cart has an item and Apple Pay is set up on the device', 'Choose Apple Pay and confirm with Face ID', 'The order is placed and the confirmation screen is shown'],
    ['Apple Pay sheet cancelled by user', 'Cart has an item and Apple Pay is set up', 'Open the Apple Pay sheet and dismiss it', 'The user returns to checkout with the cart intact and no order created'],
    ['Complete checkout with a saved card', 'User has a saved card and a non-empty cart', 'Select the saved card and place the order', 'The order is placed without re-entering card details'],
    ['Checkout with a declined card', 'Cart has an item', 'Use a test card that simulates a decline', 'An error is shown and no order is created'],
    ['Order confirmation shows the right total', 'An order has just been placed', 'Review the confirmation screen', 'Items, tax, and total match what was charged'],
    ['Incoming call during payment resumes cleanly', 'Checkout is in progress', 'Receive a phone call, end it, and return to the app', 'Checkout resumes on the same step with no duplicate charge'],
  ],
  'Offline & Connectivity': [
    ['Cached catalog is visible offline', 'The catalog was loaded earlier in the session', 'Enable airplane mode and reopen the catalog', 'Previously loaded items are shown from the cache'],
    ['Offline banner appears when connection is lost', 'App is open on a screen that needs the network', 'Turn on airplane mode', 'An offline banner is shown within a few seconds'],
    ['Add to cart offline syncs when back online', 'App is open with no connectivity', 'Add an item to the cart, then restore connectivity', 'The cart syncs and the item appears on the server cart'],
    ['Wi-Fi to cellular switch retries the request', 'A request is in flight on Wi-Fi', 'Switch off Wi-Fi so the device moves to cellular', 'The request is retried and completes without an error screen'],
    ['Request timeout offers a retry', 'Connection is very slow', 'Open a screen that loads remote data', 'A timeout message with a Retry button is shown'],
    ['Queued actions are sent after reconnect', 'Several changes were made while offline', 'Restore connectivity', 'All queued changes are sent in order and none are duplicated'],
  ],
};

const IOS_SUITES = [
  { name: 'Smoke — iOS Core Flows', description: 'Fast sanity pass on sign-in and payment', modules: ['Authentication', 'Checkout & Apple Pay'] },
  { name: 'Regression — Notifications & Offline', description: 'Push delivery and connectivity behaviour', modules: ['Push Notifications', 'Offline & Connectivity'] },
  { name: 'Release Candidate — iOS 2.3', description: 'Full pass before the 2.3 release', modules: ['Authentication', 'Push Notifications', 'Checkout & Apple Pay', 'Offline & Connectivity'] },
];

const API_MODULES = [
  { name: 'Authentication API', description: 'Token issue, refresh, revocation, and rate limiting' },
  { name: 'Orders API', description: 'Create, read, list, and cancel orders' },
  { name: 'Search API', description: 'Query, filter, pagination, and performance' },
];

const API_CASE_TEMPLATES = {
  'Authentication API': [
    ['Token issued for valid credentials', 'An active account exists', 'POST valid credentials to the token endpoint', 'Response is 200 with an access token and a refresh token'],
    ['Wrong password returns 401', 'An active account exists', 'POST a valid email with a wrong password', 'Response is 401 and no token is issued'],
    ['Expired token is rejected', 'An access token past its expiry time', 'Call a protected endpoint with the expired token', 'Response is 401 with an "expired token" error code'],
    ['Refresh returns a new access token', 'A valid refresh token', 'POST the refresh token to the refresh endpoint', 'Response is 200 with a new access token'],
    ['Revoked refresh token is rejected', 'A refresh token that was revoked at logout', 'POST the revoked token to the refresh endpoint', 'Response is 401 and no token is issued'],
    ['Repeated failed logins are rate limited', 'An active account exists', 'Send more failed login attempts than the allowed limit within a minute', 'Further attempts return 429 with a Retry-After header'],
    ['Missing Authorization header returns 401', 'A protected endpoint', 'Call it without an Authorization header', 'Response is 401 and the body does not leak internals'],
  ],
  'Orders API': [
    ['Create order with a valid payload', 'An authenticated user and valid items', 'POST a complete order payload', 'Response is 201 with the new order id and status "pending"'],
    ['Create order with a missing field', 'An authenticated user', 'POST a payload without the items array', 'Response is 422 with a field-level error for items'],
    ['Get order by id', 'An order owned by the caller', 'GET the order by its id', 'Response is 200 with the full order'],
    ['Get another user\'s order returns 403', 'An order owned by a different user', 'GET that order with the caller\'s token', 'Response is 403 and no order data is returned'],
    ['List orders supports pagination', 'The caller has more orders than one page', 'GET the list with page size 5 and page 2', 'Response contains the second page and pagination metadata'],
    ['Cancel an order before shipment', 'An order in status "pending"', 'POST to the cancel endpoint', 'Response is 200 and the order status becomes "cancelled"'],
    ['Cancel a shipped order returns 409', 'An order in status "shipped"', 'POST to the cancel endpoint', 'Response is 409 and the order status is unchanged'],
    ['Idempotency key prevents duplicate orders', 'An authenticated user', 'POST the same payload twice with the same idempotency key', 'Only one order is created and both responses return it'],
  ],
  'Search API': [
    ['Query returns ranked results', 'Items matching a known keyword exist', 'GET search with that keyword', 'Response is 200 with matching items ordered by relevance'],
    ['Empty query returns 400', 'The search endpoint', 'GET search with an empty query parameter', 'Response is 400 with a clear validation message'],
    ['Category filter narrows results', 'Items exist in several categories', 'GET search with a category filter', 'Only items in that category are returned'],
    ['Cursor pagination returns the next page', 'A result set larger than one page', 'GET search with the cursor from the previous response', 'The next page is returned with no duplicates or gaps'],
    ['Special characters in the query are handled', 'The search endpoint', 'GET search with %, &, and " in the query', 'Response is 200 or an empty result, never a 500'],
    ['Typical query responds within 500 ms', 'A warm cache and a realistic dataset', 'Time a typical search request', 'The response arrives in under 500 ms'],
  ],
};

const API_SUITES = [
  { name: 'API Smoke', description: 'Quick check that auth and orders respond correctly', modules: ['Authentication API', 'Orders API'] },
  { name: 'API Regression — Orders & Search', description: 'Full regression of order and search endpoints', modules: ['Orders API', 'Search API'] },
  { name: 'Full API Pass', description: 'Every endpoint group before a release', modules: ['Authentication API', 'Orders API', 'Search API'] },
];

const LEGACY_MODULES = [
  { name: 'Customer Portal', description: 'Retired self-service portal, kept for reference' },
];

const LEGACY_CASE_TEMPLATES = {
  'Customer Portal': [
    ['Portal login with customer number', 'Customer has a portal account', 'Sign in with customer number and PIN', 'The account overview is shown'],
    ['Download invoice as PDF', 'Customer has at least one invoice', 'Open an invoice and choose Download PDF', 'A PDF with the correct invoice details is downloaded'],
    ['Update postal address', 'Customer is signed in', 'Edit the postal address and save', 'The new address is shown on the account overview'],
    ['Portal session times out after inactivity', 'Customer is signed in', 'Leave the portal idle past the timeout', 'The customer is signed out and asked to sign in again'],
  ],
};

const LEGACY_SUITES = [
  { name: 'Portal Sanity', description: 'Last known-good pass on the retired portal', modules: ['Customer Portal'] },
];

const DEMO_SUITES = [
  { name: 'Smoke Test — Core Flows', description: 'Fast sanity pass across the critical paths', modules: ['Authentication', 'Checkout & Payments'] },
  { name: 'Regression — Auth & Profile', description: 'Full regression for login and account management', modules: ['Authentication', 'User Profile & Settings'] },
  { name: 'Regression — Checkout', description: 'Full regression for cart and payment flows', modules: ['Checkout & Payments'] },
  { name: 'Release Candidate 1.5', description: 'Full pass before the 1.5 release', modules: ['Authentication', 'Checkout & Payments', 'Search & Filtering'] },
  { name: 'Search & Notifications Sweep', description: 'Combined pass on discovery and alerts', modules: ['Search & Filtering', 'Notifications'] },
  { name: 'Admin Panel Full Pass', description: 'Full coverage of admin-only functionality', modules: ['Admin Dashboard'] },
];

const PRIORITY_WEIGHTS = [['medium', 40], ['high', 30], ['low', 20], ['critical', 10]];
const FALLBACK_TESTER_NAMES = ['Alex Rivera', 'Jordan Lee', 'Sam Patel', 'Casey Morgan'];

// Fixed id for DEMO so the temporary column defaults from the Session 2
// migration (if you haven't removed them yet) keep pointing at a real project.
const DEMO_PROJECT_ID = 'd3a0d3a0-0000-4000-8000-000000000001';

const PROJECT_DEFS = [
  {
    id: DEMO_PROJECT_ID,
    code: 'DEMO',
    name: 'Demo Storefront',
    description: 'Demo data created by seed.mjs',
    modules: DEMO_MODULES,
    templates: DEMO_CASE_TEMPLATES,
    suites: DEMO_SUITES,
    suiteSize: [10, 16],
    runsPerSuite: [2, 4],
    osOptions: ['macOS 14', 'Windows 11', 'Windows 10', 'Ubuntu 22.04'],
    buildVersions: ['1.4.0', '1.4.1', '1.5.0-beta', '1.5.0'],
  },
  {
    code: 'DEMOIOS',
    name: 'Demo Storefront — iOS',
    description: 'The iOS app for the demo storefront',
    modules: IOS_MODULES,
    templates: IOS_CASE_TEMPLATES,
    suites: IOS_SUITES,
    suiteSize: [6, 10],
    runsPerSuite: [1, 3],
    osOptions: ['iOS 17.5', 'iOS 18.1', 'iPadOS 17.6'],
    buildVersions: ['2.2.0', '2.3.0-rc1', '2.3.0'],
  },
  {
    code: 'DEMOAPI',
    name: 'Demo Storefront — API',
    description: 'The public REST API behind the storefront apps',
    modules: API_MODULES,
    templates: API_CASE_TEMPLATES,
    suites: API_SUITES,
    suiteSize: [6, 10],
    runsPerSuite: [1, 3],
    osOptions: ['Staging (Linux)', 'CI (Ubuntu 22.04)', 'Local (macOS 14)'],
    buildVersions: ['api-3.8.0', 'api-3.9.0-rc1', 'api-3.9.0'],
  },
  {
    code: 'LEGACY',
    name: 'Legacy Portal',
    description: 'Retired customer portal, kept for reference',
    archived: true,
    modules: LEGACY_MODULES,
    templates: LEGACY_CASE_TEMPLATES,
    suites: LEGACY_SUITES,
    suiteSize: [3, 4],
    runsPerSuite: [1, 1],
    osOptions: ['Windows 10'],
    buildVersions: ['portal-1.9.2'],
  },
];

// ---------- wipe ----------

async function wipeAll() {
  console.log('Wiping existing seedable data...');
  const tablesInOrder = [
    'run_results',
    'test_runs',
    'suite_cases',
    'module_cases',
    'suites',
    'test_cases',
    'modules',
    'projects',
  ];
  for (const table of tablesInOrder) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) throw new Error(`Failed wiping ${table}: ${error.message}`);
    console.log(`  cleared ${table}`);
  }
}

// ---------- seed steps (all scoped to one project) ----------

async function insertProject(def) {
  const row = {
    code: def.code,
    name: def.name,
    description: def.description,
    archived_at: def.archived ? daysAgo(30) : null,
  };
  if (def.id) row.id = def.id;

  const { data, error } = await supabase.from('projects').insert(row).select().single();
  if (error) throw new Error(`projects insert failed (${def.code}): ${error.message}`);
  return data;
}

async function seedModules(project, def) {
  const rows = def.modules.map((m) => ({
    project_id: project.id,
    name: m.name,
    description: m.description,
  }));
  const { data, error } = await supabase.from('modules').insert(rows).select();
  if (error) throw new Error(`modules insert failed (${project.code}): ${error.message}`);
  console.log(`Inserted ${data.length} modules`);
  return data;
}

async function seedTestCases(project, def) {
  const rows = [];
  for (const mod of def.modules) {
    for (const [title, preconditions, step, expected] of def.templates[mod.name]) {
      rows.push({
        project_id: project.id,
        title,
        preconditions,
        steps_to_reproduce: `1. ${step}`,
        expected_result: expected,
        priority: weightedPick(PRIORITY_WEIGHTS),
        archived_at: null,
        _module_name: mod.name, // local only, stripped before insert
      });
    }
  }

  // archive a handful (~10%) so archived filtering has real data to filter
  const archiveIndices = new Set(shuffle(rows.map((_, i) => i)).slice(0, Math.round(rows.length * 0.1)));
  archiveIndices.forEach((i) => {
    rows[i].archived_at = daysAgo(randInt(5, 60));
  });

  const insertRows = rows.map(({ _module_name, ...rest }) => rest);
  const { data, error } = await supabase.from('test_cases').insert(insertRows).select();
  if (error) throw new Error(`test_cases insert failed (${project.code}): ${error.message}`);
  console.log(`Inserted ${data.length} test cases`);

  // The database numbers cases per project; read the numbers back so the
  // codes snapshotted onto run results match what the app shows.
  // Titles are unique within a project, so they are a safe join key.
  const moduleByTitle = new Map(rows.map((r) => [r.title, r._module_name]));
  return data.map((d) => ({
    ...d,
    _module_name: moduleByTitle.get(d.title),
    _test_case_code: caseCode(project.code, d.seq_number),
  }));
}

async function seedModuleCases(project, modules, testCases) {
  const moduleByName = new Map(modules.map((m) => [m.name, m]));
  const rows = [];
  const positionByModule = new Map();
  for (const tc of testCases) {
    const mod = moduleByName.get(tc._module_name);
    const pos = (positionByModule.get(mod.id) ?? 0) + 1;
    positionByModule.set(mod.id, pos);
    rows.push({ project_id: project.id, module_id: mod.id, test_case_id: tc.id, position: pos });
  }
  const { error } = await supabase.from('module_cases').insert(rows);
  if (error) throw new Error(`module_cases insert failed (${project.code}): ${error.message}`);
  console.log(`Inserted ${rows.length} module_cases links`);
}

async function seedSuites(project, def) {
  const rows = def.suites.map((s) => ({
    project_id: project.id,
    name: s.name,
    description: s.description,
  }));
  const { data, error } = await supabase.from('suites').insert(rows).select();
  if (error) throw new Error(`suites insert failed (${project.code}): ${error.message}`);
  console.log(`Inserted ${data.length} suites`);
  // suites come back in insertion order, so they line up with def.suites
  const byName = new Map(data.map((d) => [d.name, d]));
  return def.suites.map((s) => ({ ...byName.get(s.name), _modules: s.modules }));
}

async function seedSuiteCases(project, def, suites, testCases) {
  const casesByModule = new Map();
  for (const tc of testCases) {
    if (!casesByModule.has(tc._module_name)) casesByModule.set(tc._module_name, []);
    casesByModule.get(tc._module_name).push(tc);
  }

  const rows = [];
  const suiteCaseMap = new Map(); // suite.id -> array of test_case rows (ordered)
  for (const suite of suites) {
    const candidateCases = suite._modules.flatMap((m) => casesByModule.get(m) ?? []).filter((tc) => !tc.archived_at);
    const [minSize, maxSize] = def.suiteSize;
    const chosen = shuffle(candidateCases).slice(0, Math.min(candidateCases.length, randInt(minSize, maxSize)));
    suiteCaseMap.set(suite.id, chosen);
    chosen.forEach((tc, i) => {
      rows.push({ project_id: project.id, suite_id: suite.id, test_case_id: tc.id, position: i + 1 });
    });
  }
  const { error } = await supabase.from('suite_cases').insert(rows);
  if (error) throw new Error(`suite_cases insert failed (${project.code}): ${error.message}`);
  console.log(`Inserted ${rows.length} suite_cases links`);
  return suiteCaseMap;
}

async function seedRunsAndResults(project, def, suites, suiteCaseMap, profiles) {
  const runRows = [];
  const runMeta = []; // parallel array: { cases }

  for (const suite of suites) {
    const cases = suiteCaseMap.get(suite.id) ?? [];
    const numRuns = randInt(def.runsPerSuite[0], def.runsPerSuite[1]);
    for (let i = 0; i < numRuns; i++) {
      const status = def.archived
        ? 'completed'
        : weightedPick([['completed', 60], ['in_progress', 25], ['cancelled', 15]]);
      const startedDaysAgo = def.archived ? randInt(60, 120) : randInt(1, 45);
      const profile = profiles.length ? rand(profiles) : null;
      const testerName = profile?.display_name || rand(FALLBACK_TESTER_NAMES);

      runRows.push({
        project_id: project.id,
        suite_id: suite.id,
        tester_name: testerName,
        status,
        started_at: daysAgo(startedDaysAgo),
        completed_at: status === 'in_progress' ? null : daysAgo(randInt(0, startedDaysAgo - 1 < 0 ? 0 : startedDaysAgo - 1)),
        os: rand(def.osOptions),
        build_version: rand(def.buildVersions),
        outcome: null, // set after results are known, for completed runs
        started_by: profile?.id ?? null,
      });
      runMeta.push({ cases });
    }
  }

  const { data: insertedRuns, error: runError } = await supabase.from('test_runs').insert(runRows).select();
  if (runError) throw new Error(`test_runs insert failed (${project.code}): ${runError.message}`);
  console.log(`Inserted ${insertedRuns.length} test runs`);

  const resultRows = [];
  const runOutcomeUpdates = [];

  insertedRuns.forEach((run, idx) => {
    const cases = runMeta[idx].cases;
    let anyFail = false;

    cases.forEach((tc, position) => {
      let status;
      if (run.status === 'in_progress') {
        status = weightedPick([['pass', 40], ['pending', 35], ['fail', 15], ['blocked', 10]]);
      } else if (run.status === 'cancelled') {
        status = weightedPick([['pending', 50], ['pass', 30], ['fail', 20]]);
      } else {
        // completed
        status = weightedPick([['pass', 70], ['fail', 15], ['blocked', 10], ['skipped', 5]]);
      }
      if (status === 'fail' || status === 'blocked') anyFail = true;

      resultRows.push({
        test_run_id: run.id,
        test_case_id: tc.id,
        title: tc.title,
        steps_to_reproduce: tc.steps_to_reproduce,
        expected_result: tc.expected_result,
        status,
        notes: status === 'fail' ? 'Reproduced consistently — see linked issue.' : null,
        test_case_code: tc._test_case_code,
        position: position + 1,
      });
    });

    // Like the app, only completed runs get a pass/fail outcome; cancelled
    // runs have none, and in-progress runs are still open.
    if (run.status === 'completed') {
      runOutcomeUpdates.push({ id: run.id, outcome: anyFail ? 'fail' : 'pass' });
    }
  });

  const { error: resultError } = await supabase.from('run_results').insert(resultRows);
  if (resultError) throw new Error(`run_results insert failed (${project.code}): ${resultError.message}`);
  console.log(`Inserted ${resultRows.length} run results`);

  for (const update of runOutcomeUpdates) {
    const { error } = await supabase.from('test_runs').update({ outcome: update.outcome }).eq('id', update.id);
    if (error) throw new Error(`test_runs outcome update failed (${project.code}): ${error.message}`);
  }
  console.log(`Updated outcome on ${runOutcomeUpdates.length} runs`);
}

async function seedProject(def, profiles) {
  console.log(`\n=== ${def.code} — ${def.name}${def.archived ? ' (archived)' : ''} ===`);
  const project = await insertProject(def);
  const modules = await seedModules(project, def);
  const testCases = await seedTestCases(project, def);
  await seedModuleCases(project, modules, testCases);
  const suites = await seedSuites(project, def);
  const suiteCaseMap = await seedSuiteCases(project, def, suites, testCases);
  await seedRunsAndResults(project, def, suites, suiteCaseMap, profiles);
}

// ---------- safety check ----------

async function confirmDestructive() {
  console.log('\nThis will permanently WIPE and reseed the following tables:');
  console.log('  run_results, test_runs, suite_cases, module_cases, suites, test_cases, modules, projects');
  console.log('\nEvery project is deleted first, including any you created in the app.');
  console.log(`It then creates: ${PROJECT_DEFS.map((d) => d.code).join(', ')}`);
  console.log(`\nTarget Supabase project: ${SUPABASE_URL}`);
  console.log('(profiles / real users are left untouched)\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Type "yes" to continue: ');
  rl.close();

  if (answer.trim().toLowerCase() !== 'yes') {
    console.log('Aborted — no changes made.');
    process.exit(0);
  }
}

// ---------- main ----------

async function main() {
  await confirmDestructive();

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('is_active', true);
  if (profileError) throw new Error(`Failed fetching profiles: ${profileError.message}`);
  if (!profiles.length) {
    console.warn('No active profiles found — test_runs.started_by will be left null.');
  } else {
    console.log(`Found ${profiles.length} active profile(s) to use as testers`);
  }

  await wipeAll();

  for (const def of PROJECT_DEFS) {
    await seedProject(def, profiles);
  }

  console.log('\nSeed complete.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
