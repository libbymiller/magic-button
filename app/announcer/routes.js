var fs             = require('fs'),
    utils          = require('radiodan-client').utils,
    settingsRoutes = require('../settings/routes'),
    logger         = utils.logger('announcer-routes'),
    announcersPath = __dirname + '/../../audio/';

module.exports = routes;

function routes(app, states, settings) {
  var availableAnnouncers = findAvailableAnnouncers(announcersPath);

  settings.update({available: availableAnnouncers});

  app.get('/', index);
  app.get('/state.json', state);
  app.post('/', announce);
  app.delete('/', cancel);

  app.use(settingsRoutes(settings));

  return app;

  function index(req, res) {
    res.json({page: 'Announcer'});
  }

  function state(req, res) {
    res.json({
      isAnnouncing: (states.state === 'announcing')
    });
  }

  function announce(req, res) {
    settings.get().then(function(settings) {
      states.handle('startAnnouncing', settings);
      res.send(200);
    }).then(null, utils.failedPromiseHandler(logger));
  }

  function cancel(req, res) {
    states.handle('stopAnnouncing');
    res.send(200);
  }

  function findAvailableAnnouncers(announcersPath) {
    var files = fs.readdirSync(announcersPath),
        announcers = [];

    files.forEach(function(file){
      var path = announcersPath + file,
          stat = fs.statSync(path);

      if (stat && stat.isDirectory()) {
        var package = path + '/package.json',
            announcer;

        try {
          announcer = require(package);
          announcer.path = file;

          announcers.push(announcer);
        } catch(err) {
          logger.warn(err);
        }
      }
    });

    return announcers;
  }
}
