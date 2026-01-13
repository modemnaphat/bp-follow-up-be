require("dotenv").config();
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "BP Follow-up API", status: "ok" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
