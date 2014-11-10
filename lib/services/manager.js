var utils  = require('radiodan-client').utils,
    logger = utils.logger(__filename);

module.exports.create = create;

function create(register, eventBus, settings) {
  var instance = {},
      history  = [],
      currentServiceId;

  instance.change       = change;
  instance.next         = nextService;
  instance.events       = register.events;
  // TODO: replace instances of `get` for `playlist`
  instance.get          = get;
  instance.playlist     = get;
  instance.programmeFor = programmeFor;
  instance.all          = all;
  instance.current      = current;

  settings.get().then(updateDefaultServiceId);
  eventBus.on('settings.radio', updateDefaultServiceId);

  function updateDefaultServiceId(setData) {
    instance.default = setData.serviceId;
  }

  return instance;

  function current() {
    return currentServiceId;
  }

  function change(id) {
    var metadata;

    history.push(currentServiceId);

    currentServiceId = id;

    if(currentServiceId) {
      metadata = programmeFor(currentServiceId);

      settings.update({serviceId: currentServiceId}).then(
        function() { logger.info('settings.serviceId updated to', currentServiceId); },
        function() { logger.warn('settings.serviceId not updated to', currentServiceId); }
      );
    }

    eventBus.emit('service.id', currentServiceId);
    eventBus.emit('service.changed', metadata);
  }

  function nextService() {
    return settings.get().then(function(setData) {
      var preferred    = setData.preferredServices || [],
          currentIndex = preferred.indexOf(currentServiceId),
          nextIndex    = currentIndex + 1,
          nextServiceId;

      switch(true) {
        case (currentIndex == -1):
        case (nextIndex >= preferred.length):
          nextServiceId = preferred[0];
          break;
        default:
         nextServiceId = preferred[nextIndex];
      }

      logger.info(nextServiceId, currentIndex);
      return nextServiceId;
    }).then(null, utils.failedPromiseHandler(logger));
  }

  /*
   * Functions that defer to register
   */
  function get(serviceId) {
    return register.playlist(serviceId);
  }

  function programmeFor(serviceId) {
    return register.metadata(serviceId);
  }

  function all() {
    return register.stations()
  }
}
