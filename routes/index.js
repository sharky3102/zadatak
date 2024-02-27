const express = require("express");
const router = express.Router();
const app = express();
const { adminRequired } = require("../services/auth.js");
const Joi = require("joi");

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
router.post("/admin/sent", adminRequired, function (req, res, next) {
  // do validation
  const result = schema_edit.validate(req.body);
  if (result.error) {
      res.render("admin/sent", { result: { validation_error: true, display_form: true } });
      return;
  }
  const stmt = db.prepare("UPDATE messages SET message = ?, sender_id = ? WHERE id = ?;");
  const messageSent = stmt.run(req.body.message, req.body.sender_id, req.body.id);
  
  if (messageSent.changes && messageSent.changes === 1) {
      res.render("admin/sent", { result: { messageSent: true} });
  } else {
      res.render("admin/sent", { result: { database_error: true } });
  }
});

module.exports = router;
