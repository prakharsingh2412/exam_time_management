import express from "express";
import cors from "cors";

import routes from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Exam MVP API Running",
  });
});

export default app;