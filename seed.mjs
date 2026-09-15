/**
 * Seed script — QA Test Case Manager
 *
 * Wipes and refills modules, test_cases, suites, runs, and run_results
 * with realistic volume so the app looks/behaves like it has real usage.
 * Real `profiles` rows are left untouched and reused for `started_by`.
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

// ---------- content ----------

const MODULES = [
  { name: 'Authentication', description: 'Login, signup, password reset, session handling' },
  { name: 'User Profile & Settings', description: 'Profile editing, preferences, account management' },
  { name: 'Checkout & Payments', description: 'Cart, payment methods, order confirmation' },
  { name: 'Search & Filtering', description: 'Search results, filters, sorting, pagination' },
  { name: 'Notifications', description: 'In-app and email notification delivery and preferences' },
  { name: 'Admin Dashboard', description: 'User management, reporting, system configuration' },
];

const CASE_TEMPLATES = {
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

const PRIORITY_WEIGHTS = [['medium', 40], ['high', 30], ['low', 20], ['critical', 10]];
const OS_OPTIONS = ['macOS 14', 'Windows 11', 'Windows 10', 'Ubuntu 22.04'];
const BUILD_VERSIONS = ['1.4.0', '1.4.1', '1.5.0-beta', '1.5.0'];
const FALLBACK_TESTER_NAMES = ['Alex Rivera', 'Jordan Lee', 'Sam Patel', 'Casey Morgan'];

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
  ];
  for (const table of tablesInOrder) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) throw new Error(`Failed wiping ${table}: ${error.message}`);
    console.log(`  cleared ${table}`);
  }
}

// ---------- seed steps ----------

async function seedModules() {
  const rows = MODULES.map((m) => ({
    name: m.name,
    description: m.description,
  }));
  const { data, error } = await supabase.from('modules').insert(rows).select();
  if (error) throw new Error(`modules insert failed: ${error.message}`);
  console.log(`Inserted ${data.length} modules`);
  return data;
}

async function seedTestCases() {
  let seq = 1;
  const rows = [];
  for (const mod of MODULES) {
    for (const [title, preconditions, step, expected] of CASE_TEMPLATES[mod.name]) {
      rows.push({
        title,
        preconditions,
        steps_to_reproduce: `1. ${step}`,
        expected_result: expected,
        priority: weightedPick(PRIORITY_WEIGHTS),
        archived_at: null,
        _module_name: mod.name, // local only, stripped before insert
        _test_case_code: `TC-${String(seq).padStart(2, '0')}`, // local only — run_results snapshots this, test_cases has no such column
      });
      seq += 1;
    }
  }

  // archive a handful (~10%) so archived filtering has real data to filter
  const archiveIndices = new Set(shuffle(rows.map((_, i) => i)).slice(0, Math.round(rows.length * 0.1)));
  archiveIndices.forEach((i) => {
    rows[i].archived_at = daysAgo(randInt(5, 60));
  });

  const insertRows = rows.map(({ _module_name, _test_case_code, ...rest }) => rest);
  const { data, error } = await supabase.from('test_cases').insert(insertRows).select();
  if (error) throw new Error(`test_cases insert failed: ${error.message}`);
  console.log(`Inserted ${data.length} test cases`);

  // reattach local metadata for later steps, matched by title (unique across all templates)
  const metaByTitle = new Map(rows.map((r) => [r.title, { _module_name: r._module_name, _test_case_code: r._test_case_code }]));
  return data.map((d) => ({ ...d, ...metaByTitle.get(d.title) }));
}

async function seedModuleCases(modules, testCases) {
  const moduleByName = new Map(modules.map((m) => [m.name, m]));
  const rows = [];
  const positionByModule = new Map();
  for (const tc of testCases) {
    const mod = moduleByName.get(tc._module_name);
    const pos = (positionByModule.get(mod.id) ?? 0) + 1;
    positionByModule.set(mod.id, pos);
    rows.push({ module_id: mod.id, test_case_id: tc.id, position: pos });
  }
  const { error } = await supabase.from('module_cases').insert(rows);
  if (error) throw new Error(`module_cases insert failed: ${error.message}`);
  console.log(`Inserted ${rows.length} module_cases links`);
}

async function seedSuites() {
  const suiteDefs = [
    { name: 'Smoke Test — Core Flows', description: 'Fast sanity pass across the critical paths', modules: ['Authentication', 'Checkout & Payments'] },
    { name: 'Regression — Auth & Profile', description: 'Full regression for login and account management', modules: ['Authentication', 'User Profile & Settings'] },
    { name: 'Regression — Checkout', description: 'Full regression for cart and payment flows', modules: ['Checkout & Payments'] },
    { name: 'Release Candidate 1.5', description: 'Full pass before the 1.5 release', modules: ['Authentication', 'Checkout & Payments', 'Search & Filtering'] },
    { name: 'Search & Notifications Sweep', description: 'Combined pass on discovery and alerts', modules: ['Search & Filtering', 'Notifications'] },
    { name: 'Admin Panel Full Pass', description: 'Full coverage of admin-only functionality', modules: ['Admin Dashboard'] },
  ];
  const rows = suiteDefs.map((s) => ({
    name: s.name,
    description: s.description,
  }));
  const { data, error } = await supabase.from('suites').insert(rows).select();
  if (error) throw new Error(`suites insert failed: ${error.message}`);
  console.log(`Inserted ${data.length} suites`);
  return data.map((d, i) => ({ ...d, _modules: suiteDefs[i].modules }));
}

async function seedSuiteCases(suites, testCases) {
  const casesByModule = new Map();
  for (const tc of testCases) {
    if (!casesByModule.has(tc._module_name)) casesByModule.set(tc._module_name, []);
    casesByModule.get(tc._module_name).push(tc);
  }

  const rows = [];
  const suiteCaseMap = new Map(); // suite.id -> array of test_case rows (ordered)
  for (const suite of suites) {
    const candidateCases = suite._modules.flatMap((m) => casesByModule.get(m) ?? []).filter((tc) => !tc.archived_at);
    const chosen = shuffle(candidateCases).slice(0, Math.min(candidateCases.length, randInt(10, 16)));
    suiteCaseMap.set(suite.id, chosen);
    chosen.forEach((tc, i) => {
      rows.push({ suite_id: suite.id, test_case_id: tc.id, position: i + 1 });
    });
  }
  const { error } = await supabase.from('suite_cases').insert(rows);
  if (error) throw new Error(`suite_cases insert failed: ${error.message}`);
  console.log(`Inserted ${rows.length} suite_cases links`);
  return suiteCaseMap;
}

async function seedRunsAndResults(suites, suiteCaseMap, profiles) {
  const runRows = [];
  const runMeta = []; // parallel array: { suiteId, caseIds }

  for (const suite of suites) {
    const cases = suiteCaseMap.get(suite.id) ?? [];
    const numRuns = randInt(2, 4);
    for (let i = 0; i < numRuns; i++) {
      const status = weightedPick([['completed', 60], ['in_progress', 25], ['cancelled', 15]]);
      const startedDaysAgo = randInt(1, 45);
      const profile = profiles.length ? rand(profiles) : null;
      const testerName = profile?.display_name || rand(FALLBACK_TESTER_NAMES);

      const row = {
        suite_id: suite.id,
        tester_name: testerName,
        status,
        started_at: daysAgo(startedDaysAgo),
        completed_at: status === 'in_progress' ? null : daysAgo(randInt(0, startedDaysAgo - 1 < 0 ? 0 : startedDaysAgo - 1)),
        os: rand(OS_OPTIONS),
        build_version: rand(BUILD_VERSIONS),
        outcome: null, // set after results are known, for completed/cancelled
        started_by: profile?.id ?? null,
      };
      runRows.push(row);
      runMeta.push({ cases });
    }
  }

  const { data: insertedRuns, error: runError } = await supabase.from('test_runs').insert(runRows).select();
  if (runError) throw new Error(`test_runs insert failed: ${runError.message}`);
  console.log(`Inserted ${insertedRuns.length} test runs`);

  const resultRows = [];
  const runOutcomeUpdates = [];

  insertedRuns.forEach((run, idx) => {
    const cases = runMeta[idx].cases;
    let anyFail = false;
    let anyPending = false;

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
      if (status === 'pending') anyPending = true;

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

    if (run.status === 'completed') {
      runOutcomeUpdates.push({ id: run.id, outcome: anyFail ? 'fail' : 'pass' });
    } else if (run.status === 'cancelled') {
      runOutcomeUpdates.push({ id: run.id, outcome: 'cancelled' });
    }
    // in_progress runs keep outcome = null
  });

  const { error: resultError } = await supabase.from('run_results').insert(resultRows);
  if (resultError) throw new Error(`run_results insert failed: ${resultError.message}`);
  console.log(`Inserted ${resultRows.length} run results`);

  for (const update of runOutcomeUpdates) {
    const { error } = await supabase.from('test_runs').update({ outcome: update.outcome }).eq('id', update.id);
    if (error) throw new Error(`test_runs outcome update failed: ${error.message}`);
  }
  console.log(`Updated outcome on ${runOutcomeUpdates.length} runs`);
}

// ---------- safety check ----------

async function confirmDestructive() {
  console.log('\nThis will permanently WIPE and reseed the following tables:');
  console.log('  run_results, test_runs, suite_cases, module_cases, suites, test_cases, modules');
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

  const modules = await seedModules();
  const testCases = await seedTestCases();
  await seedModuleCases(modules, testCases);

  const suites = await seedSuites();
  const suiteCaseMap = await seedSuiteCases(suites, testCases);

  await seedRunsAndResults(suites, suiteCaseMap, profiles);

  console.log('\nSeed complete.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
