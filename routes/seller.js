const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const mysql = require("mysql");
const connection = mysql.createPool(config.get("CONFIG"));

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
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("user_password", "Password is required").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: true, msg: "Campos Invalidos", errors: errors.array() });
    }

    const { email, user_password } = req.body;

    new Promise(function (resolve, reject) {
      connection.query(
        "SELECT * FROM `SELLER` WHERE `email` = ?",
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
      .then(async (user) => {
        // connection.end();
        if (user.length === 0) {
          return res.json({ error: true, msg: "Credenciales Incorrectas" });
        }
        const isMatch = await bcrypt.compare(
          user_password,
          user[0].user_password
        );
        if (!isMatch) {
          return res
            .status(400)
            .json({ error: true, msg: "Credenciales Incorrectas" });
        }
        const payload = {
          user: {
            id: email,
          },
        };

        jwt.sign(
          payload,
          config.get("jwtSecret"),
          {
            expiresIn: 3600000,
          },
          (err, token) => {
            if (err) throw err;
            return res.json({
              localId: email,
              error: false,
              token,
              expires: 3600000,
            });
          }
        );
      })
      .catch((err) => {
        if (err) {
          // connection.end();
          return res.json({ error: true, msg: "ERROR: " });
        }
      });
  }
);

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
  "/new",
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
      return res
        .status(400)
        .json({ error: true, msg: "Campos Invalidos", errors: errors.array() });
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

    new Promise(function (resolve, reject) {
      connection.query(
        "INSERT INTO SELLER SET ?",
        user,
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
            return res.json({
              error: false,
              token,
              localId: email,
              expires: 360000,
            });
          }
        );
      })
      .catch((err) => {
        if (err) {
          console.log(err);
          if (err.code == "ER_DUP_ENTRY")
            return res.json({ error: true, msg: "Email Ya Existe" });
          return res.json({ error: true, msg: "No se puede registrar" });
        }
      });
  }
);

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
  "/new-product",
  [
    check("title", "Please add title").not().isEmpty(),
    check("imageUrl", "Please add image").not().isEmpty(),
    check("price", "Please add price").not().isEmpty(),
    check("description", "Please add description").not().isEmpty(),
    check("available", "Please add available").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: true, msg: "Campos Invalidos", errors: errors.array() });
    }

    const {
      title,
      imageUrl,
      price,
      description,
      ownerId,
      available,
      vegetarian,
      glutenFree,
      ingredients,
      lactoseFree,
      vegan,
      desayuno,
      comida,
      snack,
      lonche,
      sandiwch,
      taco,
      pan,
      dulce,
    } = req.body;

    const user = {
      title,
      imageurl: imageUrl,
      ingredients,
      price,
      description_product: description,
      ownerid: ownerId,
      id: title + ownerId,
      available,
      vegetarian,
      glutenfree: glutenFree,
      lactosefree: lactoseFree,
      vegan,
      desayuno,
      comida,
      snack,
      lonche,
      sandiwch,
      taco,
      pan,
      dulce,
    };

    new Promise(function (resolve, reject) {
      connection.query(
        "INSERT INTO PRODUCT SET ?",
        user,
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
        // connection.end();
        return res.json({
          error: false,
          product: {
            ProductId: title + ownerId,
            ProductTitle: title,
            ProductDescription: description,
            ProductIngredients: ingredients,
            ProductImageUrl: imageUrl,
            ProductPrice: price,
            ProductOwnerId: ownerId,
            ProductAvailable: available,
            ProductVegetarian: vegetarian,
            ProductGlutenFree: glutenFree,
            ProductLactosaFree: lactoseFree,
            ProductVegan: vegan,
            ProductDesayuno: desayuno,
            ProductComida: comida,
            ProductSnack: snack,
            ProductLoche: lonche,
            ProductSandiwch: sandiwch,
            ProductTaco: taco,
            ProductPan: pan,
            ProductDulce: dulce,
          },
        });
      })
      .catch((err) => {
        console.log(err.code);
        if (err.code) {
          if (err.code == "ER_DUP_ENTRY")
            return res.json({ error: true, msg: "Producto Ya Existe" });
          return res.json({ error: true, msg: "No se puede registrar" });
        }
      });
  }
);

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
  "/products",
  [check("email", "Please add email").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: true, msg: "Campos Invalidos", errors: errors.array() });
    }

    const { email } = req.body;

    new Promise(function (resolve, reject) {
      connection.query(
        "SELECT * FROM `PRODUCT` WHERE `ownerid` =  ?",
        [email],
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
        // connection.end();
        return res.json({
          error: false,
          products: resul,
        });
      })
      .catch((err) => {
        // connection.end();
        if (err) {
          if (err.code == "ER_DUP_ENTRY")
            return res.json({ error: true, msg: "Producto Ya Existe" });
          return res.json({ error: true, msg: "No se puede registrar" });
        }
      });
  }
);

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
  "/delete-products",
  [
    check("email", "Please add email").not().isEmpty(),
    check("productId", "Please Add ProductId").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: true, msg: "Campos Invalidos", errors: errors.array() });
    }

    const { productId } = req.body;

    new Promise(function (resolve, reject) {
      connection.query(
        "DELETE FROM `PRODUCT` WHERE `id` =  ?",
        [productId],
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
        console.log(err);
        if (err) {
          if (err.code == "ER_DUP_ENTRY")
            return res.json({ error: true, msg: "Producto Ya Existe" });
          return res.json({ error: true, msg: "No se puede registrar" });
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
        "SELECT * FROM `BUY` JOIN `PRODUCT` ON PRODUCT.id = BUY.idproduct and BUY.isbuy = 0 and BUY.ownerid =  ? JOIN `USERS` ON USERS.email = BUY.email ",
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

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
  "/confirm",
  [check("idBuy", "Please include a valid email").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    const { idBuy } = req.body;

    new Promise(function (resolve, reject) {
      connection.query(
        "UPDATE `BUY` SET BUY.isbuy = 1 WHERE idbuy = ?",
        idBuy,
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
        console.log(err);
        if (err) {
          return res.json({ error: true, msg: "No se puede Enviar Productos" });
        }
      });
  }
);

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
  "/orders",
  [check("email", "Please include a valid email").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    const { email } = req.body;

    new Promise(function (resolve, reject) {
      connection.query(
        "SELECT * FROM `BUY` JOIN `PRODUCT` ON PRODUCT.id = BUY.idproduct and BUY.isbuy = 1 and BUY.ownerid =  ? JOIN `USERS` ON USERS.email = BUY.email ",
        [email],
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
          orders: resul,
        });
      })
      .catch((err) => {
        if (err) {
          if (err.code == "ER_DUP_ENTRY")
            return res.json({ error: true, msg: "Producto Ya Existe" });
          return res.json({ error: true, msg: "No se puede registrar" });
        }
      });
  }
);

module.exports = router;
