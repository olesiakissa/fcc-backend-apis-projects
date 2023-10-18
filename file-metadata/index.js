require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });
const app = express();

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  if (req.file) {
    try {
      const { originalname, mimetype, size } = req.file;
      console.log(req.file);
      res.json({
        name: originalname,
        type: mimetype,
        size,
      });
    } catch (error) {
      console.error(error);
      res.json({
        error: 'An error occurred while trying to get file metadata',
      });
    }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port);
});
