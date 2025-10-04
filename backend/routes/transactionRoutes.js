const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { addTransaction, getTransactionsByWallet } = require("../controllers/transactionController");

router.post("/", protect, addTransaction);
router.get("/:walletId", protect, getTransactionsByWallet);

module.exports = router;


