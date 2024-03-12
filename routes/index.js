const express = require("express");
const router = express.Router();
const app = express();
const { adminRequired, authRequired } = require("../services/auth.js");
const Joi = require("joi");
const { db } = require("../services/db.js");

app.use(express.static('public'));

// GET /
router.get("/", function (req, res, next) {
  res.render("index");
});

// GET /
router.get("/naslovnica", function (req, res, next) {
  res.render("naslovnica");
});

// GET /
router.get("/seLinux", function (req, res, next) {
  res.render("seLinux");
});

// GET /
router.get("/admin_contact", function (req, res, next) {
  res.render("admin_contact");
});

const schema_edit = Joi.object({
  message: Joi.string().min(3).max(50).required(),
  sender_id: Joi.string().min(3).max(1000).required(),
  id: Joi.number().integer().positive().required()
});

// POST /admin/sent
router.post("/admin/sent", authRequired, function (req, res, next) {
  
  const stmt = db.prepare("INSERT INTO messages (message, sender_id) VALUES(?,?) ;");
  const messageSent = stmt.run(req.body.message, req.user.sub);

  if (messageSent.changes && messageSent.changes === 1) {
    res.render("admin/sent", { result: { messageSent: true } });
  } else {
    res.render("admin/sent", { result: { database_error: true } });
  }
});

module.exports = router;
