var express = require('express'),
    fs = require('fs'),
    path = require('path');

module.exports = function(settings) {
  var app = express.Router();

  //read the file as specified in the url as a static file
  //for offline use
  app.use(express.static(__dirname + '/'));

  return app;
};
