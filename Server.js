require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const adminRoutes = require("./Routes/admin_route");

const app = express();
app.use(express.json());
app.use("/api/admin", adminRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Connection Error", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
