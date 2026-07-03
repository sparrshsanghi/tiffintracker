const {onSchedule} = require("firebase-functions/v2/scheduler");
const {db} = require("./helpers/firestore");
const {FieldValue} = require("firebase-admin/firestore");

const BUSINESS_ID = "default";

function isPausedForDate(data, today) {
  if (data.paused !== true) return false;
  if (!data.pauseFrom || !data.pauseTo) return data.active === false;
  return data.pauseFrom <= today && today <= data.pauseTo;
}

// Runs every day at 6:00 AM IST
exports.scheduledDailyReset = onSchedule({
  schedule: "0 6 * * *",
  timeZone: "Asia/Kolkata",
}, async (event) => {
  // Convert current time in IST to get TODAY string
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const TODAY = istTime.toISOString().split("T")[0];

  const orderDocRef = db.collection("businesses").doc(BUSINESS_ID)
      .collection("orders").doc(TODAY);

  const customersSnapshot = await db.collection("businesses").doc(BUSINESS_ID)
      .collection("customers").where("active", "==", true).get();

  const orderData = {};
  customersSnapshot.forEach((doc) => {
    orderData[doc.id] = {
      status: "pending",
      updatedAt: new Date(),
      updatedBy: "system_daily_reset",
    };
    const data = doc.data();
    if (isPausedForDate(data, TODAY)) {
      delete orderData[doc.id];
    }
  });

  if (Object.keys(orderData).length > 0) {
    await orderDocRef.set(orderData);
  }
});

// Runs every day at 12:01 AM IST
exports.checkPauseResume = onSchedule({
  schedule: "1 0 * * *",
  timeZone: "Asia/Kolkata",
}, async (event) => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const TODAY = istTime.toISOString().split("T")[0];

  const customers = await db.collection("businesses").doc(BUSINESS_ID)
      .collection("customers").get();

  const batch = db.batch();
  let count = 0;

  customers.forEach((doc) => {
    const data = doc.data();
    if (data.paused === true &&
        (data.resumeDate && data.resumeDate <= TODAY ||
          data.pauseTo && data.pauseTo < TODAY)) {
      batch.update(doc.ref, {
        active: true,
        paused: false,
        pauseFrom: FieldValue.delete(),
        pauseTo: FieldValue.delete(),
        resumeDate: FieldValue.delete(),
      });
      count++;
    } else if (isPausedForDate(data, TODAY) && data.active !== false) {
      batch.update(doc.ref, {
        active: false,
      });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
  }
});

// Runs on the 1st of every month at 12:01 AM IST
exports.monthlyPaymentInit = onSchedule({
  schedule: "1 0 1 * *",
  timeZone: "Asia/Kolkata",
}, async (event) => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
  const monthKey = `${year}-${month}`;

  const activeCustomers = await db.collection("businesses").doc(BUSINESS_ID)
      .collection("customers").where("active", "==", true).get();

  const batch = db.batch();
  let count = 0;

  activeCustomers.forEach((doc) => {
    const data = doc.data();
    if (data.rate && data.rate > 0) {
      const paymentRef = db.collection("businesses").doc(BUSINESS_ID)
          .collection("payments").doc(`${doc.id}_${monthKey}`);
      batch.set(paymentRef, {
        totalPaid: 0,
        records: [],
      }, {merge: true});
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
  }
});
