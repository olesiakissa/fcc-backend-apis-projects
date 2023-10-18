const mongoose = require('mongoose');

const linkSchema = mongoose.Schema(
  {
    url: {
      type: String,
      required: 'URL can not be empty',
    },
    shortUrl: {
      type: Number,
      required: 'Short link must be created',
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Link', linkSchema);
