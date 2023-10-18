require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const asyncHandler = require('express-async-handler');

const Link = require('./models/linkModel');
const connectToDb = require('./config/dbConnection');

connectToDb();

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get(
  '/api/shorturl/:link',
  asyncHandler(async (req, res) => {
    const urlRequested = req.params.link;
    console.log('urlRequested', urlRequested);
    if (/^\d+$/.test(urlRequested)) {
      const link = await Link.findOne({ shortUrl: parseInt(urlRequested) });
      if (!link) {
        res.json({ error: 'invalid url' });
      } else {
        res.status(302).redirect(link.url);
      }
    } else {
      res.status(302).redirect(urlRequested);
    }
  })
);

app.post(
  '/api/shorturl',
  asyncHandler(async (req, res) => {
    const { url } = req.body;
    console.log('original url', url);
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;

    if (!url.match(urlRegex)) {
      res.json({ error: 'invalid url' });
    } else {
      const shortUrl = Math.floor(Math.random() * 10000);

      const link = await Link.create({
        url,
        shortUrl,
      });

      res
        .status(201)
        .json({ original_url: link.url, short_url: link.shortUrl });
    }
  })
);

const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
