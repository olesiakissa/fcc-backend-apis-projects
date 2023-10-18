require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const asyncHandler = require('express-async-handler');
const connectToDb = require('./dbConnection');
const {
  constants: { OK, CREATED, BAD_REQUEST, FORBIDDEN, NOT_FOUND },
} = require('./constants/codes');
// Models
const User = require('./models/User');
const Exercise = require('./models/Exercise');

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
connectToDb();
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get(
  '/api/users',
  asyncHandler(async (req, res) => {
    const users = await User.find({});

    if (users) {
      console.log('users', users);
      res.status(OK).json(users);
    }
  })
);

app.post(
  '/api/users',
  asyncHandler(async (req, res) => {
    const { username } = req.body;

    if (!username) {
      res.status(BAD_REQUEST).json({ error: 'The username field is required' });
    } else {
      try {
        const user = await User.create({ username });
        if (user) {
          res.status(CREATED).json({
            username: user.username,
            _id: user._id,
          });
        }
      } catch (error) {
        res.status(BAD_REQUEST).json({
          code: error.code,
          keyValue: error.keyValue,
          msg: 'The user with such username already exists.',
        });
      }
    }
  })
);

app.post(
  '/api/users/:id?/exercises',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.info('POST initiated for user with id ', id);

    if (!id)
      res.status(BAD_REQUEST).json({
        error:
          'You should provide a user ID in order to save any exercises associated with this user',
      });
    else {
      const user = await User.findById(id);
      if (!user) {
        res.status(NOT_FOUND).json({
          error:
            'Impossible to save save an exercise for a user with provided ID. Check user ID or try to create a new User first.',
        });
      } else {
        const { _id } = user;
        const { description, duration, date } = req.body;
        const exercise = await Exercise.create({
          username: user.username,
          description,
          duration,
          date: date ? date : new Date(),
        });

        if (!exercise) res.json({ error: 'Could not save exercise' });
        else {
          const { username, description, duration, date } = exercise;
          res.status(CREATED).json({
            _id,
            username,
            date: date.toDateString(),
            duration: parseInt(duration),
            description,
          });
        }
      }
    }
  })
);

app.get(
  '/api/users/:_id/logs',
  asyncHandler(async (req, res) => {
    const idParam = req.params._id;
    const { from, to, limit } = req.query;
    if (idParam) {
      try {
        const user = await User.findById(idParam);
        if (!user) {
          return res.status(NOT_FOUND).json({ error: 'User not found' });
        }

        const { username, id } = user;

        console.info('fetching logs for user ', username);

        const filter = {
          username,
        };

        if (from && to) {
          console.info(
            'FROM and TO parameters were provided. adding them to filter'
          );
          filter.date = {
            $gte: new Date(from),
            $lte: new Date(to),
          };
        }

        //https://www.mongodb.com/docs/manual/core/aggregation-pipeline/#complete-aggregation-pipeline-examples

        const aggregationPipeline = [
          {
            $match: { username: username },
          },
          {
            $group: {
              _id: id,
              count: { $sum: 1 },
              log: {
                $push: {
                  description: '$description',
                  duration: '$duration',
                  date: {
                    $dateToString: { format: '%Y-%m-%d', date: '$date' },
                  },
                },
              },
            },
          },
        ];

        if (limit && Number(limit) > 0) {
          console.info(
            'LIMIT was provided and is pushed as a filter to aggregation pipeling'
          );
          aggregationPipeline.push({
            $addFields: {
              log: { $slice: ['$log', Number(limit)] },
            },
          });
        }

        const log = await Exercise.aggregate(aggregationPipeline);

        console.log('After $match: ', log[0]);

        if (log.length === 0) {
          return res
            .status(NOT_FOUND)
            .json({ error: 'User not found or has no exercises' });
        } else {
          log[0].log.forEach((entry) => {
            entry.description = String(entry.description);
            entry.duration = Number(entry.duration);
            entry.date = new Date(entry.date).toDateString();
          });

          const { count, log: logEntries, _id } = log[0];
          const response = { username, count, _id, log: logEntries };
          res.status(OK).json(response);
        }
      } catch (error) {
        console.error(error);
        res.status(FORBIDDEN).json({
          error: 'Server error while fetching logs for a specific user',
        });
      }
    }
  })
);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
