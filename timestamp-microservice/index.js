const express = require('express');
const app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
const cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.use('/api/:date?', (req, res, next) => {
  try {
    const dateParam = req.params.date;

    if (!dateParam) {
      const currentDate = new Date(Date.now());
      res.json({
        unix: Date.parse(currentDate),
        utc: currentDate.toUTCString(),
      });
    } else if (!isNaN(Number(dateParam))) {
      const unix = Number(dateParam);
      const date = new Date(unix);

      if (date.toString() === 'Invalid Date') {
        res.json({
          error: 'Invalid Date',
        });
      } else {
        res.json({
          unix: unix,
          utc: new Date(unix).toUTCString(),
        });
      }
    } else if (dateParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateParam);
      res.json({
        unix: Date.parse(date),
        utc: date.toUTCString(),
      });
    } else {
      res.json({
        error: 'Invalid Date',
      });
    }
  } catch (error) {
    console.error('An error occurred while processing the date.', error);
    res.json({
      error: error,
    });
  }
  next();
});

const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
