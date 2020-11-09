const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const mysql = require("mysql");
const connection = mysql.createConnection(config.get("CONFIG"));

const User = require("../models/User");

// @route     GET api/auth
// @desc      Get logged in user and return user
// @access    Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route     POST api/auth
// @desc      Auth user & get token Validate Login
// @access    Public
router.post(
  "/",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ msg: "Invalid Credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid Credentials" });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
  "/user-new",
  [
    check("firstname", "Please add name").not().isEmpty(),
    check("lastname", "Please add lastname").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "user_password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
    check("cellphone", "Please add telephone").not().isEmpty(),
    check("image", "Please add name").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstname,
      lastname,
      email,
      user_password,
      cellphone,
      image,
    } = req.body;

    const salt = await bcrypt.genSalt(10);

    let pass_secure = await bcrypt.hash(user_password, salt);

    const user = {
      firstname,
      lastname,
      email,
      user_password: pass_secure,
      cellphone,
      image,
    };

    const userInsert = new Promise(function (resolve, reject) {
      connection.query("INSERT INTO USERS SET ?", user, function (
        err,
        results,
        fields
      ) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    })
      .then(() => {
        const payload = {
          user: {
            id: email,
          },
        };

        jwt.sign(
          payload,
          config.get("jwtSecret"),
          {
            expiresIn: 360000,
          },
          (err, token) => {
            if (err) throw err;
            return res.json({ token });
          }
        );
      })
      .catch((err) => {
        if (err) {
          if (err.code == "ER_DUP_ENTRY")
            return res.json({ err: "Email Ya Existe" });
          return res.json({ err: "No se puede registrar" });
        }
      });
  }
);

module.exports = router;
