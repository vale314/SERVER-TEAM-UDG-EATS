const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const mysql = require("mysql");

const connection = mysql.createPool(config.get("CONFIG"));

const User = require("../models/User");
const auth = require("../middleware/auth");

// @route     GET admin/admins
// @desc      Obtener Todos Users
// @access    Private
router.get("/all", auth, async (req, res) => {
  try {
    const users = await User.find().sort({
      date: -1,
    });
    return res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route     GET api/auth
// @desc      Get logged in user and return user
// @access    Private
router.post("/update", auth, async (req, res) => {
  try {
    const { money } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { money: money } },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
  "/",
  [
    check("name", "Please add name").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: "User already exists" });
      }

      user = new User({
        name,
        email,
        password,
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

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
router.post("/products", async (req, res) => {
  new Promise(function (resolve, reject) {
    connection.query(
      "SELECT * FROM `PRODUCT` JOIN `SELLER` ON SELLER.email = PRODUCT.ownerid ",
      function (err, results, fields) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      }
    );
  })
    .then((resul) => {
      return res.json({
        error: false,
        products: resul,
      });
    })
    .catch((err) => {
      if (err) {
        return res.json({ error: true, msg: "No se puede Enviar Productos" });
      }
    });
});

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
  "/buy-products",
  [
    check("id", "Please add id").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, email } = req.body;

    const formatDate = (date) => {
      const map = {
        ss: date.getSeconds(),
        mm: date.getUTCMinutes(),
        hh: date.getHours(),
        mo: date.getMonth() + 1,
        dd: date.getDate(),
        yy: date.getFullYear().toString().slice(-2),
        yyyy: date.getFullYear(),
      };

      return map;
    };

    new Promise(function (resolve, reject) {
      connection.query(
        "SELECT * FROM `PRODUCT` WHERE `id` = ?",
        id,
        function (err, results, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    })
      .then(async (product) => {
        if (product.length === 0) {
          return res.json({ error: true, msg: "Producto NO ENCONTRADO" });
        }
        const ownerid = product[0].ownerid;

        const date = formatDate(new Date());

        const idBuy =
          email +
          date.mm.toString() +
          date.hh.toString() +
          date.dd.toString() +
          date.mo.toString() +
          date.yy.toString();

        const fecha =
          date.ss.toString() +
          "-" +
          date.mm.toString() +
          "-" +
          date.hh.toString() +
          "-" +
          date.dd.toString() +
          "-" +
          date.mo.toString() +
          "-" +
          date.yy.toString();

        const buyproduct = {
          idproduct: id,
          email,
          ownerid: ownerid,
          idbuy: idBuy,
          fecha,
        };
        new Promise(function (resolve, reject) {
          connection.query(
            "INSERT INTO BUY SET ?",
            buyproduct,
            function (err, results, fields) {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        })

          .then(() => {
            return res.json({
              error: false,
            });
          })
          .catch((err) => {
            if (err) {
              if (err.code == "ER_DUP_ENTRY")
                return res.json({
                  error: true,
                  msg: "Date un respiro, espera tu producto",
                });
              return res.json({ error: true, msg: "No se puede registrar" });
            }
          });
      })
      .catch((err) => {
        if (err) {
          return res.json({ error: true, msg: "ERROR: " });
        }
      });
  }
);

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
  "/buy",
  [check("email", "Please include a valid email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    const { email } = req.body;

    new Promise(function (resolve, reject) {
      connection.query(
        "SELECT * FROM `BUY` JOIN `PRODUCT` ON PRODUCT.id = BUY.idproduct and BUY.isbuy = 1 and BUY.email =  ?",
        email,
        function (err, results, fields) {
          if (err) {
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    })
      .then((resul) => {
        return res.json({
          error: false,
          buys: resul,
        });
      })
      .catch((err) => {
        console.log(err);
        if (err) {
          return res.json({ error: true, msg: "No se puede Enviar Productos" });
        }
      });
  }
);

module.exports = router;
