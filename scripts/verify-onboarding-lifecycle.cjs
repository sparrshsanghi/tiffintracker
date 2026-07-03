const crypto = require("crypto");
const admin = require("../functions/node_modules/firebase-admin");

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || "maa-sharda-sns";
const businessId = "default";
const baseUrl = `http://127.0.0.1:5001/${projectId}/us-central1`;
const firestoreUrl = `http://${process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080"}/v1/projects/${projectId}/databases/(default)/documents`;
const pin = "2468";
const runSuffix = String(Date.now()).slice(-9);
const approvedPhone = `8${runSuffix}`;
const rejectedPhone = `7${String(Number(runSuffix) + 1).padStart(9, "0").slice(-9)}`;
const prospectPhone = `6${String(Number(runSuffix) + 2).padStart(9, "0").slice(-9)}`;

function hashPIN(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function base64url(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function authToken(uid, claims) {
  const now = Math.floor(Date.now() / 1000);
  return [
    base64url({alg: "none", typ: "JWT"}),
    base64url(Object.assign({
      aud: projectId,
      exp: now + 3600,
      iat: now,
      iss: `https://securetoken.google.com/${projectId}`,
      sub: uid,
      user_id: uid,
      firebase: {sign_in_provider: "custom"},
    }, claims || {})),
    "",
  ].join(".");
}

async function callFunction(name, data) {
  const response = await fetch(`${baseUrl}/${name}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({data}),
  });
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(`${name} failed: ${JSON.stringify(body)}`);
  }
  return body.result;
}

async function expectFunctionError(name, data, expectedCode) {
  const response = await fetch(`${baseUrl}/${name}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({data}),
  });
  const body = await response.json();
  assert(body.error, `${name} should have failed`);
  const details = body.error.details || {};
  assert(details.code === expectedCode, `${name} expected ${expectedCode}, got ${JSON.stringify(body.error)}`);
  return body.error;
}

async function firestoreRequest(path, options) {
  const opts = options || {};
  const headers = Object.assign({"Content-Type": "application/json"}, opts.headers || {});
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  const response = await fetch(`${firestoreUrl}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let body = {};
  try {
    body = await response.json();
  } catch (error) {}
  return {status: response.status, body};
}

function assertTokenResult(result, expectedRole) {
  assert(result.token && result.token.split(".").length === 3, `${expectedRole} token should be a JWT-like string`);
  assert(result.uid && typeof result.uid === "string", `${expectedRole} token should include uid`);
  assert(result.role === expectedRole, `Expected role ${expectedRole}, got ${result.role}`);
  assert(result.businessId === businessId, `${expectedRole} token should include businessId`);
  assert(result.identityLevel, `${expectedRole} token should include identityLevel`);
}

async function createPendingApproval(phone, name) {
  const started = await callFunction("startOnboarding", {
    text: "I want a daily tiffin plan.",
    source: "chat",
  });
  const draft = {
    name,
    phone,
    address: `${phone} Test Street`,
    group: "Regression",
    plan: "daily",
    food: "Veg thali",
    rate: 2500,
    notes: "Emulator regression",
  };
  await callFunction("saveOnboardingDraft", {
    sessionId: started.sessionId,
    draft,
  });
  const confirmed = await callFunction("confirmOnboarding", {
    sessionId: started.sessionId,
    draft,
  });
  return {sessionId: started.sessionId, approvalId: confirmed.approvalId, draft};
}

async function countPendingApprovalsForSession(business, sessionId) {
  const snap = await business.collection("approvals").where("sessionId", "==", sessionId).get();
  return snap.docs.filter((doc) => doc.data().status === "pending").length;
}

async function countCustomersByPhone(business, phone) {
  const querySnap = await business.collection("customers").where("phone", "==", phone).get();
  const directSnap = await business.collection("customers").doc(phone).get();
  const ids = new Set(querySnap.docs.map((doc) => doc.id));
  if (directSnap.exists) ids.add(directSnap.id);
  return ids.size;
}

async function verifyAuthBridge(business, approvedCustomerId) {
  const managerIdentity = await callFunction("createManagerToken", {pin});
  assertTokenResult(managerIdentity, "manager");
  assert(managerIdentity.manager !== false, "Manager bridge should return manager identity");

  const prospectIdentity = await callFunction("createCustomerToken", {phone: prospectPhone});
  assertTokenResult(prospectIdentity, "prospect");
  assert(prospectIdentity.phone === prospectPhone, "Prospect token should include normalized phone");
  assert(prospectIdentity.customerId === null, "Prospect token should not include customerId");

  const firstCustomerIdentity = await callFunction("createCustomerToken", {phone: approvedPhone});
  assertTokenResult(firstCustomerIdentity, "customer");
  assert(firstCustomerIdentity.customerId === approvedCustomerId, "Customer token should include final customerId");
  assert(firstCustomerIdentity.phone === approvedPhone, "Customer token should include normalized phone");

  const customerSnap = await business.collection("customers").doc(approvedCustomerId).get();
  assert(customerSnap.exists, "Approved customer document should exist");
  assert(customerSnap.data().authUid === firstCustomerIdentity.uid, "Customer authUid should match token uid");

  const secondCustomerIdentity = await callFunction("createCustomerToken", {phone: approvedPhone});
  assert(secondCustomerIdentity.uid === firstCustomerIdentity.uid, "Customer authUid should be stable across bridge calls");
  assert(secondCustomerIdentity.customerId === approvedCustomerId, "Customer customerId should be stable across bridge calls");
}

async function verifyRules(approvedCustomerId, approvedSessionId) {
  const managerToken = authToken("manager-user", {
    manager: true,
    businessId,
    role: "manager",
  });
  const customerToken = authToken("customer-user", {
    businessId,
    role: "customer",
    customerId: approvedCustomerId,
    phone: approvedPhone,
  });
  const otherCustomerToken = authToken("other-customer", {
    businessId,
    role: "customer",
    customerId: rejectedPhone,
    phone: rejectedPhone,
  });
  const prospectToken = authToken("prospect-user", {
    businessId,
    role: "prospect",
    phone: approvedPhone,
  });
  const anonymousToken = authToken("anonymous-user", {
    businessId,
    role: "customer",
    customerId: approvedCustomerId,
    phone: approvedPhone,
    firebase: {sign_in_provider: "anonymous"},
  });

  const customerPath = `/businesses/${businessId}/customers/${approvedCustomerId}`;
  const approvalPath = `/businesses/${businessId}/approvals`;
  const sessionPath = `/businesses/${businessId}/onboardingSessions/${approvedSessionId}`;

  let result = await firestoreRequest(customerPath);
  assert(result.status === 403, `Unauthenticated customer read should be denied, got ${result.status}`);

  result = await firestoreRequest(customerPath, {token: anonymousToken});
  assert(result.status === 403, `Anonymous customer read should be denied, got ${result.status}`);

  result = await firestoreRequest(customerPath, {token: customerToken});
  assert(result.status === 200, `Customer should read own profile, got ${result.status}`);

  result = await firestoreRequest(customerPath, {token: otherCustomerToken});
  assert(result.status === 403, `Customer should not read another profile, got ${result.status}`);

  result = await firestoreRequest(customerPath, {token: prospectToken});
  assert(result.status === 403, `Prospect should not read customer profile, got ${result.status}`);

  result = await firestoreRequest(`${customerPath}?updateMask.fieldPaths=lastReadAt`, {
    method: "PATCH",
    token: customerToken,
    body: {fields: {lastReadAt: {timestampValue: new Date().toISOString()}}},
  });
  assert(result.status === 200, `Customer should update own lastReadAt only, got ${result.status}`);

  result = await firestoreRequest(customerPath, {
    method: "PATCH",
    token: customerToken,
    body: {fields: {phone: {stringValue: "9999999999"}}},
  });
  assert(result.status === 403, `Customer should not update business fields, got ${result.status}`);

  result = await firestoreRequest(`/businesses/${businessId}/customers/9999999999`, {
    method: "PATCH",
    token: managerToken,
    body: {fields: {phone: {stringValue: "9999999999"}}},
  });
  assert(result.status === 403, `Manager direct customer write should be denied, got ${result.status}`);

  result = await firestoreRequest(`/businesses/${businessId}/payments/${approvedCustomerId}_2099-01`, {
    method: "PATCH",
    token: managerToken,
    body: {fields: {customerId: {stringValue: approvedCustomerId}}},
  });
  assert(result.status === 403, `Manager direct payment write should be denied, got ${result.status}`);

  result = await firestoreRequest(approvalPath, {token: managerToken});
  assert(result.status === 200, `Manager should read approvals, got ${result.status}`);

  result = await firestoreRequest(`/businesses/${businessId}/approvals/clientWrite`, {
    method: "PATCH",
    token: managerToken,
    body: {fields: {status: {stringValue: "pending"}}},
  });
  assert(result.status === 403, `Client approval create should be denied, got ${result.status}`);

  result = await firestoreRequest(sessionPath, {token: prospectToken});
  assert(result.status === 200, `Prospect should read own onboarding session, got ${result.status}`);
}

async function main() {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error("Run with firebase emulators:exec --only firestore,functions.");
  }

  if (!admin.apps.length) {
    admin.initializeApp({projectId});
  }
  const db = admin.firestore();
  const business = db.collection("businesses").doc(businessId);
  await business.collection("config").doc("settings").set({
    mgrPinHash: hashPIN(pin),
    onboardingPromptVersion: "onboarding.v1",
    geminiApiKey: "",
  }, {merge: true});

  const first = await createPendingApproval(approvedPhone, "Approved Regression");
  const duplicateConfirm = await callFunction("confirmOnboarding", {
    sessionId: first.sessionId,
    draft: first.draft,
  });
  assert(duplicateConfirm.approvalId === first.approvalId, "confirmOnboarding must return the existing pending approval");
  assert(await countPendingApprovalsForSession(business, first.sessionId) === 1, "Exactly one pending approval should exist per session");

  const approved = await callFunction("resolveOnboardingApproval", {
    pin,
    approvalId: first.approvalId,
    action: "approve",
    managerNote: "Approved by regression test",
  });
  assert(approved.status === "approved", "Approval should resolve as approved");
  assert(approved.customerId === approvedPhone, "Approved customer id should be the normalized phone");
  assert(await countCustomersByPhone(business, approvedPhone) === 1, "Exactly one customer should exist for approved phone");
  await verifyAuthBridge(business, approved.customerId);

  const approvedAgain = await callFunction("resolveOnboardingApproval", {
    pin,
    approvalId: first.approvalId,
    action: "approve",
    managerNote: "Idempotent approval retry",
  });
  assert(approvedAgain.status === "approved", "Repeated approval should be idempotent");
  assert(await countCustomersByPhone(business, approvedPhone) === 1, "Repeated approval must not create another customer");

  const duplicateStart = await callFunction("startOnboarding", {
    text: "I want a daily tiffin plan.",
    source: "chat",
  });
  await expectFunctionError("saveOnboardingDraft", {
    sessionId: duplicateStart.sessionId,
    draft: Object.assign({}, first.draft),
  }, "CUSTOMER_PHONE_EXISTS");
  assert(await countCustomersByPhone(business, approvedPhone) === 1, "Duplicate onboarding must not create another customer");

  const rejected = await createPendingApproval(rejectedPhone, "Rejected Regression");
  const rejectedResult = await callFunction("resolveOnboardingApproval", {
    pin,
    approvalId: rejected.approvalId,
    action: "reject",
    managerNote: "Rejected by regression test",
  });
  assert(rejectedResult.status === "rejected", "Approval should resolve as rejected");
  assert(await countCustomersByPhone(business, rejectedPhone) === 0, "Rejected onboarding must not create a customer");

  const rejectedAgain = await callFunction("resolveOnboardingApproval", {
    pin,
    approvalId: rejected.approvalId,
    action: "reject",
    managerNote: "Idempotent rejection retry",
  });
  assert(rejectedAgain.status === "rejected", "Repeated rejection should be idempotent");
  assert(await countCustomersByPhone(business, rejectedPhone) === 0, "Repeated rejection must not create a customer");

  await verifyRules(approved.customerId, first.sessionId);

  console.log(JSON.stringify({
    ok: true,
    approvedSessionId: first.sessionId,
    approvedApprovalId: first.approvalId,
    approvedCustomerId: approved.customerId,
    rejectedSessionId: rejected.sessionId,
    rejectedApprovalId: rejected.approvalId,
    approvedPhoneCustomerCount: await countCustomersByPhone(business, approvedPhone),
    rejectedPhoneCustomerCount: await countCustomersByPhone(business, rejectedPhone),
    prospectPhone,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
