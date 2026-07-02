const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const { confirmPayment } = require("./functions/src/confirmPayment");
const { changePIN } = require("./functions/src/changePIN");

module.exports = {
  confirmPayment,
  changePIN,
};
