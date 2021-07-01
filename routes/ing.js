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
    // 1
    const errors = validationResult(req);
    // 1
    if (!errors.isEmpty()) {
      // 2
      return res
        .status(400)
        .json({ error: true, msg: "Campos Invalidos", errors: errors.array() });
    }
    //   1
    const { firstname, lastname, email, user_password, cellphone, image } =
      req.body;
    //   1
    const salt = await bcrypt.genSalt(10);
    //   1
    let pass_secure = await bcrypt.hash(user_password, salt);
    //   1
    const user = {
      firstname,
      lastname,
      email,
      user_password: pass_secure,
      cellphone,
      image,
    };
    //   1
    new Promise(function (resolve, reject) {
      //1
      connection.query(
        "INSERT INTO USERS SET ?",
        user,
        //   1
        function (err, results, fields) {
          // 1
          if (err) {
            // 3
            reject(err);
          } else {
            // 4
            resolve();
          }
        }
      );
    })
      //   5
      .then(() => {
        const payload = {
          user: {
            id: email,
          },
        };
        //   5
        jwt.sign(
          payload,
          config.get("jwtSecret"),
          {
            expiresIn: 360000,
          },
          // 5
          (err, token) => {
            // 5       6
            if (err) throw err;
            // 7
            return res.json({
              error: false,
              localId: email,
              token,
              expires: 360000,
            });
          }
        );
      })
      // 8
      .catch((err) => {
        // 8
        if (err.code == "ER_DUP_ENTRY")
          return res.json({ error: true, msg: "Email Ya Existe" }); // 10
        // 11
        return res.json({ error: true, msg: "No se puede registrar" });
      });
  }
);
