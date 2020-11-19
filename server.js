const express = require("express");
const app = express();
const { connection } = require("./config/db");

const server = require("http").createServer(app);

connection();

// Init Middleware
app.use(express.json({ extended: false, limit: "5mb" }));

// Define Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/seller/", require("./routes/seller"));
app.use("/api/users", require("./routes/users"));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
