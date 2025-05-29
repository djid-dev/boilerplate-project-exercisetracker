const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const { User, Exercise } = require("./mongo");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  const newUser = new User({ username });
  newUser
    .save()
    .then((user) => {
      res.json({ username: user.username, _id: user._id });
    })
    .catch((err) => {
      res.status(500).json({ error: "Error saving user" });
    });
});

app.get("/api/users", (req, res) => {
  User.find()
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      res.status(500).json({ error: "Error fetching users" });
    });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res
      .status(400)
      .json({ error: "Description and duration are required" });
  }

  const exerciseDate = date ? new Date(date) : new Date();

  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const newExercise = new Exercise({
        userId: user._id,
        username: user.username,
        description: description,
        duration: parseInt(duration),
        date: exerciseDate,
      });

      return newExercise.save();
    })
    .then((exercise) => {
      res.json({
        _id: exercise.userId,
        username: exercise.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      });
    })
    .catch((err) => {
      console.error("Error saving exercise:", err);
      res.status(500).json({ error: "Error saving exercise" });
    });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  // Filtro de fechas
  let dateFilter = {};
  if (fromDate) dateFilter.$gte = fromDate;
  if (toDate) dateFilter.$lte = toDate;

  // Filtro general
  let filter = { userId: userId };
  if (Object.keys(dateFilter).length > 0) {
    filter.date = dateFilter; 
  }

  try {
    // Buscar el usuario
    const user = await User.findById(userId);
    if (!user) return res.json({ error: "User not found" });

    // Construir la consulta
    let query = Exercise.find(filter).sort({ date: -1 });
    if (limit) query = query.limit(parseInt(limit));

    const exercises = await query.exec();

    const logs = exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    }));

    res.json({
      _id: user._id,
      from: from ? new Date(from).toDateString() : undefined,
      to: to ? new Date(to).toDateString() : undefined,
      username: user.username,
      count: logs.length,
      log: logs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching exercises" });
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
