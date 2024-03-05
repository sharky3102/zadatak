const express = require("express");
const router = express.Router();
const { authRequired, adminRequired } = require("../services/auth.js");
const Joi = require("joi");
const { db } = require("../services/db.js");
const { decode } = require("jsonwebtoken");

// GET /competitions
router.get("/", authRequired, function (req, res, next) {
    const stmt = db.prepare(`
        SELECT c.id, c.name, c.description, u.name AS author, c.apply_till
        FROM competitions c, users u
        WHERE c.author_id = u.id
        ORDER BY c.apply_till
    `);
    const result = stmt.all();

    res.render("competitions/index", { result: { items: result } });
});

// SCHEMA id
const schema_id = Joi.object({
    id: Joi.number().integer().positive().required()
});

// GET /competitions/delete/:id
router.get("/delete/:id", adminRequired, function (req, res, next) {
    n
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt = db.prepare("DELETE FROM competitions WHERE id = ?;");
    const deleteResult = stmt.run(req.params.id);

    if (!deleteResult.changes || deleteResult.changes !== 1) {
        throw new Error("Operacija nije uspjela");
    }

    res.redirect("/competitions");
});

// GET /competitions/edit/:id
router.get("/edit/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        throw new Error("Neispravan poziv");
    }

    const stmt = db.prepare("SELECT * FROM competitions WHERE id = ?;");
    const selectResult = stmt.get(req.params.id);

    if (!selectResult) {
        throw new Error("Neispravan poziv");
    }

    res.render("competitions/form", { result: { display_form: true, edit: selectResult } });
});

// GET /competitions/add
router.get("/add", adminRequired, function (req, res, next) {
    res.render("competitions/form", { result: { display_form: true } });
});

// SCHEMA signup
const schema_add = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(3).max(1000).required(),
    apply_till: Joi.date().iso().required()
});

// POST /competitions/add
router.post("/add", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_add.validate(req.body);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }

    const stmt = db.prepare("INSERT INTO competitions (name, description, author_id, apply_till) VALUES (?, ?, ?, ?);");
    const insertResult = stmt.run(req.body.name, req.body.description, req.user.sub, req.body.apply_till);

    if (insertResult.changes && insertResult.changes === 1) {
        res.render("competitions/form", { result: { success: true } });
    } else {
        res.render("competitions/form", { result: { database_error: true } });
    }
});
// SCHEMA edit
const schema_edit = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(3).max(1000).required(),
    apply_till: Joi.date().iso().required(),
    id: Joi.number().integer().positive().required()
});
// POST /competitions/edit/
router.post("/edit", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_edit.validate(req.body);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }
    const stmt = db.prepare("UPDATE competitions SET name = ?, description = ?, apply_till = ? WHERE id = ?;");
    const updateResult = stmt.run(req.body.name, req.body.description, req.body.apply_till, req.body.id);
    if (updateResult.changes && updateResult.changes === 1) {
        res.redirect("/competitions");
    } else {
        res.render("competitions/form", { result: { database_error: true } });
    }
});

// GET /competitions/signup/:id
router.get("/signed/:id", function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }

    // Provjeri je li korisnik već prijavljen na natjecanje
    const checkStmt = db.prepare("SELECT * FROM signed_up WHERE userid = ? AND competitionid = ?;");
    const existingSignUp = checkStmt.get(req.user.sub, req.params.id);
    if (existingSignUp) {
        // Korisnik je već prijavljen na natjecanje, ne dopusti ponovnu prijavu
        res.render("competitions/signed", { result: { already_signed_up: true } });
        return;
    }

    const stmt = db.prepare("INSERT INTO signed_up (userid, competitionid, appliedat) VALUES (?,?,?);")
    const signUpResult = stmt.run(req.user.sub, req.params.id, new Date().toISOString());

    if (signUpResult.changes && signUpResult.changes === 1) {
        res.render("competitions/signed", { result: { signedUp: true, is_signed: true } });
    } else {
        res.render("competitions/signed", { result: { database_error: true } });
    }

});

// GET /competitions/score/:id
router.get("/score/:id", authRequired, function (req, res, next) {
    // do validation
    const result = schema_id.validate(req.params);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }

    const stmt = db.prepare("SELECT a.id, u.name AS natjecatelj, a.score, c.name as natjecanje FROM users u, signed_up a, competitions c WHERE a.userid = u.id and a.competitionid = c.id and c.id = ? ORDER BY a.score;");
    const dbResult = stmt.all(req.params.id);

    res.render("competitions/score", { result: { items: dbResult } });
});

// POST /competitions/score/:id
router.post("/score/:id", adminRequired, function (req, res, next) {
    // do validation
    const result = schema_edit.validate(req.body);
    if (result.error) {
        res.render("competitions/form", { result: { validation_error: true, display_form: true } });
        return;
    }
    const stmt = db.prepare("INSERT INTO signed_up SET score = ? WHERE id = ?;");
    const upResult = stmt.run(req.body.score);
    if (upResult.changes && upResult.changes === 1) {
        res.redirect("/competitions/score");
    } else {
        res.render("competitions/form", { result: { database_error: true } });
    }
});


module.exports = router;