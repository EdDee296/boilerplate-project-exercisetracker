const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new Schema({
  _id: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req, res) => {
  const user = await User.find({}).select('_id username');
  if (!user) {
    return res.json({ error: 'User not found' });
  } else {
    res.json(user);
  }
});

app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username: username});
  try {
    const user = await newUser.save();
    res.json(user);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) {
    return res.json({ error: 'User not found' });
  }
  const newExercise = new Exercise({
    _id: user._id,
    description: description,
    duration: duration,
    date: date ? new Date(date) : new Date()
  });
  try {
    const exercise = await newExercise.save();
    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      _id: user._id,
      date: exercise.date.toDateString()
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) {
    return res.json({ error: 'User not found' });
  }
  let dateObj = {}
  if (from) {
    dateObj.$gte = new Date(from);
  }
  if (to) {
    dateObj.$lte = new Date(to);
  }
  let filter = { _id: id };
  if (from || to) {
    filter.date = dateObj;
  }
  const logs = await Exercise.find(filter).limit(+limit ?? 500);
  res.json({
    _id: user._id,
    username: user.username,
    count: logs.length,
    log: logs.map(log => ({
      description: log.description,
      duration: log.duration,
      date: log.date.toDateString()
    }))
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
