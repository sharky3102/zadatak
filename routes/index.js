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
  const schema = Joi.object({
      message: Joi.string().min(3).max(255).required(),
  });

  const validationResult = schema.validate(req.body);
  if (validationResult.error) {
      return res.status(400).json({ error: validationResult.error.details[0].message });
  }

  const stmt = db.prepare("INSERT INTO messages (message, sender_id) VALUES (?, ?)");
  const messageSent = stmt.run(req.body.message, req.user.sub);

  if (messageSent.changes && messageSent.changes === 1) {
      res.render("admin/sent", { result: { messageSent: true } });
  } else {
      res.render("admin/sent", { result: { database_error: true } });
  }
});
// GET /admin/inbox
router.get("/admin/inbox", adminRequired, function (req, res) {
  const stmt = db.prepare(`
    SELECT m.message, u.name 
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    `);
  const messages = stmt.all();
  res.render("admin/inbox", { messages: messages });
});
// GET /admin/poruke/delete-all
router.get("/admin/inbox/delete-all", adminRequired, function (req, res) {
  const checkStmt = db.prepare("SELECT COUNT(*) AS count FROM messages");
  const countResult = checkStmt.get();

  if (countResult.count === 0) {
      res.render("admin/poruke", { result: { noMessages: true } });
  } else {
      const stmt = db.prepare("DELETE FROM messages");
      const deleteResult = stmt.run();
      if (deleteResult.changes && deleteResult.changes === 1) {
          res.render("admin/poruke", { result: { deleteResult: true } });
      } else {
          throw new Error("Operacija brisanja nije uspjela");
      }
  }
});


module.exports = router;
