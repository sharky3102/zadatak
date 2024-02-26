const express = require("express");
const router = express.Router();
const app = express();

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

module.exports = router;
