import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCcnx83mNfBNEuFX8GYVHehfO3veuKvSa8",
  authDomain: "maa-sharda-sns.firebaseapp.com",
  projectId: "maa-sharda-sns",
  storageBucket: "maa-sharda-sns.firebasestorage.app",
  messagingSenderId: "662147715598",
  appId: "1:662147715598:web:b369234e7a03e55657225f",
  measurementId: "G-8LZVBYVVX0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const fns = getFunctions(app);

const confirmPaymentCallable = httpsCallable(fns, "confirmPayment");
const startOnboardingCallable = httpsCallable(fns, "startOnboarding");
const saveOnboardingDraftCallable = httpsCallable(fns, "saveOnboardingDraft");
const confirmOnboardingCallable = httpsCallable(fns, "confirmOnboarding");
const listOnboardingQueueCallable = httpsCallable(fns, "listOnboardingQueue");
const resolveOnboardingApprovalCallable = httpsCallable(fns, "resolveOnboardingApproval");
const extractMaaAiIntentCallable = httpsCallable(fns, "extractMaaAiIntent");
const createMaaAiPendingActionCallable = httpsCallable(fns, "createMaaAiPendingAction");
const listMaaAiPendingActionsCallable = httpsCallable(fns, "listMaaAiPendingActions");
const resolveMaaAiPendingActionCallable = httpsCallable(fns, "resolveMaaAiPendingAction");
const listCustomerTimelineCallable = httpsCallable(fns, "listCustomerTimeline");
const createManagerTokenCallable = httpsCallable(fns, "createManagerToken");
const createCustomerTokenCallable = httpsCallable(fns, "createCustomerToken");
const changePINCallable = httpsCallable(fns, "changePIN");

const BUSINESS_ID = "default";

export {
  app,
  db,
  auth,
  fns,
  BUSINESS_ID,
  confirmPaymentCallable,
  startOnboardingCallable,
  saveOnboardingDraftCallable,
  confirmOnboardingCallable,
  listOnboardingQueueCallable,
  resolveOnboardingApprovalCallable,
  extractMaaAiIntentCallable,
  createMaaAiPendingActionCallable,
  listMaaAiPendingActionsCallable,
  resolveMaaAiPendingActionCallable,
  listCustomerTimelineCallable,
  createManagerTokenCallable,
  createCustomerTokenCallable,
  changePINCallable
};
