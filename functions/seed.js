/* eslint-disable */
const admin = require("firebase-admin");
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = "maa-sharda-tiffin";

admin.initializeApp({
  projectId: "maa-sharda-tiffin",
});

const db = admin.firestore();

async function seed() {
  console.log("Seeding Database...");
  const BUSINESS_ID = "default";

  const customers = [
    {id: "11111", name: "Sparrsh Sanghi", phone: "9876543210", address: "A-101, Tech Park", group: "Tech Park", plan: "monthly", food: "Veg Premium Thali", rate: 3000, active: true, createdAt: new Date()},
    {id: "22222", name: "Amit Sharma", phone: "9876543211", address: "B-205, Tech Park", group: "Tech Park", plan: "daily", food: "Dal Rice & Roti", rate: 2500, active: true, createdAt: new Date()},
    {id: "33333", name: "Priya Desai", phone: "9876543212", address: "Flat 4, Rose Apartments", group: "Rose Apartments", plan: "monthly", food: "Jain Thali", rate: 2800, active: true, createdAt: new Date()},
    {id: "44444", name: "Rahul Verma", phone: "9876543213", address: "Shop 12, Main Market", group: "", plan: "daily", food: "Egg Curry & Rice", rate: 2000, active: true, createdAt: new Date()},
  ];

  const batch = db.batch();

  // Seed Customers
  for (const c of customers) {
    const ref = db.collection("businesses").doc(BUSINESS_ID).collection("customers").doc(c.id);
    batch.set(ref, c);
  }

  // Seed Today's Orders
  const TODAY = new Date().toISOString().split("T")[0];
  const orderRef = db.collection("businesses").doc(BUSINESS_ID).collection("orders").doc(TODAY);

  const orderData = {};
  for (const c of customers) {
    orderData[c.id] = {
      status: "pending",
      updatedAt: new Date(),
      updatedBy: "manager",
    };
  }
  // Set Amit's order out for delivery to demonstrate mixed group states
  orderData["22222"].status = "out";

  batch.set(orderRef, orderData);

  // Seed Settings (Hashes)
  const settingsRef = db.collection("businesses").doc(BUSINESS_ID).collection("config").doc("settings");
  batch.set(settingsRef, {
    mgrPinHash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", // 'test'
    delivPinHash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4", // '1234'
    businessName: "Maa Sharda Tiffin (Seed)",
    createdAt: new Date(),
  });

  await batch.commit();
  console.log("Seeding complete! Added 4 customers and orders for " + TODAY);
}

seed().catch(console.error);
