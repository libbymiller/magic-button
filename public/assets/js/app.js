(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Logger = require('js-logger'),
    AppDispatcher = require('../dispatcher/dispatcher'),
    ActionTypes = require('../constants/constants').ActionTypes;

module.exports = {
  receiveInitialState: function (state) {
    Logger.debug('receiveInitialState', state);
    AppDispatcher.handleServerAction({
       type: ActionTypes.RECEIVE_INITIAL_STATE,
       state: state
    });
  },
  receiveStateUpdate: function (data) {
    var topic = data.topic.split('.')[0],
        state = data;

    Logger.debug('receiveStateUpdate', topic, state);

    AppDispatcher.handleServerAction({
       type: topic,
       state: state
    });
  },
  receiveAnnouncerState: function (state) {
    Logger.debug('receiveAnnouncerState', state);
    AppDispatcher.handleServerAction({
       type: ActionTypes.ANNOUNCER,
       state: state
    });
  },
  receiveAvoiderSettings: function (state) {
    Logger.debug('receiveAvoiderSettings', state);
    AppDispatcher.handleServerAction({
       type: ActionTypes.RECEIVE_AVOIDER_SETTINGS,
       state: state
    });
  },
  receiveRadioSettings: function (state) {
    Logger.debug('receiveRadioSettings', state);
    AppDispatcher.handleServerAction({
       type: ActionTypes.RECEIVE_RADIO_SETTINGS,
       state: state
    });
  }
};
},{"../constants/constants":17,"../dispatcher/dispatcher":18,"js-logger":50}],2:[function(require,module,exports){
var Logger = require('js-logger'),
    AppDispatcher = require('../dispatcher/dispatcher'),
    ActionTypes = require('../constants/constants').ActionTypes,
    PowerStore  = require('../stores/power'),
    AvoiderStore = require('../stores/avoider'),
    AnnouncerStore = require('../stores/announcer'),
    RadioSettingsStore = require('../stores/radio-settings');

module.exports = {
  togglePower: function () {
    var newState;
    Logger.debug('togglePower');
    AppDispatcher.handleViewAction({
       type: ActionTypes.POWER
    });
    newState = PowerStore.getState().isOn;
    require('../api/power')(newState);
  },
  changeVolume: function (vol) {
    Logger.debug('changeVolume', vol);
    AppDispatcher.handleViewAction({
       type: ActionTypes.VOLUME,
       state: { volume: vol }
    });
    require('../api/volume')(vol);
  },
  changeService: function (serviceId) {
    Logger.debug('changeService', serviceId);
    require('../api/service')(serviceId);
  },
  toggleAvoider: function () {
    var isAvoiding = AvoiderStore.getState().isAvoiding;
    Logger.debug('toggleAvoider - current state', isAvoiding);
    require('../api/avoid').set(isAvoiding);
  },
  requestAvoiderSettings: function () {
    require('../api/avoid').settings();
  },
  requestRadioSettings: function () {
    require('../api/radio-settings')();
  },
  avoiderSettings: function (params) {
    require('../api/avoid').settings(params);
  },
  toggleAnnouncer: function () {
    var isAnnouncing = AnnouncerStore.getState().isAnnouncing;
    Logger.debug('toggleAnnouncer - current state', isAnnouncing);
    require('../api/announce')(isAnnouncing);
  },
  toggleRadioSettingPreferredServer: function (serviceId) {
    RadioSettingsStore.togglePreferredService(serviceId);
    AppDispatcher.handleViewAction({
       type: ActionTypes.SETTINGS,
       state: RadioSettingsStore.getState()
    });
    require('../api/radio-settings')(RadioSettingsStore.getState());
  }
};
},{"../api/announce":3,"../api/avoid":4,"../api/power":5,"../api/radio-settings":6,"../api/service":7,"../api/volume":8,"../constants/constants":17,"../dispatcher/dispatcher":18,"../stores/announcer":24,"../stores/avoider":26,"../stores/power":30,"../stores/radio-settings":31,"js-logger":50}],3:[function(require,module,exports){
var xhr = require('../xhr'),
    success = require('../utils').success,
    failure = require('../utils').failure,
    ServerActionCreators = require('../actions/server-action-creators');

module.exports = function (isAnnouncing) {
  if (isAnnouncing == null) {
    xhr.get('/announcer/state.json')
       .then(function (data) {
          return JSON.parse(data);
       })
       .then(ServerActionCreators.receiveAnnouncerState, failure);
  }
  var method = isAnnouncing ? 'DELETE' : 'POST';
  xhr(method, '/announcer').catch(failure);
}
},{"../actions/server-action-creators":1,"../utils":33,"../xhr":36}],4:[function(require,module,exports){
var xhr = require('../xhr'),
    success = require('../utils').success,
    failure = require('../utils').failure,
    ServerActionCreators = require('../actions/server-action-creators');

module.exports.set = function (isAvoiding) {
  var method = isAvoiding ? 'DELETE' : 'POST';
  xhr(method, '/avoider');
}

module.exports.settings = function (data) {
  if (!data) {
    xhr.get('/avoider/settings.json')
       .then(function (data) {
        return JSON.parse(data);
       })
       .then(ServerActionCreators.receiveAvoiderSettings);
  } else {
    var payload = JSON.stringify(data),
        opts = {
          headers: { 'Content-type': 'application/json' },
          data: payload
        };
    xhr.post('/avoider/settings.json', opts);
  }
}
},{"../actions/server-action-creators":1,"../utils":33,"../xhr":36}],5:[function(require,module,exports){
var xhr = require('../xhr'),
    success = require('../utils').success,
    failure = require('../utils').failure;

module.exports = function (turnOn) {
  var method = turnOn ? 'PUT' : 'DELETE';
  xhr(method, '/radio/power');
}
},{"../utils":33,"../xhr":36}],6:[function(require,module,exports){
var xhr = require('../xhr'),
    utils = require('../utils'),
    success = utils.success,
    failure = utils.failure,
    ServerActionCreators = require('../actions/server-action-creators');

module.exports = function (data) {
  if (!data) {
    xhr.get('/radio/settings.json')
       .then(function (data) {
        return JSON.parse(data);
       })
       .then(ServerActionCreators.receiveRadioSettings)
       .catch(failure);
  } else {
    console.warn('data', data);
    var payload = JSON.stringify(data),
        opts = {
          headers: { 'Content-type': 'application/json' },
          data: payload
        };
    xhr.post('/radio/settings.json', opts).catch(failure);
  }
}
},{"../actions/server-action-creators":1,"../utils":33,"../xhr":36}],7:[function(require,module,exports){
var xhr = require('../xhr'),
    success = require('../utils').success,
    failure = require('../utils').failure;

module.exports = function (value) {
  xhr.post('/radio/service/' + value )
     .then(success('service'), failure('service'));
}
},{"../utils":33,"../xhr":36}],8:[function(require,module,exports){
var xhr = require('../xhr'),
    success = require('../utils').success,
    failure = require('../utils').failure;

module.exports = function (value) {
  xhr.post('/radio/volume/value/' + value )
     .then(success('volume'), failure('volume'));
}
},{"../utils":33,"../xhr":36}],9:[function(require,module,exports){
var api = require('./utils/api');

var PowerStore = require('./stores/power'),
    AudioStore = require('./stores/audio'),
    ServicesStore = require('./stores/services'),
    NowAndNextStore = require('./stores/now-and-next'),
    NowPlayingStore = require('./stores/now-playing'),
    CurrentServiceStore = require('./stores/current-service'),
    AvoiderStore = require('./stores/avoider'),
    AnnouncerStore = require('./stores/announcer'),
    RadioSettingsStore = require('./stores/radio-settings'),
    Logger = require('js-logger');

var AppView = require('./view');

AppView.init()
       .then(initState);

function initState() {
  Logger.info('init');

  PowerStore.addChangeListener(function () {
    AppView.set('power', PowerStore.getState());
  });

  AudioStore.addChangeListener(function () {
    AppView.set('audio', AudioStore.getState());
  });

  ServicesStore.addChangeListener(function () {
    AppView.set('services', ServicesStore.getAllServicesAsArray());
  });

  NowAndNextStore.addChangeListener(function (id) {
    var currentId = CurrentServiceStore.getCurrentId();
    if (currentId === id) {
      AppView.set('nowAndNext', NowAndNextStore.get(currentId));
    }
  });

  NowPlayingStore.addChangeListener(function (id) {
    var currentId = CurrentServiceStore.getCurrentId();
    if (currentId === id) {
      AppView.set('nowPlaying', NowPlayingStore.get(currentId));
    }
  });

  CurrentServiceStore.addChangeListener(function () {
    AppView.set('current', CurrentServiceStore.getCurrent());
  });

  AvoiderStore.addChangeListener(function () {
    AppView.set('avoider', AvoiderStore.getState());
  });

  AnnouncerStore.addChangeListener(function () {
    AppView.set('announcer', AnnouncerStore.getState());
  });

  RadioSettingsStore.addChangeListener(function () {
    AppView.set('settings', RadioSettingsStore.getState());
  });


  api.connectEventStream();
  api.getInitialState()
     .then(function (state) {
        if (state.debug && state.debug.logLevel) {
          var level = state.debug.logLevel.toUpperCase();
          console.log('Log level %o requested', level);
          Logger.useDefaults();
          if (Logger[level]) {
            Logger.setLevel(Logger[level]);
            console.log('Log level %o set', level);
          } else {
            console.warn('%o not available', level);
          }
        }
     });

  // Read announcer current state
  require('./api/announce')();
}
},{"./api/announce":3,"./stores/announcer":24,"./stores/audio":25,"./stores/avoider":26,"./stores/current-service":27,"./stores/now-and-next":28,"./stores/now-playing":29,"./stores/power":30,"./stores/radio-settings":31,"./stores/services":32,"./utils/api":34,"./view":35,"js-logger":50}],10:[function(require,module,exports){
var Ractive = require('ractive');

module.exports = Ractive.extend({
  template: '#announcerTmpl',
  isolated: true,
  twoway: false,
  debug: true,
  data: {
    settingsOpen: false,
    state: null
  },
  components: {
    CircularProgress: require('./circular-progress')
  },
  computed: {
    percentThrough: function () {
      var start = this.get('state.start'),
          end   = this.get('state.end'),
          now   = this.get('now'),
          duration,
          current,
          percentThrough;

      if (start && end && now) {
        duration = end - start;
        current  = now - start;

        percentThrough = current / duration;
        percentThrough = percentThrough.toFixed(2) * 100;
      } else if ( this.get('state.isAnnouncing') ) {
        percentThrough = 100;
      }

      if (percentThrough < 0) {
        percentThrough = 0;
      }

      if (percentThrough > 100) {
        percentThrough = 100;
      }

      // console.log('percentThrough', percentThrough, start, end, now);

      return percentThrough;
    },
    timeLeft: function () {
      var now   = this.get('now'),
          end   = this.get('state.end'),
          isInFuture = end > now,
          left = null;

      if (end && now && isInFuture) {
        left = this.formatTimeDiff( Math.round( (end - now) ) );
      }

      return left;
    }
  },
  init: function () {
    this.observe('state.end', function (newValue, oldValue) {
      if (newValue && !this.countdownTimerId) {
        this.countdownTimerId = window.setInterval(function () {
          this.set('now', new Date());
        }.bind(this), 1000);
      } else {
        window.clearInterval(this.countdownTimerId);
        this.countdownTimerId = null;
      }
    });
  }
});
},{"./circular-progress":12,"ractive":51}],11:[function(require,module,exports){
var Ractive = require('ractive');

module.exports = Ractive.extend({
  template: '#avoiderTmpl',
  isolated: true,
  twoway: true,
  debug: true,
  data: {
    settingsOpen: false,
    state: null
  },
  components: {
    CircularProgress: require('./circular-progress'),
    ServicesList: require('./services-list')
  },
  computed: {
    percentThrough: function () {
      var start = this.get('start'),
          end   = this.get('end'),
          now   = this.get('now'),
          duration,
          current,
          percentThrough;

      if (start && end && now) {
        duration = end - start;
        current  = now - start;

        percentThrough = current / duration;
        percentThrough = percentThrough.toFixed(2) * 100;
      } else if ( this.get('state.isAvoiding') ) {
        percentThrough = 100;
      }

      if (percentThrough < 0) {
        percentThrough = 0;
      }

      if (percentThrough > 100) {
        percentThrough = 100;
      }

      // console.log('percentThrough', percentThrough, start, end, now);

      return percentThrough;
    },
    timeLeft: function () {
      var now   = this.get('now'),
          end   = this.get('state.end'),
          isInFuture = end > now,
          left = null;

      if (end && now && isInFuture) {
        left = this.formatTimeDiff( Math.round( (end - now) ) );
      }

      return left;
    }
  },
  init: function () {
    this.observe('state.end', function (newValue, oldValue) {
      if (newValue && !this.countdownTimerId) {
        this.countdownTimerId = window.setInterval(function () {
          this.set('now', new Date());
        }.bind(this), 1000);
      } else {
        window.clearInterval(this.countdownTimerId);
        this.countdownTimerId = null;
      }
    });

    this.on('settings', function () {
      if (!this.get('settingsOpen')) {
        this.fire('settings-requested');
      }
      this.set('settingsOpen', !this.get('settingsOpen'));
    });

    this.on('avoid-service-setting', function (serviceId) {
      this.set('state.settings.serviceId', serviceId);
      this.fire('settings-changed', this.get('state.settings'));
    });

    this.on('state-settings-avoid-type', function (evt) {
      this.set('state.settings.avoidType', evt.node.value);
      this.fire('settings-changed', this.get('state.settings'));
    });
  },
  formatTimeDiff: function (diffInMs) {
    var diffSecs = diffInMs / 1000;
    var mins = diffSecs / 60;
    var secsLeft = Math.abs(Math.floor(mins) - mins);
    secsLeft = Math.floor(secsLeft * 60);
    if (secsLeft < 10) {
      secsLeft = '0' + secsLeft;
    }
    return Math.floor(mins) + 'm ' + secsLeft;
  }
});
},{"./circular-progress":12,"./services-list":15,"ractive":51}],12:[function(require,module,exports){
var Ractive = require('ractive'),
    d3      = require('../lib/d3');

var activeArc,
    inactiveArc,
    percentToAngle;

/*
  The arcs
*/
activeArc = d3.svg.arc()
              .innerRadius(44.4827586)
              .outerRadius(50)
              .startAngle(0);

inactiveArc = d3.svg.arc()
                .innerRadius(49.5)
                .outerRadius(50)
                .startAngle(0);

/*
  Helper to convert from 0-100 to 0-2Pi radians
*/
percentToAngle = d3.scale.linear()
                         .domain([0, 100])
                         .range([0, 2 * Math.PI])
                         .clamp([true]);

var initialState = {
  outerArcPath: inactiveArc({ endAngle: Math.PI * 2 }),
  progressArcPath: activeArc({ endAngle: 0 })
};

var CircularProgress = Ractive.extend({
  template: '#progressTempl',
  isolated: true,
  twoway: false,
  debug: true,
  computed: {
    angle: function () {
      var percentThrough = this.get('percentThrough');
      return percentThrough ? percentToAngle(percentThrough) : 0;
    }
  },
  init: function () {
    this.set(initialState);

    this.observe('angle', function (angle) {
      arc = activeArc;
      this.set({
        progressArcPath: arc({ endAngle: angle })
      });
    });
  }
});

module.exports = CircularProgress;
},{"../lib/d3":19,"ractive":51}],13:[function(require,module,exports){
var Ractive = require('ractive');

module.exports = Ractive.extend({
  template: '#controlsTmpl',
  isolated: true,
  twoway: false,
  debug: true,
  components: {
    Playout      : require('./simple')('#playoutTmpl'),
    ServicesList : require('./services-list'),
    Volume       : require('./simple')('#volumeTmpl'),
    Metadata     : require('./metadata'),
    Avoider      : require('./avoider'),
    Announcer    : require('./announcer')
  },
  data: {
    servicesPanel: {
      isOpen: false
    }
  },
  init: function () {
    this.on({
      'services-panel-toggle': function (evt) {
        var currentState = this.get('servicesPanel.isOpen');
        this.set('servicesPanel.isOpen', !currentState);
      },
      'volume-panel-toggle': function (evt) {
        var currentState = this.get('volume.isOpen');
        this.set('volume.isOpen', !currentState);
      }
    });
  }
});
},{"./announcer":10,"./avoider":11,"./metadata":14,"./services-list":15,"./simple":16,"ractive":51}],14:[function(require,module,exports){
var Ractive = require('ractive');

module.exports = Ractive.extend({
  template: '#metadataTmpl',
  isolated: true,
  debug: true,
  twoway: false,
  data: {
    view: 'prog',
    first: function (array) {
      return array[0];
    },
    imageUrl: function (template, size) {
      return template.replace('$recipe', size);
    }
  },
  init: function () {
    this.on('track-display', function () {
      var current = this.get('view');
      this.set('view', current === 'track' ? 'prog' : 'track');
    });
  }
});
},{"ractive":51}],15:[function(require,module,exports){
var Ractive = require('ractive');

module.exports = Ractive.extend({
  template: '#servicesTmpl',
  isolated: true,
  twoway: false,
  debug: true,
  init: function () {
    var self = this;
    this.on({
      'services-partial': function (evt) {
        evt.original.preventDefault();
        var serviceId = evt.context.id;
        self.fire('selected', serviceId);
      }
    });
  }
});
},{"ractive":51}],16:[function(require,module,exports){
var Ractive = require('ractive');

module.exports = function (selector) {
  return Ractive.extend({
    template: selector,
    isolated: true,
    twoway: false,
    debug: true,
    components: {
      ServicesList: require('./services-list')
    }
  });
};
},{"./services-list":15,"ractive":51}],17:[function(require,module,exports){
module.exports = {
  ActionTypes: {
    RECEIVE_INITIAL_STATE: 'RECEIVE_INITIAL_STATE',
    RECEIVE_STATE_UPDATE : 'RECEIVE_STATE_UPDATE',
    RECEIVE_AVOIDER_SETTINGS : 'RECEIVE_AVOIDER_SETTINGS',
    RECEIVE_RADIO_SETTINGS : 'RECEIVE_RADIO_SETTINGS',
    POWER : 'power',
    AUDIO : 'audio',
    SERVICE : 'service',
    SETTINGS : 'settings',
    NOW_AND_NEXT : 'nowAndNext',
    NOW_PLAYING : 'nowPlaying',
    AVOIDER : 'avoider',
    ANNOUNCER : 'announcer'
  },
  Payload: {
    SERVER_ACTION: 'SERVER_ACTION',
    VIEW_ACTION  : 'VIEW_ACTION'
  }
};
},{}],18:[function(require,module,exports){

var _ = require('underscore'),
    Dispatcher = require('../lib/flux').Dispatcher,
    Constants  = require('../constants/constants');

module.exports = _.extend(new Dispatcher(), {
  handleServerAction: function(action) {
    var payload = {
      source: Constants.Payload.SERVER_ACTION,
      action: action
    };
    this.dispatch(payload);
  },
  handleViewAction: function(action) {
    var payload = {
      source: Constants.Payload.VIEW_ACTION,
      action: action
    };
    this.dispatch(payload);
  }
});
},{"../constants/constants":17,"../lib/flux":20,"underscore":52}],19:[function(require,module,exports){
!function() {
  var d3 = {
    version: "3.4.4"
  };
  if (!Date.now) Date.now = function() {
    return +new Date();
  };
  var d3_arraySlice = [].slice, d3_array = function(list) {
    return d3_arraySlice.call(list);
  };
  var d3_document = document, d3_documentElement = d3_document.documentElement, d3_window = window;
  try {
    d3_array(d3_documentElement.childNodes)[0].nodeType;
  } catch (e) {
    d3_array = function(list) {
      var i = list.length, array = new Array(i);
      while (i--) array[i] = list[i];
      return array;
    };
  }
  try {
    d3_document.createElement("div").style.setProperty("opacity", 0, "");
  } catch (error) {
    var d3_element_prototype = d3_window.Element.prototype, d3_element_setAttribute = d3_element_prototype.setAttribute, d3_element_setAttributeNS = d3_element_prototype.setAttributeNS, d3_style_prototype = d3_window.CSSStyleDeclaration.prototype, d3_style_setProperty = d3_style_prototype.setProperty;
    d3_element_prototype.setAttribute = function(name, value) {
      d3_element_setAttribute.call(this, name, value + "");
    };
    d3_element_prototype.setAttributeNS = function(space, local, value) {
      d3_element_setAttributeNS.call(this, space, local, value + "");
    };
    d3_style_prototype.setProperty = function(name, value, priority) {
      d3_style_setProperty.call(this, name, value + "", priority);
    };
  }
  d3.ascending = d3_ascending;
  function d3_ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }
  d3.descending = function(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  };
  d3.min = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
      while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
    }
    return a;
  };
  d3.max = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n && !((a = array[i]) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
      while (++i < n && !((a = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
    }
    return a;
  };
  d3.extent = function(array, f) {
    var i = -1, n = array.length, a, b, c;
    if (arguments.length === 1) {
      while (++i < n && !((a = c = array[i]) != null && a <= a)) a = c = undefined;
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    } else {
      while (++i < n && !((a = c = f.call(array, array[i], i)) != null && a <= a)) a = undefined;
      while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
    return [ a, c ];
  };
  d3.sum = function(array, f) {
    var s = 0, n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (!isNaN(a = +array[i])) s += a;
    } else {
      while (++i < n) if (!isNaN(a = +f.call(array, array[i], i))) s += a;
    }
    return s;
  };
  function d3_number(x) {
    return x != null && !isNaN(x);
  }
  d3.mean = function(array, f) {
    var n = array.length, a, m = 0, i = -1, j = 0;
    if (arguments.length === 1) {
      while (++i < n) if (d3_number(a = array[i])) m += (a - m) / ++j;
    } else {
      while (++i < n) if (d3_number(a = f.call(array, array[i], i))) m += (a - m) / ++j;
    }
    return j ? m : undefined;
  };
  d3.quantile = function(values, p) {
    var H = (values.length - 1) * p + 1, h = Math.floor(H), v = +values[h - 1], e = H - h;
    return e ? v + e * (values[h] - v) : v;
  };
  d3.median = function(array, f) {
    if (arguments.length > 1) array = array.map(f);
    array = array.filter(d3_number);
    return array.length ? d3.quantile(array.sort(d3_ascending), .5) : undefined;
  };
  function d3_bisector(compare) {
    return {
      left: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1; else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid; else lo = mid + 1;
        }
        return lo;
      }
    };
  }
  var d3_bisect = d3_bisector(d3_ascending);
  d3.bisectLeft = d3_bisect.left;
  d3.bisect = d3.bisectRight = d3_bisect.right;
  d3.bisector = function(f) {
    return d3_bisector(f.length === 1 ? function(d, x) {
      return d3_ascending(f(d), x);
    } : f);
  };
  d3.shuffle = function(array) {
    var m = array.length, t, i;
    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m], array[m] = array[i], array[i] = t;
    }
    return array;
  };
  d3.permute = function(array, indexes) {
    var i = indexes.length, permutes = new Array(i);
    while (i--) permutes[i] = array[indexes[i]];
    return permutes;
  };
  d3.pairs = function(array) {
    var i = 0, n = array.length - 1, p0, p1 = array[0], pairs = new Array(n < 0 ? 0 : n);
    while (i < n) pairs[i] = [ p0 = p1, p1 = array[++i] ];
    return pairs;
  };
  d3.zip = function() {
    if (!(n = arguments.length)) return [];
    for (var i = -1, m = d3.min(arguments, d3_zipLength), zips = new Array(m); ++i < m; ) {
      for (var j = -1, n, zip = zips[i] = new Array(n); ++j < n; ) {
        zip[j] = arguments[j][i];
      }
    }
    return zips;
  };
  function d3_zipLength(d) {
    return d.length;
  }
  d3.transpose = function(matrix) {
    return d3.zip.apply(d3, matrix);
  };
  d3.keys = function(map) {
    var keys = [];
    for (var key in map) keys.push(key);
    return keys;
  };
  d3.values = function(map) {
    var values = [];
    for (var key in map) values.push(map[key]);
    return values;
  };
  d3.entries = function(map) {
    var entries = [];
    for (var key in map) entries.push({
      key: key,
      value: map[key]
    });
    return entries;
  };
  d3.merge = function(arrays) {
    var n = arrays.length, m, i = -1, j = 0, merged, array;
    while (++i < n) j += arrays[i].length;
    merged = new Array(j);
    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }
    return merged;
  };
  var abs = Math.abs;
  d3.range = function(start, stop, step) {
    if (arguments.length < 3) {
      step = 1;
      if (arguments.length < 2) {
        stop = start;
        start = 0;
      }
    }
    if ((stop - start) / step === Infinity) throw new Error("infinite range");
    var range = [], k = d3_range_integerScale(abs(step)), i = -1, j;
    start *= k, stop *= k, step *= k;
    if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k); else while ((j = start + step * ++i) < stop) range.push(j / k);
    return range;
  };
  function d3_range_integerScale(x) {
    var k = 1;
    while (x * k % 1) k *= 10;
    return k;
  }
  function d3_class(ctor, properties) {
    try {
      for (var key in properties) {
        Object.defineProperty(ctor.prototype, key, {
          value: properties[key],
          enumerable: false
        });
      }
    } catch (e) {
      ctor.prototype = properties;
    }
  }
  d3.map = function(object) {
    var map = new d3_Map();
    if (object instanceof d3_Map) object.forEach(function(key, value) {
      map.set(key, value);
    }); else for (var key in object) map.set(key, object[key]);
    return map;
  };
  function d3_Map() {}
  d3_class(d3_Map, {
    has: d3_map_has,
    get: function(key) {
      return this[d3_map_prefix + key];
    },
    set: function(key, value) {
      return this[d3_map_prefix + key] = value;
    },
    remove: d3_map_remove,
    keys: d3_map_keys,
    values: function() {
      var values = [];
      this.forEach(function(key, value) {
        values.push(value);
      });
      return values;
    },
    entries: function() {
      var entries = [];
      this.forEach(function(key, value) {
        entries.push({
          key: key,
          value: value
        });
      });
      return entries;
    },
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) f.call(this, key.substring(1), this[key]);
    }
  });
  var d3_map_prefix = "\x00", d3_map_prefixCode = d3_map_prefix.charCodeAt(0);
  function d3_map_has(key) {
    return d3_map_prefix + key in this;
  }
  function d3_map_remove(key) {
    key = d3_map_prefix + key;
    return key in this && delete this[key];
  }
  function d3_map_keys() {
    var keys = [];
    this.forEach(function(key) {
      keys.push(key);
    });
    return keys;
  }
  function d3_map_size() {
    var size = 0;
    for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) ++size;
    return size;
  }
  function d3_map_empty() {
    for (var key in this) if (key.charCodeAt(0) === d3_map_prefixCode) return false;
    return true;
  }
  d3.nest = function() {
    var nest = {}, keys = [], sortKeys = [], sortValues, rollup;
    function map(mapType, array, depth) {
      if (depth >= keys.length) return rollup ? rollup.call(nest, array) : sortValues ? array.sort(sortValues) : array;
      var i = -1, n = array.length, key = keys[depth++], keyValue, object, setter, valuesByKey = new d3_Map(), values;
      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(object = array[i]))) {
          values.push(object);
        } else {
          valuesByKey.set(keyValue, [ object ]);
        }
      }
      if (mapType) {
        object = mapType();
        setter = function(keyValue, values) {
          object.set(keyValue, map(mapType, values, depth));
        };
      } else {
        object = {};
        setter = function(keyValue, values) {
          object[keyValue] = map(mapType, values, depth);
        };
      }
      valuesByKey.forEach(setter);
      return object;
    }
    function entries(map, depth) {
      if (depth >= keys.length) return map;
      var array = [], sortKey = sortKeys[depth++];
      map.forEach(function(key, keyMap) {
        array.push({
          key: key,
          values: entries(keyMap, depth)
        });
      });
      return sortKey ? array.sort(function(a, b) {
        return sortKey(a.key, b.key);
      }) : array;
    }
    nest.map = function(array, mapType) {
      return map(mapType, array, 0);
    };
    nest.entries = function(array) {
      return entries(map(d3.map, array, 0), 0);
    };
    nest.key = function(d) {
      keys.push(d);
      return nest;
    };
    nest.sortKeys = function(order) {
      sortKeys[keys.length - 1] = order;
      return nest;
    };
    nest.sortValues = function(order) {
      sortValues = order;
      return nest;
    };
    nest.rollup = function(f) {
      rollup = f;
      return nest;
    };
    return nest;
  };
  d3.set = function(array) {
    var set = new d3_Set();
    if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
    return set;
  };
  function d3_Set() {}
  d3_class(d3_Set, {
    has: d3_map_has,
    add: function(value) {
      this[d3_map_prefix + value] = true;
      return value;
    },
    remove: function(value) {
      value = d3_map_prefix + value;
      return value in this && delete this[value];
    },
    values: d3_map_keys,
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var value in this) if (value.charCodeAt(0) === d3_map_prefixCode) f.call(this, value.substring(1));
    }
  });
  d3.behavior = {};
  d3.rebind = function(target, source) {
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
    return target;
  };
  function d3_rebind(target, source, method) {
    return function() {
      var value = method.apply(source, arguments);
      return value === source ? target : value;
    };
  }
  function d3_vendorSymbol(object, name) {
    if (name in object) return name;
    name = name.charAt(0).toUpperCase() + name.substring(1);
    for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
      var prefixName = d3_vendorPrefixes[i] + name;
      if (prefixName in object) return prefixName;
    }
  }
  var d3_vendorPrefixes = [ "webkit", "ms", "moz", "Moz", "o", "O" ];
  function d3_noop() {}
  d3.dispatch = function() {
    var dispatch = new d3_dispatch(), i = -1, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    return dispatch;
  };
  function d3_dispatch() {}
  d3_dispatch.prototype.on = function(type, listener) {
    var i = type.indexOf("."), name = "";
    if (i >= 0) {
      name = type.substring(i + 1);
      type = type.substring(0, i);
    }
    if (type) return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);
    if (arguments.length === 2) {
      if (listener == null) for (type in this) {
        if (this.hasOwnProperty(type)) this[type].on(name, null);
      }
      return this;
    }
  };
  function d3_dispatch_event(dispatch) {
    var listeners = [], listenerByName = new d3_Map();
    function event() {
      var z = listeners, i = -1, n = z.length, l;
      while (++i < n) if (l = z[i].on) l.apply(this, arguments);
      return dispatch;
    }
    event.on = function(name, listener) {
      var l = listenerByName.get(name), i;
      if (arguments.length < 2) return l && l.on;
      if (l) {
        l.on = null;
        listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
        listenerByName.remove(name);
      }
      if (listener) listeners.push(listenerByName.set(name, {
        on: listener
      }));
      return dispatch;
    };
    return event;
  }
  d3.event = null;
  function d3_eventPreventDefault() {
    d3.event.preventDefault();
  }
  function d3_eventSource() {
    var e = d3.event, s;
    while (s = e.sourceEvent) e = s;
    return e;
  }
  function d3_eventDispatch(target) {
    var dispatch = new d3_dispatch(), i = 0, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    dispatch.of = function(thiz, argumentz) {
      return function(e1) {
        try {
          var e0 = e1.sourceEvent = d3.event;
          e1.target = target;
          d3.event = e1;
          dispatch[e1.type].apply(thiz, argumentz);
        } finally {
          d3.event = e0;
        }
      };
    };
    return dispatch;
  }
  d3.requote = function(s) {
    return s.replace(d3_requote_re, "\\$&");
  };
  var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  var d3_subclass = {}.__proto__ ? function(object, prototype) {
    object.__proto__ = prototype;
  } : function(object, prototype) {
    for (var property in prototype) object[property] = prototype[property];
  };
  function d3_selection(groups) {
    d3_subclass(groups, d3_selectionPrototype);
    return groups;
  }
  var d3_select = function(s, n) {
    return n.querySelector(s);
  }, d3_selectAll = function(s, n) {
    return n.querySelectorAll(s);
  }, d3_selectMatcher = d3_documentElement[d3_vendorSymbol(d3_documentElement, "matchesSelector")], d3_selectMatches = function(n, s) {
    return d3_selectMatcher.call(n, s);
  };
  if (typeof Sizzle === "function") {
    d3_select = function(s, n) {
      return Sizzle(s, n)[0] || null;
    };
    d3_selectAll = Sizzle;
    d3_selectMatches = Sizzle.matchesSelector;
  }
  d3.selection = function() {
    return d3_selectionRoot;
  };
  var d3_selectionPrototype = d3.selection.prototype = [];
  d3_selectionPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, group, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(subnode = selector.call(node, node.__data__, i, j));
          if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selector(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_select(selector, this);
    };
  }
  d3_selectionPrototype.selectAll = function(selector) {
    var subgroups = [], subgroup, node;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
          subgroup.parentNode = node;
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selectorAll(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_selectAll(selector, this);
    };
  }
  var d3_nsPrefix = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: "http://www.w3.org/1999/xhtml",
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };
  d3.ns = {
    prefix: d3_nsPrefix,
    qualify: function(name) {
      var i = name.indexOf(":"), prefix = name;
      if (i >= 0) {
        prefix = name.substring(0, i);
        name = name.substring(i + 1);
      }
      return d3_nsPrefix.hasOwnProperty(prefix) ? {
        space: d3_nsPrefix[prefix],
        local: name
      } : name;
    }
  };
  d3_selectionPrototype.attr = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node();
        name = d3.ns.qualify(name);
        return name.local ? node.getAttributeNS(name.space, name.local) : node.getAttribute(name);
      }
      for (value in name) this.each(d3_selection_attr(value, name[value]));
      return this;
    }
    return this.each(d3_selection_attr(name, value));
  };
  function d3_selection_attr(name, value) {
    name = d3.ns.qualify(name);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrConstant() {
      this.setAttribute(name, value);
    }
    function attrConstantNS() {
      this.setAttributeNS(name.space, name.local, value);
    }
    function attrFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttribute(name); else this.setAttribute(name, x);
    }
    function attrFunctionNS() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttributeNS(name.space, name.local); else this.setAttributeNS(name.space, name.local, x);
    }
    return value == null ? name.local ? attrNullNS : attrNull : typeof value === "function" ? name.local ? attrFunctionNS : attrFunction : name.local ? attrConstantNS : attrConstant;
  }
  function d3_collapse(s) {
    return s.trim().replace(/\s+/g, " ");
  }
  d3_selectionPrototype.classed = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node(), n = (name = d3_selection_classes(name)).length, i = -1;
        if (value = node.classList) {
          while (++i < n) if (!value.contains(name[i])) return false;
        } else {
          value = node.getAttribute("class");
          while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
        }
        return true;
      }
      for (value in name) this.each(d3_selection_classed(value, name[value]));
      return this;
    }
    return this.each(d3_selection_classed(name, value));
  };
  function d3_selection_classedRe(name) {
    return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
  }
  function d3_selection_classes(name) {
    return name.trim().split(/^|\s+/);
  }
  function d3_selection_classed(name, value) {
    name = d3_selection_classes(name).map(d3_selection_classedName);
    var n = name.length;
    function classedConstant() {
      var i = -1;
      while (++i < n) name[i](this, value);
    }
    function classedFunction() {
      var i = -1, x = value.apply(this, arguments);
      while (++i < n) name[i](this, x);
    }
    return typeof value === "function" ? classedFunction : classedConstant;
  }
  function d3_selection_classedName(name) {
    var re = d3_selection_classedRe(name);
    return function(node, value) {
      if (c = node.classList) return value ? c.add(name) : c.remove(name);
      var c = node.getAttribute("class") || "";
      if (value) {
        re.lastIndex = 0;
        if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
      } else {
        node.setAttribute("class", d3_collapse(c.replace(re, " ")));
      }
    };
  }
  d3_selectionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
        return this;
      }
      if (n < 2) return d3_window.getComputedStyle(this.node(), null).getPropertyValue(name);
      priority = "";
    }
    return this.each(d3_selection_style(name, value, priority));
  };
  function d3_selection_style(name, value, priority) {
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleConstant() {
      this.style.setProperty(name, value, priority);
    }
    function styleFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.style.removeProperty(name); else this.style.setProperty(name, x, priority);
    }
    return value == null ? styleNull : typeof value === "function" ? styleFunction : styleConstant;
  }
  d3_selectionPrototype.property = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") return this.node()[name];
      for (value in name) this.each(d3_selection_property(value, name[value]));
      return this;
    }
    return this.each(d3_selection_property(name, value));
  };
  function d3_selection_property(name, value) {
    function propertyNull() {
      delete this[name];
    }
    function propertyConstant() {
      this[name] = value;
    }
    function propertyFunction() {
      var x = value.apply(this, arguments);
      if (x == null) delete this[name]; else this[name] = x;
    }
    return value == null ? propertyNull : typeof value === "function" ? propertyFunction : propertyConstant;
  }
  d3_selectionPrototype.text = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    } : value == null ? function() {
      this.textContent = "";
    } : function() {
      this.textContent = value;
    }) : this.node().textContent;
  };
  d3_selectionPrototype.html = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    } : value == null ? function() {
      this.innerHTML = "";
    } : function() {
      this.innerHTML = value;
    }) : this.node().innerHTML;
  };
  d3_selectionPrototype.append = function(name) {
    name = d3_selection_creator(name);
    return this.select(function() {
      return this.appendChild(name.apply(this, arguments));
    });
  };
  function d3_selection_creator(name) {
    return typeof name === "function" ? name : (name = d3.ns.qualify(name)).local ? function() {
      return this.ownerDocument.createElementNS(name.space, name.local);
    } : function() {
      return this.ownerDocument.createElementNS(this.namespaceURI, name);
    };
  }
  d3_selectionPrototype.insert = function(name, before) {
    name = d3_selection_creator(name);
    before = d3_selection_selector(before);
    return this.select(function() {
      return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
    });
  };
  d3_selectionPrototype.remove = function() {
    return this.each(function() {
      var parent = this.parentNode;
      if (parent) parent.removeChild(this);
    });
  };
  d3_selectionPrototype.data = function(value, key) {
    var i = -1, n = this.length, group, node;
    if (!arguments.length) {
      value = new Array(n = (group = this[0]).length);
      while (++i < n) {
        if (node = group[i]) {
          value[i] = node.__data__;
        }
      }
      return value;
    }
    function bind(group, groupData) {
      var i, n = group.length, m = groupData.length, n0 = Math.min(n, m), updateNodes = new Array(m), enterNodes = new Array(m), exitNodes = new Array(n), node, nodeData;
      if (key) {
        var nodeByKeyValue = new d3_Map(), dataByKeyValue = new d3_Map(), keyValues = [], keyValue;
        for (i = -1; ++i < n; ) {
          keyValue = key.call(node = group[i], node.__data__, i);
          if (nodeByKeyValue.has(keyValue)) {
            exitNodes[i] = node;
          } else {
            nodeByKeyValue.set(keyValue, node);
          }
          keyValues.push(keyValue);
        }
        for (i = -1; ++i < m; ) {
          keyValue = key.call(groupData, nodeData = groupData[i], i);
          if (node = nodeByKeyValue.get(keyValue)) {
            updateNodes[i] = node;
            node.__data__ = nodeData;
          } else if (!dataByKeyValue.has(keyValue)) {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
          dataByKeyValue.set(keyValue, nodeData);
          nodeByKeyValue.remove(keyValue);
        }
        for (i = -1; ++i < n; ) {
          if (nodeByKeyValue.has(keyValues[i])) {
            exitNodes[i] = group[i];
          }
        }
      } else {
        for (i = -1; ++i < n0; ) {
          node = group[i];
          nodeData = groupData[i];
          if (node) {
            node.__data__ = nodeData;
            updateNodes[i] = node;
          } else {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
        }
        for (;i < m; ++i) {
          enterNodes[i] = d3_selection_dataNode(groupData[i]);
        }
        for (;i < n; ++i) {
          exitNodes[i] = group[i];
        }
      }
      enterNodes.update = updateNodes;
      enterNodes.parentNode = updateNodes.parentNode = exitNodes.parentNode = group.parentNode;
      enter.push(enterNodes);
      update.push(updateNodes);
      exit.push(exitNodes);
    }
    var enter = d3_selection_enter([]), update = d3_selection([]), exit = d3_selection([]);
    if (typeof value === "function") {
      while (++i < n) {
        bind(group = this[i], value.call(group, group.parentNode.__data__, i));
      }
    } else {
      while (++i < n) {
        bind(group = this[i], value);
      }
    }
    update.enter = function() {
      return enter;
    };
    update.exit = function() {
      return exit;
    };
    return update;
  };
  function d3_selection_dataNode(data) {
    return {
      __data__: data
    };
  }
  d3_selectionPrototype.datum = function(value) {
    return arguments.length ? this.property("__data__", value) : this.property("__data__");
  };
  d3_selectionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_filter(selector) {
    return function() {
      return d3_selectMatches(this, selector);
    };
  }
  d3_selectionPrototype.order = function() {
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  };
  d3_selectionPrototype.sort = function(comparator) {
    comparator = d3_selection_sortComparator.apply(this, arguments);
    for (var j = -1, m = this.length; ++j < m; ) this[j].sort(comparator);
    return this.order();
  };
  function d3_selection_sortComparator(comparator) {
    if (!arguments.length) comparator = d3_ascending;
    return function(a, b) {
      return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
    };
  }
  d3_selectionPrototype.each = function(callback) {
    return d3_selection_each(this, function(node, i, j) {
      callback.call(node, node.__data__, i, j);
    });
  };
  function d3_selection_each(groups, callback) {
    for (var j = 0, m = groups.length; j < m; j++) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
        if (node = group[i]) callback(node, i, j);
      }
    }
    return groups;
  }
  d3_selectionPrototype.call = function(callback) {
    var args = d3_array(arguments);
    callback.apply(args[0] = this, args);
    return this;
  };
  d3_selectionPrototype.empty = function() {
    return !this.node();
  };
  d3_selectionPrototype.node = function() {
    for (var j = 0, m = this.length; j < m; j++) {
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        var node = group[i];
        if (node) return node;
      }
    }
    return null;
  };
  d3_selectionPrototype.size = function() {
    var n = 0;
    this.each(function() {
      ++n;
    });
    return n;
  };
  function d3_selection_enter(selection) {
    d3_subclass(selection, d3_selection_enterPrototype);
    return selection;
  }
  var d3_selection_enterPrototype = [];
  d3.selection.enter = d3_selection_enter;
  d3.selection.enter.prototype = d3_selection_enterPrototype;
  d3_selection_enterPrototype.append = d3_selectionPrototype.append;
  d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
  d3_selection_enterPrototype.node = d3_selectionPrototype.node;
  d3_selection_enterPrototype.call = d3_selectionPrototype.call;
  d3_selection_enterPrototype.size = d3_selectionPrototype.size;
  d3_selection_enterPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, upgroup, group, node;
    for (var j = -1, m = this.length; ++j < m; ) {
      upgroup = (group = this[j]).update;
      subgroups.push(subgroup = []);
      subgroup.parentNode = group.parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
          subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  d3_selection_enterPrototype.insert = function(name, before) {
    if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
    return d3_selectionPrototype.insert.call(this, name, before);
  };
  function d3_selection_enterInsertBefore(enter) {
    var i0, j0;
    return function(d, i, j) {
      var group = enter[j].update, n = group.length, node;
      if (j != j0) j0 = j, i0 = 0;
      if (i >= i0) i0 = i + 1;
      while (!(node = group[i0]) && ++i0 < n) ;
      return node;
    };
  }
  d3_selectionPrototype.transition = function() {
    var id = d3_transitionInheritId || ++d3_transitionId, subgroups = [], subgroup, node, transition = d3_transitionInherit || {
      time: Date.now(),
      ease: d3_ease_cubicInOut,
      delay: 0,
      duration: 250
    };
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) d3_transitionNode(node, i, id, transition);
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_selectionPrototype.interrupt = function() {
    return this.each(d3_selection_interrupt);
  };
  function d3_selection_interrupt() {
    var lock = this.__transition__;
    if (lock) ++lock.active;
  }
  d3.select = function(node) {
    var group = [ typeof node === "string" ? d3_select(node, d3_document) : node ];
    group.parentNode = d3_documentElement;
    return d3_selection([ group ]);
  };
  d3.selectAll = function(nodes) {
    var group = d3_array(typeof nodes === "string" ? d3_selectAll(nodes, d3_document) : nodes);
    group.parentNode = d3_documentElement;
    return d3_selection([ group ]);
  };
  var d3_selectionRoot = d3.select(d3_documentElement);
  d3_selectionPrototype.on = function(type, listener, capture) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof type !== "string") {
        if (n < 2) listener = false;
        for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
        return this;
      }
      if (n < 2) return (n = this.node()["__on" + type]) && n._;
      capture = false;
    }
    return this.each(d3_selection_on(type, listener, capture));
  };
  function d3_selection_on(type, listener, capture) {
    var name = "__on" + type, i = type.indexOf("."), wrap = d3_selection_onListener;
    if (i > 0) type = type.substring(0, i);
    var filter = d3_selection_onFilters.get(type);
    if (filter) type = filter, wrap = d3_selection_onFilter;
    function onRemove() {
      var l = this[name];
      if (l) {
        this.removeEventListener(type, l, l.$);
        delete this[name];
      }
    }
    function onAdd() {
      var l = wrap(listener, d3_array(arguments));
      onRemove.call(this);
      this.addEventListener(type, this[name] = l, l.$ = capture);
      l._ = listener;
    }
    function removeAll() {
      var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"), match;
      for (var name in this) {
        if (match = name.match(re)) {
          var l = this[name];
          this.removeEventListener(match[1], l, l.$);
          delete this[name];
        }
      }
    }
    return i ? listener ? onAdd : onRemove : listener ? d3_noop : removeAll;
  }
  var d3_selection_onFilters = d3.map({
    mouseenter: "mouseover",
    mouseleave: "mouseout"
  });
  d3_selection_onFilters.forEach(function(k) {
    if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
  });
  function d3_selection_onListener(listener, argumentz) {
    return function(e) {
      var o = d3.event;
      d3.event = e;
      argumentz[0] = this.__data__;
      try {
        listener.apply(this, argumentz);
      } finally {
        d3.event = o;
      }
    };
  }
  function d3_selection_onFilter(listener, argumentz) {
    var l = d3_selection_onListener(listener, argumentz);
    return function(e) {
      var target = this, related = e.relatedTarget;
      if (!related || related !== target && !(related.compareDocumentPosition(target) & 8)) {
        l.call(target, e);
      }
    };
  }
  var d3_event_dragSelect = "onselectstart" in d3_document ? null : d3_vendorSymbol(d3_documentElement.style, "userSelect"), d3_event_dragId = 0;
  function d3_event_dragSuppress() {
    var name = ".dragsuppress-" + ++d3_event_dragId, click = "click" + name, w = d3.select(d3_window).on("touchmove" + name, d3_eventPreventDefault).on("dragstart" + name, d3_eventPreventDefault).on("selectstart" + name, d3_eventPreventDefault);
    if (d3_event_dragSelect) {
      var style = d3_documentElement.style, select = style[d3_event_dragSelect];
      style[d3_event_dragSelect] = "none";
    }
    return function(suppressClick) {
      w.on(name, null);
      if (d3_event_dragSelect) style[d3_event_dragSelect] = select;
      if (suppressClick) {
        function off() {
          w.on(click, null);
        }
        w.on(click, function() {
          d3_eventPreventDefault();
          off();
        }, true);
        setTimeout(off, 0);
      }
    };
  }
  d3.mouse = function(container) {
    return d3_mousePoint(container, d3_eventSource());
  };
  function d3_mousePoint(container, e) {
    if (e.changedTouches) e = e.changedTouches[0];
    var svg = container.ownerSVGElement || container;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = e.clientX, point.y = e.clientY;
      point = point.matrixTransform(container.getScreenCTM().inverse());
      return [ point.x, point.y ];
    }
    var rect = container.getBoundingClientRect();
    return [ e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop ];
  }
  d3.touches = function(container, touches) {
    if (arguments.length < 2) touches = d3_eventSource().touches;
    return touches ? d3_array(touches).map(function(touch) {
      var point = d3_mousePoint(container, touch);
      point.identifier = touch.identifier;
      return point;
    }) : [];
  };
  d3.behavior.drag = function() {
    var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"), origin = null, mousedown = dragstart(d3_noop, d3.mouse, d3_behavior_dragMouseSubject, "mousemove", "mouseup"), touchstart = dragstart(d3_behavior_dragTouchId, d3.touch, d3_behavior_dragTouchSubject, "touchmove", "touchend");
    function drag() {
      this.on("mousedown.drag", mousedown).on("touchstart.drag", touchstart);
    }
    function dragstart(id, position, subject, move, end) {
      return function() {
        var that = this, target = d3.event.target, parent = that.parentNode, dispatch = event.of(that, arguments), dragged = 0, dragId = id(), dragName = ".drag" + (dragId == null ? "" : "-" + dragId), dragOffset, dragSubject = d3.select(subject()).on(move + dragName, moved).on(end + dragName, ended), dragRestore = d3_event_dragSuppress(), position0 = position(parent, dragId);
        if (origin) {
          dragOffset = origin.apply(that, arguments);
          dragOffset = [ dragOffset.x - position0[0], dragOffset.y - position0[1] ];
        } else {
          dragOffset = [ 0, 0 ];
        }
        dispatch({
          type: "dragstart"
        });
        function moved() {
          var position1 = position(parent, dragId), dx, dy;
          if (!position1) return;
          dx = position1[0] - position0[0];
          dy = position1[1] - position0[1];
          dragged |= dx | dy;
          position0 = position1;
          dispatch({
            type: "drag",
            x: position1[0] + dragOffset[0],
            y: position1[1] + dragOffset[1],
            dx: dx,
            dy: dy
          });
        }
        function ended() {
          if (!position(parent, dragId)) return;
          dragSubject.on(move + dragName, null).on(end + dragName, null);
          dragRestore(dragged && d3.event.target === target);
          dispatch({
            type: "dragend"
          });
        }
      };
    }
    drag.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return drag;
    };
    return d3.rebind(drag, event, "on");
  };
  function d3_behavior_dragTouchId() {
    return d3.event.changedTouches[0].identifier;
  }
  function d3_behavior_dragTouchSubject() {
    return d3.event.target;
  }
  function d3_behavior_dragMouseSubject() {
    return d3_window;
  }
  var π = Math.PI, τ = 2 * π, halfπ = π / 2, ε = 1e-6, ε2 = ε * ε, d3_radians = π / 180, d3_degrees = 180 / π;
  function d3_sgn(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  }
  function d3_cross2d(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }
  function d3_acos(x) {
    return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
  }
  function d3_asin(x) {
    return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
  }
  function d3_sinh(x) {
    return ((x = Math.exp(x)) - 1 / x) / 2;
  }
  function d3_cosh(x) {
    return ((x = Math.exp(x)) + 1 / x) / 2;
  }
  function d3_tanh(x) {
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);
  }
  function d3_haversin(x) {
    return (x = Math.sin(x / 2)) * x;
  }
  var ρ = Math.SQRT2, ρ2 = 2, ρ4 = 4;
  d3.interpolateZoom = function(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2];
    var dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + ρ4 * d2) / (2 * w0 * ρ2 * d1), b1 = (w1 * w1 - w0 * w0 - ρ4 * d2) / (2 * w1 * ρ2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), dr = r1 - r0, S = (dr || Math.log(w1 / w0)) / ρ;
    function interpolate(t) {
      var s = t * S;
      if (dr) {
        var coshr0 = d3_cosh(r0), u = w0 / (ρ2 * d1) * (coshr0 * d3_tanh(ρ * s + r0) - d3_sinh(r0));
        return [ ux0 + u * dx, uy0 + u * dy, w0 * coshr0 / d3_cosh(ρ * s + r0) ];
      }
      return [ ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(ρ * s) ];
    }
    interpolate.duration = S * 1e3;
    return interpolate;
  };
  d3.behavior.zoom = function() {
    var view = {
      x: 0,
      y: 0,
      k: 1
    }, translate0, center, size = [ 960, 500 ], scaleExtent = d3_behavior_zoomInfinity, mousedown = "mousedown.zoom", mousemove = "mousemove.zoom", mouseup = "mouseup.zoom", mousewheelTimer, touchstart = "touchstart.zoom", touchtime, event = d3_eventDispatch(zoom, "zoomstart", "zoom", "zoomend"), x0, x1, y0, y1;
    function zoom(g) {
      g.on(mousedown, mousedowned).on(d3_behavior_zoomWheel + ".zoom", mousewheeled).on(mousemove, mousewheelreset).on("dblclick.zoom", dblclicked).on(touchstart, touchstarted);
    }
    zoom.event = function(g) {
      g.each(function() {
        var dispatch = event.of(this, arguments), view1 = view;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.zoom", function() {
            view = this.__chart__ || {
              x: 0,
              y: 0,
              k: 1
            };
            zoomstarted(dispatch);
          }).tween("zoom:zoom", function() {
            var dx = size[0], dy = size[1], cx = dx / 2, cy = dy / 2, i = d3.interpolateZoom([ (cx - view.x) / view.k, (cy - view.y) / view.k, dx / view.k ], [ (cx - view1.x) / view1.k, (cy - view1.y) / view1.k, dx / view1.k ]);
            return function(t) {
              var l = i(t), k = dx / l[2];
              this.__chart__ = view = {
                x: cx - l[0] * k,
                y: cy - l[1] * k,
                k: k
              };
              zoomed(dispatch);
            };
          }).each("end.zoom", function() {
            zoomended(dispatch);
          });
        } else {
          this.__chart__ = view;
          zoomstarted(dispatch);
          zoomed(dispatch);
          zoomended(dispatch);
        }
      });
    };
    zoom.translate = function(_) {
      if (!arguments.length) return [ view.x, view.y ];
      view = {
        x: +_[0],
        y: +_[1],
        k: view.k
      };
      rescale();
      return zoom;
    };
    zoom.scale = function(_) {
      if (!arguments.length) return view.k;
      view = {
        x: view.x,
        y: view.y,
        k: +_
      };
      rescale();
      return zoom;
    };
    zoom.scaleExtent = function(_) {
      if (!arguments.length) return scaleExtent;
      scaleExtent = _ == null ? d3_behavior_zoomInfinity : [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.center = function(_) {
      if (!arguments.length) return center;
      center = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.size = function(_) {
      if (!arguments.length) return size;
      size = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.x = function(z) {
      if (!arguments.length) return x1;
      x1 = z;
      x0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    zoom.y = function(z) {
      if (!arguments.length) return y1;
      y1 = z;
      y0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    function location(p) {
      return [ (p[0] - view.x) / view.k, (p[1] - view.y) / view.k ];
    }
    function point(l) {
      return [ l[0] * view.k + view.x, l[1] * view.k + view.y ];
    }
    function scaleTo(s) {
      view.k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
    }
    function translateTo(p, l) {
      l = point(l);
      view.x += p[0] - l[0];
      view.y += p[1] - l[1];
    }
    function rescale() {
      if (x1) x1.domain(x0.range().map(function(x) {
        return (x - view.x) / view.k;
      }).map(x0.invert));
      if (y1) y1.domain(y0.range().map(function(y) {
        return (y - view.y) / view.k;
      }).map(y0.invert));
    }
    function zoomstarted(dispatch) {
      dispatch({
        type: "zoomstart"
      });
    }
    function zoomed(dispatch) {
      rescale();
      dispatch({
        type: "zoom",
        scale: view.k,
        translate: [ view.x, view.y ]
      });
    }
    function zoomended(dispatch) {
      dispatch({
        type: "zoomend"
      });
    }
    function mousedowned() {
      var that = this, target = d3.event.target, dispatch = event.of(that, arguments), dragged = 0, subject = d3.select(d3_window).on(mousemove, moved).on(mouseup, ended), location0 = location(d3.mouse(that)), dragRestore = d3_event_dragSuppress();
      d3_selection_interrupt.call(that);
      zoomstarted(dispatch);
      function moved() {
        dragged = 1;
        translateTo(d3.mouse(that), location0);
        zoomed(dispatch);
      }
      function ended() {
        subject.on(mousemove, d3_window === that ? mousewheelreset : null).on(mouseup, null);
        dragRestore(dragged && d3.event.target === target);
        zoomended(dispatch);
      }
    }
    function touchstarted() {
      var that = this, dispatch = event.of(that, arguments), locations0 = {}, distance0 = 0, scale0, zoomName = ".zoom-" + d3.event.changedTouches[0].identifier, touchmove = "touchmove" + zoomName, touchend = "touchend" + zoomName, target = d3.select(d3.event.target).on(touchmove, moved).on(touchend, ended), subject = d3.select(that).on(mousedown, null).on(touchstart, started), dragRestore = d3_event_dragSuppress();
      d3_selection_interrupt.call(that);
      started();
      zoomstarted(dispatch);
      function relocate() {
        var touches = d3.touches(that);
        scale0 = view.k;
        touches.forEach(function(t) {
          if (t.identifier in locations0) locations0[t.identifier] = location(t);
        });
        return touches;
      }
      function started() {
        var changed = d3.event.changedTouches;
        for (var i = 0, n = changed.length; i < n; ++i) {
          locations0[changed[i].identifier] = null;
        }
        var touches = relocate(), now = Date.now();
        if (touches.length === 1) {
          if (now - touchtime < 500) {
            var p = touches[0], l = locations0[p.identifier];
            scaleTo(view.k * 2);
            translateTo(p, l);
            d3_eventPreventDefault();
            zoomed(dispatch);
          }
          touchtime = now;
        } else if (touches.length > 1) {
          var p = touches[0], q = touches[1], dx = p[0] - q[0], dy = p[1] - q[1];
          distance0 = dx * dx + dy * dy;
        }
      }
      function moved() {
        var touches = d3.touches(that), p0, l0, p1, l1;
        for (var i = 0, n = touches.length; i < n; ++i, l1 = null) {
          p1 = touches[i];
          if (l1 = locations0[p1.identifier]) {
            if (l0) break;
            p0 = p1, l0 = l1;
          }
        }
        if (l1) {
          var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1, scale1 = distance0 && Math.sqrt(distance1 / distance0);
          p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];
          l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];
          scaleTo(scale1 * scale0);
        }
        touchtime = null;
        translateTo(p0, l0);
        zoomed(dispatch);
      }
      function ended() {
        if (d3.event.touches.length) {
          var changed = d3.event.changedTouches;
          for (var i = 0, n = changed.length; i < n; ++i) {
            delete locations0[changed[i].identifier];
          }
          for (var identifier in locations0) {
            return void relocate();
          }
        }
        target.on(zoomName, null);
        subject.on(mousedown, mousedowned).on(touchstart, touchstarted);
        dragRestore();
        zoomended(dispatch);
      }
    }
    function mousewheeled() {
      var dispatch = event.of(this, arguments);
      if (mousewheelTimer) clearTimeout(mousewheelTimer); else d3_selection_interrupt.call(this), 
      zoomstarted(dispatch);
      mousewheelTimer = setTimeout(function() {
        mousewheelTimer = null;
        zoomended(dispatch);
      }, 50);
      d3_eventPreventDefault();
      var point = center || d3.mouse(this);
      if (!translate0) translate0 = location(point);
      scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * view.k);
      translateTo(point, translate0);
      zoomed(dispatch);
    }
    function mousewheelreset() {
      translate0 = null;
    }
    function dblclicked() {
      var dispatch = event.of(this, arguments), p = d3.mouse(this), l = location(p), k = Math.log(view.k) / Math.LN2;
      zoomstarted(dispatch);
      scaleTo(Math.pow(2, d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1));
      translateTo(p, l);
      zoomed(dispatch);
      zoomended(dispatch);
    }
    return d3.rebind(zoom, event, "on");
  };
  var d3_behavior_zoomInfinity = [ 0, Infinity ];
  var d3_behavior_zoomDelta, d3_behavior_zoomWheel = "onwheel" in d3_document ? (d3_behavior_zoomDelta = function() {
    return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1);
  }, "wheel") : "onmousewheel" in d3_document ? (d3_behavior_zoomDelta = function() {
    return d3.event.wheelDelta;
  }, "mousewheel") : (d3_behavior_zoomDelta = function() {
    return -d3.event.detail;
  }, "MozMousePixelScroll");
  function d3_Color() {}
  d3_Color.prototype.toString = function() {
    return this.rgb() + "";
  };
  d3.hsl = function(h, s, l) {
    return arguments.length === 1 ? h instanceof d3_Hsl ? d3_hsl(h.h, h.s, h.l) : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl) : d3_hsl(+h, +s, +l);
  };
  function d3_hsl(h, s, l) {
    return new d3_Hsl(h, s, l);
  }
  function d3_Hsl(h, s, l) {
    this.h = h;
    this.s = s;
    this.l = l;
  }
  var d3_hslPrototype = d3_Hsl.prototype = new d3_Color();
  d3_hslPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return d3_hsl(this.h, this.s, this.l / k);
  };
  d3_hslPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return d3_hsl(this.h, this.s, k * this.l);
  };
  d3_hslPrototype.rgb = function() {
    return d3_hsl_rgb(this.h, this.s, this.l);
  };
  function d3_hsl_rgb(h, s, l) {
    var m1, m2;
    h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
    s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
    m1 = 2 * l - m2;
    function v(h) {
      if (h > 360) h -= 360; else if (h < 0) h += 360;
      if (h < 60) return m1 + (m2 - m1) * h / 60;
      if (h < 180) return m2;
      if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
      return m1;
    }
    function vv(h) {
      return Math.round(v(h) * 255);
    }
    return d3_rgb(vv(h + 120), vv(h), vv(h - 120));
  }
  d3.hcl = function(h, c, l) {
    return arguments.length === 1 ? h instanceof d3_Hcl ? d3_hcl(h.h, h.c, h.l) : h instanceof d3_Lab ? d3_lab_hcl(h.l, h.a, h.b) : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b) : d3_hcl(+h, +c, +l);
  };
  function d3_hcl(h, c, l) {
    return new d3_Hcl(h, c, l);
  }
  function d3_Hcl(h, c, l) {
    this.h = h;
    this.c = c;
    this.l = l;
  }
  var d3_hclPrototype = d3_Hcl.prototype = new d3_Color();
  d3_hclPrototype.brighter = function(k) {
    return d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.darker = function(k) {
    return d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.rgb = function() {
    return d3_hcl_lab(this.h, this.c, this.l).rgb();
  };
  function d3_hcl_lab(h, c, l) {
    if (isNaN(h)) h = 0;
    if (isNaN(c)) c = 0;
    return d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
  }
  d3.lab = function(l, a, b) {
    return arguments.length === 1 ? l instanceof d3_Lab ? d3_lab(l.l, l.a, l.b) : l instanceof d3_Hcl ? d3_hcl_lab(l.l, l.c, l.h) : d3_rgb_lab((l = d3.rgb(l)).r, l.g, l.b) : d3_lab(+l, +a, +b);
  };
  function d3_lab(l, a, b) {
    return new d3_Lab(l, a, b);
  }
  function d3_Lab(l, a, b) {
    this.l = l;
    this.a = a;
    this.b = b;
  }
  var d3_lab_K = 18;
  var d3_lab_X = .95047, d3_lab_Y = 1, d3_lab_Z = 1.08883;
  var d3_labPrototype = d3_Lab.prototype = new d3_Color();
  d3_labPrototype.brighter = function(k) {
    return d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.darker = function(k) {
    return d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.rgb = function() {
    return d3_lab_rgb(this.l, this.a, this.b);
  };
  function d3_lab_rgb(l, a, b) {
    var y = (l + 16) / 116, x = y + a / 500, z = y - b / 200;
    x = d3_lab_xyz(x) * d3_lab_X;
    y = d3_lab_xyz(y) * d3_lab_Y;
    z = d3_lab_xyz(z) * d3_lab_Z;
    return d3_rgb(d3_xyz_rgb(3.2404542 * x - 1.5371385 * y - .4985314 * z), d3_xyz_rgb(-.969266 * x + 1.8760108 * y + .041556 * z), d3_xyz_rgb(.0556434 * x - .2040259 * y + 1.0572252 * z));
  }
  function d3_lab_hcl(l, a, b) {
    return l > 0 ? d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l) : d3_hcl(NaN, NaN, l);
  }
  function d3_lab_xyz(x) {
    return x > .206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
  }
  function d3_xyz_lab(x) {
    return x > .008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
  }
  function d3_xyz_rgb(r) {
    return Math.round(255 * (r <= .00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - .055));
  }
  d3.rgb = function(r, g, b) {
    return arguments.length === 1 ? r instanceof d3_Rgb ? d3_rgb(r.r, r.g, r.b) : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb) : d3_rgb(~~r, ~~g, ~~b);
  };
  function d3_rgbNumber(value) {
    return d3_rgb(value >> 16, value >> 8 & 255, value & 255);
  }
  function d3_rgbString(value) {
    return d3_rgbNumber(value) + "";
  }
  function d3_rgb(r, g, b) {
    return new d3_Rgb(r, g, b);
  }
  function d3_Rgb(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  var d3_rgbPrototype = d3_Rgb.prototype = new d3_Color();
  d3_rgbPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    var r = this.r, g = this.g, b = this.b, i = 30;
    if (!r && !g && !b) return d3_rgb(i, i, i);
    if (r && r < i) r = i;
    if (g && g < i) g = i;
    if (b && b < i) b = i;
    return d3_rgb(Math.min(255, ~~(r / k)), Math.min(255, ~~(g / k)), Math.min(255, ~~(b / k)));
  };
  d3_rgbPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return d3_rgb(~~(k * this.r), ~~(k * this.g), ~~(k * this.b));
  };
  d3_rgbPrototype.hsl = function() {
    return d3_rgb_hsl(this.r, this.g, this.b);
  };
  d3_rgbPrototype.toString = function() {
    return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
  };
  function d3_rgb_hex(v) {
    return v < 16 ? "0" + Math.max(0, v).toString(16) : Math.min(255, v).toString(16);
  }
  function d3_rgb_parse(format, rgb, hsl) {
    var r = 0, g = 0, b = 0, m1, m2, color;
    m1 = /([a-z]+)\((.*)\)/i.exec(format);
    if (m1) {
      m2 = m1[2].split(",");
      switch (m1[1]) {
       case "hsl":
        {
          return hsl(parseFloat(m2[0]), parseFloat(m2[1]) / 100, parseFloat(m2[2]) / 100);
        }

       case "rgb":
        {
          return rgb(d3_rgb_parseNumber(m2[0]), d3_rgb_parseNumber(m2[1]), d3_rgb_parseNumber(m2[2]));
        }
      }
    }
    if (color = d3_rgb_names.get(format)) return rgb(color.r, color.g, color.b);
    if (format != null && format.charAt(0) === "#" && !isNaN(color = parseInt(format.substring(1), 16))) {
      if (format.length === 4) {
        r = (color & 3840) >> 4;
        r = r >> 4 | r;
        g = color & 240;
        g = g >> 4 | g;
        b = color & 15;
        b = b << 4 | b;
      } else if (format.length === 7) {
        r = (color & 16711680) >> 16;
        g = (color & 65280) >> 8;
        b = color & 255;
      }
    }
    return rgb(r, g, b);
  }
  function d3_rgb_hsl(r, g, b) {
    var min = Math.min(r /= 255, g /= 255, b /= 255), max = Math.max(r, g, b), d = max - min, h, s, l = (max + min) / 2;
    if (d) {
      s = l < .5 ? d / (max + min) : d / (2 - max - min);
      if (r == max) h = (g - b) / d + (g < b ? 6 : 0); else if (g == max) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    } else {
      h = NaN;
      s = l > 0 && l < 1 ? 0 : h;
    }
    return d3_hsl(h, s, l);
  }
  function d3_rgb_lab(r, g, b) {
    r = d3_rgb_xyz(r);
    g = d3_rgb_xyz(g);
    b = d3_rgb_xyz(b);
    var x = d3_xyz_lab((.4124564 * r + .3575761 * g + .1804375 * b) / d3_lab_X), y = d3_xyz_lab((.2126729 * r + .7151522 * g + .072175 * b) / d3_lab_Y), z = d3_xyz_lab((.0193339 * r + .119192 * g + .9503041 * b) / d3_lab_Z);
    return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
  }
  function d3_rgb_xyz(r) {
    return (r /= 255) <= .04045 ? r / 12.92 : Math.pow((r + .055) / 1.055, 2.4);
  }
  function d3_rgb_parseNumber(c) {
    var f = parseFloat(c);
    return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
  }
  var d3_rgb_names = d3.map({
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  });
  d3_rgb_names.forEach(function(key, value) {
    d3_rgb_names.set(key, d3_rgbNumber(value));
  });
  function d3_functor(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  }
  d3.functor = d3_functor;
  function d3_identity(d) {
    return d;
  }
  d3.xhr = d3_xhrType(d3_identity);
  function d3_xhrType(response) {
    return function(url, mimeType, callback) {
      if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, 
      mimeType = null;
      return d3_xhr(url, mimeType, response, callback);
    };
  }
  function d3_xhr(url, mimeType, response, callback) {
    var xhr = {}, dispatch = d3.dispatch("beforesend", "progress", "load", "error"), headers = {}, request = new XMLHttpRequest(), responseType = null;
    if (d3_window.XDomainRequest && !("withCredentials" in request) && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest();
    "onload" in request ? request.onload = request.onerror = respond : request.onreadystatechange = function() {
      request.readyState > 3 && respond();
    };
    function respond() {
      var status = request.status, result;
      if (!status && request.responseText || status >= 200 && status < 300 || status === 304) {
        try {
          result = response.call(xhr, request);
        } catch (e) {
          dispatch.error.call(xhr, e);
          return;
        }
        dispatch.load.call(xhr, result);
      } else {
        dispatch.error.call(xhr, request);
      }
    }
    request.onprogress = function(event) {
      var o = d3.event;
      d3.event = event;
      try {
        dispatch.progress.call(xhr, request);
      } finally {
        d3.event = o;
      }
    };
    xhr.header = function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers[name];
      if (value == null) delete headers[name]; else headers[name] = value + "";
      return xhr;
    };
    xhr.mimeType = function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return xhr;
    };
    xhr.responseType = function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return xhr;
    };
    xhr.response = function(value) {
      response = value;
      return xhr;
    };
    [ "get", "post" ].forEach(function(method) {
      xhr[method] = function() {
        return xhr.send.apply(xhr, [ method ].concat(d3_array(arguments)));
      };
    });
    xhr.send = function(method, data, callback) {
      if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
      request.open(method, url, true);
      if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
      if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
      if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
      if (responseType != null) request.responseType = responseType;
      if (callback != null) xhr.on("error", callback).on("load", function(request) {
        callback(null, request);
      });
      dispatch.beforesend.call(xhr, request);
      request.send(data == null ? null : data);
      return xhr;
    };
    xhr.abort = function() {
      request.abort();
      return xhr;
    };
    d3.rebind(xhr, dispatch, "on");
    return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
  }
  function d3_xhr_fixCallback(callback) {
    return callback.length === 1 ? function(error, request) {
      callback(error == null ? request : null);
    } : callback;
  }
  d3.dsv = function(delimiter, mimeType) {
    var reFormat = new RegExp('["' + delimiter + "\n]"), delimiterCode = delimiter.charCodeAt(0);
    function dsv(url, row, callback) {
      if (arguments.length < 3) callback = row, row = null;
      var xhr = d3_xhr(url, mimeType, row == null ? response : typedResponse(row), callback);
      xhr.row = function(_) {
        return arguments.length ? xhr.response((row = _) == null ? response : typedResponse(_)) : row;
      };
      return xhr;
    }
    function response(request) {
      return dsv.parse(request.responseText);
    }
    function typedResponse(f) {
      return function(request) {
        return dsv.parse(request.responseText, f);
      };
    }
    dsv.parse = function(text, f) {
      var o;
      return dsv.parseRows(text, function(row, i) {
        if (o) return o(row, i - 1);
        var a = new Function("d", "return {" + row.map(function(name, i) {
          return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
        o = f ? function(row, i) {
          return f(a(row), i);
        } : a;
      });
    };
    dsv.parseRows = function(text, f) {
      var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;
      function token() {
        if (I >= N) return EOF;
        if (eol) return eol = false, EOL;
        var j = I;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          var c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.substring(j + 1, i).replace(/""/g, '"');
        }
        while (I < N) {
          var c = text.charCodeAt(I++), k = 1;
          if (c === 10) eol = true; else if (c === 13) {
            eol = true;
            if (text.charCodeAt(I) === 10) ++I, ++k;
          } else if (c !== delimiterCode) continue;
          return text.substring(j, I - k);
        }
        return text.substring(j);
      }
      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && !(a = f(a, n++))) continue;
        rows.push(a);
      }
      return rows;
    };
    dsv.format = function(rows) {
      if (Array.isArray(rows[0])) return dsv.formatRows(rows);
      var fieldSet = new d3_Set(), fields = [];
      rows.forEach(function(row) {
        for (var field in row) {
          if (!fieldSet.has(field)) {
            fields.push(fieldSet.add(field));
          }
        }
      });
      return [ fields.map(formatValue).join(delimiter) ].concat(rows.map(function(row) {
        return fields.map(function(field) {
          return formatValue(row[field]);
        }).join(delimiter);
      })).join("\n");
    };
    dsv.formatRows = function(rows) {
      return rows.map(formatRow).join("\n");
    };
    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }
    function formatValue(text) {
      return reFormat.test(text) ? '"' + text.replace(/\"/g, '""') + '"' : text;
    }
    return dsv;
  };
  d3.csv = d3.dsv(",", "text/csv");
  d3.tsv = d3.dsv("	", "text/tab-separated-values");
  d3.touch = function(container, touches, identifier) {
    if (arguments.length < 3) identifier = touches, touches = d3_eventSource().changedTouches;
    if (touches) for (var i = 0, n = touches.length, touch; i < n; ++i) {
      if ((touch = touches[i]).identifier === identifier) {
        return d3_mousePoint(container, touch);
      }
    }
  };
  var d3_timer_queueHead, d3_timer_queueTail, d3_timer_interval, d3_timer_timeout, d3_timer_active, d3_timer_frame = d3_window[d3_vendorSymbol(d3_window, "requestAnimationFrame")] || function(callback) {
    setTimeout(callback, 17);
  };
  d3.timer = function(callback, delay, then) {
    var n = arguments.length;
    if (n < 2) delay = 0;
    if (n < 3) then = Date.now();
    var time = then + delay, timer = {
      c: callback,
      t: time,
      f: false,
      n: null
    };
    if (d3_timer_queueTail) d3_timer_queueTail.n = timer; else d3_timer_queueHead = timer;
    d3_timer_queueTail = timer;
    if (!d3_timer_interval) {
      d3_timer_timeout = clearTimeout(d3_timer_timeout);
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  };
  function d3_timer_step() {
    var now = d3_timer_mark(), delay = d3_timer_sweep() - now;
    if (delay > 24) {
      if (isFinite(delay)) {
        clearTimeout(d3_timer_timeout);
        d3_timer_timeout = setTimeout(d3_timer_step, delay);
      }
      d3_timer_interval = 0;
    } else {
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  }
  d3.timer.flush = function() {
    d3_timer_mark();
    d3_timer_sweep();
  };
  function d3_timer_mark() {
    var now = Date.now();
    d3_timer_active = d3_timer_queueHead;
    while (d3_timer_active) {
      if (now >= d3_timer_active.t) d3_timer_active.f = d3_timer_active.c(now - d3_timer_active.t);
      d3_timer_active = d3_timer_active.n;
    }
    return now;
  }
  function d3_timer_sweep() {
    var t0, t1 = d3_timer_queueHead, time = Infinity;
    while (t1) {
      if (t1.f) {
        t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
      } else {
        if (t1.t < time) time = t1.t;
        t1 = (t0 = t1).n;
      }
    }
    d3_timer_queueTail = t0;
    return time;
  }
  function d3_format_precision(x, p) {
    return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
  }
  d3.round = function(x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
  };
  var d3_formatPrefixes = [ "y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y" ].map(d3_formatPrefix);
  d3.formatPrefix = function(value, precision) {
    var i = 0;
    if (value) {
      if (value < 0) value *= -1;
      if (precision) value = d3.round(value, d3_format_precision(value, precision));
      i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
      i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
    }
    return d3_formatPrefixes[8 + i / 3];
  };
  function d3_formatPrefix(d, i) {
    var k = Math.pow(10, abs(8 - i) * 3);
    return {
      scale: i > 8 ? function(d) {
        return d / k;
      } : function(d) {
        return d * k;
      },
      symbol: d
    };
  }
  function d3_locale_numberFormat(locale) {
    var locale_decimal = locale.decimal, locale_thousands = locale.thousands, locale_grouping = locale.grouping, locale_currency = locale.currency, formatGroup = locale_grouping ? function(value) {
      var i = value.length, t = [], j = 0, g = locale_grouping[0];
      while (i > 0 && g > 0) {
        t.push(value.substring(i -= g, i + g));
        g = locale_grouping[j = (j + 1) % locale_grouping.length];
      }
      return t.reverse().join(locale_thousands);
    } : d3_identity;
    return function(specifier) {
      var match = d3_format_re.exec(specifier), fill = match[1] || " ", align = match[2] || ">", sign = match[3] || "", symbol = match[4] || "", zfill = match[5], width = +match[6], comma = match[7], precision = match[8], type = match[9], scale = 1, prefix = "", suffix = "", integer = false;
      if (precision) precision = +precision.substring(1);
      if (zfill || fill === "0" && align === "=") {
        zfill = fill = "0";
        align = "=";
        if (comma) width -= Math.floor((width - 1) / 4);
      }
      switch (type) {
       case "n":
        comma = true;
        type = "g";
        break;

       case "%":
        scale = 100;
        suffix = "%";
        type = "f";
        break;

       case "p":
        scale = 100;
        suffix = "%";
        type = "r";
        break;

       case "b":
       case "o":
       case "x":
       case "X":
        if (symbol === "#") prefix = "0" + type.toLowerCase();

       case "c":
       case "d":
        integer = true;
        precision = 0;
        break;

       case "s":
        scale = -1;
        type = "r";
        break;
      }
      if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];
      if (type == "r" && !precision) type = "g";
      if (precision != null) {
        if (type == "g") precision = Math.max(1, Math.min(21, precision)); else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
      }
      type = d3_format_types.get(type) || d3_format_typeDefault;
      var zcomma = zfill && comma;
      return function(value) {
        var fullSuffix = suffix;
        if (integer && value % 1) return "";
        var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign;
        if (scale < 0) {
          var unit = d3.formatPrefix(value, precision);
          value = unit.scale(value);
          fullSuffix = unit.symbol + suffix;
        } else {
          value *= scale;
        }
        value = type(value, precision);
        var i = value.lastIndexOf("."), before = i < 0 ? value : value.substring(0, i), after = i < 0 ? "" : locale_decimal + value.substring(i + 1);
        if (!zfill && comma) before = formatGroup(before);
        var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length), padding = length < width ? new Array(length = width - length + 1).join(fill) : "";
        if (zcomma) before = formatGroup(padding + before);
        negative += prefix;
        value = before + after;
        return (align === "<" ? negative + value + padding : align === ">" ? padding + negative + value : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length) : negative + (zcomma ? value : padding + value)) + fullSuffix;
      };
    };
  }
  var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;
  var d3_format_types = d3.map({
    b: function(x) {
      return x.toString(2);
    },
    c: function(x) {
      return String.fromCharCode(x);
    },
    o: function(x) {
      return x.toString(8);
    },
    x: function(x) {
      return x.toString(16);
    },
    X: function(x) {
      return x.toString(16).toUpperCase();
    },
    g: function(x, p) {
      return x.toPrecision(p);
    },
    e: function(x, p) {
      return x.toExponential(p);
    },
    f: function(x, p) {
      return x.toFixed(p);
    },
    r: function(x, p) {
      return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p))));
    }
  });
  function d3_format_typeDefault(x) {
    return x + "";
  }
  var d3_time = d3.time = {}, d3_date = Date;
  function d3_date_utc() {
    this._ = new Date(arguments.length > 1 ? Date.UTC.apply(this, arguments) : arguments[0]);
  }
  d3_date_utc.prototype = {
    getDate: function() {
      return this._.getUTCDate();
    },
    getDay: function() {
      return this._.getUTCDay();
    },
    getFullYear: function() {
      return this._.getUTCFullYear();
    },
    getHours: function() {
      return this._.getUTCHours();
    },
    getMilliseconds: function() {
      return this._.getUTCMilliseconds();
    },
    getMinutes: function() {
      return this._.getUTCMinutes();
    },
    getMonth: function() {
      return this._.getUTCMonth();
    },
    getSeconds: function() {
      return this._.getUTCSeconds();
    },
    getTime: function() {
      return this._.getTime();
    },
    getTimezoneOffset: function() {
      return 0;
    },
    valueOf: function() {
      return this._.valueOf();
    },
    setDate: function() {
      d3_time_prototype.setUTCDate.apply(this._, arguments);
    },
    setDay: function() {
      d3_time_prototype.setUTCDay.apply(this._, arguments);
    },
    setFullYear: function() {
      d3_time_prototype.setUTCFullYear.apply(this._, arguments);
    },
    setHours: function() {
      d3_time_prototype.setUTCHours.apply(this._, arguments);
    },
    setMilliseconds: function() {
      d3_time_prototype.setUTCMilliseconds.apply(this._, arguments);
    },
    setMinutes: function() {
      d3_time_prototype.setUTCMinutes.apply(this._, arguments);
    },
    setMonth: function() {
      d3_time_prototype.setUTCMonth.apply(this._, arguments);
    },
    setSeconds: function() {
      d3_time_prototype.setUTCSeconds.apply(this._, arguments);
    },
    setTime: function() {
      d3_time_prototype.setTime.apply(this._, arguments);
    }
  };
  var d3_time_prototype = Date.prototype;
  function d3_time_interval(local, step, number) {
    function round(date) {
      var d0 = local(date), d1 = offset(d0, 1);
      return date - d0 < d1 - date ? d0 : d1;
    }
    function ceil(date) {
      step(date = local(new d3_date(date - 1)), 1);
      return date;
    }
    function offset(date, k) {
      step(date = new d3_date(+date), k);
      return date;
    }
    function range(t0, t1, dt) {
      var time = ceil(t0), times = [];
      if (dt > 1) {
        while (time < t1) {
          if (!(number(time) % dt)) times.push(new Date(+time));
          step(time, 1);
        }
      } else {
        while (time < t1) times.push(new Date(+time)), step(time, 1);
      }
      return times;
    }
    function range_utc(t0, t1, dt) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = t0;
        return range(utc, t1, dt);
      } finally {
        d3_date = Date;
      }
    }
    local.floor = local;
    local.round = round;
    local.ceil = ceil;
    local.offset = offset;
    local.range = range;
    var utc = local.utc = d3_time_interval_utc(local);
    utc.floor = utc;
    utc.round = d3_time_interval_utc(round);
    utc.ceil = d3_time_interval_utc(ceil);
    utc.offset = d3_time_interval_utc(offset);
    utc.range = range_utc;
    return local;
  }
  function d3_time_interval_utc(method) {
    return function(date, k) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = date;
        return method(utc, k)._;
      } finally {
        d3_date = Date;
      }
    };
  }
  d3_time.year = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setMonth(0, 1);
    return date;
  }, function(date, offset) {
    date.setFullYear(date.getFullYear() + offset);
  }, function(date) {
    return date.getFullYear();
  });
  d3_time.years = d3_time.year.range;
  d3_time.years.utc = d3_time.year.utc.range;
  d3_time.day = d3_time_interval(function(date) {
    var day = new d3_date(2e3, 0);
    day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return day;
  }, function(date, offset) {
    date.setDate(date.getDate() + offset);
  }, function(date) {
    return date.getDate() - 1;
  });
  d3_time.days = d3_time.day.range;
  d3_time.days.utc = d3_time.day.utc.range;
  d3_time.dayOfYear = function(date) {
    var year = d3_time.year(date);
    return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
  };
  [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ].forEach(function(day, i) {
    i = 7 - i;
    var interval = d3_time[day] = d3_time_interval(function(date) {
      (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
      return date;
    }, function(date, offset) {
      date.setDate(date.getDate() + Math.floor(offset) * 7);
    }, function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
    });
    d3_time[day + "s"] = interval.range;
    d3_time[day + "s"].utc = interval.utc.range;
    d3_time[day + "OfYear"] = function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);
    };
  });
  d3_time.week = d3_time.sunday;
  d3_time.weeks = d3_time.sunday.range;
  d3_time.weeks.utc = d3_time.sunday.utc.range;
  d3_time.weekOfYear = d3_time.sundayOfYear;
  function d3_locale_timeFormat(locale) {
    var locale_dateTime = locale.dateTime, locale_date = locale.date, locale_time = locale.time, locale_periods = locale.periods, locale_days = locale.days, locale_shortDays = locale.shortDays, locale_months = locale.months, locale_shortMonths = locale.shortMonths;
    function d3_time_format(template) {
      var n = template.length;
      function format(date) {
        var string = [], i = -1, j = 0, c, p, f;
        while (++i < n) {
          if (template.charCodeAt(i) === 37) {
            string.push(template.substring(j, i));
            if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
            if (f = d3_time_formats[c]) c = f(date, p == null ? c === "e" ? " " : "0" : p);
            string.push(c);
            j = i + 1;
          }
        }
        string.push(template.substring(j, i));
        return string.join("");
      }
      format.parse = function(string) {
        var d = {
          y: 1900,
          m: 0,
          d: 1,
          H: 0,
          M: 0,
          S: 0,
          L: 0,
          Z: null
        }, i = d3_time_parse(d, template, string, 0);
        if (i != string.length) return null;
        if ("p" in d) d.H = d.H % 12 + d.p * 12;
        var localZ = d.Z != null && d3_date !== d3_date_utc, date = new (localZ ? d3_date_utc : d3_date)();
        if ("j" in d) date.setFullYear(d.y, 0, d.j); else if ("w" in d && ("W" in d || "U" in d)) {
          date.setFullYear(d.y, 0, 1);
          date.setFullYear(d.y, 0, "W" in d ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7 : d.w + d.U * 7 - (date.getDay() + 6) % 7);
        } else date.setFullYear(d.y, d.m, d.d);
        date.setHours(d.H + Math.floor(d.Z / 100), d.M + d.Z % 100, d.S, d.L);
        return localZ ? date._ : date;
      };
      format.toString = function() {
        return template;
      };
      return format;
    }
    function d3_time_parse(date, template, string, j) {
      var c, p, t, i = 0, n = template.length, m = string.length;
      while (i < n) {
        if (j >= m) return -1;
        c = template.charCodeAt(i++);
        if (c === 37) {
          t = template.charAt(i++);
          p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];
          if (!p || (j = p(date, string, j)) < 0) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }
      return j;
    }
    d3_time_format.utc = function(template) {
      var local = d3_time_format(template);
      function format(date) {
        try {
          d3_date = d3_date_utc;
          var utc = new d3_date();
          utc._ = date;
          return local(utc);
        } finally {
          d3_date = Date;
        }
      }
      format.parse = function(string) {
        try {
          d3_date = d3_date_utc;
          var date = local.parse(string);
          return date && date._;
        } finally {
          d3_date = Date;
        }
      };
      format.toString = local.toString;
      return format;
    };
    d3_time_format.multi = d3_time_format.utc.multi = d3_time_formatMulti;
    var d3_time_periodLookup = d3.map(), d3_time_dayRe = d3_time_formatRe(locale_days), d3_time_dayLookup = d3_time_formatLookup(locale_days), d3_time_dayAbbrevRe = d3_time_formatRe(locale_shortDays), d3_time_dayAbbrevLookup = d3_time_formatLookup(locale_shortDays), d3_time_monthRe = d3_time_formatRe(locale_months), d3_time_monthLookup = d3_time_formatLookup(locale_months), d3_time_monthAbbrevRe = d3_time_formatRe(locale_shortMonths), d3_time_monthAbbrevLookup = d3_time_formatLookup(locale_shortMonths);
    locale_periods.forEach(function(p, i) {
      d3_time_periodLookup.set(p.toLowerCase(), i);
    });
    var d3_time_formats = {
      a: function(d) {
        return locale_shortDays[d.getDay()];
      },
      A: function(d) {
        return locale_days[d.getDay()];
      },
      b: function(d) {
        return locale_shortMonths[d.getMonth()];
      },
      B: function(d) {
        return locale_months[d.getMonth()];
      },
      c: d3_time_format(locale_dateTime),
      d: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      e: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      H: function(d, p) {
        return d3_time_formatPad(d.getHours(), p, 2);
      },
      I: function(d, p) {
        return d3_time_formatPad(d.getHours() % 12 || 12, p, 2);
      },
      j: function(d, p) {
        return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3);
      },
      L: function(d, p) {
        return d3_time_formatPad(d.getMilliseconds(), p, 3);
      },
      m: function(d, p) {
        return d3_time_formatPad(d.getMonth() + 1, p, 2);
      },
      M: function(d, p) {
        return d3_time_formatPad(d.getMinutes(), p, 2);
      },
      p: function(d) {
        return locale_periods[+(d.getHours() >= 12)];
      },
      S: function(d, p) {
        return d3_time_formatPad(d.getSeconds(), p, 2);
      },
      U: function(d, p) {
        return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2);
      },
      w: function(d) {
        return d.getDay();
      },
      W: function(d, p) {
        return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2);
      },
      x: d3_time_format(locale_date),
      X: d3_time_format(locale_time),
      y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 100, p, 2);
      },
      Y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 1e4, p, 4);
      },
      Z: d3_time_zone,
      "%": function() {
        return "%";
      }
    };
    var d3_time_parsers = {
      a: d3_time_parseWeekdayAbbrev,
      A: d3_time_parseWeekday,
      b: d3_time_parseMonthAbbrev,
      B: d3_time_parseMonth,
      c: d3_time_parseLocaleFull,
      d: d3_time_parseDay,
      e: d3_time_parseDay,
      H: d3_time_parseHour24,
      I: d3_time_parseHour24,
      j: d3_time_parseDayOfYear,
      L: d3_time_parseMilliseconds,
      m: d3_time_parseMonthNumber,
      M: d3_time_parseMinutes,
      p: d3_time_parseAmPm,
      S: d3_time_parseSeconds,
      U: d3_time_parseWeekNumberSunday,
      w: d3_time_parseWeekdayNumber,
      W: d3_time_parseWeekNumberMonday,
      x: d3_time_parseLocaleDate,
      X: d3_time_parseLocaleTime,
      y: d3_time_parseYear,
      Y: d3_time_parseFullYear,
      Z: d3_time_parseZone,
      "%": d3_time_parseLiteralPercent
    };
    function d3_time_parseWeekdayAbbrev(date, string, i) {
      d3_time_dayAbbrevRe.lastIndex = 0;
      var n = d3_time_dayAbbrevRe.exec(string.substring(i));
      return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseWeekday(date, string, i) {
      d3_time_dayRe.lastIndex = 0;
      var n = d3_time_dayRe.exec(string.substring(i));
      return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonthAbbrev(date, string, i) {
      d3_time_monthAbbrevRe.lastIndex = 0;
      var n = d3_time_monthAbbrevRe.exec(string.substring(i));
      return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonth(date, string, i) {
      d3_time_monthRe.lastIndex = 0;
      var n = d3_time_monthRe.exec(string.substring(i));
      return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseLocaleFull(date, string, i) {
      return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
    }
    function d3_time_parseLocaleDate(date, string, i) {
      return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
    }
    function d3_time_parseLocaleTime(date, string, i) {
      return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
    }
    function d3_time_parseAmPm(date, string, i) {
      var n = d3_time_periodLookup.get(string.substring(i, i += 2).toLowerCase());
      return n == null ? -1 : (date.p = n, i);
    }
    return d3_time_format;
  }
  var d3_time_formatPads = {
    "-": "",
    _: " ",
    "0": "0"
  }, d3_time_numberRe = /^\s*\d+/, d3_time_percentRe = /^%/;
  function d3_time_formatPad(value, fill, width) {
    var sign = value < 0 ? "-" : "", string = (sign ? -value : value) + "", length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }
  function d3_time_formatRe(names) {
    return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
  }
  function d3_time_formatLookup(names) {
    var map = new d3_Map(), i = -1, n = names.length;
    while (++i < n) map.set(names[i].toLowerCase(), i);
    return map;
  }
  function d3_time_parseWeekdayNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 1));
    return n ? (date.w = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberSunday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i));
    return n ? (date.U = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberMonday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i));
    return n ? (date.W = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseFullYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 4));
    return n ? (date.y = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;
  }
  function d3_time_parseZone(date, string, i) {
    return /^[+-]\d{4}$/.test(string = string.substring(i, i + 5)) ? (date.Z = +string, 
    i + 5) : -1;
  }
  function d3_time_expandYear(d) {
    return d + (d > 68 ? 1900 : 2e3);
  }
  function d3_time_parseMonthNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
  }
  function d3_time_parseDay(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.d = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseDayOfYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 3));
    return n ? (date.j = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseHour24(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.H = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMinutes(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.M = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseSeconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 2));
    return n ? (date.S = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMilliseconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.substring(i, i + 3));
    return n ? (date.L = +n[0], i + n[0].length) : -1;
  }
  function d3_time_zone(d) {
    var z = d.getTimezoneOffset(), zs = z > 0 ? "-" : "+", zh = ~~(abs(z) / 60), zm = abs(z) % 60;
    return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
  }
  function d3_time_parseLiteralPercent(date, string, i) {
    d3_time_percentRe.lastIndex = 0;
    var n = d3_time_percentRe.exec(string.substring(i, i + 1));
    return n ? i + n[0].length : -1;
  }
  function d3_time_formatMulti(formats) {
    var n = formats.length, i = -1;
    while (++i < n) formats[i][0] = this(formats[i][0]);
    return function(date) {
      var i = 0, f = formats[i];
      while (!f[1](date)) f = formats[++i];
      return f[0](date);
    };
  }
  d3.locale = function(locale) {
    return {
      numberFormat: d3_locale_numberFormat(locale),
      timeFormat: d3_locale_timeFormat(locale)
    };
  };
  var d3_locale_enUS = d3.locale({
    decimal: ".",
    thousands: ",",
    grouping: [ 3 ],
    currency: [ "$", "" ],
    dateTime: "%a %b %e %X %Y",
    date: "%m/%d/%Y",
    time: "%H:%M:%S",
    periods: [ "AM", "PM" ],
    days: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
    shortDays: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
    months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
    shortMonths: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
  });
  d3.format = d3_locale_enUS.numberFormat;
  d3.geo = {};
  function d3_adder() {}
  d3_adder.prototype = {
    s: 0,
    t: 0,
    add: function(y) {
      d3_adderSum(y, this.t, d3_adderTemp);
      d3_adderSum(d3_adderTemp.s, this.s, this);
      if (this.s) this.t += d3_adderTemp.t; else this.s = d3_adderTemp.t;
    },
    reset: function() {
      this.s = this.t = 0;
    },
    valueOf: function() {
      return this.s;
    }
  };
  var d3_adderTemp = new d3_adder();
  function d3_adderSum(a, b, o) {
    var x = o.s = a + b, bv = x - a, av = x - bv;
    o.t = a - av + (b - bv);
  }
  d3.geo.stream = function(object, listener) {
    if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {
      d3_geo_streamObjectType[object.type](object, listener);
    } else {
      d3_geo_streamGeometry(object, listener);
    }
  };
  function d3_geo_streamGeometry(geometry, listener) {
    if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
      d3_geo_streamGeometryType[geometry.type](geometry, listener);
    }
  }
  var d3_geo_streamObjectType = {
    Feature: function(feature, listener) {
      d3_geo_streamGeometry(feature.geometry, listener);
    },
    FeatureCollection: function(object, listener) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
    }
  };
  var d3_geo_streamGeometryType = {
    Sphere: function(object, listener) {
      listener.sphere();
    },
    Point: function(object, listener) {
      object = object.coordinates;
      listener.point(object[0], object[1], object[2]);
    },
    MultiPoint: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) object = coordinates[i], listener.point(object[0], object[1], object[2]);
    },
    LineString: function(object, listener) {
      d3_geo_streamLine(object.coordinates, listener, 0);
    },
    MultiLineString: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
    },
    Polygon: function(object, listener) {
      d3_geo_streamPolygon(object.coordinates, listener);
    },
    MultiPolygon: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
    },
    GeometryCollection: function(object, listener) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
    }
  };
  function d3_geo_streamLine(coordinates, listener, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    listener.lineStart();
    while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1], coordinate[2]);
    listener.lineEnd();
  }
  function d3_geo_streamPolygon(coordinates, listener) {
    var i = -1, n = coordinates.length;
    listener.polygonStart();
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
    listener.polygonEnd();
  }
  d3.geo.area = function(object) {
    d3_geo_areaSum = 0;
    d3.geo.stream(object, d3_geo_area);
    return d3_geo_areaSum;
  };
  var d3_geo_areaSum, d3_geo_areaRingSum = new d3_adder();
  var d3_geo_area = {
    sphere: function() {
      d3_geo_areaSum += 4 * π;
    },
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_areaRingSum.reset();
      d3_geo_area.lineStart = d3_geo_areaRingStart;
    },
    polygonEnd: function() {
      var area = 2 * d3_geo_areaRingSum;
      d3_geo_areaSum += area < 0 ? 4 * π + area : area;
      d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
    }
  };
  function d3_geo_areaRingStart() {
    var λ00, φ00, λ0, cosφ0, sinφ0;
    d3_geo_area.point = function(λ, φ) {
      d3_geo_area.point = nextPoint;
      λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), 
      sinφ0 = Math.sin(φ);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      φ = φ * d3_radians / 2 + π / 4;
      var dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, cosφ = Math.cos(φ), sinφ = Math.sin(φ), k = sinφ0 * sinφ, u = cosφ0 * cosφ + k * Math.cos(adλ), v = k * sdλ * Math.sin(adλ);
      d3_geo_areaRingSum.add(Math.atan2(v, u));
      λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
    }
    d3_geo_area.lineEnd = function() {
      nextPoint(λ00, φ00);
    };
  }
  function d3_geo_cartesian(spherical) {
    var λ = spherical[0], φ = spherical[1], cosφ = Math.cos(φ);
    return [ cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ) ];
  }
  function d3_geo_cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function d3_geo_cartesianCross(a, b) {
    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  }
  function d3_geo_cartesianAdd(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
  }
  function d3_geo_cartesianScale(vector, k) {
    return [ vector[0] * k, vector[1] * k, vector[2] * k ];
  }
  function d3_geo_cartesianNormalize(d) {
    var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l;
    d[1] /= l;
    d[2] /= l;
  }
  function d3_geo_spherical(cartesian) {
    return [ Math.atan2(cartesian[1], cartesian[0]), d3_asin(cartesian[2]) ];
  }
  function d3_geo_sphericalEqual(a, b) {
    return abs(a[0] - b[0]) < ε && abs(a[1] - b[1]) < ε;
  }
  d3.geo.bounds = function() {
    var λ0, φ0, λ1, φ1, λ_, λ__, φ__, p0, dλSum, ranges, range;
    var bound = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        bound.point = ringPoint;
        bound.lineStart = ringStart;
        bound.lineEnd = ringEnd;
        dλSum = 0;
        d3_geo_area.polygonStart();
      },
      polygonEnd: function() {
        d3_geo_area.polygonEnd();
        bound.point = point;
        bound.lineStart = lineStart;
        bound.lineEnd = lineEnd;
        if (d3_geo_areaRingSum < 0) λ0 = -(λ1 = 180), φ0 = -(φ1 = 90); else if (dλSum > ε) φ1 = 90; else if (dλSum < -ε) φ0 = -90;
        range[0] = λ0, range[1] = λ1;
      }
    };
    function point(λ, φ) {
      ranges.push(range = [ λ0 = λ, λ1 = λ ]);
      if (φ < φ0) φ0 = φ;
      if (φ > φ1) φ1 = φ;
    }
    function linePoint(λ, φ) {
      var p = d3_geo_cartesian([ λ * d3_radians, φ * d3_radians ]);
      if (p0) {
        var normal = d3_geo_cartesianCross(p0, p), equatorial = [ normal[1], -normal[0], 0 ], inflection = d3_geo_cartesianCross(equatorial, normal);
        d3_geo_cartesianNormalize(inflection);
        inflection = d3_geo_spherical(inflection);
        var dλ = λ - λ_, s = dλ > 0 ? 1 : -1, λi = inflection[0] * d3_degrees * s, antimeridian = abs(dλ) > 180;
        if (antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = inflection[1] * d3_degrees;
          if (φi > φ1) φ1 = φi;
        } else if (λi = (λi + 360) % 360 - 180, antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = -inflection[1] * d3_degrees;
          if (φi < φ0) φ0 = φi;
        } else {
          if (φ < φ0) φ0 = φ;
          if (φ > φ1) φ1 = φ;
        }
        if (antimeridian) {
          if (λ < λ_) {
            if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
          } else {
            if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
          }
        } else {
          if (λ1 >= λ0) {
            if (λ < λ0) λ0 = λ;
            if (λ > λ1) λ1 = λ;
          } else {
            if (λ > λ_) {
              if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
            } else {
              if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
            }
          }
        }
      } else {
        point(λ, φ);
      }
      p0 = p, λ_ = λ;
    }
    function lineStart() {
      bound.point = linePoint;
    }
    function lineEnd() {
      range[0] = λ0, range[1] = λ1;
      bound.point = point;
      p0 = null;
    }
    function ringPoint(λ, φ) {
      if (p0) {
        var dλ = λ - λ_;
        dλSum += abs(dλ) > 180 ? dλ + (dλ > 0 ? 360 : -360) : dλ;
      } else λ__ = λ, φ__ = φ;
      d3_geo_area.point(λ, φ);
      linePoint(λ, φ);
    }
    function ringStart() {
      d3_geo_area.lineStart();
    }
    function ringEnd() {
      ringPoint(λ__, φ__);
      d3_geo_area.lineEnd();
      if (abs(dλSum) > ε) λ0 = -(λ1 = 180);
      range[0] = λ0, range[1] = λ1;
      p0 = null;
    }
    function angle(λ0, λ1) {
      return (λ1 -= λ0) < 0 ? λ1 + 360 : λ1;
    }
    function compareRanges(a, b) {
      return a[0] - b[0];
    }
    function withinRange(x, range) {
      return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
    }
    return function(feature) {
      φ1 = λ1 = -(λ0 = φ0 = Infinity);
      ranges = [];
      d3.geo.stream(feature, bound);
      var n = ranges.length;
      if (n) {
        ranges.sort(compareRanges);
        for (var i = 1, a = ranges[0], b, merged = [ a ]; i < n; ++i) {
          b = ranges[i];
          if (withinRange(b[0], a) || withinRange(b[1], a)) {
            if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
            if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
          } else {
            merged.push(a = b);
          }
        }
        var best = -Infinity, dλ;
        for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {
          b = merged[i];
          if ((dλ = angle(a[1], b[0])) > best) best = dλ, λ0 = b[0], λ1 = a[1];
        }
      }
      ranges = range = null;
      return λ0 === Infinity || φ0 === Infinity ? [ [ NaN, NaN ], [ NaN, NaN ] ] : [ [ λ0, φ0 ], [ λ1, φ1 ] ];
    };
  }();
  d3.geo.centroid = function(object) {
    d3_geo_centroidW0 = d3_geo_centroidW1 = d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
    d3.geo.stream(object, d3_geo_centroid);
    var x = d3_geo_centroidX2, y = d3_geo_centroidY2, z = d3_geo_centroidZ2, m = x * x + y * y + z * z;
    if (m < ε2) {
      x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;
      if (d3_geo_centroidW1 < ε) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;
      m = x * x + y * y + z * z;
      if (m < ε2) return [ NaN, NaN ];
    }
    return [ Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees ];
  };
  var d3_geo_centroidW0, d3_geo_centroidW1, d3_geo_centroidX0, d3_geo_centroidY0, d3_geo_centroidZ0, d3_geo_centroidX1, d3_geo_centroidY1, d3_geo_centroidZ1, d3_geo_centroidX2, d3_geo_centroidY2, d3_geo_centroidZ2;
  var d3_geo_centroid = {
    sphere: d3_noop,
    point: d3_geo_centroidPoint,
    lineStart: d3_geo_centroidLineStart,
    lineEnd: d3_geo_centroidLineEnd,
    polygonStart: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
    }
  };
  function d3_geo_centroidPoint(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    d3_geo_centroidPointXYZ(cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ));
  }
  function d3_geo_centroidPointXYZ(x, y, z) {
    ++d3_geo_centroidW0;
    d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;
    d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;
    d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;
  }
  function d3_geo_centroidLineStart() {
    var x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroid.point = nextPoint;
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), w = Math.atan2(Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_centroidLineEnd() {
    d3_geo_centroid.point = d3_geo_centroidPoint;
  }
  function d3_geo_centroidRingStart() {
    var λ00, φ00, x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ00 = λ, φ00 = φ;
      d3_geo_centroid.point = nextPoint;
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    d3_geo_centroid.lineEnd = function() {
      nextPoint(λ00, φ00);
      d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
      d3_geo_centroid.point = d3_geo_centroidPoint;
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), cx = y0 * z - z0 * y, cy = z0 * x - x0 * z, cz = x0 * y - y0 * x, m = Math.sqrt(cx * cx + cy * cy + cz * cz), u = x0 * x + y0 * y + z0 * z, v = m && -d3_acos(u) / m, w = Math.atan2(m, u);
      d3_geo_centroidX2 += v * cx;
      d3_geo_centroidY2 += v * cy;
      d3_geo_centroidZ2 += v * cz;
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_true() {
    return true;
  }
  function d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener) {
    var subject = [], clip = [];
    segments.forEach(function(segment) {
      if ((n = segment.length - 1) <= 0) return;
      var n, p0 = segment[0], p1 = segment[n];
      if (d3_geo_sphericalEqual(p0, p1)) {
        listener.lineStart();
        for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
        listener.lineEnd();
        return;
      }
      var a = new d3_geo_clipPolygonIntersection(p0, segment, null, true), b = new d3_geo_clipPolygonIntersection(p0, null, a, false);
      a.o = b;
      subject.push(a);
      clip.push(b);
      a = new d3_geo_clipPolygonIntersection(p1, segment, null, false);
      b = new d3_geo_clipPolygonIntersection(p1, null, a, true);
      a.o = b;
      subject.push(a);
      clip.push(b);
    });
    clip.sort(compare);
    d3_geo_clipPolygonLinkCircular(subject);
    d3_geo_clipPolygonLinkCircular(clip);
    if (!subject.length) return;
    for (var i = 0, entry = clipStartInside, n = clip.length; i < n; ++i) {
      clip[i].e = entry = !entry;
    }
    var start = subject[0], points, point;
    while (1) {
      var current = start, isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      listener.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (var i = 0, n = points.length; i < n; ++i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.n.x, 1, listener);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (var i = points.length - 1; i >= 0; --i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.p.x, -1, listener);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      listener.lineEnd();
    }
  }
  function d3_geo_clipPolygonLinkCircular(array) {
    if (!(n = array.length)) return;
    var n, i = 0, a = array[0], b;
    while (++i < n) {
      a.n = b = array[i];
      b.p = a;
      a = b;
    }
    a.n = b = array[0];
    b.p = a;
  }
  function d3_geo_clipPolygonIntersection(point, points, other, entry) {
    this.x = point;
    this.z = points;
    this.o = other;
    this.e = entry;
    this.v = false;
    this.n = this.p = null;
  }
  function d3_geo_clip(pointVisible, clipLine, interpolate, clipStart) {
    return function(rotate, listener) {
      var line = clipLine(listener), rotatedClipStart = rotate.invert(clipStart[0], clipStart[1]);
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
          listener.polygonStart();
        },
        polygonEnd: function() {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = d3.merge(segments);
          var clipStartInside = d3_geo_pointInPolygon(rotatedClipStart, polygon);
          if (segments.length) {
            d3_geo_clipPolygon(segments, d3_geo_clipSort, clipStartInside, interpolate, listener);
          } else if (clipStartInside) {
            listener.lineStart();
            interpolate(null, null, 1, listener);
            listener.lineEnd();
          }
          listener.polygonEnd();
          segments = polygon = null;
        },
        sphere: function() {
          listener.polygonStart();
          listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd();
          listener.polygonEnd();
        }
      };
      function point(λ, φ) {
        var point = rotate(λ, φ);
        if (pointVisible(λ = point[0], φ = point[1])) listener.point(λ, φ);
      }
      function pointLine(λ, φ) {
        var point = rotate(λ, φ);
        line.point(point[0], point[1]);
      }
      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }
      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }
      var segments;
      var buffer = d3_geo_clipBufferListener(), ringListener = clipLine(buffer), polygon, ring;
      function pointRing(λ, φ) {
        ring.push([ λ, φ ]);
        var point = rotate(λ, φ);
        ringListener.point(point[0], point[1]);
      }
      function ringStart() {
        ringListener.lineStart();
        ring = [];
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringListener.lineEnd();
        var clean = ringListener.clean(), ringSegments = buffer.buffer(), segment, n = ringSegments.length;
        ring.pop();
        polygon.push(ring);
        ring = null;
        if (!n) return;
        if (clean & 1) {
          segment = ringSegments[0];
          var n = segment.length - 1, i = -1, point;
          listener.lineStart();
          while (++i < n) listener.point((point = segment[i])[0], point[1]);
          listener.lineEnd();
          return;
        }
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
        segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
      }
      return clip;
    };
  }
  function d3_geo_clipSegmentLength1(segment) {
    return segment.length > 1;
  }
  function d3_geo_clipBufferListener() {
    var lines = [], line;
    return {
      lineStart: function() {
        lines.push(line = []);
      },
      point: function(λ, φ) {
        line.push([ λ, φ ]);
      },
      lineEnd: d3_noop,
      buffer: function() {
        var buffer = lines;
        lines = [];
        line = null;
        return buffer;
      },
      rejoin: function() {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      }
    };
  }
  function d3_geo_clipSort(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfπ - ε : halfπ - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfπ - ε : halfπ - b[1]);
  }
  function d3_geo_pointInPolygon(point, polygon) {
    var meridian = point[0], parallel = point[1], meridianNormal = [ Math.sin(meridian), -Math.cos(meridian), 0 ], polarAngle = 0, winding = 0;
    d3_geo_areaRingSum.reset();
    for (var i = 0, n = polygon.length; i < n; ++i) {
      var ring = polygon[i], m = ring.length;
      if (!m) continue;
      var point0 = ring[0], λ0 = point0[0], φ0 = point0[1] / 2 + π / 4, sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), j = 1;
      while (true) {
        if (j === m) j = 0;
        point = ring[j];
        var λ = point[0], φ = point[1] / 2 + π / 4, sinφ = Math.sin(φ), cosφ = Math.cos(φ), dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, antimeridian = adλ > π, k = sinφ0 * sinφ;
        d3_geo_areaRingSum.add(Math.atan2(k * sdλ * Math.sin(adλ), cosφ0 * cosφ + k * Math.cos(adλ)));
        polarAngle += antimeridian ? dλ + sdλ * τ : dλ;
        if (antimeridian ^ λ0 >= meridian ^ λ >= meridian) {
          var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));
          d3_geo_cartesianNormalize(arc);
          var intersection = d3_geo_cartesianCross(meridianNormal, arc);
          d3_geo_cartesianNormalize(intersection);
          var φarc = (antimeridian ^ dλ >= 0 ? -1 : 1) * d3_asin(intersection[2]);
          if (parallel > φarc || parallel === φarc && (arc[0] || arc[1])) {
            winding += antimeridian ^ dλ >= 0 ? 1 : -1;
          }
        }
        if (!j++) break;
        λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ, point0 = point;
      }
    }
    return (polarAngle < -ε || polarAngle < ε && d3_geo_areaRingSum < 0) ^ winding & 1;
  }
  var d3_geo_clipAntimeridian = d3_geo_clip(d3_true, d3_geo_clipAntimeridianLine, d3_geo_clipAntimeridianInterpolate, [ -π, -π / 2 ]);
  function d3_geo_clipAntimeridianLine(listener) {
    var λ0 = NaN, φ0 = NaN, sλ0 = NaN, clean;
    return {
      lineStart: function() {
        listener.lineStart();
        clean = 1;
      },
      point: function(λ1, φ1) {
        var sλ1 = λ1 > 0 ? π : -π, dλ = abs(λ1 - λ0);
        if (abs(dλ - π) < ε) {
          listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? halfπ : -halfπ);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          listener.point(λ1, φ0);
          clean = 0;
        } else if (sλ0 !== sλ1 && dλ >= π) {
          if (abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
          if (abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
          φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          clean = 0;
        }
        listener.point(λ0 = λ1, φ0 = φ1);
        sλ0 = sλ1;
      },
      lineEnd: function() {
        listener.lineEnd();
        λ0 = φ0 = NaN;
      },
      clean: function() {
        return 2 - clean;
      }
    };
  }
  function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
    var cosφ0, cosφ1, sinλ0_λ1 = Math.sin(λ0 - λ1);
    return abs(sinλ0_λ1) > ε ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1) - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0)) / (cosφ0 * cosφ1 * sinλ0_λ1)) : (φ0 + φ1) / 2;
  }
  function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
    var φ;
    if (from == null) {
      φ = direction * halfπ;
      listener.point(-π, φ);
      listener.point(0, φ);
      listener.point(π, φ);
      listener.point(π, 0);
      listener.point(π, -φ);
      listener.point(0, -φ);
      listener.point(-π, -φ);
      listener.point(-π, 0);
      listener.point(-π, φ);
    } else if (abs(from[0] - to[0]) > ε) {
      var s = from[0] < to[0] ? π : -π;
      φ = direction * s / 2;
      listener.point(-s, φ);
      listener.point(0, φ);
      listener.point(s, φ);
    } else {
      listener.point(to[0], to[1]);
    }
  }
  function d3_geo_clipCircle(radius) {
    var cr = Math.cos(radius), smallRadius = cr > 0, notHemisphere = abs(cr) > ε, interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);
    return d3_geo_clip(visible, clipLine, interpolate, smallRadius ? [ 0, -radius ] : [ -π, radius - π ]);
    function visible(λ, φ) {
      return Math.cos(λ) * Math.cos(φ) > cr;
    }
    function clipLine(listener) {
      var point0, c0, v0, v00, clean;
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(λ, φ) {
          var point1 = [ λ, φ ], point2, v = visible(λ, φ), c = smallRadius ? v ? 0 : code(λ, φ) : v ? code(λ + (λ < 0 ? π : -π), φ) : 0;
          if (!point0 && (v00 = v0 = v)) listener.lineStart();
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
              point1[0] += ε;
              point1[1] += ε;
              v = visible(point1[0], point1[1]);
            }
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              listener.lineStart();
              point2 = intersect(point1, point0);
              listener.point(point2[0], point2[1]);
            } else {
              point2 = intersect(point0, point1);
              listener.point(point2[0], point2[1]);
              listener.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
              } else {
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
              }
            }
          }
          if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {
            listener.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function() {
          if (v0) listener.lineEnd();
          point0 = null;
        },
        clean: function() {
          return clean | (v00 && v0) << 1;
        }
      };
    }
    function intersect(a, b, two) {
      var pa = d3_geo_cartesian(a), pb = d3_geo_cartesian(b);
      var n1 = [ 1, 0, 0 ], n2 = d3_geo_cartesianCross(pa, pb), n2n2 = d3_geo_cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
      if (!determinant) return !two && a;
      var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = d3_geo_cartesianCross(n1, n2), A = d3_geo_cartesianScale(n1, c1), B = d3_geo_cartesianScale(n2, c2);
      d3_geo_cartesianAdd(A, B);
      var u = n1xn2, w = d3_geo_cartesianDot(A, u), uu = d3_geo_cartesianDot(u, u), t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);
      if (t2 < 0) return;
      var t = Math.sqrt(t2), q = d3_geo_cartesianScale(u, (-w - t) / uu);
      d3_geo_cartesianAdd(q, A);
      q = d3_geo_spherical(q);
      if (!two) return q;
      var λ0 = a[0], λ1 = b[0], φ0 = a[1], φ1 = b[1], z;
      if (λ1 < λ0) z = λ0, λ0 = λ1, λ1 = z;
      var δλ = λ1 - λ0, polar = abs(δλ - π) < ε, meridian = polar || δλ < ε;
      if (!polar && φ1 < φ0) z = φ0, φ0 = φ1, φ1 = z;
      if (meridian ? polar ? φ0 + φ1 > 0 ^ q[1] < (abs(q[0] - λ0) < ε ? φ0 : φ1) : φ0 <= q[1] && q[1] <= φ1 : δλ > π ^ (λ0 <= q[0] && q[0] <= λ1)) {
        var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);
        d3_geo_cartesianAdd(q1, A);
        return [ q, d3_geo_spherical(q1) ];
      }
    }
    function code(λ, φ) {
      var r = smallRadius ? radius : π - radius, code = 0;
      if (λ < -r) code |= 1; else if (λ > r) code |= 2;
      if (φ < -r) code |= 4; else if (φ > r) code |= 8;
      return code;
    }
  }
  function d3_geom_clipLine(x0, y0, x1, y1) {
    return function(line) {
      var a = line.a, b = line.b, ax = a.x, ay = a.y, bx = b.x, by = b.y, t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, r;
      r = x0 - ax;
      if (!dx && r > 0) return;
      r /= dx;
      if (dx < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dx > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = x1 - ax;
      if (!dx && r < 0) return;
      r /= dx;
      if (dx < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dx > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      r = y0 - ay;
      if (!dy && r > 0) return;
      r /= dy;
      if (dy < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dy > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = y1 - ay;
      if (!dy && r < 0) return;
      r /= dy;
      if (dy < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dy > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      if (t0 > 0) line.a = {
        x: ax + t0 * dx,
        y: ay + t0 * dy
      };
      if (t1 < 1) line.b = {
        x: ax + t1 * dx,
        y: ay + t1 * dy
      };
      return line;
    };
  }
  var d3_geo_clipExtentMAX = 1e9;
  d3.geo.clipExtent = function() {
    var x0, y0, x1, y1, stream, clip, clipExtent = {
      stream: function(output) {
        if (stream) stream.valid = false;
        stream = clip(output);
        stream.valid = true;
        return stream;
      },
      extent: function(_) {
        if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
        clip = d3_geo_clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]);
        if (stream) stream.valid = false, stream = null;
        return clipExtent;
      }
    };
    return clipExtent.extent([ [ 0, 0 ], [ 960, 500 ] ]);
  };
  function d3_geo_clipExtent(x0, y0, x1, y1) {
    return function(listener) {
      var listener_ = listener, bufferListener = d3_geo_clipBufferListener(), clipLine = d3_geom_clipLine(x0, y0, x1, y1), segments, polygon, ring;
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          listener = bufferListener;
          segments = [];
          polygon = [];
          clean = true;
        },
        polygonEnd: function() {
          listener = listener_;
          segments = d3.merge(segments);
          var clipStartInside = insidePolygon([ x0, y1 ]), inside = clean && clipStartInside, visible = segments.length;
          if (inside || visible) {
            listener.polygonStart();
            if (inside) {
              listener.lineStart();
              interpolate(null, null, 1, listener);
              listener.lineEnd();
            }
            if (visible) {
              d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener);
            }
            listener.polygonEnd();
          }
          segments = polygon = ring = null;
        }
      };
      function insidePolygon(p) {
        var wn = 0, n = polygon.length, y = p[1];
        for (var i = 0; i < n; ++i) {
          for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {
            b = v[j];
            if (a[1] <= y) {
              if (b[1] > y && d3_cross2d(a, b, p) > 0) ++wn;
            } else {
              if (b[1] <= y && d3_cross2d(a, b, p) < 0) --wn;
            }
            a = b;
          }
        }
        return wn !== 0;
      }
      function interpolate(from, to, direction, listener) {
        var a = 0, a1 = 0;
        if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoints(from, to) < 0 ^ direction > 0) {
          do {
            listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
          } while ((a = (a + direction + 4) % 4) !== a1);
        } else {
          listener.point(to[0], to[1]);
        }
      }
      function pointVisible(x, y) {
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
      }
      function point(x, y) {
        if (pointVisible(x, y)) listener.point(x, y);
      }
      var x__, y__, v__, x_, y_, v_, first, clean;
      function lineStart() {
        clip.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferListener.rejoin();
          segments.push(bufferListener.buffer());
        }
        clip.point = point;
        if (v_) listener.lineEnd();
      }
      function linePoint(x, y) {
        x = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, x));
        y = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, y));
        var v = pointVisible(x, y);
        if (polygon) ring.push([ x, y ]);
        if (first) {
          x__ = x, y__ = y, v__ = v;
          first = false;
          if (v) {
            listener.lineStart();
            listener.point(x, y);
          }
        } else {
          if (v && v_) listener.point(x, y); else {
            var l = {
              a: {
                x: x_,
                y: y_
              },
              b: {
                x: x,
                y: y
              }
            };
            if (clipLine(l)) {
              if (!v_) {
                listener.lineStart();
                listener.point(l.a.x, l.a.y);
              }
              listener.point(l.b.x, l.b.y);
              if (!v) listener.lineEnd();
              clean = false;
            } else if (v) {
              listener.lineStart();
              listener.point(x, y);
              clean = false;
            }
          }
        }
        x_ = x, y_ = y, v_ = v;
      }
      return clip;
    };
    function corner(p, direction) {
      return abs(p[0] - x0) < ε ? direction > 0 ? 0 : 3 : abs(p[0] - x1) < ε ? direction > 0 ? 2 : 1 : abs(p[1] - y0) < ε ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
    }
    function compare(a, b) {
      return comparePoints(a.x, b.x);
    }
    function comparePoints(a, b) {
      var ca = corner(a, 1), cb = corner(b, 1);
      return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
    }
  }
  function d3_geo_compose(a, b) {
    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }
    if (a.invert && b.invert) compose.invert = function(x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };
    return compose;
  }
  function d3_geo_conic(projectAt) {
    var φ0 = 0, φ1 = π / 3, m = d3_geo_projectionMutator(projectAt), p = m(φ0, φ1);
    p.parallels = function(_) {
      if (!arguments.length) return [ φ0 / π * 180, φ1 / π * 180 ];
      return m(φ0 = _[0] * π / 180, φ1 = _[1] * π / 180);
    };
    return p;
  }
  function d3_geo_conicEqualArea(φ0, φ1) {
    var sinφ0 = Math.sin(φ0), n = (sinφ0 + Math.sin(φ1)) / 2, C = 1 + sinφ0 * (2 * n - sinφ0), ρ0 = Math.sqrt(C) / n;
    function forward(λ, φ) {
      var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;
      return [ ρ * Math.sin(λ *= n), ρ0 - ρ * Math.cos(λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = ρ0 - y;
      return [ Math.atan2(x, ρ0_y) / n, d3_asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n)) ];
    };
    return forward;
  }
  (d3.geo.conicEqualArea = function() {
    return d3_geo_conic(d3_geo_conicEqualArea);
  }).raw = d3_geo_conicEqualArea;
  d3.geo.albers = function() {
    return d3.geo.conicEqualArea().rotate([ 96, 0 ]).center([ -.6, 38.7 ]).parallels([ 29.5, 45.5 ]).scale(1070);
  };
  d3.geo.albersUsa = function() {
    var lower48 = d3.geo.albers();
    var alaska = d3.geo.conicEqualArea().rotate([ 154, 0 ]).center([ -2, 58.5 ]).parallels([ 55, 65 ]);
    var hawaii = d3.geo.conicEqualArea().rotate([ 157, 0 ]).center([ -3, 19.9 ]).parallels([ 8, 18 ]);
    var point, pointStream = {
      point: function(x, y) {
        point = [ x, y ];
      }
    }, lower48Point, alaskaPoint, hawaiiPoint;
    function albersUsa(coordinates) {
      var x = coordinates[0], y = coordinates[1];
      point = null;
      (lower48Point(x, y), point) || (alaskaPoint(x, y), point) || hawaiiPoint(x, y);
      return point;
    }
    albersUsa.invert = function(coordinates) {
      var k = lower48.scale(), t = lower48.translate(), x = (coordinates[0] - t[0]) / k, y = (coordinates[1] - t[1]) / k;
      return (y >= .12 && y < .234 && x >= -.425 && x < -.214 ? alaska : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii : lower48).invert(coordinates);
    };
    albersUsa.stream = function(stream) {
      var lower48Stream = lower48.stream(stream), alaskaStream = alaska.stream(stream), hawaiiStream = hawaii.stream(stream);
      return {
        point: function(x, y) {
          lower48Stream.point(x, y);
          alaskaStream.point(x, y);
          hawaiiStream.point(x, y);
        },
        sphere: function() {
          lower48Stream.sphere();
          alaskaStream.sphere();
          hawaiiStream.sphere();
        },
        lineStart: function() {
          lower48Stream.lineStart();
          alaskaStream.lineStart();
          hawaiiStream.lineStart();
        },
        lineEnd: function() {
          lower48Stream.lineEnd();
          alaskaStream.lineEnd();
          hawaiiStream.lineEnd();
        },
        polygonStart: function() {
          lower48Stream.polygonStart();
          alaskaStream.polygonStart();
          hawaiiStream.polygonStart();
        },
        polygonEnd: function() {
          lower48Stream.polygonEnd();
          alaskaStream.polygonEnd();
          hawaiiStream.polygonEnd();
        }
      };
    };
    albersUsa.precision = function(_) {
      if (!arguments.length) return lower48.precision();
      lower48.precision(_);
      alaska.precision(_);
      hawaii.precision(_);
      return albersUsa;
    };
    albersUsa.scale = function(_) {
      if (!arguments.length) return lower48.scale();
      lower48.scale(_);
      alaska.scale(_ * .35);
      hawaii.scale(_);
      return albersUsa.translate(lower48.translate());
    };
    albersUsa.translate = function(_) {
      if (!arguments.length) return lower48.translate();
      var k = lower48.scale(), x = +_[0], y = +_[1];
      lower48Point = lower48.translate(_).clipExtent([ [ x - .455 * k, y - .238 * k ], [ x + .455 * k, y + .238 * k ] ]).stream(pointStream).point;
      alaskaPoint = alaska.translate([ x - .307 * k, y + .201 * k ]).clipExtent([ [ x - .425 * k + ε, y + .12 * k + ε ], [ x - .214 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      hawaiiPoint = hawaii.translate([ x - .205 * k, y + .212 * k ]).clipExtent([ [ x - .214 * k + ε, y + .166 * k + ε ], [ x - .115 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      return albersUsa;
    };
    return albersUsa.scale(1070);
  };
  var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_pathAreaPolygon = 0;
      d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
      d3_geo_pathAreaSum += abs(d3_geo_pathAreaPolygon / 2);
    }
  };
  function d3_geo_pathAreaRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathArea.point = function(x, y) {
      d3_geo_pathArea.point = nextPoint;
      x00 = x0 = x, y00 = y0 = y;
    };
    function nextPoint(x, y) {
      d3_geo_pathAreaPolygon += y0 * x - x0 * y;
      x0 = x, y0 = y;
    }
    d3_geo_pathArea.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  var d3_geo_pathBoundsX0, d3_geo_pathBoundsY0, d3_geo_pathBoundsX1, d3_geo_pathBoundsY1;
  var d3_geo_pathBounds = {
    point: d3_geo_pathBoundsPoint,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_pathBoundsPoint(x, y) {
    if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;
    if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;
    if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;
    if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;
  }
  function d3_geo_pathBuffer() {
    var pointCircle = d3_geo_pathBufferCircle(4.5), buffer = [];
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointCircle = d3_geo_pathBufferCircle(_);
        return stream;
      },
      result: function() {
        if (buffer.length) {
          var result = buffer.join("");
          buffer = [];
          return result;
        }
      }
    };
    function point(x, y) {
      buffer.push("M", x, ",", y, pointCircle);
    }
    function pointLineStart(x, y) {
      buffer.push("M", x, ",", y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      buffer.push("L", x, ",", y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      buffer.push("Z");
    }
    return stream;
  }
  function d3_geo_pathBufferCircle(radius) {
    return "m0," + radius + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius + "z";
  }
  var d3_geo_pathCentroid = {
    point: d3_geo_pathCentroidPoint,
    lineStart: d3_geo_pathCentroidLineStart,
    lineEnd: d3_geo_pathCentroidLineEnd,
    polygonStart: function() {
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
      d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
    }
  };
  function d3_geo_pathCentroidPoint(x, y) {
    d3_geo_centroidX0 += x;
    d3_geo_centroidY0 += y;
    ++d3_geo_centroidZ0;
  }
  function d3_geo_pathCentroidLineStart() {
    var x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
  }
  function d3_geo_pathCentroidLineEnd() {
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
  }
  function d3_geo_pathCentroidRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      z = y0 * x - x0 * y;
      d3_geo_centroidX2 += z * (x0 + x);
      d3_geo_centroidY2 += z * (y0 + y);
      d3_geo_centroidZ2 += z * 3;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
    d3_geo_pathCentroid.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  function d3_geo_pathContext(context) {
    var pointRadius = 4.5;
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointRadius = _;
        return stream;
      },
      result: d3_noop
    };
    function point(x, y) {
      context.moveTo(x, y);
      context.arc(x, y, pointRadius, 0, τ);
    }
    function pointLineStart(x, y) {
      context.moveTo(x, y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      context.lineTo(x, y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      context.closePath();
    }
    return stream;
  }
  function d3_geo_resample(project) {
    var δ2 = .5, cosMinDistance = Math.cos(30 * d3_radians), maxDepth = 16;
    function resample(stream) {
      return (maxDepth ? resampleRecursive : resampleNone)(stream);
    }
    function resampleNone(stream) {
      return d3_geo_transformPoint(stream, function(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      });
    }
    function resampleRecursive(stream) {
      var λ00, φ00, x00, y00, a00, b00, c00, λ0, x0, y0, a0, b0, c0;
      var resample = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          stream.polygonStart();
          resample.lineStart = ringStart;
        },
        polygonEnd: function() {
          stream.polygonEnd();
          resample.lineStart = lineStart;
        }
      };
      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }
      function lineStart() {
        x0 = NaN;
        resample.point = linePoint;
        stream.lineStart();
      }
      function linePoint(λ, φ) {
        var c = d3_geo_cartesian([ λ, φ ]), p = project(λ, φ);
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }
      function lineEnd() {
        resample.point = point;
        stream.lineEnd();
      }
      function ringStart() {
        lineStart();
        resample.point = ringPoint;
        resample.lineEnd = ringEnd;
      }
      function ringPoint(λ, φ) {
        linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
        resample.point = linePoint;
      }
      function ringEnd() {
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);
        resample.lineEnd = lineEnd;
        lineEnd();
      }
      return resample;
    }
    function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;
      if (d2 > 4 * δ2 && depth--) {
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), φ2 = Math.asin(c /= m), λ2 = abs(abs(c) - 1) < ε || abs(λ0 - λ1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a), p = project(λ2, φ2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > δ2 || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
          resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);
        }
      }
    }
    resample.precision = function(_) {
      if (!arguments.length) return Math.sqrt(δ2);
      maxDepth = (δ2 = _ * _) > 0 && 16;
      return resample;
    };
    return resample;
  }
  d3.geo.path = function() {
    var pointRadius = 4.5, projection, context, projectStream, contextStream, cacheStream;
    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);
        d3.geo.stream(object, cacheStream);
      }
      return contextStream.result();
    }
    path.area = function(object) {
      d3_geo_pathAreaSum = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathArea));
      return d3_geo_pathAreaSum;
    };
    path.centroid = function(object) {
      d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
      return d3_geo_centroidZ2 ? [ d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2 ] : d3_geo_centroidZ1 ? [ d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1 ] : d3_geo_centroidZ0 ? [ d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0 ] : [ NaN, NaN ];
    };
    path.bounds = function(object) {
      d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);
      d3.geo.stream(object, projectStream(d3_geo_pathBounds));
      return [ [ d3_geo_pathBoundsX0, d3_geo_pathBoundsY0 ], [ d3_geo_pathBoundsX1, d3_geo_pathBoundsY1 ] ];
    };
    path.projection = function(_) {
      if (!arguments.length) return projection;
      projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
      return reset();
    };
    path.context = function(_) {
      if (!arguments.length) return context;
      contextStream = (context = _) == null ? new d3_geo_pathBuffer() : new d3_geo_pathContext(_);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return reset();
    };
    path.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path;
    };
    function reset() {
      cacheStream = null;
      return path;
    }
    return path.projection(d3.geo.albersUsa()).context(null);
  };
  function d3_geo_pathProjectStream(project) {
    var resample = d3_geo_resample(function(x, y) {
      return project([ x * d3_degrees, y * d3_degrees ]);
    });
    return function(stream) {
      return d3_geo_projectionRadians(resample(stream));
    };
  }
  d3.geo.transform = function(methods) {
    return {
      stream: function(stream) {
        var transform = new d3_geo_transform(stream);
        for (var k in methods) transform[k] = methods[k];
        return transform;
      }
    };
  };
  function d3_geo_transform(stream) {
    this.stream = stream;
  }
  d3_geo_transform.prototype = {
    point: function(x, y) {
      this.stream.point(x, y);
    },
    sphere: function() {
      this.stream.sphere();
    },
    lineStart: function() {
      this.stream.lineStart();
    },
    lineEnd: function() {
      this.stream.lineEnd();
    },
    polygonStart: function() {
      this.stream.polygonStart();
    },
    polygonEnd: function() {
      this.stream.polygonEnd();
    }
  };
  function d3_geo_transformPoint(stream, point) {
    return {
      point: point,
      sphere: function() {
        stream.sphere();
      },
      lineStart: function() {
        stream.lineStart();
      },
      lineEnd: function() {
        stream.lineEnd();
      },
      polygonStart: function() {
        stream.polygonStart();
      },
      polygonEnd: function() {
        stream.polygonEnd();
      }
    };
  }
  d3.geo.projection = d3_geo_projection;
  d3.geo.projectionMutator = d3_geo_projectionMutator;
  function d3_geo_projection(project) {
    return d3_geo_projectionMutator(function() {
      return project;
    })();
  }
  function d3_geo_projectionMutator(projectAt) {
    var project, rotate, projectRotate, projectResample = d3_geo_resample(function(x, y) {
      x = project(x, y);
      return [ x[0] * k + δx, δy - x[1] * k ];
    }), k = 150, x = 480, y = 250, λ = 0, φ = 0, δλ = 0, δφ = 0, δγ = 0, δx, δy, preclip = d3_geo_clipAntimeridian, postclip = d3_identity, clipAngle = null, clipExtent = null, stream;
    function projection(point) {
      point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
      return [ point[0] * k + δx, δy - point[1] * k ];
    }
    function invert(point) {
      point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);
      return point && [ point[0] * d3_degrees, point[1] * d3_degrees ];
    }
    projection.stream = function(output) {
      if (stream) stream.valid = false;
      stream = d3_geo_projectionRadians(preclip(rotate, projectResample(postclip(output))));
      stream.valid = true;
      return stream;
    };
    projection.clipAngle = function(_) {
      if (!arguments.length) return clipAngle;
      preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);
      return invalidate();
    };
    projection.clipExtent = function(_) {
      if (!arguments.length) return clipExtent;
      clipExtent = _;
      postclip = _ ? d3_geo_clipExtent(_[0][0], _[0][1], _[1][0], _[1][1]) : d3_identity;
      return invalidate();
    };
    projection.scale = function(_) {
      if (!arguments.length) return k;
      k = +_;
      return reset();
    };
    projection.translate = function(_) {
      if (!arguments.length) return [ x, y ];
      x = +_[0];
      y = +_[1];
      return reset();
    };
    projection.center = function(_) {
      if (!arguments.length) return [ λ * d3_degrees, φ * d3_degrees ];
      λ = _[0] % 360 * d3_radians;
      φ = _[1] % 360 * d3_radians;
      return reset();
    };
    projection.rotate = function(_) {
      if (!arguments.length) return [ δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees ];
      δλ = _[0] % 360 * d3_radians;
      δφ = _[1] % 360 * d3_radians;
      δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
      return reset();
    };
    d3.rebind(projection, projectResample, "precision");
    function reset() {
      projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);
      var center = project(λ, φ);
      δx = x - center[0] * k;
      δy = y + center[1] * k;
      return invalidate();
    }
    function invalidate() {
      if (stream) stream.valid = false, stream = null;
      return projection;
    }
    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return reset();
    };
  }
  function d3_geo_projectionRadians(stream) {
    return d3_geo_transformPoint(stream, function(x, y) {
      stream.point(x * d3_radians, y * d3_radians);
    });
  }
  function d3_geo_equirectangular(λ, φ) {
    return [ λ, φ ];
  }
  (d3.geo.equirectangular = function() {
    return d3_geo_projection(d3_geo_equirectangular);
  }).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;
  d3.geo.rotation = function(rotate) {
    rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);
    function forward(coordinates) {
      coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    }
    forward.invert = function(coordinates) {
      coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    };
    return forward;
  };
  function d3_geo_identityRotation(λ, φ) {
    return [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
  }
  d3_geo_identityRotation.invert = d3_geo_equirectangular;
  function d3_geo_rotation(δλ, δφ, δγ) {
    return δλ ? δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ)) : d3_geo_rotationλ(δλ) : δφ || δγ ? d3_geo_rotationφγ(δφ, δγ) : d3_geo_identityRotation;
  }
  function d3_geo_forwardRotationλ(δλ) {
    return function(λ, φ) {
      return λ += δλ, [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
    };
  }
  function d3_geo_rotationλ(δλ) {
    var rotation = d3_geo_forwardRotationλ(δλ);
    rotation.invert = d3_geo_forwardRotationλ(-δλ);
    return rotation;
  }
  function d3_geo_rotationφγ(δφ, δγ) {
    var cosδφ = Math.cos(δφ), sinδφ = Math.sin(δφ), cosδγ = Math.cos(δγ), sinδγ = Math.sin(δγ);
    function rotation(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδφ + x * sinδφ;
      return [ Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ), d3_asin(k * cosδγ + y * sinδγ) ];
    }
    rotation.invert = function(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδγ - y * sinδγ;
      return [ Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ), d3_asin(k * cosδφ - x * sinδφ) ];
    };
    return rotation;
  }
  d3.geo.circle = function() {
    var origin = [ 0, 0 ], angle, precision = 6, interpolate;
    function circle() {
      var center = typeof origin === "function" ? origin.apply(this, arguments) : origin, rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert, ring = [];
      interpolate(null, null, 1, {
        point: function(x, y) {
          ring.push(x = rotate(x, y));
          x[0] *= d3_degrees, x[1] *= d3_degrees;
        }
      });
      return {
        type: "Polygon",
        coordinates: [ ring ]
      };
    }
    circle.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return circle;
    };
    circle.angle = function(x) {
      if (!arguments.length) return angle;
      interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
      return circle;
    };
    circle.precision = function(_) {
      if (!arguments.length) return precision;
      interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
      return circle;
    };
    return circle.angle(90);
  };
  function d3_geo_circleInterpolate(radius, precision) {
    var cr = Math.cos(radius), sr = Math.sin(radius);
    return function(from, to, direction, listener) {
      var step = direction * precision;
      if (from != null) {
        from = d3_geo_circleAngle(cr, from);
        to = d3_geo_circleAngle(cr, to);
        if (direction > 0 ? from < to : from > to) from += direction * τ;
      } else {
        from = radius + direction * τ;
        to = radius - .5 * step;
      }
      for (var point, t = from; direction > 0 ? t > to : t < to; t -= step) {
        listener.point((point = d3_geo_spherical([ cr, -sr * Math.cos(t), -sr * Math.sin(t) ]))[0], point[1]);
      }
    };
  }
  function d3_geo_circleAngle(cr, point) {
    var a = d3_geo_cartesian(point);
    a[0] -= cr;
    d3_geo_cartesianNormalize(a);
    var angle = d3_acos(-a[1]);
    return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);
  }
  d3.geo.distance = function(a, b) {
    var Δλ = (b[0] - a[0]) * d3_radians, φ0 = a[1] * d3_radians, φ1 = b[1] * d3_radians, sinΔλ = Math.sin(Δλ), cosΔλ = Math.cos(Δλ), sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1), t;
    return Math.atan2(Math.sqrt((t = cosφ1 * sinΔλ) * t + (t = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * t), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);
  };
  d3.geo.graticule = function() {
    var x1, x0, X1, X0, y1, y0, Y1, Y0, dx = 10, dy = dx, DX = 90, DY = 360, x, y, X, Y, precision = 2.5;
    function graticule() {
      return {
        type: "MultiLineString",
        coordinates: lines()
      };
    }
    function lines() {
      return d3.range(Math.ceil(X0 / DX) * DX, X1, DX).map(X).concat(d3.range(Math.ceil(Y0 / DY) * DY, Y1, DY).map(Y)).concat(d3.range(Math.ceil(x0 / dx) * dx, x1, dx).filter(function(x) {
        return abs(x % DX) > ε;
      }).map(x)).concat(d3.range(Math.ceil(y0 / dy) * dy, y1, dy).filter(function(y) {
        return abs(y % DY) > ε;
      }).map(y));
    }
    graticule.lines = function() {
      return lines().map(function(coordinates) {
        return {
          type: "LineString",
          coordinates: coordinates
        };
      });
    };
    graticule.outline = function() {
      return {
        type: "Polygon",
        coordinates: [ X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1)) ]
      };
    };
    graticule.extent = function(_) {
      if (!arguments.length) return graticule.minorExtent();
      return graticule.majorExtent(_).minorExtent(_);
    };
    graticule.majorExtent = function(_) {
      if (!arguments.length) return [ [ X0, Y0 ], [ X1, Y1 ] ];
      X0 = +_[0][0], X1 = +_[1][0];
      Y0 = +_[0][1], Y1 = +_[1][1];
      if (X0 > X1) _ = X0, X0 = X1, X1 = _;
      if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
      return graticule.precision(precision);
    };
    graticule.minorExtent = function(_) {
      if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
      x0 = +_[0][0], x1 = +_[1][0];
      y0 = +_[0][1], y1 = +_[1][1];
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;
      return graticule.precision(precision);
    };
    graticule.step = function(_) {
      if (!arguments.length) return graticule.minorStep();
      return graticule.majorStep(_).minorStep(_);
    };
    graticule.majorStep = function(_) {
      if (!arguments.length) return [ DX, DY ];
      DX = +_[0], DY = +_[1];
      return graticule;
    };
    graticule.minorStep = function(_) {
      if (!arguments.length) return [ dx, dy ];
      dx = +_[0], dy = +_[1];
      return graticule;
    };
    graticule.precision = function(_) {
      if (!arguments.length) return precision;
      precision = +_;
      x = d3_geo_graticuleX(y0, y1, 90);
      y = d3_geo_graticuleY(x0, x1, precision);
      X = d3_geo_graticuleX(Y0, Y1, 90);
      Y = d3_geo_graticuleY(X0, X1, precision);
      return graticule;
    };
    return graticule.majorExtent([ [ -180, -90 + ε ], [ 180, 90 - ε ] ]).minorExtent([ [ -180, -80 - ε ], [ 180, 80 + ε ] ]);
  };
  function d3_geo_graticuleX(y0, y1, dy) {
    var y = d3.range(y0, y1 - ε, dy).concat(y1);
    return function(x) {
      return y.map(function(y) {
        return [ x, y ];
      });
    };
  }
  function d3_geo_graticuleY(x0, x1, dx) {
    var x = d3.range(x0, x1 - ε, dx).concat(x1);
    return function(y) {
      return x.map(function(x) {
        return [ x, y ];
      });
    };
  }
  function d3_source(d) {
    return d.source;
  }
  function d3_target(d) {
    return d.target;
  }
  d3.geo.greatArc = function() {
    var source = d3_source, source_, target = d3_target, target_;
    function greatArc() {
      return {
        type: "LineString",
        coordinates: [ source_ || source.apply(this, arguments), target_ || target.apply(this, arguments) ]
      };
    }
    greatArc.distance = function() {
      return d3.geo.distance(source_ || source.apply(this, arguments), target_ || target.apply(this, arguments));
    };
    greatArc.source = function(_) {
      if (!arguments.length) return source;
      source = _, source_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.target = function(_) {
      if (!arguments.length) return target;
      target = _, target_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.precision = function() {
      return arguments.length ? greatArc : 0;
    };
    return greatArc;
  };
  d3.geo.interpolate = function(source, target) {
    return d3_geo_interpolate(source[0] * d3_radians, source[1] * d3_radians, target[0] * d3_radians, target[1] * d3_radians);
  };
  function d3_geo_interpolate(x0, y0, x1, y1) {
    var cy0 = Math.cos(y0), sy0 = Math.sin(y0), cy1 = Math.cos(y1), sy1 = Math.sin(y1), kx0 = cy0 * Math.cos(x0), ky0 = cy0 * Math.sin(x0), kx1 = cy1 * Math.cos(x1), ky1 = cy1 * Math.sin(x1), d = 2 * Math.asin(Math.sqrt(d3_haversin(y1 - y0) + cy0 * cy1 * d3_haversin(x1 - x0))), k = 1 / Math.sin(d);
    var interpolate = d ? function(t) {
      var B = Math.sin(t *= d) * k, A = Math.sin(d - t) * k, x = A * kx0 + B * kx1, y = A * ky0 + B * ky1, z = A * sy0 + B * sy1;
      return [ Math.atan2(y, x) * d3_degrees, Math.atan2(z, Math.sqrt(x * x + y * y)) * d3_degrees ];
    } : function() {
      return [ x0 * d3_degrees, y0 * d3_degrees ];
    };
    interpolate.distance = d;
    return interpolate;
  }
  d3.geo.length = function(object) {
    d3_geo_lengthSum = 0;
    d3.geo.stream(object, d3_geo_length);
    return d3_geo_lengthSum;
  };
  var d3_geo_lengthSum;
  var d3_geo_length = {
    sphere: d3_noop,
    point: d3_noop,
    lineStart: d3_geo_lengthLineStart,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_lengthLineStart() {
    var λ0, sinφ0, cosφ0;
    d3_geo_length.point = function(λ, φ) {
      λ0 = λ * d3_radians, sinφ0 = Math.sin(φ *= d3_radians), cosφ0 = Math.cos(φ);
      d3_geo_length.point = nextPoint;
    };
    d3_geo_length.lineEnd = function() {
      d3_geo_length.point = d3_geo_length.lineEnd = d3_noop;
    };
    function nextPoint(λ, φ) {
      var sinφ = Math.sin(φ *= d3_radians), cosφ = Math.cos(φ), t = abs((λ *= d3_radians) - λ0), cosΔλ = Math.cos(t);
      d3_geo_lengthSum += Math.atan2(Math.sqrt((t = cosφ * Math.sin(t)) * t + (t = cosφ0 * sinφ - sinφ0 * cosφ * cosΔλ) * t), sinφ0 * sinφ + cosφ0 * cosφ * cosΔλ);
      λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ;
    }
  }
  function d3_geo_azimuthal(scale, angle) {
    function azimuthal(λ, φ) {
      var cosλ = Math.cos(λ), cosφ = Math.cos(φ), k = scale(cosλ * cosφ);
      return [ k * cosφ * Math.sin(λ), k * Math.sin(φ) ];
    }
    azimuthal.invert = function(x, y) {
      var ρ = Math.sqrt(x * x + y * y), c = angle(ρ), sinc = Math.sin(c), cosc = Math.cos(c);
      return [ Math.atan2(x * sinc, ρ * cosc), Math.asin(ρ && y * sinc / ρ) ];
    };
    return azimuthal;
  }
  var d3_geo_azimuthalEqualArea = d3_geo_azimuthal(function(cosλcosφ) {
    return Math.sqrt(2 / (1 + cosλcosφ));
  }, function(ρ) {
    return 2 * Math.asin(ρ / 2);
  });
  (d3.geo.azimuthalEqualArea = function() {
    return d3_geo_projection(d3_geo_azimuthalEqualArea);
  }).raw = d3_geo_azimuthalEqualArea;
  var d3_geo_azimuthalEquidistant = d3_geo_azimuthal(function(cosλcosφ) {
    var c = Math.acos(cosλcosφ);
    return c && c / Math.sin(c);
  }, d3_identity);
  (d3.geo.azimuthalEquidistant = function() {
    return d3_geo_projection(d3_geo_azimuthalEquidistant);
  }).raw = d3_geo_azimuthalEquidistant;
  function d3_geo_conicConformal(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), t = function(φ) {
      return Math.tan(π / 4 + φ / 2);
    }, n = φ0 === φ1 ? Math.sin(φ0) : Math.log(cosφ0 / Math.cos(φ1)) / Math.log(t(φ1) / t(φ0)), F = cosφ0 * Math.pow(t(φ0), n) / n;
    if (!n) return d3_geo_mercator;
    function forward(λ, φ) {
      if (F > 0) {
        if (φ < -halfπ + ε) φ = -halfπ + ε;
      } else {
        if (φ > halfπ - ε) φ = halfπ - ε;
      }
      var ρ = F / Math.pow(t(φ), n);
      return [ ρ * Math.sin(n * λ), F - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = F - y, ρ = d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y);
      return [ Math.atan2(x, ρ0_y) / n, 2 * Math.atan(Math.pow(F / ρ, 1 / n)) - halfπ ];
    };
    return forward;
  }
  (d3.geo.conicConformal = function() {
    return d3_geo_conic(d3_geo_conicConformal);
  }).raw = d3_geo_conicConformal;
  function d3_geo_conicEquidistant(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), n = φ0 === φ1 ? Math.sin(φ0) : (cosφ0 - Math.cos(φ1)) / (φ1 - φ0), G = cosφ0 / n + φ0;
    if (abs(n) < ε) return d3_geo_equirectangular;
    function forward(λ, φ) {
      var ρ = G - φ;
      return [ ρ * Math.sin(n * λ), G - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = G - y;
      return [ Math.atan2(x, ρ0_y) / n, G - d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y) ];
    };
    return forward;
  }
  (d3.geo.conicEquidistant = function() {
    return d3_geo_conic(d3_geo_conicEquidistant);
  }).raw = d3_geo_conicEquidistant;
  var d3_geo_gnomonic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / cosλcosφ;
  }, Math.atan);
  (d3.geo.gnomonic = function() {
    return d3_geo_projection(d3_geo_gnomonic);
  }).raw = d3_geo_gnomonic;
  function d3_geo_mercator(λ, φ) {
    return [ λ, Math.log(Math.tan(π / 4 + φ / 2)) ];
  }
  d3_geo_mercator.invert = function(x, y) {
    return [ x, 2 * Math.atan(Math.exp(y)) - halfπ ];
  };
  function d3_geo_mercatorProjection(project) {
    var m = d3_geo_projection(project), scale = m.scale, translate = m.translate, clipExtent = m.clipExtent, clipAuto;
    m.scale = function() {
      var v = scale.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.translate = function() {
      var v = translate.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.clipExtent = function(_) {
      var v = clipExtent.apply(m, arguments);
      if (v === m) {
        if (clipAuto = _ == null) {
          var k = π * scale(), t = translate();
          clipExtent([ [ t[0] - k, t[1] - k ], [ t[0] + k, t[1] + k ] ]);
        }
      } else if (clipAuto) {
        v = null;
      }
      return v;
    };
    return m.clipExtent(null);
  }
  (d3.geo.mercator = function() {
    return d3_geo_mercatorProjection(d3_geo_mercator);
  }).raw = d3_geo_mercator;
  var d3_geo_orthographic = d3_geo_azimuthal(function() {
    return 1;
  }, Math.asin);
  (d3.geo.orthographic = function() {
    return d3_geo_projection(d3_geo_orthographic);
  }).raw = d3_geo_orthographic;
  var d3_geo_stereographic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / (1 + cosλcosφ);
  }, function(ρ) {
    return 2 * Math.atan(ρ);
  });
  (d3.geo.stereographic = function() {
    return d3_geo_projection(d3_geo_stereographic);
  }).raw = d3_geo_stereographic;
  function d3_geo_transverseMercator(λ, φ) {
    return [ Math.log(Math.tan(π / 4 + φ / 2)), -λ ];
  }
  d3_geo_transverseMercator.invert = function(x, y) {
    return [ -y, 2 * Math.atan(Math.exp(x)) - halfπ ];
  };
  (d3.geo.transverseMercator = function() {
    var projection = d3_geo_mercatorProjection(d3_geo_transverseMercator), center = projection.center, rotate = projection.rotate;
    projection.center = function(_) {
      return _ ? center([ -_[1], _[0] ]) : (_ = center(), [ -_[1], _[0] ]);
    };
    projection.rotate = function(_) {
      return _ ? rotate([ _[0], _[1], _.length > 2 ? _[2] + 90 : 90 ]) : (_ = rotate(), 
      [ _[0], _[1], _[2] - 90 ]);
    };
    return projection.rotate([ 0, 0 ]);
  }).raw = d3_geo_transverseMercator;
  d3.geom = {};
  function d3_geom_pointX(d) {
    return d[0];
  }
  function d3_geom_pointY(d) {
    return d[1];
  }
  d3.geom.hull = function(vertices) {
    var x = d3_geom_pointX, y = d3_geom_pointY;
    if (arguments.length) return hull(vertices);
    function hull(data) {
      if (data.length < 3) return [];
      var fx = d3_functor(x), fy = d3_functor(y), i, n = data.length, points = [], flippedPoints = [];
      for (i = 0; i < n; i++) {
        points.push([ +fx.call(this, data[i], i), +fy.call(this, data[i], i), i ]);
      }
      points.sort(d3_geom_hullOrder);
      for (i = 0; i < n; i++) flippedPoints.push([ points[i][0], -points[i][1] ]);
      var upper = d3_geom_hullUpper(points), lower = d3_geom_hullUpper(flippedPoints);
      var skipLeft = lower[0] === upper[0], skipRight = lower[lower.length - 1] === upper[upper.length - 1], polygon = [];
      for (i = upper.length - 1; i >= 0; --i) polygon.push(data[points[upper[i]][2]]);
      for (i = +skipLeft; i < lower.length - skipRight; ++i) polygon.push(data[points[lower[i]][2]]);
      return polygon;
    }
    hull.x = function(_) {
      return arguments.length ? (x = _, hull) : x;
    };
    hull.y = function(_) {
      return arguments.length ? (y = _, hull) : y;
    };
    return hull;
  };
  function d3_geom_hullUpper(points) {
    var n = points.length, hull = [ 0, 1 ], hs = 2;
    for (var i = 2; i < n; i++) {
      while (hs > 1 && d3_cross2d(points[hull[hs - 2]], points[hull[hs - 1]], points[i]) <= 0) --hs;
      hull[hs++] = i;
    }
    return hull.slice(0, hs);
  }
  function d3_geom_hullOrder(a, b) {
    return a[0] - b[0] || a[1] - b[1];
  }
  d3.geom.polygon = function(coordinates) {
    d3_subclass(coordinates, d3_geom_polygonPrototype);
    return coordinates;
  };
  var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];
  d3_geom_polygonPrototype.area = function() {
    var i = -1, n = this.length, a, b = this[n - 1], area = 0;
    while (++i < n) {
      a = b;
      b = this[i];
      area += a[1] * b[0] - a[0] * b[1];
    }
    return area * .5;
  };
  d3_geom_polygonPrototype.centroid = function(k) {
    var i = -1, n = this.length, x = 0, y = 0, a, b = this[n - 1], c;
    if (!arguments.length) k = -1 / (6 * this.area());
    while (++i < n) {
      a = b;
      b = this[i];
      c = a[0] * b[1] - b[0] * a[1];
      x += (a[0] + b[0]) * c;
      y += (a[1] + b[1]) * c;
    }
    return [ x * k, y * k ];
  };
  d3_geom_polygonPrototype.clip = function(subject) {
    var input, closed = d3_geom_polygonClosed(subject), i = -1, n = this.length - d3_geom_polygonClosed(this), j, m, a = this[n - 1], b, c, d;
    while (++i < n) {
      input = subject.slice();
      subject.length = 0;
      b = this[i];
      c = input[(m = input.length - closed) - 1];
      j = -1;
      while (++j < m) {
        d = input[j];
        if (d3_geom_polygonInside(d, a, b)) {
          if (!d3_geom_polygonInside(c, a, b)) {
            subject.push(d3_geom_polygonIntersect(c, d, a, b));
          }
          subject.push(d);
        } else if (d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        c = d;
      }
      if (closed) subject.push(subject[0]);
      a = b;
    }
    return subject;
  };
  function d3_geom_polygonInside(p, a, b) {
    return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
  }
  function d3_geom_polygonIntersect(c, d, a, b) {
    var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3, y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3, ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
    return [ x1 + ua * x21, y1 + ua * y21 ];
  }
  function d3_geom_polygonClosed(coordinates) {
    var a = coordinates[0], b = coordinates[coordinates.length - 1];
    return !(a[0] - b[0] || a[1] - b[1]);
  }
  var d3_geom_voronoiEdges, d3_geom_voronoiCells, d3_geom_voronoiBeaches, d3_geom_voronoiBeachPool = [], d3_geom_voronoiFirstCircle, d3_geom_voronoiCircles, d3_geom_voronoiCirclePool = [];
  function d3_geom_voronoiBeach() {
    d3_geom_voronoiRedBlackNode(this);
    this.edge = this.site = this.circle = null;
  }
  function d3_geom_voronoiCreateBeach(site) {
    var beach = d3_geom_voronoiBeachPool.pop() || new d3_geom_voronoiBeach();
    beach.site = site;
    return beach;
  }
  function d3_geom_voronoiDetachBeach(beach) {
    d3_geom_voronoiDetachCircle(beach);
    d3_geom_voronoiBeaches.remove(beach);
    d3_geom_voronoiBeachPool.push(beach);
    d3_geom_voronoiRedBlackNode(beach);
  }
  function d3_geom_voronoiRemoveBeach(beach) {
    var circle = beach.circle, x = circle.x, y = circle.cy, vertex = {
      x: x,
      y: y
    }, previous = beach.P, next = beach.N, disappearing = [ beach ];
    d3_geom_voronoiDetachBeach(beach);
    var lArc = previous;
    while (lArc.circle && abs(x - lArc.circle.x) < ε && abs(y - lArc.circle.cy) < ε) {
      previous = lArc.P;
      disappearing.unshift(lArc);
      d3_geom_voronoiDetachBeach(lArc);
      lArc = previous;
    }
    disappearing.unshift(lArc);
    d3_geom_voronoiDetachCircle(lArc);
    var rArc = next;
    while (rArc.circle && abs(x - rArc.circle.x) < ε && abs(y - rArc.circle.cy) < ε) {
      next = rArc.N;
      disappearing.push(rArc);
      d3_geom_voronoiDetachBeach(rArc);
      rArc = next;
    }
    disappearing.push(rArc);
    d3_geom_voronoiDetachCircle(rArc);
    var nArcs = disappearing.length, iArc;
    for (iArc = 1; iArc < nArcs; ++iArc) {
      rArc = disappearing[iArc];
      lArc = disappearing[iArc - 1];
      d3_geom_voronoiSetEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
    }
    lArc = disappearing[0];
    rArc = disappearing[nArcs - 1];
    rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, rArc.site, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiAddBeach(site) {
    var x = site.x, directrix = site.y, lArc, rArc, dxl, dxr, node = d3_geom_voronoiBeaches._;
    while (node) {
      dxl = d3_geom_voronoiLeftBreakPoint(node, directrix) - x;
      if (dxl > ε) node = node.L; else {
        dxr = x - d3_geom_voronoiRightBreakPoint(node, directrix);
        if (dxr > ε) {
          if (!node.R) {
            lArc = node;
            break;
          }
          node = node.R;
        } else {
          if (dxl > -ε) {
            lArc = node.P;
            rArc = node;
          } else if (dxr > -ε) {
            lArc = node;
            rArc = node.N;
          } else {
            lArc = rArc = node;
          }
          break;
        }
      }
    }
    var newArc = d3_geom_voronoiCreateBeach(site);
    d3_geom_voronoiBeaches.insert(lArc, newArc);
    if (!lArc && !rArc) return;
    if (lArc === rArc) {
      d3_geom_voronoiDetachCircle(lArc);
      rArc = d3_geom_voronoiCreateBeach(lArc.site);
      d3_geom_voronoiBeaches.insert(newArc, rArc);
      newArc.edge = rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      d3_geom_voronoiAttachCircle(lArc);
      d3_geom_voronoiAttachCircle(rArc);
      return;
    }
    if (!rArc) {
      newArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      return;
    }
    d3_geom_voronoiDetachCircle(lArc);
    d3_geom_voronoiDetachCircle(rArc);
    var lSite = lArc.site, ax = lSite.x, ay = lSite.y, bx = site.x - ax, by = site.y - ay, rSite = rArc.site, cx = rSite.x - ax, cy = rSite.y - ay, d = 2 * (bx * cy - by * cx), hb = bx * bx + by * by, hc = cx * cx + cy * cy, vertex = {
      x: (cy * hb - by * hc) / d + ax,
      y: (bx * hc - cx * hb) / d + ay
    };
    d3_geom_voronoiSetEdgeEnd(rArc.edge, lSite, rSite, vertex);
    newArc.edge = d3_geom_voronoiCreateEdge(lSite, site, null, vertex);
    rArc.edge = d3_geom_voronoiCreateEdge(site, rSite, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiLeftBreakPoint(arc, directrix) {
    var site = arc.site, rfocx = site.x, rfocy = site.y, pby2 = rfocy - directrix;
    if (!pby2) return rfocx;
    var lArc = arc.P;
    if (!lArc) return -Infinity;
    site = lArc.site;
    var lfocx = site.x, lfocy = site.y, plby2 = lfocy - directrix;
    if (!plby2) return lfocx;
    var hl = lfocx - rfocx, aby2 = 1 / pby2 - 1 / plby2, b = hl / plby2;
    if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
    return (rfocx + lfocx) / 2;
  }
  function d3_geom_voronoiRightBreakPoint(arc, directrix) {
    var rArc = arc.N;
    if (rArc) return d3_geom_voronoiLeftBreakPoint(rArc, directrix);
    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
  }
  function d3_geom_voronoiCell(site) {
    this.site = site;
    this.edges = [];
  }
  d3_geom_voronoiCell.prototype.prepare = function() {
    var halfEdges = this.edges, iHalfEdge = halfEdges.length, edge;
    while (iHalfEdge--) {
      edge = halfEdges[iHalfEdge].edge;
      if (!edge.b || !edge.a) halfEdges.splice(iHalfEdge, 1);
    }
    halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);
    return halfEdges.length;
  };
  function d3_geom_voronoiCloseCells(extent) {
    var x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], x2, y2, x3, y3, cells = d3_geom_voronoiCells, iCell = cells.length, cell, iHalfEdge, halfEdges, nHalfEdges, start, end;
    while (iCell--) {
      cell = cells[iCell];
      if (!cell || !cell.prepare()) continue;
      halfEdges = cell.edges;
      nHalfEdges = halfEdges.length;
      iHalfEdge = 0;
      while (iHalfEdge < nHalfEdges) {
        end = halfEdges[iHalfEdge].end(), x3 = end.x, y3 = end.y;
        start = halfEdges[++iHalfEdge % nHalfEdges].start(), x2 = start.x, y2 = start.y;
        if (abs(x3 - x2) > ε || abs(y3 - y2) > ε) {
          halfEdges.splice(iHalfEdge, 0, new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end, abs(x3 - x0) < ε && y1 - y3 > ε ? {
            x: x0,
            y: abs(x2 - x0) < ε ? y2 : y1
          } : abs(y3 - y1) < ε && x1 - x3 > ε ? {
            x: abs(y2 - y1) < ε ? x2 : x1,
            y: y1
          } : abs(x3 - x1) < ε && y3 - y0 > ε ? {
            x: x1,
            y: abs(x2 - x1) < ε ? y2 : y0
          } : abs(y3 - y0) < ε && x3 - x0 > ε ? {
            x: abs(y2 - y0) < ε ? x2 : x0,
            y: y0
          } : null), cell.site, null));
          ++nHalfEdges;
        }
      }
    }
  }
  function d3_geom_voronoiHalfEdgeOrder(a, b) {
    return b.angle - a.angle;
  }
  function d3_geom_voronoiCircle() {
    d3_geom_voronoiRedBlackNode(this);
    this.x = this.y = this.arc = this.site = this.cy = null;
  }
  function d3_geom_voronoiAttachCircle(arc) {
    var lArc = arc.P, rArc = arc.N;
    if (!lArc || !rArc) return;
    var lSite = lArc.site, cSite = arc.site, rSite = rArc.site;
    if (lSite === rSite) return;
    var bx = cSite.x, by = cSite.y, ax = lSite.x - bx, ay = lSite.y - by, cx = rSite.x - bx, cy = rSite.y - by;
    var d = 2 * (ax * cy - ay * cx);
    if (d >= -ε2) return;
    var ha = ax * ax + ay * ay, hc = cx * cx + cy * cy, x = (cy * ha - ay * hc) / d, y = (ax * hc - cx * ha) / d, cy = y + by;
    var circle = d3_geom_voronoiCirclePool.pop() || new d3_geom_voronoiCircle();
    circle.arc = arc;
    circle.site = cSite;
    circle.x = x + bx;
    circle.y = cy + Math.sqrt(x * x + y * y);
    circle.cy = cy;
    arc.circle = circle;
    var before = null, node = d3_geom_voronoiCircles._;
    while (node) {
      if (circle.y < node.y || circle.y === node.y && circle.x <= node.x) {
        if (node.L) node = node.L; else {
          before = node.P;
          break;
        }
      } else {
        if (node.R) node = node.R; else {
          before = node;
          break;
        }
      }
    }
    d3_geom_voronoiCircles.insert(before, circle);
    if (!before) d3_geom_voronoiFirstCircle = circle;
  }
  function d3_geom_voronoiDetachCircle(arc) {
    var circle = arc.circle;
    if (circle) {
      if (!circle.P) d3_geom_voronoiFirstCircle = circle.N;
      d3_geom_voronoiCircles.remove(circle);
      d3_geom_voronoiCirclePool.push(circle);
      d3_geom_voronoiRedBlackNode(circle);
      arc.circle = null;
    }
  }
  function d3_geom_voronoiClipEdges(extent) {
    var edges = d3_geom_voronoiEdges, clip = d3_geom_clipLine(extent[0][0], extent[0][1], extent[1][0], extent[1][1]), i = edges.length, e;
    while (i--) {
      e = edges[i];
      if (!d3_geom_voronoiConnectEdge(e, extent) || !clip(e) || abs(e.a.x - e.b.x) < ε && abs(e.a.y - e.b.y) < ε) {
        e.a = e.b = null;
        edges.splice(i, 1);
      }
    }
  }
  function d3_geom_voronoiConnectEdge(edge, extent) {
    var vb = edge.b;
    if (vb) return true;
    var va = edge.a, x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], lSite = edge.l, rSite = edge.r, lx = lSite.x, ly = lSite.y, rx = rSite.x, ry = rSite.y, fx = (lx + rx) / 2, fy = (ly + ry) / 2, fm, fb;
    if (ry === ly) {
      if (fx < x0 || fx >= x1) return;
      if (lx > rx) {
        if (!va) va = {
          x: fx,
          y: y0
        }; else if (va.y >= y1) return;
        vb = {
          x: fx,
          y: y1
        };
      } else {
        if (!va) va = {
          x: fx,
          y: y1
        }; else if (va.y < y0) return;
        vb = {
          x: fx,
          y: y0
        };
      }
    } else {
      fm = (lx - rx) / (ry - ly);
      fb = fy - fm * fx;
      if (fm < -1 || fm > 1) {
        if (lx > rx) {
          if (!va) va = {
            x: (y0 - fb) / fm,
            y: y0
          }; else if (va.y >= y1) return;
          vb = {
            x: (y1 - fb) / fm,
            y: y1
          };
        } else {
          if (!va) va = {
            x: (y1 - fb) / fm,
            y: y1
          }; else if (va.y < y0) return;
          vb = {
            x: (y0 - fb) / fm,
            y: y0
          };
        }
      } else {
        if (ly < ry) {
          if (!va) va = {
            x: x0,
            y: fm * x0 + fb
          }; else if (va.x >= x1) return;
          vb = {
            x: x1,
            y: fm * x1 + fb
          };
        } else {
          if (!va) va = {
            x: x1,
            y: fm * x1 + fb
          }; else if (va.x < x0) return;
          vb = {
            x: x0,
            y: fm * x0 + fb
          };
        }
      }
    }
    edge.a = va;
    edge.b = vb;
    return true;
  }
  function d3_geom_voronoiEdge(lSite, rSite) {
    this.l = lSite;
    this.r = rSite;
    this.a = this.b = null;
  }
  function d3_geom_voronoiCreateEdge(lSite, rSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, rSite);
    d3_geom_voronoiEdges.push(edge);
    if (va) d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, va);
    if (vb) d3_geom_voronoiSetEdgeEnd(edge, rSite, lSite, vb);
    d3_geom_voronoiCells[lSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, lSite, rSite));
    d3_geom_voronoiCells[rSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, rSite, lSite));
    return edge;
  }
  function d3_geom_voronoiCreateBorderEdge(lSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, null);
    edge.a = va;
    edge.b = vb;
    d3_geom_voronoiEdges.push(edge);
    return edge;
  }
  function d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, vertex) {
    if (!edge.a && !edge.b) {
      edge.a = vertex;
      edge.l = lSite;
      edge.r = rSite;
    } else if (edge.l === rSite) {
      edge.b = vertex;
    } else {
      edge.a = vertex;
    }
  }
  function d3_geom_voronoiHalfEdge(edge, lSite, rSite) {
    var va = edge.a, vb = edge.b;
    this.edge = edge;
    this.site = lSite;
    this.angle = rSite ? Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x) : edge.l === lSite ? Math.atan2(vb.x - va.x, va.y - vb.y) : Math.atan2(va.x - vb.x, vb.y - va.y);
  }
  d3_geom_voronoiHalfEdge.prototype = {
    start: function() {
      return this.edge.l === this.site ? this.edge.a : this.edge.b;
    },
    end: function() {
      return this.edge.l === this.site ? this.edge.b : this.edge.a;
    }
  };
  function d3_geom_voronoiRedBlackTree() {
    this._ = null;
  }
  function d3_geom_voronoiRedBlackNode(node) {
    node.U = node.C = node.L = node.R = node.P = node.N = null;
  }
  d3_geom_voronoiRedBlackTree.prototype = {
    insert: function(after, node) {
      var parent, grandpa, uncle;
      if (after) {
        node.P = after;
        node.N = after.N;
        if (after.N) after.N.P = node;
        after.N = node;
        if (after.R) {
          after = after.R;
          while (after.L) after = after.L;
          after.L = node;
        } else {
          after.R = node;
        }
        parent = after;
      } else if (this._) {
        after = d3_geom_voronoiRedBlackFirst(this._);
        node.P = null;
        node.N = after;
        after.P = after.L = node;
        parent = after;
      } else {
        node.P = node.N = null;
        this._ = node;
        parent = null;
      }
      node.L = node.R = null;
      node.U = parent;
      node.C = true;
      after = node;
      while (parent && parent.C) {
        grandpa = parent.U;
        if (parent === grandpa.L) {
          uncle = grandpa.R;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.R) {
              d3_geom_voronoiRedBlackRotateLeft(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, grandpa);
          }
        } else {
          uncle = grandpa.L;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.L) {
              d3_geom_voronoiRedBlackRotateRight(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, grandpa);
          }
        }
        parent = after.U;
      }
      this._.C = false;
    },
    remove: function(node) {
      if (node.N) node.N.P = node.P;
      if (node.P) node.P.N = node.N;
      node.N = node.P = null;
      var parent = node.U, sibling, left = node.L, right = node.R, next, red;
      if (!left) next = right; else if (!right) next = left; else next = d3_geom_voronoiRedBlackFirst(right);
      if (parent) {
        if (parent.L === node) parent.L = next; else parent.R = next;
      } else {
        this._ = next;
      }
      if (left && right) {
        red = next.C;
        next.C = node.C;
        next.L = left;
        left.U = next;
        if (next !== right) {
          parent = next.U;
          next.U = node.U;
          node = next.R;
          parent.L = node;
          next.R = right;
          right.U = next;
        } else {
          next.U = parent;
          parent = next;
          node = next.R;
        }
      } else {
        red = node.C;
        node = next;
      }
      if (node) node.U = parent;
      if (red) return;
      if (node && node.C) {
        node.C = false;
        return;
      }
      do {
        if (node === this._) break;
        if (node === parent.L) {
          sibling = parent.R;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            sibling = parent.R;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.R || !sibling.R.C) {
              sibling.L.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateRight(this, sibling);
              sibling = parent.R;
            }
            sibling.C = parent.C;
            parent.C = sibling.R.C = false;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            node = this._;
            break;
          }
        } else {
          sibling = parent.L;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            sibling = parent.L;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.L || !sibling.L.C) {
              sibling.R.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateLeft(this, sibling);
              sibling = parent.L;
            }
            sibling.C = parent.C;
            parent.C = sibling.L.C = false;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            node = this._;
            break;
          }
        }
        sibling.C = true;
        node = parent;
        parent = parent.U;
      } while (!node.C);
      if (node) node.C = false;
    }
  };
  function d3_geom_voronoiRedBlackRotateLeft(tree, node) {
    var p = node, q = node.R, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.R = q.L;
    if (p.R) p.R.U = p;
    q.L = p;
  }
  function d3_geom_voronoiRedBlackRotateRight(tree, node) {
    var p = node, q = node.L, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.L = q.R;
    if (p.L) p.L.U = p;
    q.R = p;
  }
  function d3_geom_voronoiRedBlackFirst(node) {
    while (node.L) node = node.L;
    return node;
  }
  function d3_geom_voronoi(sites, bbox) {
    var site = sites.sort(d3_geom_voronoiVertexOrder).pop(), x0, y0, circle;
    d3_geom_voronoiEdges = [];
    d3_geom_voronoiCells = new Array(sites.length);
    d3_geom_voronoiBeaches = new d3_geom_voronoiRedBlackTree();
    d3_geom_voronoiCircles = new d3_geom_voronoiRedBlackTree();
    while (true) {
      circle = d3_geom_voronoiFirstCircle;
      if (site && (!circle || site.y < circle.y || site.y === circle.y && site.x < circle.x)) {
        if (site.x !== x0 || site.y !== y0) {
          d3_geom_voronoiCells[site.i] = new d3_geom_voronoiCell(site);
          d3_geom_voronoiAddBeach(site);
          x0 = site.x, y0 = site.y;
        }
        site = sites.pop();
      } else if (circle) {
        d3_geom_voronoiRemoveBeach(circle.arc);
      } else {
        break;
      }
    }
    if (bbox) d3_geom_voronoiClipEdges(bbox), d3_geom_voronoiCloseCells(bbox);
    var diagram = {
      cells: d3_geom_voronoiCells,
      edges: d3_geom_voronoiEdges
    };
    d3_geom_voronoiBeaches = d3_geom_voronoiCircles = d3_geom_voronoiEdges = d3_geom_voronoiCells = null;
    return diagram;
  }
  function d3_geom_voronoiVertexOrder(a, b) {
    return b.y - a.y || b.x - a.x;
  }
  d3.geom.voronoi = function(points) {
    var x = d3_geom_pointX, y = d3_geom_pointY, fx = x, fy = y, clipExtent = d3_geom_voronoiClipExtent;
    if (points) return voronoi(points);
    function voronoi(data) {
      var polygons = new Array(data.length), x0 = clipExtent[0][0], y0 = clipExtent[0][1], x1 = clipExtent[1][0], y1 = clipExtent[1][1];
      d3_geom_voronoi(sites(data), clipExtent).cells.forEach(function(cell, i) {
        var edges = cell.edges, site = cell.site, polygon = polygons[i] = edges.length ? edges.map(function(e) {
          var s = e.start();
          return [ s.x, s.y ];
        }) : site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1 ? [ [ x0, y1 ], [ x1, y1 ], [ x1, y0 ], [ x0, y0 ] ] : [];
        polygon.point = data[i];
      });
      return polygons;
    }
    function sites(data) {
      return data.map(function(d, i) {
        return {
          x: Math.round(fx(d, i) / ε) * ε,
          y: Math.round(fy(d, i) / ε) * ε,
          i: i
        };
      });
    }
    voronoi.links = function(data) {
      return d3_geom_voronoi(sites(data)).edges.filter(function(edge) {
        return edge.l && edge.r;
      }).map(function(edge) {
        return {
          source: data[edge.l.i],
          target: data[edge.r.i]
        };
      });
    };
    voronoi.triangles = function(data) {
      var triangles = [];
      d3_geom_voronoi(sites(data)).cells.forEach(function(cell, i) {
        var site = cell.site, edges = cell.edges.sort(d3_geom_voronoiHalfEdgeOrder), j = -1, m = edges.length, e0, s0, e1 = edges[m - 1].edge, s1 = e1.l === site ? e1.r : e1.l;
        while (++j < m) {
          e0 = e1;
          s0 = s1;
          e1 = edges[j].edge;
          s1 = e1.l === site ? e1.r : e1.l;
          if (i < s0.i && i < s1.i && d3_geom_voronoiTriangleArea(site, s0, s1) < 0) {
            triangles.push([ data[i], data[s0.i], data[s1.i] ]);
          }
        }
      });
      return triangles;
    };
    voronoi.x = function(_) {
      return arguments.length ? (fx = d3_functor(x = _), voronoi) : x;
    };
    voronoi.y = function(_) {
      return arguments.length ? (fy = d3_functor(y = _), voronoi) : y;
    };
    voronoi.clipExtent = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent;
      clipExtent = _ == null ? d3_geom_voronoiClipExtent : _;
      return voronoi;
    };
    voronoi.size = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent && clipExtent[1];
      return voronoi.clipExtent(_ && [ [ 0, 0 ], _ ]);
    };
    return voronoi;
  };
  var d3_geom_voronoiClipExtent = [ [ -1e6, -1e6 ], [ 1e6, 1e6 ] ];
  function d3_geom_voronoiTriangleArea(a, b, c) {
    return (a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y);
  }
  d3.geom.delaunay = function(vertices) {
    return d3.geom.voronoi().triangles(vertices);
  };
  d3.geom.quadtree = function(points, x1, y1, x2, y2) {
    var x = d3_geom_pointX, y = d3_geom_pointY, compat;
    if (compat = arguments.length) {
      x = d3_geom_quadtreeCompatX;
      y = d3_geom_quadtreeCompatY;
      if (compat === 3) {
        y2 = y1;
        x2 = x1;
        y1 = x1 = 0;
      }
      return quadtree(points);
    }
    function quadtree(data) {
      var d, fx = d3_functor(x), fy = d3_functor(y), xs, ys, i, n, x1_, y1_, x2_, y2_;
      if (x1 != null) {
        x1_ = x1, y1_ = y1, x2_ = x2, y2_ = y2;
      } else {
        x2_ = y2_ = -(x1_ = y1_ = Infinity);
        xs = [], ys = [];
        n = data.length;
        if (compat) for (i = 0; i < n; ++i) {
          d = data[i];
          if (d.x < x1_) x1_ = d.x;
          if (d.y < y1_) y1_ = d.y;
          if (d.x > x2_) x2_ = d.x;
          if (d.y > y2_) y2_ = d.y;
          xs.push(d.x);
          ys.push(d.y);
        } else for (i = 0; i < n; ++i) {
          var x_ = +fx(d = data[i], i), y_ = +fy(d, i);
          if (x_ < x1_) x1_ = x_;
          if (y_ < y1_) y1_ = y_;
          if (x_ > x2_) x2_ = x_;
          if (y_ > y2_) y2_ = y_;
          xs.push(x_);
          ys.push(y_);
        }
      }
      var dx = x2_ - x1_, dy = y2_ - y1_;
      if (dx > dy) y2_ = y1_ + dx; else x2_ = x1_ + dy;
      function insert(n, d, x, y, x1, y1, x2, y2) {
        if (isNaN(x) || isNaN(y)) return;
        if (n.leaf) {
          var nx = n.x, ny = n.y;
          if (nx != null) {
            if (abs(nx - x) + abs(ny - y) < .01) {
              insertChild(n, d, x, y, x1, y1, x2, y2);
            } else {
              var nPoint = n.point;
              n.x = n.y = n.point = null;
              insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
              insertChild(n, d, x, y, x1, y1, x2, y2);
            }
          } else {
            n.x = x, n.y = y, n.point = d;
          }
        } else {
          insertChild(n, d, x, y, x1, y1, x2, y2);
        }
      }
      function insertChild(n, d, x, y, x1, y1, x2, y2) {
        var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, right = x >= sx, bottom = y >= sy, i = (bottom << 1) + right;
        n.leaf = false;
        n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());
        if (right) x1 = sx; else x2 = sx;
        if (bottom) y1 = sy; else y2 = sy;
        insert(n, d, x, y, x1, y1, x2, y2);
      }
      var root = d3_geom_quadtreeNode();
      root.add = function(d) {
        insert(root, d, +fx(d, ++i), +fy(d, i), x1_, y1_, x2_, y2_);
      };
      root.visit = function(f) {
        d3_geom_quadtreeVisit(f, root, x1_, y1_, x2_, y2_);
      };
      i = -1;
      if (x1 == null) {
        while (++i < n) {
          insert(root, data[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
        }
        --i;
      } else data.forEach(root.add);
      xs = ys = data = d = null;
      return root;
    }
    quadtree.x = function(_) {
      return arguments.length ? (x = _, quadtree) : x;
    };
    quadtree.y = function(_) {
      return arguments.length ? (y = _, quadtree) : y;
    };
    quadtree.extent = function(_) {
      if (!arguments.length) return x1 == null ? null : [ [ x1, y1 ], [ x2, y2 ] ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = +_[0][0], y1 = +_[0][1], x2 = +_[1][0], 
      y2 = +_[1][1];
      return quadtree;
    };
    quadtree.size = function(_) {
      if (!arguments.length) return x1 == null ? null : [ x2 - x1, y2 - y1 ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = y1 = 0, x2 = +_[0], y2 = +_[1];
      return quadtree;
    };
    return quadtree;
  };
  function d3_geom_quadtreeCompatX(d) {
    return d.x;
  }
  function d3_geom_quadtreeCompatY(d) {
    return d.y;
  }
  function d3_geom_quadtreeNode() {
    return {
      leaf: true,
      nodes: [],
      point: null,
      x: null,
      y: null
    };
  }
  function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
    if (!f(node, x1, y1, x2, y2)) {
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, children = node.nodes;
      if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
      if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
      if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
      if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
    }
  }
  d3.interpolateRgb = d3_interpolateRgb;
  function d3_interpolateRgb(a, b) {
    a = d3.rgb(a);
    b = d3.rgb(b);
    var ar = a.r, ag = a.g, ab = a.b, br = b.r - ar, bg = b.g - ag, bb = b.b - ab;
    return function(t) {
      return "#" + d3_rgb_hex(Math.round(ar + br * t)) + d3_rgb_hex(Math.round(ag + bg * t)) + d3_rgb_hex(Math.round(ab + bb * t));
    };
  }
  d3.interpolateObject = d3_interpolateObject;
  function d3_interpolateObject(a, b) {
    var i = {}, c = {}, k;
    for (k in a) {
      if (k in b) {
        i[k] = d3_interpolate(a[k], b[k]);
      } else {
        c[k] = a[k];
      }
    }
    for (k in b) {
      if (!(k in a)) {
        c[k] = b[k];
      }
    }
    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }
  d3.interpolateNumber = d3_interpolateNumber;
  function d3_interpolateNumber(a, b) {
    b -= a = +a;
    return function(t) {
      return a + b * t;
    };
  }
  d3.interpolateString = d3_interpolateString;
  function d3_interpolateString(a, b) {
    var m, i, j, s0 = 0, s1 = 0, s = [], q = [], n, o;
    a = a + "", b = b + "";
    d3_interpolate_number.lastIndex = 0;
    for (i = 0; m = d3_interpolate_number.exec(b); ++i) {
      if (m.index) s.push(b.substring(s0, s1 = m.index));
      q.push({
        i: s.length,
        x: m[0]
      });
      s.push(null);
      s0 = d3_interpolate_number.lastIndex;
    }
    if (s0 < b.length) s.push(b.substring(s0));
    for (i = 0, n = q.length; (m = d3_interpolate_number.exec(a)) && i < n; ++i) {
      o = q[i];
      if (o.x == m[0]) {
        if (o.i) {
          if (s[o.i + 1] == null) {
            s[o.i - 1] += o.x;
            s.splice(o.i, 1);
            for (j = i + 1; j < n; ++j) q[j].i--;
          } else {
            s[o.i - 1] += o.x + s[o.i + 1];
            s.splice(o.i, 2);
            for (j = i + 1; j < n; ++j) q[j].i -= 2;
          }
        } else {
          if (s[o.i + 1] == null) {
            s[o.i] = o.x;
          } else {
            s[o.i] = o.x + s[o.i + 1];
            s.splice(o.i + 1, 1);
            for (j = i + 1; j < n; ++j) q[j].i--;
          }
        }
        q.splice(i, 1);
        n--;
        i--;
      } else {
        o.x = d3_interpolateNumber(parseFloat(m[0]), parseFloat(o.x));
      }
    }
    while (i < n) {
      o = q.pop();
      if (s[o.i + 1] == null) {
        s[o.i] = o.x;
      } else {
        s[o.i] = o.x + s[o.i + 1];
        s.splice(o.i + 1, 1);
      }
      n--;
    }
    if (s.length === 1) {
      return s[0] == null ? (o = q[0].x, function(t) {
        return o(t) + "";
      }) : function() {
        return b;
      };
    }
    return function(t) {
      for (i = 0; i < n; ++i) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  }
  var d3_interpolate_number = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
  d3.interpolate = d3_interpolate;
  function d3_interpolate(a, b) {
    var i = d3.interpolators.length, f;
    while (--i >= 0 && !(f = d3.interpolators[i](a, b))) ;
    return f;
  }
  d3.interpolators = [ function(a, b) {
    var t = typeof b;
    return (t === "string" ? d3_rgb_names.has(b) || /^(#|rgb\(|hsl\()/.test(b) ? d3_interpolateRgb : d3_interpolateString : b instanceof d3_Color ? d3_interpolateRgb : Array.isArray(b) ? d3_interpolateArray : t === "object" && isNaN(b) ? d3_interpolateObject : d3_interpolateNumber)(a, b);
  } ];
  d3.interpolateArray = d3_interpolateArray;
  function d3_interpolateArray(a, b) {
    var x = [], c = [], na = a.length, nb = b.length, n0 = Math.min(a.length, b.length), i;
    for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
    for (;i < na; ++i) c[i] = a[i];
    for (;i < nb; ++i) c[i] = b[i];
    return function(t) {
      for (i = 0; i < n0; ++i) c[i] = x[i](t);
      return c;
    };
  }
  var d3_ease_default = function() {
    return d3_identity;
  };
  var d3_ease = d3.map({
    linear: d3_ease_default,
    poly: d3_ease_poly,
    quad: function() {
      return d3_ease_quad;
    },
    cubic: function() {
      return d3_ease_cubic;
    },
    sin: function() {
      return d3_ease_sin;
    },
    exp: function() {
      return d3_ease_exp;
    },
    circle: function() {
      return d3_ease_circle;
    },
    elastic: d3_ease_elastic,
    back: d3_ease_back,
    bounce: function() {
      return d3_ease_bounce;
    }
  });
  var d3_ease_mode = d3.map({
    "in": d3_identity,
    out: d3_ease_reverse,
    "in-out": d3_ease_reflect,
    "out-in": function(f) {
      return d3_ease_reflect(d3_ease_reverse(f));
    }
  });
  d3.ease = function(name) {
    var i = name.indexOf("-"), t = i >= 0 ? name.substring(0, i) : name, m = i >= 0 ? name.substring(i + 1) : "in";
    t = d3_ease.get(t) || d3_ease_default;
    m = d3_ease_mode.get(m) || d3_identity;
    return d3_ease_clamp(m(t.apply(null, d3_arraySlice.call(arguments, 1))));
  };
  function d3_ease_clamp(f) {
    return function(t) {
      return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
    };
  }
  function d3_ease_reverse(f) {
    return function(t) {
      return 1 - f(1 - t);
    };
  }
  function d3_ease_reflect(f) {
    return function(t) {
      return .5 * (t < .5 ? f(2 * t) : 2 - f(2 - 2 * t));
    };
  }
  function d3_ease_quad(t) {
    return t * t;
  }
  function d3_ease_cubic(t) {
    return t * t * t;
  }
  function d3_ease_cubicInOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var t2 = t * t, t3 = t2 * t;
    return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
  }
  function d3_ease_poly(e) {
    return function(t) {
      return Math.pow(t, e);
    };
  }
  function d3_ease_sin(t) {
    return 1 - Math.cos(t * halfπ);
  }
  function d3_ease_exp(t) {
    return Math.pow(2, 10 * (t - 1));
  }
  function d3_ease_circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  }
  function d3_ease_elastic(a, p) {
    var s;
    if (arguments.length < 2) p = .45;
    if (arguments.length) s = p / τ * Math.asin(1 / a); else a = 1, s = p / 4;
    return function(t) {
      return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * τ / p);
    };
  }
  function d3_ease_back(s) {
    if (!s) s = 1.70158;
    return function(t) {
      return t * t * ((s + 1) * t - s);
    };
  }
  function d3_ease_bounce(t) {
    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
  }
  d3.interpolateHcl = d3_interpolateHcl;
  function d3_interpolateHcl(a, b) {
    a = d3.hcl(a);
    b = d3.hcl(b);
    var ah = a.h, ac = a.c, al = a.l, bh = b.h - ah, bc = b.c - ac, bl = b.l - al;
    if (isNaN(bc)) bc = 0, ac = isNaN(ac) ? b.c : ac;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hcl_lab(ah + bh * t, ac + bc * t, al + bl * t) + "";
    };
  }
  d3.interpolateHsl = d3_interpolateHsl;
  function d3_interpolateHsl(a, b) {
    a = d3.hsl(a);
    b = d3.hsl(b);
    var ah = a.h, as = a.s, al = a.l, bh = b.h - ah, bs = b.s - as, bl = b.l - al;
    if (isNaN(bs)) bs = 0, as = isNaN(as) ? b.s : as;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hsl_rgb(ah + bh * t, as + bs * t, al + bl * t) + "";
    };
  }
  d3.interpolateLab = d3_interpolateLab;
  function d3_interpolateLab(a, b) {
    a = d3.lab(a);
    b = d3.lab(b);
    var al = a.l, aa = a.a, ab = a.b, bl = b.l - al, ba = b.a - aa, bb = b.b - ab;
    return function(t) {
      return d3_lab_rgb(al + bl * t, aa + ba * t, ab + bb * t) + "";
    };
  }
  d3.interpolateRound = d3_interpolateRound;
  function d3_interpolateRound(a, b) {
    b -= a;
    return function(t) {
      return Math.round(a + b * t);
    };
  }
  d3.transform = function(string) {
    var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
    return (d3.transform = function(string) {
      if (string != null) {
        g.setAttribute("transform", string);
        var t = g.transform.baseVal.consolidate();
      }
      return new d3_transform(t ? t.matrix : d3_transformIdentity);
    })(string);
  };
  function d3_transform(m) {
    var r0 = [ m.a, m.b ], r1 = [ m.c, m.d ], kx = d3_transformNormalize(r0), kz = d3_transformDot(r0, r1), ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
    if (r0[0] * r1[1] < r1[0] * r0[1]) {
      r0[0] *= -1;
      r0[1] *= -1;
      kx *= -1;
      kz *= -1;
    }
    this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
    this.translate = [ m.e, m.f ];
    this.scale = [ kx, ky ];
    this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
  }
  d3_transform.prototype.toString = function() {
    return "translate(" + this.translate + ")rotate(" + this.rotate + ")skewX(" + this.skew + ")scale(" + this.scale + ")";
  };
  function d3_transformDot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function d3_transformNormalize(a) {
    var k = Math.sqrt(d3_transformDot(a, a));
    if (k) {
      a[0] /= k;
      a[1] /= k;
    }
    return k;
  }
  function d3_transformCombine(a, b, k) {
    a[0] += k * b[0];
    a[1] += k * b[1];
    return a;
  }
  var d3_transformIdentity = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0
  };
  d3.interpolateTransform = d3_interpolateTransform;
  function d3_interpolateTransform(a, b) {
    var s = [], q = [], n, A = d3.transform(a), B = d3.transform(b), ta = A.translate, tb = B.translate, ra = A.rotate, rb = B.rotate, wa = A.skew, wb = B.skew, ka = A.scale, kb = B.scale;
    if (ta[0] != tb[0] || ta[1] != tb[1]) {
      s.push("translate(", null, ",", null, ")");
      q.push({
        i: 1,
        x: d3_interpolateNumber(ta[0], tb[0])
      }, {
        i: 3,
        x: d3_interpolateNumber(ta[1], tb[1])
      });
    } else if (tb[0] || tb[1]) {
      s.push("translate(" + tb + ")");
    } else {
      s.push("");
    }
    if (ra != rb) {
      if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360;
      q.push({
        i: s.push(s.pop() + "rotate(", null, ")") - 2,
        x: d3_interpolateNumber(ra, rb)
      });
    } else if (rb) {
      s.push(s.pop() + "rotate(" + rb + ")");
    }
    if (wa != wb) {
      q.push({
        i: s.push(s.pop() + "skewX(", null, ")") - 2,
        x: d3_interpolateNumber(wa, wb)
      });
    } else if (wb) {
      s.push(s.pop() + "skewX(" + wb + ")");
    }
    if (ka[0] != kb[0] || ka[1] != kb[1]) {
      n = s.push(s.pop() + "scale(", null, ",", null, ")");
      q.push({
        i: n - 4,
        x: d3_interpolateNumber(ka[0], kb[0])
      }, {
        i: n - 2,
        x: d3_interpolateNumber(ka[1], kb[1])
      });
    } else if (kb[0] != 1 || kb[1] != 1) {
      s.push(s.pop() + "scale(" + kb + ")");
    }
    n = q.length;
    return function(t) {
      var i = -1, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  }
  function d3_uninterpolateNumber(a, b) {
    b = b - (a = +a) ? 1 / (b - a) : 0;
    return function(x) {
      return (x - a) * b;
    };
  }
  function d3_uninterpolateClamp(a, b) {
    b = b - (a = +a) ? 1 / (b - a) : 0;
    return function(x) {
      return Math.max(0, Math.min(1, (x - a) * b));
    };
  }
  d3.layout = {};
  d3.layout.bundle = function() {
    return function(links) {
      var paths = [], i = -1, n = links.length;
      while (++i < n) paths.push(d3_layout_bundlePath(links[i]));
      return paths;
    };
  };
  function d3_layout_bundlePath(link) {
    var start = link.source, end = link.target, lca = d3_layout_bundleLeastCommonAncestor(start, end), points = [ start ];
    while (start !== lca) {
      start = start.parent;
      points.push(start);
    }
    var k = points.length;
    while (end !== lca) {
      points.splice(k, 0, end);
      end = end.parent;
    }
    return points;
  }
  function d3_layout_bundleAncestors(node) {
    var ancestors = [], parent = node.parent;
    while (parent != null) {
      ancestors.push(node);
      node = parent;
      parent = parent.parent;
    }
    ancestors.push(node);
    return ancestors;
  }
  function d3_layout_bundleLeastCommonAncestor(a, b) {
    if (a === b) return a;
    var aNodes = d3_layout_bundleAncestors(a), bNodes = d3_layout_bundleAncestors(b), aNode = aNodes.pop(), bNode = bNodes.pop(), sharedNode = null;
    while (aNode === bNode) {
      sharedNode = aNode;
      aNode = aNodes.pop();
      bNode = bNodes.pop();
    }
    return sharedNode;
  }
  d3.layout.chord = function() {
    var chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortSubgroups, sortChords;
    function relayout() {
      var subgroups = {}, groupSums = [], groupIndex = d3.range(n), subgroupIndex = [], k, x, x0, i, j;
      chords = [];
      groups = [];
      k = 0, i = -1;
      while (++i < n) {
        x = 0, j = -1;
        while (++j < n) {
          x += matrix[i][j];
        }
        groupSums.push(x);
        subgroupIndex.push(d3.range(n));
        k += x;
      }
      if (sortGroups) {
        groupIndex.sort(function(a, b) {
          return sortGroups(groupSums[a], groupSums[b]);
        });
      }
      if (sortSubgroups) {
        subgroupIndex.forEach(function(d, i) {
          d.sort(function(a, b) {
            return sortSubgroups(matrix[i][a], matrix[i][b]);
          });
        });
      }
      k = (τ - padding * n) / k;
      x = 0, i = -1;
      while (++i < n) {
        x0 = x, j = -1;
        while (++j < n) {
          var di = groupIndex[i], dj = subgroupIndex[di][j], v = matrix[di][dj], a0 = x, a1 = x += v * k;
          subgroups[di + "-" + dj] = {
            index: di,
            subindex: dj,
            startAngle: a0,
            endAngle: a1,
            value: v
          };
        }
        groups[di] = {
          index: di,
          startAngle: x0,
          endAngle: x,
          value: (x - x0) / k
        };
        x += padding;
      }
      i = -1;
      while (++i < n) {
        j = i - 1;
        while (++j < n) {
          var source = subgroups[i + "-" + j], target = subgroups[j + "-" + i];
          if (source.value || target.value) {
            chords.push(source.value < target.value ? {
              source: target,
              target: source
            } : {
              source: source,
              target: target
            });
          }
        }
      }
      if (sortChords) resort();
    }
    function resort() {
      chords.sort(function(a, b) {
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
      });
    }
    chord.matrix = function(x) {
      if (!arguments.length) return matrix;
      n = (matrix = x) && matrix.length;
      chords = groups = null;
      return chord;
    };
    chord.padding = function(x) {
      if (!arguments.length) return padding;
      padding = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroups = function(x) {
      if (!arguments.length) return sortGroups;
      sortGroups = x;
      chords = groups = null;
      return chord;
    };
    chord.sortSubgroups = function(x) {
      if (!arguments.length) return sortSubgroups;
      sortSubgroups = x;
      chords = null;
      return chord;
    };
    chord.sortChords = function(x) {
      if (!arguments.length) return sortChords;
      sortChords = x;
      if (chords) resort();
      return chord;
    };
    chord.chords = function() {
      if (!chords) relayout();
      return chords;
    };
    chord.groups = function() {
      if (!groups) relayout();
      return groups;
    };
    return chord;
  };
  d3.layout.force = function() {
    var force = {}, event = d3.dispatch("start", "tick", "end"), size = [ 1, 1 ], drag, alpha, friction = .9, linkDistance = d3_layout_forceLinkDistance, linkStrength = d3_layout_forceLinkStrength, charge = -30, chargeDistance2 = d3_layout_forceChargeDistance2, gravity = .1, theta2 = .64, nodes = [], links = [], distances, strengths, charges;
    function repulse(node) {
      return function(quad, x1, _, x2) {
        if (quad.point !== node) {
          var dx = quad.cx - node.x, dy = quad.cy - node.y, dw = x2 - x1, dn = dx * dx + dy * dy;
          if (dw * dw / theta2 < dn) {
            if (dn < chargeDistance2) {
              var k = quad.charge / dn;
              node.px -= dx * k;
              node.py -= dy * k;
            }
            return true;
          }
          if (quad.point && dn && dn < chargeDistance2) {
            var k = quad.pointCharge / dn;
            node.px -= dx * k;
            node.py -= dy * k;
          }
        }
        return !quad.charge;
      };
    }
    force.tick = function() {
      if ((alpha *= .99) < .005) {
        event.end({
          type: "end",
          alpha: alpha = 0
        });
        return true;
      }
      var n = nodes.length, m = links.length, q, i, o, s, t, l, k, x, y;
      for (i = 0; i < m; ++i) {
        o = links[i];
        s = o.source;
        t = o.target;
        x = t.x - s.x;
        y = t.y - s.y;
        if (l = x * x + y * y) {
          l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
          x *= l;
          y *= l;
          t.x -= x * (k = s.weight / (t.weight + s.weight));
          t.y -= y * k;
          s.x += x * (k = 1 - k);
          s.y += y * k;
        }
      }
      if (k = alpha * gravity) {
        x = size[0] / 2;
        y = size[1] / 2;
        i = -1;
        if (k) while (++i < n) {
          o = nodes[i];
          o.x += (x - o.x) * k;
          o.y += (y - o.y) * k;
        }
      }
      if (charge) {
        d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);
        i = -1;
        while (++i < n) {
          if (!(o = nodes[i]).fixed) {
            q.visit(repulse(o));
          }
        }
      }
      i = -1;
      while (++i < n) {
        o = nodes[i];
        if (o.fixed) {
          o.x = o.px;
          o.y = o.py;
        } else {
          o.x -= (o.px - (o.px = o.x)) * friction;
          o.y -= (o.py - (o.py = o.y)) * friction;
        }
      }
      event.tick({
        type: "tick",
        alpha: alpha
      });
    };
    force.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
      return force;
    };
    force.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return force;
    };
    force.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return force;
    };
    force.linkDistance = function(x) {
      if (!arguments.length) return linkDistance;
      linkDistance = typeof x === "function" ? x : +x;
      return force;
    };
    force.distance = force.linkDistance;
    force.linkStrength = function(x) {
      if (!arguments.length) return linkStrength;
      linkStrength = typeof x === "function" ? x : +x;
      return force;
    };
    force.friction = function(x) {
      if (!arguments.length) return friction;
      friction = +x;
      return force;
    };
    force.charge = function(x) {
      if (!arguments.length) return charge;
      charge = typeof x === "function" ? x : +x;
      return force;
    };
    force.chargeDistance = function(x) {
      if (!arguments.length) return Math.sqrt(chargeDistance2);
      chargeDistance2 = x * x;
      return force;
    };
    force.gravity = function(x) {
      if (!arguments.length) return gravity;
      gravity = +x;
      return force;
    };
    force.theta = function(x) {
      if (!arguments.length) return Math.sqrt(theta2);
      theta2 = x * x;
      return force;
    };
    force.alpha = function(x) {
      if (!arguments.length) return alpha;
      x = +x;
      if (alpha) {
        if (x > 0) alpha = x; else alpha = 0;
      } else if (x > 0) {
        event.start({
          type: "start",
          alpha: alpha = x
        });
        d3.timer(force.tick);
      }
      return force;
    };
    force.start = function() {
      var i, n = nodes.length, m = links.length, w = size[0], h = size[1], neighbors, o;
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
        o.weight = 0;
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
        if (typeof o.source == "number") o.source = nodes[o.source];
        if (typeof o.target == "number") o.target = nodes[o.target];
        ++o.source.weight;
        ++o.target.weight;
      }
      for (i = 0; i < n; ++i) {
        o = nodes[i];
        if (isNaN(o.x)) o.x = position("x", w);
        if (isNaN(o.y)) o.y = position("y", h);
        if (isNaN(o.px)) o.px = o.x;
        if (isNaN(o.py)) o.py = o.y;
      }
      distances = [];
      if (typeof linkDistance === "function") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i); else for (i = 0; i < m; ++i) distances[i] = linkDistance;
      strengths = [];
      if (typeof linkStrength === "function") for (i = 0; i < m; ++i) strengths[i] = +linkStrength.call(this, links[i], i); else for (i = 0; i < m; ++i) strengths[i] = linkStrength;
      charges = [];
      if (typeof charge === "function") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i); else for (i = 0; i < n; ++i) charges[i] = charge;
      function position(dimension, size) {
        if (!neighbors) {
          neighbors = new Array(n);
          for (j = 0; j < n; ++j) {
            neighbors[j] = [];
          }
          for (j = 0; j < m; ++j) {
            var o = links[j];
            neighbors[o.source.index].push(o.target);
            neighbors[o.target.index].push(o.source);
          }
        }
        var candidates = neighbors[i], j = -1, m = candidates.length, x;
        while (++j < m) if (!isNaN(x = candidates[j][dimension])) return x;
        return Math.random() * size;
      }
      return force.resume();
    };
    force.resume = function() {
      return force.alpha(.1);
    };
    force.stop = function() {
      return force.alpha(0);
    };
    force.drag = function() {
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on("dragstart.force", d3_layout_forceDragstart).on("drag.force", dragmove).on("dragend.force", d3_layout_forceDragend);
      if (!arguments.length) return drag;
      this.on("mouseover.force", d3_layout_forceMouseover).on("mouseout.force", d3_layout_forceMouseout).call(drag);
    };
    function dragmove(d) {
      d.px = d3.event.x, d.py = d3.event.y;
      force.resume();
    }
    return d3.rebind(force, event, "on");
  };
  function d3_layout_forceDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_forceDragend(d) {
    d.fixed &= ~6;
  }
  function d3_layout_forceMouseover(d) {
    d.fixed |= 4;
    d.px = d.x, d.py = d.y;
  }
  function d3_layout_forceMouseout(d) {
    d.fixed &= ~4;
  }
  function d3_layout_forceAccumulate(quad, alpha, charges) {
    var cx = 0, cy = 0;
    quad.charge = 0;
    if (!quad.leaf) {
      var nodes = quad.nodes, n = nodes.length, i = -1, c;
      while (++i < n) {
        c = nodes[i];
        if (c == null) continue;
        d3_layout_forceAccumulate(c, alpha, charges);
        quad.charge += c.charge;
        cx += c.charge * c.cx;
        cy += c.charge * c.cy;
      }
    }
    if (quad.point) {
      if (!quad.leaf) {
        quad.point.x += Math.random() - .5;
        quad.point.y += Math.random() - .5;
      }
      var k = alpha * charges[quad.point.index];
      quad.charge += quad.pointCharge = k;
      cx += k * quad.point.x;
      cy += k * quad.point.y;
    }
    quad.cx = cx / quad.charge;
    quad.cy = cy / quad.charge;
  }
  var d3_layout_forceLinkDistance = 20, d3_layout_forceLinkStrength = 1, d3_layout_forceChargeDistance2 = Infinity;
  d3.layout.hierarchy = function() {
    var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;
    function recurse(node, depth, nodes) {
      var childs = children.call(hierarchy, node, depth);
      node.depth = depth;
      nodes.push(node);
      if (childs && (n = childs.length)) {
        var i = -1, n, c = node.children = new Array(n), v = 0, j = depth + 1, d;
        while (++i < n) {
          d = c[i] = recurse(childs[i], j, nodes);
          d.parent = node;
          v += d.value;
        }
        if (sort) c.sort(sort);
        if (value) node.value = v;
      } else {
        delete node.children;
        if (value) {
          node.value = +value.call(hierarchy, node, depth) || 0;
        }
      }
      return node;
    }
    function revalue(node, depth) {
      var children = node.children, v = 0;
      if (children && (n = children.length)) {
        var i = -1, n, j = depth + 1;
        while (++i < n) v += revalue(children[i], j);
      } else if (value) {
        v = +value.call(hierarchy, node, depth) || 0;
      }
      if (value) node.value = v;
      return v;
    }
    function hierarchy(d) {
      var nodes = [];
      recurse(d, 0, nodes);
      return nodes;
    }
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
    hierarchy.revalue = function(root) {
      revalue(root, 0);
      return root;
    };
    return hierarchy;
  };
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, "sort", "children", "value");
    object.nodes = object;
    object.links = d3_layout_hierarchyLinks;
    return object;
  }
  function d3_layout_hierarchyChildren(d) {
    return d.children;
  }
  function d3_layout_hierarchyValue(d) {
    return d.value;
  }
  function d3_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {
          source: parent,
          target: child
        };
      });
    }));
  }
  d3.layout.partition = function() {
    var hierarchy = d3.layout.hierarchy(), size = [ 1, 1 ];
    function position(node, x, dx, dy) {
      var children = node.children;
      node.x = x;
      node.y = node.depth * dy;
      node.dx = dx;
      node.dy = dy;
      if (children && (n = children.length)) {
        var i = -1, n, c, d;
        dx = node.value ? dx / node.value : 0;
        while (++i < n) {
          position(c = children[i], x, d = c.value * dx, dy);
          x += d;
        }
      }
    }
    function depth(node) {
      var children = node.children, d = 0;
      if (children && (n = children.length)) {
        var i = -1, n;
        while (++i < n) d = Math.max(d, depth(children[i]));
      }
      return 1 + d;
    }
    function partition(d, i) {
      var nodes = hierarchy.call(this, d, i);
      position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
      return nodes;
    }
    partition.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return partition;
    };
    return d3_layout_hierarchyRebind(partition, hierarchy);
  };
  d3.layout.pie = function() {
    var value = Number, sort = d3_layout_pieSortByValue, startAngle = 0, endAngle = τ;
    function pie(data) {
      var values = data.map(function(d, i) {
        return +value.call(pie, d, i);
      });
      var a = +(typeof startAngle === "function" ? startAngle.apply(this, arguments) : startAngle);
      var k = ((typeof endAngle === "function" ? endAngle.apply(this, arguments) : endAngle) - a) / d3.sum(values);
      var index = d3.range(data.length);
      if (sort != null) index.sort(sort === d3_layout_pieSortByValue ? function(i, j) {
        return values[j] - values[i];
      } : function(i, j) {
        return sort(data[i], data[j]);
      });
      var arcs = [];
      index.forEach(function(i) {
        var d;
        arcs[i] = {
          data: data[i],
          value: d = values[i],
          startAngle: a,
          endAngle: a += d * k
        };
      });
      return arcs;
    }
    pie.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return pie;
    };
    pie.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return pie;
    };
    pie.startAngle = function(x) {
      if (!arguments.length) return startAngle;
      startAngle = x;
      return pie;
    };
    pie.endAngle = function(x) {
      if (!arguments.length) return endAngle;
      endAngle = x;
      return pie;
    };
    return pie;
  };
  var d3_layout_pieSortByValue = {};
  d3.layout.stack = function() {
    var values = d3_identity, order = d3_layout_stackOrderDefault, offset = d3_layout_stackOffsetZero, out = d3_layout_stackOut, x = d3_layout_stackX, y = d3_layout_stackY;
    function stack(data, index) {
      var series = data.map(function(d, i) {
        return values.call(stack, d, i);
      });
      var points = series.map(function(d) {
        return d.map(function(v, i) {
          return [ x.call(stack, v, i), y.call(stack, v, i) ];
        });
      });
      var orders = order.call(stack, points, index);
      series = d3.permute(series, orders);
      points = d3.permute(points, orders);
      var offsets = offset.call(stack, points, index);
      var n = series.length, m = series[0].length, i, j, o;
      for (j = 0; j < m; ++j) {
        out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);
        for (i = 1; i < n; ++i) {
          out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
        }
      }
      return data;
    }
    stack.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return stack;
    };
    stack.order = function(x) {
      if (!arguments.length) return order;
      order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
      return stack;
    };
    stack.offset = function(x) {
      if (!arguments.length) return offset;
      offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
      return stack;
    };
    stack.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return stack;
    };
    stack.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return stack;
    };
    stack.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return stack;
    };
    return stack;
  };
  function d3_layout_stackX(d) {
    return d.x;
  }
  function d3_layout_stackY(d) {
    return d.y;
  }
  function d3_layout_stackOut(d, y0, y) {
    d.y0 = y0;
    d.y = y;
  }
  var d3_layout_stackOrders = d3.map({
    "inside-out": function(data) {
      var n = data.length, i, j, max = data.map(d3_layout_stackMaxIndex), sums = data.map(d3_layout_stackReduceSum), index = d3.range(n).sort(function(a, b) {
        return max[a] - max[b];
      }), top = 0, bottom = 0, tops = [], bottoms = [];
      for (i = 0; i < n; ++i) {
        j = index[i];
        if (top < bottom) {
          top += sums[j];
          tops.push(j);
        } else {
          bottom += sums[j];
          bottoms.push(j);
        }
      }
      return bottoms.reverse().concat(tops);
    },
    reverse: function(data) {
      return d3.range(data.length).reverse();
    },
    "default": d3_layout_stackOrderDefault
  });
  var d3_layout_stackOffsets = d3.map({
    silhouette: function(data) {
      var n = data.length, m = data[0].length, sums = [], max = 0, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o > max) max = o;
        sums.push(o);
      }
      for (j = 0; j < m; ++j) {
        y0[j] = (max - sums[j]) / 2;
      }
      return y0;
    },
    wiggle: function(data) {
      var n = data.length, x = data[0], m = x.length, i, j, k, s1, s2, s3, dx, o, o0, y0 = [];
      y0[0] = o = o0 = 0;
      for (j = 1; j < m; ++j) {
        for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];
        for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {
          for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {
            s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;
          }
          s2 += s3 * data[i][j][1];
        }
        y0[j] = o -= s1 ? s2 / s1 * dx : 0;
        if (o < o0) o0 = o;
      }
      for (j = 0; j < m; ++j) y0[j] -= o0;
      return y0;
    },
    expand: function(data) {
      var n = data.length, m = data[0].length, k = 1 / n, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;
      }
      for (j = 0; j < m; ++j) y0[j] = 0;
      return y0;
    },
    zero: d3_layout_stackOffsetZero
  });
  function d3_layout_stackOrderDefault(data) {
    return d3.range(data.length);
  }
  function d3_layout_stackOffsetZero(data) {
    var j = -1, m = data[0].length, y0 = [];
    while (++j < m) y0[j] = 0;
    return y0;
  }
  function d3_layout_stackMaxIndex(array) {
    var i = 1, j = 0, v = array[0][1], k, n = array.length;
    for (;i < n; ++i) {
      if ((k = array[i][1]) > v) {
        j = i;
        v = k;
      }
    }
    return j;
  }
  function d3_layout_stackReduceSum(d) {
    return d.reduce(d3_layout_stackSum, 0);
  }
  function d3_layout_stackSum(p, d) {
    return p + d[1];
  }
  d3.layout.histogram = function() {
    var frequency = true, valuer = Number, ranger = d3_layout_histogramRange, binner = d3_layout_histogramBinSturges;
    function histogram(data, i) {
      var bins = [], values = data.map(valuer, this), range = ranger.call(this, values, i), thresholds = binner.call(this, range, values, i), bin, i = -1, n = values.length, m = thresholds.length - 1, k = frequency ? 1 : 1 / n, x;
      while (++i < m) {
        bin = bins[i] = [];
        bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
        bin.y = 0;
      }
      if (m > 0) {
        i = -1;
        while (++i < n) {
          x = values[i];
          if (x >= range[0] && x <= range[1]) {
            bin = bins[d3.bisect(thresholds, x, 1, m) - 1];
            bin.y += k;
            bin.push(data[i]);
          }
        }
      }
      return bins;
    }
    histogram.value = function(x) {
      if (!arguments.length) return valuer;
      valuer = x;
      return histogram;
    };
    histogram.range = function(x) {
      if (!arguments.length) return ranger;
      ranger = d3_functor(x);
      return histogram;
    };
    histogram.bins = function(x) {
      if (!arguments.length) return binner;
      binner = typeof x === "number" ? function(range) {
        return d3_layout_histogramBinFixed(range, x);
      } : d3_functor(x);
      return histogram;
    };
    histogram.frequency = function(x) {
      if (!arguments.length) return frequency;
      frequency = !!x;
      return histogram;
    };
    return histogram;
  };
  function d3_layout_histogramBinSturges(range, values) {
    return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
  }
  function d3_layout_histogramBinFixed(range, n) {
    var x = -1, b = +range[0], m = (range[1] - b) / n, f = [];
    while (++x <= n) f[x] = m * x + b;
    return f;
  }
  function d3_layout_histogramRange(values) {
    return [ d3.min(values), d3.max(values) ];
  }
  d3.layout.tree = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;
    function tree(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0];
      function firstWalk(node, previousSibling) {
        var children = node.children, layout = node._tree;
        if (children && (n = children.length)) {
          var n, firstChild = children[0], previousChild, ancestor = firstChild, child, i = -1;
          while (++i < n) {
            child = children[i];
            firstWalk(child, previousChild);
            ancestor = apportion(child, previousChild, ancestor);
            previousChild = child;
          }
          d3_layout_treeShift(node);
          var midpoint = .5 * (firstChild._tree.prelim + child._tree.prelim);
          if (previousSibling) {
            layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
            layout.mod = layout.prelim - midpoint;
          } else {
            layout.prelim = midpoint;
          }
        } else {
          if (previousSibling) {
            layout.prelim = previousSibling._tree.prelim + separation(node, previousSibling);
          }
        }
      }
      function secondWalk(node, x) {
        node.x = node._tree.prelim + x;
        var children = node.children;
        if (children && (n = children.length)) {
          var i = -1, n;
          x += node._tree.mod;
          while (++i < n) {
            secondWalk(children[i], x);
          }
        }
      }
      function apportion(node, previousSibling, ancestor) {
        if (previousSibling) {
          var vip = node, vop = node, vim = previousSibling, vom = node.parent.children[0], sip = vip._tree.mod, sop = vop._tree.mod, sim = vim._tree.mod, som = vom._tree.mod, shift;
          while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
            vom = d3_layout_treeLeft(vom);
            vop = d3_layout_treeRight(vop);
            vop._tree.ancestor = node;
            shift = vim._tree.prelim + sim - vip._tree.prelim - sip + separation(vim, vip);
            if (shift > 0) {
              d3_layout_treeMove(d3_layout_treeAncestor(vim, node, ancestor), node, shift);
              sip += shift;
              sop += shift;
            }
            sim += vim._tree.mod;
            sip += vip._tree.mod;
            som += vom._tree.mod;
            sop += vop._tree.mod;
          }
          if (vim && !d3_layout_treeRight(vop)) {
            vop._tree.thread = vim;
            vop._tree.mod += sim - sop;
          }
          if (vip && !d3_layout_treeLeft(vom)) {
            vom._tree.thread = vip;
            vom._tree.mod += sip - som;
            ancestor = node;
          }
        }
        return ancestor;
      }
      d3_layout_treeVisitAfter(root, function(node, previousSibling) {
        node._tree = {
          ancestor: node,
          prelim: 0,
          mod: 0,
          change: 0,
          shift: 0,
          number: previousSibling ? previousSibling._tree.number + 1 : 0
        };
      });
      firstWalk(root);
      secondWalk(root, -root._tree.prelim);
      var left = d3_layout_treeSearch(root, d3_layout_treeLeftmost), right = d3_layout_treeSearch(root, d3_layout_treeRightmost), deep = d3_layout_treeSearch(root, d3_layout_treeDeepest), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2, y1 = deep.depth || 1;
      d3_layout_treeVisitAfter(root, nodeSize ? function(node) {
        node.x *= size[0];
        node.y = node.depth * size[1];
        delete node._tree;
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = node.depth / y1 * size[1];
        delete node._tree;
      });
      return nodes;
    }
    tree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return tree;
    };
    tree.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null;
      return tree;
    };
    tree.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) != null;
      return tree;
    };
    return d3_layout_hierarchyRebind(tree, hierarchy);
  };
  function d3_layout_treeSeparation(a, b) {
    return a.parent == b.parent ? 1 : 2;
  }
  function d3_layout_treeLeft(node) {
    var children = node.children;
    return children && children.length ? children[0] : node._tree.thread;
  }
  function d3_layout_treeRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? children[n - 1] : node._tree.thread;
  }
  function d3_layout_treeSearch(node, compare) {
    var children = node.children;
    if (children && (n = children.length)) {
      var child, n, i = -1;
      while (++i < n) {
        if (compare(child = d3_layout_treeSearch(children[i], compare), node) > 0) {
          node = child;
        }
      }
    }
    return node;
  }
  function d3_layout_treeRightmost(a, b) {
    return a.x - b.x;
  }
  function d3_layout_treeLeftmost(a, b) {
    return b.x - a.x;
  }
  function d3_layout_treeDeepest(a, b) {
    return a.depth - b.depth;
  }
  function d3_layout_treeVisitAfter(node, callback) {
    function visit(node, previousSibling) {
      var children = node.children;
      if (children && (n = children.length)) {
        var child, previousChild = null, i = -1, n;
        while (++i < n) {
          child = children[i];
          visit(child, previousChild);
          previousChild = child;
        }
      }
      callback(node, previousSibling);
    }
    visit(node, null);
  }
  function d3_layout_treeShift(node) {
    var shift = 0, change = 0, children = node.children, i = children.length, child;
    while (--i >= 0) {
      child = children[i]._tree;
      child.prelim += shift;
      child.mod += shift;
      shift += child.shift + (change += child.change);
    }
  }
  function d3_layout_treeMove(ancestor, node, shift) {
    ancestor = ancestor._tree;
    node = node._tree;
    var change = shift / (node.number - ancestor.number);
    ancestor.change += change;
    node.change -= change;
    node.shift += shift;
    node.prelim += shift;
    node.mod += shift;
  }
  function d3_layout_treeAncestor(vim, node, ancestor) {
    return vim._tree.ancestor.parent == node.parent ? vim._tree.ancestor : ancestor;
  }
  d3.layout.pack = function() {
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort), padding = 0, size = [ 1, 1 ], radius;
    function pack(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], w = size[0], h = size[1], r = radius == null ? Math.sqrt : typeof radius === "function" ? radius : function() {
        return radius;
      };
      root.x = root.y = 0;
      d3_layout_treeVisitAfter(root, function(d) {
        d.r = +r(d.value);
      });
      d3_layout_treeVisitAfter(root, d3_layout_packSiblings);
      if (padding) {
        var dr = padding * (radius ? 1 : Math.max(2 * root.r / w, 2 * root.r / h)) / 2;
        d3_layout_treeVisitAfter(root, function(d) {
          d.r += dr;
        });
        d3_layout_treeVisitAfter(root, d3_layout_packSiblings);
        d3_layout_treeVisitAfter(root, function(d) {
          d.r -= dr;
        });
      }
      d3_layout_packTransform(root, w / 2, h / 2, radius ? 1 : 1 / Math.max(2 * root.r / w, 2 * root.r / h));
      return nodes;
    }
    pack.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return pack;
    };
    pack.radius = function(_) {
      if (!arguments.length) return radius;
      radius = _ == null || typeof _ === "function" ? _ : +_;
      return pack;
    };
    pack.padding = function(_) {
      if (!arguments.length) return padding;
      padding = +_;
      return pack;
    };
    return d3_layout_hierarchyRebind(pack, hierarchy);
  };
  function d3_layout_packSort(a, b) {
    return a.value - b.value;
  }
  function d3_layout_packInsert(a, b) {
    var c = a._pack_next;
    a._pack_next = b;
    b._pack_prev = a;
    b._pack_next = c;
    c._pack_prev = b;
  }
  function d3_layout_packSplice(a, b) {
    a._pack_next = b;
    b._pack_prev = a;
  }
  function d3_layout_packIntersects(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, dr = a.r + b.r;
    return .999 * dr * dr > dx * dx + dy * dy;
  }
  function d3_layout_packSiblings(node) {
    if (!(nodes = node.children) || !(n = nodes.length)) return;
    var nodes, xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, a, b, c, i, j, k, n;
    function bound(node) {
      xMin = Math.min(node.x - node.r, xMin);
      xMax = Math.max(node.x + node.r, xMax);
      yMin = Math.min(node.y - node.r, yMin);
      yMax = Math.max(node.y + node.r, yMax);
    }
    nodes.forEach(d3_layout_packLink);
    a = nodes[0];
    a.x = -a.r;
    a.y = 0;
    bound(a);
    if (n > 1) {
      b = nodes[1];
      b.x = b.r;
      b.y = 0;
      bound(b);
      if (n > 2) {
        c = nodes[2];
        d3_layout_packPlace(a, b, c);
        bound(c);
        d3_layout_packInsert(a, c);
        a._pack_prev = c;
        d3_layout_packInsert(c, b);
        b = a._pack_next;
        for (i = 3; i < n; i++) {
          d3_layout_packPlace(a, b, c = nodes[i]);
          var isect = 0, s1 = 1, s2 = 1;
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
            if (d3_layout_packIntersects(j, c)) {
              isect = 1;
              break;
            }
          }
          if (isect == 1) {
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
              if (d3_layout_packIntersects(k, c)) {
                break;
              }
            }
          }
          if (isect) {
            if (s1 < s2 || s1 == s2 && b.r < a.r) d3_layout_packSplice(a, b = j); else d3_layout_packSplice(a = k, b);
            i--;
          } else {
            d3_layout_packInsert(a, c);
            b = c;
            bound(c);
          }
        }
      }
    }
    var cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, cr = 0;
    for (i = 0; i < n; i++) {
      c = nodes[i];
      c.x -= cx;
      c.y -= cy;
      cr = Math.max(cr, c.r + Math.sqrt(c.x * c.x + c.y * c.y));
    }
    node.r = cr;
    nodes.forEach(d3_layout_packUnlink);
  }
  function d3_layout_packLink(node) {
    node._pack_next = node._pack_prev = node;
  }
  function d3_layout_packUnlink(node) {
    delete node._pack_next;
    delete node._pack_prev;
  }
  function d3_layout_packTransform(node, x, y, k) {
    var children = node.children;
    node.x = x += k * node.x;
    node.y = y += k * node.y;
    node.r *= k;
    if (children) {
      var i = -1, n = children.length;
      while (++i < n) d3_layout_packTransform(children[i], x, y, k);
    }
  }
  function d3_layout_packPlace(a, b, c) {
    var db = a.r + c.r, dx = b.x - a.x, dy = b.y - a.y;
    if (db && (dx || dy)) {
      var da = b.r + c.r, dc = dx * dx + dy * dy;
      da *= da;
      db *= db;
      var x = .5 + (db - da) / (2 * dc), y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
      c.x = a.x + x * dx + y * dy;
      c.y = a.y + x * dy - y * dx;
    } else {
      c.x = a.x + db;
      c.y = a.y;
    }
  }
  d3.layout.cluster = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;
    function cluster(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], previousNode, x = 0;
      d3_layout_treeVisitAfter(root, function(node) {
        var children = node.children;
        if (children && children.length) {
          node.x = d3_layout_clusterX(children);
          node.y = d3_layout_clusterY(children);
        } else {
          node.x = previousNode ? x += separation(node, previousNode) : 0;
          node.y = 0;
          previousNode = node;
        }
      });
      var left = d3_layout_clusterLeft(root), right = d3_layout_clusterRight(root), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2;
      d3_layout_treeVisitAfter(root, nodeSize ? function(node) {
        node.x = (node.x - root.x) * size[0];
        node.y = (root.y - node.y) * size[1];
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = (1 - (root.y ? node.y / root.y : 1)) * size[1];
      });
      return nodes;
    }
    cluster.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return cluster;
    };
    cluster.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null;
      return cluster;
    };
    cluster.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) != null;
      return cluster;
    };
    return d3_layout_hierarchyRebind(cluster, hierarchy);
  };
  function d3_layout_clusterY(children) {
    return 1 + d3.max(children, function(child) {
      return child.y;
    });
  }
  function d3_layout_clusterX(children) {
    return children.reduce(function(x, child) {
      return x + child.x;
    }, 0) / children.length;
  }
  function d3_layout_clusterLeft(node) {
    var children = node.children;
    return children && children.length ? d3_layout_clusterLeft(children[0]) : node;
  }
  function d3_layout_clusterRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;
  }
  d3.layout.treemap = function() {
    var hierarchy = d3.layout.hierarchy(), round = Math.round, size = [ 1, 1 ], padding = null, pad = d3_layout_treemapPadNull, sticky = false, stickies, mode = "squarify", ratio = .5 * (1 + Math.sqrt(5));
    function scale(children, k) {
      var i = -1, n = children.length, child, area;
      while (++i < n) {
        area = (child = children[i]).value * (k < 0 ? 0 : k);
        child.area = isNaN(area) || area <= 0 ? 0 : area;
      }
    }
    function squarify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), row = [], remaining = children.slice(), child, best = Infinity, score, u = mode === "slice" ? rect.dx : mode === "dice" ? rect.dy : mode === "slice-dice" ? node.depth & 1 ? rect.dy : rect.dx : Math.min(rect.dx, rect.dy), n;
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while ((n = remaining.length) > 0) {
          row.push(child = remaining[n - 1]);
          row.area += child.area;
          if (mode !== "squarify" || (score = worst(row, u)) <= best) {
            remaining.pop();
            best = score;
          } else {
            row.area -= row.pop().area;
            position(row, u, rect, false);
            u = Math.min(rect.dx, rect.dy);
            row.length = row.area = 0;
            best = Infinity;
          }
        }
        if (row.length) {
          position(row, u, rect, true);
          row.length = row.area = 0;
        }
        children.forEach(squarify);
      }
    }
    function stickify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), remaining = children.slice(), child, row = [];
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while (child = remaining.pop()) {
          row.push(child);
          row.area += child.area;
          if (child.z != null) {
            position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
            row.length = row.area = 0;
          }
        }
        children.forEach(stickify);
      }
    }
    function worst(row, u) {
      var s = row.area, r, rmax = 0, rmin = Infinity, i = -1, n = row.length;
      while (++i < n) {
        if (!(r = row[i].area)) continue;
        if (r < rmin) rmin = r;
        if (r > rmax) rmax = r;
      }
      s *= s;
      u *= u;
      return s ? Math.max(u * rmax * ratio / s, s / (u * rmin * ratio)) : Infinity;
    }
    function position(row, u, rect, flush) {
      var i = -1, n = row.length, x = rect.x, y = rect.y, v = u ? round(row.area / u) : 0, o;
      if (u == rect.dx) {
        if (flush || v > rect.dy) v = rect.dy;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dy = v;
          x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);
        }
        o.z = true;
        o.dx += rect.x + rect.dx - x;
        rect.y += v;
        rect.dy -= v;
      } else {
        if (flush || v > rect.dx) v = rect.dx;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dx = v;
          y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);
        }
        o.z = false;
        o.dy += rect.y + rect.dy - y;
        rect.x += v;
        rect.dx -= v;
      }
    }
    function treemap(d) {
      var nodes = stickies || hierarchy(d), root = nodes[0];
      root.x = 0;
      root.y = 0;
      root.dx = size[0];
      root.dy = size[1];
      if (stickies) hierarchy.revalue(root);
      scale([ root ], root.dx * root.dy / root.value);
      (stickies ? stickify : squarify)(root);
      if (sticky) stickies = nodes;
      return nodes;
    }
    treemap.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return treemap;
    };
    treemap.padding = function(x) {
      if (!arguments.length) return padding;
      function padFunction(node) {
        var p = x.call(treemap, node, node.depth);
        return p == null ? d3_layout_treemapPadNull(node) : d3_layout_treemapPad(node, typeof p === "number" ? [ p, p, p, p ] : p);
      }
      function padConstant(node) {
        return d3_layout_treemapPad(node, x);
      }
      var type;
      pad = (padding = x) == null ? d3_layout_treemapPadNull : (type = typeof x) === "function" ? padFunction : type === "number" ? (x = [ x, x, x, x ], 
      padConstant) : padConstant;
      return treemap;
    };
    treemap.round = function(x) {
      if (!arguments.length) return round != Number;
      round = x ? Math.round : Number;
      return treemap;
    };
    treemap.sticky = function(x) {
      if (!arguments.length) return sticky;
      sticky = x;
      stickies = null;
      return treemap;
    };
    treemap.ratio = function(x) {
      if (!arguments.length) return ratio;
      ratio = x;
      return treemap;
    };
    treemap.mode = function(x) {
      if (!arguments.length) return mode;
      mode = x + "";
      return treemap;
    };
    return d3_layout_hierarchyRebind(treemap, hierarchy);
  };
  function d3_layout_treemapPadNull(node) {
    return {
      x: node.x,
      y: node.y,
      dx: node.dx,
      dy: node.dy
    };
  }
  function d3_layout_treemapPad(node, padding) {
    var x = node.x + padding[3], y = node.y + padding[0], dx = node.dx - padding[1] - padding[3], dy = node.dy - padding[0] - padding[2];
    if (dx < 0) {
      x += dx / 2;
      dx = 0;
    }
    if (dy < 0) {
      y += dy / 2;
      dy = 0;
    }
    return {
      x: x,
      y: y,
      dx: dx,
      dy: dy
    };
  }
  d3.random = {
    normal: function(µ, σ) {
      var n = arguments.length;
      if (n < 2) σ = 1;
      if (n < 1) µ = 0;
      return function() {
        var x, y, r;
        do {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          r = x * x + y * y;
        } while (!r || r > 1);
        return µ + σ * x * Math.sqrt(-2 * Math.log(r) / r);
      };
    },
    logNormal: function() {
      var random = d3.random.normal.apply(d3, arguments);
      return function() {
        return Math.exp(random());
      };
    },
    bates: function(m) {
      var random = d3.random.irwinHall(m);
      return function() {
        return random() / m;
      };
    },
    irwinHall: function(m) {
      return function() {
        for (var s = 0, j = 0; j < m; j++) s += Math.random();
        return s;
      };
    }
  };
  d3.scale = {};
  function d3_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }
  function d3_scaleRange(scale) {
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
  }
  function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
    var u = uninterpolate(domain[0], domain[1]), i = interpolate(range[0], range[1]);
    return function(x) {
      return i(u(x));
    };
  }
  function d3_scale_nice(domain, nice) {
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], dx;
    if (x1 < x0) {
      dx = i0, i0 = i1, i1 = dx;
      dx = x0, x0 = x1, x1 = dx;
    }
    domain[i0] = nice.floor(x0);
    domain[i1] = nice.ceil(x1);
    return domain;
  }
  function d3_scale_niceStep(step) {
    return step ? {
      floor: function(x) {
        return Math.floor(x / step) * step;
      },
      ceil: function(x) {
        return Math.ceil(x / step) * step;
      }
    } : d3_scale_niceIdentity;
  }
  var d3_scale_niceIdentity = {
    floor: d3_identity,
    ceil: d3_identity
  };
  function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
    var u = [], i = [], j = 0, k = Math.min(domain.length, range.length) - 1;
    if (domain[k] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }
    while (++j <= k) {
      u.push(uninterpolate(domain[j - 1], domain[j]));
      i.push(interpolate(range[j - 1], range[j]));
    }
    return function(x) {
      var j = d3.bisect(domain, x, 1, k) - 1;
      return i[j](u[j](x));
    };
  }
  d3.scale.linear = function() {
    return d3_scale_linear([ 0, 1 ], [ 0, 1 ], d3_interpolate, false);
  };
  function d3_scale_linear(domain, range, interpolate, clamp) {
    var output, input;
    function rescale() {
      var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear, uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
      output = linear(domain, range, uninterpolate, interpolate);
      input = linear(range, domain, uninterpolate, d3_interpolate);
      return scale;
    }
    function scale(x) {
      return output(x);
    }
    scale.invert = function(y) {
      return input(y);
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(Number);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.rangeRound = function(x) {
      return scale.range(x).interpolate(d3_interpolateRound);
    };
    scale.clamp = function(x) {
      if (!arguments.length) return clamp;
      clamp = x;
      return rescale();
    };
    scale.interpolate = function(x) {
      if (!arguments.length) return interpolate;
      interpolate = x;
      return rescale();
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      d3_scale_linearNice(domain, m);
      return rescale();
    };
    scale.copy = function() {
      return d3_scale_linear(domain, range, interpolate, clamp);
    };
    return rescale();
  }
  function d3_scale_linearRebind(scale, linear) {
    return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
  }
  function d3_scale_linearNice(domain, m) {
    return d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
  }
  function d3_scale_linearTickRange(domain, m) {
    if (m == null) m = 10;
    var extent = d3_scaleExtent(domain), span = extent[1] - extent[0], step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)), err = m / span * step;
    if (err <= .15) step *= 10; else if (err <= .35) step *= 5; else if (err <= .75) step *= 2;
    extent[0] = Math.ceil(extent[0] / step) * step;
    extent[1] = Math.floor(extent[1] / step) * step + step * .5;
    extent[2] = step;
    return extent;
  }
  function d3_scale_linearTicks(domain, m) {
    return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
  }
  function d3_scale_linearTickFormat(domain, m, format) {
    var range = d3_scale_linearTickRange(domain, m);
    if (format) {
      var match = d3_format_re.exec(format);
      match.shift();
      if (match[8] === "s") {
        var prefix = d3.formatPrefix(Math.max(abs(range[0]), abs(range[1])));
        if (!match[7]) match[7] = "." + d3_scale_linearPrecision(prefix.scale(range[2]));
        match[8] = "f";
        format = d3.format(match.join(""));
        return function(d) {
          return format(prefix.scale(d)) + prefix.symbol;
        };
      }
      if (!match[7]) match[7] = "." + d3_scale_linearFormatPrecision(match[8], range);
      format = match.join("");
    } else {
      format = ",." + d3_scale_linearPrecision(range[2]) + "f";
    }
    return d3.format(format);
  }
  var d3_scale_linearFormatSignificant = {
    s: 1,
    g: 1,
    p: 1,
    r: 1,
    e: 1
  };
  function d3_scale_linearPrecision(value) {
    return -Math.floor(Math.log(value) / Math.LN10 + .01);
  }
  function d3_scale_linearFormatPrecision(type, range) {
    var p = d3_scale_linearPrecision(range[2]);
    return type in d3_scale_linearFormatSignificant ? Math.abs(p - d3_scale_linearPrecision(Math.max(abs(range[0]), abs(range[1])))) + +(type !== "e") : p - (type === "%") * 2;
  }
  d3.scale.log = function() {
    return d3_scale_log(d3.scale.linear().domain([ 0, 1 ]), 10, true, [ 1, 10 ]);
  };
  function d3_scale_log(linear, base, positive, domain) {
    function log(x) {
      return (positive ? Math.log(x < 0 ? 0 : x) : -Math.log(x > 0 ? 0 : -x)) / Math.log(base);
    }
    function pow(x) {
      return positive ? Math.pow(base, x) : -Math.pow(base, -x);
    }
    function scale(x) {
      return linear(log(x));
    }
    scale.invert = function(x) {
      return pow(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      positive = x[0] >= 0;
      linear.domain((domain = x.map(Number)).map(log));
      return scale;
    };
    scale.base = function(_) {
      if (!arguments.length) return base;
      base = +_;
      linear.domain(domain.map(log));
      return scale;
    };
    scale.nice = function() {
      var niced = d3_scale_nice(domain.map(log), positive ? Math : d3_scale_logNiceNegative);
      linear.domain(niced);
      domain = niced.map(pow);
      return scale;
    };
    scale.ticks = function() {
      var extent = d3_scaleExtent(domain), ticks = [], u = extent[0], v = extent[1], i = Math.floor(log(u)), j = Math.ceil(log(v)), n = base % 1 ? 2 : base;
      if (isFinite(j - i)) {
        if (positive) {
          for (;i < j; i++) for (var k = 1; k < n; k++) ticks.push(pow(i) * k);
          ticks.push(pow(i));
        } else {
          ticks.push(pow(i));
          for (;i++ < j; ) for (var k = n - 1; k > 0; k--) ticks.push(pow(i) * k);
        }
        for (i = 0; ticks[i] < u; i++) {}
        for (j = ticks.length; ticks[j - 1] > v; j--) {}
        ticks = ticks.slice(i, j);
      }
      return ticks;
    };
    scale.tickFormat = function(n, format) {
      if (!arguments.length) return d3_scale_logFormat;
      if (arguments.length < 2) format = d3_scale_logFormat; else if (typeof format !== "function") format = d3.format(format);
      var k = Math.max(.1, n / scale.ticks().length), f = positive ? (e = 1e-12, Math.ceil) : (e = -1e-12, 
      Math.floor), e;
      return function(d) {
        return d / pow(f(log(d) + e)) <= k ? format(d) : "";
      };
    };
    scale.copy = function() {
      return d3_scale_log(linear.copy(), base, positive, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  var d3_scale_logFormat = d3.format(".0e"), d3_scale_logNiceNegative = {
    floor: function(x) {
      return -Math.ceil(-x);
    },
    ceil: function(x) {
      return -Math.floor(-x);
    }
  };
  d3.scale.pow = function() {
    return d3_scale_pow(d3.scale.linear(), 1, [ 0, 1 ]);
  };
  function d3_scale_pow(linear, exponent, domain) {
    var powp = d3_scale_powPow(exponent), powb = d3_scale_powPow(1 / exponent);
    function scale(x) {
      return linear(powp(x));
    }
    scale.invert = function(x) {
      return powb(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      linear.domain((domain = x.map(Number)).map(powp));
      return scale;
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      return scale.domain(d3_scale_linearNice(domain, m));
    };
    scale.exponent = function(x) {
      if (!arguments.length) return exponent;
      powp = d3_scale_powPow(exponent = x);
      powb = d3_scale_powPow(1 / exponent);
      linear.domain(domain.map(powp));
      return scale;
    };
    scale.copy = function() {
      return d3_scale_pow(linear.copy(), exponent, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_scale_powPow(e) {
    return function(x) {
      return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);
    };
  }
  d3.scale.sqrt = function() {
    return d3.scale.pow().exponent(.5);
  };
  d3.scale.ordinal = function() {
    return d3_scale_ordinal([], {
      t: "range",
      a: [ [] ]
    });
  };
  function d3_scale_ordinal(domain, ranger) {
    var index, range, rangeBand;
    function scale(x) {
      return range[((index.get(x) || (ranger.t === "range" ? index.set(x, domain.push(x)) : NaN)) - 1) % range.length];
    }
    function steps(start, step) {
      return d3.range(domain.length).map(function(i) {
        return start + step * i;
      });
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = [];
      index = new d3_Map();
      var i = -1, n = x.length, xi;
      while (++i < n) if (!index.has(xi = x[i])) index.set(xi, domain.push(xi));
      return scale[ranger.t].apply(scale, ranger.a);
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      rangeBand = 0;
      ranger = {
        t: "range",
        a: arguments
      };
      return scale;
    };
    scale.rangePoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = (stop - start) / (Math.max(1, domain.length - 1) + padding);
      range = steps(domain.length < 2 ? (start + stop) / 2 : start + step * padding / 2, step);
      rangeBand = 0;
      ranger = {
        t: "rangePoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = (stop - start) / (domain.length - padding + 2 * outerPadding);
      range = steps(start + step * outerPadding, step);
      if (reverse) range.reverse();
      rangeBand = step * (1 - padding);
      ranger = {
        t: "rangeBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = Math.floor((stop - start) / (domain.length - padding + 2 * outerPadding)), error = stop - start - (domain.length - padding) * step;
      range = steps(start + Math.round(error / 2), step);
      if (reverse) range.reverse();
      rangeBand = Math.round(step * (1 - padding));
      ranger = {
        t: "rangeRoundBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeBand = function() {
      return rangeBand;
    };
    scale.rangeExtent = function() {
      return d3_scaleExtent(ranger.a[0]);
    };
    scale.copy = function() {
      return d3_scale_ordinal(domain, ranger);
    };
    return scale.domain(domain);
  }
  d3.scale.category10 = function() {
    return d3.scale.ordinal().range(d3_category10);
  };
  d3.scale.category20 = function() {
    return d3.scale.ordinal().range(d3_category20);
  };
  d3.scale.category20b = function() {
    return d3.scale.ordinal().range(d3_category20b);
  };
  d3.scale.category20c = function() {
    return d3.scale.ordinal().range(d3_category20c);
  };
  var d3_category10 = [ 2062260, 16744206, 2924588, 14034728, 9725885, 9197131, 14907330, 8355711, 12369186, 1556175 ].map(d3_rgbString);
  var d3_category20 = [ 2062260, 11454440, 16744206, 16759672, 2924588, 10018698, 14034728, 16750742, 9725885, 12955861, 9197131, 12885140, 14907330, 16234194, 8355711, 13092807, 12369186, 14408589, 1556175, 10410725 ].map(d3_rgbString);
  var d3_category20b = [ 3750777, 5395619, 7040719, 10264286, 6519097, 9216594, 11915115, 13556636, 9202993, 12426809, 15186514, 15190932, 8666169, 11356490, 14049643, 15177372, 8077683, 10834324, 13528509, 14589654 ].map(d3_rgbString);
  var d3_category20c = [ 3244733, 7057110, 10406625, 13032431, 15095053, 16616764, 16625259, 16634018, 3253076, 7652470, 10607003, 13101504, 7695281, 10394312, 12369372, 14342891, 6513507, 9868950, 12434877, 14277081 ].map(d3_rgbString);
  d3.scale.quantile = function() {
    return d3_scale_quantile([], []);
  };
  function d3_scale_quantile(domain, range) {
    var thresholds;
    function rescale() {
      var k = 0, q = range.length;
      thresholds = [];
      while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);
      return scale;
    }
    function scale(x) {
      if (!isNaN(x = +x)) return range[d3.bisect(thresholds, x)];
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.filter(function(d) {
        return !isNaN(d);
      }).sort(d3_ascending);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.quantiles = function() {
      return thresholds;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return y < 0 ? [ NaN, NaN ] : [ y > 0 ? thresholds[y - 1] : domain[0], y < thresholds.length ? thresholds[y] : domain[domain.length - 1] ];
    };
    scale.copy = function() {
      return d3_scale_quantile(domain, range);
    };
    return rescale();
  }
  d3.scale.quantize = function() {
    return d3_scale_quantize(0, 1, [ 0, 1 ]);
  };
  function d3_scale_quantize(x0, x1, range) {
    var kx, i;
    function scale(x) {
      return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
    }
    function rescale() {
      kx = range.length / (x1 - x0);
      i = range.length - 1;
      return scale;
    }
    scale.domain = function(x) {
      if (!arguments.length) return [ x0, x1 ];
      x0 = +x[0];
      x1 = +x[x.length - 1];
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      y = y < 0 ? NaN : y / kx + x0;
      return [ y, y + 1 / kx ];
    };
    scale.copy = function() {
      return d3_scale_quantize(x0, x1, range);
    };
    return rescale();
  }
  d3.scale.threshold = function() {
    return d3_scale_threshold([ .5 ], [ 0, 1 ]);
  };
  function d3_scale_threshold(domain, range) {
    function scale(x) {
      if (x <= x) return range[d3.bisect(domain, x)];
    }
    scale.domain = function(_) {
      if (!arguments.length) return domain;
      domain = _;
      return scale;
    };
    scale.range = function(_) {
      if (!arguments.length) return range;
      range = _;
      return scale;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return [ domain[y - 1], domain[y] ];
    };
    scale.copy = function() {
      return d3_scale_threshold(domain, range);
    };
    return scale;
  }
  d3.scale.identity = function() {
    return d3_scale_identity([ 0, 1 ]);
  };
  function d3_scale_identity(domain) {
    function identity(x) {
      return +x;
    }
    identity.invert = identity;
    identity.domain = identity.range = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(identity);
      return identity;
    };
    identity.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    identity.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    identity.copy = function() {
      return d3_scale_identity(domain);
    };
    return identity;
  }
  d3.svg = {};
  d3.svg.arc = function() {
    var innerRadius = d3_svg_arcInnerRadius, outerRadius = d3_svg_arcOuterRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function arc() {
      var r0 = innerRadius.apply(this, arguments), r1 = outerRadius.apply(this, arguments), a0 = startAngle.apply(this, arguments) + d3_svg_arcOffset, a1 = endAngle.apply(this, arguments) + d3_svg_arcOffset, da = (a1 < a0 && (da = a0, 
      a0 = a1, a1 = da), a1 - a0), df = da < π ? "0" : "1", c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      return da >= d3_svg_arcMax ? r0 ? "M0," + r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + -r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + r1 + "M0," + r0 + "A" + r0 + "," + r0 + " 0 1,0 0," + -r0 + "A" + r0 + "," + r0 + " 0 1,0 0," + r0 + "Z" : "M0," + r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + -r1 + "A" + r1 + "," + r1 + " 0 1,1 0," + r1 + "Z" : r0 ? "M" + r1 * c0 + "," + r1 * s0 + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1 + "L" + r0 * c1 + "," + r0 * s1 + "A" + r0 + "," + r0 + " 0 " + df + ",0 " + r0 * c0 + "," + r0 * s0 + "Z" : "M" + r1 * c0 + "," + r1 * s0 + "A" + r1 + "," + r1 + " 0 " + df + ",1 " + r1 * c1 + "," + r1 * s1 + "L0,0" + "Z";
    }
    arc.innerRadius = function(v) {
      if (!arguments.length) return innerRadius;
      innerRadius = d3_functor(v);
      return arc;
    };
    arc.outerRadius = function(v) {
      if (!arguments.length) return outerRadius;
      outerRadius = d3_functor(v);
      return arc;
    };
    arc.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return arc;
    };
    arc.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return arc;
    };
    arc.centroid = function() {
      var r = (innerRadius.apply(this, arguments) + outerRadius.apply(this, arguments)) / 2, a = (startAngle.apply(this, arguments) + endAngle.apply(this, arguments)) / 2 + d3_svg_arcOffset;
      return [ Math.cos(a) * r, Math.sin(a) * r ];
    };
    return arc;
  };
  var d3_svg_arcOffset = -halfπ, d3_svg_arcMax = τ - ε;
  function d3_svg_arcInnerRadius(d) {
    return d.innerRadius;
  }
  function d3_svg_arcOuterRadius(d) {
    return d.outerRadius;
  }
  function d3_svg_arcStartAngle(d) {
    return d.startAngle;
  }
  function d3_svg_arcEndAngle(d) {
    return d.endAngle;
  }
  function d3_svg_line(projection) {
    var x = d3_geom_pointX, y = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, tension = .7;
    function line(data) {
      var segments = [], points = [], i = -1, n = data.length, d, fx = d3_functor(x), fy = d3_functor(y);
      function segment() {
        segments.push("M", interpolate(projection(points), tension));
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points.push([ +fx.call(this, d, i), +fy.call(this, d, i) ]);
        } else if (points.length) {
          segment();
          points = [];
        }
      }
      if (points.length) segment();
      return segments.length ? segments.join("") : null;
    }
    line.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return line;
    };
    line.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return line;
    };
    line.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return line;
    };
    line.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      return line;
    };
    line.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return line;
    };
    return line;
  }
  d3.svg.line = function() {
    return d3_svg_line(d3_identity);
  };
  var d3_svg_lineInterpolators = d3.map({
    linear: d3_svg_lineLinear,
    "linear-closed": d3_svg_lineLinearClosed,
    step: d3_svg_lineStep,
    "step-before": d3_svg_lineStepBefore,
    "step-after": d3_svg_lineStepAfter,
    basis: d3_svg_lineBasis,
    "basis-open": d3_svg_lineBasisOpen,
    "basis-closed": d3_svg_lineBasisClosed,
    bundle: d3_svg_lineBundle,
    cardinal: d3_svg_lineCardinal,
    "cardinal-open": d3_svg_lineCardinalOpen,
    "cardinal-closed": d3_svg_lineCardinalClosed,
    monotone: d3_svg_lineMonotone
  });
  d3_svg_lineInterpolators.forEach(function(key, value) {
    value.key = key;
    value.closed = /-closed$/.test(key);
  });
  function d3_svg_lineLinear(points) {
    return points.join("L");
  }
  function d3_svg_lineLinearClosed(points) {
    return d3_svg_lineLinear(points) + "Z";
  }
  function d3_svg_lineStep(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p[0] + (p = points[i])[0]) / 2, "V", p[1]);
    if (n > 1) path.push("H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepBefore(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepAfter(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
    return path.join("");
  }
  function d3_svg_lineCardinalOpen(points, tension) {
    return points.length < 4 ? d3_svg_lineLinear(points) : points[1] + d3_svg_lineHermite(points.slice(1, points.length - 1), d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineCardinalClosed(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite((points.push(points[0]), 
    points), d3_svg_lineCardinalTangents([ points[points.length - 2] ].concat(points, [ points[1] ]), tension));
  }
  function d3_svg_lineCardinal(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineHermite(points, tangents) {
    if (tangents.length < 1 || points.length != tangents.length && points.length != tangents.length + 2) {
      return d3_svg_lineLinear(points);
    }
    var quad = points.length != tangents.length, path = "", p0 = points[0], p = points[1], t0 = tangents[0], t = t0, pi = 1;
    if (quad) {
      path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3) + "," + p[0] + "," + p[1];
      p0 = points[1];
      pi = 2;
    }
    if (tangents.length > 1) {
      t = tangents[1];
      p = points[pi];
      pi++;
      path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1]) + "," + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      for (var i = 2; i < tangents.length; i++, pi++) {
        p = points[pi];
        t = tangents[i];
        path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      }
    }
    if (quad) {
      var lp = points[pi];
      path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3) + "," + lp[0] + "," + lp[1];
    }
    return path;
  }
  function d3_svg_lineCardinalTangents(points, tension) {
    var tangents = [], a = (1 - tension) / 2, p0, p1 = points[0], p2 = points[1], i = 1, n = points.length;
    while (++i < n) {
      p0 = p1;
      p1 = p2;
      p2 = points[i];
      tangents.push([ a * (p2[0] - p0[0]), a * (p2[1] - p0[1]) ]);
    }
    return tangents;
  }
  function d3_svg_lineBasis(points) {
    if (points.length < 3) return d3_svg_lineLinear(points);
    var i = 1, n = points.length, pi = points[0], x0 = pi[0], y0 = pi[1], px = [ x0, x0, x0, (pi = points[1])[0] ], py = [ y0, y0, y0, pi[1] ], path = [ x0, ",", y0, "L", d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    points.push(points[n - 1]);
    while (++i <= n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    points.pop();
    path.push("L", pi);
    return path.join("");
  }
  function d3_svg_lineBasisOpen(points) {
    if (points.length < 4) return d3_svg_lineLinear(points);
    var path = [], i = -1, n = points.length, pi, px = [ 0 ], py = [ 0 ];
    while (++i < 3) {
      pi = points[i];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px) + "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
    --i;
    while (++i < n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBasisClosed(points) {
    var path, i = -1, n = points.length, m = n + 4, pi, px = [], py = [];
    while (++i < 4) {
      pi = points[i % n];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path = [ d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    --i;
    while (++i < m) {
      pi = points[i % n];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBundle(points, tension) {
    var n = points.length - 1;
    if (n) {
      var x0 = points[0][0], y0 = points[0][1], dx = points[n][0] - x0, dy = points[n][1] - y0, i = -1, p, t;
      while (++i <= n) {
        p = points[i];
        t = i / n;
        p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
        p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
      }
    }
    return d3_svg_lineBasis(points);
  }
  function d3_svg_lineDot4(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  var d3_svg_lineBasisBezier1 = [ 0, 2 / 3, 1 / 3, 0 ], d3_svg_lineBasisBezier2 = [ 0, 1 / 3, 2 / 3, 0 ], d3_svg_lineBasisBezier3 = [ 0, 1 / 6, 2 / 3, 1 / 6 ];
  function d3_svg_lineBasisBezier(path, x, y) {
    path.push("C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
  }
  function d3_svg_lineSlope(p0, p1) {
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);
  }
  function d3_svg_lineFiniteDifferences(points) {
    var i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = d3_svg_lineSlope(p0, p1);
    while (++i < j) {
      m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
    }
    m[i] = d;
    return m;
  }
  function d3_svg_lineMonotoneTangents(points) {
    var tangents = [], d, a, b, s, m = d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;
    while (++i < j) {
      d = d3_svg_lineSlope(points[i], points[i + 1]);
      if (abs(d) < ε) {
        m[i] = m[i + 1] = 0;
      } else {
        a = m[i] / d;
        b = m[i + 1] / d;
        s = a * a + b * b;
        if (s > 9) {
          s = d * 3 / Math.sqrt(s);
          m[i] = s * a;
          m[i + 1] = s * b;
        }
      }
    }
    i = -1;
    while (++i <= j) {
      s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
      tangents.push([ s || 0, m[i] * s || 0 ]);
    }
    return tangents;
  }
  function d3_svg_lineMonotone(points) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
  }
  d3.svg.line.radial = function() {
    var line = d3_svg_line(d3_svg_lineRadial);
    line.radius = line.x, delete line.x;
    line.angle = line.y, delete line.y;
    return line;
  };
  function d3_svg_lineRadial(points) {
    var point, i = -1, n = points.length, r, a;
    while (++i < n) {
      point = points[i];
      r = point[0];
      a = point[1] + d3_svg_arcOffset;
      point[0] = r * Math.cos(a);
      point[1] = r * Math.sin(a);
    }
    return points;
  }
  function d3_svg_area(projection) {
    var x0 = d3_geom_pointX, x1 = d3_geom_pointX, y0 = 0, y1 = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, interpolateReverse = interpolate, L = "L", tension = .7;
    function area(data) {
      var segments = [], points0 = [], points1 = [], i = -1, n = data.length, d, fx0 = d3_functor(x0), fy0 = d3_functor(y0), fx1 = x0 === x1 ? function() {
        return x;
      } : d3_functor(x1), fy1 = y0 === y1 ? function() {
        return y;
      } : d3_functor(y1), x, y;
      function segment() {
        segments.push("M", interpolate(projection(points1), tension), L, interpolateReverse(projection(points0.reverse()), tension), "Z");
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points0.push([ x = +fx0.call(this, d, i), y = +fy0.call(this, d, i) ]);
          points1.push([ +fx1.call(this, d, i), +fy1.call(this, d, i) ]);
        } else if (points0.length) {
          segment();
          points0 = [];
          points1 = [];
        }
      }
      if (points0.length) segment();
      return segments.length ? segments.join("") : null;
    }
    area.x = function(_) {
      if (!arguments.length) return x1;
      x0 = x1 = _;
      return area;
    };
    area.x0 = function(_) {
      if (!arguments.length) return x0;
      x0 = _;
      return area;
    };
    area.x1 = function(_) {
      if (!arguments.length) return x1;
      x1 = _;
      return area;
    };
    area.y = function(_) {
      if (!arguments.length) return y1;
      y0 = y1 = _;
      return area;
    };
    area.y0 = function(_) {
      if (!arguments.length) return y0;
      y0 = _;
      return area;
    };
    area.y1 = function(_) {
      if (!arguments.length) return y1;
      y1 = _;
      return area;
    };
    area.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return area;
    };
    area.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      interpolateReverse = interpolate.reverse || interpolate;
      L = interpolate.closed ? "M" : "L";
      return area;
    };
    area.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return area;
    };
    return area;
  }
  d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;
  d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;
  d3.svg.area = function() {
    return d3_svg_area(d3_identity);
  };
  d3.svg.area.radial = function() {
    var area = d3_svg_area(d3_svg_lineRadial);
    area.radius = area.x, delete area.x;
    area.innerRadius = area.x0, delete area.x0;
    area.outerRadius = area.x1, delete area.x1;
    area.angle = area.y, delete area.y;
    area.startAngle = area.y0, delete area.y0;
    area.endAngle = area.y1, delete area.y1;
    return area;
  };
  d3.svg.chord = function() {
    var source = d3_source, target = d3_target, radius = d3_svg_chordRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function chord(d, i) {
      var s = subgroup(this, source, d, i), t = subgroup(this, target, d, i);
      return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) + "Z";
    }
    function subgroup(self, f, d, i) {
      var subgroup = f.call(self, d, i), r = radius.call(self, subgroup, i), a0 = startAngle.call(self, subgroup, i) + d3_svg_arcOffset, a1 = endAngle.call(self, subgroup, i) + d3_svg_arcOffset;
      return {
        r: r,
        a0: a0,
        a1: a1,
        p0: [ r * Math.cos(a0), r * Math.sin(a0) ],
        p1: [ r * Math.cos(a1), r * Math.sin(a1) ]
      };
    }
    function equals(a, b) {
      return a.a0 == b.a0 && a.a1 == b.a1;
    }
    function arc(r, p, a) {
      return "A" + r + "," + r + " 0 " + +(a > π) + ",1 " + p;
    }
    function curve(r0, p0, r1, p1) {
      return "Q 0,0 " + p1;
    }
    chord.radius = function(v) {
      if (!arguments.length) return radius;
      radius = d3_functor(v);
      return chord;
    };
    chord.source = function(v) {
      if (!arguments.length) return source;
      source = d3_functor(v);
      return chord;
    };
    chord.target = function(v) {
      if (!arguments.length) return target;
      target = d3_functor(v);
      return chord;
    };
    chord.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return chord;
    };
    chord.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return chord;
    };
    return chord;
  };
  function d3_svg_chordRadius(d) {
    return d.radius;
  }
  d3.svg.diagonal = function() {
    var source = d3_source, target = d3_target, projection = d3_svg_diagonalProjection;
    function diagonal(d, i) {
      var p0 = source.call(this, d, i), p3 = target.call(this, d, i), m = (p0.y + p3.y) / 2, p = [ p0, {
        x: p0.x,
        y: m
      }, {
        x: p3.x,
        y: m
      }, p3 ];
      p = p.map(projection);
      return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
    }
    diagonal.source = function(x) {
      if (!arguments.length) return source;
      source = d3_functor(x);
      return diagonal;
    };
    diagonal.target = function(x) {
      if (!arguments.length) return target;
      target = d3_functor(x);
      return diagonal;
    };
    diagonal.projection = function(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    };
    return diagonal;
  };
  function d3_svg_diagonalProjection(d) {
    return [ d.x, d.y ];
  }
  d3.svg.diagonal.radial = function() {
    var diagonal = d3.svg.diagonal(), projection = d3_svg_diagonalProjection, projection_ = diagonal.projection;
    diagonal.projection = function(x) {
      return arguments.length ? projection_(d3_svg_diagonalRadialProjection(projection = x)) : projection;
    };
    return diagonal;
  };
  function d3_svg_diagonalRadialProjection(projection) {
    return function() {
      var d = projection.apply(this, arguments), r = d[0], a = d[1] + d3_svg_arcOffset;
      return [ r * Math.cos(a), r * Math.sin(a) ];
    };
  }
  d3.svg.symbol = function() {
    var type = d3_svg_symbolType, size = d3_svg_symbolSize;
    function symbol(d, i) {
      return (d3_svg_symbols.get(type.call(this, d, i)) || d3_svg_symbolCircle)(size.call(this, d, i));
    }
    symbol.type = function(x) {
      if (!arguments.length) return type;
      type = d3_functor(x);
      return symbol;
    };
    symbol.size = function(x) {
      if (!arguments.length) return size;
      size = d3_functor(x);
      return symbol;
    };
    return symbol;
  };
  function d3_svg_symbolSize() {
    return 64;
  }
  function d3_svg_symbolType() {
    return "circle";
  }
  function d3_svg_symbolCircle(size) {
    var r = Math.sqrt(size / π);
    return "M0," + r + "A" + r + "," + r + " 0 1,1 0," + -r + "A" + r + "," + r + " 0 1,1 0," + r + "Z";
  }
  var d3_svg_symbols = d3.map({
    circle: d3_svg_symbolCircle,
    cross: function(size) {
      var r = Math.sqrt(size / 5) / 2;
      return "M" + -3 * r + "," + -r + "H" + -r + "V" + -3 * r + "H" + r + "V" + -r + "H" + 3 * r + "V" + r + "H" + r + "V" + 3 * r + "H" + -r + "V" + r + "H" + -3 * r + "Z";
    },
    diamond: function(size) {
      var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)), rx = ry * d3_svg_symbolTan30;
      return "M0," + -ry + "L" + rx + ",0" + " 0," + ry + " " + -rx + ",0" + "Z";
    },
    square: function(size) {
      var r = Math.sqrt(size) / 2;
      return "M" + -r + "," + -r + "L" + r + "," + -r + " " + r + "," + r + " " + -r + "," + r + "Z";
    },
    "triangle-down": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + ry + "L" + rx + "," + -ry + " " + -rx + "," + -ry + "Z";
    },
    "triangle-up": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + -ry + "L" + rx + "," + ry + " " + -rx + "," + ry + "Z";
    }
  });
  d3.svg.symbolTypes = d3_svg_symbols.keys();
  var d3_svg_symbolSqrt3 = Math.sqrt(3), d3_svg_symbolTan30 = Math.tan(30 * d3_radians);
  function d3_transition(groups, id) {
    d3_subclass(groups, d3_transitionPrototype);
    groups.id = id;
    return groups;
  }
  var d3_transitionPrototype = [], d3_transitionId = 0, d3_transitionInheritId, d3_transitionInherit;
  d3_transitionPrototype.call = d3_selectionPrototype.call;
  d3_transitionPrototype.empty = d3_selectionPrototype.empty;
  d3_transitionPrototype.node = d3_selectionPrototype.node;
  d3_transitionPrototype.size = d3_selectionPrototype.size;
  d3.transition = function(selection) {
    return arguments.length ? d3_transitionInheritId ? selection.transition() : selection : d3_selectionRoot.transition();
  };
  d3.transition.prototype = d3_transitionPrototype;
  d3_transitionPrototype.select = function(selector) {
    var id = this.id, subgroups = [], subgroup, subnode, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          d3_transitionNode(subnode, i, id, node.__transition__[id]);
          subgroup.push(subnode);
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_transitionPrototype.selectAll = function(selector) {
    var id = this.id, subgroups = [], subgroup, subnodes, node, subnode, transition;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          transition = node.__transition__[id];
          subnodes = selector.call(node, node.__data__, i, j);
          subgroups.push(subgroup = []);
          for (var k = -1, o = subnodes.length; ++k < o; ) {
            if (subnode = subnodes[k]) d3_transitionNode(subnode, k, id, transition);
            subgroup.push(subnode);
          }
        }
      }
    }
    return d3_transition(subgroups, id);
  };
  d3_transitionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_transition(subgroups, this.id);
  };
  d3_transitionPrototype.tween = function(name, tween) {
    var id = this.id;
    if (arguments.length < 2) return this.node().__transition__[id].tween.get(name);
    return d3_selection_each(this, tween == null ? function(node) {
      node.__transition__[id].tween.remove(name);
    } : function(node) {
      node.__transition__[id].tween.set(name, tween);
    });
  };
  function d3_transition_tween(groups, name, value, tween) {
    var id = groups.id;
    return d3_selection_each(groups, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].tween.set(name, tween(value.call(node, node.__data__, i, j)));
    } : (value = tween(value), function(node) {
      node.__transition__[id].tween.set(name, value);
    }));
  }
  d3_transitionPrototype.attr = function(nameNS, value) {
    if (arguments.length < 2) {
      for (value in nameNS) this.attr(value, nameNS[value]);
      return this;
    }
    var interpolate = nameNS == "transform" ? d3_interpolateTransform : d3_interpolate, name = d3.ns.qualify(nameNS);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrTween(b) {
      return b == null ? attrNull : (b += "", function() {
        var a = this.getAttribute(name), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttribute(name, i(t));
        });
      });
    }
    function attrTweenNS(b) {
      return b == null ? attrNullNS : (b += "", function() {
        var a = this.getAttributeNS(name.space, name.local), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttributeNS(name.space, name.local, i(t));
        });
      });
    }
    return d3_transition_tween(this, "attr." + nameNS, value, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.attrTween = function(nameNS, tween) {
    var name = d3.ns.qualify(nameNS);
    function attrTween(d, i) {
      var f = tween.call(this, d, i, this.getAttribute(name));
      return f && function(t) {
        this.setAttribute(name, f(t));
      };
    }
    function attrTweenNS(d, i) {
      var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
      return f && function(t) {
        this.setAttributeNS(name.space, name.local, f(t));
      };
    }
    return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.style(priority, name[priority], value);
        return this;
      }
      priority = "";
    }
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleString(b) {
      return b == null ? styleNull : (b += "", function() {
        var a = d3_window.getComputedStyle(this, null).getPropertyValue(name), i;
        return a !== b && (i = d3_interpolate(a, b), function(t) {
          this.style.setProperty(name, i(t), priority);
        });
      });
    }
    return d3_transition_tween(this, "style." + name, value, styleString);
  };
  d3_transitionPrototype.styleTween = function(name, tween, priority) {
    if (arguments.length < 3) priority = "";
    function styleTween(d, i) {
      var f = tween.call(this, d, i, d3_window.getComputedStyle(this, null).getPropertyValue(name));
      return f && function(t) {
        this.style.setProperty(name, f(t), priority);
      };
    }
    return this.tween("style." + name, styleTween);
  };
  d3_transitionPrototype.text = function(value) {
    return d3_transition_tween(this, "text", value, d3_transition_text);
  };
  function d3_transition_text(b) {
    if (b == null) b = "";
    return function() {
      this.textContent = b;
    };
  }
  d3_transitionPrototype.remove = function() {
    return this.each("end.transition", function() {
      var p;
      if (this.__transition__.count < 2 && (p = this.parentNode)) p.removeChild(this);
    });
  };
  d3_transitionPrototype.ease = function(value) {
    var id = this.id;
    if (arguments.length < 1) return this.node().__transition__[id].ease;
    if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
    return d3_selection_each(this, function(node) {
      node.__transition__[id].ease = value;
    });
  };
  d3_transitionPrototype.delay = function(value) {
    var id = this.id;
    if (arguments.length < 1) return this.node().__transition__[id].delay;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].delay = +value.call(node, node.__data__, i, j);
    } : (value = +value, function(node) {
      node.__transition__[id].delay = value;
    }));
  };
  d3_transitionPrototype.duration = function(value) {
    var id = this.id;
    if (arguments.length < 1) return this.node().__transition__[id].duration;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node.__transition__[id].duration = Math.max(1, value.call(node, node.__data__, i, j));
    } : (value = Math.max(1, value), function(node) {
      node.__transition__[id].duration = value;
    }));
  };
  d3_transitionPrototype.each = function(type, listener) {
    var id = this.id;
    if (arguments.length < 2) {
      var inherit = d3_transitionInherit, inheritId = d3_transitionInheritId;
      d3_transitionInheritId = id;
      d3_selection_each(this, function(node, i, j) {
        d3_transitionInherit = node.__transition__[id];
        type.call(node, node.__data__, i, j);
      });
      d3_transitionInherit = inherit;
      d3_transitionInheritId = inheritId;
    } else {
      d3_selection_each(this, function(node) {
        var transition = node.__transition__[id];
        (transition.event || (transition.event = d3.dispatch("start", "end"))).on(type, listener);
      });
    }
    return this;
  };
  d3_transitionPrototype.transition = function() {
    var id0 = this.id, id1 = ++d3_transitionId, subgroups = [], subgroup, group, node, transition;
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if (node = group[i]) {
          transition = Object.create(node.__transition__[id0]);
          transition.delay += transition.duration;
          d3_transitionNode(node, i, id1, transition);
        }
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, id1);
  };
  function d3_transitionNode(node, i, id, inherit) {
    var lock = node.__transition__ || (node.__transition__ = {
      active: 0,
      count: 0
    }), transition = lock[id];
    if (!transition) {
      var time = inherit.time;
      transition = lock[id] = {
        tween: new d3_Map(),
        time: time,
        ease: inherit.ease,
        delay: inherit.delay,
        duration: inherit.duration
      };
      ++lock.count;
      d3.timer(function(elapsed) {
        var d = node.__data__, ease = transition.ease, delay = transition.delay, duration = transition.duration, timer = d3_timer_active, tweened = [];
        timer.t = delay + time;
        if (delay <= elapsed) return start(elapsed - delay);
        timer.c = start;
        function start(elapsed) {
          if (lock.active > id) return stop();
          lock.active = id;
          transition.event && transition.event.start.call(node, d, i);
          transition.tween.forEach(function(key, value) {
            if (value = value.call(node, d, i)) {
              tweened.push(value);
            }
          });
          d3.timer(function() {
            timer.c = tick(elapsed || 1) ? d3_true : tick;
            return 1;
          }, 0, time);
        }
        function tick(elapsed) {
          if (lock.active !== id) return stop();
          var t = elapsed / duration, e = ease(t), n = tweened.length;
          while (n > 0) {
            tweened[--n].call(node, e);
          }
          if (t >= 1) {
            transition.event && transition.event.end.call(node, d, i);
            return stop();
          }
        }
        function stop() {
          if (--lock.count) delete lock[id]; else delete node.__transition__;
          return 1;
        }
      }, 0, time);
    }
  }
  d3.svg.axis = function() {
    var scale = d3.scale.linear(), orient = d3_svg_axisDefaultOrient, innerTickSize = 6, outerTickSize = 6, tickPadding = 3, tickArguments_ = [ 10 ], tickValues = null, tickFormat_;
    function axis(g) {
      g.each(function() {
        var g = d3.select(this);
        var scale0 = this.__chart__ || scale, scale1 = this.__chart__ = scale.copy();
        var ticks = tickValues == null ? scale1.ticks ? scale1.ticks.apply(scale1, tickArguments_) : scale1.domain() : tickValues, tickFormat = tickFormat_ == null ? scale1.tickFormat ? scale1.tickFormat.apply(scale1, tickArguments_) : d3_identity : tickFormat_, tick = g.selectAll(".tick").data(ticks, scale1), tickEnter = tick.enter().insert("g", ".domain").attr("class", "tick").style("opacity", ε), tickExit = d3.transition(tick.exit()).style("opacity", ε).remove(), tickUpdate = d3.transition(tick.order()).style("opacity", 1), tickTransform;
        var range = d3_scaleRange(scale1), path = g.selectAll(".domain").data([ 0 ]), pathUpdate = (path.enter().append("path").attr("class", "domain"), 
        d3.transition(path));
        tickEnter.append("line");
        tickEnter.append("text");
        var lineEnter = tickEnter.select("line"), lineUpdate = tickUpdate.select("line"), text = tick.select("text").text(tickFormat), textEnter = tickEnter.select("text"), textUpdate = tickUpdate.select("text");
        switch (orient) {
         case "bottom":
          {
            tickTransform = d3_svg_axisX;
            lineEnter.attr("y2", innerTickSize);
            textEnter.attr("y", Math.max(innerTickSize, 0) + tickPadding);
            lineUpdate.attr("x2", 0).attr("y2", innerTickSize);
            textUpdate.attr("x", 0).attr("y", Math.max(innerTickSize, 0) + tickPadding);
            text.attr("dy", ".71em").style("text-anchor", "middle");
            pathUpdate.attr("d", "M" + range[0] + "," + outerTickSize + "V0H" + range[1] + "V" + outerTickSize);
            break;
          }

         case "top":
          {
            tickTransform = d3_svg_axisX;
            lineEnter.attr("y2", -innerTickSize);
            textEnter.attr("y", -(Math.max(innerTickSize, 0) + tickPadding));
            lineUpdate.attr("x2", 0).attr("y2", -innerTickSize);
            textUpdate.attr("x", 0).attr("y", -(Math.max(innerTickSize, 0) + tickPadding));
            text.attr("dy", "0em").style("text-anchor", "middle");
            pathUpdate.attr("d", "M" + range[0] + "," + -outerTickSize + "V0H" + range[1] + "V" + -outerTickSize);
            break;
          }

         case "left":
          {
            tickTransform = d3_svg_axisY;
            lineEnter.attr("x2", -innerTickSize);
            textEnter.attr("x", -(Math.max(innerTickSize, 0) + tickPadding));
            lineUpdate.attr("x2", -innerTickSize).attr("y2", 0);
            textUpdate.attr("x", -(Math.max(innerTickSize, 0) + tickPadding)).attr("y", 0);
            text.attr("dy", ".32em").style("text-anchor", "end");
            pathUpdate.attr("d", "M" + -outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + -outerTickSize);
            break;
          }

         case "right":
          {
            tickTransform = d3_svg_axisY;
            lineEnter.attr("x2", innerTickSize);
            textEnter.attr("x", Math.max(innerTickSize, 0) + tickPadding);
            lineUpdate.attr("x2", innerTickSize).attr("y2", 0);
            textUpdate.attr("x", Math.max(innerTickSize, 0) + tickPadding).attr("y", 0);
            text.attr("dy", ".32em").style("text-anchor", "start");
            pathUpdate.attr("d", "M" + outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + outerTickSize);
            break;
          }
        }
        if (scale1.rangeBand) {
          var x = scale1, dx = x.rangeBand() / 2;
          scale0 = scale1 = function(d) {
            return x(d) + dx;
          };
        } else if (scale0.rangeBand) {
          scale0 = scale1;
        } else {
          tickExit.call(tickTransform, scale1);
        }
        tickEnter.call(tickTransform, scale0);
        tickUpdate.call(tickTransform, scale1);
      });
    }
    axis.scale = function(x) {
      if (!arguments.length) return scale;
      scale = x;
      return axis;
    };
    axis.orient = function(x) {
      if (!arguments.length) return orient;
      orient = x in d3_svg_axisOrients ? x + "" : d3_svg_axisDefaultOrient;
      return axis;
    };
    axis.ticks = function() {
      if (!arguments.length) return tickArguments_;
      tickArguments_ = arguments;
      return axis;
    };
    axis.tickValues = function(x) {
      if (!arguments.length) return tickValues;
      tickValues = x;
      return axis;
    };
    axis.tickFormat = function(x) {
      if (!arguments.length) return tickFormat_;
      tickFormat_ = x;
      return axis;
    };
    axis.tickSize = function(x) {
      var n = arguments.length;
      if (!n) return innerTickSize;
      innerTickSize = +x;
      outerTickSize = +arguments[n - 1];
      return axis;
    };
    axis.innerTickSize = function(x) {
      if (!arguments.length) return innerTickSize;
      innerTickSize = +x;
      return axis;
    };
    axis.outerTickSize = function(x) {
      if (!arguments.length) return outerTickSize;
      outerTickSize = +x;
      return axis;
    };
    axis.tickPadding = function(x) {
      if (!arguments.length) return tickPadding;
      tickPadding = +x;
      return axis;
    };
    axis.tickSubdivide = function() {
      return arguments.length && axis;
    };
    return axis;
  };
  var d3_svg_axisDefaultOrient = "bottom", d3_svg_axisOrients = {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  };
  function d3_svg_axisX(selection, x) {
    selection.attr("transform", function(d) {
      return "translate(" + x(d) + ",0)";
    });
  }
  function d3_svg_axisY(selection, y) {
    selection.attr("transform", function(d) {
      return "translate(0," + y(d) + ")";
    });
  }
  d3.svg.brush = function() {
    var event = d3_eventDispatch(brush, "brushstart", "brush", "brushend"), x = null, y = null, xExtent = [ 0, 0 ], yExtent = [ 0, 0 ], xExtentDomain, yExtentDomain, xClamp = true, yClamp = true, resizes = d3_svg_brushResizes[0];
    function brush(g) {
      g.each(function() {
        var g = d3.select(this).style("pointer-events", "all").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)").on("mousedown.brush", brushstart).on("touchstart.brush", brushstart);
        var background = g.selectAll(".background").data([ 0 ]);
        background.enter().append("rect").attr("class", "background").style("visibility", "hidden").style("cursor", "crosshair");
        g.selectAll(".extent").data([ 0 ]).enter().append("rect").attr("class", "extent").style("cursor", "move");
        var resize = g.selectAll(".resize").data(resizes, d3_identity);
        resize.exit().remove();
        resize.enter().append("g").attr("class", function(d) {
          return "resize " + d;
        }).style("cursor", function(d) {
          return d3_svg_brushCursor[d];
        }).append("rect").attr("x", function(d) {
          return /[ew]$/.test(d) ? -3 : null;
        }).attr("y", function(d) {
          return /^[ns]/.test(d) ? -3 : null;
        }).attr("width", 6).attr("height", 6).style("visibility", "hidden");
        resize.style("display", brush.empty() ? "none" : null);
        var gUpdate = d3.transition(g), backgroundUpdate = d3.transition(background), range;
        if (x) {
          range = d3_scaleRange(x);
          backgroundUpdate.attr("x", range[0]).attr("width", range[1] - range[0]);
          redrawX(gUpdate);
        }
        if (y) {
          range = d3_scaleRange(y);
          backgroundUpdate.attr("y", range[0]).attr("height", range[1] - range[0]);
          redrawY(gUpdate);
        }
        redraw(gUpdate);
      });
    }
    brush.event = function(g) {
      g.each(function() {
        var event_ = event.of(this, arguments), extent1 = {
          x: xExtent,
          y: yExtent,
          i: xExtentDomain,
          j: yExtentDomain
        }, extent0 = this.__chart__ || extent1;
        this.__chart__ = extent1;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.brush", function() {
            xExtentDomain = extent0.i;
            yExtentDomain = extent0.j;
            xExtent = extent0.x;
            yExtent = extent0.y;
            event_({
              type: "brushstart"
            });
          }).tween("brush:brush", function() {
            var xi = d3_interpolateArray(xExtent, extent1.x), yi = d3_interpolateArray(yExtent, extent1.y);
            xExtentDomain = yExtentDomain = null;
            return function(t) {
              xExtent = extent1.x = xi(t);
              yExtent = extent1.y = yi(t);
              event_({
                type: "brush",
                mode: "resize"
              });
            };
          }).each("end.brush", function() {
            xExtentDomain = extent1.i;
            yExtentDomain = extent1.j;
            event_({
              type: "brush",
              mode: "resize"
            });
            event_({
              type: "brushend"
            });
          });
        } else {
          event_({
            type: "brushstart"
          });
          event_({
            type: "brush",
            mode: "resize"
          });
          event_({
            type: "brushend"
          });
        }
      });
    };
    function redraw(g) {
      g.selectAll(".resize").attr("transform", function(d) {
        return "translate(" + xExtent[+/e$/.test(d)] + "," + yExtent[+/^s/.test(d)] + ")";
      });
    }
    function redrawX(g) {
      g.select(".extent").attr("x", xExtent[0]);
      g.selectAll(".extent,.n>rect,.s>rect").attr("width", xExtent[1] - xExtent[0]);
    }
    function redrawY(g) {
      g.select(".extent").attr("y", yExtent[0]);
      g.selectAll(".extent,.e>rect,.w>rect").attr("height", yExtent[1] - yExtent[0]);
    }
    function brushstart() {
      var target = this, eventTarget = d3.select(d3.event.target), event_ = event.of(target, arguments), g = d3.select(target), resizing = eventTarget.datum(), resizingX = !/^(n|s)$/.test(resizing) && x, resizingY = !/^(e|w)$/.test(resizing) && y, dragging = eventTarget.classed("extent"), dragRestore = d3_event_dragSuppress(), center, origin = d3.mouse(target), offset;
      var w = d3.select(d3_window).on("keydown.brush", keydown).on("keyup.brush", keyup);
      if (d3.event.changedTouches) {
        w.on("touchmove.brush", brushmove).on("touchend.brush", brushend);
      } else {
        w.on("mousemove.brush", brushmove).on("mouseup.brush", brushend);
      }
      g.interrupt().selectAll("*").interrupt();
      if (dragging) {
        origin[0] = xExtent[0] - origin[0];
        origin[1] = yExtent[0] - origin[1];
      } else if (resizing) {
        var ex = +/w$/.test(resizing), ey = +/^n/.test(resizing);
        offset = [ xExtent[1 - ex] - origin[0], yExtent[1 - ey] - origin[1] ];
        origin[0] = xExtent[ex];
        origin[1] = yExtent[ey];
      } else if (d3.event.altKey) center = origin.slice();
      g.style("pointer-events", "none").selectAll(".resize").style("display", null);
      d3.select("body").style("cursor", eventTarget.style("cursor"));
      event_({
        type: "brushstart"
      });
      brushmove();
      function keydown() {
        if (d3.event.keyCode == 32) {
          if (!dragging) {
            center = null;
            origin[0] -= xExtent[1];
            origin[1] -= yExtent[1];
            dragging = 2;
          }
          d3_eventPreventDefault();
        }
      }
      function keyup() {
        if (d3.event.keyCode == 32 && dragging == 2) {
          origin[0] += xExtent[1];
          origin[1] += yExtent[1];
          dragging = 0;
          d3_eventPreventDefault();
        }
      }
      function brushmove() {
        var point = d3.mouse(target), moved = false;
        if (offset) {
          point[0] += offset[0];
          point[1] += offset[1];
        }
        if (!dragging) {
          if (d3.event.altKey) {
            if (!center) center = [ (xExtent[0] + xExtent[1]) / 2, (yExtent[0] + yExtent[1]) / 2 ];
            origin[0] = xExtent[+(point[0] < center[0])];
            origin[1] = yExtent[+(point[1] < center[1])];
          } else center = null;
        }
        if (resizingX && move1(point, x, 0)) {
          redrawX(g);
          moved = true;
        }
        if (resizingY && move1(point, y, 1)) {
          redrawY(g);
          moved = true;
        }
        if (moved) {
          redraw(g);
          event_({
            type: "brush",
            mode: dragging ? "move" : "resize"
          });
        }
      }
      function move1(point, scale, i) {
        var range = d3_scaleRange(scale), r0 = range[0], r1 = range[1], position = origin[i], extent = i ? yExtent : xExtent, size = extent[1] - extent[0], min, max;
        if (dragging) {
          r0 -= position;
          r1 -= size + position;
        }
        min = (i ? yClamp : xClamp) ? Math.max(r0, Math.min(r1, point[i])) : point[i];
        if (dragging) {
          max = (min += position) + size;
        } else {
          if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));
          if (position < min) {
            max = min;
            min = position;
          } else {
            max = position;
          }
        }
        if (extent[0] != min || extent[1] != max) {
          if (i) yExtentDomain = null; else xExtentDomain = null;
          extent[0] = min;
          extent[1] = max;
          return true;
        }
      }
      function brushend() {
        brushmove();
        g.style("pointer-events", "all").selectAll(".resize").style("display", brush.empty() ? "none" : null);
        d3.select("body").style("cursor", null);
        w.on("mousemove.brush", null).on("mouseup.brush", null).on("touchmove.brush", null).on("touchend.brush", null).on("keydown.brush", null).on("keyup.brush", null);
        dragRestore();
        event_({
          type: "brushend"
        });
      }
    }
    brush.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.clamp = function(z) {
      if (!arguments.length) return x && y ? [ xClamp, yClamp ] : x ? xClamp : y ? yClamp : null;
      if (x && y) xClamp = !!z[0], yClamp = !!z[1]; else if (x) xClamp = !!z; else if (y) yClamp = !!z;
      return brush;
    };
    brush.extent = function(z) {
      var x0, x1, y0, y1, t;
      if (!arguments.length) {
        if (x) {
          if (xExtentDomain) {
            x0 = xExtentDomain[0], x1 = xExtentDomain[1];
          } else {
            x0 = xExtent[0], x1 = xExtent[1];
            if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);
            if (x1 < x0) t = x0, x0 = x1, x1 = t;
          }
        }
        if (y) {
          if (yExtentDomain) {
            y0 = yExtentDomain[0], y1 = yExtentDomain[1];
          } else {
            y0 = yExtent[0], y1 = yExtent[1];
            if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);
            if (y1 < y0) t = y0, y0 = y1, y1 = t;
          }
        }
        return x && y ? [ [ x0, y0 ], [ x1, y1 ] ] : x ? [ x0, x1 ] : y && [ y0, y1 ];
      }
      if (x) {
        x0 = z[0], x1 = z[1];
        if (y) x0 = x0[0], x1 = x1[0];
        xExtentDomain = [ x0, x1 ];
        if (x.invert) x0 = x(x0), x1 = x(x1);
        if (x1 < x0) t = x0, x0 = x1, x1 = t;
        if (x0 != xExtent[0] || x1 != xExtent[1]) xExtent = [ x0, x1 ];
      }
      if (y) {
        y0 = z[0], y1 = z[1];
        if (x) y0 = y0[1], y1 = y1[1];
        yExtentDomain = [ y0, y1 ];
        if (y.invert) y0 = y(y0), y1 = y(y1);
        if (y1 < y0) t = y0, y0 = y1, y1 = t;
        if (y0 != yExtent[0] || y1 != yExtent[1]) yExtent = [ y0, y1 ];
      }
      return brush;
    };
    brush.clear = function() {
      if (!brush.empty()) {
        xExtent = [ 0, 0 ], yExtent = [ 0, 0 ];
        xExtentDomain = yExtentDomain = null;
      }
      return brush;
    };
    brush.empty = function() {
      return !!x && xExtent[0] == xExtent[1] || !!y && yExtent[0] == yExtent[1];
    };
    return d3.rebind(brush, event, "on");
  };
  var d3_svg_brushCursor = {
    n: "ns-resize",
    e: "ew-resize",
    s: "ns-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  };
  var d3_svg_brushResizes = [ [ "n", "e", "s", "w", "nw", "ne", "se", "sw" ], [ "e", "w" ], [ "n", "s" ], [] ];
  var d3_time_format = d3_time.format = d3_locale_enUS.timeFormat;
  var d3_time_formatUtc = d3_time_format.utc;
  var d3_time_formatIso = d3_time_formatUtc("%Y-%m-%dT%H:%M:%S.%LZ");
  d3_time_format.iso = Date.prototype.toISOString && +new Date("2000-01-01T00:00:00.000Z") ? d3_time_formatIsoNative : d3_time_formatIso;
  function d3_time_formatIsoNative(date) {
    return date.toISOString();
  }
  d3_time_formatIsoNative.parse = function(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  };
  d3_time_formatIsoNative.toString = d3_time_formatIso.toString;
  d3_time.second = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 1e3) * 1e3);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 1e3);
  }, function(date) {
    return date.getSeconds();
  });
  d3_time.seconds = d3_time.second.range;
  d3_time.seconds.utc = d3_time.second.utc.range;
  d3_time.minute = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 6e4) * 6e4);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 6e4);
  }, function(date) {
    return date.getMinutes();
  });
  d3_time.minutes = d3_time.minute.range;
  d3_time.minutes.utc = d3_time.minute.utc.range;
  d3_time.hour = d3_time_interval(function(date) {
    var timezone = date.getTimezoneOffset() / 60;
    return new d3_date((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 36e5);
  }, function(date) {
    return date.getHours();
  });
  d3_time.hours = d3_time.hour.range;
  d3_time.hours.utc = d3_time.hour.utc.range;
  d3_time.month = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setDate(1);
    return date;
  }, function(date, offset) {
    date.setMonth(date.getMonth() + offset);
  }, function(date) {
    return date.getMonth();
  });
  d3_time.months = d3_time.month.range;
  d3_time.months.utc = d3_time.month.utc.range;
  function d3_time_scale(linear, methods, format) {
    function scale(x) {
      return linear(x);
    }
    scale.invert = function(x) {
      return d3_time_scaleDate(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
      linear.domain(x);
      return scale;
    };
    function tickMethod(extent, count) {
      var span = extent[1] - extent[0], target = span / count, i = d3.bisect(d3_time_scaleSteps, target);
      return i == d3_time_scaleSteps.length ? [ methods.year, d3_scale_linearTickRange(extent.map(function(d) {
        return d / 31536e6;
      }), count)[2] ] : !i ? [ d3_time_scaleMilliseconds, d3_scale_linearTickRange(extent, count)[2] ] : methods[target / d3_time_scaleSteps[i - 1] < d3_time_scaleSteps[i] / target ? i - 1 : i];
    }
    scale.nice = function(interval, skip) {
      var domain = scale.domain(), extent = d3_scaleExtent(domain), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" && tickMethod(extent, interval);
      if (method) interval = method[0], skip = method[1];
      function skipped(date) {
        return !isNaN(date) && !interval.range(date, d3_time_scaleDate(+date + 1), skip).length;
      }
      return scale.domain(d3_scale_nice(domain, skip > 1 ? {
        floor: function(date) {
          while (skipped(date = interval.floor(date))) date = d3_time_scaleDate(date - 1);
          return date;
        },
        ceil: function(date) {
          while (skipped(date = interval.ceil(date))) date = d3_time_scaleDate(+date + 1);
          return date;
        }
      } : interval));
    };
    scale.ticks = function(interval, skip) {
      var extent = d3_scaleExtent(scale.domain()), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" ? tickMethod(extent, interval) : !interval.range && [ {
        range: interval
      }, skip ];
      if (method) interval = method[0], skip = method[1];
      return interval.range(extent[0], d3_time_scaleDate(+extent[1] + 1), skip < 1 ? 1 : skip);
    };
    scale.tickFormat = function() {
      return format;
    };
    scale.copy = function() {
      return d3_time_scale(linear.copy(), methods, format);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_time_scaleDate(t) {
    return new Date(t);
  }
  var d3_time_scaleSteps = [ 1e3, 5e3, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 108e5, 216e5, 432e5, 864e5, 1728e5, 6048e5, 2592e6, 7776e6, 31536e6 ];
  var d3_time_scaleLocalMethods = [ [ d3_time.second, 1 ], [ d3_time.second, 5 ], [ d3_time.second, 15 ], [ d3_time.second, 30 ], [ d3_time.minute, 1 ], [ d3_time.minute, 5 ], [ d3_time.minute, 15 ], [ d3_time.minute, 30 ], [ d3_time.hour, 1 ], [ d3_time.hour, 3 ], [ d3_time.hour, 6 ], [ d3_time.hour, 12 ], [ d3_time.day, 1 ], [ d3_time.day, 2 ], [ d3_time.week, 1 ], [ d3_time.month, 1 ], [ d3_time.month, 3 ], [ d3_time.year, 1 ] ];
  var d3_time_scaleLocalFormat = d3_time_format.multi([ [ ".%L", function(d) {
    return d.getMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getMinutes();
  } ], [ "%I %p", function(d) {
    return d.getHours();
  } ], [ "%a %d", function(d) {
    return d.getDay() && d.getDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getDate() != 1;
  } ], [ "%B", function(d) {
    return d.getMonth();
  } ], [ "%Y", d3_true ] ]);
  var d3_time_scaleMilliseconds = {
    range: function(start, stop, step) {
      return d3.range(Math.ceil(start / step) * step, +stop, step).map(d3_time_scaleDate);
    },
    floor: d3_identity,
    ceil: d3_identity
  };
  d3_time_scaleLocalMethods.year = d3_time.year;
  d3_time.scale = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
  };
  var d3_time_scaleUtcMethods = d3_time_scaleLocalMethods.map(function(m) {
    return [ m[0].utc, m[1] ];
  });
  var d3_time_scaleUtcFormat = d3_time_formatUtc.multi([ [ ".%L", function(d) {
    return d.getUTCMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getUTCSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getUTCMinutes();
  } ], [ "%I %p", function(d) {
    return d.getUTCHours();
  } ], [ "%a %d", function(d) {
    return d.getUTCDay() && d.getUTCDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getUTCDate() != 1;
  } ], [ "%B", function(d) {
    return d.getUTCMonth();
  } ], [ "%Y", d3_true ] ]);
  d3_time_scaleUtcMethods.year = d3_time.year.utc;
  d3_time.scale.utc = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleUtcMethods, d3_time_scaleUtcFormat);
  };
  d3.text = d3_xhrType(function(request) {
    return request.responseText;
  });
  d3.json = function(url, callback) {
    return d3_xhr(url, "application/json", d3_json, callback);
  };
  function d3_json(request) {
    return JSON.parse(request.responseText);
  }
  d3.html = function(url, callback) {
    return d3_xhr(url, "text/html", d3_html, callback);
  };
  function d3_html(request) {
    var range = d3_document.createRange();
    range.selectNode(d3_document.body);
    return range.createContextualFragment(request.responseText);
  }
  d3.xml = d3_xhrType(function(request) {
    return request.responseXML;
  });
  if (typeof define === "function" && define.amd) {
    define(d3);
  } else if (typeof module === "object" && module.exports) {
    module.exports = d3;
  } else {
    this.d3 = d3;
  }
}();
},{}],20:[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = require('./lib/Dispatcher')

},{"./lib/Dispatcher":21}],21:[function(require,module,exports){
/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 */

"use strict";

var invariant = require('./invariant');

var _lastID = 1;
var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *    CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *
 *         case 'city-update':
 *           FlightPriceStore.price =
 *             FlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

  function Dispatcher() {
    this.$Dispatcher_callbacks = {};
    this.$Dispatcher_isPending = {};
    this.$Dispatcher_isHandled = {};
    this.$Dispatcher_isDispatching = false;
    this.$Dispatcher_pendingPayload = null;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   *
   * @param {function} callback
   * @return {string}
   */
  Dispatcher.prototype.register=function(callback) {
    var id = _prefix + _lastID++;
    this.$Dispatcher_callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   *
   * @param {string} id
   */
  Dispatcher.prototype.unregister=function(id) {
    invariant(
      this.$Dispatcher_callbacks[id],
      'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
      id
    );
    delete this.$Dispatcher_callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   *
   * @param {array<string>} ids
   */
  Dispatcher.prototype.waitFor=function(ids) {
    invariant(
      this.$Dispatcher_isDispatching,
      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
    );
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this.$Dispatcher_isPending[id]) {
        invariant(
          this.$Dispatcher_isHandled[id],
          'Dispatcher.waitFor(...): Circular dependency detected while ' +
          'waiting for `%s`.',
          id
        );
        continue;
      }
      invariant(
        this.$Dispatcher_callbacks[id],
        'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
        id
      );
      this.$Dispatcher_invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   *
   * @param {object} payload
   */
  Dispatcher.prototype.dispatch=function(payload) {
    invariant(
      !this.$Dispatcher_isDispatching,
      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
    );
    this.$Dispatcher_startDispatching(payload);
    try {
      for (var id in this.$Dispatcher_callbacks) {
        if (this.$Dispatcher_isPending[id]) {
          continue;
        }
        this.$Dispatcher_invokeCallback(id);
      }
    } catch (e) {
      console.error(e.stack);
    } finally {
      this.$Dispatcher_stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   *
   * @return {boolean}
   */
  Dispatcher.prototype.isDispatching=function() {
    return this.$Dispatcher_isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @param {string} id
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_invokeCallback=function(id) {
    this.$Dispatcher_isPending[id] = true;
    this.$Dispatcher_callbacks[id](this.$Dispatcher_pendingPayload);
    this.$Dispatcher_isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @param {object} payload
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_startDispatching=function(payload) {
    for (var id in this.$Dispatcher_callbacks) {
      this.$Dispatcher_isPending[id] = false;
      this.$Dispatcher_isHandled[id] = false;
    }
    this.$Dispatcher_pendingPayload = payload;
    this.$Dispatcher_isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_stopDispatching=function() {
    this.$Dispatcher_pendingPayload = null;
    this.$Dispatcher_isDispatching = false;
  };


module.exports = Dispatcher;

},{"./invariant":22}],22:[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (false) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}],23:[function(require,module,exports){
/*

	ractive-events-tap
	==================

	Version 0.1.2.

	On mobile devices, using `on-click` isn't good enough. Tapping the
	touchscreen will fire a simulated click event, but only after a 300
	millisecond delay, which makes your app feel sluggish. It also
	causes the tapped area to highlight, which in most cases looks a
	bit messy.

	Instead, use `on-tap`. When you tap an area, the simulated click
	event will be prevented, and the user's action is responded to
	instantly. The `on-tap` event also differs from `on-click` in that
	the click event will (frankly rather bizarrely) fire even if you
	hold the mouse down over a single element for several seconds and
	waggle it about.

	Pointer events are also supported, as is pressing the spacebar when
	the relevant element is focused (which triggers a click event, and
	is good for accessibility).

	==========================

	Troubleshooting: If you're using a module system in your app (AMD or
	something more nodey) then you may need to change the paths below,
	where it says `require( 'ractive' )` or `define([ 'ractive' ]...)`.

	==========================

	Usage: Include this file on your page below Ractive, e.g:

	    <script src='lib/ractive.js'></script>
	    <script src='lib/ractive-events-tap.js'></script>

	Or, if you're using a module loader, require this module:

	    // requiring the plugin will 'activate' it - no need to use
	    // the return value
	    require( 'ractive-events-tap' );

	Add a tap event in the normal fashion:

	    <div on-tap='foo'>tap me!</div>

	Then add a handler:

	    ractive.on( 'foo', function ( event ) {
	      alert( 'tapped' );
	    });

*/

(function ( global, factory ) {

	'use strict';

	// Common JS (i.e. browserify) environment
	if ( typeof module !== 'undefined' && module.exports && typeof require === 'function' ) {
		factory( require( 'ractive' ) );
	}

	// AMD?
	else if ( typeof define === 'function' && define.amd ) {
		define([ 'ractive' ], factory );
	}

	// browser global
	else if ( global.Ractive ) {
		factory( global.Ractive );
	}

	else {
		throw new Error( 'Could not find Ractive! It must be loaded before the ractive-events-tap plugin' );
	}

}( typeof window !== 'undefined' ? window : this, function ( Ractive ) {

	'use strict';

	var tap = function ( node, fire ) {
		var mousedown, touchstart, focusHandler, distanceThreshold, timeThreshold, preventMousedownEvents, preventMousedownTimeout;

		distanceThreshold = 5; // maximum pixels pointer can move before cancel
		timeThreshold = 400;   // maximum milliseconds between down and up before cancel

		mousedown = function ( event ) {
			var currentTarget, x, y, pointerId, up, move, cancel;

			if ( preventMousedownEvents ) {
				return;
			}

			if ( event.which !== undefined && event.which !== 1 ) {
				return;
			}

			x = event.clientX;
			y = event.clientY;
			currentTarget = this;
			// This will be null for mouse events.
			pointerId = event.pointerId;

			up = function ( event ) {
				if ( event.pointerId != pointerId ) {
					return;
				}

				fire({
					node: currentTarget,
					original: event
				});

				cancel();
			};

			move = function ( event ) {
				if ( event.pointerId != pointerId ) {
					return;
				}

				if ( ( Math.abs( event.clientX - x ) >= distanceThreshold ) || ( Math.abs( event.clientY - y ) >= distanceThreshold ) ) {
					cancel();
				}
			};

			cancel = function () {
				node.removeEventListener( 'MSPointerUp', up, false );
				document.removeEventListener( 'MSPointerMove', move, false );
				document.removeEventListener( 'MSPointerCancel', cancel, false );
				node.removeEventListener( 'pointerup', up, false );
				document.removeEventListener( 'pointermove', move, false );
				document.removeEventListener( 'pointercancel', cancel, false );
				node.removeEventListener( 'click', up, false );
				document.removeEventListener( 'mousemove', move, false );
			};

			if ( window.navigator.pointerEnabled ) {
				node.addEventListener( 'pointerup', up, false );
				document.addEventListener( 'pointermove', move, false );
				document.addEventListener( 'pointercancel', cancel, false );
			} else if ( window.navigator.msPointerEnabled ) {
				node.addEventListener( 'MSPointerUp', up, false );
				document.addEventListener( 'MSPointerMove', move, false );
				document.addEventListener( 'MSPointerCancel', cancel, false );
			} else {
				node.addEventListener( 'click', up, false );
				document.addEventListener( 'mousemove', move, false );
			}

			setTimeout( cancel, timeThreshold );
		};

		if ( window.navigator.pointerEnabled ) {
			node.addEventListener( 'pointerdown', mousedown, false );
		} else if ( window.navigator.msPointerEnabled ) {
			node.addEventListener( 'MSPointerDown', mousedown, false );
		} else {
			node.addEventListener( 'mousedown', mousedown, false );
		}


		touchstart = function ( event ) {
			var currentTarget, x, y, touch, finger, move, up, cancel;

			if ( event.touches.length !== 1 ) {
				return;
			}

			touch = event.touches[0];

			x = touch.clientX;
			y = touch.clientY;
			currentTarget = this;

			finger = touch.identifier;

			up = function ( event ) {
				var touch;

				touch = event.changedTouches[0];
				if ( touch.identifier !== finger ) {
					cancel();
				}

				event.preventDefault();  // prevent compatibility mouse event

				// for the benefit of mobile Firefox and old Android browsers, we need this absurd hack.
				preventMousedownEvents = true;
				clearTimeout( preventMousedownTimeout );

				preventMousedownTimeout = setTimeout( function () {
					preventMousedownEvents = false;
				}, 400 );

				fire({
					node: currentTarget,
					original: event
				});

				cancel();
			};

			move = function ( event ) {
				var touch;

				if ( event.touches.length !== 1 || event.touches[0].identifier !== finger ) {
					cancel();
				}

				touch = event.touches[0];
				if ( ( Math.abs( touch.clientX - x ) >= distanceThreshold ) || ( Math.abs( touch.clientY - y ) >= distanceThreshold ) ) {
					cancel();
				}
			};

			cancel = function () {
				node.removeEventListener( 'touchend', up, false );
				window.removeEventListener( 'touchmove', move, false );
				window.removeEventListener( 'touchcancel', cancel, false );
			};

			node.addEventListener( 'touchend', up, false );
			window.addEventListener( 'touchmove', move, false );
			window.addEventListener( 'touchcancel', cancel, false );

			setTimeout( cancel, timeThreshold );
		};

		node.addEventListener( 'touchstart', touchstart, false );


		// native buttons, and <input type='button'> elements, should fire a tap event
		// when the space key is pressed
		if ( node.tagName === 'BUTTON' || node.type === 'button' ) {
			focusHandler = function () {
				var blurHandler, keydownHandler;

				keydownHandler = function ( event ) {
					if ( event.which === 32 ) { // space key
						fire({
							node: node,
							original: event
						});
					}
				};

				blurHandler = function () {
					node.removeEventListener( 'keydown', keydownHandler, false );
					node.removeEventListener( 'blur', blurHandler, false );
				};

				node.addEventListener( 'keydown', keydownHandler, false );
				node.addEventListener( 'blur', blurHandler, false );
			};

			node.addEventListener( 'focus', focusHandler, false );
		}


		return {
			teardown: function () {
				node.removeEventListener( 'pointerdown', mousedown, false );
				node.removeEventListener( 'MSPointerDown', mousedown, false );
				node.removeEventListener( 'mousedown', mousedown, false );
				node.removeEventListener( 'touchstart', touchstart, false );
				node.removeEventListener( 'focus', focusHandler, false );
			}
		};
	};

	Ractive.events.tap = tap;

}));
},{"ractive":51}],24:[function(require,module,exports){
var Logger = require('js-logger'),
    extend = require('underscore').extend,
    clone = require('underscore').clone,
    EventEmitter  = require('events').EventEmitter,
    AppDispatcher = require('../dispatcher/dispatcher'),
    Payload       = require('../constants/constants').Payload,
    ActionTypes   = require('../constants/constants').ActionTypes,
    ServicesStore = require('../stores/services');

var state = {};

function set(data) {
  data = data || {};
  state = clone(data);
  if (data.start) { state.start = new Date(data.start); }
  if (data.end)   { state.end   = new Date(data.end);   }
}

var Store = extend(new EventEmitter(), {
  getState: function () {
    return clone(state);
  },
  emitChange: function () {
    this.emit('change');
  },
  addChangeListener: function (callback) {
    this.on('change', callback);
  }
});

Store.dispatchToken = AppDispatcher.register(function (payload) {
  var source = payload.source,
      action = payload.action;

  switch(action.type) {
    case ActionTypes.RECEIVE_INITIAL_STATE:
      Logger.debug('Announcer: ', action.type, action.state);
      set(action.state.announcer);
      Store.emitChange();
      break;
    case ActionTypes.ANNOUNCER:
      Logger.debug('Announcer: ', action.type, action.state);
      if (source === Payload.SERVER_ACTION) {
        Logger.debug('Announcer: SERVER', action.type, action.state);
        set(action.state.data);
        Store.emitChange();
      } else {
        Logger.debug('Announcer: VIEW ACTION pre', state.isAnnouncing);
        state.isAnnouncing = !state.isAnnouncing;
        Logger.debug('Announcer: VIEW ACTION post', state.isAnnouncing);
        Store.emitChange();
      }
      break;
  }
});

module.exports = Store;
},{"../constants/constants":17,"../dispatcher/dispatcher":18,"../stores/services":32,"events":37,"js-logger":50,"underscore":52}],25:[function(require,module,exports){
var Logger = require('js-logger'),
    extend = require('underscore').extend,
    clone = require('underscore').clone,
    EventEmitter  = require('events').EventEmitter,
    AppDispatcher = require('../dispatcher/dispatcher'),
    Payload       = require('../constants/constants').Payload,
    ActionTypes   = require('../constants/constants').ActionTypes;

var state = {
  volume: null
};

var Store = extend(new EventEmitter(), {
  getState: function () {
    return clone(state);
  },
  emitChange: function () {
    this.emit('change');
  },
  addChangeListener: function (callback) {
    this.on('change', callback);
  }
});

Store.dispatchToken = AppDispatcher.register(function (payload) {
  var source = payload.source,
      action = payload.action;

  switch(action.type) {
    case ActionTypes.RECEIVE_INITIAL_STATE:
      state = action.state.audio;
      Store.emitChange();
      break;
    case ActionTypes.AUDIO:
      if (source === Payload.SERVER_ACTION) {
        Logger.debug('Audio: SERVER', action.type, action.state);
        state = action.state.data;
      } else {
        Logger.debug('Audio: CHANGE', action.type, action.state);
        state.volume = action.state.volume;
      }
      Store.emitChange();
      break;
  }
});

module.exports = Store;
},{"../constants/constants":17,"../dispatcher/dispatcher":18,"events":37,"js-logger":50,"underscore":52}],26:[function(require,module,exports){
var Logger = require('js-logger'),
    extend = require('underscore').extend,
    clone = require('underscore').clone,
    EventEmitter  = require('events').EventEmitter,
    AppDispatcher = require('../dispatcher/dispatcher'),
    Payload       = require('../constants/constants').Payload,
    ActionTypes   = require('../constants/constants').ActionTypes,
    ServicesStore = require('../stores/services');

var state = {};

function set(data) {
  state = clone(data);
  if (data.start) { state.start = new Date(data.start); }
  if (data.end)   { state.end   = new Date(data.end);   }
}

var Store = extend(new EventEmitter(), {
  getState: function () {
    return clone(state);
  },
  emitChange: function () {
    this.emit('change');
  },
  addChangeListener: function (callback) {
    this.on('change', callback);
  }
});

Store.dispatchToken = AppDispatcher.register(function (payload) {
  var source = payload.source,
      action = payload.action;

  switch(action.type) {
    case ActionTypes.RECEIVE_INITIAL_STATE:
      Logger.debug('Avoider: ', action.type, action.state);
      set(action.state.avoider);
      Store.emitChange();
      break;
    case ActionTypes.AVOIDER:
      Logger.debug('Avoider: ', action.type, action.state);
      if (source === Payload.SERVER_ACTION) {
        Logger.debug('Avoider: SERVER', action.type, action.state);
        set(action.state.data);
        Store.emitChange();
      } else {
        Logger.debug('Avoider: VIEW ACTION pre', state.isAvoiding);
        state.isAvoiding = !state.isAvoiding;
        Logger.debug('Avoider: VIEW ACTION post', state.isAvoiding);
        Store.emitChange();
      }
      break;
    case ActionTypes.RECEIVE_AVOIDER_SETTINGS:
      Logger.debug('Avoider Settings: ', action.type, action.state);
      if (source === Payload.SERVER_ACTION) {
        Logger.debug('Avoider: SERVER', action.type, action.state);
        state.settings = clone(action.state);
        Store.emitChange();
      }
      break;
    case ActionTypes.SETTINGS:
      if (source === Payload.SERVER_ACTION && action.state.topic === 'settings.avoider') {
        Logger.debug('Avoider: SERVER', action.type, action.state);
        state.settings = clone(action.state.data);
        Store.emitChange();
      }
      break;
  }
});

module.exports = Store;
},{"../constants/constants":17,"../dispatcher/dispatcher":18,"../stores/services":32,"events":37,"js-logger":50,"underscore":52}],27:[function(require,module,exports){
var Logger = require('js-logger'),
    extend = require('underscore').extend,
    clone = require('underscore').clone,
    EventEmitter  = require('events').EventEmitter,
    AppDispatcher = require('../dispatcher/dispatcher'),
    Payload       = require('../constants/constants').Payload,
    ActionTypes   = require('../constants/constants').ActionTypes,
    ServicesStore = require('../stores/services');

var currentServiceId = null;

var Store = extend(new EventEmitter(), {
  getCurrentId: function () {
    return currentServiceId;
  },
  getCurrent: function () {
    return ServicesStore.getService(currentServiceId);
  },
  emitChange: function () {
    this.emit('change');
  },
  addChangeListener: function (callback) {
    this.on('change', callback);
  }
});

Store.dispatchToken = AppDispatcher.register(function (payload) {
  var source = payload.source,
      action = payload.action;

  switch(action.type) {
    case ActionTypes.RECEIVE_INITIAL_STATE:
      Logger.debug('CurrentService: ', action.type, action.state);
      currentServiceId = action.state.current ? action.state.current.id : null;
      Store.emitChange();
      break;
    case ActionTypes.SERVICE:
      Logger.debug('CurrentService: ', action.type, action.state);
      if (source === Payload.SERVER_ACTION && action.state.topic === 'service.changed') {
        Logger.debug('CurrentService: SERVER', action.type, action.state);
        currentServiceId = action.state.data ? action.state.data.id : null;
      } else {
        Logger.debug('CurrentService: CHANGE', action.type, action.state);
        // state.volume = action.state.volume;
      }
      Store.emitChange();
      break;
  }
});

module.exports = Store;
},{"../constants/constants":17,"../dispatcher/dispatcher":18,"../stores/services":32,"events":37,"js-logger":50,"underscore":52}],28:[function(require,module,exports){
var Logger = require('js-logger'),
    extend = require('underscore').extend,
    clone  = require('underscore').clone,
    EventEmitter  = require('events').EventEmitter,
    AppDispatcher = require('../dispatcher/dispatcher'),
    CurrentServiceStore = require('../stores/current-service'),
    Payload   = require('../constants/constants').Payload,
    ActionTypes   = require('../constants/constants').ActionTypes;

var state = {};

function update(id, data) {
  Logger.debug('NowAndNext update', id, data)
  state[id] = data;
}

var Store = extend(new EventEmitter(), {
  get: function (id) {
    if (state[id]) {
      return clone(state[id]);
    }
  },
  emitChange: function (id) {
    this.emit('change', id);
  },
  addChangeListener: function (callback) {
    this.on('change', callback);
  }
});

Store.dispatchToken = AppDispatcher.register(function (payload) {
  var source = payload.source,
      action = payload.action;

  switch(action.type) {
    case ActionTypes.RECEIVE_INITIAL_STATE:
      AppDispatcher.waitFor([CurrentServiceStore.dispatchToken]);
      Logger.debug('NowAndNext', action.type, action.state);
      if (action.state.current && action.state.current.nowAndNext) {
        update(action.state.current.id, action.state.current.nowAndNext);
        Store.emitChange(action.state.current.id);
      }
      break;
    case ActionTypes.SERVICE:
      Logger.debug('NowAndNext: ', action.type, action.state);
      if (source === Payload.SERVER_ACTION) {
        AppDispatcher.waitFor([CurrentServiceStore.dispatchToken]);
        Logger.debug('NowAndNext: SERVER', action.type, action.state);
        if (action.state.data && action.state.data.nowAndNext) {
          update(action.state.data.id, action.state.data.nowAndNext);
          Store.emitChange(action.state.data.id);
        }
      }
      break;
    case ActionTypes.NOW_AND_NEXT:
      Logger.debug('NowAndNext: ', action.type, action.state);
      if (source === Payload.SERVER_ACTION) {
        Logger.debug('NowAndNext: SERVER', action.type, action.state);
        if (action.state.service && action.state.data) {
          update(action.state.service, action.state.data);
          Store.emitChange(action.state.service);
        }
      }
      break;
  }
});

module.exports = Store;
},{"../constants/constants":17,"../dispatcher/dispatcher":18,"../stores/current-service":27,"events":37,"js-logger":50,"underscore":52}],29:[function(require,module,exports){
var Logger = require('js-logger'),
    extend = require('underscore').extend,
    clone  = require('underscore').clone,
    EventEmitter  = require('events').EventEmitter,
    AppDispatcher = require('../dispatcher/dispatcher'),
    CurrentServiceStore = require('../stores/current-service'),
    Payload   = require('../constants/constants').Payload,
    ActionTypes   = require('../constants/constants').ActionTypes;

var state = {};

function update(id, data) {
  Logger.debug('NowPlaying update', id, data)
  state[id] = data;
}

var Store = extend(new EventEmitter(), {
  get: function (id) {
    if (state[id]) {
      return clone(state[id]);
    }
  },
  emitChange: function (id) {
    this.emit('change', id);
  },
  addChangeListener: function (callback) {
    this.on('change', callback);
  }
});

Store.dispatchToken = AppDispatcher.register(function (payload) {
  var source = payload.source,
      action = payload.action;

  switch(action.type) {
    case ActionTypes.RECEIVE_INITIAL_STATE:
      AppDispatcher.waitFor([CurrentServiceStore.dispatchToken]);
      Logger.debug('NowPlaying', action.type, action.state);
      if (action.state.current && action.state.current.nowPlaying) {
        update(action.state.current.id, action.state.current.nowPlaying);
        Store.emitChange(action.state.current.id);
      }
      break;
    case ActionTypes.SERVICE:
      Logger.debug('NowPlaying: ', action.type, action.state);
      if (source === Payload.SERVER_ACTION && action.state.topic === 'service.changed') {
        AppDispatcher.waitFor([CurrentServiceStore.dispatchToken]);
        Logger.debug('NowPlaying: SERVER', action.type, action.state);
        if (action.state.data && action.state.data.nowPlaying) {
          update(action.state.data.id, action.state.data.nowPlaying);
          Store.emitChange(action.state.data.id);
        }
      }
      break;
    case ActionTypes.NOW_PLAYING:
      Logger.debug('NowPlaying: ', action.type, action.state);
      if (source === Payload.SERVER_ACTION) {
        Logger.debug('NowPlaying: SERVER', action.type, action.state);
        if (action.state.service && action.state.data) {
          update(action.state.service, action.state.data);
          Store.emitChange(action.state.service);
        }
      }
      break;
  }
});

module.exports = Store;
},{"../constants/constants":17,"../dispatcher/dispatcher":18,"../stores/current-service":27,"events":37,"js-logger":50,"underscore":52}],30:[function(require,module,exports){
var Logger = require('js-logger'),
    extend = require('underscore').extend,
    clone = require('underscore').clone,
    EventEmitter  = require('events').EventEmitter,
    AppDispatcher = require('../dispatcher/dispatcher'),
    ActionTypes   = require('../constants/constants').ActionTypes,
    Payload       = require('../constants/constants').Payload;

var state = {
  isOn: null
};

var Power = extend(new EventEmitter(), {
  getState: function () {
    return clone(state);
  },
  emitChange: function () {
    this.emit('change');
  },
  addChangeListener: function (callback) {
    this.on('change', callback);
  }
});

Power.dispatchToken = AppDispatcher.register(function (payload) {
  var source = payload.source,
      action = payload.action;

  switch(action.type) {
    case ActionTypes.RECEIVE_INITIAL_STATE:
      Logger.debug('Power: RECEIVE_INITIAL_STATE', action.type, action.state.power);
      state = action.state.power;
      Power.emitChange();
      break;
    case ActionTypes.POWER:
      if (source === Payload.SERVER_ACTION) {
        Logger.debug('Power: SERVER', action.type, action.state.data);
        state = action.state.data;
      } else {
        state.isOn = !state.isOn;
      }
      Power.emitChange();
      break;
  }
});

module.exports = Power;
},{"../constants/constants":17,"../dispatcher/dispatcher":18,"events":37,"js-logger":50,"underscore":52}],31:[function(require,module,exports){
var Logger = require('js-logger'),
    extend = require('underscore').extend,
    clone = require('underscore').clone,
    without = require('underscore').without,
    EventEmitter  = require('events').EventEmitter,
    AppDispatcher = require('../dispatcher/dispatcher'),
    Payload       = require('../constants/constants').Payload,
    ActionTypes   = require('../constants/constants').ActionTypes,
    ServicesStore = require('../stores/services');

var state = {};

var Store = extend(new EventEmitter(), {
  togglePreferredService: function (serviceId) {
    if (state.preferredServices && state.preferredServices.indexOf(serviceId) > -1) {
      state.preferredServices = without(state.preferredServices, serviceId);
    } else {
      state.preferredServices.push(serviceId);
    }
  },
  getState: function () {
    return clone(state);
  },
  emitChange: function () {
    this.emit('change');
  },
  addChangeListener: function (callback) {
    this.on('change', callback);
  }
});

Store.dispatchToken = AppDispatcher.register(function (payload) {
  var source = payload.source,
      action = payload.action;

  switch(action.type) {
    case ActionTypes.RECEIVE_RADIO_SETTINGS:
      Logger.debug('Radio Settings: ', action.type, action.state);
      if (source === Payload.SERVER_ACTION) {
        Logger.debug('Radio Settings: SERVER', action.type, action.state);
        state = clone(action.state);
        Store.emitChange();
      }
      break;
    case ActionTypes.SETTINGS:
      if (source === Payload.SERVER_ACTION && action.state.topic === 'settings.radio') {
        Logger.debug('Radio Settings: SERVER', action.type, action.state);
        state = clone(action.state.data);
        Store.emitChange();
      }
      break;
  }
});

module.exports = Store;
},{"../constants/constants":17,"../dispatcher/dispatcher":18,"../stores/services":32,"events":37,"js-logger":50,"underscore":52}],32:[function(require,module,exports){
var Logger = require('js-logger'),
    extend = require('underscore').extend,
    clone  = require('underscore').clone,
    EventEmitter  = require('events').EventEmitter,
    AppDispatcher = require('../dispatcher/dispatcher'),
    ActionTypes   = require('../constants/constants').ActionTypes;

var services = {};

function addService(data) {
  if (data.id) {
    services[data.id] = data;
  }
}

var Store = extend(new EventEmitter(), {
  getAllServicesAsArray: function () {
    return Object.keys(services).map(Store.getService);
  },
  getAllServices: function () {
    return clone(services);
  },
  getService: function (id) {
    if (services[id]) {
      return clone(services[id]);
    }
  },
  emitChange: function () {
    this.emit('change');
  },
  addChangeListener: function (callback) {
    this.on('change', callback);
  }
});

Store.dispatchToken = AppDispatcher.register(function (payload) {
  var action = payload.action;

  switch(action.type) {
    case ActionTypes.RECEIVE_INITIAL_STATE:
      Logger.debug('Services', action.type, action.state.services);
      action.state.services.forEach(addService);
      Store.emitChange();
      break;
  }
});

module.exports = Store;
},{"../constants/constants":17,"../dispatcher/dispatcher":18,"events":37,"js-logger":50,"underscore":52}],33:[function(require,module,exports){
/* jshint white: false, latedef: nofunc, browser: true, devel: true */
'use strict';

var _ = require('underscore'),
    Logger = require('js-logger');

module.exports = {
  merge: _.extend,
  clone: _.clone,
  /*
    Object comparison helpers
  */
  hasDifferentProperties: function hasDifferentProperties(first, second) {
    return Object.keys(first).some(
      function (key) {
        var firstProp  = first[key],
            secondProp = second[key];
        return firstProp !== secondProp;
      }
    );
  },
  /*
    Generic promise success or failure options
  */
  success: function success(msg) {
    return function (content) {
      Logger.debug(msg, 'success', content);
    };
  },
  failure: function failure(msg) {
    return function (err) {
      Logger.warn(msg, 'failure', err.stack);
    };
  },
  /*
    Returns a function that will toggle the state of 
    `ui.panels.<panelId>.isOpen` each time it's executed
  */
  createPanelToggleHandler: function createPanelToggleHandler(panelId) {
    var keypath = 'ui.panels.' + panelId + '.isOpen';
    return function (/* evt */) {
      var isOpen = this.get(keypath);
      this.set(keypath, !isOpen);
    };
  },
  debounce: function debounce(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  },
  throttle: function throttle(fn, threshhold, scope) {
    threshhold = threshhold || (threshhold = 250);
    var last,
        deferTimer;
    return function () {
      var context = scope || this;

      var now = +new Date(),
          args = arguments;
      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  }
};

},{"js-logger":50,"underscore":52}],34:[function(require,module,exports){
var ServerActionCreators = require('../actions/server-action-creators'),
    xhr = require('../xhr');

module.exports = {
  getInitialState: function () {
    return xhr.get('/radio/state.json')
       .then(function (data) {
          try {
            var json = JSON.parse(data);
          } catch (err) {
            // Handle error
          }

          ServerActionCreators.receiveInitialState(json);

          return json;
       });
  },
  connectEventStream: function () {
    var events = new EventSource('/events');
    events.addEventListener('message', function (evt) {
      var content = JSON.parse(evt.data);
      ServerActionCreators.receiveStateUpdate(content);
    });
  }
}
},{"../actions/server-action-creators":1,"../xhr":36}],35:[function(require,module,exports){
var Logger = require('js-logger'),
    Ractive = require('ractive'),
    Promise = require('es6-promise').Promise,
    throttle = require('./utils').throttle;

/*
  Ractive plugins
*/
require('./lib/ractive-events-tap');

var StateActionCreators = require('./actions/state-action-creators');

var ractive;

module.exports = {
  init: function () {
    var container = document.querySelector('[data-ui-container]'),
        template  = document.querySelector('[data-ui-template]#mainTmpl').innerText;

    return new Promise(function (resolve, reject) {
      ractive = new Ractive({
        el        : container,
        template  : template,
        // adapt     : [ 'Backbone' ],
        debug     : true,
        twoway    : false,
        data      : {
          // radio: radioModel,
          // services: radioModel.get('services'),
          mainView: 'controls'
        },
        complete  : function () {
          this.on({
            'power': function (evt) {
              evt.original.preventDefault();
              StateActionCreators.togglePower();
            },
            'volume-slider-changed': throttle(function (evt) {
              var value = evt.node.value;
              StateActionCreators.changeVolume(value);
            }, 1000),
            'tune-service': function (serviceId) {
              StateActionCreators.changeService(serviceId);
            },
            'avoid': function () {
              StateActionCreators.toggleAvoider();
            },
            'avoider-settings-requested': function () {
              StateActionCreators.requestAvoiderSettings();
            },
            'avoider-settings-changed': function (newValue) {
              StateActionCreators.avoiderSettings(newValue);
            },
            'announce': function () {
              StateActionCreators.toggleAnnouncer();
            },
            'settings-panel-requested': function () {
              Logger.debug('settings-panel-requested');
              StateActionCreators.requestRadioSettings();
              this.set('mainView', (this.get('mainView') === 'settings') ? 'controls' : 'settings');
            },
            'preferred-service-changed': function (serviceId) {
              Logger.debug('preferred-service-changed', serviceId);
              StateActionCreators.toggleRadioSettingPreferredServer(serviceId);
            }
          });

          Logger.debug('splashStartTime - now = %oms', (Date.now() - splashStartTime));
          resolve();
        },
        components: {
          // Main Views
          Standby : require('./components/simple')('#standbyTmpl'),
          Controls: require('./components/controls'),
          RadioSettings: require('./components/simple')('#settingsTmpl'),
          // Components
          Masthead: require('./components/simple')('#mastheadTmpl')
        }
      });
    });
  },
  set: function (keypath, payload) {
    Logger.debug('VIEW ', keypath, payload);
    ractive.set(keypath, payload);
  }
}
},{"./actions/state-action-creators":2,"./components/controls":13,"./components/simple":16,"./lib/ractive-events-tap":23,"./utils":33,"es6-promise":39,"js-logger":50,"ractive":51}],36:[function(require,module,exports){
/* jshint white: false, latedef: nofunc, browser: true, devel: true */
'use strict';

var Promise = Promise || require('es6-promise').Promise;

module.exports = xhr;

['get', 'delete', 'post', 'put'].forEach(function (method) {
  module.exports[method] = function() {
    var args = Array.prototype.slice.call(arguments),
        newArgs = [method].concat(args);

    return xhr.apply(null, newArgs);
  };
});

/*
  XHR implementation from:
    http://www.html5rocks.com/en/tutorials/es6/promises/#toc-promisifying-xmlhttprequest
*/
function xhr(method, url, opts) {
  opts = opts || {};

  method = method ? method.toUpperCase() : 'GET';
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    req.open(method, url);

    // Send headers
    if (opts.headers) {
      Object.keys(opts.headers).forEach(function (header) {
        req.setRequestHeader(header, opts.headers[header]);
      });
    }

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status === 200) {
        // Resolve the promise with the response text
        resolve(req.response);
      }
      else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(new Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(new Error('Network Error'));
    };

    // Make the request
    req.send(opts.data);
  });
}

},{"es6-promise":39}],37:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],38:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],39:[function(require,module,exports){
"use strict";
var Promise = require("./promise/promise").Promise;
var polyfill = require("./promise/polyfill").polyfill;
exports.Promise = Promise;
exports.polyfill = polyfill;
},{"./promise/polyfill":44,"./promise/promise":45}],40:[function(require,module,exports){
"use strict";
/* global toString */

var isArray = require("./utils").isArray;
var isFunction = require("./utils").isFunction;

/**
  Returns a promise that is fulfilled when all the given promises have been
  fulfilled, or rejected if any of them become rejected. The return promise
  is fulfilled with an array that gives all the values in the order they were
  passed in the `promises` array argument.

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.resolve(2);
  var promise3 = RSVP.resolve(3);
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `RSVP.all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  var promise1 = RSVP.resolve(1);
  var promise2 = RSVP.reject(new Error("2"));
  var promise3 = RSVP.reject(new Error("3"));
  var promises = [ promise1, promise2, promise3 ];

  RSVP.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @for RSVP
  @param {Array} promises
  @param {String} label
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
*/
function all(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to all.');
  }

  return new Promise(function(resolve, reject) {
    var results = [], remaining = promises.length,
    promise;

    if (remaining === 0) {
      resolve([]);
    }

    function resolver(index) {
      return function(value) {
        resolveAll(index, value);
      };
    }

    function resolveAll(index, value) {
      results[index] = value;
      if (--remaining === 0) {
        resolve(results);
      }
    }

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && isFunction(promise.then)) {
        promise.then(resolver(i), reject);
      } else {
        resolveAll(i, promise);
      }
    }
  });
}

exports.all = all;
},{"./utils":49}],41:[function(require,module,exports){
(function (process,global){
"use strict";
var browserGlobal = (typeof window !== 'undefined') ? window : {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var local = (typeof global !== 'undefined') ? global : (this === undefined? window:this);

// node
function useNextTick() {
  return function() {
    process.nextTick(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function() {
    node.data = (iterations = ++iterations % 2);
  };
}

function useSetTimeout() {
  return function() {
    local.setTimeout(flush, 1);
  };
}

var queue = [];
function flush() {
  for (var i = 0; i < queue.length; i++) {
    var tuple = queue[i];
    var callback = tuple[0], arg = tuple[1];
    callback(arg);
  }
  queue = [];
}

var scheduleFlush;

// Decide what async method to use to triggering processing of queued callbacks:
if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else {
  scheduleFlush = useSetTimeout();
}

function asap(callback, arg) {
  var length = queue.push([callback, arg]);
  if (length === 1) {
    // If length is 1, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    scheduleFlush();
  }
}

exports.asap = asap;
}).call(this,require("FWaASH"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"FWaASH":38}],42:[function(require,module,exports){
"use strict";
/**
  `RSVP.Promise.cast` returns the same promise if that promise shares a constructor
  with the promise being casted.

  Example:

  ```javascript
  var promise = RSVP.resolve(1);
  var casted = RSVP.Promise.cast(promise);

  console.log(promise === casted); // true
  ```

  In the case of a promise whose constructor does not match, it is assimilated.
  The resulting promise will fulfill or reject based on the outcome of the
  promise being casted.

  In the case of a non-promise, a promise which will fulfill with that value is
  returned.

  Example:

  ```javascript
  var value = 1; // could be a number, boolean, string, undefined...
  var casted = RSVP.Promise.cast(value);

  console.log(value === casted); // false
  console.log(casted instanceof RSVP.Promise) // true

  casted.then(function(val) {
    val === value // => true
  });
  ```

  `RSVP.Promise.cast` is similar to `RSVP.resolve`, but `RSVP.Promise.cast` differs in the
  following ways:
  * `RSVP.Promise.cast` serves as a memory-efficient way of getting a promise, when you
  have something that could either be a promise or a value. RSVP.resolve
  will have the same effect but will create a new promise wrapper if the
  argument is a promise.
  * `RSVP.Promise.cast` is a way of casting incoming thenables or promise subclasses to
  promises of the exact class specified, so that the resulting object's `then` is
  ensured to have the behavior of the constructor you are calling cast on (i.e., RSVP.Promise).

  @method cast
  @for RSVP
  @param {Object} object to be casted
  @return {Promise} promise that is fulfilled when all properties of `promises`
  have been fulfilled, or rejected if any of them become rejected.
*/


function cast(object) {
  /*jshint validthis:true */
  if (object && typeof object === 'object' && object.constructor === this) {
    return object;
  }

  var Promise = this;

  return new Promise(function(resolve) {
    resolve(object);
  });
}

exports.cast = cast;
},{}],43:[function(require,module,exports){
"use strict";
var config = {
  instrument: false
};

function configure(name, value) {
  if (arguments.length === 2) {
    config[name] = value;
  } else {
    return config[name];
  }
}

exports.config = config;
exports.configure = configure;
},{}],44:[function(require,module,exports){
(function (global){
"use strict";
/*global self*/
var RSVPPromise = require("./promise").Promise;
var isFunction = require("./utils").isFunction;

function polyfill() {
  var local;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof window !== 'undefined' && window.document) {
    local = window;
  } else {
    local = self;
  }

  var es6PromiseSupport = 
    "Promise" in local &&
    // Some of these methods are missing from
    // Firefox/Chrome experimental implementations
    "cast" in local.Promise &&
    "resolve" in local.Promise &&
    "reject" in local.Promise &&
    "all" in local.Promise &&
    "race" in local.Promise &&
    // Older version of the spec had a resolver object
    // as the arg rather than a function
    (function() {
      var resolve;
      new local.Promise(function(r) { resolve = r; });
      return isFunction(resolve);
    }());

  if (!es6PromiseSupport) {
    local.Promise = RSVPPromise;
  }
}

exports.polyfill = polyfill;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./promise":45,"./utils":49}],45:[function(require,module,exports){
"use strict";
var config = require("./config").config;
var configure = require("./config").configure;
var objectOrFunction = require("./utils").objectOrFunction;
var isFunction = require("./utils").isFunction;
var now = require("./utils").now;
var cast = require("./cast").cast;
var all = require("./all").all;
var race = require("./race").race;
var staticResolve = require("./resolve").resolve;
var staticReject = require("./reject").reject;
var asap = require("./asap").asap;

var counter = 0;

config.async = asap; // default async is asap;

function Promise(resolver) {
  if (!isFunction(resolver)) {
    throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
  }

  if (!(this instanceof Promise)) {
    throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
  }

  this._subscribers = [];

  invokeResolver(resolver, this);
}

function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value, error, succeeded, failed;

  if (hasCallback) {
    try {
      value = callback(detail);
      succeeded = true;
    } catch(e) {
      failed = true;
      error = e;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (handleThenable(promise, value)) {
    return;
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (failed) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    resolve(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

var PENDING   = void 0;
var SEALED    = 0;
var FULFILLED = 1;
var REJECTED  = 2;

function subscribe(parent, child, onFulfillment, onRejection) {
  var subscribers = parent._subscribers;
  var length = subscribers.length;

  subscribers[length] = child;
  subscribers[length + FULFILLED] = onFulfillment;
  subscribers[length + REJECTED]  = onRejection;
}

function publish(promise, settled) {
  var child, callback, subscribers = promise._subscribers, detail = promise._detail;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    invokeCallback(settled, child, callback, detail);
  }

  promise._subscribers = null;
}

Promise.prototype = {
  constructor: Promise,

  _state: undefined,
  _detail: undefined,
  _subscribers: undefined,

  then: function(onFulfillment, onRejection) {
    var promise = this;

    var thenPromise = new this.constructor(function() {});

    if (this._state) {
      var callbacks = arguments;
      config.async(function invokePromiseCallback() {
        invokeCallback(promise._state, thenPromise, callbacks[promise._state - 1], promise._detail);
      });
    } else {
      subscribe(this, thenPromise, onFulfillment, onRejection);
    }

    return thenPromise;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = all;
Promise.cast = cast;
Promise.race = race;
Promise.resolve = staticResolve;
Promise.reject = staticReject;

function handleThenable(promise, value) {
  var then = null,
  resolved;

  try {
    if (promise === value) {
      throw new TypeError("A promises callback cannot return that same promise.");
    }

    if (objectOrFunction(value)) {
      then = value.then;

      if (isFunction(then)) {
        then.call(value, function(val) {
          if (resolved) { return true; }
          resolved = true;

          if (value !== val) {
            resolve(promise, val);
          } else {
            fulfill(promise, val);
          }
        }, function(val) {
          if (resolved) { return true; }
          resolved = true;

          reject(promise, val);
        });

        return true;
      }
    }
  } catch (error) {
    if (resolved) { return true; }
    reject(promise, error);
    return true;
  }

  return false;
}

function resolve(promise, value) {
  if (promise === value) {
    fulfill(promise, value);
  } else if (!handleThenable(promise, value)) {
    fulfill(promise, value);
  }
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = value;

  config.async(publishFulfillment, promise);
}

function reject(promise, reason) {
  if (promise._state !== PENDING) { return; }
  promise._state = SEALED;
  promise._detail = reason;

  config.async(publishRejection, promise);
}

function publishFulfillment(promise) {
  publish(promise, promise._state = FULFILLED);
}

function publishRejection(promise) {
  publish(promise, promise._state = REJECTED);
}

exports.Promise = Promise;
},{"./all":40,"./asap":41,"./cast":42,"./config":43,"./race":46,"./reject":47,"./resolve":48,"./utils":49}],46:[function(require,module,exports){
"use strict";
/* global toString */
var isArray = require("./utils").isArray;

/**
  `RSVP.race` allows you to watch a series of promises and act as soon as the
  first promise given to the `promises` argument fulfills or rejects.

  Example:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 2");
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // result === "promise 2" because it was resolved before promise1
    // was resolved.
  });
  ```

  `RSVP.race` is deterministic in that only the state of the first completed
  promise matters. For example, even if other promises given to the `promises`
  array argument are resolved, but the first completed promise has become
  rejected before the other promises became fulfilled, the returned promise
  will become rejected:

  ```javascript
  var promise1 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      resolve("promise 1");
    }, 200);
  });

  var promise2 = new RSVP.Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error("promise 2"));
    }, 100);
  });

  RSVP.race([promise1, promise2]).then(function(result){
    // Code here never runs because there are rejected promises!
  }, function(reason){
    // reason.message === "promise2" because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  @method race
  @for RSVP
  @param {Array} promises array of promises to observe
  @param {String} label optional string for describing the promise returned.
  Useful for tooling.
  @return {Promise} a promise that becomes fulfilled with the value the first
  completed promises is resolved with if the first completed promise was
  fulfilled, or rejected with the reason that the first completed promise
  was rejected with.
*/
function race(promises) {
  /*jshint validthis:true */
  var Promise = this;

  if (!isArray(promises)) {
    throw new TypeError('You must pass an array to race.');
  }
  return new Promise(function(resolve, reject) {
    var results = [], promise;

    for (var i = 0; i < promises.length; i++) {
      promise = promises[i];

      if (promise && typeof promise.then === 'function') {
        promise.then(resolve, reject);
      } else {
        resolve(promise);
      }
    }
  });
}

exports.race = race;
},{"./utils":49}],47:[function(require,module,exports){
"use strict";
/**
  `RSVP.reject` returns a promise that will become rejected with the passed
  `reason`. `RSVP.reject` is essentially shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @for RSVP
  @param {Any} reason value that the returned promise will be rejected with.
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become rejected with the given
  `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Promise = this;

  return new Promise(function (resolve, reject) {
    reject(reason);
  });
}

exports.reject = reject;
},{}],48:[function(require,module,exports){
"use strict";
/**
  `RSVP.resolve` returns a promise that will become fulfilled with the passed
  `value`. `RSVP.resolve` is essentially shorthand for the following:

  ```javascript
  var promise = new RSVP.Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  var promise = RSVP.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @for RSVP
  @param {Any} value value that the returned promise will be resolved with
  @param {String} label optional string for identifying the returned promise.
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(value) {
  /*jshint validthis:true */
  var Promise = this;
  return new Promise(function(resolve, reject) {
    resolve(value);
  });
}

exports.resolve = resolve;
},{}],49:[function(require,module,exports){
"use strict";
function objectOrFunction(x) {
  return isFunction(x) || (typeof x === "object" && x !== null);
}

function isFunction(x) {
  return typeof x === "function";
}

function isArray(x) {
  return Object.prototype.toString.call(x) === "[object Array]";
}

// Date.now is not available in browsers < IE9
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#Compatibility
var now = Date.now || function() { return new Date().getTime(); };


exports.objectOrFunction = objectOrFunction;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.now = now;
},{}],50:[function(require,module,exports){
/*!
 * js-logger - http://github.com/jonnyreeves/js-logger 
 * Jonny Reeves, http://jonnyreeves.co.uk/
 * js-logger may be freely distributed under the MIT license. 
 */

/*jshint sub:true*/
/*global console:true,define:true, module:true*/
(function (global) {
	"use strict";

	// Top level module for the global, static logger instance.
	var Logger = { };
	
	// For those that are at home that are keeping score.
	Logger.VERSION = "0.9.14";
	
	// Function which handles all incoming log messages.
	var logHandler;
	
	// Map of ContextualLogger instances by name; used by Logger.get() to return the same named instance.
	var contextualLoggersByNameMap = {};
	
	// Polyfill for ES5's Function.bind.
	var bind = function(scope, func) {
		return function() {
			return func.apply(scope, arguments);
		};
	};

	// Super exciting object merger-matron 9000 adding another 100 bytes to your download.
	var merge = function () {
		var args = arguments, target = args[0], key, i;
		for (i = 1; i < args.length; i++) {
			for (key in args[i]) {
				if (!(key in target) && args[i].hasOwnProperty(key)) {
					target[key] = args[i][key];
				}
			}
		}
		return target;
	};

	// Helper to define a logging level object; helps with optimisation.
	var defineLogLevel = function(value, name) {
		return { value: value, name: name };
	};

	// Predefined logging levels.
	Logger.DEBUG = defineLogLevel(1, 'DEBUG');
	Logger.INFO = defineLogLevel(2, 'INFO');
	Logger.WARN = defineLogLevel(4, 'WARN');
	Logger.ERROR = defineLogLevel(8, 'ERROR');
	Logger.OFF = defineLogLevel(99, 'OFF');

	// Inner class which performs the bulk of the work; ContextualLogger instances can be configured independently
	// of each other.
	var ContextualLogger = function(defaultContext) {
		this.context = defaultContext;
		this.setLevel(defaultContext.filterLevel);
		this.log = this.info;  // Convenience alias.
	};

	ContextualLogger.prototype = {
		// Changes the current logging level for the logging instance.
		setLevel: function (newLevel) {
			// Ensure the supplied Level object looks valid.
			if (newLevel && "value" in newLevel) {
				this.context.filterLevel = newLevel;
			}
		},

		// Is the logger configured to output messages at the supplied level?
		enabledFor: function (lvl) {
			var filterLevel = this.context.filterLevel;
			return lvl.value >= filterLevel.value;
		},

		debug: function () {
			this.invoke(Logger.DEBUG, arguments);
		},

		info: function () {
			this.invoke(Logger.INFO, arguments);
		},

		warn: function () {
			this.invoke(Logger.WARN, arguments);
		},

		error: function () {
			this.invoke(Logger.ERROR, arguments);
		},

		// Invokes the logger callback if it's not being filtered.
		invoke: function (level, msgArgs) {
			if (logHandler && this.enabledFor(level)) {
				logHandler(msgArgs, merge({ level: level }, this.context));
			}
		}
	};

	// Protected instance which all calls to the to level `Logger` module will be routed through.
	var globalLogger = new ContextualLogger({ filterLevel: Logger.OFF });

	// Configure the global Logger instance.
	(function() {
		// Shortcut for optimisers.
		var L = Logger;

		L.enabledFor = bind(globalLogger, globalLogger.enabledFor);
		L.debug = bind(globalLogger, globalLogger.debug);
		L.info = bind(globalLogger, globalLogger.info);
		L.warn = bind(globalLogger, globalLogger.warn);
		L.error = bind(globalLogger, globalLogger.error);

		// Don't forget the convenience alias!
		L.log = L.info;
	}());

	// Set the global logging handler.  The supplied function should expect two arguments, the first being an arguments
	// object with the supplied log messages and the second being a context object which contains a hash of stateful
	// parameters which the logging function can consume.
	Logger.setHandler = function (func) {
		logHandler = func;
	};

	// Sets the global logging filter level which applies to *all* previously registered, and future Logger instances.
	// (note that named loggers (retrieved via `Logger.get`) can be configured independently if required).
	Logger.setLevel = function(level) {
		// Set the globalLogger's level.
		globalLogger.setLevel(level);

		// Apply this level to all registered contextual loggers.
		for (var key in contextualLoggersByNameMap) {
			if (contextualLoggersByNameMap.hasOwnProperty(key)) {
				contextualLoggersByNameMap[key].setLevel(level);
			}
		}
	};

	// Retrieve a ContextualLogger instance.  Note that named loggers automatically inherit the global logger's level,
	// default context and log handler.
	Logger.get = function (name) {
		// All logger instances are cached so they can be configured ahead of use.
		return contextualLoggersByNameMap[name] ||
			(contextualLoggersByNameMap[name] = new ContextualLogger(merge({ name: name }, globalLogger.context)));
	};

	// Configure and example a Default implementation which writes to the `window.console` (if present).
	Logger.useDefaults = function(defaultLevel) {
		// Check for the presence of a logger.
		if (typeof console === "undefined") {
			return;
		}

		Logger.setLevel(defaultLevel || Logger.DEBUG);
		Logger.setHandler(function(messages, context) {
			var hdlr = console.log;

			// Prepend the logger's name to the log message for easy identification.
			if (context.name) {
				messages[0] = "[" + context.name + "] " + messages[0];
			}

			// Delegate through to custom warn/error loggers if present on the console.
			if (context.level === Logger.WARN && console.warn) {
				hdlr = console.warn;
			} else if (context.level === Logger.ERROR && console.error) {
				hdlr = console.error;
			} else if (context.level === Logger.INFO && console.info) {
				hdlr = console.info;
			}

			// Support for IE8+ (and other, slightly more sane environments)
			Function.prototype.apply.call(hdlr, console, messages);
		});
	};

	// Export to popular environments boilerplate.
	if (typeof define === 'function' && define.amd) {
		define(Logger);
	}
	else if (typeof module !== 'undefined' && module.exports) {
		module.exports = Logger;
	}
	else {
		Logger._prevLogger = global.Logger;

		Logger.noConflict = function () {
			global.Logger = Logger._prevLogger;
			return Logger;
		};

		global.Logger = Logger;
    }
}(this));
},{}],51:[function(require,module,exports){
/*
	ractive.js v0.5.5
	2014-07-13 - commit 8b1d34ef 

	http://ractivejs.org
	http://twitter.com/RactiveJS

	Released under the MIT License.
*/

( function( global ) {

	'use strict';

	var noConflict = global.Ractive;

	/* config/defaults/options.js */
	var options = function() {

		// These are both the values for Ractive.defaults
		// as well as the determination for whether an option
		// value will be placed on Component.defaults
		// (versus directly on Component) during an extend operation
		var defaultOptions = {
			// render placement:
			el: void 0,
			append: false,
			// template:
			template: {
				v: 1,
				t: []
			},
			// parse:
			preserveWhitespace: false,
			sanitize: false,
			stripComments: true,
			// data & binding:
			data: {},
			computed: {},
			magic: false,
			modifyArrays: true,
			adapt: [],
			isolated: false,
			twoway: true,
			lazy: false,
			// transitions:
			noIntro: false,
			transitionsEnabled: true,
			complete: void 0,
			// css:
			noCssTransform: false,
			// debug:
			debug: false
		};
		return defaultOptions;
	}();

	/* config/defaults/easing.js */
	var easing = {
		linear: function( pos ) {
			return pos;
		},
		easeIn: function( pos ) {
			return Math.pow( pos, 3 );
		},
		easeOut: function( pos ) {
			return Math.pow( pos - 1, 3 ) + 1;
		},
		easeInOut: function( pos ) {
			if ( ( pos /= 0.5 ) < 1 ) {
				return 0.5 * Math.pow( pos, 3 );
			}
			return 0.5 * ( Math.pow( pos - 2, 3 ) + 2 );
		}
	};

	/* circular.js */
	var circular = [];

	/* utils/hasOwnProperty.js */
	var hasOwn = Object.prototype.hasOwnProperty;

	/* utils/isArray.js */
	var isArray = function() {

		var toString = Object.prototype.toString;
		// thanks, http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
		return function( thing ) {
			return toString.call( thing ) === '[object Array]';
		};
	}();

	/* utils/isObject.js */
	var isObject = function() {

		var toString = Object.prototype.toString;
		return function( thing ) {
			return thing && toString.call( thing ) === '[object Object]';
		};
	}();

	/* utils/isNumeric.js */
	var isNumeric = function( thing ) {
		return !isNaN( parseFloat( thing ) ) && isFinite( thing );
	};

	/* config/defaults/interpolators.js */
	var interpolators = function( circular, hasOwnProperty, isArray, isObject, isNumeric ) {

		var interpolators, interpolate, cssLengthPattern;
		circular.push( function() {
			interpolate = circular.interpolate;
		} );
		cssLengthPattern = /^([+-]?[0-9]+\.?(?:[0-9]+)?)(px|em|ex|%|in|cm|mm|pt|pc)$/;
		interpolators = {
			number: function( from, to ) {
				var delta;
				if ( !isNumeric( from ) || !isNumeric( to ) ) {
					return null;
				}
				from = +from;
				to = +to;
				delta = to - from;
				if ( !delta ) {
					return function() {
						return from;
					};
				}
				return function( t ) {
					return from + t * delta;
				};
			},
			array: function( from, to ) {
				var intermediate, interpolators, len, i;
				if ( !isArray( from ) || !isArray( to ) ) {
					return null;
				}
				intermediate = [];
				interpolators = [];
				i = len = Math.min( from.length, to.length );
				while ( i-- ) {
					interpolators[ i ] = interpolate( from[ i ], to[ i ] );
				}
				// surplus values - don't interpolate, but don't exclude them either
				for ( i = len; i < from.length; i += 1 ) {
					intermediate[ i ] = from[ i ];
				}
				for ( i = len; i < to.length; i += 1 ) {
					intermediate[ i ] = to[ i ];
				}
				return function( t ) {
					var i = len;
					while ( i-- ) {
						intermediate[ i ] = interpolators[ i ]( t );
					}
					return intermediate;
				};
			},
			object: function( from, to ) {
				var properties, len, interpolators, intermediate, prop;
				if ( !isObject( from ) || !isObject( to ) ) {
					return null;
				}
				properties = [];
				intermediate = {};
				interpolators = {};
				for ( prop in from ) {
					if ( hasOwnProperty.call( from, prop ) ) {
						if ( hasOwnProperty.call( to, prop ) ) {
							properties.push( prop );
							interpolators[ prop ] = interpolate( from[ prop ], to[ prop ] );
						} else {
							intermediate[ prop ] = from[ prop ];
						}
					}
				}
				for ( prop in to ) {
					if ( hasOwnProperty.call( to, prop ) && !hasOwnProperty.call( from, prop ) ) {
						intermediate[ prop ] = to[ prop ];
					}
				}
				len = properties.length;
				return function( t ) {
					var i = len,
						prop;
					while ( i-- ) {
						prop = properties[ i ];
						intermediate[ prop ] = interpolators[ prop ]( t );
					}
					return intermediate;
				};
			},
			cssLength: function( from, to ) {
				var fromMatch, toMatch, fromUnit, toUnit, fromValue, toValue, unit, delta;
				if ( from !== 0 && typeof from !== 'string' || to !== 0 && typeof to !== 'string' ) {
					return null;
				}
				fromMatch = cssLengthPattern.exec( from );
				toMatch = cssLengthPattern.exec( to );
				fromUnit = fromMatch ? fromMatch[ 2 ] : '';
				toUnit = toMatch ? toMatch[ 2 ] : '';
				if ( fromUnit && toUnit && fromUnit !== toUnit ) {
					return null;
				}
				unit = fromUnit || toUnit;
				fromValue = fromMatch ? +fromMatch[ 1 ] : 0;
				toValue = toMatch ? +toMatch[ 1 ] : 0;
				delta = toValue - fromValue;
				if ( !delta ) {
					return function() {
						return fromValue + unit;
					};
				}
				return function( t ) {
					return fromValue + t * delta + unit;
				};
			}
		};
		return interpolators;
	}( circular, hasOwn, isArray, isObject, isNumeric );

	/* config/svg.js */
	var svg = function() {

		var svg;
		if ( typeof document === 'undefined' ) {
			svg = false;
		} else {
			svg = document && document.implementation.hasFeature( 'http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1' );
		}
		return svg;
	}();

	/* utils/removeFromArray.js */
	var removeFromArray = function( array, member ) {
		var index = array.indexOf( member );
		if ( index !== -1 ) {
			array.splice( index, 1 );
		}
	};

	/* utils/Promise.js */
	var Promise = function() {

		var _Promise, PENDING = {},
			FULFILLED = {},
			REJECTED = {};
		if ( typeof Promise === 'function' ) {
			// use native Promise
			_Promise = Promise;
		} else {
			_Promise = function( callback ) {
				var fulfilledHandlers = [],
					rejectedHandlers = [],
					state = PENDING,
					result, dispatchHandlers, makeResolver, fulfil, reject, promise;
				makeResolver = function( newState ) {
					return function( value ) {
						if ( state !== PENDING ) {
							return;
						}
						result = value;
						state = newState;
						dispatchHandlers = makeDispatcher( state === FULFILLED ? fulfilledHandlers : rejectedHandlers, result );
						// dispatch onFulfilled and onRejected handlers asynchronously
						wait( dispatchHandlers );
					};
				};
				fulfil = makeResolver( FULFILLED );
				reject = makeResolver( REJECTED );
				try {
					callback( fulfil, reject );
				} catch ( err ) {
					reject( err );
				}
				promise = {
					// `then()` returns a Promise - 2.2.7
					then: function( onFulfilled, onRejected ) {
						var promise2 = new _Promise( function( fulfil, reject ) {
							var processResolutionHandler = function( handler, handlers, forward ) {
								// 2.2.1.1
								if ( typeof handler === 'function' ) {
									handlers.push( function( p1result ) {
										var x;
										try {
											x = handler( p1result );
											resolve( promise2, x, fulfil, reject );
										} catch ( err ) {
											reject( err );
										}
									} );
								} else {
									// Forward the result of promise1 to promise2, if resolution handlers
									// are not given
									handlers.push( forward );
								}
							};
							// 2.2
							processResolutionHandler( onFulfilled, fulfilledHandlers, fulfil );
							processResolutionHandler( onRejected, rejectedHandlers, reject );
							if ( state !== PENDING ) {
								// If the promise has resolved already, dispatch the appropriate handlers asynchronously
								wait( dispatchHandlers );
							}
						} );
						return promise2;
					}
				};
				promise[ 'catch' ] = function( onRejected ) {
					return this.then( null, onRejected );
				};
				return promise;
			};
			_Promise.all = function( promises ) {
				return new _Promise( function( fulfil, reject ) {
					var result = [],
						pending, i, processPromise;
					if ( !promises.length ) {
						fulfil( result );
						return;
					}
					processPromise = function( i ) {
						promises[ i ].then( function( value ) {
							result[ i ] = value;
							if ( !--pending ) {
								fulfil( result );
							}
						}, reject );
					};
					pending = i = promises.length;
					while ( i-- ) {
						processPromise( i );
					}
				} );
			};
			_Promise.resolve = function( value ) {
				return new _Promise( function( fulfil ) {
					fulfil( value );
				} );
			};
			_Promise.reject = function( reason ) {
				return new _Promise( function( fulfil, reject ) {
					reject( reason );
				} );
			};
		}
		return _Promise;
		// TODO use MutationObservers or something to simulate setImmediate
		function wait( callback ) {
			setTimeout( callback, 0 );
		}

		function makeDispatcher( handlers, result ) {
			return function() {
				var handler;
				while ( handler = handlers.shift() ) {
					handler( result );
				}
			};
		}

		function resolve( promise, x, fulfil, reject ) {
			// Promise Resolution Procedure
			var then;
			// 2.3.1
			if ( x === promise ) {
				throw new TypeError( 'A promise\'s fulfillment handler cannot return the same promise' );
			}
			// 2.3.2
			if ( x instanceof _Promise ) {
				x.then( fulfil, reject );
			} else if ( x && ( typeof x === 'object' || typeof x === 'function' ) ) {
				try {
					then = x.then;
				} catch ( e ) {
					reject( e );
					// 2.3.3.2
					return;
				}
				// 2.3.3.3
				if ( typeof then === 'function' ) {
					var called, resolvePromise, rejectPromise;
					resolvePromise = function( y ) {
						if ( called ) {
							return;
						}
						called = true;
						resolve( promise, y, fulfil, reject );
					};
					rejectPromise = function( r ) {
						if ( called ) {
							return;
						}
						called = true;
						reject( r );
					};
					try {
						then.call( x, resolvePromise, rejectPromise );
					} catch ( e ) {
						if ( !called ) {
							// 2.3.3.3.4.1
							reject( e );
							// 2.3.3.3.4.2
							called = true;
							return;
						}
					}
				} else {
					fulfil( x );
				}
			} else {
				fulfil( x );
			}
		}
	}();

	/* utils/normaliseRef.js */
	var normaliseRef = function() {

		var regex = /\[\s*(\*|[0-9]|[1-9][0-9]+)\s*\]/g;
		return function normaliseRef( ref ) {
			return ( ref || '' ).replace( regex, '.$1' );
		};
	}();

	/* shared/getInnerContext.js */
	var getInnerContext = function( fragment ) {
		do {
			if ( fragment.context ) {
				return fragment.context;
			}
		} while ( fragment = fragment.parent );
		return '';
	};

	/* utils/isEqual.js */
	var isEqual = function( a, b ) {
		if ( a === null && b === null ) {
			return true;
		}
		if ( typeof a === 'object' || typeof b === 'object' ) {
			return false;
		}
		return a === b;
	};

	/* shared/createComponentBinding.js */
	var createComponentBinding = function( circular, isArray, isEqual ) {

		var runloop;
		circular.push( function() {
			return runloop = circular.runloop;
		} );
		var Binding = function( ractive, keypath, otherInstance, otherKeypath, priority ) {
			this.root = ractive;
			this.keypath = keypath;
			this.priority = priority;
			this.otherInstance = otherInstance;
			this.otherKeypath = otherKeypath;
			this.bind();
			this.value = this.root.viewmodel.get( this.keypath );
		};
		Binding.prototype = {
			setValue: function( value ) {
				var this$0 = this;
				// Only *you* can prevent infinite loops
				if ( this.updating || this.counterpart && this.counterpart.updating ) {
					this.value = value;
					return;
				}
				// Is this a smart array update? If so, it'll update on its
				// own, we shouldn't do anything
				if ( isArray( value ) && value._ractive && value._ractive.setting ) {
					return;
				}
				if ( !isEqual( value, this.value ) ) {
					this.updating = true;
					// TODO maybe the case that `value === this.value` - should that result
					// in an update rather than a set?
					runloop.addViewmodel( this.otherInstance.viewmodel );
					this.otherInstance.viewmodel.set( this.otherKeypath, value );
					this.value = value;
					// TODO will the counterpart update after this line, during
					// the runloop end cycle? may be a problem...
					runloop.scheduleTask( function() {
						return this$0.updating = false;
					} );
				}
			},
			bind: function() {
				this.root.viewmodel.register( this.keypath, this );
			},
			rebind: function( newKeypath ) {
				this.unbind();
				this.keypath = newKeypath;
				this.counterpart.otherKeypath = newKeypath;
				this.bind();
			},
			unbind: function() {
				this.root.viewmodel.unregister( this.keypath, this );
			}
		};
		return function createComponentBinding( component, parentInstance, parentKeypath, childKeypath ) {
			var hash, childInstance, bindings, priority, parentToChildBinding, childToParentBinding;
			hash = parentKeypath + '=' + childKeypath;
			bindings = component.bindings;
			if ( bindings[ hash ] ) {
				// TODO does this ever happen?
				return;
			}
			bindings[ hash ] = true;
			childInstance = component.instance;
			priority = component.parentFragment.priority;
			parentToChildBinding = new Binding( parentInstance, parentKeypath, childInstance, childKeypath, priority );
			bindings.push( parentToChildBinding );
			if ( childInstance.twoway ) {
				childToParentBinding = new Binding( childInstance, childKeypath, parentInstance, parentKeypath, 1 );
				bindings.push( childToParentBinding );
				parentToChildBinding.counterpart = childToParentBinding;
				childToParentBinding.counterpart = parentToChildBinding;
			}
		};
	}( circular, isArray, isEqual );

	/* shared/resolveRef.js */
	var resolveRef = function( normaliseRef, getInnerContext, createComponentBinding ) {

		var ancestorErrorMessage, getOptions;
		ancestorErrorMessage = 'Could not resolve reference - too many "../" prefixes';
		getOptions = {
			evaluateWrapped: true
		};
		return function resolveRef( ractive, ref, fragment ) {
			var context, key, index, keypath, parentValue, hasContextChain, parentKeys, childKeys, parentKeypath, childKeypath;
			ref = normaliseRef( ref );
			// If a reference begins '~/', it's a top-level reference
			if ( ref.substr( 0, 2 ) === '~/' ) {
				return ref.substring( 2 );
			}
			// If a reference begins with '.', it's either a restricted reference or
			// an ancestor reference...
			if ( ref.charAt( 0 ) === '.' ) {
				return resolveAncestorReference( getInnerContext( fragment ), ref );
			}
			// ...otherwise we need to find the keypath
			key = ref.split( '.' )[ 0 ];
			do {
				context = fragment.context;
				if ( !context ) {
					continue;
				}
				hasContextChain = true;
				parentValue = ractive.viewmodel.get( context, getOptions );
				if ( parentValue && ( typeof parentValue === 'object' || typeof parentValue === 'function' ) && key in parentValue ) {
					return context + '.' + ref;
				}
			} while ( fragment = fragment.parent );
			// Root/computed property?
			if ( key in ractive.data || key in ractive.viewmodel.computations ) {
				return ref;
			}
			// If this is an inline component, and it's not isolated, we
			// can try going up the scope chain
			if ( ractive._parent && !ractive.isolated ) {
				fragment = ractive.component.parentFragment;
				// Special case - index refs
				if ( fragment.indexRefs && ( index = fragment.indexRefs[ ref ] ) !== undefined ) {
					// Create an index ref binding, so that it can be rebound letter if necessary.
					// It doesn't have an alias since it's an implicit binding, hence `...[ ref ] = ref`
					ractive.component.indexRefBindings[ ref ] = ref;
					ractive.viewmodel.set( ref, index, true );
					return;
				}
				keypath = resolveRef( ractive._parent, ref, fragment );
				if ( keypath ) {
					// We need to create an inter-component binding
					// If parent keypath is 'one.foo' and child is 'two.foo', we bind
					// 'one' to 'two' as it's more efficient and avoids edge cases
					parentKeys = keypath.split( '.' );
					childKeys = ref.split( '.' );
					while ( parentKeys.length > 1 && childKeys.length > 1 && parentKeys[ parentKeys.length - 1 ] === childKeys[ childKeys.length - 1 ] ) {
						parentKeys.pop();
						childKeys.pop();
					}
					parentKeypath = parentKeys.join( '.' );
					childKeypath = childKeys.join( '.' );
					ractive.viewmodel.set( childKeypath, ractive._parent.viewmodel.get( parentKeypath ), true );
					createComponentBinding( ractive.component, ractive._parent, parentKeypath, childKeypath );
					return ref;
				}
			}
			// If there's no context chain, and the instance is either a) isolated or
			// b) an orphan, then we know that the keypath is identical to the reference
			if ( !hasContextChain ) {
				return ref;
			}
			if ( ractive.viewmodel.get( ref ) !== undefined ) {
				return ref;
			}
		};

		function resolveAncestorReference( baseContext, ref ) {
			var contextKeys;
			// {{.}} means 'current context'
			if ( ref === '.' )
				return baseContext;
			contextKeys = baseContext ? baseContext.split( '.' ) : [];
			// ancestor references (starting "../") go up the tree
			if ( ref.substr( 0, 3 ) === '../' ) {
				while ( ref.substr( 0, 3 ) === '../' ) {
					if ( !contextKeys.length ) {
						throw new Error( ancestorErrorMessage );
					}
					contextKeys.pop();
					ref = ref.substring( 3 );
				}
				contextKeys.push( ref );
				return contextKeys.join( '.' );
			}
			// not an ancestor reference - must be a restricted reference (prepended with "." or "./")
			if ( !baseContext ) {
				return ref.replace( /^\.\/?/, '' );
			}
			return baseContext + ref.replace( /^\.\//, '.' );
		}
	}( normaliseRef, getInnerContext, createComponentBinding );

	/* global/TransitionManager.js */
	var TransitionManager = function( removeFromArray ) {

		var TransitionManager = function( callback, parent ) {
			this.callback = callback;
			this.parent = parent;
			this.intros = [];
			this.outros = [];
			this.children = [];
			this.totalChildren = this.outroChildren = 0;
			this.detachQueue = [];
			this.outrosComplete = false;
			if ( parent ) {
				parent.addChild( this );
			}
		};
		TransitionManager.prototype = {
			addChild: function( child ) {
				this.children.push( child );
				this.totalChildren += 1;
				this.outroChildren += 1;
			},
			decrementOutros: function() {
				this.outroChildren -= 1;
				check( this );
			},
			decrementTotal: function() {
				this.totalChildren -= 1;
				check( this );
			},
			add: function( transition ) {
				var list = transition.isIntro ? this.intros : this.outros;
				list.push( transition );
			},
			remove: function( transition ) {
				var list = transition.isIntro ? this.intros : this.outros;
				removeFromArray( list, transition );
				check( this );
			},
			init: function() {
				this.ready = true;
				check( this );
			},
			detachNodes: function() {
				this.detachQueue.forEach( detach );
				this.children.forEach( detachNodes );
			}
		};

		function detach( element ) {
			element.detach();
		}

		function detachNodes( tm ) {
			tm.detachNodes();
		}

		function check( tm ) {
			if ( !tm.ready || tm.outros.length || tm.outroChildren )
				return;
			// If all outros are complete, and we haven't already done this,
			// we notify the parent if there is one, otherwise
			// start detaching nodes
			if ( !tm.outrosComplete ) {
				if ( tm.parent ) {
					tm.parent.decrementOutros( tm );
				} else {
					tm.detachNodes();
				}
				tm.outrosComplete = true;
			}
			// Once everything is done, we can notify parent transition
			// manager and call the callback
			if ( !tm.intros.length && !tm.totalChildren ) {
				if ( typeof tm.callback === 'function' ) {
					tm.callback();
				}
				if ( tm.parent ) {
					tm.parent.decrementTotal();
				}
			}
		}
		return TransitionManager;
	}( removeFromArray );

	/* global/runloop.js */
	var runloop = function( circular, removeFromArray, Promise, resolveRef, TransitionManager ) {

		var batch, runloop, unresolved = [];
		runloop = {
			start: function( instance, returnPromise ) {
				var promise, fulfilPromise;
				if ( returnPromise ) {
					promise = new Promise( function( f ) {
						return fulfilPromise = f;
					} );
				}
				batch = {
					previousBatch: batch,
					transitionManager: new TransitionManager( fulfilPromise, batch && batch.transitionManager ),
					views: [],
					tasks: [],
					viewmodels: []
				};
				if ( instance ) {
					batch.viewmodels.push( instance.viewmodel );
				}
				return promise;
			},
			end: function() {
				flushChanges();
				batch.transitionManager.init();
				batch = batch.previousBatch;
			},
			addViewmodel: function( viewmodel ) {
				if ( batch ) {
					if ( batch.viewmodels.indexOf( viewmodel ) === -1 ) {
						batch.viewmodels.push( viewmodel );
					}
				} else {
					viewmodel.applyChanges();
				}
			},
			registerTransition: function( transition ) {
				transition._manager = batch.transitionManager;
				batch.transitionManager.add( transition );
			},
			addView: function( view ) {
				batch.views.push( view );
			},
			addUnresolved: function( thing ) {
				unresolved.push( thing );
			},
			removeUnresolved: function( thing ) {
				removeFromArray( unresolved, thing );
			},
			// synchronise node detachments with transition ends
			detachWhenReady: function( thing ) {
				batch.transitionManager.detachQueue.push( thing );
			},
			scheduleTask: function( task ) {
				if ( !batch ) {
					task();
				} else {
					batch.tasks.push( task );
				}
			}
		};
		circular.runloop = runloop;
		return runloop;

		function flushChanges() {
			var i, thing, changeHash;
			for ( i = 0; i < batch.viewmodels.length; i += 1 ) {
				thing = batch.viewmodels[ i ];
				changeHash = thing.applyChanges();
				if ( changeHash ) {
					thing.ractive.fire( 'change', changeHash );
				}
			}
			batch.viewmodels.length = 0;
			attemptKeypathResolution();
			// Now that changes have been fully propagated, we can update the DOM
			// and complete other tasks
			for ( i = 0; i < batch.views.length; i += 1 ) {
				batch.views[ i ].update();
			}
			batch.views.length = 0;
			for ( i = 0; i < batch.tasks.length; i += 1 ) {
				batch.tasks[ i ]();
			}
			batch.tasks.length = 0;
			// If updating the view caused some model blowback - e.g. a triple
			// containing <option> elements caused the binding on the <select>
			// to update - then we start over
			if ( batch.viewmodels.length )
				return flushChanges();
		}

		function attemptKeypathResolution() {
			var array, thing, keypath;
			if ( !unresolved.length ) {
				return;
			}
			// see if we can resolve any unresolved references
			array = unresolved.splice( 0, unresolved.length );
			while ( thing = array.pop() ) {
				if ( thing.keypath ) {
					continue;
				}
				keypath = resolveRef( thing.root, thing.ref, thing.parentFragment );
				if ( keypath !== undefined ) {
					// If we've resolved the keypath, we can initialise this item
					thing.resolve( keypath );
				} else {
					// If we can't resolve the reference, try again next time
					unresolved.push( thing );
				}
			}
		}
	}( circular, removeFromArray, Promise, resolveRef, TransitionManager );

	/* utils/createBranch.js */
	var createBranch = function() {

		var numeric = /^\s*[0-9]+\s*$/;
		return function( key ) {
			return numeric.test( key ) ? [] : {};
		};
	}();

	/* viewmodel/prototype/get/magicAdaptor.js */
	var viewmodel$get_magicAdaptor = function( runloop, createBranch, isArray ) {

		var magicAdaptor, MagicWrapper;
		try {
			Object.defineProperty( {}, 'test', {
				value: 0
			} );
			magicAdaptor = {
				filter: function( object, keypath, ractive ) {
					var keys, key, parentKeypath, parentWrapper, parentValue;
					if ( !keypath ) {
						return false;
					}
					keys = keypath.split( '.' );
					key = keys.pop();
					parentKeypath = keys.join( '.' );
					// If the parent value is a wrapper, other than a magic wrapper,
					// we shouldn't wrap this property
					if ( ( parentWrapper = ractive.viewmodel.wrapped[ parentKeypath ] ) && !parentWrapper.magic ) {
						return false;
					}
					parentValue = ractive.get( parentKeypath );
					// if parentValue is an array that doesn't include this member,
					// we should return false otherwise lengths will get messed up
					if ( isArray( parentValue ) && /^[0-9]+$/.test( key ) ) {
						return false;
					}
					return parentValue && ( typeof parentValue === 'object' || typeof parentValue === 'function' );
				},
				wrap: function( ractive, property, keypath ) {
					return new MagicWrapper( ractive, property, keypath );
				}
			};
			MagicWrapper = function( ractive, value, keypath ) {
				var keys, objKeypath, template, siblings;
				this.magic = true;
				this.ractive = ractive;
				this.keypath = keypath;
				this.value = value;
				keys = keypath.split( '.' );
				this.prop = keys.pop();
				objKeypath = keys.join( '.' );
				this.obj = objKeypath ? ractive.get( objKeypath ) : ractive.data;
				template = this.originalDescriptor = Object.getOwnPropertyDescriptor( this.obj, this.prop );
				// Has this property already been wrapped?
				if ( template && template.set && ( siblings = template.set._ractiveWrappers ) ) {
					// Yes. Register this wrapper to this property, if it hasn't been already
					if ( siblings.indexOf( this ) === -1 ) {
						siblings.push( this );
					}
					return;
				}
				// No, it hasn't been wrapped
				createAccessors( this, value, template );
			};
			MagicWrapper.prototype = {
				get: function() {
					return this.value;
				},
				reset: function( value ) {
					if ( this.updating ) {
						return;
					}
					this.updating = true;
					this.obj[ this.prop ] = value;
					// trigger set() accessor
					runloop.addViewmodel( this.ractive.viewmodel );
					this.ractive.viewmodel.mark( this.keypath );
					this.updating = false;
				},
				set: function( key, value ) {
					if ( this.updating ) {
						return;
					}
					if ( !this.obj[ this.prop ] ) {
						this.updating = true;
						this.obj[ this.prop ] = createBranch( key );
						this.updating = false;
					}
					this.obj[ this.prop ][ key ] = value;
				},
				teardown: function() {
					var template, set, value, wrappers, index;
					// If this method was called because the cache was being cleared as a
					// result of a set()/update() call made by this wrapper, we return false
					// so that it doesn't get torn down
					if ( this.updating ) {
						return false;
					}
					template = Object.getOwnPropertyDescriptor( this.obj, this.prop );
					set = template && template.set;
					if ( !set ) {
						// most likely, this was an array member that was spliced out
						return;
					}
					wrappers = set._ractiveWrappers;
					index = wrappers.indexOf( this );
					if ( index !== -1 ) {
						wrappers.splice( index, 1 );
					}
					// Last one out, turn off the lights
					if ( !wrappers.length ) {
						value = this.obj[ this.prop ];
						Object.defineProperty( this.obj, this.prop, this.originalDescriptor || {
							writable: true,
							enumerable: true,
							configurable: true
						} );
						this.obj[ this.prop ] = value;
					}
				}
			};
		} catch ( err ) {
			magicAdaptor = false;
		}
		return magicAdaptor;

		function createAccessors( originalWrapper, value, template ) {
			var object, property, oldGet, oldSet, get, set;
			object = originalWrapper.obj;
			property = originalWrapper.prop;
			// Is this template configurable?
			if ( template && !template.configurable ) {
				// Special case - array length
				if ( property === 'length' ) {
					return;
				}
				throw new Error( 'Cannot use magic mode with property "' + property + '" - object is not configurable' );
			}
			// Time to wrap this property
			if ( template ) {
				oldGet = template.get;
				oldSet = template.set;
			}
			get = oldGet || function() {
				return value;
			};
			set = function( v ) {
				if ( oldSet ) {
					oldSet( v );
				}
				value = oldGet ? oldGet() : v;
				set._ractiveWrappers.forEach( updateWrapper );
			};

			function updateWrapper( wrapper ) {
				var keypath, ractive;
				wrapper.value = value;
				if ( wrapper.updating ) {
					return;
				}
				ractive = wrapper.ractive;
				keypath = wrapper.keypath;
				wrapper.updating = true;
				runloop.start( ractive );
				ractive.viewmodel.mark( keypath );
				runloop.end();
				wrapper.updating = false;
			}
			// Create an array of wrappers, in case other keypaths/ractives depend on this property.
			// Handily, we can store them as a property of the set function. Yay JavaScript.
			set._ractiveWrappers = [ originalWrapper ];
			Object.defineProperty( object, property, {
				get: get,
				set: set,
				enumerable: true,
				configurable: true
			} );
		}
	}( runloop, createBranch, isArray );

	/* config/magic.js */
	var magic = function( magicAdaptor ) {

		return !!magicAdaptor;
	}( viewmodel$get_magicAdaptor );

	/* config/namespaces.js */
	var namespaces = {
		html: 'http://www.w3.org/1999/xhtml',
		mathml: 'http://www.w3.org/1998/Math/MathML',
		svg: 'http://www.w3.org/2000/svg',
		xlink: 'http://www.w3.org/1999/xlink',
		xml: 'http://www.w3.org/XML/1998/namespace',
		xmlns: 'http://www.w3.org/2000/xmlns/'
	};

	/* utils/createElement.js */
	var createElement = function( svg, namespaces ) {

		var createElement;
		// Test for SVG support
		if ( !svg ) {
			createElement = function( type, ns ) {
				if ( ns && ns !== namespaces.html ) {
					throw 'This browser does not support namespaces other than http://www.w3.org/1999/xhtml. The most likely cause of this error is that you\'re trying to render SVG in an older browser. See http://docs.ractivejs.org/latest/svg-and-older-browsers for more information';
				}
				return document.createElement( type );
			};
		} else {
			createElement = function( type, ns ) {
				if ( !ns || ns === namespaces.html ) {
					return document.createElement( type );
				}
				return document.createElementNS( ns, type );
			};
		}
		return createElement;
	}( svg, namespaces );

	/* config/isClient.js */
	var isClient = function() {

		var isClient = typeof document === 'object';
		return isClient;
	}();

	/* utils/defineProperty.js */
	var defineProperty = function( isClient ) {

		var defineProperty;
		try {
			Object.defineProperty( {}, 'test', {
				value: 0
			} );
			if ( isClient ) {
				Object.defineProperty( document.createElement( 'div' ), 'test', {
					value: 0
				} );
			}
			defineProperty = Object.defineProperty;
		} catch ( err ) {
			// Object.defineProperty doesn't exist, or we're in IE8 where you can
			// only use it with DOM objects (what the fuck were you smoking, MSFT?)
			defineProperty = function( obj, prop, desc ) {
				obj[ prop ] = desc.value;
			};
		}
		return defineProperty;
	}( isClient );

	/* utils/defineProperties.js */
	var defineProperties = function( createElement, defineProperty, isClient ) {

		var defineProperties;
		try {
			try {
				Object.defineProperties( {}, {
					test: {
						value: 0
					}
				} );
			} catch ( err ) {
				// TODO how do we account for this? noMagic = true;
				throw err;
			}
			if ( isClient ) {
				Object.defineProperties( createElement( 'div' ), {
					test: {
						value: 0
					}
				} );
			}
			defineProperties = Object.defineProperties;
		} catch ( err ) {
			defineProperties = function( obj, props ) {
				var prop;
				for ( prop in props ) {
					if ( props.hasOwnProperty( prop ) ) {
						defineProperty( obj, prop, props[ prop ] );
					}
				}
			};
		}
		return defineProperties;
	}( createElement, defineProperty, isClient );

	/* Ractive/prototype/shared/add.js */
	var Ractive$shared_add = function( isNumeric ) {

		return function add( root, keypath, d ) {
			var value;
			if ( typeof keypath !== 'string' || !isNumeric( d ) ) {
				throw new Error( 'Bad arguments' );
			}
			value = +root.get( keypath ) || 0;
			if ( !isNumeric( value ) ) {
				throw new Error( 'Cannot add to a non-numeric value' );
			}
			return root.set( keypath, value + d );
		};
	}( isNumeric );

	/* Ractive/prototype/add.js */
	var Ractive$add = function( add ) {

		return function Ractive$add( keypath, d ) {
			return add( this, keypath, d === undefined ? 1 : +d );
		};
	}( Ractive$shared_add );

	/* utils/normaliseKeypath.js */
	var normaliseKeypath = function( normaliseRef ) {

		var leadingDot = /^\.+/;
		return function normaliseKeypath( keypath ) {
			return normaliseRef( keypath ).replace( leadingDot, '' );
		};
	}( normaliseRef );

	/* config/vendors.js */
	var vendors = [
		'o',
		'ms',
		'moz',
		'webkit'
	];

	/* utils/requestAnimationFrame.js */
	var requestAnimationFrame = function( vendors ) {

		var requestAnimationFrame;
		// If window doesn't exist, we don't need requestAnimationFrame
		if ( typeof window === 'undefined' ) {
			requestAnimationFrame = null;
		} else {
			// https://gist.github.com/paulirish/1579671
			( function( vendors, lastTime, window ) {
				var x, setTimeout;
				if ( window.requestAnimationFrame ) {
					return;
				}
				for ( x = 0; x < vendors.length && !window.requestAnimationFrame; ++x ) {
					window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
				}
				if ( !window.requestAnimationFrame ) {
					setTimeout = window.setTimeout;
					window.requestAnimationFrame = function( callback ) {
						var currTime, timeToCall, id;
						currTime = Date.now();
						timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
						id = setTimeout( function() {
							callback( currTime + timeToCall );
						}, timeToCall );
						lastTime = currTime + timeToCall;
						return id;
					};
				}
			}( vendors, 0, window ) );
			requestAnimationFrame = window.requestAnimationFrame;
		}
		return requestAnimationFrame;
	}( vendors );

	/* utils/getTime.js */
	var getTime = function() {

		var getTime;
		if ( typeof window !== 'undefined' && window.performance && typeof window.performance.now === 'function' ) {
			getTime = function() {
				return window.performance.now();
			};
		} else {
			getTime = function() {
				return Date.now();
			};
		}
		return getTime;
	}();

	/* shared/animations.js */
	var animations = function( rAF, getTime, runloop ) {

		var queue = [];
		var animations = {
			tick: function() {
				var i, animation, now;
				now = getTime();
				runloop.start();
				for ( i = 0; i < queue.length; i += 1 ) {
					animation = queue[ i ];
					if ( !animation.tick( now ) ) {
						// animation is complete, remove it from the stack, and decrement i so we don't miss one
						queue.splice( i--, 1 );
					}
				}
				runloop.end();
				if ( queue.length ) {
					rAF( animations.tick );
				} else {
					animations.running = false;
				}
			},
			add: function( animation ) {
				queue.push( animation );
				if ( !animations.running ) {
					animations.running = true;
					rAF( animations.tick );
				}
			},
			// TODO optimise this
			abort: function( keypath, root ) {
				var i = queue.length,
					animation;
				while ( i-- ) {
					animation = queue[ i ];
					if ( animation.root === root && animation.keypath === keypath ) {
						animation.stop();
					}
				}
			}
		};
		return animations;
	}( requestAnimationFrame, getTime, runloop );

	/* utils/warn.js */
	var warn = function() {

		/* global console */
		var warn, warned = {};
		if ( typeof console !== 'undefined' && typeof console.warn === 'function' && typeof console.warn.apply === 'function' ) {
			warn = function( message, allowDuplicates ) {
				if ( !allowDuplicates ) {
					if ( warned[ message ] ) {
						return;
					}
					warned[ message ] = true;
				}
				console.warn( message );
			};
		} else {
			warn = function() {};
		}
		return warn;
	}();

	/* config/options/css/transform.js */
	var transform = function() {

		var selectorsPattern = /(?:^|\})?\s*([^\{\}]+)\s*\{/g,
			commentsPattern = /\/\*.*?\*\//g,
			selectorUnitPattern = /((?:(?:\[[^\]+]\])|(?:[^\s\+\>\~:]))+)((?::[^\s\+\>\~]+)?\s*[\s\+\>\~]?)\s*/g,
			mediaQueryPattern = /^@media/,
			dataRvcGuidPattern = /\[data-rvcguid="[a-z0-9-]+"]/g;
		return function transformCss( css, guid ) {
			var transformed, addGuid;
			addGuid = function( selector ) {
				var selectorUnits, match, unit, dataAttr, base, prepended, appended, i, transformed = [];
				selectorUnits = [];
				while ( match = selectorUnitPattern.exec( selector ) ) {
					selectorUnits.push( {
						str: match[ 0 ],
						base: match[ 1 ],
						modifiers: match[ 2 ]
					} );
				}
				// For each simple selector within the selector, we need to create a version
				// that a) combines with the guid, and b) is inside the guid
				dataAttr = '[data-rvcguid="' + guid + '"]';
				base = selectorUnits.map( extractString );
				i = selectorUnits.length;
				while ( i-- ) {
					appended = base.slice();
					// Pseudo-selectors should go after the attribute selector
					unit = selectorUnits[ i ];
					appended[ i ] = unit.base + dataAttr + unit.modifiers || '';
					prepended = base.slice();
					prepended[ i ] = dataAttr + ' ' + prepended[ i ];
					transformed.push( appended.join( ' ' ), prepended.join( ' ' ) );
				}
				return transformed.join( ', ' );
			};
			if ( dataRvcGuidPattern.test( css ) ) {
				transformed = css.replace( dataRvcGuidPattern, '[data-rvcguid="' + guid + '"]' );
			} else {
				transformed = css.replace( commentsPattern, '' ).replace( selectorsPattern, function( match, $1 ) {
					var selectors, transformed;
					// don't transform media queries!
					if ( mediaQueryPattern.test( $1 ) )
						return match;
					selectors = $1.split( ',' ).map( trim );
					transformed = selectors.map( addGuid ).join( ', ' ) + ' ';
					return match.replace( $1, transformed );
				} );
			}
			return transformed;
		};

		function trim( str ) {
			if ( str.trim ) {
				return str.trim();
			}
			return str.replace( /^\s+/, '' ).replace( /\s+$/, '' );
		}

		function extractString( unit ) {
			return unit.str;
		}
	}();

	/* config/options/css/css.js */
	var css = function( transformCss ) {

		var cssConfig = {
			name: 'css',
			extend: extend,
			init: function() {}
		};

		function extend( Parent, proto, options ) {
			var guid = proto.constructor._guid,
				css;
			if ( css = getCss( options.css, options, guid ) || getCss( Parent.css, Parent, guid ) ) {
				proto.constructor.css = css;
			}
		}

		function getCss( css, target, guid ) {
			if ( !css ) {
				return;
			}
			return target.noCssTransform ? css : transformCss( css, guid );
		}
		return cssConfig;
	}( transform );

	/* utils/wrapMethod.js */
	var wrapMethod = function() {

		return function( method, superMethod, force ) {
			if ( force || needsSuper( method, superMethod ) ) {
				return function() {
					var hasSuper = '_super' in this,
						_super = this._super,
						result;
					this._super = superMethod;
					result = method.apply( this, arguments );
					if ( hasSuper ) {
						this._super = _super;
					}
					return result;
				};
			} else {
				return method;
			}
		};

		function needsSuper( method, superMethod ) {
			return typeof superMethod === 'function' && /_super/.test( method );
		}
	}();

	/* config/options/data.js */
	var data = function( wrap ) {

		var dataConfig = {
			name: 'data',
			extend: extend,
			init: init,
			reset: reset
		};
		return dataConfig;

		function combine( Parent, target, options ) {
			var value = options.data || {},
				parentValue = getAddedKeys( Parent.prototype.data );
			return dispatch( parentValue, value );
		}

		function extend( Parent, proto, options ) {
			proto.data = combine( Parent, proto, options );
		}

		function init( Parent, ractive, options ) {
			var value = options.data,
				result = combine( Parent, ractive, options );
			if ( typeof result === 'function' ) {
				result = result.call( ractive, value ) || value;
			}
			return ractive.data = result || {};
		}

		function reset( ractive ) {
			var result = this.init( ractive.constructor, ractive, ractive );
			if ( result ) {
				ractive.data = result;
				return true;
			}
		}

		function getAddedKeys( parent ) {
			// only for functions that had keys added
			if ( typeof parent !== 'function' || !Object.keys( parent ).length ) {
				return parent;
			}
			// copy the added keys to temp 'object', otherwise
			// parent would be interpreted as 'function' by dispatch
			var temp = {};
			copy( parent, temp );
			// roll in added keys
			return dispatch( parent, temp );
		}

		function dispatch( parent, child ) {
			if ( typeof child === 'function' ) {
				return extendFn( child, parent );
			} else if ( typeof parent === 'function' ) {
				return fromFn( child, parent );
			} else {
				return fromProperties( child, parent );
			}
		}

		function copy( from, to, fillOnly ) {
			for ( var key in from ) {
				if ( fillOnly && key in to ) {
					continue;
				}
				to[ key ] = from[ key ];
			}
		}

		function fromProperties( child, parent ) {
			child = child || {};
			if ( !parent ) {
				return child;
			}
			copy( parent, child, true );
			return child;
		}

		function fromFn( child, parentFn ) {
			return function( data ) {
				var keys;
				if ( child ) {
					// Track the keys that our on the child,
					// but not on the data. We'll need to apply these
					// after the parent function returns.
					keys = [];
					for ( var key in child ) {
						if ( !data || !( key in data ) ) {
							keys.push( key );
						}
					}
				}
				// call the parent fn, use data if no return value
				data = parentFn.call( this, data ) || data;
				// Copy child keys back onto data. The child keys
				// should take precedence over whatever the
				// parent did with the data.
				if ( keys && keys.length ) {
					data = data || {};
					keys.forEach( function( key ) {
						data[ key ] = child[ key ];
					} );
				}
				return data;
			};
		}

		function extendFn( childFn, parent ) {
			var parentFn;
			if ( typeof parent !== 'function' ) {
				// copy props to data
				parentFn = function( data ) {
					fromProperties( data, parent );
				};
			} else {
				parentFn = function( data ) {
					// give parent function it's own this._super context,
					// otherwise this._super is from child and
					// causes infinite loop
					parent = wrap( parent, function() {}, true );
					return parent.call( this, data ) || data;
				};
			}
			return wrap( childFn, parentFn );
		}
	}( wrapMethod );

	/* config/errors.js */
	var errors = {
		missingParser: 'Missing Ractive.parse - cannot parse template. Either preparse or use the version that includes the parser',
		mergeComparisonFail: 'Merge operation: comparison failed. Falling back to identity checking',
		noComponentEventArguments: 'Components currently only support simple events - you cannot include arguments. Sorry!',
		noTemplateForPartial: 'Could not find template for partial "{name}"',
		noNestedPartials: 'Partials ({{>{name}}}) cannot contain nested inline partials',
		evaluationError: 'Error evaluating "{uniqueString}": {err}',
		badArguments: 'Bad arguments "{arguments}". I\'m not allowed to argue unless you\'ve paid.',
		failedComputation: 'Failed to compute "{key}": {err}',
		missingPlugin: 'Missing "{name}" {plugin} plugin. You may need to download a {plugin} via http://docs.ractivejs.org/latest/plugins#{plugin}s',
		badRadioInputBinding: 'A radio input can have two-way binding on its name attribute, or its checked attribute - not both',
		noRegistryFunctionReturn: 'A function was specified for "{name}" {registry}, but no {registry} was returned'
	};

	/* config/types.js */
	var types = {
		TEXT: 1,
		INTERPOLATOR: 2,
		TRIPLE: 3,
		SECTION: 4,
		INVERTED: 5,
		CLOSING: 6,
		ELEMENT: 7,
		PARTIAL: 8,
		COMMENT: 9,
		DELIMCHANGE: 10,
		MUSTACHE: 11,
		TAG: 12,
		ATTRIBUTE: 13,
		CLOSING_TAG: 14,
		COMPONENT: 15,
		NUMBER_LITERAL: 20,
		STRING_LITERAL: 21,
		ARRAY_LITERAL: 22,
		OBJECT_LITERAL: 23,
		BOOLEAN_LITERAL: 24,
		GLOBAL: 26,
		KEY_VALUE_PAIR: 27,
		REFERENCE: 30,
		REFINEMENT: 31,
		MEMBER: 32,
		PREFIX_OPERATOR: 33,
		BRACKETED: 34,
		CONDITIONAL: 35,
		INFIX_OPERATOR: 36,
		INVOCATION: 40,
		SECTION_IF: 50,
		SECTION_UNLESS: 51,
		SECTION_EACH: 52,
		SECTION_WITH: 53
	};

	/* utils/create.js */
	var create = function() {

		var create;
		try {
			Object.create( null );
			create = Object.create;
		} catch ( err ) {
			// sigh
			create = function() {
				var F = function() {};
				return function( proto, props ) {
					var obj;
					if ( proto === null ) {
						return {};
					}
					F.prototype = proto;
					obj = new F();
					if ( props ) {
						Object.defineProperties( obj, props );
					}
					return obj;
				};
			}();
		}
		return create;
	}();

	/* parse/Parser/expressions/shared/errors.js */
	var parse_Parser_expressions_shared_errors = {
		expectedExpression: 'Expected a JavaScript expression',
		expectedParen: 'Expected closing paren'
	};

	/* parse/Parser/expressions/primary/literal/numberLiteral.js */
	var numberLiteral = function( types ) {

		// bulletproof number regex from https://gist.github.com/Rich-Harris/7544330
		var numberPattern = /^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/;
		return function( parser ) {
			var result;
			if ( result = parser.matchPattern( numberPattern ) ) {
				return {
					t: types.NUMBER_LITERAL,
					v: result
				};
			}
			return null;
		};
	}( types );

	/* parse/Parser/expressions/primary/literal/booleanLiteral.js */
	var booleanLiteral = function( types ) {

		return function( parser ) {
			var remaining = parser.remaining();
			if ( remaining.substr( 0, 4 ) === 'true' ) {
				parser.pos += 4;
				return {
					t: types.BOOLEAN_LITERAL,
					v: 'true'
				};
			}
			if ( remaining.substr( 0, 5 ) === 'false' ) {
				parser.pos += 5;
				return {
					t: types.BOOLEAN_LITERAL,
					v: 'false'
				};
			}
			return null;
		};
	}( types );

	/* parse/Parser/expressions/primary/literal/stringLiteral/makeQuotedStringMatcher.js */
	var makeQuotedStringMatcher = function() {

		var stringMiddlePattern, escapeSequencePattern, lineContinuationPattern;
		// Match one or more characters until: ", ', \, or EOL/EOF.
		// EOL/EOF is written as (?!.) (meaning there's no non-newline char next).
		stringMiddlePattern = /^(?=.)[^"'\\]+?(?:(?!.)|(?=["'\\]))/;
		// Match one escape sequence, including the backslash.
		escapeSequencePattern = /^\\(?:['"\\bfnrt]|0(?![0-9])|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|(?=.)[^ux0-9])/;
		// Match one ES5 line continuation (backslash + line terminator).
		lineContinuationPattern = /^\\(?:\r\n|[\u000A\u000D\u2028\u2029])/;
		// Helper for defining getDoubleQuotedString and getSingleQuotedString.
		return function( okQuote ) {
			return function( parser ) {
				var start, literal, done, next;
				start = parser.pos;
				literal = '"';
				done = false;
				while ( !done ) {
					next = parser.matchPattern( stringMiddlePattern ) || parser.matchPattern( escapeSequencePattern ) || parser.matchString( okQuote );
					if ( next ) {
						if ( next === '"' ) {
							literal += '\\"';
						} else if ( next === '\\\'' ) {
							literal += '\'';
						} else {
							literal += next;
						}
					} else {
						next = parser.matchPattern( lineContinuationPattern );
						if ( next ) {
							// convert \(newline-like) into a \u escape, which is allowed in JSON
							literal += '\\u' + ( '000' + next.charCodeAt( 1 ).toString( 16 ) ).slice( -4 );
						} else {
							done = true;
						}
					}
				}
				literal += '"';
				// use JSON.parse to interpret escapes
				return JSON.parse( literal );
			};
		};
	}();

	/* parse/Parser/expressions/primary/literal/stringLiteral/singleQuotedString.js */
	var singleQuotedString = function( makeQuotedStringMatcher ) {

		return makeQuotedStringMatcher( '"' );
	}( makeQuotedStringMatcher );

	/* parse/Parser/expressions/primary/literal/stringLiteral/doubleQuotedString.js */
	var doubleQuotedString = function( makeQuotedStringMatcher ) {

		return makeQuotedStringMatcher( '\'' );
	}( makeQuotedStringMatcher );

	/* parse/Parser/expressions/primary/literal/stringLiteral/_stringLiteral.js */
	var stringLiteral = function( types, getSingleQuotedString, getDoubleQuotedString ) {

		return function( parser ) {
			var start, string;
			start = parser.pos;
			if ( parser.matchString( '"' ) ) {
				string = getDoubleQuotedString( parser );
				if ( !parser.matchString( '"' ) ) {
					parser.pos = start;
					return null;
				}
				return {
					t: types.STRING_LITERAL,
					v: string
				};
			}
			if ( parser.matchString( '\'' ) ) {
				string = getSingleQuotedString( parser );
				if ( !parser.matchString( '\'' ) ) {
					parser.pos = start;
					return null;
				}
				return {
					t: types.STRING_LITERAL,
					v: string
				};
			}
			return null;
		};
	}( types, singleQuotedString, doubleQuotedString );

	/* parse/Parser/expressions/shared/patterns.js */
	var patterns = {
		name: /^[a-zA-Z_$][a-zA-Z_$0-9]*/
	};

	/* parse/Parser/expressions/shared/key.js */
	var key = function( getStringLiteral, getNumberLiteral, patterns ) {

		var identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
		// http://mathiasbynens.be/notes/javascript-properties
		// can be any name, string literal, or number literal
		return function( parser ) {
			var token;
			if ( token = getStringLiteral( parser ) ) {
				return identifier.test( token.v ) ? token.v : '"' + token.v.replace( /"/g, '\\"' ) + '"';
			}
			if ( token = getNumberLiteral( parser ) ) {
				return token.v;
			}
			if ( token = parser.matchPattern( patterns.name ) ) {
				return token;
			}
		};
	}( stringLiteral, numberLiteral, patterns );

	/* parse/Parser/expressions/primary/literal/objectLiteral/keyValuePair.js */
	var keyValuePair = function( types, getKey ) {

		return function( parser ) {
			var start, key, value;
			start = parser.pos;
			// allow whitespace between '{' and key
			parser.allowWhitespace();
			key = getKey( parser );
			if ( key === null ) {
				parser.pos = start;
				return null;
			}
			// allow whitespace between key and ':'
			parser.allowWhitespace();
			// next character must be ':'
			if ( !parser.matchString( ':' ) ) {
				parser.pos = start;
				return null;
			}
			// allow whitespace between ':' and value
			parser.allowWhitespace();
			// next expression must be a, well... expression
			value = parser.readExpression();
			if ( value === null ) {
				parser.pos = start;
				return null;
			}
			return {
				t: types.KEY_VALUE_PAIR,
				k: key,
				v: value
			};
		};
	}( types, key );

	/* parse/Parser/expressions/primary/literal/objectLiteral/keyValuePairs.js */
	var keyValuePairs = function( getKeyValuePair ) {

		return function getKeyValuePairs( parser ) {
			var start, pairs, pair, keyValuePairs;
			start = parser.pos;
			pair = getKeyValuePair( parser );
			if ( pair === null ) {
				return null;
			}
			pairs = [ pair ];
			if ( parser.matchString( ',' ) ) {
				keyValuePairs = getKeyValuePairs( parser );
				if ( !keyValuePairs ) {
					parser.pos = start;
					return null;
				}
				return pairs.concat( keyValuePairs );
			}
			return pairs;
		};
	}( keyValuePair );

	/* parse/Parser/expressions/primary/literal/objectLiteral/_objectLiteral.js */
	var objectLiteral = function( types, getKeyValuePairs ) {

		return function( parser ) {
			var start, keyValuePairs;
			start = parser.pos;
			// allow whitespace
			parser.allowWhitespace();
			if ( !parser.matchString( '{' ) ) {
				parser.pos = start;
				return null;
			}
			keyValuePairs = getKeyValuePairs( parser );
			// allow whitespace between final value and '}'
			parser.allowWhitespace();
			if ( !parser.matchString( '}' ) ) {
				parser.pos = start;
				return null;
			}
			return {
				t: types.OBJECT_LITERAL,
				m: keyValuePairs
			};
		};
	}( types, keyValuePairs );

	/* parse/Parser/expressions/shared/expressionList.js */
	var expressionList = function( errors ) {

		return function getExpressionList( parser ) {
			var start, expressions, expr, next;
			start = parser.pos;
			parser.allowWhitespace();
			expr = parser.readExpression();
			if ( expr === null ) {
				return null;
			}
			expressions = [ expr ];
			// allow whitespace between expression and ','
			parser.allowWhitespace();
			if ( parser.matchString( ',' ) ) {
				next = getExpressionList( parser );
				if ( next === null ) {
					parser.error( errors.expectedExpression );
				}
				next.forEach( append );
			}

			function append( expression ) {
				expressions.push( expression );
			}
			return expressions;
		};
	}( parse_Parser_expressions_shared_errors );

	/* parse/Parser/expressions/primary/literal/arrayLiteral.js */
	var arrayLiteral = function( types, getExpressionList ) {

		return function( parser ) {
			var start, expressionList;
			start = parser.pos;
			// allow whitespace before '['
			parser.allowWhitespace();
			if ( !parser.matchString( '[' ) ) {
				parser.pos = start;
				return null;
			}
			expressionList = getExpressionList( parser );
			if ( !parser.matchString( ']' ) ) {
				parser.pos = start;
				return null;
			}
			return {
				t: types.ARRAY_LITERAL,
				m: expressionList
			};
		};
	}( types, expressionList );

	/* parse/Parser/expressions/primary/literal/_literal.js */
	var literal = function( getNumberLiteral, getBooleanLiteral, getStringLiteral, getObjectLiteral, getArrayLiteral ) {

		return function( parser ) {
			var literal = getNumberLiteral( parser ) || getBooleanLiteral( parser ) || getStringLiteral( parser ) || getObjectLiteral( parser ) || getArrayLiteral( parser );
			return literal;
		};
	}( numberLiteral, booleanLiteral, stringLiteral, objectLiteral, arrayLiteral );

	/* parse/Parser/expressions/primary/reference.js */
	var reference = function( types, patterns ) {

		var dotRefinementPattern, arrayMemberPattern, getArrayRefinement, globals, keywords;
		dotRefinementPattern = /^\.[a-zA-Z_$0-9]+/;
		getArrayRefinement = function( parser ) {
			var num = parser.matchPattern( arrayMemberPattern );
			if ( num ) {
				return '.' + num;
			}
			return null;
		};
		arrayMemberPattern = /^\[(0|[1-9][0-9]*)\]/;
		// if a reference is a browser global, we don't deference it later, so it needs special treatment
		globals = /^(?:Array|Date|RegExp|decodeURIComponent|decodeURI|encodeURIComponent|encodeURI|isFinite|isNaN|parseFloat|parseInt|JSON|Math|NaN|undefined|null)$/;
		// keywords are not valid references, with the exception of `this`
		keywords = /^(?:break|case|catch|continue|debugger|default|delete|do|else|finally|for|function|if|in|instanceof|new|return|switch|throw|try|typeof|var|void|while|with)$/;
		return function( parser ) {
			var startPos, ancestor, name, dot, combo, refinement, lastDotIndex;
			startPos = parser.pos;
			// we might have a root-level reference
			if ( parser.matchString( '~/' ) ) {
				ancestor = '~/';
			} else {
				// we might have ancestor refs...
				ancestor = '';
				while ( parser.matchString( '../' ) ) {
					ancestor += '../';
				}
			}
			if ( !ancestor ) {
				// we might have an implicit iterator or a restricted reference
				dot = parser.matchString( '.' ) || '';
			}
			name = parser.matchPattern( /^@(?:index|key)/ ) || parser.matchPattern( patterns.name ) || '';
			// bug out if it's a keyword
			if ( keywords.test( name ) ) {
				parser.pos = startPos;
				return null;
			}
			// if this is a browser global, stop here
			if ( !ancestor && !dot && globals.test( name ) ) {
				return {
					t: types.GLOBAL,
					v: name
				};
			}
			combo = ( ancestor || dot ) + name;
			if ( !combo ) {
				return null;
			}
			while ( refinement = parser.matchPattern( dotRefinementPattern ) || getArrayRefinement( parser ) ) {
				combo += refinement;
			}
			if ( parser.matchString( '(' ) ) {
				// if this is a method invocation (as opposed to a function) we need
				// to strip the method name from the reference combo, else the context
				// will be wrong
				lastDotIndex = combo.lastIndexOf( '.' );
				if ( lastDotIndex !== -1 ) {
					combo = combo.substr( 0, lastDotIndex );
					parser.pos = startPos + combo.length;
				} else {
					parser.pos -= 1;
				}
			}
			return {
				t: types.REFERENCE,
				n: combo.replace( /^this\./, './' ).replace( /^this$/, '.' )
			};
		};
	}( types, patterns );

	/* parse/Parser/expressions/primary/bracketedExpression.js */
	var bracketedExpression = function( types, errors ) {

		return function( parser ) {
			var start, expr;
			start = parser.pos;
			if ( !parser.matchString( '(' ) ) {
				return null;
			}
			parser.allowWhitespace();
			expr = parser.readExpression();
			if ( !expr ) {
				parser.error( errors.expectedExpression );
			}
			parser.allowWhitespace();
			if ( !parser.matchString( ')' ) ) {
				parser.error( errors.expectedParen );
			}
			return {
				t: types.BRACKETED,
				x: expr
			};
		};
	}( types, parse_Parser_expressions_shared_errors );

	/* parse/Parser/expressions/primary/_primary.js */
	var primary = function( getLiteral, getReference, getBracketedExpression ) {

		return function( parser ) {
			return getLiteral( parser ) || getReference( parser ) || getBracketedExpression( parser );
		};
	}( literal, reference, bracketedExpression );

	/* parse/Parser/expressions/shared/refinement.js */
	var refinement = function( types, errors, patterns ) {

		return function getRefinement( parser ) {
			var start, name, expr;
			start = parser.pos;
			parser.allowWhitespace();
			// "." name
			if ( parser.matchString( '.' ) ) {
				parser.allowWhitespace();
				if ( name = parser.matchPattern( patterns.name ) ) {
					return {
						t: types.REFINEMENT,
						n: name
					};
				}
				parser.error( 'Expected a property name' );
			}
			// "[" expression "]"
			if ( parser.matchString( '[' ) ) {
				parser.allowWhitespace();
				expr = parser.readExpression();
				if ( !expr ) {
					parser.error( errors.expectedExpression );
				}
				parser.allowWhitespace();
				if ( !parser.matchString( ']' ) ) {
					parser.error( 'Expected \']\'' );
				}
				return {
					t: types.REFINEMENT,
					x: expr
				};
			}
			return null;
		};
	}( types, parse_Parser_expressions_shared_errors, patterns );

	/* parse/Parser/expressions/memberOrInvocation.js */
	var memberOrInvocation = function( types, getPrimary, getExpressionList, getRefinement, errors ) {

		return function( parser ) {
			var current, expression, refinement, expressionList;
			expression = getPrimary( parser );
			if ( !expression ) {
				return null;
			}
			while ( expression ) {
				current = parser.pos;
				if ( refinement = getRefinement( parser ) ) {
					expression = {
						t: types.MEMBER,
						x: expression,
						r: refinement
					};
				} else if ( parser.matchString( '(' ) ) {
					parser.allowWhitespace();
					expressionList = getExpressionList( parser );
					parser.allowWhitespace();
					if ( !parser.matchString( ')' ) ) {
						parser.error( errors.expectedParen );
					}
					expression = {
						t: types.INVOCATION,
						x: expression
					};
					if ( expressionList ) {
						expression.o = expressionList;
					}
				} else {
					break;
				}
			}
			return expression;
		};
	}( types, primary, expressionList, refinement, parse_Parser_expressions_shared_errors );

	/* parse/Parser/expressions/typeof.js */
	var _typeof = function( types, errors, getMemberOrInvocation ) {

		var getTypeof, makePrefixSequenceMatcher;
		makePrefixSequenceMatcher = function( symbol, fallthrough ) {
			return function( parser ) {
				var expression;
				if ( expression = fallthrough( parser ) ) {
					return expression;
				}
				if ( !parser.matchString( symbol ) ) {
					return null;
				}
				parser.allowWhitespace();
				expression = parser.readExpression();
				if ( !expression ) {
					parser.error( errors.expectedExpression );
				}
				return {
					s: symbol,
					o: expression,
					t: types.PREFIX_OPERATOR
				};
			};
		};
		// create all prefix sequence matchers, return getTypeof
		( function() {
			var i, len, matcher, prefixOperators, fallthrough;
			prefixOperators = '! ~ + - typeof'.split( ' ' );
			fallthrough = getMemberOrInvocation;
			for ( i = 0, len = prefixOperators.length; i < len; i += 1 ) {
				matcher = makePrefixSequenceMatcher( prefixOperators[ i ], fallthrough );
				fallthrough = matcher;
			}
			// typeof operator is higher precedence than multiplication, so provides the
			// fallthrough for the multiplication sequence matcher we're about to create
			// (we're skipping void and delete)
			getTypeof = fallthrough;
		}() );
		return getTypeof;
	}( types, parse_Parser_expressions_shared_errors, memberOrInvocation );

	/* parse/Parser/expressions/logicalOr.js */
	var logicalOr = function( types, getTypeof ) {

		var getLogicalOr, makeInfixSequenceMatcher;
		makeInfixSequenceMatcher = function( symbol, fallthrough ) {
			return function( parser ) {
				var start, left, right;
				left = fallthrough( parser );
				if ( !left ) {
					return null;
				}
				// Loop to handle left-recursion in a case like `a * b * c` and produce
				// left association, i.e. `(a * b) * c`.  The matcher can't call itself
				// to parse `left` because that would be infinite regress.
				while ( true ) {
					start = parser.pos;
					parser.allowWhitespace();
					if ( !parser.matchString( symbol ) ) {
						parser.pos = start;
						return left;
					}
					// special case - in operator must not be followed by [a-zA-Z_$0-9]
					if ( symbol === 'in' && /[a-zA-Z_$0-9]/.test( parser.remaining().charAt( 0 ) ) ) {
						parser.pos = start;
						return left;
					}
					parser.allowWhitespace();
					// right operand must also consist of only higher-precedence operators
					right = fallthrough( parser );
					if ( !right ) {
						parser.pos = start;
						return left;
					}
					left = {
						t: types.INFIX_OPERATOR,
						s: symbol,
						o: [
							left,
							right
						]
					};
				}
			};
		};
		// create all infix sequence matchers, and return getLogicalOr
		( function() {
			var i, len, matcher, infixOperators, fallthrough;
			// All the infix operators on order of precedence (source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Operator_Precedence)
			// Each sequence matcher will initially fall through to its higher precedence
			// neighbour, and only attempt to match if one of the higher precedence operators
			// (or, ultimately, a literal, reference, or bracketed expression) already matched
			infixOperators = '* / % + - << >> >>> < <= > >= in instanceof == != === !== & ^ | && ||'.split( ' ' );
			// A typeof operator is higher precedence than multiplication
			fallthrough = getTypeof;
			for ( i = 0, len = infixOperators.length; i < len; i += 1 ) {
				matcher = makeInfixSequenceMatcher( infixOperators[ i ], fallthrough );
				fallthrough = matcher;
			}
			// Logical OR is the fallthrough for the conditional matcher
			getLogicalOr = fallthrough;
		}() );
		return getLogicalOr;
	}( types, _typeof );

	/* parse/Parser/expressions/conditional.js */
	var conditional = function( types, getLogicalOr, errors ) {

		// The conditional operator is the lowest precedence operator, so we start here
		return function( parser ) {
			var start, expression, ifTrue, ifFalse;
			expression = getLogicalOr( parser );
			if ( !expression ) {
				return null;
			}
			start = parser.pos;
			parser.allowWhitespace();
			if ( !parser.matchString( '?' ) ) {
				parser.pos = start;
				return expression;
			}
			parser.allowWhitespace();
			ifTrue = parser.readExpression();
			if ( !ifTrue ) {
				parser.error( errors.expectedExpression );
			}
			parser.allowWhitespace();
			if ( !parser.matchString( ':' ) ) {
				parser.error( 'Expected ":"' );
			}
			parser.allowWhitespace();
			ifFalse = parser.readExpression();
			if ( !ifFalse ) {
				parser.error( errors.expectedExpression );
			}
			return {
				t: types.CONDITIONAL,
				o: [
					expression,
					ifTrue,
					ifFalse
				]
			};
		};
	}( types, logicalOr, parse_Parser_expressions_shared_errors );

	/* parse/Parser/utils/flattenExpression.js */
	var flattenExpression = function( types, isObject ) {

		return function( expression ) {
			var refs = [],
				flattened;
			extractRefs( expression, refs );
			flattened = {
				r: refs,
				s: stringify( this, expression, refs )
			};
			return flattened;
		};

		function quoteStringLiteral( str ) {
			return JSON.stringify( String( str ) );
		}
		// TODO maybe refactor this?
		function extractRefs( node, refs ) {
			var i, list;
			if ( node.t === types.REFERENCE ) {
				if ( refs.indexOf( node.n ) === -1 ) {
					refs.unshift( node.n );
				}
			}
			list = node.o || node.m;
			if ( list ) {
				if ( isObject( list ) ) {
					extractRefs( list, refs );
				} else {
					i = list.length;
					while ( i-- ) {
						extractRefs( list[ i ], refs );
					}
				}
			}
			if ( node.x ) {
				extractRefs( node.x, refs );
			}
			if ( node.r ) {
				extractRefs( node.r, refs );
			}
			if ( node.v ) {
				extractRefs( node.v, refs );
			}
		}

		function stringify( parser, node, refs ) {
			var stringifyAll = function( item ) {
				return stringify( parser, item, refs );
			};
			switch ( node.t ) {
				case types.BOOLEAN_LITERAL:
				case types.GLOBAL:
				case types.NUMBER_LITERAL:
					return node.v;
				case types.STRING_LITERAL:
					return quoteStringLiteral( node.v );
				case types.ARRAY_LITERAL:
					return '[' + ( node.m ? node.m.map( stringifyAll ).join( ',' ) : '' ) + ']';
				case types.OBJECT_LITERAL:
					return '{' + ( node.m ? node.m.map( stringifyAll ).join( ',' ) : '' ) + '}';
				case types.KEY_VALUE_PAIR:
					return node.k + ':' + stringify( parser, node.v, refs );
				case types.PREFIX_OPERATOR:
					return ( node.s === 'typeof' ? 'typeof ' : node.s ) + stringify( parser, node.o, refs );
				case types.INFIX_OPERATOR:
					return stringify( parser, node.o[ 0 ], refs ) + ( node.s.substr( 0, 2 ) === 'in' ? ' ' + node.s + ' ' : node.s ) + stringify( parser, node.o[ 1 ], refs );
				case types.INVOCATION:
					return stringify( parser, node.x, refs ) + '(' + ( node.o ? node.o.map( stringifyAll ).join( ',' ) : '' ) + ')';
				case types.BRACKETED:
					return '(' + stringify( parser, node.x, refs ) + ')';
				case types.MEMBER:
					return stringify( parser, node.x, refs ) + stringify( parser, node.r, refs );
				case types.REFINEMENT:
					return node.n ? '.' + node.n : '[' + stringify( parser, node.x, refs ) + ']';
				case types.CONDITIONAL:
					return stringify( parser, node.o[ 0 ], refs ) + '?' + stringify( parser, node.o[ 1 ], refs ) + ':' + stringify( parser, node.o[ 2 ], refs );
				case types.REFERENCE:
					return '${' + refs.indexOf( node.n ) + '}';
				default:
					parser.error( 'Expected legal JavaScript' );
			}
		}
	}( types, isObject );

	/* parse/Parser/_Parser.js */
	var Parser = function( circular, create, hasOwnProperty, getConditional, flattenExpression ) {

		var Parser, ParseError, leadingWhitespace = /^\s+/;
		ParseError = function( message ) {
			this.name = 'ParseError';
			this.message = message;
			try {
				throw new Error( message );
			} catch ( e ) {
				this.stack = e.stack;
			}
		};
		ParseError.prototype = Error.prototype;
		Parser = function( str, options ) {
			var items, item;
			this.str = str;
			this.options = options || {};
			this.pos = 0;
			// Custom init logic
			if ( this.init )
				this.init( str, options );
			items = [];
			while ( this.pos < this.str.length && ( item = this.read() ) ) {
				items.push( item );
			}
			this.leftover = this.remaining();
			this.result = this.postProcess ? this.postProcess( items, options ) : items;
		};
		Parser.prototype = {
			read: function( converters ) {
				var pos, i, len, item;
				if ( !converters )
					converters = this.converters;
				pos = this.pos;
				len = converters.length;
				for ( i = 0; i < len; i += 1 ) {
					this.pos = pos;
					// reset for each attempt
					if ( item = converters[ i ]( this ) ) {
						return item;
					}
				}
				return null;
			},
			readExpression: function() {
				// The conditional operator is the lowest precedence operator (except yield,
				// assignment operators, and commas, none of which are supported), so we
				// start there. If it doesn't match, it 'falls through' to progressively
				// higher precedence operators, until it eventually matches (or fails to
				// match) a 'primary' - a literal or a reference. This way, the abstract syntax
				// tree has everything in its proper place, i.e. 2 + 3 * 4 === 14, not 20.
				return getConditional( this );
			},
			flattenExpression: flattenExpression,
			getLinePos: function() {
				var lines, currentLine, currentLineEnd, nextLineEnd, lineNum, columnNum;
				lines = this.str.split( '\n' );
				lineNum = -1;
				nextLineEnd = 0;
				do {
					currentLineEnd = nextLineEnd;
					lineNum++;
					currentLine = lines[ lineNum ];
					nextLineEnd += currentLine.length + 1;
				} while ( nextLineEnd <= this.pos );
				columnNum = this.pos - currentLineEnd;
				return {
					line: lineNum + 1,
					ch: columnNum + 1,
					text: currentLine,
					toJSON: function() {
						return [
							this.line,
							this.ch
						];
					},
					toString: function() {
						return 'line ' + this.line + ' character ' + this.ch + ':\n' + this.text + '\n' + this.text.substr( 0, this.ch - 1 ).replace( /[\S]/g, ' ' ) + '^----';
					}
				};
			},
			error: function( err ) {
				var pos, message;
				pos = this.getLinePos();
				message = err + ' at ' + pos;
				throw new ParseError( message );
			},
			matchString: function( string ) {
				if ( this.str.substr( this.pos, string.length ) === string ) {
					this.pos += string.length;
					return string;
				}
			},
			matchPattern: function( pattern ) {
				var match;
				if ( match = pattern.exec( this.remaining() ) ) {
					this.pos += match[ 0 ].length;
					return match[ 1 ] || match[ 0 ];
				}
			},
			allowWhitespace: function() {
				this.matchPattern( leadingWhitespace );
			},
			remaining: function() {
				return this.str.substring( this.pos );
			},
			nextChar: function() {
				return this.str.charAt( this.pos );
			}
		};
		Parser.extend = function( proto ) {
			var Parent = this,
				Child, key;
			Child = function( str, options ) {
				Parser.call( this, str, options );
			};
			Child.prototype = create( Parent.prototype );
			for ( key in proto ) {
				if ( hasOwnProperty.call( proto, key ) ) {
					Child.prototype[ key ] = proto[ key ];
				}
			}
			Child.extend = Parser.extend;
			return Child;
		};
		circular.Parser = Parser;
		return Parser;
	}( circular, create, hasOwn, conditional, flattenExpression );

	/* parse/converters/mustache/delimiterChange.js */
	var delimiterChange = function() {

		var delimiterChangePattern = /^[^\s=]+/,
			whitespacePattern = /^\s+/;
		return function( parser ) {
			var start, opening, closing;
			if ( !parser.matchString( '=' ) ) {
				return null;
			}
			start = parser.pos;
			// allow whitespace before new opening delimiter
			parser.allowWhitespace();
			opening = parser.matchPattern( delimiterChangePattern );
			if ( !opening ) {
				parser.pos = start;
				return null;
			}
			// allow whitespace (in fact, it's necessary...)
			if ( !parser.matchPattern( whitespacePattern ) ) {
				return null;
			}
			closing = parser.matchPattern( delimiterChangePattern );
			if ( !closing ) {
				parser.pos = start;
				return null;
			}
			// allow whitespace before closing '='
			parser.allowWhitespace();
			if ( !parser.matchString( '=' ) ) {
				parser.pos = start;
				return null;
			}
			return [
				opening,
				closing
			];
		};
	}();

	/* parse/converters/mustache/delimiterTypes.js */
	var delimiterTypes = [ {
		delimiters: 'delimiters',
		isTriple: false,
		isStatic: false
	}, {
		delimiters: 'tripleDelimiters',
		isTriple: true,
		isStatic: false
	}, {
		delimiters: 'staticDelimiters',
		isTriple: false,
		isStatic: true
	}, {
		delimiters: 'staticTripleDelimiters',
		isTriple: true,
		isStatic: true
	} ];

	/* parse/converters/mustache/type.js */
	var type = function( types ) {

		var mustacheTypes = {
			'#': types.SECTION,
			'^': types.INVERTED,
			'/': types.CLOSING,
			'>': types.PARTIAL,
			'!': types.COMMENT,
			'&': types.TRIPLE
		};
		return function( parser ) {
			var type = mustacheTypes[ parser.str.charAt( parser.pos ) ];
			if ( !type ) {
				return null;
			}
			parser.pos += 1;
			return type;
		};
	}( types );

	/* parse/converters/mustache/handlebarsBlockCodes.js */
	var handlebarsBlockCodes = function( types ) {

		return {
			'if': types.SECTION_IF,
			'unless': types.SECTION_UNLESS,
			'with': types.SECTION_WITH,
			'each': types.SECTION_EACH
		};
	}( types );

	/* empty/legacy.js */
	var legacy = null;

	/* parse/converters/mustache/content.js */
	var content = function( types, mustacheType, handlebarsBlockCodes ) {

		var indexRefPattern = /^\s*:\s*([a-zA-Z_$][a-zA-Z_$0-9]*)/,
			arrayMemberPattern = /^[0-9][1-9]*$/,
			handlebarsBlockPattern = new RegExp( '^(' + Object.keys( handlebarsBlockCodes ).join( '|' ) + ')\\b' ),
			legalReference;
		legalReference = /^[a-zA-Z$_0-9]+(?:(\.[a-zA-Z$_0-9]+)|(\[[a-zA-Z$_0-9]+\]))*$/;
		return function( parser, delimiterType ) {
			var start, pos, mustache, type, block, expression, i, remaining, index, delimiters, referenceExpression;
			start = parser.pos;
			mustache = {};
			delimiters = parser[ delimiterType.delimiters ];
			if ( delimiterType.isStatic ) {
				mustache.s = true;
			}
			// Determine mustache type
			if ( delimiterType.isTriple ) {
				mustache.t = types.TRIPLE;
			} else {
				// We need to test for expressions before we test for mustache type, because
				// an expression that begins '!' looks a lot like a comment
				if ( parser.remaining()[ 0 ] === '!' && ( expression = parser.readExpression() ) ) {
					mustache.t = types.INTERPOLATOR;
					// Was it actually an expression, or a comment block in disguise?
					parser.allowWhitespace();
					if ( parser.matchString( delimiters[ 1 ] ) ) {
						// expression
						parser.pos -= delimiters[ 1 ].length;
					} else {
						// comment block
						parser.pos = start;
						expression = null;
					}
				}
				if ( !expression ) {
					type = mustacheType( parser );
					mustache.t = type || types.INTERPOLATOR;
					// default
					// See if there's an explicit section type e.g. {{#with}}...{{/with}}
					if ( type === types.SECTION ) {
						if ( block = parser.matchPattern( handlebarsBlockPattern ) ) {
							mustache.n = block;
						}
						parser.allowWhitespace();
					} else if ( type === types.COMMENT || type === types.CLOSING ) {
						remaining = parser.remaining();
						index = remaining.indexOf( delimiters[ 1 ] );
						if ( index !== -1 ) {
							mustache.r = remaining.substr( 0, index );
							parser.pos += index;
							return mustache;
						}
					}
				}
			}
			if ( !expression ) {
				// allow whitespace
				parser.allowWhitespace();
				// get expression
				expression = parser.readExpression();
				// With certain valid references that aren't valid expressions,
				// e.g. {{1.foo}}, we have a problem: it looks like we've got an
				// expression, but the expression didn't consume the entire
				// reference. So we need to check that the mustache delimiters
				// appear next, unless there's an index reference (i.e. a colon)
				remaining = parser.remaining();
				if ( remaining.substr( 0, delimiters[ 1 ].length ) !== delimiters[ 1 ] && remaining.charAt( 0 ) !== ':' ) {
					pos = parser.pos;
					parser.pos = start;
					remaining = parser.remaining();
					index = remaining.indexOf( delimiters[ 1 ] );
					if ( index !== -1 ) {
						mustache.r = remaining.substr( 0, index ).trim();
						// Check it's a legal reference
						if ( !legalReference.test( mustache.r ) ) {
							parser.error( 'Expected a legal Mustache reference' );
						}
						parser.pos += index;
						return mustache;
					}
					parser.pos = pos;
				}
			}
			if ( expression ) {
				while ( expression.t === types.BRACKETED && expression.x ) {
					expression = expression.x;
				}
				// special case - integers should be treated as array members references,
				// rather than as expressions in their own right
				if ( expression.t === types.REFERENCE ) {
					mustache.r = expression.n;
				} else {
					if ( expression.t === types.NUMBER_LITERAL && arrayMemberPattern.test( expression.v ) ) {
						mustache.r = expression.v;
					} else if ( referenceExpression = getReferenceExpression( parser, expression ) ) {
						mustache.rx = referenceExpression;
					} else {
						mustache.x = parser.flattenExpression( expression );
					}
				}
			}
			// optional index reference
			if ( i = parser.matchPattern( indexRefPattern ) ) {
				mustache.i = i;
			}
			return mustache;
		};
		// TODO refactor this! it's bewildering
		function getReferenceExpression( parser, expression ) {
			var members = [],
				refinement;
			while ( expression.t === types.MEMBER && expression.r.t === types.REFINEMENT ) {
				refinement = expression.r;
				if ( refinement.x ) {
					if ( refinement.x.t === types.REFERENCE ) {
						members.unshift( refinement.x );
					} else {
						members.unshift( parser.flattenExpression( refinement.x ) );
					}
				} else {
					members.unshift( refinement.n );
				}
				expression = expression.x;
			}
			if ( expression.t !== types.REFERENCE ) {
				return null;
			}
			return {
				r: expression.n,
				m: members
			};
		}
	}( types, type, handlebarsBlockCodes, legacy );

	/* parse/converters/mustache.js */
	var mustache = function( types, delimiterChange, delimiterTypes, mustacheContent, handlebarsBlockCodes ) {

		var delimiterChangeToken = {
				t: types.DELIMCHANGE,
				exclude: true
			},
			handlebarsIndexRefPattern = /^@(?:index|key)$/;
		return getMustache;

		function getMustache( parser ) {
			var types;
			types = delimiterTypes.slice().sort( function compare( a, b ) {
				// Sort in order of descending opening delimiter length (longer first),
				// to protect against opening delimiters being substrings of each other
				return parser[ b.delimiters ][ 0 ].length - parser[ a.delimiters ][ 0 ].length;
			} );
			return function r( type ) {
				if ( !type ) {
					return null;
				} else {
					return getMustacheOfType( parser, type ) || r( types.shift() );
				}
			}( types.shift() );
		}

		function getMustacheOfType( parser, delimiterType ) {
			var start, startPos, mustache, delimiters, children, expectedClose, elseChildren, currentChildren, child, indexRef;
			start = parser.pos;
			startPos = parser.getLinePos();
			delimiters = parser[ delimiterType.delimiters ];
			if ( !parser.matchString( delimiters[ 0 ] ) ) {
				return null;
			}
			// delimiter change?
			if ( mustache = delimiterChange( parser ) ) {
				// find closing delimiter or abort...
				if ( !parser.matchString( delimiters[ 1 ] ) ) {
					return null;
				}
				// ...then make the switch
				parser[ delimiterType.delimiters ] = mustache;
				return delimiterChangeToken;
			}
			parser.allowWhitespace();
			mustache = mustacheContent( parser, delimiterType );
			if ( mustache === null ) {
				parser.pos = start;
				return null;
			}
			// allow whitespace before closing delimiter
			parser.allowWhitespace();
			if ( !parser.matchString( delimiters[ 1 ] ) ) {
				parser.error( 'Expected closing delimiter \'' + delimiters[ 1 ] + '\' after reference' );
			}
			if ( mustache.t === types.COMMENT ) {
				mustache.exclude = true;
			}
			if ( mustache.t === types.CLOSING ) {
				parser.sectionDepth -= 1;
				if ( parser.sectionDepth < 0 ) {
					parser.pos = start;
					parser.error( 'Attempted to close a section that wasn\'t open' );
				}
			}
			// section children
			if ( isSection( mustache ) ) {
				parser.sectionDepth += 1;
				children = [];
				currentChildren = children;
				expectedClose = mustache.n;
				while ( child = parser.read() ) {
					if ( child.t === types.CLOSING ) {
						if ( expectedClose && child.r !== expectedClose ) {
							parser.error( 'Expected {{/' + expectedClose + '}}' );
						}
						break;
					}
					// {{else}} tags require special treatment
					if ( child.t === types.INTERPOLATOR && child.r === 'else' ) {
						switch ( mustache.n ) {
							case 'unless':
								parser.error( '{{else}} not allowed in {{#unless}}' );
								break;
							case 'with':
								parser.error( '{{else}} not allowed in {{#with}}' );
								break;
							default:
								currentChildren = elseChildren = [];
								continue;
						}
					}
					currentChildren.push( child );
				}
				if ( children.length ) {
					mustache.f = children;
					// If this is an 'each' section, and it contains an {{@index}} or {{@key}},
					// we need to set the index reference accordingly
					if ( !mustache.i && mustache.n === 'each' && ( indexRef = handlebarsIndexRef( mustache.f ) ) ) {
						mustache.i = indexRef;
					}
				}
				if ( elseChildren && elseChildren.length ) {
					mustache.l = elseChildren;
				}
			}
			if ( parser.includeLinePositions ) {
				mustache.p = startPos.toJSON();
			}
			// Replace block name with code
			if ( mustache.n ) {
				mustache.n = handlebarsBlockCodes[ mustache.n ];
			} else if ( mustache.t === types.INVERTED ) {
				mustache.t = types.SECTION;
				mustache.n = types.SECTION_UNLESS;
			}
			return mustache;
		}

		function handlebarsIndexRef( fragment ) {
			var i, child, indexRef;
			i = fragment.length;
			while ( i-- ) {
				child = fragment[ i ];
				// Recurse into elements (but not sections)
				if ( child.t === types.ELEMENT && child.f && ( indexRef = handlebarsIndexRef( child.f ) ) ) {
					return indexRef;
				}
				// Mustache?
				if ( child.t === types.INTERPOLATOR || child.t === types.TRIPLE || child.t === types.SECTION ) {
					// Normal reference?
					if ( child.r && handlebarsIndexRefPattern.test( child.r ) ) {
						return child.r;
					}
					// Expression?
					if ( child.x && ( indexRef = indexRefContainedInExpression( child.x ) ) ) {
						return indexRef;
					}
					// Reference expression?
					if ( child.rx && ( indexRef = indexRefContainedInReferenceExpression( child.rx ) ) ) {
						return indexRef;
					}
				}
			}
		}

		function indexRefContainedInExpression( expression ) {
			var i;
			i = expression.r.length;
			while ( i-- ) {
				if ( handlebarsIndexRefPattern.test( expression.r[ i ] ) ) {
					return expression.r[ i ];
				}
			}
		}

		function indexRefContainedInReferenceExpression( referenceExpression ) {
			var i, indexRef, member;
			i = referenceExpression.m.length;
			while ( i-- ) {
				member = referenceExpression.m[ i ];
				if ( member.r && ( indexRef = indexRefContainedInExpression( member ) ) ) {
					return indexRef;
				}
				if ( member.t === types.REFERENCE && handlebarsIndexRefPattern.test( member.n ) ) {
					return member.n;
				}
			}
		}

		function isSection( mustache ) {
			return mustache.t === types.SECTION || mustache.t === types.INVERTED;
		}
	}( types, delimiterChange, delimiterTypes, content, handlebarsBlockCodes );

	/* parse/converters/comment.js */
	var comment = function( types ) {

		var OPEN_COMMENT = '<!--',
			CLOSE_COMMENT = '-->';
		return function( parser ) {
			var startPos, content, remaining, endIndex, comment;
			startPos = parser.getLinePos();
			if ( !parser.matchString( OPEN_COMMENT ) ) {
				return null;
			}
			remaining = parser.remaining();
			endIndex = remaining.indexOf( CLOSE_COMMENT );
			if ( endIndex === -1 ) {
				parser.error( 'Illegal HTML - expected closing comment sequence (\'-->\')' );
			}
			content = remaining.substr( 0, endIndex );
			parser.pos += endIndex + 3;
			comment = {
				t: types.COMMENT,
				c: content
			};
			if ( parser.includeLinePositions ) {
				comment.p = startPos.toJSON();
			}
			return comment;
		};
	}( types );

	/* config/voidElementNames.js */
	var voidElementNames = function() {

		var voidElementNames = /^(?:area|base|br|col|command|doctype|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
		return voidElementNames;
	}();

	/* parse/converters/utils/getLowestIndex.js */
	var getLowestIndex = function( haystack, needles ) {
		var i, index, lowest;
		i = needles.length;
		while ( i-- ) {
			index = haystack.indexOf( needles[ i ] );
			// short circuit
			if ( !index ) {
				return 0;
			}
			if ( index === -1 ) {
				continue;
			}
			if ( !lowest || index < lowest ) {
				lowest = index;
			}
		}
		return lowest || -1;
	};

	/* parse/converters/utils/decodeCharacterReferences.js */
	var decodeCharacterReferences = function() {

		var htmlEntities, controlCharacters, namedEntityPattern, hexEntityPattern, decimalEntityPattern;
		htmlEntities = {
			quot: 34,
			amp: 38,
			apos: 39,
			lt: 60,
			gt: 62,
			nbsp: 160,
			iexcl: 161,
			cent: 162,
			pound: 163,
			curren: 164,
			yen: 165,
			brvbar: 166,
			sect: 167,
			uml: 168,
			copy: 169,
			ordf: 170,
			laquo: 171,
			not: 172,
			shy: 173,
			reg: 174,
			macr: 175,
			deg: 176,
			plusmn: 177,
			sup2: 178,
			sup3: 179,
			acute: 180,
			micro: 181,
			para: 182,
			middot: 183,
			cedil: 184,
			sup1: 185,
			ordm: 186,
			raquo: 187,
			frac14: 188,
			frac12: 189,
			frac34: 190,
			iquest: 191,
			Agrave: 192,
			Aacute: 193,
			Acirc: 194,
			Atilde: 195,
			Auml: 196,
			Aring: 197,
			AElig: 198,
			Ccedil: 199,
			Egrave: 200,
			Eacute: 201,
			Ecirc: 202,
			Euml: 203,
			Igrave: 204,
			Iacute: 205,
			Icirc: 206,
			Iuml: 207,
			ETH: 208,
			Ntilde: 209,
			Ograve: 210,
			Oacute: 211,
			Ocirc: 212,
			Otilde: 213,
			Ouml: 214,
			times: 215,
			Oslash: 216,
			Ugrave: 217,
			Uacute: 218,
			Ucirc: 219,
			Uuml: 220,
			Yacute: 221,
			THORN: 222,
			szlig: 223,
			agrave: 224,
			aacute: 225,
			acirc: 226,
			atilde: 227,
			auml: 228,
			aring: 229,
			aelig: 230,
			ccedil: 231,
			egrave: 232,
			eacute: 233,
			ecirc: 234,
			euml: 235,
			igrave: 236,
			iacute: 237,
			icirc: 238,
			iuml: 239,
			eth: 240,
			ntilde: 241,
			ograve: 242,
			oacute: 243,
			ocirc: 244,
			otilde: 245,
			ouml: 246,
			divide: 247,
			oslash: 248,
			ugrave: 249,
			uacute: 250,
			ucirc: 251,
			uuml: 252,
			yacute: 253,
			thorn: 254,
			yuml: 255,
			OElig: 338,
			oelig: 339,
			Scaron: 352,
			scaron: 353,
			Yuml: 376,
			fnof: 402,
			circ: 710,
			tilde: 732,
			Alpha: 913,
			Beta: 914,
			Gamma: 915,
			Delta: 916,
			Epsilon: 917,
			Zeta: 918,
			Eta: 919,
			Theta: 920,
			Iota: 921,
			Kappa: 922,
			Lambda: 923,
			Mu: 924,
			Nu: 925,
			Xi: 926,
			Omicron: 927,
			Pi: 928,
			Rho: 929,
			Sigma: 931,
			Tau: 932,
			Upsilon: 933,
			Phi: 934,
			Chi: 935,
			Psi: 936,
			Omega: 937,
			alpha: 945,
			beta: 946,
			gamma: 947,
			delta: 948,
			epsilon: 949,
			zeta: 950,
			eta: 951,
			theta: 952,
			iota: 953,
			kappa: 954,
			lambda: 955,
			mu: 956,
			nu: 957,
			xi: 958,
			omicron: 959,
			pi: 960,
			rho: 961,
			sigmaf: 962,
			sigma: 963,
			tau: 964,
			upsilon: 965,
			phi: 966,
			chi: 967,
			psi: 968,
			omega: 969,
			thetasym: 977,
			upsih: 978,
			piv: 982,
			ensp: 8194,
			emsp: 8195,
			thinsp: 8201,
			zwnj: 8204,
			zwj: 8205,
			lrm: 8206,
			rlm: 8207,
			ndash: 8211,
			mdash: 8212,
			lsquo: 8216,
			rsquo: 8217,
			sbquo: 8218,
			ldquo: 8220,
			rdquo: 8221,
			bdquo: 8222,
			dagger: 8224,
			Dagger: 8225,
			bull: 8226,
			hellip: 8230,
			permil: 8240,
			prime: 8242,
			Prime: 8243,
			lsaquo: 8249,
			rsaquo: 8250,
			oline: 8254,
			frasl: 8260,
			euro: 8364,
			image: 8465,
			weierp: 8472,
			real: 8476,
			trade: 8482,
			alefsym: 8501,
			larr: 8592,
			uarr: 8593,
			rarr: 8594,
			darr: 8595,
			harr: 8596,
			crarr: 8629,
			lArr: 8656,
			uArr: 8657,
			rArr: 8658,
			dArr: 8659,
			hArr: 8660,
			forall: 8704,
			part: 8706,
			exist: 8707,
			empty: 8709,
			nabla: 8711,
			isin: 8712,
			notin: 8713,
			ni: 8715,
			prod: 8719,
			sum: 8721,
			minus: 8722,
			lowast: 8727,
			radic: 8730,
			prop: 8733,
			infin: 8734,
			ang: 8736,
			and: 8743,
			or: 8744,
			cap: 8745,
			cup: 8746,
			'int': 8747,
			there4: 8756,
			sim: 8764,
			cong: 8773,
			asymp: 8776,
			ne: 8800,
			equiv: 8801,
			le: 8804,
			ge: 8805,
			sub: 8834,
			sup: 8835,
			nsub: 8836,
			sube: 8838,
			supe: 8839,
			oplus: 8853,
			otimes: 8855,
			perp: 8869,
			sdot: 8901,
			lceil: 8968,
			rceil: 8969,
			lfloor: 8970,
			rfloor: 8971,
			lang: 9001,
			rang: 9002,
			loz: 9674,
			spades: 9824,
			clubs: 9827,
			hearts: 9829,
			diams: 9830
		};
		controlCharacters = [
			8364,
			129,
			8218,
			402,
			8222,
			8230,
			8224,
			8225,
			710,
			8240,
			352,
			8249,
			338,
			141,
			381,
			143,
			144,
			8216,
			8217,
			8220,
			8221,
			8226,
			8211,
			8212,
			732,
			8482,
			353,
			8250,
			339,
			157,
			382,
			376
		];
		namedEntityPattern = new RegExp( '&(' + Object.keys( htmlEntities ).join( '|' ) + ');?', 'g' );
		hexEntityPattern = /&#x([0-9]+);?/g;
		decimalEntityPattern = /&#([0-9]+);?/g;
		return function decodeCharacterReferences( html ) {
			var result;
			// named entities
			result = html.replace( namedEntityPattern, function( match, name ) {
				if ( htmlEntities[ name ] ) {
					return String.fromCharCode( htmlEntities[ name ] );
				}
				return match;
			} );
			// hex references
			result = result.replace( hexEntityPattern, function( match, hex ) {
				return String.fromCharCode( validateCode( parseInt( hex, 16 ) ) );
			} );
			// decimal references
			result = result.replace( decimalEntityPattern, function( match, charCode ) {
				return String.fromCharCode( validateCode( charCode ) );
			} );
			return result;
		};
		// some code points are verboten. If we were inserting HTML, the browser would replace the illegal
		// code points with alternatives in some cases - since we're bypassing that mechanism, we need
		// to replace them ourselves
		//
		// Source: http://en.wikipedia.org/wiki/Character_encodings_in_HTML#Illegal_characters
		function validateCode( code ) {
			if ( !code ) {
				return 65533;
			}
			// line feed becomes generic whitespace
			if ( code === 10 ) {
				return 32;
			}
			// ASCII range. (Why someone would use HTML entities for ASCII characters I don't know, but...)
			if ( code < 128 ) {
				return code;
			}
			// code points 128-159 are dealt with leniently by browsers, but they're incorrect. We need
			// to correct the mistake or we'll end up with missing € signs and so on
			if ( code <= 159 ) {
				return controlCharacters[ code - 128 ];
			}
			// basic multilingual plane
			if ( code < 55296 ) {
				return code;
			}
			// UTF-16 surrogate halves
			if ( code <= 57343 ) {
				return 65533;
			}
			// rest of the basic multilingual plane
			if ( code <= 65535 ) {
				return code;
			}
			return 65533;
		}
	}( legacy );

	/* parse/converters/text.js */
	var text = function( getLowestIndex, decodeCharacterReferences ) {

		return function( parser ) {
			var index, remaining, disallowed, barrier;
			remaining = parser.remaining();
			barrier = parser.inside ? '</' + parser.inside : '<';
			if ( parser.inside && !parser.interpolate[ parser.inside ] ) {
				index = remaining.indexOf( barrier );
			} else {
				disallowed = [
					barrier,
					parser.delimiters[ 0 ],
					parser.tripleDelimiters[ 0 ],
					parser.staticDelimiters[ 0 ],
					parser.staticTripleDelimiters[ 0 ]
				];
				// http://developers.whatwg.org/syntax.html#syntax-attributes
				if ( parser.inAttribute === true ) {
					// we're inside an unquoted attribute value
					disallowed.push( '"', '\'', '=', '>', '`' );
				} else if ( parser.inAttribute ) {
					disallowed.push( parser.inAttribute );
				}
				index = getLowestIndex( remaining, disallowed );
			}
			if ( !index ) {
				return null;
			}
			if ( index === -1 ) {
				index = remaining.length;
			}
			parser.pos += index;
			return decodeCharacterReferences( remaining.substr( 0, index ) );
		};
	}( getLowestIndex, decodeCharacterReferences );

	/* parse/converters/element/closingTag.js */
	var closingTag = function( types ) {

		var closingTagPattern = /^([a-zA-Z]{1,}:?[a-zA-Z0-9\-]*)\s*\>/;
		return function( parser ) {
			var tag;
			// are we looking at a closing tag?
			if ( !parser.matchString( '</' ) ) {
				return null;
			}
			if ( tag = parser.matchPattern( closingTagPattern ) ) {
				return {
					t: types.CLOSING_TAG,
					e: tag
				};
			}
			// We have an illegal closing tag, report it
			parser.pos -= 2;
			parser.error( 'Illegal closing tag' );
		};
	}( types );

	/* parse/converters/element/attribute.js */
	var attribute = function( getLowestIndex, getMustache ) {

		var attributeNamePattern = /^[^\s"'>\/=]+/,
			unquotedAttributeValueTextPattern = /^[^\s"'=<>`]+/;
		return getAttribute;

		function getAttribute( parser ) {
			var attr, name, value;
			parser.allowWhitespace();
			name = parser.matchPattern( attributeNamePattern );
			if ( !name ) {
				return null;
			}
			attr = {
				name: name
			};
			value = getAttributeValue( parser );
			if ( value ) {
				attr.value = value;
			}
			return attr;
		}

		function getAttributeValue( parser ) {
			var start, valueStart, startDepth, value;
			start = parser.pos;
			parser.allowWhitespace();
			if ( !parser.matchString( '=' ) ) {
				parser.pos = start;
				return null;
			}
			parser.allowWhitespace();
			valueStart = parser.pos;
			startDepth = parser.sectionDepth;
			value = getQuotedAttributeValue( parser, '\'' ) || getQuotedAttributeValue( parser, '"' ) || getUnquotedAttributeValue( parser );
			if ( parser.sectionDepth !== startDepth ) {
				parser.pos = valueStart;
				parser.error( 'An attribute value must contain as many opening section tags as closing section tags' );
			}
			if ( value === null ) {
				parser.pos = start;
				return null;
			}
			if ( value.length === 1 && typeof value[ 0 ] === 'string' ) {
				return value[ 0 ];
			}
			return value;
		}

		function getUnquotedAttributeValueToken( parser ) {
			var start, text, index;
			start = parser.pos;
			text = parser.matchPattern( unquotedAttributeValueTextPattern );
			if ( !text ) {
				return null;
			}
			if ( ( index = text.indexOf( parser.delimiters[ 0 ] ) ) !== -1 ) {
				text = text.substr( 0, index );
				parser.pos = start + text.length;
			}
			return text;
		}

		function getUnquotedAttributeValue( parser ) {
			var tokens, token;
			parser.inAttribute = true;
			tokens = [];
			token = getMustache( parser ) || getUnquotedAttributeValueToken( parser );
			while ( token !== null ) {
				tokens.push( token );
				token = getMustache( parser ) || getUnquotedAttributeValueToken( parser );
			}
			if ( !tokens.length ) {
				return null;
			}
			parser.inAttribute = false;
			return tokens;
		}

		function getQuotedAttributeValue( parser, quoteMark ) {
			var start, tokens, token;
			start = parser.pos;
			if ( !parser.matchString( quoteMark ) ) {
				return null;
			}
			parser.inAttribute = quoteMark;
			tokens = [];
			token = getMustache( parser ) || getQuotedStringToken( parser, quoteMark );
			while ( token !== null ) {
				tokens.push( token );
				token = getMustache( parser ) || getQuotedStringToken( parser, quoteMark );
			}
			if ( !parser.matchString( quoteMark ) ) {
				parser.pos = start;
				return null;
			}
			parser.inAttribute = false;
			return tokens;
		}

		function getQuotedStringToken( parser, quoteMark ) {
			var start, index, remaining;
			start = parser.pos;
			remaining = parser.remaining();
			index = getLowestIndex( remaining, [
				quoteMark,
				parser.delimiters[ 0 ],
				parser.delimiters[ 1 ]
			] );
			if ( index === -1 ) {
				parser.error( 'Quoted attribute value must have a closing quote' );
			}
			if ( !index ) {
				return null;
			}
			parser.pos += index;
			return remaining.substr( 0, index );
		}
	}( getLowestIndex, mustache );

	/* utils/parseJSON.js */
	var parseJSON = function( Parser, getStringLiteral, getKey ) {

		// simple JSON parser, without the restrictions of JSON parse
		// (i.e. having to double-quote keys).
		//
		// If passed a hash of values as the second argument, ${placeholders}
		// will be replaced with those values
		var JsonParser, specials, specialsPattern, numberPattern, placeholderPattern, placeholderAtStartPattern, onlyWhitespace;
		specials = {
			'true': true,
			'false': false,
			'undefined': undefined,
			'null': null
		};
		specialsPattern = new RegExp( '^(?:' + Object.keys( specials ).join( '|' ) + ')' );
		numberPattern = /^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/;
		placeholderPattern = /\$\{([^\}]+)\}/g;
		placeholderAtStartPattern = /^\$\{([^\}]+)\}/;
		onlyWhitespace = /^\s*$/;
		JsonParser = Parser.extend( {
			init: function( str, options ) {
				this.values = options.values;
			},
			postProcess: function( result ) {
				if ( result.length !== 1 || !onlyWhitespace.test( this.leftover ) ) {
					return null;
				}
				return {
					value: result[ 0 ].v
				};
			},
			converters: [

				function getPlaceholder( parser ) {
					var placeholder;
					if ( !parser.values ) {
						return null;
					}
					placeholder = parser.matchPattern( placeholderAtStartPattern );
					if ( placeholder && parser.values.hasOwnProperty( placeholder ) ) {
						return {
							v: parser.values[ placeholder ]
						};
					}
				},
				function getSpecial( parser ) {
					var special;
					if ( special = parser.matchPattern( specialsPattern ) ) {
						return {
							v: specials[ special ]
						};
					}
				},
				function getNumber( parser ) {
					var number;
					if ( number = parser.matchPattern( numberPattern ) ) {
						return {
							v: +number
						};
					}
				},
				function getString( parser ) {
					var stringLiteral = getStringLiteral( parser ),
						values;
					if ( stringLiteral && ( values = parser.values ) ) {
						return {
							v: stringLiteral.v.replace( placeholderPattern, function( match, $1 ) {
								return $1 in values ? values[ $1 ] : $1;
							} )
						};
					}
					return stringLiteral;
				},
				function getObject( parser ) {
					var result, pair;
					if ( !parser.matchString( '{' ) ) {
						return null;
					}
					result = {};
					parser.allowWhitespace();
					if ( parser.matchString( '}' ) ) {
						return {
							v: result
						};
					}
					while ( pair = getKeyValuePair( parser ) ) {
						result[ pair.key ] = pair.value;
						parser.allowWhitespace();
						if ( parser.matchString( '}' ) ) {
							return {
								v: result
							};
						}
						if ( !parser.matchString( ',' ) ) {
							return null;
						}
					}
					return null;
				},
				function getArray( parser ) {
					var result, valueToken;
					if ( !parser.matchString( '[' ) ) {
						return null;
					}
					result = [];
					parser.allowWhitespace();
					if ( parser.matchString( ']' ) ) {
						return {
							v: result
						};
					}
					while ( valueToken = parser.read() ) {
						result.push( valueToken.v );
						parser.allowWhitespace();
						if ( parser.matchString( ']' ) ) {
							return {
								v: result
							};
						}
						if ( !parser.matchString( ',' ) ) {
							return null;
						}
						parser.allowWhitespace();
					}
					return null;
				}
			]
		} );

		function getKeyValuePair( parser ) {
			var key, valueToken, pair;
			parser.allowWhitespace();
			key = getKey( parser );
			if ( !key ) {
				return null;
			}
			pair = {
				key: key
			};
			parser.allowWhitespace();
			if ( !parser.matchString( ':' ) ) {
				return null;
			}
			parser.allowWhitespace();
			valueToken = parser.read();
			if ( !valueToken ) {
				return null;
			}
			pair.value = valueToken.v;
			return pair;
		}
		return function( str, values ) {
			var parser = new JsonParser( str, {
				values: values
			} );
			return parser.result;
		};
	}( Parser, stringLiteral, key );

	/* parse/converters/element/processDirective.js */
	var processDirective = function( parseJSON ) {

		// TODO clean this up, it's shocking
		return function( tokens ) {
			var result, token, colonIndex, directiveName, directiveArgs, parsed;
			if ( typeof tokens === 'string' ) {
				if ( tokens.indexOf( ':' ) === -1 ) {
					return tokens.trim();
				}
				tokens = [ tokens ];
			}
			result = {};
			directiveName = [];
			directiveArgs = [];
			while ( tokens.length ) {
				token = tokens.shift();
				if ( typeof token === 'string' ) {
					colonIndex = token.indexOf( ':' );
					if ( colonIndex === -1 ) {
						directiveName.push( token );
					} else {
						// is the colon the first character?
						if ( colonIndex ) {
							// no
							directiveName.push( token.substr( 0, colonIndex ) );
						}
						// if there is anything after the colon in this token, treat
						// it as the first token of the directiveArgs fragment
						if ( token.length > colonIndex + 1 ) {
							directiveArgs[ 0 ] = token.substring( colonIndex + 1 );
						}
						break;
					}
				} else {
					directiveName.push( token );
				}
			}
			directiveArgs = directiveArgs.concat( tokens );
			if ( directiveArgs.length || typeof directiveName !== 'string' ) {
				result = {
					// TODO is this really necessary? just use the array
					n: directiveName.length === 1 && typeof directiveName[ 0 ] === 'string' ? directiveName[ 0 ] : directiveName
				};
				if ( directiveArgs.length === 1 && typeof directiveArgs[ 0 ] === 'string' ) {
					parsed = parseJSON( '[' + directiveArgs[ 0 ] + ']' );
					result.a = parsed ? parsed.value : directiveArgs[ 0 ].trim();
				} else {
					result.d = directiveArgs;
				}
			} else {
				result = directiveName;
			}
			return result;
		};
	}( parseJSON );

	/* parse/converters/element.js */
	var element = function( types, voidElementNames, getMustache, getComment, getText, getClosingTag, getAttribute, processDirective ) {

		var tagNamePattern = /^[a-zA-Z]{1,}:?[a-zA-Z0-9\-]*/,
			validTagNameFollower = /^[\s\n\/>]/,
			onPattern = /^on/,
			proxyEventPattern = /^on-([a-zA-Z$_][a-zA-Z$_0-9\-]+)$/,
			reservedEventNames = /^(?:change|reset|teardown|update)$/,
			directives = {
				'intro-outro': 't0',
				intro: 't1',
				outro: 't2',
				decorator: 'o'
			},
			exclude = {
				exclude: true
			},
			converters;
		// Different set of converters, because this time we're looking for closing tags
		converters = [
			getMustache,
			getComment,
			getElement,
			getText,
			getClosingTag
		];
		return getElement;

		function getElement( parser ) {
			var start, startPos, element, lowerCaseName, directiveName, match, addProxyEvent, attribute, directive, selfClosing, children, child;
			start = parser.pos;
			startPos = parser.getLinePos();
			if ( parser.inside ) {
				return null;
			}
			if ( !parser.matchString( '<' ) ) {
				return null;
			}
			// if this is a closing tag, abort straight away
			if ( parser.nextChar() === '/' ) {
				return null;
			}
			element = {
				t: types.ELEMENT
			};
			if ( parser.includeLinePositions ) {
				element.p = startPos.toJSON();
			}
			if ( parser.matchString( '!' ) ) {
				element.y = 1;
			}
			// element name
			element.e = parser.matchPattern( tagNamePattern );
			if ( !element.e ) {
				return null;
			}
			// next character must be whitespace, closing solidus or '>'
			if ( !validTagNameFollower.test( parser.nextChar() ) ) {
				parser.error( 'Illegal tag name' );
			}
			addProxyEvent = function( name, directive ) {
				var directiveName = directive.n || directive;
				if ( reservedEventNames.test( directiveName ) ) {
					parser.pos -= directiveName.length;
					parser.error( 'Cannot use reserved event names (change, reset, teardown, update)' );
				}
				element.v[ name ] = directive;
			};
			// directives and attributes
			while ( attribute = getAttribute( parser ) ) {
				// intro, outro, decorator
				if ( directiveName = directives[ attribute.name ] ) {
					element[ directiveName ] = processDirective( attribute.value );
				} else if ( match = proxyEventPattern.exec( attribute.name ) ) {
					if ( !element.v )
						element.v = {};
					directive = processDirective( attribute.value );
					addProxyEvent( match[ 1 ], directive );
				} else {
					if ( !parser.sanitizeEventAttributes || !onPattern.test( attribute.name ) ) {
						if ( !element.a )
							element.a = {};
						element.a[ attribute.name ] = attribute.value || 0;
					}
				}
			}
			// allow whitespace before closing solidus
			parser.allowWhitespace();
			// self-closing solidus?
			if ( parser.matchString( '/' ) ) {
				selfClosing = true;
			}
			// closing angle bracket
			if ( !parser.matchString( '>' ) ) {
				return null;
			}
			lowerCaseName = element.e.toLowerCase();
			if ( !selfClosing && !voidElementNames.test( element.e ) ) {
				// Special case - if we open a script element, further tags should
				// be ignored unless they're a closing script element
				if ( lowerCaseName === 'script' || lowerCaseName === 'style' ) {
					parser.inside = lowerCaseName;
				}
				children = [];
				while ( child = parser.read( converters ) ) {
					// Special case - closing section tag
					if ( child.t === types.CLOSING ) {
						break;
					}
					if ( child.t === types.CLOSING_TAG ) {
						break;
					}
					children.push( child );
				}
				if ( children.length ) {
					element.f = children;
				}
			}
			parser.inside = null;
			if ( parser.sanitizeElements && parser.sanitizeElements.indexOf( lowerCaseName ) !== -1 ) {
				return exclude;
			}
			return element;
		}
	}( types, voidElementNames, mustache, comment, text, closingTag, attribute, processDirective );

	/* parse/utils/trimWhitespace.js */
	var trimWhitespace = function() {

		var leadingWhitespace = /^[ \t\f\r\n]+/,
			trailingWhitespace = /[ \t\f\r\n]+$/;
		return function( items, leading, trailing ) {
			var item;
			if ( leading ) {
				item = items[ 0 ];
				if ( typeof item === 'string' ) {
					item = item.replace( leadingWhitespace, '' );
					if ( !item ) {
						items.shift();
					} else {
						items[ 0 ] = item;
					}
				}
			}
			if ( trailing ) {
				item = items[ items.length - 1 ];
				if ( typeof item === 'string' ) {
					item = item.replace( trailingWhitespace, '' );
					if ( !item ) {
						items.pop();
					} else {
						items[ items.length - 1 ] = item;
					}
				}
			}
		};
	}();

	/* parse/utils/stripStandalones.js */
	var stripStandalones = function( types ) {

		var leadingLinebreak = /^\s*\r?\n/,
			trailingLinebreak = /\r?\n\s*$/;
		return function( items ) {
			var i, current, backOne, backTwo, lastSectionItem;
			for ( i = 1; i < items.length; i += 1 ) {
				current = items[ i ];
				backOne = items[ i - 1 ];
				backTwo = items[ i - 2 ];
				// if we're at the end of a [text][comment][text] sequence...
				if ( isString( current ) && isComment( backOne ) && isString( backTwo ) ) {
					// ... and the comment is a standalone (i.e. line breaks either side)...
					if ( trailingLinebreak.test( backTwo ) && leadingLinebreak.test( current ) ) {
						// ... then we want to remove the whitespace after the first line break
						items[ i - 2 ] = backTwo.replace( trailingLinebreak, '\n' );
						// and the leading line break of the second text token
						items[ i ] = current.replace( leadingLinebreak, '' );
					}
				}
				// if the current item is a section, and it is preceded by a linebreak, and
				// its first item is a linebreak...
				if ( isSection( current ) && isString( backOne ) ) {
					if ( trailingLinebreak.test( backOne ) && isString( current.f[ 0 ] ) && leadingLinebreak.test( current.f[ 0 ] ) ) {
						items[ i - 1 ] = backOne.replace( trailingLinebreak, '\n' );
						current.f[ 0 ] = current.f[ 0 ].replace( leadingLinebreak, '' );
					}
				}
				// if the last item was a section, and it is followed by a linebreak, and
				// its last item is a linebreak...
				if ( isString( current ) && isSection( backOne ) ) {
					lastSectionItem = backOne.f[ backOne.f.length - 1 ];
					if ( isString( lastSectionItem ) && trailingLinebreak.test( lastSectionItem ) && leadingLinebreak.test( current ) ) {
						backOne.f[ backOne.f.length - 1 ] = lastSectionItem.replace( trailingLinebreak, '\n' );
						items[ i ] = current.replace( leadingLinebreak, '' );
					}
				}
			}
			return items;
		};

		function isString( item ) {
			return typeof item === 'string';
		}

		function isComment( item ) {
			return item.t === types.COMMENT || item.t === types.DELIMCHANGE;
		}

		function isSection( item ) {
			return ( item.t === types.SECTION || item.t === types.INVERTED ) && item.f;
		}
	}( types );

	/* parse/_parse.js */
	var parse = function( types, Parser, mustache, comment, element, text, trimWhitespace, stripStandalones ) {

		// Ractive.parse
		// ===============
		//
		// Takes in a string, and returns an object representing the parsed template.
		// A parsed template is an array of 1 or more 'templates', which in some
		// cases have children.
		//
		// The format is optimised for size, not readability, however for reference the
		// keys for each template are as follows:
		//
		// * r - Reference, e.g. 'mustache' in {{mustache}}
		// * t - Type code (e.g. 1 is text, 2 is interpolator...)
		// * f - Fragment. Contains a template's children
		// * l - eLse fragment. Contains a template's children in the else case
		// * e - Element name
		// * a - map of element Attributes, or proxy event/transition Arguments
		// * d - Dynamic proxy event/transition arguments
		// * n - indicates an iNverted section
		// * i - Index reference, e.g. 'num' in {{#section:num}}content{{/section}}
		// * v - eVent proxies (i.e. when user e.g. clicks on a node, fire proxy event)
		// * x - eXpressions
		// * s - String representation of an expression function
		// * t0 - intro/outro Transition
		// * t1 - intro Transition
		// * t2 - outro Transition
		// * o - decOrator
		// * y - is doctYpe
		// * c - is Content (e.g. of a comment node)
		// * p - line Position information - array with line number and character position of each node
		var StandardParser, parse, contiguousWhitespace = /[ \t\f\r\n]+/g,
			inlinePartialStart = /<!--\s*\{\{\s*>\s*([a-zA-Z_$][a-zA-Z_$0-9]*)\s*}\}\s*-->/,
			inlinePartialEnd = /<!--\s*\{\{\s*\/\s*([a-zA-Z_$][a-zA-Z_$0-9]*)\s*}\}\s*-->/,
			preserveWhitespaceElements = /^(?:pre|script|style|textarea)$/i,
			leadingWhitespace = /^\s+/,
			trailingWhitespace = /\s+$/;
		StandardParser = Parser.extend( {
			init: function( str, options ) {
				// config
				this.delimiters = options.delimiters || [
					'{{',
					'}}'
				];
				this.tripleDelimiters = options.tripleDelimiters || [
					'{{{',
					'}}}'
				];
				this.staticDelimiters = options.staticDelimiters || [
					'[[',
					']]'
				];
				this.staticTripleDelimiters = options.staticTripleDelimiters || [
					'[[[',
					']]]'
				];
				this.sectionDepth = 0;
				this.interpolate = {
					script: !options.interpolate || options.interpolate.script !== false,
					style: !options.interpolate || options.interpolate.style !== false
				};
				if ( options.sanitize === true ) {
					options.sanitize = {
						// blacklist from https://code.google.com/p/google-caja/source/browse/trunk/src/com/google/caja/lang/html/html4-elements-whitelist.json
						elements: 'applet base basefont body frame frameset head html isindex link meta noframes noscript object param script style title'.split( ' ' ),
						eventAttributes: true
					};
				}
				this.sanitizeElements = options.sanitize && options.sanitize.elements;
				this.sanitizeEventAttributes = options.sanitize && options.sanitize.eventAttributes;
				this.includeLinePositions = options.includeLinePositions;
			},
			postProcess: function( items, options ) {
				if ( this.sectionDepth > 0 ) {
					this.error( 'A section was left open' );
				}
				cleanup( items, options.stripComments !== false, options.preserveWhitespace, !options.preserveWhitespace, !options.preserveWhitespace, options.rewriteElse !== false );
				return items;
			},
			converters: [
				mustache,
				comment,
				element,
				text
			]
		} );
		parse = function( template ) {
			var options = arguments[ 1 ];
			if ( options === void 0 )
				options = {};
			var result, remaining, partials, name, startMatch, endMatch;
			result = {
				v: 1
			};
			if ( inlinePartialStart.test( template ) ) {
				remaining = template;
				template = '';
				while ( startMatch = inlinePartialStart.exec( remaining ) ) {
					name = startMatch[ 1 ];
					template += remaining.substr( 0, startMatch.index );
					remaining = remaining.substring( startMatch.index + startMatch[ 0 ].length );
					endMatch = inlinePartialEnd.exec( remaining );
					if ( !endMatch || endMatch[ 1 ] !== name ) {
						throw new Error( 'Inline partials must have a closing delimiter, and cannot be nested' );
					}
					( partials || ( partials = {} ) )[ name ] = new StandardParser( remaining.substr( 0, endMatch.index ), options ).result;
					remaining = remaining.substring( endMatch.index + endMatch[ 0 ].length );
				}
				result.p = partials;
			}
			result.t = new StandardParser( template, options ).result;
			return result;
		};
		return parse;

		function cleanup( items, stripComments, preserveWhitespace, removeLeadingWhitespace, removeTrailingWhitespace, rewriteElse ) {
			var i, item, previousItem, nextItem, preserveWhitespaceInsideFragment, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespaceInsideFragment, unlessBlock, key;
			// First pass - remove standalones and comments etc
			stripStandalones( items );
			i = items.length;
			while ( i-- ) {
				item = items[ i ];
				// Remove delimiter changes, unsafe elements etc
				if ( item.exclude ) {
					items.splice( i, 1 );
				} else if ( stripComments && item.t === types.COMMENT ) {
					items.splice( i, 1 );
				}
			}
			// If necessary, remove leading and trailing whitespace
			trimWhitespace( items, removeLeadingWhitespace, removeTrailingWhitespace );
			i = items.length;
			while ( i-- ) {
				item = items[ i ];
				// Recurse
				if ( item.f ) {
					preserveWhitespaceInsideFragment = preserveWhitespace || item.t === types.ELEMENT && preserveWhitespaceElements.test( item.e );
					if ( !preserveWhitespaceInsideFragment ) {
						previousItem = items[ i - 1 ];
						nextItem = items[ i + 1 ];
						// if the previous item was a text item with trailing whitespace,
						// remove leading whitespace inside the fragment
						if ( !previousItem || typeof previousItem === 'string' && trailingWhitespace.test( previousItem ) ) {
							removeLeadingWhitespaceInsideFragment = true;
						}
						// and vice versa
						if ( !nextItem || typeof nextItem === 'string' && leadingWhitespace.test( nextItem ) ) {
							removeTrailingWhitespaceInsideFragment = true;
						}
					}
					cleanup( item.f, stripComments, preserveWhitespaceInsideFragment, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespaceInsideFragment, rewriteElse );
					// Split if-else blocks into two (an if, and an unless)
					if ( item.l ) {
						cleanup( item.l, stripComments, preserveWhitespace, removeLeadingWhitespaceInsideFragment, removeTrailingWhitespaceInsideFragment, rewriteElse );
						if ( rewriteElse ) {
							unlessBlock = {
								t: 4,
								n: types.SECTION_UNLESS,
								f: item.l
							};
							// copy the conditional based on its type
							if ( item.r ) {
								unlessBlock.r = item.r;
							}
							if ( item.x ) {
								unlessBlock.x = item.x;
							}
							if ( item.rx ) {
								unlessBlock.rx = item.rx;
							}
							items.splice( i + 1, 0, unlessBlock );
							delete item.l;
						}
					}
				}
				// Clean up element attributes
				if ( item.a ) {
					for ( key in item.a ) {
						if ( item.a.hasOwnProperty( key ) && typeof item.a[ key ] !== 'string' ) {
							cleanup( item.a[ key ], stripComments, preserveWhitespace, rewriteElse );
						}
					}
				}
			}
			// final pass - fuse text nodes together
			i = items.length;
			while ( i-- ) {
				if ( typeof items[ i ] === 'string' ) {
					if ( typeof items[ i + 1 ] === 'string' ) {
						items[ i ] = items[ i ] + items[ i + 1 ];
						items.splice( i + 1, 1 );
					}
					if ( !preserveWhitespace ) {
						items[ i ] = items[ i ].replace( contiguousWhitespace, ' ' );
					}
					if ( items[ i ] === '' ) {
						items.splice( i, 1 );
					}
				}
			}
		}
	}( types, Parser, mustache, comment, element, text, trimWhitespace, stripStandalones );

	/* config/options/groups/optionGroup.js */
	var optionGroup = function() {

		return function createOptionGroup( keys, config ) {
			var group = keys.map( config );
			keys.forEach( function( key, i ) {
				group[ key ] = group[ i ];
			} );
			return group;
		};
	}( legacy );

	/* config/options/groups/parseOptions.js */
	var parseOptions = function( optionGroup ) {

		var keys, parseOptions;
		keys = [
			'preserveWhitespace',
			'sanitize',
			'stripComments',
			'delimiters',
			'tripleDelimiters'
		];
		parseOptions = optionGroup( keys, function( key ) {
			return key;
		} );
		return parseOptions;
	}( optionGroup );

	/* config/options/template/parser.js */
	var parser = function( errors, isClient, parse, create, parseOptions ) {

		var parser = {
			parse: doParse,
			fromId: fromId,
			isHashedId: isHashedId,
			isParsed: isParsed,
			getParseOptions: getParseOptions,
			createHelper: createHelper
		};

		function createHelper( parseOptions ) {
			var helper = create( parser );
			helper.parse = function( template, options ) {
				return doParse( template, options || parseOptions );
			};
			return helper;
		}

		function doParse( template, parseOptions ) {
			if ( !parse ) {
				throw new Error( errors.missingParser );
			}
			return parse( template, parseOptions || this.options );
		}

		function fromId( id, options ) {
			var template;
			if ( !isClient ) {
				if ( options && options.noThrow ) {
					return;
				}
				throw new Error( 'Cannot retrieve template #' + id + ' as Ractive is not running in a browser.' );
			}
			if ( isHashedId( id ) ) {
				id = id.substring( 1 );
			}
			if ( !( template = document.getElementById( id ) ) ) {
				if ( options && options.noThrow ) {
					return;
				}
				throw new Error( 'Could not find template element with id #' + id );
			}
			// Do we want to turn this on?
			/*
            	if ( template.tagName.toUpperCase() !== 'SCRIPT' )) {
            		if ( options && options.noThrow ) { return; }
            		throw new Error( 'Template element with id #' + id + ', must be a <script> element' );
            	}
            	*/
			return template.innerHTML;
		}

		function isHashedId( id ) {
			return id.charAt( 0 ) === '#';
		}

		function isParsed( template ) {
			return !( typeof template === 'string' );
		}

		function getParseOptions( ractive ) {
			// Could be Ractive or a Component
			if ( ractive.defaults ) {
				ractive = ractive.defaults;
			}
			return parseOptions.reduce( function( val, key ) {
				val[ key ] = ractive[ key ];
				return val;
			}, {} );
		}
		return parser;
	}( errors, isClient, parse, create, parseOptions );

	/* config/options/template/template.js */
	var template = function( parser, parse ) {

		var templateConfig = {
			name: 'template',
			extend: function extend( Parent, proto, options ) {
				var template;
				// only assign if exists
				if ( 'template' in options ) {
					template = options.template;
					if ( typeof template === 'function' ) {
						proto.template = template;
					} else {
						proto.template = parseIfString( template, proto );
					}
				}
			},
			init: function init( Parent, ractive, options ) {
				var template, fn;
				// TODO because of prototypal inheritance, we might just be able to use
				// ractive.template, and not bother passing through the Parent object.
				// At present that breaks the test mocks' expectations
				template = 'template' in options ? options.template : Parent.prototype.template;
				if ( typeof template === 'function' ) {
					fn = template;
					template = getDynamicTemplate( ractive, fn );
					ractive._config.template = {
						fn: fn,
						result: template
					};
				}
				template = parseIfString( template, ractive );
				// TODO the naming of this is confusing - ractive.template refers to [...],
				// but Component.prototype.template refers to {v:1,t:[],p:[]}...
				// it's unnecessary, because the developer never needs to access
				// ractive.template
				ractive.template = template.t;
				if ( template.p ) {
					extendPartials( ractive.partials, template.p );
				}
			},
			reset: function( ractive ) {
				var result = resetValue( ractive ),
					parsed;
				if ( result ) {
					parsed = parseIfString( result, ractive );
					ractive.template = parsed.t;
					extendPartials( ractive.partials, parsed.p, true );
					return true;
				}
			}
		};

		function resetValue( ractive ) {
			var initial = ractive._config.template,
				result;
			// If this isn't a dynamic template, there's nothing to do
			if ( !initial || !initial.fn ) {
				return;
			}
			result = getDynamicTemplate( ractive, initial.fn );
			// TODO deep equality check to prevent unnecessary re-rendering
			// in the case of already-parsed templates
			if ( result !== initial.result ) {
				initial.result = result;
				result = parseIfString( result, ractive );
				return result;
			}
		}

		function getDynamicTemplate( ractive, fn ) {
			var helper = parser.createHelper( parser.getParseOptions( ractive ) );
			return fn.call( ractive, ractive.data, helper );
		}

		function parseIfString( template, ractive ) {
			if ( typeof template === 'string' ) {
				// ID of an element containing the template?
				if ( template[ 0 ] === '#' ) {
					template = parser.fromId( template );
				}
				template = parse( template, parser.getParseOptions( ractive ) );
			} else if ( template.v !== 1 ) {
				throw new Error( 'Mismatched template version! Please ensure you are using the latest version of Ractive.js in your build process as well as in your app' );
			}
			return template;
		}

		function extendPartials( existingPartials, newPartials, overwrite ) {
			if ( !newPartials )
				return;
			// TODO there's an ambiguity here - we need to overwrite in the `reset()`
			// case, but not initially...
			for ( var key in newPartials ) {
				if ( overwrite || !existingPartials.hasOwnProperty( key ) ) {
					existingPartials[ key ] = newPartials[ key ];
				}
			}
		}
		return templateConfig;
	}( parser, parse );

	/* config/options/Registry.js */
	var Registry = function( create ) {

		function Registry( name, useDefaults ) {
			this.name = name;
			this.useDefaults = useDefaults;
		}
		Registry.prototype = {
			constructor: Registry,
			extend: function( Parent, proto, options ) {
				this.configure( this.useDefaults ? Parent.defaults : Parent, this.useDefaults ? proto : proto.constructor, options );
			},
			init: function( Parent, ractive, options ) {
				this.configure( this.useDefaults ? Parent.defaults : Parent, ractive, options );
			},
			configure: function( Parent, target, options ) {
				var name = this.name,
					option = options[ name ],
					registry;
				registry = create( Parent[ name ] );
				for ( var key in option ) {
					registry[ key ] = option[ key ];
				}
				target[ name ] = registry;
			},
			reset: function( ractive ) {
				var registry = ractive[ this.name ];
				var changed = false;
				Object.keys( registry ).forEach( function( key ) {
					var item = registry[ key ];
					if ( item._fn ) {
						if ( item._fn.isOwner ) {
							registry[ key ] = item._fn;
						} else {
							delete registry[ key ];
						}
						changed = true;
					}
				} );
				return changed;
			},
			findOwner: function( ractive, key ) {
				return ractive[ this.name ].hasOwnProperty( key ) ? ractive : this.findConstructor( ractive.constructor, key );
			},
			findConstructor: function( constructor, key ) {
				if ( !constructor ) {
					return;
				}
				return constructor[ this.name ].hasOwnProperty( key ) ? constructor : this.findConstructor( constructor._parent, key );
			},
			find: function( ractive, key ) {
				var this$0 = this;
				return recurseFind( ractive, function( r ) {
					return r[ this$0.name ][ key ];
				} );
			},
			findInstance: function( ractive, key ) {
				var this$0 = this;
				return recurseFind( ractive, function( r ) {
					return r[ this$0.name ][ key ] ? r : void 0;
				} );
			}
		};

		function recurseFind( ractive, fn ) {
			var find, parent;
			if ( find = fn( ractive ) ) {
				return find;
			}
			if ( !ractive.isolated && ( parent = ractive._parent ) ) {
				return recurseFind( parent, fn );
			}
		}
		return Registry;
	}( create, legacy );

	/* config/options/groups/registries.js */
	var registries = function( optionGroup, Registry ) {

		var keys = [
				'adaptors',
				'components',
				'computed',
				'decorators',
				'easing',
				'events',
				'interpolators',
				'partials',
				'transitions'
			],
			registries = optionGroup( keys, function( key ) {
				return new Registry( key, key === 'computed' );
			} );
		return registries;
	}( optionGroup, Registry );

	/* utils/noop.js */
	var noop = function() {};

	/* utils/wrapPrototypeMethod.js */
	var wrapPrototypeMethod = function( noop ) {

		return function wrap( parent, name, method ) {
			if ( !/_super/.test( method ) ) {
				return method;
			}
			var wrapper = function wrapSuper() {
				var superMethod = getSuperMethod( wrapper._parent, name ),
					hasSuper = '_super' in this,
					oldSuper = this._super,
					result;
				this._super = superMethod;
				result = method.apply( this, arguments );
				if ( hasSuper ) {
					this._super = oldSuper;
				} else {
					delete this._super;
				}
				return result;
			};
			wrapper._parent = parent;
			wrapper._method = method;
			return wrapper;
		};

		function getSuperMethod( parent, name ) {
			var method;
			if ( name in parent ) {
				var value = parent[ name ];
				if ( typeof value === 'function' ) {
					method = value;
				} else {
					method = function returnValue() {
						return value;
					};
				}
			} else {
				method = noop;
			}
			return method;
		}
	}( noop );

	/* config/deprecate.js */
	var deprecate = function( warn, isArray ) {

		function deprecate( options, deprecated, correct ) {
			if ( deprecated in options ) {
				if ( !( correct in options ) ) {
					warn( getMessage( deprecated, correct ) );
					options[ correct ] = options[ deprecated ];
				} else {
					throw new Error( getMessage( deprecated, correct, true ) );
				}
			}
		}

		function getMessage( deprecated, correct, isError ) {
			return 'options.' + deprecated + ' has been deprecated in favour of options.' + correct + '.' + ( isError ? ' You cannot specify both options, please use options.' + correct + '.' : '' );
		}

		function deprecateEventDefinitions( options ) {
			deprecate( options, 'eventDefinitions', 'events' );
		}

		function deprecateAdaptors( options ) {
			// Using extend with Component instead of options,
			// like Human.extend( Spider ) means adaptors as a registry
			// gets copied to options. So we have to check if actually an array
			if ( isArray( options.adaptors ) ) {
				deprecate( options, 'adaptors', 'adapt' );
			}
		}
		return function deprecateOptions( options ) {
			deprecateEventDefinitions( options );
			deprecateAdaptors( options );
		};
	}( warn, isArray );

	/* config/config.js */
	var config = function( css, data, defaults, template, parseOptions, registries, wrap, deprecate ) {

		var custom, options, config;
		custom = {
			data: data,
			template: template,
			css: css
		};
		options = Object.keys( defaults ).filter( function( key ) {
			return !registries[ key ] && !custom[ key ] && !parseOptions[ key ];
		} );
		// this defines the order:
		config = [].concat( custom.data, parseOptions, options, registries, custom.template, custom.css );
		for ( var key in custom ) {
			config[ key ] = custom[ key ];
		}
		// for iteration
		config.keys = Object.keys( defaults ).concat( registries.map( function( r ) {
			return r.name;
		} ) ).concat( [ 'css' ] );
		config.parseOptions = parseOptions;
		config.registries = registries;

		function customConfig( method, key, Parent, instance, options ) {
			custom[ key ][ method ]( Parent, instance, options );
		}
		config.extend = function( Parent, proto, options ) {
			configure( 'extend', Parent, proto, options );
		};
		config.init = function( Parent, ractive, options ) {
			configure( 'init', Parent, ractive, options );
			if ( ractive._config ) {
				ractive._config.options = options;
			}
		};

		function configure( method, Parent, instance, options ) {
			deprecate( options );
			customConfig( method, 'data', Parent, instance, options );
			config.parseOptions.forEach( function( key ) {
				if ( key in options ) {
					instance[ key ] = options[ key ];
				}
			} );
			for ( var key in options ) {
				if ( key in defaults && !( key in config.parseOptions ) && !( key in custom ) ) {
					var value = options[ key ];
					instance[ key ] = typeof value === 'function' ? wrap( Parent.prototype, key, value ) : value;
				}
			}
			config.registries.forEach( function( registry ) {
				registry[ method ]( Parent, instance, options );
			} );
			customConfig( method, 'template', Parent, instance, options );
			customConfig( method, 'css', Parent, instance, options );
		}
		config.reset = function( ractive ) {
			return config.filter( function( c ) {
				return c.reset && c.reset( ractive );
			} ).map( function( c ) {
				return c.name;
			} );
		};
		return config;
	}( css, data, options, template, parseOptions, registries, wrapPrototypeMethod, deprecate );

	/* shared/interpolate.js */
	var interpolate = function( circular, warn, interpolators, config ) {

		var interpolate = function( from, to, ractive, type ) {
			if ( from === to ) {
				return snap( to );
			}
			if ( type ) {
				var interpol = config.registries.interpolators.find( ractive, type );
				if ( interpol ) {
					return interpol( from, to ) || snap( to );
				}
				warn( 'Missing "' + type + '" interpolator. You may need to download a plugin from [TODO]' );
			}
			return interpolators.number( from, to ) || interpolators.array( from, to ) || interpolators.object( from, to ) || interpolators.cssLength( from, to ) || snap( to );
		};
		circular.interpolate = interpolate;
		return interpolate;

		function snap( to ) {
			return function() {
				return to;
			};
		}
	}( circular, warn, interpolators, config );

	/* Ractive/prototype/animate/Animation.js */
	var Ractive$animate_Animation = function( warn, runloop, interpolate ) {

		var Animation = function( options ) {
			var key;
			this.startTime = Date.now();
			// from and to
			for ( key in options ) {
				if ( options.hasOwnProperty( key ) ) {
					this[ key ] = options[ key ];
				}
			}
			this.interpolator = interpolate( this.from, this.to, this.root, this.interpolator );
			this.running = true;
		};
		Animation.prototype = {
			tick: function() {
				var elapsed, t, value, timeNow, index, keypath;
				keypath = this.keypath;
				if ( this.running ) {
					timeNow = Date.now();
					elapsed = timeNow - this.startTime;
					if ( elapsed >= this.duration ) {
						if ( keypath !== null ) {
							runloop.start( this.root );
							this.root.viewmodel.set( keypath, this.to );
							runloop.end();
						}
						if ( this.step ) {
							this.step( 1, this.to );
						}
						this.complete( this.to );
						index = this.root._animations.indexOf( this );
						// TODO investigate why this happens
						if ( index === -1 ) {
							warn( 'Animation was not found' );
						}
						this.root._animations.splice( index, 1 );
						this.running = false;
						return false;
					}
					t = this.easing ? this.easing( elapsed / this.duration ) : elapsed / this.duration;
					if ( keypath !== null ) {
						value = this.interpolator( t );
						runloop.start( this.root );
						this.root.viewmodel.set( keypath, value );
						runloop.end();
					}
					if ( this.step ) {
						this.step( t, value );
					}
					return true;
				}
				return false;
			},
			stop: function() {
				var index;
				this.running = false;
				index = this.root._animations.indexOf( this );
				// TODO investigate why this happens
				if ( index === -1 ) {
					warn( 'Animation was not found' );
				}
				this.root._animations.splice( index, 1 );
			}
		};
		return Animation;
	}( warn, runloop, interpolate );

	/* Ractive/prototype/animate.js */
	var Ractive$animate = function( isEqual, Promise, normaliseKeypath, animations, Animation ) {

		var noop = function() {},
			noAnimation = {
				stop: noop
			};
		return function Ractive$animate( keypath, to, options ) {
			var promise, fulfilPromise, k, animation, animations, easing, duration, step, complete, makeValueCollector, currentValues, collectValue, dummy, dummyOptions;
			promise = new Promise( function( fulfil ) {
				fulfilPromise = fulfil;
			} );
			// animate multiple keypaths
			if ( typeof keypath === 'object' ) {
				options = to || {};
				easing = options.easing;
				duration = options.duration;
				animations = [];
				// we don't want to pass the `step` and `complete` handlers, as they will
				// run for each animation! So instead we'll store the handlers and create
				// our own...
				step = options.step;
				complete = options.complete;
				if ( step || complete ) {
					currentValues = {};
					options.step = null;
					options.complete = null;
					makeValueCollector = function( keypath ) {
						return function( t, value ) {
							currentValues[ keypath ] = value;
						};
					};
				}
				for ( k in keypath ) {
					if ( keypath.hasOwnProperty( k ) ) {
						if ( step || complete ) {
							collectValue = makeValueCollector( k );
							options = {
								easing: easing,
								duration: duration
							};
							if ( step ) {
								options.step = collectValue;
							}
						}
						options.complete = complete ? collectValue : noop;
						animations.push( animate( this, k, keypath[ k ], options ) );
					}
				}
				if ( step || complete ) {
					dummyOptions = {
						easing: easing,
						duration: duration
					};
					if ( step ) {
						dummyOptions.step = function( t ) {
							step( t, currentValues );
						};
					}
					if ( complete ) {
						promise.then( function( t ) {
							complete( t, currentValues );
						} );
					}
					dummyOptions.complete = fulfilPromise;
					dummy = animate( this, null, null, dummyOptions );
					animations.push( dummy );
				}
				return {
					stop: function() {
						var animation;
						while ( animation = animations.pop() ) {
							animation.stop();
						}
						if ( dummy ) {
							dummy.stop();
						}
					}
				};
			}
			// animate a single keypath
			options = options || {};
			if ( options.complete ) {
				promise.then( options.complete );
			}
			options.complete = fulfilPromise;
			animation = animate( this, keypath, to, options );
			promise.stop = function() {
				animation.stop();
			};
			return promise;
		};

		function animate( root, keypath, to, options ) {
			var easing, duration, animation, from;
			if ( keypath ) {
				keypath = normaliseKeypath( keypath );
			}
			if ( keypath !== null ) {
				from = root.viewmodel.get( keypath );
			}
			// cancel any existing animation
			// TODO what about upstream/downstream keypaths?
			animations.abort( keypath, root );
			// don't bother animating values that stay the same
			if ( isEqual( from, to ) ) {
				if ( options.complete ) {
					options.complete( options.to );
				}
				return noAnimation;
			}
			// easing function
			if ( options.easing ) {
				if ( typeof options.easing === 'function' ) {
					easing = options.easing;
				} else {
					easing = root.easing[ options.easing ];
				}
				if ( typeof easing !== 'function' ) {
					easing = null;
				}
			}
			// duration
			duration = options.duration === undefined ? 400 : options.duration;
			// TODO store keys, use an internal set method
			animation = new Animation( {
				keypath: keypath,
				from: from,
				to: to,
				root: root,
				duration: duration,
				easing: easing,
				interpolator: options.interpolator,
				// TODO wrap callbacks if necessary, to use instance as context
				step: options.step,
				complete: options.complete
			} );
			animations.add( animation );
			root._animations.push( animation );
			return animation;
		}
	}( isEqual, Promise, normaliseKeypath, animations, Ractive$animate_Animation );

	/* Ractive/prototype/detach.js */
	var Ractive$detach = function( removeFromArray ) {

		return function Ractive$detach() {
			if ( this.el ) {
				removeFromArray( this.el.__ractive_instances__, this );
			}
			return this.fragment.detach();
		};
	}( removeFromArray );

	/* Ractive/prototype/find.js */
	var Ractive$find = function Ractive$find( selector ) {
		if ( !this.el ) {
			return null;
		}
		return this.fragment.find( selector );
	};

	/* utils/matches.js */
	var matches = function( isClient, vendors, createElement ) {

		var matches, div, methodNames, unprefixed, prefixed, i, j, makeFunction;
		if ( !isClient ) {
			matches = null;
		} else {
			div = createElement( 'div' );
			methodNames = [
				'matches',
				'matchesSelector'
			];
			makeFunction = function( methodName ) {
				return function( node, selector ) {
					return node[ methodName ]( selector );
				};
			};
			i = methodNames.length;
			while ( i-- && !matches ) {
				unprefixed = methodNames[ i ];
				if ( div[ unprefixed ] ) {
					matches = makeFunction( unprefixed );
				} else {
					j = vendors.length;
					while ( j-- ) {
						prefixed = vendors[ i ] + unprefixed.substr( 0, 1 ).toUpperCase() + unprefixed.substring( 1 );
						if ( div[ prefixed ] ) {
							matches = makeFunction( prefixed );
							break;
						}
					}
				}
			}
			// IE8...
			if ( !matches ) {
				matches = function( node, selector ) {
					var nodes, parentNode, i;
					parentNode = node.parentNode;
					if ( !parentNode ) {
						// empty dummy <div>
						div.innerHTML = '';
						parentNode = div;
						node = node.cloneNode();
						div.appendChild( node );
					}
					nodes = parentNode.querySelectorAll( selector );
					i = nodes.length;
					while ( i-- ) {
						if ( nodes[ i ] === node ) {
							return true;
						}
					}
					return false;
				};
			}
		}
		return matches;
	}( isClient, vendors, createElement );

	/* Ractive/prototype/shared/makeQuery/test.js */
	var Ractive$shared_makeQuery_test = function( matches ) {

		return function( item, noDirty ) {
			var itemMatches = this._isComponentQuery ? !this.selector || item.name === this.selector : matches( item.node, this.selector );
			if ( itemMatches ) {
				this.push( item.node || item.instance );
				if ( !noDirty ) {
					this._makeDirty();
				}
				return true;
			}
		};
	}( matches );

	/* Ractive/prototype/shared/makeQuery/cancel.js */
	var Ractive$shared_makeQuery_cancel = function() {
		var liveQueries, selector, index;
		liveQueries = this._root[ this._isComponentQuery ? 'liveComponentQueries' : 'liveQueries' ];
		selector = this.selector;
		index = liveQueries.indexOf( selector );
		if ( index !== -1 ) {
			liveQueries.splice( index, 1 );
			liveQueries[ selector ] = null;
		}
	};

	/* Ractive/prototype/shared/makeQuery/sortByItemPosition.js */
	var Ractive$shared_makeQuery_sortByItemPosition = function() {

		return function( a, b ) {
			var ancestryA, ancestryB, oldestA, oldestB, mutualAncestor, indexA, indexB, fragments, fragmentA, fragmentB;
			ancestryA = getAncestry( a.component || a._ractive.proxy );
			ancestryB = getAncestry( b.component || b._ractive.proxy );
			oldestA = ancestryA[ ancestryA.length - 1 ];
			oldestB = ancestryB[ ancestryB.length - 1 ];
			// remove items from the end of both ancestries as long as they are identical
			// - the final one removed is the closest mutual ancestor
			while ( oldestA && oldestA === oldestB ) {
				ancestryA.pop();
				ancestryB.pop();
				mutualAncestor = oldestA;
				oldestA = ancestryA[ ancestryA.length - 1 ];
				oldestB = ancestryB[ ancestryB.length - 1 ];
			}
			// now that we have the mutual ancestor, we can find which is earliest
			oldestA = oldestA.component || oldestA;
			oldestB = oldestB.component || oldestB;
			fragmentA = oldestA.parentFragment;
			fragmentB = oldestB.parentFragment;
			// if both items share a parent fragment, our job is easy
			if ( fragmentA === fragmentB ) {
				indexA = fragmentA.items.indexOf( oldestA );
				indexB = fragmentB.items.indexOf( oldestB );
				// if it's the same index, it means one contains the other,
				// so we see which has the longest ancestry
				return indexA - indexB || ancestryA.length - ancestryB.length;
			}
			// if mutual ancestor is a section, we first test to see which section
			// fragment comes first
			if ( fragments = mutualAncestor.fragments ) {
				indexA = fragments.indexOf( fragmentA );
				indexB = fragments.indexOf( fragmentB );
				return indexA - indexB || ancestryA.length - ancestryB.length;
			}
			throw new Error( 'An unexpected condition was met while comparing the position of two components. Please file an issue at https://github.com/RactiveJS/Ractive/issues - thanks!' );
		};

		function getParent( item ) {
			var parentFragment;
			if ( parentFragment = item.parentFragment ) {
				return parentFragment.owner;
			}
			if ( item.component && ( parentFragment = item.component.parentFragment ) ) {
				return parentFragment.owner;
			}
		}

		function getAncestry( item ) {
			var ancestry, ancestor;
			ancestry = [ item ];
			ancestor = getParent( item );
			while ( ancestor ) {
				ancestry.push( ancestor );
				ancestor = getParent( ancestor );
			}
			return ancestry;
		}
	}();

	/* Ractive/prototype/shared/makeQuery/sortByDocumentPosition.js */
	var Ractive$shared_makeQuery_sortByDocumentPosition = function( sortByItemPosition ) {

		return function( node, otherNode ) {
			var bitmask;
			if ( node.compareDocumentPosition ) {
				bitmask = node.compareDocumentPosition( otherNode );
				return bitmask & 2 ? 1 : -1;
			}
			// In old IE, we can piggy back on the mechanism for
			// comparing component positions
			return sortByItemPosition( node, otherNode );
		};
	}( Ractive$shared_makeQuery_sortByItemPosition );

	/* Ractive/prototype/shared/makeQuery/sort.js */
	var Ractive$shared_makeQuery_sort = function( sortByDocumentPosition, sortByItemPosition ) {

		return function() {
			this.sort( this._isComponentQuery ? sortByItemPosition : sortByDocumentPosition );
			this._dirty = false;
		};
	}( Ractive$shared_makeQuery_sortByDocumentPosition, Ractive$shared_makeQuery_sortByItemPosition );

	/* Ractive/prototype/shared/makeQuery/dirty.js */
	var Ractive$shared_makeQuery_dirty = function( runloop ) {

		return function() {
			var this$0 = this;
			if ( !this._dirty ) {
				this._dirty = true;
				// Once the DOM has been updated, ensure the query
				// is correctly ordered
				runloop.scheduleTask( function() {
					this$0._sort();
				} );
			}
		};
	}( runloop );

	/* Ractive/prototype/shared/makeQuery/remove.js */
	var Ractive$shared_makeQuery_remove = function( nodeOrComponent ) {
		var index = this.indexOf( this._isComponentQuery ? nodeOrComponent.instance : nodeOrComponent );
		if ( index !== -1 ) {
			this.splice( index, 1 );
		}
	};

	/* Ractive/prototype/shared/makeQuery/_makeQuery.js */
	var Ractive$shared_makeQuery__makeQuery = function( defineProperties, test, cancel, sort, dirty, remove ) {

		return function makeQuery( ractive, selector, live, isComponentQuery ) {
			var query = [];
			defineProperties( query, {
				selector: {
					value: selector
				},
				live: {
					value: live
				},
				_isComponentQuery: {
					value: isComponentQuery
				},
				_test: {
					value: test
				}
			} );
			if ( !live ) {
				return query;
			}
			defineProperties( query, {
				cancel: {
					value: cancel
				},
				_root: {
					value: ractive
				},
				_sort: {
					value: sort
				},
				_makeDirty: {
					value: dirty
				},
				_remove: {
					value: remove
				},
				_dirty: {
					value: false,
					writable: true
				}
			} );
			return query;
		};
	}( defineProperties, Ractive$shared_makeQuery_test, Ractive$shared_makeQuery_cancel, Ractive$shared_makeQuery_sort, Ractive$shared_makeQuery_dirty, Ractive$shared_makeQuery_remove );

	/* Ractive/prototype/findAll.js */
	var Ractive$findAll = function( makeQuery ) {

		return function Ractive$findAll( selector, options ) {
			var liveQueries, query;
			if ( !this.el ) {
				return [];
			}
			options = options || {};
			liveQueries = this._liveQueries;
			// Shortcut: if we're maintaining a live query with this
			// selector, we don't need to traverse the parallel DOM
			if ( query = liveQueries[ selector ] ) {
				// Either return the exact same query, or (if not live) a snapshot
				return options && options.live ? query : query.slice();
			}
			query = makeQuery( this, selector, !!options.live, false );
			// Add this to the list of live queries Ractive needs to maintain,
			// if applicable
			if ( query.live ) {
				liveQueries.push( selector );
				liveQueries[ '_' + selector ] = query;
			}
			this.fragment.findAll( selector, query );
			return query;
		};
	}( Ractive$shared_makeQuery__makeQuery );

	/* Ractive/prototype/findAllComponents.js */
	var Ractive$findAllComponents = function( makeQuery ) {

		return function Ractive$findAllComponents( selector, options ) {
			var liveQueries, query;
			options = options || {};
			liveQueries = this._liveComponentQueries;
			// Shortcut: if we're maintaining a live query with this
			// selector, we don't need to traverse the parallel DOM
			if ( query = liveQueries[ selector ] ) {
				// Either return the exact same query, or (if not live) a snapshot
				return options && options.live ? query : query.slice();
			}
			query = makeQuery( this, selector, !!options.live, true );
			// Add this to the list of live queries Ractive needs to maintain,
			// if applicable
			if ( query.live ) {
				liveQueries.push( selector );
				liveQueries[ '_' + selector ] = query;
			}
			this.fragment.findAllComponents( selector, query );
			return query;
		};
	}( Ractive$shared_makeQuery__makeQuery );

	/* Ractive/prototype/findComponent.js */
	var Ractive$findComponent = function Ractive$findComponent( selector ) {
		return this.fragment.findComponent( selector );
	};

	/* Ractive/prototype/fire.js */
	var Ractive$fire = function Ractive$fire( eventName ) {
		var args, i, len, subscribers = this._subs[ eventName ];
		if ( !subscribers ) {
			return;
		}
		args = Array.prototype.slice.call( arguments, 1 );
		for ( i = 0, len = subscribers.length; i < len; i += 1 ) {
			subscribers[ i ].apply( this, args );
		}
	};

	/* Ractive/prototype/get.js */
	var Ractive$get = function( normaliseKeypath ) {

		var options = {
			capture: true
		};
		// top-level calls should be intercepted
		return function Ractive$get( keypath ) {
			keypath = normaliseKeypath( keypath );
			return this.viewmodel.get( keypath, options );
		};
	}( normaliseKeypath );

	/* utils/getElement.js */
	var getElement = function getElement( input ) {
		var output;
		if ( !input || typeof input === 'boolean' ) {
			return;
		}
		if ( typeof window === 'undefined' || !document || !input ) {
			return null;
		}
		// We already have a DOM node - no work to do. (Duck typing alert!)
		if ( input.nodeType ) {
			return input;
		}
		// Get node from string
		if ( typeof input === 'string' ) {
			// try ID first
			output = document.getElementById( input );
			// then as selector, if possible
			if ( !output && document.querySelector ) {
				output = document.querySelector( input );
			}
			// did it work?
			if ( output && output.nodeType ) {
				return output;
			}
		}
		// If we've been given a collection (jQuery, Zepto etc), extract the first item
		if ( input[ 0 ] && input[ 0 ].nodeType ) {
			return input[ 0 ];
		}
		return null;
	};

	/* Ractive/prototype/insert.js */
	var Ractive$insert = function( getElement ) {

		return function Ractive$insert( target, anchor ) {
			if ( !this.rendered ) {
				// TODO create, and link to, documentation explaining this
				throw new Error( 'The API has changed - you must call `ractive.render(target[, anchor])` to render your Ractive instance. Once rendered you can use `ractive.insert()`.' );
			}
			target = getElement( target );
			anchor = getElement( anchor ) || null;
			if ( !target ) {
				throw new Error( 'You must specify a valid target to insert into' );
			}
			target.insertBefore( this.detach(), anchor );
			this.el = target;
			( target.__ractive_instances__ || ( target.__ractive_instances__ = [] ) ).push( this );
		};
	}( getElement );

	/* Ractive/prototype/merge.js */
	var Ractive$merge = function( runloop, isArray, normaliseKeypath ) {

		return function Ractive$merge( keypath, array, options ) {
			var currentArray, promise;
			keypath = normaliseKeypath( keypath );
			currentArray = this.viewmodel.get( keypath );
			// If either the existing value or the new value isn't an
			// array, just do a regular set
			if ( !isArray( currentArray ) || !isArray( array ) ) {
				return this.set( keypath, array, options && options.complete );
			}
			// Manage transitions
			promise = runloop.start( this, true );
			this.viewmodel.merge( keypath, currentArray, array, options );
			runloop.end();
			// attach callback as fulfilment handler, if specified
			if ( options && options.complete ) {
				promise.then( options.complete );
			}
			return promise;
		};
	}( runloop, isArray, normaliseKeypath );

	/* Ractive/prototype/observe/Observer.js */
	var Ractive$observe_Observer = function( runloop, isEqual ) {

		var Observer = function( ractive, keypath, callback, options ) {
			this.root = ractive;
			this.keypath = keypath;
			this.callback = callback;
			this.defer = options.defer;
			// Observers are notified before any DOM changes take place (though
			// they can defer execution until afterwards)
			this.priority = 0;
			// default to root as context, but allow it to be overridden
			this.context = options && options.context ? options.context : ractive;
		};
		Observer.prototype = {
			init: function( immediate ) {
				this.value = this.root.viewmodel.get( this.keypath );
				if ( immediate !== false ) {
					this.update();
				}
			},
			setValue: function( value ) {
				var this$0 = this;
				if ( !isEqual( value, this.value ) ) {
					this.value = value;
					if ( this.defer && this.ready ) {
						runloop.scheduleTask( function() {
							return this$0.update();
						} );
					} else {
						this.update();
					}
				}
			},
			update: function() {
				// Prevent infinite loops
				if ( this.updating ) {
					return;
				}
				this.updating = true;
				this.callback.call( this.context, this.value, this.oldValue, this.keypath );
				this.oldValue = this.value;
				this.updating = false;
			}
		};
		return Observer;
	}( runloop, isEqual );

	/* shared/getMatchingKeypaths.js */
	var getMatchingKeypaths = function( isArray ) {

		return function getMatchingKeypaths( ractive, pattern ) {
			var keys, key, matchingKeypaths;
			keys = pattern.split( '.' );
			matchingKeypaths = [ '' ];
			while ( key = keys.shift() ) {
				if ( key === '*' ) {
					// expand to find all valid child keypaths
					matchingKeypaths = matchingKeypaths.reduce( expand, [] );
				} else {
					if ( matchingKeypaths[ 0 ] === '' ) {
						// first key
						matchingKeypaths[ 0 ] = key;
					} else {
						matchingKeypaths = matchingKeypaths.map( concatenate( key ) );
					}
				}
			}
			return matchingKeypaths;

			function expand( matchingKeypaths, keypath ) {
				var value, key, childKeypath;
				value = ractive.viewmodel.wrapped[ keypath ] ? ractive.viewmodel.wrapped[ keypath ].get() : ractive.get( keypath );
				for ( key in value ) {
					if ( value.hasOwnProperty( key ) && ( key !== '_ractive' || !isArray( value ) ) ) {
						// for benefit of IE8
						childKeypath = keypath ? keypath + '.' + key : key;
						matchingKeypaths.push( childKeypath );
					}
				}
				return matchingKeypaths;
			}

			function concatenate( key ) {
				return function( keypath ) {
					return keypath ? keypath + '.' + key : key;
				};
			}
		};
	}( isArray );

	/* Ractive/prototype/observe/getPattern.js */
	var Ractive$observe_getPattern = function( getMatchingKeypaths ) {

		return function getPattern( ractive, pattern ) {
			var matchingKeypaths, values;
			matchingKeypaths = getMatchingKeypaths( ractive, pattern );
			values = {};
			matchingKeypaths.forEach( function( keypath ) {
				values[ keypath ] = ractive.get( keypath );
			} );
			return values;
		};
	}( getMatchingKeypaths );

	/* Ractive/prototype/observe/PatternObserver.js */
	var Ractive$observe_PatternObserver = function( runloop, isEqual, getPattern ) {

		var PatternObserver, wildcard = /\*/,
			slice = Array.prototype.slice;
		PatternObserver = function( ractive, keypath, callback, options ) {
			this.root = ractive;
			this.callback = callback;
			this.defer = options.defer;
			this.keypath = keypath;
			this.regex = new RegExp( '^' + keypath.replace( /\./g, '\\.' ).replace( /\*/g, '([^\\.]+)' ) + '$' );
			this.values = {};
			if ( this.defer ) {
				this.proxies = [];
			}
			// Observers are notified before any DOM changes take place (though
			// they can defer execution until afterwards)
			this.priority = 'pattern';
			// default to root as context, but allow it to be overridden
			this.context = options && options.context ? options.context : ractive;
		};
		PatternObserver.prototype = {
			init: function( immediate ) {
				var values, keypath;
				values = getPattern( this.root, this.keypath );
				if ( immediate !== false ) {
					for ( keypath in values ) {
						if ( values.hasOwnProperty( keypath ) ) {
							this.update( keypath );
						}
					}
				} else {
					this.values = values;
				}
			},
			update: function( keypath ) {
				var values;
				if ( wildcard.test( keypath ) ) {
					values = getPattern( this.root, keypath );
					for ( keypath in values ) {
						if ( values.hasOwnProperty( keypath ) ) {
							this.update( keypath );
						}
					}
					return;
				}
				// special case - array mutation should not trigger `array.*`
				// pattern observer with `array.length`
				if ( this.root.viewmodel.implicitChanges[ keypath ] ) {
					return;
				}
				if ( this.defer && this.ready ) {
					runloop.addObserver( this.getProxy( keypath ) );
					return;
				}
				this.reallyUpdate( keypath );
			},
			reallyUpdate: function( keypath ) {
				var value, keys, args;
				value = this.root.viewmodel.get( keypath );
				// Prevent infinite loops
				if ( this.updating ) {
					this.values[ keypath ] = value;
					return;
				}
				this.updating = true;
				if ( !isEqual( value, this.values[ keypath ] ) || !this.ready ) {
					keys = slice.call( this.regex.exec( keypath ), 1 );
					args = [
						value,
						this.values[ keypath ],
						keypath
					].concat( keys );
					this.callback.apply( this.context, args );
					this.values[ keypath ] = value;
				}
				this.updating = false;
			},
			getProxy: function( keypath ) {
				var self = this;
				if ( !this.proxies[ keypath ] ) {
					this.proxies[ keypath ] = {
						update: function() {
							self.reallyUpdate( keypath );
						}
					};
				}
				return this.proxies[ keypath ];
			}
		};
		return PatternObserver;
	}( runloop, isEqual, Ractive$observe_getPattern );

	/* Ractive/prototype/observe/getObserverFacade.js */
	var Ractive$observe_getObserverFacade = function( normaliseKeypath, Observer, PatternObserver ) {

		var wildcard = /\*/,
			emptyObject = {};
		return function getObserverFacade( ractive, keypath, callback, options ) {
			var observer, isPatternObserver, cancelled;
			keypath = normaliseKeypath( keypath );
			options = options || emptyObject;
			// pattern observers are treated differently
			if ( wildcard.test( keypath ) ) {
				observer = new PatternObserver( ractive, keypath, callback, options );
				ractive.viewmodel.patternObservers.push( observer );
				isPatternObserver = true;
			} else {
				observer = new Observer( ractive, keypath, callback, options );
			}
			ractive.viewmodel.register( keypath, observer, isPatternObserver ? 'patternObservers' : 'observers' );
			observer.init( options.init );
			// This flag allows observers to initialise even with undefined values
			observer.ready = true;
			return {
				cancel: function() {
					var index;
					if ( cancelled ) {
						return;
					}
					if ( isPatternObserver ) {
						index = ractive.viewmodel.patternObservers.indexOf( observer );
						ractive.viewmodel.patternObservers.splice( index, 1 );
						ractive.viewmodel.unregister( keypath, observer, 'patternObservers' );
					}
					ractive.viewmodel.unregister( keypath, observer, 'observers' );
					cancelled = true;
				}
			};
		};
	}( normaliseKeypath, Ractive$observe_Observer, Ractive$observe_PatternObserver );

	/* Ractive/prototype/observe.js */
	var Ractive$observe = function( isObject, getObserverFacade ) {

		return function Ractive$observe( keypath, callback, options ) {
			var observers, map, keypaths, i;
			// Allow a map of keypaths to handlers
			if ( isObject( keypath ) ) {
				options = callback;
				map = keypath;
				observers = [];
				for ( keypath in map ) {
					if ( map.hasOwnProperty( keypath ) ) {
						callback = map[ keypath ];
						observers.push( this.observe( keypath, callback, options ) );
					}
				}
				return {
					cancel: function() {
						while ( observers.length ) {
							observers.pop().cancel();
						}
					}
				};
			}
			// Allow `ractive.observe( callback )` - i.e. observe entire model
			if ( typeof keypath === 'function' ) {
				options = callback;
				callback = keypath;
				keypath = '';
				return getObserverFacade( this, keypath, callback, options );
			}
			keypaths = keypath.split( ' ' );
			// Single keypath
			if ( keypaths.length === 1 ) {
				return getObserverFacade( this, keypath, callback, options );
			}
			// Multiple space-separated keypaths
			observers = [];
			i = keypaths.length;
			while ( i-- ) {
				keypath = keypaths[ i ];
				if ( keypath ) {
					observers.push( getObserverFacade( this, keypath, callback, options ) );
				}
			}
			return {
				cancel: function() {
					while ( observers.length ) {
						observers.pop().cancel();
					}
				}
			};
		};
	}( isObject, Ractive$observe_getObserverFacade );

	/* Ractive/prototype/shared/trim.js */
	var Ractive$shared_trim = function( str ) {
		return str.trim();
	};

	/* Ractive/prototype/shared/notEmptyString.js */
	var Ractive$shared_notEmptyString = function( str ) {
		return str !== '';
	};

	/* Ractive/prototype/off.js */
	var Ractive$off = function( trim, notEmptyString ) {

		return function Ractive$off( eventName, callback ) {
			var this$0 = this;
			var eventNames;
			// if no arguments specified, remove all callbacks
			if ( !eventName ) {
				// TODO use this code instead, once the following issue has been resolved
				// in PhantomJS (tests are unpassable otherwise!)
				// https://github.com/ariya/phantomjs/issues/11856
				// defineProperty( this, '_subs', { value: create( null ), configurable: true });
				for ( eventName in this._subs ) {
					delete this._subs[ eventName ];
				}
			} else {
				// Handle multiple space-separated event names
				eventNames = eventName.split( ' ' ).map( trim ).filter( notEmptyString );
				eventNames.forEach( function( eventName ) {
					var subscribers, index;
					// If we have subscribers for this event...
					if ( subscribers = this$0._subs[ eventName ] ) {
						// ...if a callback was specified, only remove that
						if ( callback ) {
							index = subscribers.indexOf( callback );
							if ( index !== -1 ) {
								subscribers.splice( index, 1 );
							}
						} else {
							this$0._subs[ eventName ] = [];
						}
					}
				} );
			}
			return this;
		};
	}( Ractive$shared_trim, Ractive$shared_notEmptyString );

	/* Ractive/prototype/on.js */
	var Ractive$on = function( trim, notEmptyString ) {

		return function Ractive$on( eventName, callback ) {
			var this$0 = this;
			var self = this,
				listeners, n, eventNames;
			// allow mutliple listeners to be bound in one go
			if ( typeof eventName === 'object' ) {
				listeners = [];
				for ( n in eventName ) {
					if ( eventName.hasOwnProperty( n ) ) {
						listeners.push( this.on( n, eventName[ n ] ) );
					}
				}
				return {
					cancel: function() {
						var listener;
						while ( listener = listeners.pop() ) {
							listener.cancel();
						}
					}
				};
			}
			// Handle multiple space-separated event names
			eventNames = eventName.split( ' ' ).map( trim ).filter( notEmptyString );
			eventNames.forEach( function( eventName ) {
				( this$0._subs[ eventName ] || ( this$0._subs[ eventName ] = [] ) ).push( callback );
			} );
			return {
				cancel: function() {
					self.off( eventName, callback );
				}
			};
		};
	}( Ractive$shared_trim, Ractive$shared_notEmptyString );

	/* shared/getSpliceEquivalent.js */
	var getSpliceEquivalent = function( array, methodName, args ) {
		switch ( methodName ) {
			case 'splice':
				return args;
			case 'sort':
			case 'reverse':
				return null;
			case 'pop':
				if ( array.length ) {
					return [ -1 ];
				}
				return null;
			case 'push':
				return [
					array.length,
					0
				].concat( args );
			case 'shift':
				return [
					0,
					1
				];
			case 'unshift':
				return [
					0,
					0
				].concat( args );
		}
	};

	/* shared/summariseSpliceOperation.js */
	var summariseSpliceOperation = function( array, args ) {
		var rangeStart, rangeEnd, newLength, addedItems, removedItems, balance;
		if ( !args ) {
			return null;
		}
		// figure out where the changes started...
		rangeStart = +( args[ 0 ] < 0 ? array.length + args[ 0 ] : args[ 0 ] );
		// ...and how many items were added to or removed from the array
		addedItems = Math.max( 0, args.length - 2 );
		removedItems = args[ 1 ] !== undefined ? args[ 1 ] : array.length - rangeStart;
		// It's possible to do e.g. [ 1, 2, 3 ].splice( 2, 2 ) - i.e. the second argument
		// means removing more items from the end of the array than there are. In these
		// cases we need to curb JavaScript's enthusiasm or we'll get out of sync
		removedItems = Math.min( removedItems, array.length - rangeStart );
		balance = addedItems - removedItems;
		newLength = array.length + balance;
		// We need to find the end of the range affected by the splice
		if ( !balance ) {
			rangeEnd = rangeStart + addedItems;
		} else {
			rangeEnd = Math.max( array.length, newLength );
		}
		return {
			rangeStart: rangeStart,
			rangeEnd: rangeEnd,
			balance: balance,
			added: addedItems,
			removed: removedItems
		};
	};

	/* Ractive/prototype/shared/makeArrayMethod.js */
	var Ractive$shared_makeArrayMethod = function( isArray, runloop, getSpliceEquivalent, summariseSpliceOperation ) {

		var arrayProto = Array.prototype;
		return function( methodName ) {
			return function( keypath ) {
				var SLICE$0 = Array.prototype.slice;
				var args = SLICE$0.call( arguments, 1 );
				var array, spliceEquivalent, spliceSummary, promise;
				array = this.get( keypath );
				if ( !isArray( array ) ) {
					throw new Error( 'Called ractive.' + methodName + '(\'' + keypath + '\'), but \'' + keypath + '\' does not refer to an array' );
				}
				spliceEquivalent = getSpliceEquivalent( array, methodName, args );
				spliceSummary = summariseSpliceOperation( array, spliceEquivalent );
				arrayProto[ methodName ].apply( array, args );
				promise = runloop.start( this, true );
				if ( spliceSummary ) {
					this.viewmodel.splice( keypath, spliceSummary );
				} else {
					this.viewmodel.mark( keypath );
				}
				runloop.end();
				return promise;
			};
		};
	}( isArray, runloop, getSpliceEquivalent, summariseSpliceOperation );

	/* Ractive/prototype/pop.js */
	var Ractive$pop = function( makeArrayMethod ) {

		return makeArrayMethod( 'pop' );
	}( Ractive$shared_makeArrayMethod );

	/* Ractive/prototype/push.js */
	var Ractive$push = function( makeArrayMethod ) {

		return makeArrayMethod( 'push' );
	}( Ractive$shared_makeArrayMethod );

	/* global/css.js */
	var global_css = function( circular, isClient, removeFromArray ) {

		var css, update, runloop, styleElement, head, styleSheet, inDom, prefix = '/* Ractive.js component styles */\n',
			componentsInPage = {},
			styles = [];
		if ( !isClient ) {
			css = null;
		} else {
			circular.push( function() {
				runloop = circular.runloop;
			} );
			styleElement = document.createElement( 'style' );
			styleElement.type = 'text/css';
			head = document.getElementsByTagName( 'head' )[ 0 ];
			inDom = false;
			// Internet Exploder won't let you use styleSheet.innerHTML - we have to
			// use styleSheet.cssText instead
			styleSheet = styleElement.styleSheet;
			update = function() {
				var css;
				if ( styles.length ) {
					css = prefix + styles.join( ' ' );
					if ( styleSheet ) {
						styleSheet.cssText = css;
					} else {
						styleElement.innerHTML = css;
					}
					if ( !inDom ) {
						head.appendChild( styleElement );
						inDom = true;
					}
				} else if ( inDom ) {
					head.removeChild( styleElement );
					inDom = false;
				}
			};
			css = {
				add: function( Component ) {
					if ( !Component.css ) {
						return;
					}
					if ( !componentsInPage[ Component._guid ] ) {
						// we create this counter so that we can in/decrement it as
						// instances are added and removed. When all components are
						// removed, the style is too
						componentsInPage[ Component._guid ] = 0;
						styles.push( Component.css );
						runloop.scheduleTask( update );
					}
					componentsInPage[ Component._guid ] += 1;
				},
				remove: function( Component ) {
					if ( !Component.css ) {
						return;
					}
					componentsInPage[ Component._guid ] -= 1;
					if ( !componentsInPage[ Component._guid ] ) {
						removeFromArray( styles, Component.css );
						runloop.scheduleTask( update );
					}
				}
			};
		}
		return css;
	}( circular, isClient, removeFromArray );

	/* Ractive/prototype/render.js */
	var Ractive$render = function( runloop, css, getElement ) {

		var queues = {},
			rendering = {};
		return function Ractive$render( target, anchor ) {
			var this$0 = this;
			var promise, instances;
			rendering[ this._guid ] = true;
			promise = runloop.start( this, true );
			if ( this.rendered ) {
				throw new Error( 'You cannot call ractive.render() on an already rendered instance! Call ractive.unrender() first' );
			}
			target = getElement( target ) || this.el;
			anchor = getElement( anchor ) || this.anchor;
			this.el = target;
			this.anchor = anchor;
			// Add CSS, if applicable
			if ( this.constructor.css ) {
				css.add( this.constructor );
			}
			if ( target ) {
				if ( !( instances = target.__ractive_instances__ ) ) {
					target.__ractive_instances__ = [ this ];
				} else {
					instances.push( this );
				}
				if ( anchor ) {
					target.insertBefore( this.fragment.render(), anchor );
				} else {
					target.appendChild( this.fragment.render() );
				}
			}
			// Only init once, until we rework lifecycle events
			if ( !this._hasInited ) {
				this._hasInited = true;
				// If this is *isn't* a child of a component that's in the process of rendering,
				// it should call any `init()` methods at this point
				if ( !this._parent || !rendering[ this._parent._guid ] ) {
					init( this );
				} else {
					getChildInitQueue( this._parent ).push( this );
				}
			}
			rendering[ this._guid ] = false;
			runloop.end();
			this.rendered = true;
			if ( this.complete ) {
				promise.then( function() {
					return this$0.complete();
				} );
			}
			return promise;
		};

		function init( instance ) {
			if ( instance.init ) {
				instance.init( instance._config.options );
			}
			getChildInitQueue( instance ).forEach( init );
			queues[ instance._guid ] = null;
		}

		function getChildInitQueue( instance ) {
			return queues[ instance._guid ] || ( queues[ instance._guid ] = [] );
		}
	}( runloop, global_css, getElement );

	/* virtualdom/Fragment/prototype/bubble.js */
	var virtualdom_Fragment$bubble = function Fragment$bubble() {
		this.dirtyValue = this.dirtyArgs = true;
		if ( this.inited && this.owner.bubble ) {
			this.owner.bubble();
		}
	};

	/* virtualdom/Fragment/prototype/detach.js */
	var virtualdom_Fragment$detach = function Fragment$detach() {
		var docFrag;
		if ( this.items.length === 1 ) {
			return this.items[ 0 ].detach();
		}
		docFrag = document.createDocumentFragment();
		this.items.forEach( function( item ) {
			docFrag.appendChild( item.detach() );
		} );
		return docFrag;
	};

	/* virtualdom/Fragment/prototype/find.js */
	var virtualdom_Fragment$find = function Fragment$find( selector ) {
		var i, len, item, queryResult;
		if ( this.items ) {
			len = this.items.length;
			for ( i = 0; i < len; i += 1 ) {
				item = this.items[ i ];
				if ( item.find && ( queryResult = item.find( selector ) ) ) {
					return queryResult;
				}
			}
			return null;
		}
	};

	/* virtualdom/Fragment/prototype/findAll.js */
	var virtualdom_Fragment$findAll = function Fragment$findAll( selector, query ) {
		var i, len, item;
		if ( this.items ) {
			len = this.items.length;
			for ( i = 0; i < len; i += 1 ) {
				item = this.items[ i ];
				if ( item.findAll ) {
					item.findAll( selector, query );
				}
			}
		}
		return query;
	};

	/* virtualdom/Fragment/prototype/findAllComponents.js */
	var virtualdom_Fragment$findAllComponents = function Fragment$findAllComponents( selector, query ) {
		var i, len, item;
		if ( this.items ) {
			len = this.items.length;
			for ( i = 0; i < len; i += 1 ) {
				item = this.items[ i ];
				if ( item.findAllComponents ) {
					item.findAllComponents( selector, query );
				}
			}
		}
		return query;
	};

	/* virtualdom/Fragment/prototype/findComponent.js */
	var virtualdom_Fragment$findComponent = function Fragment$findComponent( selector ) {
		var len, i, item, queryResult;
		if ( this.items ) {
			len = this.items.length;
			for ( i = 0; i < len; i += 1 ) {
				item = this.items[ i ];
				if ( item.findComponent && ( queryResult = item.findComponent( selector ) ) ) {
					return queryResult;
				}
			}
			return null;
		}
	};

	/* virtualdom/Fragment/prototype/findNextNode.js */
	var virtualdom_Fragment$findNextNode = function Fragment$findNextNode( item ) {
		var index = item.index,
			node;
		if ( this.items[ index + 1 ] ) {
			node = this.items[ index + 1 ].firstNode();
		} else if ( this.owner === this.root ) {
			if ( !this.owner.component ) {
				// TODO but something else could have been appended to
				// this.root.el, no?
				node = null;
			} else {
				node = this.owner.component.findNextNode();
			}
		} else {
			node = this.owner.findNextNode( this );
		}
		return node;
	};

	/* virtualdom/Fragment/prototype/firstNode.js */
	var virtualdom_Fragment$firstNode = function Fragment$firstNode() {
		if ( this.items && this.items[ 0 ] ) {
			return this.items[ 0 ].firstNode();
		}
		return null;
	};

	/* virtualdom/Fragment/prototype/getNode.js */
	var virtualdom_Fragment$getNode = function Fragment$getNode() {
		var fragment = this;
		do {
			if ( fragment.pElement ) {
				return fragment.pElement.node;
			}
		} while ( fragment = fragment.parent );
		return this.root.el;
	};

	/* virtualdom/Fragment/prototype/getValue.js */
	var virtualdom_Fragment$getValue = function( parseJSON ) {

		var empty = {};
		return function Fragment$getValue() {
			var options = arguments[ 0 ];
			if ( options === void 0 )
				options = empty;
			var asArgs, values, source, parsed, cachedResult, dirtyFlag, result;
			asArgs = options.args;
			cachedResult = asArgs ? 'argsList' : 'value';
			dirtyFlag = asArgs ? 'dirtyArgs' : 'dirtyValue';
			if ( this[ dirtyFlag ] ) {
				source = processItems( this.items, values = {}, this.root._guid );
				parsed = parseJSON( asArgs ? '[' + source + ']' : source, values );
				if ( !parsed ) {
					result = asArgs ? [ this.toString() ] : this.toString();
				} else {
					result = parsed.value;
				}
				this[ cachedResult ] = result;
				this[ dirtyFlag ] = false;
			}
			return this[ cachedResult ];
		};

		function processItems( items, values, guid, counter ) {
			counter = counter || 0;
			return items.map( function( item ) {
				var placeholderId, wrapped, value;
				if ( item.text ) {
					return item.text;
				}
				if ( item.fragments ) {
					return item.fragments.map( function( fragment ) {
						return processItems( fragment.items, values, guid, counter );
					} ).join( '' );
				}
				placeholderId = guid + '-' + counter++;
				if ( wrapped = item.root.viewmodel.wrapped[ item.keypath ] ) {
					value = wrapped.value;
				} else {
					value = item.getValue();
				}
				values[ placeholderId ] = value;
				return '${' + placeholderId + '}';
			} ).join( '' );
		}
	}( parseJSON );

	/* utils/escapeHtml.js */
	var escapeHtml = function() {

		var lessThan = /</g,
			greaterThan = />/g;
		return function escapeHtml( str ) {
			return str.replace( lessThan, '&lt;' ).replace( greaterThan, '&gt;' );
		};
	}();

	/* utils/detachNode.js */
	var detachNode = function detachNode( node ) {
		if ( node && node.parentNode ) {
			node.parentNode.removeChild( node );
		}
		return node;
	};

	/* virtualdom/items/shared/detach.js */
	var detach = function( detachNode ) {

		return function() {
			return detachNode( this.node );
		};
	}( detachNode );

	/* virtualdom/items/Text.js */
	var Text = function( types, escapeHtml, detach ) {

		var Text = function( options ) {
			this.type = types.TEXT;
			this.text = options.template;
		};
		Text.prototype = {
			detach: detach,
			firstNode: function() {
				return this.node;
			},
			render: function() {
				if ( !this.node ) {
					this.node = document.createTextNode( this.text );
				}
				return this.node;
			},
			toString: function( escape ) {
				return escape ? escapeHtml( this.text ) : this.text;
			},
			unrender: function( shouldDestroy ) {
				if ( shouldDestroy ) {
					return this.detach();
				}
			}
		};
		return Text;
	}( types, escapeHtml, detach );

	/* virtualdom/items/shared/unbind.js */
	var unbind = function( runloop ) {

		return function unbind() {
			if ( !this.keypath ) {
				// this was on the 'unresolved' list, we need to remove it
				runloop.removeUnresolved( this );
			} else {
				// this was registered as a dependant
				this.root.viewmodel.unregister( this.keypath, this );
			}
			if ( this.resolver ) {
				this.resolver.teardown();
			}
		};
	}( runloop );

	/* virtualdom/items/shared/Mustache/getValue.js */
	var getValue = function Mustache$getValue() {
		return this.value;
	};

	/* shared/Unresolved.js */
	var Unresolved = function( runloop ) {

		var Unresolved = function( ractive, ref, parentFragment, callback ) {
			this.root = ractive;
			this.ref = ref;
			this.parentFragment = parentFragment;
			this.resolve = callback;
			runloop.addUnresolved( this );
		};
		Unresolved.prototype = {
			teardown: function() {
				runloop.removeUnresolved( this );
			}
		};
		return Unresolved;
	}( runloop );

	/* virtualdom/items/shared/utils/startsWithKeypath.js */
	var startsWithKeypath = function startsWithKeypath( target, keypath ) {
		return target.substr( 0, keypath.length + 1 ) === keypath + '.';
	};

	/* virtualdom/items/shared/utils/getNewKeypath.js */
	var getNewKeypath = function( startsWithKeypath ) {

		return function getNewKeypath( targetKeypath, oldKeypath, newKeypath ) {
			// exact match
			if ( targetKeypath === oldKeypath ) {
				return newKeypath;
			}
			// partial match based on leading keypath segments
			if ( startsWithKeypath( targetKeypath, oldKeypath ) ) {
				return targetKeypath.replace( oldKeypath + '.', newKeypath + '.' );
			}
		};
	}( startsWithKeypath );

	/* utils/log.js */
	var log = function( consolewarn, errors ) {

		var log = {
			warn: function( options, passthru ) {
				if ( !options.debug && !passthru ) {
					return;
				}
				this.logger( getMessage( options ), options.allowDuplicates );
			},
			error: function( options ) {
				this.errorOnly( options );
				if ( !options.debug ) {
					this.warn( options, true );
				}
			},
			errorOnly: function( options ) {
				if ( options.debug ) {
					this.critical( options );
				}
			},
			critical: function( options ) {
				var err = options.err || new Error( getMessage( options ) );
				this.thrower( err );
			},
			logger: consolewarn,
			thrower: function( err ) {
				throw err;
			}
		};

		function getMessage( options ) {
			var message = errors[ options.message ] || options.message || '';
			return interpolate( message, options.args );
		}
		// simple interpolation. probably quicker (and better) out there,
		// but log is not in golden path of execution, only exceptions
		function interpolate( message, args ) {
			return message.replace( /{([^{}]*)}/g, function( a, b ) {
				return args[ b ];
			} );
		}
		return log;
	}( warn, errors );

	/* viewmodel/Computation/diff.js */
	var diff = function diff( computation, dependencies, newDependencies ) {
		var i, keypath;
		// remove dependencies that are no longer used
		i = dependencies.length;
		while ( i-- ) {
			keypath = dependencies[ i ];
			if ( newDependencies.indexOf( keypath ) === -1 ) {
				computation.viewmodel.unregister( keypath, computation, 'computed' );
			}
		}
		// create references for any new dependencies
		i = newDependencies.length;
		while ( i-- ) {
			keypath = newDependencies[ i ];
			if ( dependencies.indexOf( keypath ) === -1 ) {
				computation.viewmodel.register( keypath, computation, 'computed' );
			}
		}
		computation.dependencies = newDependencies.slice();
	};

	/* virtualdom/items/shared/Evaluator/Evaluator.js */
	var Evaluator = function( log, isEqual, defineProperty, diff ) {

		// TODO this is a red flag... should be treated the same?
		var Evaluator, cache = {};
		Evaluator = function( root, keypath, uniqueString, functionStr, args, priority ) {
			var evaluator = this,
				viewmodel = root.viewmodel;
			evaluator.root = root;
			evaluator.viewmodel = viewmodel;
			evaluator.uniqueString = uniqueString;
			evaluator.keypath = keypath;
			evaluator.priority = priority;
			evaluator.fn = getFunctionFromString( functionStr, args.length );
			evaluator.explicitDependencies = [];
			evaluator.dependencies = [];
			// created by `this.get()` within functions
			evaluator.argumentGetters = args.map( function( arg ) {
				var keypath, index;
				if ( !arg ) {
					return void 0;
				}
				if ( arg.indexRef ) {
					index = arg.value;
					return index;
				}
				keypath = arg.keypath;
				evaluator.explicitDependencies.push( keypath );
				viewmodel.register( keypath, evaluator, 'computed' );
				return function() {
					var value = viewmodel.get( keypath );
					return typeof value === 'function' ? wrap( value, root ) : value;
				};
			} );
		};
		Evaluator.prototype = {
			wake: function() {
				this.awake = true;
			},
			sleep: function() {
				this.awake = false;
			},
			getValue: function() {
				var args, value, newImplicitDependencies;
				args = this.argumentGetters.map( call );
				if ( this.updating ) {
					// Prevent infinite loops caused by e.g. in-place array mutations
					return;
				}
				this.updating = true;
				this.viewmodel.capture();
				try {
					value = this.fn.apply( null, args );
				} catch ( err ) {
					if ( this.root.debug ) {
						log.warn( {
							debug: this.root.debug,
							message: 'evaluationError',
							args: {
								uniqueString: this.uniqueString,
								err: err.message || err
							}
						} );
					}
					value = undefined;
				}
				newImplicitDependencies = this.viewmodel.release();
				diff( this, this.dependencies, newImplicitDependencies );
				this.updating = false;
				return value;
			},
			update: function() {
				var value = this.getValue();
				if ( !isEqual( value, this.value ) ) {
					this.value = value;
					this.root.viewmodel.mark( this.keypath );
				}
				return this;
			},
			// TODO should evaluators ever get torn down? At present, they don't...
			teardown: function() {
				var this$0 = this;
				this.explicitDependencies.concat( this.dependencies ).forEach( function( keypath ) {
					return this$0.viewmodel.unregister( keypath, this$0, 'computed' );
				} );
				this.root.viewmodel.evaluators[ this.keypath ] = null;
			}
		};
		return Evaluator;

		function getFunctionFromString( str, i ) {
			var fn, args;
			str = str.replace( /\$\{([0-9]+)\}/g, '_$1' );
			if ( cache[ str ] ) {
				return cache[ str ];
			}
			args = [];
			while ( i-- ) {
				args[ i ] = '_' + i;
			}
			fn = new Function( args.join( ',' ), 'return(' + str + ')' );
			cache[ str ] = fn;
			return fn;
		}

		function wrap( fn, ractive ) {
			var wrapped, prop;
			if ( fn._noWrap ) {
				return fn;
			}
			prop = '__ractive_' + ractive._guid;
			wrapped = fn[ prop ];
			if ( wrapped ) {
				return wrapped;
			} else if ( /this/.test( fn.toString() ) ) {
				defineProperty( fn, prop, {
					value: fn.bind( ractive )
				} );
				return fn[ prop ];
			}
			defineProperty( fn, '__ractive_nowrap', {
				value: fn
			} );
			return fn.__ractive_nowrap;
		}

		function call( arg ) {
			return typeof arg === 'function' ? arg() : arg;
		}
	}( log, isEqual, defineProperty, diff );

	/* virtualdom/items/shared/Resolvers/ExpressionResolver.js */
	var ExpressionResolver = function( removeFromArray, resolveRef, Unresolved, Evaluator, getNewKeypath ) {

		var ExpressionResolver = function( owner, parentFragment, expression, callback ) {
			var expressionResolver = this,
				ractive, indexRefs, args;
			ractive = owner.root;
			this.root = ractive;
			this.callback = callback;
			this.owner = owner;
			this.str = expression.s;
			this.args = args = [];
			this.unresolved = [];
			this.pending = 0;
			indexRefs = parentFragment.indexRefs;
			// some expressions don't have references. edge case, but, yeah.
			if ( !expression.r || !expression.r.length ) {
				this.resolved = this.ready = true;
				this.bubble();
				return;
			}
			// Create resolvers for each reference
			expression.r.forEach( function( reference, i ) {
				var index, keypath, unresolved;
				// Is this an index reference?
				if ( indexRefs && ( index = indexRefs[ reference ] ) !== undefined ) {
					args[ i ] = {
						indexRef: reference,
						value: index
					};
					return;
				}
				// Can we resolve it immediately?
				if ( keypath = resolveRef( ractive, reference, parentFragment ) ) {
					args[ i ] = {
						keypath: keypath
					};
					return;
				}
				// Couldn't resolve yet
				args[ i ] = null;
				expressionResolver.pending += 1;
				unresolved = new Unresolved( ractive, reference, parentFragment, function( keypath ) {
					expressionResolver.resolve( i, keypath );
					removeFromArray( expressionResolver.unresolved, unresolved );
				} );
				expressionResolver.unresolved.push( unresolved );
			} );
			this.ready = true;
			this.bubble();
		};
		ExpressionResolver.prototype = {
			bubble: function() {
				if ( !this.ready ) {
					return;
				}
				this.uniqueString = getUniqueString( this.str, this.args );
				this.keypath = getKeypath( this.uniqueString );
				this.createEvaluator();
				this.callback( this.keypath );
			},
			teardown: function() {
				var unresolved;
				while ( unresolved = this.unresolved.pop() ) {
					unresolved.teardown();
				}
			},
			resolve: function( index, keypath ) {
				this.args[ index ] = {
					keypath: keypath
				};
				this.bubble();
				// when all references have been resolved, we can flag the entire expression
				// as having been resolved
				this.resolved = !--this.pending;
			},
			createEvaluator: function() {
				var evaluator = this.root.viewmodel.evaluators[ this.keypath ];
				// only if it doesn't exist yet!
				if ( !evaluator ) {
					evaluator = new Evaluator( this.root, this.keypath, this.uniqueString, this.str, this.args, this.owner.priority );
					this.root.viewmodel.evaluators[ this.keypath ] = evaluator;
				}
				evaluator.update();
			},
			rebind: function( indexRef, newIndex, oldKeypath, newKeypath ) {
				var changed;
				this.args.forEach( function( arg ) {
					var changedKeypath;
					if ( !arg )
						return;
					if ( arg.keypath && ( changedKeypath = getNewKeypath( arg.keypath, oldKeypath, newKeypath ) ) ) {
						arg.keypath = changedKeypath;
						changed = true;
					} else if ( arg.indexRef && arg.indexRef === indexRef ) {
						arg.value = newIndex;
						changed = true;
					}
				} );
				if ( changed ) {
					this.bubble();
				}
			}
		};
		return ExpressionResolver;

		function getUniqueString( str, args ) {
			// get string that is unique to this expression
			return str.replace( /\$\{([0-9]+)\}/g, function( match, $1 ) {
				var arg = args[ $1 ];
				if ( !arg )
					return 'undefined';
				if ( arg.indexRef )
					return arg.value;
				return arg.keypath;
			} );
		}

		function getKeypath( uniqueString ) {
			// Sanitize by removing any periods or square brackets. Otherwise
			// we can't split the keypath into keys!
			return '${' + uniqueString.replace( /[\.\[\]]/g, '-' ) + '}';
		}
	}( removeFromArray, resolveRef, Unresolved, Evaluator, getNewKeypath );

	/* virtualdom/items/shared/Resolvers/ReferenceExpressionResolver/MemberResolver.js */
	var MemberResolver = function( types, resolveRef, Unresolved, getNewKeypath, ExpressionResolver ) {

		var MemberResolver = function( template, resolver, parentFragment ) {
			var member = this,
				ref, indexRefs, index, ractive, keypath;
			member.resolver = resolver;
			member.root = resolver.root;
			member.viewmodel = resolver.root.viewmodel;
			if ( typeof template === 'string' ) {
				member.value = template;
			} else if ( template.t === types.REFERENCE ) {
				ref = member.ref = template.n;
				// If it's an index reference, our job is simple
				if ( ( indexRefs = parentFragment.indexRefs ) && ( index = indexRefs[ ref ] ) !== undefined ) {
					member.indexRef = ref;
					member.value = index;
				} else {
					ractive = resolver.root;
					// Can we resolve the reference immediately?
					if ( keypath = resolveRef( ractive, ref, parentFragment ) ) {
						member.resolve( keypath );
					} else {
						// Couldn't resolve yet
						member.unresolved = new Unresolved( ractive, ref, parentFragment, function( keypath ) {
							member.unresolved = null;
							member.resolve( keypath );
						} );
					}
				}
			} else {
				new ExpressionResolver( resolver, parentFragment, template, function( keypath ) {
					member.resolve( keypath );
				} );
			}
		};
		MemberResolver.prototype = {
			resolve: function( keypath ) {
				this.keypath = keypath;
				this.value = this.viewmodel.get( keypath );
				this.bind();
				this.resolver.bubble();
			},
			bind: function() {
				this.viewmodel.register( this.keypath, this );
			},
			rebind: function( indexRef, newIndex, oldKeypath, newKeypath ) {
				var keypath;
				if ( indexRef && this.indexRef === indexRef ) {
					if ( newIndex !== this.value ) {
						this.value = newIndex;
						return true;
					}
				} else if ( this.keypath && ( keypath = getNewKeypath( this.keypath, oldKeypath, newKeypath ) ) ) {
					this.unbind();
					this.keypath = keypath;
					this.value = this.root.viewmodel.get( keypath );
					this.bind();
					return true;
				}
			},
			setValue: function( value ) {
				this.value = value;
				this.resolver.bubble();
			},
			unbind: function() {
				if ( this.keypath ) {
					this.root.viewmodel.unregister( this.keypath, this );
				}
			},
			teardown: function() {
				this.unbind();
				if ( this.unresolved ) {
					this.unresolved.teardown();
				}
			},
			forceResolution: function() {
				if ( this.unresolved ) {
					this.unresolved.teardown();
					this.unresolved = null;
					this.keypath = this.ref;
					this.value = this.viewmodel.get( this.ref );
					this.bind();
				}
			}
		};
		return MemberResolver;
	}( types, resolveRef, Unresolved, getNewKeypath, ExpressionResolver );

	/* virtualdom/items/shared/Resolvers/ReferenceExpressionResolver/ReferenceExpressionResolver.js */
	var ReferenceExpressionResolver = function( resolveRef, Unresolved, MemberResolver ) {

		var ReferenceExpressionResolver = function( mustache, template, callback ) {
			var this$0 = this;
			var resolver = this,
				ractive, ref, keypath, parentFragment;
			parentFragment = mustache.parentFragment;
			resolver.root = ractive = mustache.root;
			resolver.mustache = mustache;
			resolver.priority = mustache.priority;
			resolver.ref = ref = template.r;
			resolver.callback = callback;
			resolver.unresolved = [];
			// Find base keypath
			if ( keypath = resolveRef( ractive, ref, parentFragment ) ) {
				resolver.base = keypath;
			} else {
				resolver.baseResolver = new Unresolved( ractive, ref, parentFragment, function( keypath ) {
					resolver.base = keypath;
					resolver.baseResolver = null;
					resolver.bubble();
				} );
			}
			// Find values for members, or mark them as unresolved
			resolver.members = template.m.map( function( template ) {
				return new MemberResolver( template, this$0, parentFragment );
			} );
			resolver.ready = true;
			resolver.bubble();
		};
		ReferenceExpressionResolver.prototype = {
			getKeypath: function() {
				var values = this.members.map( getValue );
				if ( !values.every( isDefined ) || this.baseResolver ) {
					return;
				}
				return this.base + '.' + values.join( '.' );
			},
			bubble: function() {
				if ( !this.ready || this.baseResolver ) {
					return;
				}
				this.callback( this.getKeypath() );
			},
			teardown: function() {
				this.members.forEach( unbind );
			},
			rebind: function( indexRef, newIndex, oldKeypath, newKeypath ) {
				var changed;
				this.members.forEach( function( members ) {
					if ( members.rebind( indexRef, newIndex, oldKeypath, newKeypath ) ) {
						changed = true;
					}
				} );
				if ( changed ) {
					this.bubble();
				}
			},
			forceResolution: function() {
				if ( this.baseResolver ) {
					this.base = this.ref;
					this.baseResolver.teardown();
					this.baseResolver = null;
				}
				this.members.forEach( function( m ) {
					return m.forceResolution();
				} );
				this.bubble();
			}
		};

		function getValue( member ) {
			return member.value;
		}

		function isDefined( value ) {
			return value != undefined;
		}

		function unbind( member ) {
			member.unbind();
		}
		return ReferenceExpressionResolver;
	}( resolveRef, Unresolved, MemberResolver );

	/* virtualdom/items/shared/Mustache/initialise.js */
	var initialise = function( types, runloop, resolveRef, ReferenceExpressionResolver, ExpressionResolver ) {

		return function Mustache$init( mustache, options ) {
			var ref, keypath, indexRefs, index, parentFragment, template;
			parentFragment = options.parentFragment;
			template = options.template;
			mustache.root = parentFragment.root;
			mustache.parentFragment = parentFragment;
			mustache.pElement = parentFragment.pElement;
			mustache.template = options.template;
			mustache.index = options.index || 0;
			mustache.priority = parentFragment.priority;
			mustache.isStatic = options.template.s;
			mustache.type = options.template.t;
			// if this is a simple mustache, with a reference, we just need to resolve
			// the reference to a keypath
			if ( ref = template.r ) {
				indexRefs = parentFragment.indexRefs;
				if ( indexRefs && ( index = indexRefs[ ref ] ) !== undefined ) {
					mustache.indexRef = ref;
					mustache.setValue( index );
					return;
				}
				keypath = resolveRef( mustache.root, ref, mustache.parentFragment );
				if ( keypath !== undefined ) {
					mustache.resolve( keypath );
				} else {
					mustache.ref = ref;
					runloop.addUnresolved( mustache );
				}
			}
			// if it's an expression, we have a bit more work to do
			if ( options.template.x ) {
				mustache.resolver = new ExpressionResolver( mustache, parentFragment, options.template.x, resolveAndRebindChildren );
			}
			if ( options.template.rx ) {
				mustache.resolver = new ReferenceExpressionResolver( mustache, options.template.rx, resolveAndRebindChildren );
			}
			// Special case - inverted sections
			if ( mustache.template.n === types.SECTION_UNLESS && !mustache.hasOwnProperty( 'value' ) ) {
				mustache.setValue( undefined );
			}

			function resolveAndRebindChildren( newKeypath ) {
				var oldKeypath = mustache.keypath;
				if ( newKeypath !== oldKeypath ) {
					mustache.resolve( newKeypath );
					if ( oldKeypath !== undefined ) {
						mustache.fragments && mustache.fragments.forEach( function( f ) {
							f.rebind( null, null, oldKeypath, newKeypath );
						} );
					}
				}
			}
		};
	}( types, runloop, resolveRef, ReferenceExpressionResolver, ExpressionResolver );

	/* virtualdom/items/shared/Mustache/resolve.js */
	var resolve = function Mustache$resolve( keypath ) {
		var wasResolved, value, twowayBinding;
		// If we resolved previously, we need to unregister
		if ( this.keypath !== undefined ) {
			this.root.viewmodel.unregister( this.keypath, this );
			wasResolved = true;
		}
		this.keypath = keypath;
		// If the new keypath exists, we need to register
		// with the viewmodel
		if ( keypath !== undefined ) {
			value = this.root.viewmodel.get( keypath );
			this.root.viewmodel.register( keypath, this );
		}
		// Either way we need to queue up a render (`value`
		// will be `undefined` if there's no keypath)
		this.setValue( value );
		// Two-way bindings need to point to their new target keypath
		if ( wasResolved && ( twowayBinding = this.twowayBinding ) ) {
			twowayBinding.rebound();
		}
	};

	/* virtualdom/items/shared/Mustache/rebind.js */
	var rebind = function( getNewKeypath ) {

		return function Mustache$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
			var keypath;
			// Children first
			if ( this.fragments ) {
				this.fragments.forEach( function( f ) {
					return f.rebind( indexRef, newIndex, oldKeypath, newKeypath );
				} );
			}
			// Expression mustache?
			if ( this.resolver ) {
				this.resolver.rebind( indexRef, newIndex, oldKeypath, newKeypath );
			}
			// Normal keypath mustache or reference expression?
			if ( this.keypath ) {
				// was a new keypath created?
				if ( keypath = getNewKeypath( this.keypath, oldKeypath, newKeypath ) ) {
					// resolve it
					this.resolve( keypath );
				}
			} else if ( indexRef !== undefined && this.indexRef === indexRef ) {
				this.setValue( newIndex );
			}
		};
	}( getNewKeypath );

	/* virtualdom/items/shared/Mustache/_Mustache.js */
	var Mustache = function( getValue, init, resolve, rebind ) {

		return {
			getValue: getValue,
			init: init,
			resolve: resolve,
			rebind: rebind
		};
	}( getValue, initialise, resolve, rebind );

	/* virtualdom/items/Interpolator.js */
	var Interpolator = function( types, runloop, escapeHtml, detachNode, unbind, Mustache, detach ) {

		var Interpolator = function( options ) {
			this.type = types.INTERPOLATOR;
			Mustache.init( this, options );
		};
		Interpolator.prototype = {
			update: function() {
				this.node.data = this.value == undefined ? '' : this.value;
			},
			resolve: Mustache.resolve,
			rebind: Mustache.rebind,
			detach: detach,
			unbind: unbind,
			render: function() {
				if ( !this.node ) {
					this.node = document.createTextNode( this.value != undefined ? this.value : '' );
				}
				return this.node;
			},
			unrender: function( shouldDestroy ) {
				if ( shouldDestroy ) {
					detachNode( this.node );
				}
			},
			getValue: Mustache.getValue,
			// TEMP
			setValue: function( value ) {
				var wrapper;
				// TODO is there a better way to approach this?
				if ( wrapper = this.root.viewmodel.wrapped[ this.keypath ] ) {
					value = wrapper.get();
				}
				if ( value !== this.value ) {
					this.value = value;
					this.parentFragment.bubble();
					if ( this.node ) {
						runloop.addView( this );
					}
				}
			},
			firstNode: function() {
				return this.node;
			},
			toString: function( escape ) {
				var string = this.value != undefined ? '' + this.value : '';
				return escape ? escapeHtml( string ) : string;
			}
		};
		return Interpolator;
	}( types, runloop, escapeHtml, detachNode, unbind, Mustache, detach );

	/* virtualdom/items/Section/prototype/bubble.js */
	var virtualdom_items_Section$bubble = function Section$bubble() {
		this.parentFragment.bubble();
	};

	/* virtualdom/items/Section/prototype/detach.js */
	var virtualdom_items_Section$detach = function Section$detach() {
		var docFrag;
		if ( this.fragments.length === 1 ) {
			return this.fragments[ 0 ].detach();
		}
		docFrag = document.createDocumentFragment();
		this.fragments.forEach( function( item ) {
			docFrag.appendChild( item.detach() );
		} );
		return docFrag;
	};

	/* virtualdom/items/Section/prototype/find.js */
	var virtualdom_items_Section$find = function Section$find( selector ) {
		var i, len, queryResult;
		len = this.fragments.length;
		for ( i = 0; i < len; i += 1 ) {
			if ( queryResult = this.fragments[ i ].find( selector ) ) {
				return queryResult;
			}
		}
		return null;
	};

	/* virtualdom/items/Section/prototype/findAll.js */
	var virtualdom_items_Section$findAll = function Section$findAll( selector, query ) {
		var i, len;
		len = this.fragments.length;
		for ( i = 0; i < len; i += 1 ) {
			this.fragments[ i ].findAll( selector, query );
		}
	};

	/* virtualdom/items/Section/prototype/findAllComponents.js */
	var virtualdom_items_Section$findAllComponents = function Section$findAllComponents( selector, query ) {
		var i, len;
		len = this.fragments.length;
		for ( i = 0; i < len; i += 1 ) {
			this.fragments[ i ].findAllComponents( selector, query );
		}
	};

	/* virtualdom/items/Section/prototype/findComponent.js */
	var virtualdom_items_Section$findComponent = function Section$findComponent( selector ) {
		var i, len, queryResult;
		len = this.fragments.length;
		for ( i = 0; i < len; i += 1 ) {
			if ( queryResult = this.fragments[ i ].findComponent( selector ) ) {
				return queryResult;
			}
		}
		return null;
	};

	/* virtualdom/items/Section/prototype/findNextNode.js */
	var virtualdom_items_Section$findNextNode = function Section$findNextNode( fragment ) {
		if ( this.fragments[ fragment.index + 1 ] ) {
			return this.fragments[ fragment.index + 1 ].firstNode();
		}
		return this.parentFragment.findNextNode( this );
	};

	/* virtualdom/items/Section/prototype/firstNode.js */
	var virtualdom_items_Section$firstNode = function Section$firstNode() {
		var len, i, node;
		if ( len = this.fragments.length ) {
			for ( i = 0; i < len; i += 1 ) {
				if ( node = this.fragments[ i ].firstNode() ) {
					return node;
				}
			}
		}
		return this.parentFragment.findNextNode( this );
	};

	/* virtualdom/items/Section/prototype/merge.js */
	var virtualdom_items_Section$merge = function( runloop, circular ) {

		var Fragment;
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		return function Section$merge( newIndices ) {
			var section = this,
				parentFragment, firstChange, i, newLength, reboundFragments, fragmentOptions, fragment, nextNode;
			if ( this.unbound ) {
				return;
			}
			parentFragment = this.parentFragment;
			reboundFragments = [];
			// first, rebind existing fragments
			newIndices.forEach( function rebindIfNecessary( newIndex, oldIndex ) {
				var fragment, by, oldKeypath, newKeypath;
				if ( newIndex === oldIndex ) {
					reboundFragments[ newIndex ] = section.fragments[ oldIndex ];
					return;
				}
				fragment = section.fragments[ oldIndex ];
				if ( firstChange === undefined ) {
					firstChange = oldIndex;
				}
				// does this fragment need to be torn down?
				if ( newIndex === -1 ) {
					section.fragmentsToUnrender.push( fragment );
					fragment.unbind();
					return;
				}
				// Otherwise, it needs to be rebound to a new index
				by = newIndex - oldIndex;
				oldKeypath = section.keypath + '.' + oldIndex;
				newKeypath = section.keypath + '.' + newIndex;
				fragment.rebind( section.template.i, newIndex, oldKeypath, newKeypath );
				reboundFragments[ newIndex ] = fragment;
			} );
			newLength = this.root.get( this.keypath ).length;
			// If nothing changed with the existing fragments, then we start adding
			// new fragments at the end...
			if ( firstChange === undefined ) {
				// ...unless there are no new fragments to add
				if ( this.length === newLength ) {
					return;
				}
				firstChange = this.length;
			}
			this.length = this.fragments.length = newLength;
			runloop.addView( this );
			// Prepare new fragment options
			fragmentOptions = {
				template: this.template.f,
				root: this.root,
				owner: this
			};
			if ( this.template.i ) {
				fragmentOptions.indexRef = this.template.i;
			}
			// Add as many new fragments as we need to, or add back existing
			// (detached) fragments
			for ( i = firstChange; i < newLength; i += 1 ) {
				// is this an existing fragment?
				if ( fragment = reboundFragments[ i ] ) {
					this.docFrag.appendChild( fragment.detach( false ) );
				} else {
					// Fragment will be created when changes are applied
					// by the runloop
					this.fragmentsToCreate.push( i );
				}
				this.fragments[ i ] = fragment;
			}
			// reinsert fragment
			nextNode = parentFragment.findNextNode( this );
			this.parentFragment.getNode().insertBefore( this.docFrag, nextNode );
		};
	}( runloop, circular );

	/* virtualdom/items/Section/prototype/render.js */
	var virtualdom_items_Section$render = function Section$render() {
		var docFrag;
		docFrag = this.docFrag = document.createDocumentFragment();
		this.update();
		this.rendered = true;
		return docFrag;
	};

	/* virtualdom/items/Section/prototype/setValue.js */
	var virtualdom_items_Section$setValue = function( types, isArray, isObject, runloop, circular ) {

		var Fragment;
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		return function Section$setValue( value ) {
			var this$0 = this;
			var wrapper, fragmentOptions;
			if ( this.updating ) {
				// If a child of this section causes a re-evaluation - for example, an
				// expression refers to a function that mutates the array that this
				// section depends on - we'll end up with a double rendering bug (see
				// https://github.com/ractivejs/ractive/issues/748). This prevents it.
				return;
			}
			this.updating = true;
			// with sections, we need to get the fake value if we have a wrapped object
			if ( wrapper = this.root.viewmodel.wrapped[ this.keypath ] ) {
				value = wrapper.get();
			}
			// If any fragments are awaiting creation after a splice,
			// this is the place to do it
			if ( this.fragmentsToCreate.length ) {
				fragmentOptions = {
					template: this.template.f,
					root: this.root,
					pElement: this.pElement,
					owner: this,
					indexRef: this.template.i
				};
				this.fragmentsToCreate.forEach( function( index ) {
					var fragment;
					fragmentOptions.context = this$0.keypath + '.' + index;
					fragmentOptions.index = index;
					fragment = new Fragment( fragmentOptions );
					this$0.fragmentsToRender.push( this$0.fragments[ index ] = fragment );
				} );
				this.fragmentsToCreate.length = 0;
			} else if ( reevaluateSection( this, value ) ) {
				this.bubble();
				if ( this.rendered ) {
					runloop.addView( this );
				}
			}
			this.value = value;
			this.updating = false;
		};

		function reevaluateSection( section, value ) {
			var fragmentOptions = {
				template: section.template.f,
				root: section.root,
				pElement: section.parentFragment.pElement,
				owner: section
			};
			// If we already know the section type, great
			// TODO can this be optimised? i.e. pick an reevaluateSection function during init
			// and avoid doing this each time?
			if ( section.subtype ) {
				switch ( section.subtype ) {
					case types.SECTION_IF:
						return reevaluateConditionalSection( section, value, false, fragmentOptions );
					case types.SECTION_UNLESS:
						return reevaluateConditionalSection( section, value, true, fragmentOptions );
					case types.SECTION_WITH:
						return reevaluateContextSection( section, fragmentOptions );
					case types.SECTION_EACH:
						if ( isObject( value ) ) {
							return reevaluateListObjectSection( section, value, fragmentOptions );
						}
				}
			}
			// Otherwise we need to work out what sort of section we're dealing with
			section.ordered = !!isArray( value );
			// Ordered list section
			if ( section.ordered ) {
				return reevaluateListSection( section, value, fragmentOptions );
			}
			// Unordered list, or context
			if ( isObject( value ) || typeof value === 'function' ) {
				// Index reference indicates section should be treated as a list
				if ( section.template.i ) {
					return reevaluateListObjectSection( section, value, fragmentOptions );
				}
				// Otherwise, object provides context for contents
				return reevaluateContextSection( section, fragmentOptions );
			}
			// Conditional section
			return reevaluateConditionalSection( section, value, false, fragmentOptions );
		}

		function reevaluateListSection( section, value, fragmentOptions ) {
			var i, length, fragment;
			length = value.length;
			if ( length === section.length ) {
				// Nothing to do
				return false;
			}
			// if the array is shorter than it was previously, remove items
			if ( length < section.length ) {
				section.fragmentsToUnrender = section.fragments.splice( length, section.length - length );
				section.fragmentsToUnrender.forEach( unbind );
			} else {
				if ( length > section.length ) {
					// add any new ones
					for ( i = section.length; i < length; i += 1 ) {
						// append list item to context stack
						fragmentOptions.context = section.keypath + '.' + i;
						fragmentOptions.index = i;
						if ( section.template.i ) {
							fragmentOptions.indexRef = section.template.i;
						}
						fragment = new Fragment( fragmentOptions );
						section.fragmentsToRender.push( section.fragments[ i ] = fragment );
					}
				}
			}
			section.length = length;
			return true;
		}

		function reevaluateListObjectSection( section, value, fragmentOptions ) {
			var id, i, hasKey, fragment, changed;
			hasKey = section.hasKey || ( section.hasKey = {} );
			// remove any fragments that should no longer exist
			i = section.fragments.length;
			while ( i-- ) {
				fragment = section.fragments[ i ];
				if ( !( fragment.index in value ) ) {
					changed = true;
					fragment.unbind();
					section.fragmentsToUnrender.push( fragment );
					section.fragments.splice( i, 1 );
					hasKey[ fragment.index ] = false;
				}
			}
			// add any that haven't been created yet
			for ( id in value ) {
				if ( !hasKey[ id ] ) {
					changed = true;
					fragmentOptions.context = section.keypath + '.' + id;
					fragmentOptions.index = id;
					if ( section.template.i ) {
						fragmentOptions.indexRef = section.template.i;
					}
					fragment = new Fragment( fragmentOptions );
					section.fragmentsToRender.push( fragment );
					section.fragments.push( fragment );
					hasKey[ id ] = true;
				}
			}
			section.length = section.fragments.length;
			return changed;
		}

		function reevaluateContextSection( section, fragmentOptions ) {
			var fragment;
			// ...then if it isn't rendered, render it, adding section.keypath to the context stack
			// (if it is already rendered, then any children dependent on the context stack
			// will update themselves without any prompting)
			if ( !section.length ) {
				// append this section to the context stack
				fragmentOptions.context = section.keypath;
				fragmentOptions.index = 0;
				fragment = new Fragment( fragmentOptions );
				section.fragmentsToRender.push( section.fragments[ 0 ] = fragment );
				section.length = 1;
				return true;
			}
		}

		function reevaluateConditionalSection( section, value, inverted, fragmentOptions ) {
			var doRender, emptyArray, fragment;
			emptyArray = isArray( value ) && value.length === 0;
			if ( inverted ) {
				doRender = emptyArray || !value;
			} else {
				doRender = value && !emptyArray;
			}
			if ( doRender ) {
				if ( !section.length ) {
					// no change to context stack
					fragmentOptions.index = 0;
					fragment = new Fragment( fragmentOptions );
					section.fragmentsToRender.push( section.fragments[ 0 ] = fragment );
					section.length = 1;
					return true;
				}
				if ( section.length > 1 ) {
					section.fragmentsToUnrender = section.fragments.splice( 1 );
					section.fragmentsToUnrender.forEach( unbind );
					return true;
				}
			} else if ( section.length ) {
				section.fragmentsToUnrender = section.fragments.splice( 0, section.fragments.length );
				section.fragmentsToUnrender.forEach( unbind );
				section.length = 0;
				return true;
			}
		}

		function unbind( fragment ) {
			fragment.unbind();
		}
	}( types, isArray, isObject, runloop, circular );

	/* virtualdom/items/Section/prototype/splice.js */
	var virtualdom_items_Section$splice = function( runloop, circular ) {

		var Fragment;
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		return function Section$splice( spliceSummary ) {
			var section = this,
				balance, start, insertStart, insertEnd, spliceArgs;
			// In rare cases, a section will receive a splice instruction after it has
			// been unbound (see https://github.com/ractivejs/ractive/issues/967). This
			// prevents errors arising from those situations
			if ( this.unbound ) {
				return;
			}
			balance = spliceSummary.balance;
			if ( !balance ) {
				// The array length hasn't changed - we don't need to add or remove anything
				return;
			}
			// Register with the runloop, so we can (un)render with the
			// next batch of DOM changes
			runloop.addView( section );
			start = spliceSummary.rangeStart;
			section.length += balance;
			// If more items were removed from the array than added, we tear down
			// the excess fragments and remove them...
			if ( balance < 0 ) {
				section.fragmentsToUnrender = section.fragments.splice( start, -balance );
				section.fragmentsToUnrender.forEach( unbind );
				// Reassign fragments after the ones we've just removed
				rebindFragments( section, start, section.length, balance );
				// Nothing more to do
				return;
			}
			// ...otherwise we need to add some things to the DOM.
			insertStart = start + spliceSummary.removed;
			insertEnd = start + spliceSummary.added;
			// Make room for the new fragments by doing a splice that simulates
			// what happened to the data array
			spliceArgs = [
				insertStart,
				0
			];
			spliceArgs.length += balance;
			section.fragments.splice.apply( section.fragments, spliceArgs );
			// Rebind existing fragments at the end of the array
			rebindFragments( section, insertEnd, section.length, balance );
			// Schedule new fragments to be created
			section.fragmentsToCreate = range( insertStart, insertEnd );
		};

		function unbind( fragment ) {
			fragment.unbind();
		}

		function range( start, end ) {
			var array = [],
				i;
			for ( i = start; i < end; i += 1 ) {
				array.push( i );
			}
			return array;
		}

		function rebindFragments( section, start, end, by ) {
			var i, fragment, indexRef, oldKeypath, newKeypath;
			indexRef = section.template.i;
			for ( i = start; i < end; i += 1 ) {
				fragment = section.fragments[ i ];
				oldKeypath = section.keypath + '.' + ( i - by );
				newKeypath = section.keypath + '.' + i;
				// change the fragment index
				fragment.index = i;
				fragment.rebind( indexRef, i, oldKeypath, newKeypath );
			}
		}
	}( runloop, circular );

	/* virtualdom/items/Section/prototype/toString.js */
	var virtualdom_items_Section$toString = function Section$toString( escape ) {
		var str, i, len;
		str = '';
		i = 0;
		len = this.length;
		for ( i = 0; i < len; i += 1 ) {
			str += this.fragments[ i ].toString( escape );
		}
		return str;
	};

	/* virtualdom/items/Section/prototype/unbind.js */
	var virtualdom_items_Section$unbind = function( unbind ) {

		return function Section$unbind() {
			this.fragments.forEach( unbindFragment );
			unbind.call( this );
			this.length = 0;
			this.unbound = true;
		};

		function unbindFragment( fragment ) {
			fragment.unbind();
		}
	}( unbind );

	/* virtualdom/items/Section/prototype/unrender.js */
	var virtualdom_items_Section$unrender = function() {

		return function Section$unrender( shouldDestroy ) {
			this.fragments.forEach( shouldDestroy ? unrenderAndDestroy : unrender );
		};

		function unrenderAndDestroy( fragment ) {
			fragment.unrender( true );
		}

		function unrender( fragment ) {
			fragment.unrender( false );
		}
	}();

	/* virtualdom/items/Section/prototype/update.js */
	var virtualdom_items_Section$update = function Section$update() {
		var fragment, rendered, nextFragment, anchor, target;
		while ( fragment = this.fragmentsToUnrender.pop() ) {
			fragment.unrender( true );
		}
		// If we have no new nodes to insert (i.e. the section length stayed the
		// same, or shrank), we don't need to go any further
		if ( !this.fragmentsToRender.length ) {
			return;
		}
		if ( this.rendered ) {
			target = this.parentFragment.getNode();
		}
		// Render new fragments to our docFrag
		while ( fragment = this.fragmentsToRender.shift() ) {
			rendered = fragment.render();
			this.docFrag.appendChild( rendered );
			// If this is an ordered list, and it's already rendered, we may
			// need to insert content into the appropriate place
			if ( this.rendered && this.ordered ) {
				// If the next fragment is already rendered, use it as an anchor...
				nextFragment = this.fragments[ fragment.index + 1 ];
				if ( nextFragment && nextFragment.rendered ) {
					target.insertBefore( this.docFrag, nextFragment.firstNode() || null );
				}
			}
		}
		if ( this.rendered && this.docFrag.childNodes.length ) {
			anchor = this.parentFragment.findNextNode( this );
			target.insertBefore( this.docFrag, anchor );
		}
	};

	/* virtualdom/items/Section/_Section.js */
	var Section = function( types, Mustache, bubble, detach, find, findAll, findAllComponents, findComponent, findNextNode, firstNode, merge, render, setValue, splice, toString, unbind, unrender, update ) {

		var Section = function( options ) {
			this.type = types.SECTION;
			this.subtype = options.template.n;
			this.inverted = this.subtype === types.SECTION_UNLESS;
			this.pElement = options.pElement;
			this.fragments = [];
			this.fragmentsToCreate = [];
			this.fragmentsToRender = [];
			this.fragmentsToUnrender = [];
			this.length = 0;
			// number of times this section is rendered
			Mustache.init( this, options );
		};
		Section.prototype = {
			bubble: bubble,
			detach: detach,
			find: find,
			findAll: findAll,
			findAllComponents: findAllComponents,
			findComponent: findComponent,
			findNextNode: findNextNode,
			firstNode: firstNode,
			getValue: Mustache.getValue,
			merge: merge,
			rebind: Mustache.rebind,
			render: render,
			resolve: Mustache.resolve,
			setValue: setValue,
			splice: splice,
			toString: toString,
			unbind: unbind,
			unrender: unrender,
			update: update
		};
		return Section;
	}( types, Mustache, virtualdom_items_Section$bubble, virtualdom_items_Section$detach, virtualdom_items_Section$find, virtualdom_items_Section$findAll, virtualdom_items_Section$findAllComponents, virtualdom_items_Section$findComponent, virtualdom_items_Section$findNextNode, virtualdom_items_Section$firstNode, virtualdom_items_Section$merge, virtualdom_items_Section$render, virtualdom_items_Section$setValue, virtualdom_items_Section$splice, virtualdom_items_Section$toString, virtualdom_items_Section$unbind, virtualdom_items_Section$unrender, virtualdom_items_Section$update );

	/* virtualdom/items/Triple/prototype/detach.js */
	var virtualdom_items_Triple$detach = function Triple$detach() {
		var len, i;
		if ( this.docFrag ) {
			len = this.nodes.length;
			for ( i = 0; i < len; i += 1 ) {
				this.docFrag.appendChild( this.nodes[ i ] );
			}
			return this.docFrag;
		}
	};

	/* virtualdom/items/Triple/prototype/find.js */
	var virtualdom_items_Triple$find = function( matches ) {

		return function Triple$find( selector ) {
			var i, len, node, queryResult;
			len = this.nodes.length;
			for ( i = 0; i < len; i += 1 ) {
				node = this.nodes[ i ];
				if ( node.nodeType !== 1 ) {
					continue;
				}
				if ( matches( node, selector ) ) {
					return node;
				}
				if ( queryResult = node.querySelector( selector ) ) {
					return queryResult;
				}
			}
			return null;
		};
	}( matches );

	/* virtualdom/items/Triple/prototype/findAll.js */
	var virtualdom_items_Triple$findAll = function( matches ) {

		return function Triple$findAll( selector, queryResult ) {
			var i, len, node, queryAllResult, numNodes, j;
			len = this.nodes.length;
			for ( i = 0; i < len; i += 1 ) {
				node = this.nodes[ i ];
				if ( node.nodeType !== 1 ) {
					continue;
				}
				if ( matches( node, selector ) ) {
					queryResult.push( node );
				}
				if ( queryAllResult = node.querySelectorAll( selector ) ) {
					numNodes = queryAllResult.length;
					for ( j = 0; j < numNodes; j += 1 ) {
						queryResult.push( queryAllResult[ j ] );
					}
				}
			}
		};
	}( matches );

	/* virtualdom/items/Triple/prototype/firstNode.js */
	var virtualdom_items_Triple$firstNode = function Triple$firstNode() {
		if ( this.rendered && this.nodes[ 0 ] ) {
			return this.nodes[ 0 ];
		}
		return this.parentFragment.findNextNode( this );
	};

	/* virtualdom/items/Triple/helpers/insertHtml.js */
	var insertHtml = function( namespaces, createElement ) {

		var elementCache = {},
			ieBug, ieBlacklist;
		try {
			createElement( 'table' ).innerHTML = 'foo';
		} catch ( err ) {
			ieBug = true;
			ieBlacklist = {
				TABLE: [
					'<table class="x">',
					'</table>'
				],
				THEAD: [
					'<table><thead class="x">',
					'</thead></table>'
				],
				TBODY: [
					'<table><tbody class="x">',
					'</tbody></table>'
				],
				TR: [
					'<table><tr class="x">',
					'</tr></table>'
				],
				SELECT: [
					'<select class="x">',
					'</select>'
				]
			};
		}
		return function( html, node, docFrag ) {
			var container, nodes = [],
				wrapper, selectedOption, child, i;
			if ( html ) {
				if ( ieBug && ( wrapper = ieBlacklist[ node.tagName ] ) ) {
					container = element( 'DIV' );
					container.innerHTML = wrapper[ 0 ] + html + wrapper[ 1 ];
					container = container.querySelector( '.x' );
					if ( container.tagName === 'SELECT' ) {
						selectedOption = container.options[ container.selectedIndex ];
					}
				} else if ( node.namespaceURI === namespaces.svg ) {
					container = element( 'DIV' );
					container.innerHTML = '<svg class="x">' + html + '</svg>';
					container = container.querySelector( '.x' );
				} else {
					container = element( node.tagName );
					container.innerHTML = html;
				}
				while ( child = container.firstChild ) {
					nodes.push( child );
					docFrag.appendChild( child );
				}
				// This is really annoying. Extracting <option> nodes from the
				// temporary container <select> causes the remaining ones to
				// become selected. So now we have to deselect them. IE8, you
				// amaze me. You really do
				if ( ieBug && node.tagName === 'SELECT' ) {
					i = nodes.length;
					while ( i-- ) {
						if ( nodes[ i ] !== selectedOption ) {
							nodes[ i ].selected = false;
						}
					}
				}
			}
			return nodes;
		};

		function element( tagName ) {
			return elementCache[ tagName ] || ( elementCache[ tagName ] = createElement( tagName ) );
		}
	}( namespaces, createElement );

	/* utils/toArray.js */
	var toArray = function toArray( arrayLike ) {
		var array = [],
			i = arrayLike.length;
		while ( i-- ) {
			array[ i ] = arrayLike[ i ];
		}
		return array;
	};

	/* virtualdom/items/Triple/helpers/updateSelect.js */
	var updateSelect = function( toArray ) {

		return function updateSelect( parentElement ) {
			var selectedOptions, option, value;
			if ( !parentElement || parentElement.name !== 'select' || !parentElement.binding ) {
				return;
			}
			selectedOptions = toArray( parentElement.node.options ).filter( isSelected );
			// If one of them had a `selected` attribute, we need to sync
			// the model to the view
			if ( parentElement.getAttribute( 'multiple' ) ) {
				value = selectedOptions.map( function( o ) {
					return o.value;
				} );
			} else if ( option = selectedOptions[ 0 ] ) {
				value = option.value;
			}
			if ( value !== undefined ) {
				parentElement.binding.setValue( value );
			}
			parentElement.bubble();
		};

		function isSelected( option ) {
			return option.selected;
		}
	}( toArray );

	/* virtualdom/items/Triple/prototype/render.js */
	var virtualdom_items_Triple$render = function( insertHtml, updateSelect ) {

		return function Triple$render() {
			if ( this.rendered ) {
				throw new Error( 'Attempted to render an item that was already rendered' );
			}
			this.docFrag = document.createDocumentFragment();
			this.nodes = insertHtml( this.value, this.parentFragment.getNode(), this.docFrag );
			// Special case - we're inserting the contents of a <select>
			updateSelect( this.pElement );
			this.rendered = true;
			return this.docFrag;
		};
	}( insertHtml, updateSelect );

	/* virtualdom/items/Triple/prototype/setValue.js */
	var virtualdom_items_Triple$setValue = function( runloop ) {

		return function Triple$setValue( value ) {
			var wrapper;
			// TODO is there a better way to approach this?
			if ( wrapper = this.root.viewmodel.wrapped[ this.keypath ] ) {
				value = wrapper.get();
			}
			if ( value !== this.value ) {
				this.value = value;
				this.parentFragment.bubble();
				if ( this.rendered ) {
					runloop.addView( this );
				}
			}
		};
	}( runloop );

	/* virtualdom/items/Triple/prototype/toString.js */
	var virtualdom_items_Triple$toString = function Triple$toString() {
		return this.value != undefined ? this.value : '';
	};

	/* virtualdom/items/Triple/prototype/unrender.js */
	var virtualdom_items_Triple$unrender = function( detachNode ) {

		return function Triple$unrender( shouldDestroy ) {
			if ( this.rendered && shouldDestroy ) {
				this.nodes.forEach( detachNode );
				this.rendered = false;
			}
		};
	}( detachNode );

	/* virtualdom/items/Triple/prototype/update.js */
	var virtualdom_items_Triple$update = function( insertHtml, updateSelect ) {

		return function Triple$update() {
			var node, parentNode;
			if ( !this.rendered ) {
				return;
			}
			// Remove existing nodes
			while ( this.nodes && this.nodes.length ) {
				node = this.nodes.pop();
				node.parentNode.removeChild( node );
			}
			// Insert new nodes
			parentNode = this.parentFragment.getNode();
			this.nodes = insertHtml( this.value, parentNode, this.docFrag );
			parentNode.insertBefore( this.docFrag, this.parentFragment.findNextNode( this ) );
			// Special case - we're inserting the contents of a <select>
			updateSelect( this.pElement );
		};
	}( insertHtml, updateSelect );

	/* virtualdom/items/Triple/_Triple.js */
	var Triple = function( types, Mustache, detach, find, findAll, firstNode, render, setValue, toString, unrender, update, unbind ) {

		var Triple = function( options ) {
			this.type = types.TRIPLE;
			Mustache.init( this, options );
		};
		Triple.prototype = {
			detach: detach,
			find: find,
			findAll: findAll,
			firstNode: firstNode,
			getValue: Mustache.getValue,
			rebind: Mustache.rebind,
			render: render,
			resolve: Mustache.resolve,
			setValue: setValue,
			toString: toString,
			unbind: unbind,
			unrender: unrender,
			update: update
		};
		return Triple;
	}( types, Mustache, virtualdom_items_Triple$detach, virtualdom_items_Triple$find, virtualdom_items_Triple$findAll, virtualdom_items_Triple$firstNode, virtualdom_items_Triple$render, virtualdom_items_Triple$setValue, virtualdom_items_Triple$toString, virtualdom_items_Triple$unrender, virtualdom_items_Triple$update, unbind );

	/* virtualdom/items/Element/prototype/bubble.js */
	var virtualdom_items_Element$bubble = function() {
		this.parentFragment.bubble();
	};

	/* virtualdom/items/Element/prototype/detach.js */
	var virtualdom_items_Element$detach = function Element$detach() {
		var node = this.node,
			parentNode;
		if ( node ) {
			// need to check for parent node - DOM may have been altered
			// by something other than Ractive! e.g. jQuery UI...
			if ( parentNode = node.parentNode ) {
				parentNode.removeChild( node );
			}
			return node;
		}
	};

	/* virtualdom/items/Element/prototype/find.js */
	var virtualdom_items_Element$find = function( matches ) {

		return function( selector ) {
			if ( matches( this.node, selector ) ) {
				return this.node;
			}
			if ( this.fragment && this.fragment.find ) {
				return this.fragment.find( selector );
			}
		};
	}( matches );

	/* virtualdom/items/Element/prototype/findAll.js */
	var virtualdom_items_Element$findAll = function( selector, query ) {
		// Add this node to the query, if applicable, and register the
		// query on this element
		if ( query._test( this, true ) && query.live ) {
			( this.liveQueries || ( this.liveQueries = [] ) ).push( query );
		}
		if ( this.fragment ) {
			this.fragment.findAll( selector, query );
		}
	};

	/* virtualdom/items/Element/prototype/findAllComponents.js */
	var virtualdom_items_Element$findAllComponents = function( selector, query ) {
		if ( this.fragment ) {
			this.fragment.findAllComponents( selector, query );
		}
	};

	/* virtualdom/items/Element/prototype/findComponent.js */
	var virtualdom_items_Element$findComponent = function( selector ) {
		if ( this.fragment ) {
			return this.fragment.findComponent( selector );
		}
	};

	/* virtualdom/items/Element/prototype/findNextNode.js */
	var virtualdom_items_Element$findNextNode = function Element$findNextNode() {
		return null;
	};

	/* virtualdom/items/Element/prototype/firstNode.js */
	var virtualdom_items_Element$firstNode = function Element$firstNode() {
		return this.node;
	};

	/* virtualdom/items/Element/prototype/getAttribute.js */
	var virtualdom_items_Element$getAttribute = function Element$getAttribute( name ) {
		if ( !this.attributes || !this.attributes[ name ] ) {
			return;
		}
		return this.attributes[ name ].value;
	};

	/* virtualdom/items/Element/shared/enforceCase.js */
	var enforceCase = function() {

		var svgCamelCaseElements, svgCamelCaseAttributes, createMap, map;
		svgCamelCaseElements = 'altGlyph altGlyphDef altGlyphItem animateColor animateMotion animateTransform clipPath feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence foreignObject glyphRef linearGradient radialGradient textPath vkern'.split( ' ' );
		svgCamelCaseAttributes = 'attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits contentScriptType contentStyleType diffuseConstant edgeMode externalResourcesRequired filterRes filterUnits glyphRef gradientTransform gradientUnits kernelMatrix kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent spreadMethod startOffset stdDeviation stitchTiles surfaceScale systemLanguage tableValues targetX targetY textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan'.split( ' ' );
		createMap = function( items ) {
			var map = {},
				i = items.length;
			while ( i-- ) {
				map[ items[ i ].toLowerCase() ] = items[ i ];
			}
			return map;
		};
		map = createMap( svgCamelCaseElements.concat( svgCamelCaseAttributes ) );
		return function( elementName ) {
			var lowerCaseElementName = elementName.toLowerCase();
			return map[ lowerCaseElementName ] || lowerCaseElementName;
		};
	}();

	/* virtualdom/items/Element/Attribute/prototype/bubble.js */
	var virtualdom_items_Element_Attribute$bubble = function( runloop ) {

		return function Attribute$bubble() {
			var value = this.fragment.getValue();
			// TODO this can register the attribute multiple times (see render test
			// 'Attribute with nested mustaches')
			if ( value !== this.value ) {
				this.value = value;
				if ( this.name === 'value' && this.node ) {
					// We need to store the value on the DOM like this so we
					// can retrieve it later without it being coerced to a string
					this.node._ractive.value = value;
				}
				if ( this.rendered ) {
					runloop.addView( this );
				}
			}
		};
	}( runloop );

	/* virtualdom/items/Element/Attribute/helpers/determineNameAndNamespace.js */
	var determineNameAndNamespace = function( namespaces, enforceCase ) {

		return function( attribute, name ) {
			var colonIndex, namespacePrefix;
			// are we dealing with a namespaced attribute, e.g. xlink:href?
			colonIndex = name.indexOf( ':' );
			if ( colonIndex !== -1 ) {
				// looks like we are, yes...
				namespacePrefix = name.substr( 0, colonIndex );
				// ...unless it's a namespace *declaration*, which we ignore (on the assumption
				// that only valid namespaces will be used)
				if ( namespacePrefix !== 'xmlns' ) {
					name = name.substring( colonIndex + 1 );
					attribute.name = enforceCase( name );
					attribute.namespace = namespaces[ namespacePrefix.toLowerCase() ];
					if ( !attribute.namespace ) {
						throw 'Unknown namespace ("' + namespacePrefix + '")';
					}
					return;
				}
			}
			// SVG attribute names are case sensitive
			attribute.name = attribute.element.namespace !== namespaces.html ? enforceCase( name ) : name;
		};
	}( namespaces, enforceCase );

	/* virtualdom/items/Element/Attribute/helpers/getInterpolator.js */
	var getInterpolator = function( types ) {

		return function getInterpolator( attribute ) {
			var items = attribute.fragment.items;
			if ( items.length !== 1 ) {
				return;
			}
			if ( items[ 0 ].type === types.INTERPOLATOR ) {
				return items[ 0 ];
			}
		};
	}( types );

	/* virtualdom/items/Element/Attribute/helpers/determinePropertyName.js */
	var determinePropertyName = function( namespaces ) {

		// the property name equivalents for element attributes, where they differ
		// from the lowercased attribute name
		var propertyNames = {
			'accept-charset': 'acceptCharset',
			accesskey: 'accessKey',
			bgcolor: 'bgColor',
			'class': 'className',
			codebase: 'codeBase',
			colspan: 'colSpan',
			contenteditable: 'contentEditable',
			datetime: 'dateTime',
			dirname: 'dirName',
			'for': 'htmlFor',
			'http-equiv': 'httpEquiv',
			ismap: 'isMap',
			maxlength: 'maxLength',
			novalidate: 'noValidate',
			pubdate: 'pubDate',
			readonly: 'readOnly',
			rowspan: 'rowSpan',
			tabindex: 'tabIndex',
			usemap: 'useMap'
		};
		return function( attribute, options ) {
			var propertyName;
			if ( attribute.pNode && !attribute.namespace && ( !options.pNode.namespaceURI || options.pNode.namespaceURI === namespaces.html ) ) {
				propertyName = propertyNames[ attribute.name ] || attribute.name;
				if ( options.pNode[ propertyName ] !== undefined ) {
					attribute.propertyName = propertyName;
				}
				// is attribute a boolean attribute or 'value'? If so we're better off doing e.g.
				// node.selected = true rather than node.setAttribute( 'selected', '' )
				if ( typeof options.pNode[ propertyName ] === 'boolean' || propertyName === 'value' ) {
					attribute.useProperty = true;
				}
			}
		};
	}( namespaces );

	/* virtualdom/items/Element/Attribute/prototype/init.js */
	var virtualdom_items_Element_Attribute$init = function( types, determineNameAndNamespace, getInterpolator, determinePropertyName, circular ) {

		var Fragment;
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		return function Attribute$init( options ) {
			this.type = types.ATTRIBUTE;
			this.element = options.element;
			this.root = options.root;
			determineNameAndNamespace( this, options.name );
			// if it's an empty attribute, or just a straight key-value pair, with no
			// mustache shenanigans, set the attribute accordingly and go home
			if ( !options.value || typeof options.value === 'string' ) {
				this.value = options.value || true;
				return;
			}
			// otherwise we need to do some work
			// share parentFragment with parent element
			this.parentFragment = this.element.parentFragment;
			this.fragment = new Fragment( {
				template: options.value,
				root: this.root,
				owner: this
			} );
			this.value = this.fragment.getValue();
			// Store a reference to this attribute's interpolator, if its fragment
			// takes the form `{{foo}}`. This is necessary for two-way binding and
			// for correctly rendering HTML later
			this.interpolator = getInterpolator( this );
			this.isBindable = !!this.interpolator;
			// can we establish this attribute's property name equivalent?
			determinePropertyName( this, options );
			// mark as ready
			this.ready = true;
		};
	}( types, determineNameAndNamespace, getInterpolator, determinePropertyName, circular );

	/* virtualdom/items/Element/Attribute/prototype/rebind.js */
	var virtualdom_items_Element_Attribute$rebind = function Attribute$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
		if ( this.fragment ) {
			this.fragment.rebind( indexRef, newIndex, oldKeypath, newKeypath );
		}
	};

	/* virtualdom/items/Element/Attribute/prototype/render.js */
	var virtualdom_items_Element_Attribute$render = function( namespaces ) {

		// the property name equivalents for element attributes, where they differ
		// from the lowercased attribute name
		var propertyNames = {
			'accept-charset': 'acceptCharset',
			'accesskey': 'accessKey',
			'bgcolor': 'bgColor',
			'class': 'className',
			'codebase': 'codeBase',
			'colspan': 'colSpan',
			'contenteditable': 'contentEditable',
			'datetime': 'dateTime',
			'dirname': 'dirName',
			'for': 'htmlFor',
			'http-equiv': 'httpEquiv',
			'ismap': 'isMap',
			'maxlength': 'maxLength',
			'novalidate': 'noValidate',
			'pubdate': 'pubDate',
			'readonly': 'readOnly',
			'rowspan': 'rowSpan',
			'tabindex': 'tabIndex',
			'usemap': 'useMap'
		};
		return function Attribute$render( node ) {
			var propertyName;
			this.node = node;
			// should we use direct property access, or setAttribute?
			if ( !node.namespaceURI || node.namespaceURI === namespaces.html ) {
				propertyName = propertyNames[ this.name ] || this.name;
				if ( node[ propertyName ] !== undefined ) {
					this.propertyName = propertyName;
				}
				// is attribute a boolean attribute or 'value'? If so we're better off doing e.g.
				// node.selected = true rather than node.setAttribute( 'selected', '' )
				if ( typeof node[ propertyName ] === 'boolean' || propertyName === 'value' ) {
					this.useProperty = true;
				}
				if ( propertyName === 'value' ) {
					this.useProperty = true;
					node._ractive.value = this.value;
				}
			}
			this.rendered = true;
			this.update();
		};
	}( namespaces );

	/* virtualdom/items/Element/Attribute/prototype/toString.js */
	var virtualdom_items_Element_Attribute$toString = function() {

		return function Attribute$toString() {
			var name, value, interpolator;
			name = this.name;
			value = this.value;
			// Special case - select values (should not be stringified)
			if ( name === 'value' && this.element.name === 'select' ) {
				return;
			}
			// Special case - radio names
			if ( name === 'name' && this.element.name === 'input' && ( interpolator = this.interpolator ) ) {
				return 'name={{' + ( interpolator.keypath || interpolator.ref ) + '}}';
			}
			// Numbers
			if ( typeof value === 'number' ) {
				return name + '="' + value + '"';
			}
			// Strings
			if ( typeof value === 'string' ) {
				return name + '="' + escape( value ) + '"';
			}
			// Everything else
			return value ? name : '';
		};

		function escape( value ) {
			return value.replace( /&/g, '&amp;' ).replace( /"/g, '&quot;' ).replace( /'/g, '&#39;' );
		}
	}();

	/* virtualdom/items/Element/Attribute/prototype/unbind.js */
	var virtualdom_items_Element_Attribute$unbind = function Attribute$unbind() {
		// ignore non-dynamic attributes
		if ( this.fragment ) {
			this.fragment.unbind();
		}
	};

	/* virtualdom/items/Element/Attribute/prototype/update/updateSelectValue.js */
	var virtualdom_items_Element_Attribute$update_updateSelectValue = function Attribute$updateSelect() {
		var value = this.value,
			options, option, optionValue, i;
		if ( !this.locked ) {
			this.node._ractive.value = value;
			options = this.node.options;
			i = options.length;
			while ( i-- ) {
				option = options[ i ];
				optionValue = option._ractive ? option._ractive.value : option.value;
				// options inserted via a triple don't have _ractive
				if ( optionValue == value ) {
					// double equals as we may be comparing numbers with strings
					option.selected = true;
					break;
				}
			}
		}
	};

	/* virtualdom/items/Element/Attribute/prototype/update/updateMultipleSelectValue.js */
	var virtualdom_items_Element_Attribute$update_updateMultipleSelectValue = function( isArray ) {

		return function Attribute$updateMultipleSelect() {
			var value = this.value,
				options, i, option, optionValue;
			if ( !isArray( value ) ) {
				value = [ value ];
			}
			options = this.node.options;
			i = options.length;
			while ( i-- ) {
				option = options[ i ];
				optionValue = option._ractive ? option._ractive.value : option.value;
				// options inserted via a triple don't have _ractive
				option.selected = value.indexOf( optionValue ) !== -1;
			}
		};
	}( isArray );

	/* virtualdom/items/Element/Attribute/prototype/update/updateRadioName.js */
	var virtualdom_items_Element_Attribute$update_updateRadioName = function Attribute$updateRadioName() {
		var node = ( value = this ).node,
			value = value.value;
		node.checked = value == node._ractive.value;
	};

	/* virtualdom/items/Element/Attribute/prototype/update/updateRadioValue.js */
	var virtualdom_items_Element_Attribute$update_updateRadioValue = function( runloop ) {

		return function Attribute$updateRadioValue() {
			var wasChecked, node = this.node,
				binding, bindings, i;
			wasChecked = node.checked;
			node.value = this.element.getAttribute( 'value' );
			node.checked = this.element.getAttribute( 'value' ) === this.element.getAttribute( 'name' );
			// This is a special case - if the input was checked, and the value
			// changed so that it's no longer checked, the twoway binding is
			// most likely out of date. To fix it we have to jump through some
			// hoops... this is a little kludgy but it works
			if ( wasChecked && !node.checked && this.element.binding ) {
				bindings = this.element.binding.siblings;
				if ( i = bindings.length ) {
					while ( i-- ) {
						binding = bindings[ i ];
						if ( !binding.element.node ) {
							// this is the initial render, siblings are still rendering!
							// we'll come back later...
							return;
						}
						if ( binding.element.node.checked ) {
							runloop.addViewmodel( binding.root.viewmodel );
							return binding.handleChange();
						}
					}
					runloop.addViewmodel( binding.root.viewmodel );
					this.root.viewmodel.set( binding.keypath, undefined );
				}
			}
		};
	}( runloop );

	/* virtualdom/items/Element/Attribute/prototype/update/updateCheckboxName.js */
	var virtualdom_items_Element_Attribute$update_updateCheckboxName = function( isArray ) {

		return function Attribute$updateCheckboxName() {
			var node, value;
			node = this.node;
			value = this.value;
			if ( !isArray( value ) ) {
				node.checked = value == node._ractive.value;
			} else {
				node.checked = value.indexOf( node._ractive.value ) !== -1;
			}
		};
	}( isArray );

	/* virtualdom/items/Element/Attribute/prototype/update/updateClassName.js */
	var virtualdom_items_Element_Attribute$update_updateClassName = function Attribute$updateClassName() {
		var node, value;
		node = this.node;
		value = this.value;
		if ( value === undefined ) {
			value = '';
		}
		node.className = value;
	};

	/* virtualdom/items/Element/Attribute/prototype/update/updateIdAttribute.js */
	var virtualdom_items_Element_Attribute$update_updateIdAttribute = function Attribute$updateIdAttribute() {
		var node, value;
		node = this.node;
		value = this.value;
		if ( value !== undefined ) {
			this.root.nodes[ value ] = undefined;
		}
		this.root.nodes[ value ] = node;
		node.id = value;
	};

	/* virtualdom/items/Element/Attribute/prototype/update/updateIEStyleAttribute.js */
	var virtualdom_items_Element_Attribute$update_updateIEStyleAttribute = function Attribute$updateIEStyleAttribute() {
		var node, value;
		node = this.node;
		value = this.value;
		if ( value === undefined ) {
			value = '';
		}
		node.style.setAttribute( 'cssText', value );
	};

	/* virtualdom/items/Element/Attribute/prototype/update/updateContentEditableValue.js */
	var virtualdom_items_Element_Attribute$update_updateContentEditableValue = function Attribute$updateContentEditableValue() {
		var node, value;
		node = this.node;
		value = this.value;
		if ( value === undefined ) {
			value = '';
		}
		if ( !this.locked ) {
			node.innerHTML = value;
		}
	};

	/* virtualdom/items/Element/Attribute/prototype/update/updateValue.js */
	var virtualdom_items_Element_Attribute$update_updateValue = function Attribute$updateValue() {
		var node, value;
		node = this.node;
		value = this.value;
		// store actual value, so it doesn't get coerced to a string
		node._ractive.value = value;
		// with two-way binding, only update if the change wasn't initiated by the user
		// otherwise the cursor will often be sent to the wrong place
		if ( !this.locked ) {
			node.value = value == undefined ? '' : value;
		}
	};

	/* virtualdom/items/Element/Attribute/prototype/update/updateBoolean.js */
	var virtualdom_items_Element_Attribute$update_updateBoolean = function Attribute$updateBooleanAttribute() {
		// with two-way binding, only update if the change wasn't initiated by the user
		// otherwise the cursor will often be sent to the wrong place
		if ( !this.locked ) {
			this.node[ this.propertyName ] = this.value;
		}
	};

	/* virtualdom/items/Element/Attribute/prototype/update/updateEverythingElse.js */
	var virtualdom_items_Element_Attribute$update_updateEverythingElse = function Attribute$updateEverythingElse() {
		var node, name, value;
		node = this.node;
		name = this.name;
		value = this.value;
		if ( this.namespace ) {
			node.setAttributeNS( this.namespace, name, value );
		} else if ( typeof value === 'string' || typeof value === 'number' ) {
			node.setAttribute( name, value );
		} else {
			if ( value ) {
				node.setAttribute( name, '' );
			} else {
				node.removeAttribute( name );
			}
		}
	};

	/* virtualdom/items/Element/Attribute/prototype/update.js */
	var virtualdom_items_Element_Attribute$update = function( namespaces, noop, updateSelectValue, updateMultipleSelectValue, updateRadioName, updateRadioValue, updateCheckboxName, updateClassName, updateIdAttribute, updateIEStyleAttribute, updateContentEditableValue, updateValue, updateBoolean, updateEverythingElse ) {

		// There are a few special cases when it comes to updating attributes. For this reason,
		// the prototype .update() method points to this method, which waits until the
		// attribute has finished initialising, then replaces the prototype method with a more
		// suitable one. That way, we save ourselves doing a bunch of tests on each call
		return function Attribute$update() {
			var name, element, node, type, updateMethod;
			name = this.name;
			element = this.element;
			node = this.node;
			if ( name === 'id' ) {
				updateMethod = updateIdAttribute;
			} else if ( name === 'value' ) {
				// special case - selects
				if ( element.name === 'select' && name === 'value' ) {
					updateMethod = node.multiple ? updateMultipleSelectValue : updateSelectValue;
				} else if ( element.name === 'textarea' ) {
					updateMethod = updateValue;
				} else if ( node.getAttribute( 'contenteditable' ) ) {
					updateMethod = updateContentEditableValue;
				} else if ( element.name === 'input' ) {
					type = element.getAttribute( 'type' );
					// type='file' value='{{fileList}}'>
					if ( type === 'file' ) {
						updateMethod = noop;
					} else if ( type === 'radio' && element.binding && element.binding.name === 'name' ) {
						updateMethod = updateRadioValue;
					} else {
						updateMethod = updateValue;
					}
				}
			} else if ( this.twoway && name === 'name' ) {
				if ( node.type === 'radio' ) {
					updateMethod = updateRadioName;
				} else if ( node.type === 'checkbox' ) {
					updateMethod = updateCheckboxName;
				}
			} else if ( name === 'style' && node.style.setAttribute ) {
				updateMethod = updateIEStyleAttribute;
			} else if ( name === 'class' && ( !node.namespaceURI || node.namespaceURI === namespaces.html ) ) {
				updateMethod = updateClassName;
			} else if ( this.useProperty ) {
				updateMethod = updateBoolean;
			}
			if ( !updateMethod ) {
				updateMethod = updateEverythingElse;
			}
			this.update = updateMethod;
			this.update();
		};
	}( namespaces, noop, virtualdom_items_Element_Attribute$update_updateSelectValue, virtualdom_items_Element_Attribute$update_updateMultipleSelectValue, virtualdom_items_Element_Attribute$update_updateRadioName, virtualdom_items_Element_Attribute$update_updateRadioValue, virtualdom_items_Element_Attribute$update_updateCheckboxName, virtualdom_items_Element_Attribute$update_updateClassName, virtualdom_items_Element_Attribute$update_updateIdAttribute, virtualdom_items_Element_Attribute$update_updateIEStyleAttribute, virtualdom_items_Element_Attribute$update_updateContentEditableValue, virtualdom_items_Element_Attribute$update_updateValue, virtualdom_items_Element_Attribute$update_updateBoolean, virtualdom_items_Element_Attribute$update_updateEverythingElse );

	/* virtualdom/items/Element/Attribute/_Attribute.js */
	var Attribute = function( bubble, init, rebind, render, toString, unbind, update ) {

		var Attribute = function( options ) {
			this.init( options );
		};
		Attribute.prototype = {
			bubble: bubble,
			init: init,
			rebind: rebind,
			render: render,
			toString: toString,
			unbind: unbind,
			update: update
		};
		return Attribute;
	}( virtualdom_items_Element_Attribute$bubble, virtualdom_items_Element_Attribute$init, virtualdom_items_Element_Attribute$rebind, virtualdom_items_Element_Attribute$render, virtualdom_items_Element_Attribute$toString, virtualdom_items_Element_Attribute$unbind, virtualdom_items_Element_Attribute$update );

	/* virtualdom/items/Element/prototype/init/createAttributes.js */
	var virtualdom_items_Element$init_createAttributes = function( Attribute ) {

		return function( element, attributes ) {
			var name, attribute, result = [];
			for ( name in attributes ) {
				if ( attributes.hasOwnProperty( name ) ) {
					attribute = new Attribute( {
						element: element,
						name: name,
						value: attributes[ name ],
						root: element.root
					} );
					result.push( result[ name ] = attribute );
				}
			}
			return result;
		};
	}( Attribute );

	/* utils/extend.js */
	var extend = function( target ) {
		var SLICE$0 = Array.prototype.slice;
		var sources = SLICE$0.call( arguments, 1 );
		var prop, source;
		while ( source = sources.shift() ) {
			for ( prop in source ) {
				if ( source.hasOwnProperty( prop ) ) {
					target[ prop ] = source[ prop ];
				}
			}
		}
		return target;
	};

	/* virtualdom/items/Element/Binding/Binding.js */
	var Binding = function( runloop, warn, create, extend, removeFromArray ) {

		var Binding = function( element ) {
			var interpolator, keypath, value;
			this.element = element;
			this.root = element.root;
			this.attribute = element.attributes[ this.name || 'value' ];
			interpolator = this.attribute.interpolator;
			interpolator.twowayBinding = this;
			if ( interpolator.keypath && interpolator.keypath.substr === '${' ) {
				warn( 'Two-way binding does not work with expressions: ' + interpolator.keypath );
				return false;
			}
			// A mustache may be *ambiguous*. Let's say we were given
			// `value="{{bar}}"`. If the context was `foo`, and `foo.bar`
			// *wasn't* `undefined`, the keypath would be `foo.bar`.
			// Then, any user input would result in `foo.bar` being updated.
			//
			// If, however, `foo.bar` *was* undefined, and so was `bar`, we would be
			// left with an unresolved partial keypath - so we are forced to make an
			// assumption. That assumption is that the input in question should
			// be forced to resolve to `bar`, and any user input would affect `bar`
			// and not `foo.bar`.
			//
			// Did that make any sense? No? Oh. Sorry. Well the moral of the story is
			// be explicit when using two-way data-binding about what keypath you're
			// updating. Using it in lists is probably a recipe for confusion...
			if ( !interpolator.keypath ) {
				if ( interpolator.ref ) {
					interpolator.resolve( interpolator.ref );
				}
				// If we have a reference expression resolver, we have to force
				// members to attach themselves to the root
				if ( interpolator.resolver ) {
					interpolator.resolver.forceResolution();
				}
			}
			this.keypath = keypath = interpolator.keypath;
			// initialise value, if it's undefined
			if ( this.root.viewmodel.get( keypath ) === undefined && this.getInitialValue ) {
				value = this.getInitialValue();
				if ( value !== undefined ) {
					this.root.viewmodel.set( keypath, value );
				}
			}
		};
		Binding.prototype = {
			handleChange: function() {
				var this$0 = this;
				runloop.start( this.root );
				this.attribute.locked = true;
				this.root.viewmodel.set( this.keypath, this.getValue() );
				runloop.scheduleTask( function() {
					return this$0.attribute.locked = false;
				} );
				runloop.end();
			},
			rebound: function() {
				var bindings, oldKeypath, newKeypath;
				oldKeypath = this.keypath;
				newKeypath = this.attribute.interpolator.keypath;
				// The attribute this binding is linked to has already done the work
				if ( oldKeypath === newKeypath ) {
					return;
				}
				removeFromArray( this.root._twowayBindings[ oldKeypath ], this );
				this.keypath = newKeypath;
				bindings = this.root._twowayBindings[ newKeypath ] || ( this.root._twowayBindings[ newKeypath ] = [] );
				bindings.push( this );
			},
			unbind: function() {}
		};
		Binding.extend = function( properties ) {
			var Parent = this,
				SpecialisedBinding;
			SpecialisedBinding = function( element ) {
				Binding.call( this, element );
				if ( this.init ) {
					this.init();
				}
			};
			SpecialisedBinding.prototype = create( Parent.prototype );
			extend( SpecialisedBinding.prototype, properties );
			SpecialisedBinding.extend = Binding.extend;
			return SpecialisedBinding;
		};
		return Binding;
	}( runloop, warn, create, extend, removeFromArray );

	/* virtualdom/items/Element/Binding/shared/handleDomEvent.js */
	var handleDomEvent = function handleChange() {
		this._ractive.binding.handleChange();
	};

	/* virtualdom/items/Element/Binding/ContentEditableBinding.js */
	var ContentEditableBinding = function( Binding, handleDomEvent ) {

		var ContentEditableBinding = Binding.extend( {
			getInitialValue: function() {
				return this.element.fragment ? this.element.fragment.toString() : '';
			},
			render: function() {
				var node = this.element.node;
				node.addEventListener( 'change', handleDomEvent, false );
				if ( !this.root.lazy ) {
					node.addEventListener( 'input', handleDomEvent, false );
					if ( node.attachEvent ) {
						node.addEventListener( 'keyup', handleDomEvent, false );
					}
				}
			},
			unrender: function() {
				var node = this.element.node;
				node.removeEventListener( 'change', handleDomEvent, false );
				node.removeEventListener( 'input', handleDomEvent, false );
				node.removeEventListener( 'keyup', handleDomEvent, false );
			},
			getValue: function() {
				return this.element.node.innerHTML;
			}
		} );
		return ContentEditableBinding;
	}( Binding, handleDomEvent );

	/* virtualdom/items/Element/Binding/shared/getSiblings.js */
	var getSiblings = function() {

		var sets = {};
		return function getSiblings( id, group, keypath ) {
			var hash = id + group + keypath;
			return sets[ hash ] || ( sets[ hash ] = [] );
		};
	}();

	/* virtualdom/items/Element/Binding/RadioBinding.js */
	var RadioBinding = function( runloop, removeFromArray, Binding, getSiblings, handleDomEvent ) {

		var RadioBinding = Binding.extend( {
			name: 'checked',
			init: function() {
				this.siblings = getSiblings( this.root._guid, 'radio', this.element.getAttribute( 'name' ) );
				this.siblings.push( this );
			},
			render: function() {
				var node = this.element.node;
				node.addEventListener( 'change', handleDomEvent, false );
				if ( node.attachEvent ) {
					node.addEventListener( 'click', handleDomEvent, false );
				}
			},
			unrender: function() {
				var node = this.element.node;
				node.removeEventListener( 'change', handleDomEvent, false );
				node.removeEventListener( 'click', handleDomEvent, false );
			},
			handleChange: function() {
				runloop.start( this.root );
				this.siblings.forEach( function( binding ) {
					binding.root.viewmodel.set( binding.keypath, binding.getValue() );
				} );
				runloop.end();
			},
			getValue: function() {
				return this.element.node.checked;
			},
			unbind: function() {
				removeFromArray( this.siblings, this );
			}
		} );
		return RadioBinding;
	}( runloop, removeFromArray, Binding, getSiblings, handleDomEvent );

	/* virtualdom/items/Element/Binding/RadioNameBinding.js */
	var RadioNameBinding = function( removeFromArray, Binding, handleDomEvent, getSiblings ) {

		var RadioNameBinding = Binding.extend( {
			name: 'name',
			init: function() {
				this.siblings = getSiblings( this.root._guid, 'radioname', this.keypath );
				this.siblings.push( this );
				this.radioName = true;
				// so that ractive.updateModel() knows what to do with this
				this.attribute.twoway = true;
			},
			getInitialValue: function() {
				if ( this.element.getAttribute( 'checked' ) ) {
					return this.element.getAttribute( 'value' );
				}
			},
			render: function() {
				var node = this.element.node;
				node.name = '{{' + this.keypath + '}}';
				node.checked = this.root.viewmodel.get( this.keypath ) == this.element.getAttribute( 'value' );
				node.addEventListener( 'change', handleDomEvent, false );
				if ( node.attachEvent ) {
					node.addEventListener( 'click', handleDomEvent, false );
				}
			},
			unrender: function() {
				var node = this.element.node;
				node.removeEventListener( 'change', handleDomEvent, false );
				node.removeEventListener( 'click', handleDomEvent, false );
			},
			getValue: function() {
				var node = this.element.node;
				return node._ractive ? node._ractive.value : node.value;
			},
			handleChange: function() {
				// If this <input> is the one that's checked, then the value of its
				// `name` keypath gets set to its value
				if ( this.element.node.checked ) {
					Binding.prototype.handleChange.call( this );
				}
			},
			rebound: function( indexRef, newIndex, oldKeypath, newKeypath ) {
				var node;
				Binding.prototype.rebound.call( this, indexRef, newIndex, oldKeypath, newKeypath );
				if ( node = this.element.node ) {
					node.name = '{{' + this.keypath + '}}';
				}
			},
			unbind: function() {
				removeFromArray( this.siblings, this );
			}
		} );
		return RadioNameBinding;
	}( removeFromArray, Binding, handleDomEvent, getSiblings );

	/* virtualdom/items/Element/Binding/CheckboxNameBinding.js */
	var CheckboxNameBinding = function( isArray, removeFromArray, Binding, getSiblings, handleDomEvent ) {

		var CheckboxNameBinding = Binding.extend( {
			name: 'name',
			getInitialValue: function() {
				// This only gets called once per group (of inputs that
				// share a name), because it only gets called if there
				// isn't an initial value. By the same token, we can make
				// a note of that fact that there was no initial value,
				// and populate it using any `checked` attributes that
				// exist (which users should avoid, but which we should
				// support anyway to avoid breaking expectations)
				this.noInitialValue = true;
				return [];
			},
			init: function() {
				var existingValue, bindingValue, noInitialValue;
				this.checkboxName = true;
				// so that ractive.updateModel() knows what to do with this
				// Each input has a reference to an array containing it and its
				// siblings, as two-way binding depends on being able to ascertain
				// the status of all inputs within the group
				this.siblings = getSiblings( this.root._guid, 'checkboxes', this.keypath );
				this.siblings.push( this );
				if ( this.noInitialValue ) {
					this.siblings.noInitialValue = true;
				}
				noInitialValue = this.siblings.noInitialValue;
				existingValue = this.root.viewmodel.get( this.keypath );
				bindingValue = this.element.getAttribute( 'value' );
				if ( noInitialValue ) {
					this.isChecked = this.element.getAttribute( 'checked' );
					if ( this.isChecked ) {
						existingValue.push( bindingValue );
					}
				} else {
					this.isChecked = isArray( existingValue ) ? existingValue.indexOf( bindingValue ) !== -1 : existingValue === bindingValue;
				}
			},
			unbind: function() {
				removeFromArray( this.siblings, this );
			},
			render: function() {
				var node = this.element.node;
				node.name = '{{' + this.keypath + '}}';
				node.checked = this.isChecked;
				node.addEventListener( 'change', handleDomEvent, false );
				// in case of IE emergency, bind to click event as well
				if ( node.attachEvent ) {
					node.addEventListener( 'click', handleDomEvent, false );
				}
			},
			unrender: function() {
				var node = this.element.node;
				node.removeEventListener( 'change', handleDomEvent, false );
				node.removeEventListener( 'click', handleDomEvent, false );
			},
			changed: function() {
				var wasChecked = !!this.isChecked;
				this.isChecked = this.element.node.checked;
				return this.isChecked === wasChecked;
			},
			handleChange: function() {
				this.isChecked = this.element.node.checked;
				Binding.prototype.handleChange.call( this );
			},
			getValue: function() {
				return this.siblings.filter( isChecked ).map( getValue );
			}
		} );

		function isChecked( binding ) {
			return binding.isChecked;
		}

		function getValue( binding ) {
			return binding.element.getAttribute( 'value' );
		}
		return CheckboxNameBinding;
	}( isArray, removeFromArray, Binding, getSiblings, handleDomEvent );

	/* virtualdom/items/Element/Binding/CheckboxBinding.js */
	var CheckboxBinding = function( Binding, handleDomEvent ) {

		var CheckboxBinding = Binding.extend( {
			name: 'checked',
			render: function() {
				var node = this.element.node;
				node.addEventListener( 'change', handleDomEvent, false );
				if ( node.attachEvent ) {
					node.addEventListener( 'click', handleDomEvent, false );
				}
			},
			unrender: function() {
				var node = this.element.node;
				node.removeEventListener( 'change', handleDomEvent, false );
				node.removeEventListener( 'click', handleDomEvent, false );
			},
			getValue: function() {
				return this.element.node.checked;
			}
		} );
		return CheckboxBinding;
	}( Binding, handleDomEvent );

	/* virtualdom/items/Element/Binding/SelectBinding.js */
	var SelectBinding = function( runloop, Binding, handleDomEvent ) {

		var SelectBinding = Binding.extend( {
			getInitialValue: function() {
				var options = this.element.options,
					len, i;
				i = len = options.length;
				if ( !len ) {
					return;
				}
				// take the final selected option...
				while ( i-- ) {
					if ( options[ i ].getAttribute( 'selected' ) ) {
						return options[ i ].getAttribute( 'value' );
					}
				}
				// or the first non-disabled option, if none are selected
				while ( ++i < len ) {
					if ( !options[ i ].getAttribute( 'disabled' ) ) {
						return options[ i ].getAttribute( 'value' );
					}
				}
			},
			render: function() {
				this.element.node.addEventListener( 'change', handleDomEvent, false );
			},
			unrender: function() {
				this.element.node.removeEventListener( 'change', handleDomEvent, false );
			},
			// TODO this method is an anomaly... is it necessary?
			setValue: function( value ) {
				runloop.addViewmodel( this.root.viewmodel );
				this.root.viewmodel.set( this.keypath, value );
			},
			getValue: function() {
				var options, i, len, option, optionValue;
				options = this.element.node.options;
				len = options.length;
				for ( i = 0; i < len; i += 1 ) {
					option = options[ i ];
					if ( options[ i ].selected ) {
						optionValue = option._ractive ? option._ractive.value : option.value;
						return optionValue;
					}
				}
			},
			forceUpdate: function() {
				var this$0 = this;
				var value = this.getValue();
				if ( value !== undefined ) {
					this.attribute.locked = true;
					runloop.addViewmodel( this.root.viewmodel );
					runloop.scheduleTask( function() {
						return this$0.attribute.locked = false;
					} );
					this.root.viewmodel.set( this.keypath, value );
				}
			}
		} );
		return SelectBinding;
	}( runloop, Binding, handleDomEvent );

	/* utils/arrayContentsMatch.js */
	var arrayContentsMatch = function( isArray ) {

		return function( a, b ) {
			var i;
			if ( !isArray( a ) || !isArray( b ) ) {
				return false;
			}
			if ( a.length !== b.length ) {
				return false;
			}
			i = a.length;
			while ( i-- ) {
				if ( a[ i ] !== b[ i ] ) {
					return false;
				}
			}
			return true;
		};
	}( isArray );

	/* virtualdom/items/Element/Binding/MultipleSelectBinding.js */
	var MultipleSelectBinding = function( runloop, arrayContentsMatch, SelectBinding, handleDomEvent ) {

		var MultipleSelectBinding = SelectBinding.extend( {
			getInitialValue: function() {
				return this.element.options.filter( function( option ) {
					return option.getAttribute( 'selected' );
				} ).map( function( option ) {
					return option.getAttribute( 'value' );
				} );
			},
			render: function() {
				var valueFromModel;
				this.element.node.addEventListener( 'change', handleDomEvent, false );
				valueFromModel = this.root.viewmodel.get( this.keypath );
				if ( valueFromModel === undefined ) {
					// get value from DOM, if possible
					this.handleChange();
				}
			},
			unrender: function() {
				this.element.node.removeEventListener( 'change', handleDomEvent, false );
			},
			setValue: function() {
				throw new Error( 'TODO not implemented yet' );
			},
			getValue: function() {
				var selectedValues, options, i, len, option, optionValue;
				selectedValues = [];
				options = this.element.node.options;
				len = options.length;
				for ( i = 0; i < len; i += 1 ) {
					option = options[ i ];
					if ( option.selected ) {
						optionValue = option._ractive ? option._ractive.value : option.value;
						selectedValues.push( optionValue );
					}
				}
				return selectedValues;
			},
			handleChange: function() {
				var attribute, previousValue, value;
				attribute = this.attribute;
				previousValue = attribute.value;
				value = this.getValue();
				if ( previousValue === undefined || !arrayContentsMatch( value, previousValue ) ) {
					SelectBinding.prototype.handleChange.call( this );
				}
				return this;
			},
			forceUpdate: function() {
				var this$0 = this;
				var value = this.getValue();
				if ( value !== undefined ) {
					this.attribute.locked = true;
					runloop.addViewmodel( this.root.viewmodel );
					runloop.scheduleTask( function() {
						return this$0.attribute.locked = false;
					} );
					this.root.viewmodel.set( this.keypath, value );
				}
			},
			updateModel: function() {
				if ( this.attribute.value === undefined || !this.attribute.value.length ) {
					this.root.viewmodel.set( this.keypath, this.initialValue );
				}
			}
		} );
		return MultipleSelectBinding;
	}( runloop, arrayContentsMatch, SelectBinding, handleDomEvent );

	/* virtualdom/items/Element/Binding/FileListBinding.js */
	var FileListBinding = function( Binding, handleDomEvent ) {

		var FileListBinding = Binding.extend( {
			render: function() {
				this.element.node.addEventListener( 'change', handleDomEvent, false );
			},
			unrender: function() {
				this.element.node.removeEventListener( 'change', handleDomEvent, false );
			},
			getValue: function() {
				return this.element.node.files;
			}
		} );
		return FileListBinding;
	}( Binding, handleDomEvent );

	/* virtualdom/items/Element/Binding/GenericBinding.js */
	var GenericBinding = function( Binding, handleDomEvent ) {

		var GenericBinding, getOptions;
		getOptions = {
			evaluateWrapped: true
		};
		GenericBinding = Binding.extend( {
			getInitialValue: function() {
				return '';
			},
			getValue: function() {
				return this.element.node.value;
			},
			render: function() {
				var node = this.element.node;
				node.addEventListener( 'change', handleDomEvent, false );
				if ( !this.root.lazy ) {
					node.addEventListener( 'input', handleDomEvent, false );
					if ( node.attachEvent ) {
						node.addEventListener( 'keyup', handleDomEvent, false );
					}
				}
				node.addEventListener( 'blur', handleBlur, false );
			},
			unrender: function() {
				var node = this.element.node;
				node.removeEventListener( 'change', handleDomEvent, false );
				node.removeEventListener( 'input', handleDomEvent, false );
				node.removeEventListener( 'keyup', handleDomEvent, false );
				node.removeEventListener( 'blur', handleBlur, false );
			}
		} );
		return GenericBinding;

		function handleBlur() {
			var value;
			handleDomEvent.call( this );
			value = this._ractive.root.viewmodel.get( this._ractive.binding.keypath, getOptions );
			this.value = value == undefined ? '' : value;
		}
	}( Binding, handleDomEvent );

	/* virtualdom/items/Element/Binding/NumericBinding.js */
	var NumericBinding = function( GenericBinding ) {

		return GenericBinding.extend( {
			getInitialValue: function() {
				return undefined;
			},
			getValue: function() {
				var value = parseFloat( this.element.node.value );
				return isNaN( value ) ? undefined : value;
			}
		} );
	}( GenericBinding );

	/* virtualdom/items/Element/prototype/init/createTwowayBinding.js */
	var virtualdom_items_Element$init_createTwowayBinding = function( log, ContentEditableBinding, RadioBinding, RadioNameBinding, CheckboxNameBinding, CheckboxBinding, SelectBinding, MultipleSelectBinding, FileListBinding, NumericBinding, GenericBinding ) {

		return function createTwowayBinding( element ) {
			var attributes = element.attributes,
				type, Binding, bindName, bindChecked;
			// if this is a late binding, and there's already one, it
			// needs to be torn down
			if ( element.binding ) {
				element.binding.teardown();
				element.binding = null;
			}
			// contenteditable
			if ( element.getAttribute( 'contenteditable' ) && isBindable( attributes.value ) ) {
				Binding = ContentEditableBinding;
			} else if ( element.name === 'input' ) {
				type = element.getAttribute( 'type' );
				if ( type === 'radio' || type === 'checkbox' ) {
					bindName = isBindable( attributes.name );
					bindChecked = isBindable( attributes.checked );
					// we can either bind the name attribute, or the checked attribute - not both
					if ( bindName && bindChecked ) {
						log.error( {
							message: 'badRadioInputBinding'
						} );
					}
					if ( bindName ) {
						Binding = type === 'radio' ? RadioNameBinding : CheckboxNameBinding;
					} else if ( bindChecked ) {
						Binding = type === 'radio' ? RadioBinding : CheckboxBinding;
					}
				} else if ( type === 'file' && isBindable( attributes.value ) ) {
					Binding = FileListBinding;
				} else if ( isBindable( attributes.value ) ) {
					Binding = type === 'number' || type === 'range' ? NumericBinding : GenericBinding;
				}
			} else if ( element.name === 'select' && isBindable( attributes.value ) ) {
				Binding = element.getAttribute( 'multiple' ) ? MultipleSelectBinding : SelectBinding;
			} else if ( element.name === 'textarea' && isBindable( attributes.value ) ) {
				Binding = GenericBinding;
			}
			if ( Binding ) {
				return new Binding( element );
			}
		};

		function isBindable( attribute ) {
			return attribute && attribute.isBindable;
		}
	}( log, ContentEditableBinding, RadioBinding, RadioNameBinding, CheckboxNameBinding, CheckboxBinding, SelectBinding, MultipleSelectBinding, FileListBinding, NumericBinding, GenericBinding );

	/* virtualdom/items/Element/EventHandler/prototype/fire.js */
	var virtualdom_items_Element_EventHandler$fire = function EventHandler$fire( event ) {
		this.root.fire( this.action.toString().trim(), event );
	};

	/* virtualdom/items/Element/EventHandler/prototype/init.js */
	var virtualdom_items_Element_EventHandler$init = function( circular ) {

		var Fragment, getValueOptions = {
			args: true
		};
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		return function EventHandler$init( element, name, template ) {
			var action;
			this.element = element;
			this.root = element.root;
			this.name = name;
			this.proxies = [];
			// Get action ('foo' in 'on-click='foo')
			action = template.n || template;
			if ( typeof action !== 'string' ) {
				action = new Fragment( {
					template: action,
					root: this.root,
					owner: this.element
				} );
			}
			this.action = action;
			// Get parameters
			if ( template.d ) {
				this.dynamicParams = new Fragment( {
					template: template.d,
					root: this.root,
					owner: this.element
				} );
				this.fire = fireEventWithDynamicParams;
			} else if ( template.a ) {
				this.params = template.a;
				this.fire = fireEventWithParams;
			}
		};

		function fireEventWithParams( event ) {
			this.root.fire.apply( this.root, [
				this.action.toString().trim(),
				event
			].concat( this.params ) );
		}

		function fireEventWithDynamicParams( event ) {
			var args = this.dynamicParams.getValue( getValueOptions );
			// need to strip [] from ends if a string!
			if ( typeof args === 'string' ) {
				args = args.substr( 1, args.length - 2 );
			}
			this.root.fire.apply( this.root, [
				this.action.toString().trim(),
				event
			].concat( args ) );
		}
	}( circular );

	/* virtualdom/items/Element/EventHandler/prototype/rebind.js */
	var virtualdom_items_Element_EventHandler$rebind = function EventHandler$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
		if ( typeof this.action !== 'string' ) {
			this.action.rebind( indexRef, newIndex, oldKeypath, newKeypath );
		}
		if ( this.dynamicParams ) {
			this.dynamicParams.rebind( indexRef, newIndex, oldKeypath, newKeypath );
		}
	};

	/* virtualdom/items/Element/EventHandler/shared/genericHandler.js */
	var genericHandler = function genericHandler( event ) {
		var storage, handler;
		storage = this._ractive;
		handler = storage.events[ event.type ];
		handler.fire( {
			node: this,
			original: event,
			index: storage.index,
			keypath: storage.keypath,
			context: storage.root.get( storage.keypath )
		} );
	};

	/* virtualdom/items/Element/EventHandler/prototype/render.js */
	var virtualdom_items_Element_EventHandler$render = function( warn, config, genericHandler ) {

		var customHandlers = {};
		return function EventHandler$render() {
			var name = this.name,
				definition;
			this.node = this.element.node;
			if ( definition = config.registries.events.find( this.root, name ) ) {
				this.custom = definition( this.node, getCustomHandler( name ) );
			} else {
				// Looks like we're dealing with a standard DOM event... but let's check
				if ( !( 'on' + name in this.node ) && !( window && 'on' + name in window ) ) {
					warn( 'Missing "' + this.name + '" event. You may need to download a plugin via http://docs.ractivejs.org/latest/plugins#events' );
				}
				this.node.addEventListener( name, genericHandler, false );
			}
			// store this on the node itself, so it can be retrieved by a
			// universal handler
			this.node._ractive.events[ name ] = this;
		};

		function getCustomHandler( name ) {
			if ( !customHandlers[ name ] ) {
				customHandlers[ name ] = function( event ) {
					var storage = event.node._ractive;
					event.index = storage.index;
					event.keypath = storage.keypath;
					event.context = storage.root.get( storage.keypath );
					storage.events[ name ].fire( event );
				};
			}
			return customHandlers[ name ];
		}
	}( warn, config, genericHandler );

	/* virtualdom/items/Element/EventHandler/prototype/teardown.js */
	var virtualdom_items_Element_EventHandler$teardown = function EventHandler$teardown() {
		// Tear down dynamic name
		if ( typeof this.action !== 'string' ) {
			this.action.teardown();
		}
		// Tear down dynamic parameters
		if ( this.dynamicParams ) {
			this.dynamicParams.teardown();
		}
	};

	/* virtualdom/items/Element/EventHandler/prototype/unrender.js */
	var virtualdom_items_Element_EventHandler$unrender = function( genericHandler ) {

		return function EventHandler$unrender() {
			if ( this.custom ) {
				this.custom.teardown();
			} else {
				this.node.removeEventListener( this.name, genericHandler, false );
			}
		};
	}( genericHandler );

	/* virtualdom/items/Element/EventHandler/_EventHandler.js */
	var EventHandler = function( fire, init, rebind, render, teardown, unrender ) {

		var EventHandler = function( element, name, template ) {
			this.init( element, name, template );
		};
		EventHandler.prototype = {
			fire: fire,
			init: init,
			rebind: rebind,
			render: render,
			teardown: teardown,
			unrender: unrender
		};
		return EventHandler;
	}( virtualdom_items_Element_EventHandler$fire, virtualdom_items_Element_EventHandler$init, virtualdom_items_Element_EventHandler$rebind, virtualdom_items_Element_EventHandler$render, virtualdom_items_Element_EventHandler$teardown, virtualdom_items_Element_EventHandler$unrender );

	/* virtualdom/items/Element/prototype/init/createEventHandlers.js */
	var virtualdom_items_Element$init_createEventHandlers = function( EventHandler ) {

		return function( element, template ) {
			var i, name, names, handler, result = [];
			for ( name in template ) {
				if ( template.hasOwnProperty( name ) ) {
					names = name.split( '-' );
					i = names.length;
					while ( i-- ) {
						handler = new EventHandler( element, names[ i ], template[ name ] );
						result.push( handler );
					}
				}
			}
			return result;
		};
	}( EventHandler );

	/* virtualdom/items/Element/Decorator/_Decorator.js */
	var Decorator = function( log, circular, config ) {

		var Fragment, getValueOptions, Decorator;
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		getValueOptions = {
			args: true
		};
		Decorator = function( element, template ) {
			var decorator = this,
				ractive, name, fragment;
			decorator.element = element;
			decorator.root = ractive = element.root;
			name = template.n || template;
			if ( typeof name !== 'string' ) {
				fragment = new Fragment( {
					template: name,
					root: ractive,
					owner: element
				} );
				name = fragment.toString();
				fragment.unbind();
			}
			if ( template.a ) {
				decorator.params = template.a;
			} else if ( template.d ) {
				decorator.fragment = new Fragment( {
					template: template.d,
					root: ractive,
					owner: element
				} );
				decorator.params = decorator.fragment.getValue( getValueOptions );
				decorator.fragment.bubble = function() {
					this.dirtyArgs = this.dirtyValue = true;
					decorator.params = this.getValue( getValueOptions );
					if ( decorator.ready ) {
						decorator.update();
					}
				};
			}
			decorator.fn = config.registries.decorators.find( ractive, name );
			if ( !decorator.fn ) {
				log.error( {
					debug: ractive.debug,
					message: 'missingPlugin',
					args: {
						plugin: 'decorator',
						name: name
					}
				} );
			}
		};
		Decorator.prototype = {
			init: function() {
				var decorator = this,
					node, result, args;
				node = decorator.element.node;
				if ( decorator.params ) {
					args = [ node ].concat( decorator.params );
					result = decorator.fn.apply( decorator.root, args );
				} else {
					result = decorator.fn.call( decorator.root, node );
				}
				if ( !result || !result.teardown ) {
					throw new Error( 'Decorator definition must return an object with a teardown method' );
				}
				// TODO does this make sense?
				decorator.actual = result;
				decorator.ready = true;
			},
			update: function() {
				if ( this.actual.update ) {
					this.actual.update.apply( this.root, this.params );
				} else {
					this.actual.teardown( true );
					this.init();
				}
			},
			teardown: function( updating ) {
				this.actual.teardown();
				if ( !updating && this.fragment ) {
					this.fragment.unbind();
				}
			}
		};
		return Decorator;
	}( log, circular, config );

	/* virtualdom/items/Element/special/select/sync.js */
	var sync = function( toArray ) {

		return function syncSelect( selectElement ) {
			var selectNode, selectValue, isMultiple, options, optionWasSelected;
			selectNode = selectElement.node;
			if ( !selectNode ) {
				return;
			}
			options = toArray( selectNode.options );
			selectValue = selectElement.getAttribute( 'value' );
			isMultiple = selectElement.getAttribute( 'multiple' );
			// If the <select> has a specified value, that should override
			// these options
			if ( selectValue !== undefined ) {
				options.forEach( function( o ) {
					var optionValue, shouldSelect;
					optionValue = o._ractive ? o._ractive.value : o.value;
					shouldSelect = isMultiple ? valueContains( selectValue, optionValue ) : selectValue == optionValue;
					if ( shouldSelect ) {
						optionWasSelected = true;
					}
					o.selected = shouldSelect;
				} );
				if ( !optionWasSelected ) {
					if ( options[ 0 ] ) {
						options[ 0 ].selected = true;
					}
					if ( selectElement.binding ) {
						selectElement.binding.forceUpdate();
					}
				}
			} else if ( selectElement.binding ) {
				selectElement.binding.forceUpdate();
			}
		};

		function valueContains( selectValue, optionValue ) {
			var i = selectValue.length;
			while ( i-- ) {
				if ( selectValue[ i ] == optionValue ) {
					return true;
				}
			}
		}
	}( toArray );

	/* virtualdom/items/Element/special/select/bubble.js */
	var bubble = function( runloop, syncSelect ) {

		return function bubbleSelect() {
			var this$0 = this;
			if ( !this.dirty ) {
				this.dirty = true;
				runloop.scheduleTask( function() {
					syncSelect( this$0 );
					this$0.dirty = false;
				} );
			}
			this.parentFragment.bubble();
		};
	}( runloop, sync );

	/* virtualdom/items/Element/special/option/findParentSelect.js */
	var findParentSelect = function findParentSelect( element ) {
		do {
			if ( element.name === 'select' ) {
				return element;
			}
		} while ( element = element.parent );
	};

	/* virtualdom/items/Element/special/option/init.js */
	var init = function( findParentSelect ) {

		return function initOption( option, template ) {
			option.select = findParentSelect( option.parent );
			option.select.options.push( option );
			// If the value attribute is missing, use the element's content
			if ( !template.a ) {
				template.a = {};
			}
			// ...as long as it isn't disabled
			if ( !template.a.value && !template.a.hasOwnProperty( 'disabled' ) ) {
				template.a.value = template.f;
			}
			// If there is a `selected` attribute, but the <select>
			// already has a value, delete it
			if ( 'selected' in template.a && option.select.getAttribute( 'value' ) !== undefined ) {
				delete template.a.selected;
			}
		};
	}( findParentSelect );

	/* virtualdom/items/Element/prototype/init.js */
	var virtualdom_items_Element$init = function( types, enforceCase, createAttributes, createTwowayBinding, createEventHandlers, Decorator, bubbleSelect, initOption, circular ) {

		var Fragment;
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		return function Element$init( options ) {
			var parentFragment, template, ractive, binding, bindings;
			this.type = types.ELEMENT;
			// stuff we'll need later
			parentFragment = this.parentFragment = options.parentFragment;
			template = this.template = options.template;
			this.parent = options.pElement || parentFragment.pElement;
			this.root = ractive = parentFragment.root;
			this.index = options.index;
			this.name = enforceCase( template.e );
			// Special case - <option> elements
			if ( this.name === 'option' ) {
				initOption( this, template );
			}
			// Special case - <select> elements
			if ( this.name === 'select' ) {
				this.options = [];
				this.bubble = bubbleSelect;
			}
			// create attributes
			this.attributes = createAttributes( this, template.a );
			// append children, if there are any
			if ( template.f ) {
				this.fragment = new Fragment( {
					template: template.f,
					root: ractive,
					owner: this,
					pElement: this
				} );
			}
			// create twoway binding
			if ( ractive.twoway && ( binding = createTwowayBinding( this, template.a ) ) ) {
				this.binding = binding;
				// register this with the root, so that we can do ractive.updateModel()
				bindings = this.root._twowayBindings[ binding.keypath ] || ( this.root._twowayBindings[ binding.keypath ] = [] );
				bindings.push( binding );
			}
			// create event proxies
			if ( template.v ) {
				this.eventHandlers = createEventHandlers( this, template.v );
			}
			// create decorator
			if ( template.o ) {
				this.decorator = new Decorator( this, template.o );
			}
			// create transitions
			this.intro = template.t0 || template.t1;
			this.outro = template.t0 || template.t2;
		};
	}( types, enforceCase, virtualdom_items_Element$init_createAttributes, virtualdom_items_Element$init_createTwowayBinding, virtualdom_items_Element$init_createEventHandlers, Decorator, bubble, init, circular );

	/* virtualdom/items/shared/utils/startsWith.js */
	var startsWith = function( startsWithKeypath ) {

		return function startsWith( target, keypath ) {
			return target === keypath || startsWithKeypath( target, keypath );
		};
	}( startsWithKeypath );

	/* virtualdom/items/shared/utils/assignNewKeypath.js */
	var assignNewKeypath = function( startsWith, getNewKeypath ) {

		return function assignNewKeypath( target, property, oldKeypath, newKeypath ) {
			var existingKeypath = target[ property ];
			if ( !existingKeypath || startsWith( existingKeypath, newKeypath ) || !startsWith( existingKeypath, oldKeypath ) ) {
				return;
			}
			target[ property ] = getNewKeypath( existingKeypath, oldKeypath, newKeypath );
		};
	}( startsWith, getNewKeypath );

	/* virtualdom/items/Element/prototype/rebind.js */
	var virtualdom_items_Element$rebind = function( assignNewKeypath ) {

		return function Element$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
			var i, storage, liveQueries, ractive;
			if ( this.attributes ) {
				this.attributes.forEach( rebind );
			}
			if ( this.eventHandlers ) {
				this.eventHandlers.forEach( rebind );
			}
			// rebind children
			if ( this.fragment ) {
				rebind( this.fragment );
			}
			// Update live queries, if necessary
			if ( liveQueries = this.liveQueries ) {
				ractive = this.root;
				i = liveQueries.length;
				while ( i-- ) {
					liveQueries[ i ]._makeDirty();
				}
			}
			if ( this.node && ( storage = this.node._ractive ) ) {
				// adjust keypath if needed
				assignNewKeypath( storage, 'keypath', oldKeypath, newKeypath );
				if ( indexRef != undefined ) {
					storage.index[ indexRef ] = newIndex;
				}
			}

			function rebind( thing ) {
				thing.rebind( indexRef, newIndex, oldKeypath, newKeypath );
			}
		};
	}( assignNewKeypath );

	/* virtualdom/items/Element/special/img/render.js */
	var render = function renderImage( img ) {
		var width, height, loadHandler;
		// if this is an <img>, and we're in a crap browser, we may need to prevent it
		// from overriding width and height when it loads the src
		if ( ( width = img.getAttribute( 'width' ) ) || ( height = img.getAttribute( 'height' ) ) ) {
			img.node.addEventListener( 'load', loadHandler = function() {
				if ( width ) {
					img.node.width = width.value;
				}
				if ( height ) {
					img.node.height = height.value;
				}
				img.node.removeEventListener( 'load', loadHandler, false );
			}, false );
		}
	};

	/* virtualdom/items/Element/Transition/prototype/init.js */
	var virtualdom_items_Element_Transition$init = function( log, config, circular ) {

		var Fragment, getValueOptions = {};
		// TODO what are the options?
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		return function Transition$init( element, template, isIntro ) {
			var t = this,
				ractive, name, fragment;
			t.element = element;
			t.root = ractive = element.root;
			t.isIntro = isIntro;
			name = template.n || template;
			if ( typeof name !== 'string' ) {
				fragment = new Fragment( {
					template: name,
					root: ractive,
					owner: element
				} );
				name = fragment.toString();
				fragment.unbind();
			}
			t.name = name;
			if ( template.a ) {
				t.params = template.a;
			} else if ( template.d ) {
				// TODO is there a way to interpret dynamic arguments without all the
				// 'dependency thrashing'?
				fragment = new Fragment( {
					template: template.d,
					root: ractive,
					owner: element
				} );
				t.params = fragment.getValue( getValueOptions );
				fragment.unbind();
			}
			t._fn = config.registries.transitions.find( ractive, name );
			if ( !t._fn ) {
				log.error( {
					debug: ractive.debug,
					message: 'missingPlugin',
					args: {
						plugin: 'transition',
						name: name
					}
				} );
				return;
			}
		};
	}( log, config, circular );

	/* utils/camelCase.js */
	var camelCase = function( hyphenatedStr ) {
		return hyphenatedStr.replace( /-([a-zA-Z])/g, function( match, $1 ) {
			return $1.toUpperCase();
		} );
	};

	/* virtualdom/items/Element/Transition/helpers/prefix.js */
	var prefix = function( isClient, vendors, createElement, camelCase ) {

		var prefix, prefixCache, testStyle;
		if ( !isClient ) {
			prefix = null;
		} else {
			prefixCache = {};
			testStyle = createElement( 'div' ).style;
			prefix = function( prop ) {
				var i, vendor, capped;
				prop = camelCase( prop );
				if ( !prefixCache[ prop ] ) {
					if ( testStyle[ prop ] !== undefined ) {
						prefixCache[ prop ] = prop;
					} else {
						// test vendors...
						capped = prop.charAt( 0 ).toUpperCase() + prop.substring( 1 );
						i = vendors.length;
						while ( i-- ) {
							vendor = vendors[ i ];
							if ( testStyle[ vendor + capped ] !== undefined ) {
								prefixCache[ prop ] = vendor + capped;
								break;
							}
						}
					}
				}
				return prefixCache[ prop ];
			};
		}
		return prefix;
	}( isClient, vendors, createElement, camelCase );

	/* virtualdom/items/Element/Transition/prototype/getStyle.js */
	var virtualdom_items_Element_Transition$getStyle = function( legacy, isClient, isArray, prefix ) {

		var getStyle, getComputedStyle;
		if ( !isClient ) {
			getStyle = null;
		} else {
			getComputedStyle = window.getComputedStyle || legacy.getComputedStyle;
			getStyle = function( props ) {
				var computedStyle, styles, i, prop, value;
				computedStyle = getComputedStyle( this.node );
				if ( typeof props === 'string' ) {
					value = computedStyle[ prefix( props ) ];
					if ( value === '0px' ) {
						value = 0;
					}
					return value;
				}
				if ( !isArray( props ) ) {
					throw new Error( 'Transition$getStyle must be passed a string, or an array of strings representing CSS properties' );
				}
				styles = {};
				i = props.length;
				while ( i-- ) {
					prop = props[ i ];
					value = computedStyle[ prefix( prop ) ];
					if ( value === '0px' ) {
						value = 0;
					}
					styles[ prop ] = value;
				}
				return styles;
			};
		}
		return getStyle;
	}( legacy, isClient, isArray, prefix );

	/* virtualdom/items/Element/Transition/prototype/setStyle.js */
	var virtualdom_items_Element_Transition$setStyle = function( prefix ) {

		return function( style, value ) {
			var prop;
			if ( typeof style === 'string' ) {
				this.node.style[ prefix( style ) ] = value;
			} else {
				for ( prop in style ) {
					if ( style.hasOwnProperty( prop ) ) {
						this.node.style[ prefix( prop ) ] = style[ prop ];
					}
				}
			}
			return this;
		};
	}( prefix );

	/* shared/Ticker.js */
	var Ticker = function( warn, getTime, animations ) {

		// TODO what happens if a transition is aborted?
		// TODO use this with Animation to dedupe some code?
		var Ticker = function( options ) {
			var easing;
			this.duration = options.duration;
			this.step = options.step;
			this.complete = options.complete;
			// easing
			if ( typeof options.easing === 'string' ) {
				easing = options.root.easing[ options.easing ];
				if ( !easing ) {
					warn( 'Missing easing function ("' + options.easing + '"). You may need to download a plugin from [TODO]' );
					easing = linear;
				}
			} else if ( typeof options.easing === 'function' ) {
				easing = options.easing;
			} else {
				easing = linear;
			}
			this.easing = easing;
			this.start = getTime();
			this.end = this.start + this.duration;
			this.running = true;
			animations.add( this );
		};
		Ticker.prototype = {
			tick: function( now ) {
				var elapsed, eased;
				if ( !this.running ) {
					return false;
				}
				if ( now > this.end ) {
					if ( this.step ) {
						this.step( 1 );
					}
					if ( this.complete ) {
						this.complete( 1 );
					}
					return false;
				}
				elapsed = now - this.start;
				eased = this.easing( elapsed / this.duration );
				if ( this.step ) {
					this.step( eased );
				}
				return true;
			},
			stop: function() {
				if ( this.abort ) {
					this.abort();
				}
				this.running = false;
			}
		};
		return Ticker;

		function linear( t ) {
			return t;
		}
	}( warn, getTime, animations );

	/* virtualdom/items/Element/Transition/helpers/unprefix.js */
	var unprefix = function( vendors ) {

		var unprefixPattern = new RegExp( '^-(?:' + vendors.join( '|' ) + ')-' );
		return function( prop ) {
			return prop.replace( unprefixPattern, '' );
		};
	}( vendors );

	/* virtualdom/items/Element/Transition/helpers/hyphenate.js */
	var hyphenate = function( vendors ) {

		var vendorPattern = new RegExp( '^(?:' + vendors.join( '|' ) + ')([A-Z])' );
		return function( str ) {
			var hyphenated;
			if ( !str ) {
				return '';
			}
			if ( vendorPattern.test( str ) ) {
				str = '-' + str;
			}
			hyphenated = str.replace( /[A-Z]/g, function( match ) {
				return '-' + match.toLowerCase();
			} );
			return hyphenated;
		};
	}( vendors );

	/* virtualdom/items/Element/Transition/prototype/animateStyle/createTransitions.js */
	var virtualdom_items_Element_Transition$animateStyle_createTransitions = function( isClient, warn, createElement, camelCase, interpolate, Ticker, prefix, unprefix, hyphenate ) {

		var createTransitions, testStyle, TRANSITION, TRANSITIONEND, CSS_TRANSITIONS_ENABLED, TRANSITION_DURATION, TRANSITION_PROPERTY, TRANSITION_TIMING_FUNCTION, canUseCssTransitions = {},
			cannotUseCssTransitions = {};
		if ( !isClient ) {
			createTransitions = null;
		} else {
			testStyle = createElement( 'div' ).style;
			// determine some facts about our environment
			( function() {
				if ( testStyle.transition !== undefined ) {
					TRANSITION = 'transition';
					TRANSITIONEND = 'transitionend';
					CSS_TRANSITIONS_ENABLED = true;
				} else if ( testStyle.webkitTransition !== undefined ) {
					TRANSITION = 'webkitTransition';
					TRANSITIONEND = 'webkitTransitionEnd';
					CSS_TRANSITIONS_ENABLED = true;
				} else {
					CSS_TRANSITIONS_ENABLED = false;
				}
			}() );
			if ( TRANSITION ) {
				TRANSITION_DURATION = TRANSITION + 'Duration';
				TRANSITION_PROPERTY = TRANSITION + 'Property';
				TRANSITION_TIMING_FUNCTION = TRANSITION + 'TimingFunction';
			}
			createTransitions = function( t, to, options, changedProperties, resolve ) {
				// Wait a beat (otherwise the target styles will be applied immediately)
				// TODO use a fastdom-style mechanism?
				setTimeout( function() {
					var hashPrefix, jsTransitionsComplete, cssTransitionsComplete, checkComplete, transitionEndHandler;
					checkComplete = function() {
						if ( jsTransitionsComplete && cssTransitionsComplete ) {
							t.root.fire( t.name + ':end', t.node, t.isIntro );
							resolve();
						}
					};
					// this is used to keep track of which elements can use CSS to animate
					// which properties
					hashPrefix = ( t.node.namespaceURI || '' ) + t.node.tagName;
					t.node.style[ TRANSITION_PROPERTY ] = changedProperties.map( prefix ).map( hyphenate ).join( ',' );
					t.node.style[ TRANSITION_TIMING_FUNCTION ] = hyphenate( options.easing || 'linear' );
					t.node.style[ TRANSITION_DURATION ] = options.duration / 1000 + 's';
					transitionEndHandler = function( event ) {
						var index;
						index = changedProperties.indexOf( camelCase( unprefix( event.propertyName ) ) );
						if ( index !== -1 ) {
							changedProperties.splice( index, 1 );
						}
						if ( changedProperties.length ) {
							// still transitioning...
							return;
						}
						t.node.removeEventListener( TRANSITIONEND, transitionEndHandler, false );
						cssTransitionsComplete = true;
						checkComplete();
					};
					t.node.addEventListener( TRANSITIONEND, transitionEndHandler, false );
					setTimeout( function() {
						var i = changedProperties.length,
							hash, originalValue, index, propertiesToTransitionInJs = [],
							prop, suffix;
						while ( i-- ) {
							prop = changedProperties[ i ];
							hash = hashPrefix + prop;
							if ( CSS_TRANSITIONS_ENABLED && !cannotUseCssTransitions[ hash ] ) {
								t.node.style[ prefix( prop ) ] = to[ prop ];
								// If we're not sure if CSS transitions are supported for
								// this tag/property combo, find out now
								if ( !canUseCssTransitions[ hash ] ) {
									originalValue = t.getStyle( prop );
									// if this property is transitionable in this browser,
									// the current style will be different from the target style
									canUseCssTransitions[ hash ] = t.getStyle( prop ) != to[ prop ];
									cannotUseCssTransitions[ hash ] = !canUseCssTransitions[ hash ];
									// Reset, if we're going to use timers after all
									if ( cannotUseCssTransitions[ hash ] ) {
										t.node.style[ prefix( prop ) ] = originalValue;
									}
								}
							}
							if ( !CSS_TRANSITIONS_ENABLED || cannotUseCssTransitions[ hash ] ) {
								// we need to fall back to timer-based stuff
								if ( originalValue === undefined ) {
									originalValue = t.getStyle( prop );
								}
								// need to remove this from changedProperties, otherwise transitionEndHandler
								// will get confused
								index = changedProperties.indexOf( prop );
								if ( index === -1 ) {
									warn( 'Something very strange happened with transitions. If you see this message, please let @RactiveJS know. Thanks!' );
								} else {
									changedProperties.splice( index, 1 );
								}
								// TODO Determine whether this property is animatable at all
								suffix = /[^\d]*$/.exec( to[ prop ] )[ 0 ];
								// ...then kick off a timer-based transition
								propertiesToTransitionInJs.push( {
									name: prefix( prop ),
									interpolator: interpolate( parseFloat( originalValue ), parseFloat( to[ prop ] ) ),
									suffix: suffix
								} );
							}
						}
						// javascript transitions
						if ( propertiesToTransitionInJs.length ) {
							new Ticker( {
								root: t.root,
								duration: options.duration,
								easing: camelCase( options.easing || '' ),
								step: function( pos ) {
									var prop, i;
									i = propertiesToTransitionInJs.length;
									while ( i-- ) {
										prop = propertiesToTransitionInJs[ i ];
										t.node.style[ prop.name ] = prop.interpolator( pos ) + prop.suffix;
									}
								},
								complete: function() {
									jsTransitionsComplete = true;
									checkComplete();
								}
							} );
						} else {
							jsTransitionsComplete = true;
						}
						if ( !changedProperties.length ) {
							// We need to cancel the transitionEndHandler, and deal with
							// the fact that it will never fire
							t.node.removeEventListener( TRANSITIONEND, transitionEndHandler, false );
							cssTransitionsComplete = true;
							checkComplete();
						}
					}, 0 );
				}, options.delay || 0 );
			};
		}
		return createTransitions;
	}( isClient, warn, createElement, camelCase, interpolate, Ticker, prefix, unprefix, hyphenate );

	/* virtualdom/items/Element/Transition/prototype/animateStyle/visibility.js */
	var virtualdom_items_Element_Transition$animateStyle_visibility = function( vendors ) {

		var hidden, vendor, prefix, i, visibility;
		if ( typeof document !== 'undefined' ) {
			hidden = 'hidden';
			visibility = {};
			if ( hidden in document ) {
				prefix = '';
			} else {
				i = vendors.length;
				while ( i-- ) {
					vendor = vendors[ i ];
					hidden = vendor + 'Hidden';
					if ( hidden in document ) {
						prefix = vendor;
					}
				}
			}
			if ( prefix !== undefined ) {
				document.addEventListener( prefix + 'visibilitychange', onChange );
				// initialise
				onChange();
			} else {
				// gah, we're in an old browser
				if ( 'onfocusout' in document ) {
					document.addEventListener( 'focusout', onHide );
					document.addEventListener( 'focusin', onShow );
				} else {
					window.addEventListener( 'pagehide', onHide );
					window.addEventListener( 'blur', onHide );
					window.addEventListener( 'pageshow', onShow );
					window.addEventListener( 'focus', onShow );
				}
				visibility.hidden = false;
			}
		}

		function onChange() {
			visibility.hidden = document[ hidden ];
		}

		function onHide() {
			visibility.hidden = true;
		}

		function onShow() {
			visibility.hidden = false;
		}
		return visibility;
	}( vendors );

	/* virtualdom/items/Element/Transition/prototype/animateStyle/_animateStyle.js */
	var virtualdom_items_Element_Transition$animateStyle__animateStyle = function( legacy, isClient, warn, Promise, prefix, createTransitions, visibility ) {

		var animateStyle, getComputedStyle, resolved;
		if ( !isClient ) {
			animateStyle = null;
		} else {
			getComputedStyle = window.getComputedStyle || legacy.getComputedStyle;
			animateStyle = function( style, value, options, complete ) {
				var t = this,
					to;
				// Special case - page isn't visible. Don't animate anything, because
				// that way you'll never get CSS transitionend events
				if ( visibility.hidden ) {
					this.setStyle( style, value );
					return resolved || ( resolved = Promise.resolve() );
				}
				if ( typeof style === 'string' ) {
					to = {};
					to[ style ] = value;
				} else {
					to = style;
					// shuffle arguments
					complete = options;
					options = value;
				}
				// As of 0.3.9, transition authors should supply an `option` object with
				// `duration` and `easing` properties (and optional `delay`), plus a
				// callback function that gets called after the animation completes
				// TODO remove this check in a future version
				if ( !options ) {
					warn( 'The "' + t.name + '" transition does not supply an options object to `t.animateStyle()`. This will break in a future version of Ractive. For more info see https://github.com/RactiveJS/Ractive/issues/340' );
					options = t;
					complete = t.complete;
				}
				var promise = new Promise( function( resolve ) {
					var propertyNames, changedProperties, computedStyle, current, from, i, prop;
					// Edge case - if duration is zero, set style synchronously and complete
					if ( !options.duration ) {
						t.setStyle( to );
						resolve();
						return;
					}
					// Get a list of the properties we're animating
					propertyNames = Object.keys( to );
					changedProperties = [];
					// Store the current styles
					computedStyle = getComputedStyle( t.node );
					from = {};
					i = propertyNames.length;
					while ( i-- ) {
						prop = propertyNames[ i ];
						current = computedStyle[ prefix( prop ) ];
						if ( current === '0px' ) {
							current = 0;
						}
						// we need to know if we're actually changing anything
						if ( current != to[ prop ] ) {
							// use != instead of !==, so we can compare strings with numbers
							changedProperties.push( prop );
							// make the computed style explicit, so we can animate where
							// e.g. height='auto'
							t.node.style[ prefix( prop ) ] = current;
						}
					}
					// If we're not actually changing anything, the transitionend event
					// will never fire! So we complete early
					if ( !changedProperties.length ) {
						resolve();
						return;
					}
					createTransitions( t, to, options, changedProperties, resolve );
				} );
				// If a callback was supplied, do the honours
				// TODO remove this check in future
				if ( complete ) {
					warn( 't.animateStyle returns a Promise as of 0.4.0. Transition authors should do t.animateStyle(...).then(callback)' );
					promise.then( complete );
				}
				return promise;
			};
		}
		return animateStyle;
	}( legacy, isClient, warn, Promise, prefix, virtualdom_items_Element_Transition$animateStyle_createTransitions, virtualdom_items_Element_Transition$animateStyle_visibility );

	/* utils/fillGaps.js */
	var fillGaps = function( target, source ) {
		var key;
		for ( key in source ) {
			if ( source.hasOwnProperty( key ) && !( key in target ) ) {
				target[ key ] = source[ key ];
			}
		}
		return target;
	};

	/* virtualdom/items/Element/Transition/prototype/processParams.js */
	var virtualdom_items_Element_Transition$processParams = function( fillGaps ) {

		return function( params, defaults ) {
			if ( typeof params === 'number' ) {
				params = {
					duration: params
				};
			} else if ( typeof params === 'string' ) {
				if ( params === 'slow' ) {
					params = {
						duration: 600
					};
				} else if ( params === 'fast' ) {
					params = {
						duration: 200
					};
				} else {
					params = {
						duration: 400
					};
				}
			} else if ( !params ) {
				params = {};
			}
			return fillGaps( params, defaults );
		};
	}( fillGaps );

	/* virtualdom/items/Element/Transition/prototype/start.js */
	var virtualdom_items_Element_Transition$start = function() {

		return function Transition$start() {
			var t = this,
				node, originalStyle;
			node = t.node = t.element.node;
			originalStyle = node.getAttribute( 'style' );
			// create t.complete() - we don't want this on the prototype,
			// because we don't want `this` silliness when passing it as
			// an argument
			t.complete = function( noReset ) {
				if ( !noReset && t.isIntro ) {
					resetStyle( node, originalStyle );
				}
				node._ractive.transition = null;
				t._manager.remove( t );
			};
			// If the transition function doesn't exist, abort
			if ( !t._fn ) {
				t.complete();
				return;
			}
			t._fn.apply( t.root, [ t ].concat( t.params ) );
		};

		function resetStyle( node, style ) {
			if ( style ) {
				node.setAttribute( 'style', style );
			} else {
				// Next line is necessary, to remove empty style attribute!
				// See http://stackoverflow.com/a/7167553
				node.getAttribute( 'style' );
				node.removeAttribute( 'style' );
			}
		}
	}();

	/* virtualdom/items/Element/Transition/_Transition.js */
	var Transition = function( init, getStyle, setStyle, animateStyle, processParams, start, circular ) {

		var Fragment, Transition;
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		Transition = function( owner, template, isIntro ) {
			this.init( owner, template, isIntro );
		};
		Transition.prototype = {
			init: init,
			start: start,
			getStyle: getStyle,
			setStyle: setStyle,
			animateStyle: animateStyle,
			processParams: processParams
		};
		return Transition;
	}( virtualdom_items_Element_Transition$init, virtualdom_items_Element_Transition$getStyle, virtualdom_items_Element_Transition$setStyle, virtualdom_items_Element_Transition$animateStyle__animateStyle, virtualdom_items_Element_Transition$processParams, virtualdom_items_Element_Transition$start, circular );

	/* virtualdom/items/Element/prototype/render.js */
	var virtualdom_items_Element$render = function( namespaces, isArray, warn, create, createElement, defineProperty, noop, runloop, getInnerContext, renderImage, Transition ) {

		var updateCss, updateScript;
		updateCss = function() {
			var node = this.node,
				content = this.fragment.toString( false );
			if ( node.styleSheet ) {
				node.styleSheet.cssText = content;
			} else {
				while ( node.hasChildNodes() ) {
					node.removeChild( node.firstChild );
				}
				node.appendChild( document.createTextNode( content ) );
			}
		};
		updateScript = function() {
			if ( !this.node.type || this.node.type === 'text/javascript' ) {
				warn( 'Script tag was updated. This does not cause the code to be re-evaluated!' );
			}
			this.node.text = this.fragment.toString( false );
		};
		return function Element$render() {
			var this$0 = this;
			var root = this.root,
				namespace, node;
			namespace = getNamespace( this );
			node = this.node = createElement( this.name, namespace );
			// Is this a top-level node of a component? If so, we may need to add
			// a data-rvcguid attribute, for CSS encapsulation
			// NOTE: css no longer copied to instance, so we check constructor.css -
			// we can enhance to handle instance, but this is more "correct" with current
			// functionality
			if ( root.constructor.css && this.parentFragment.getNode() === root.el ) {
				this.node.setAttribute( 'data-rvcguid', root.constructor._guid );
			}
			// Add _ractive property to the node - we use this object to store stuff
			// related to proxy events, two-way bindings etc
			defineProperty( this.node, '_ractive', {
				value: {
					proxy: this,
					keypath: getInnerContext( this.parentFragment ),
					index: this.parentFragment.indexRefs,
					events: create( null ),
					root: root
				}
			} );
			// Render attributes
			this.attributes.forEach( function( a ) {
				return a.render( node );
			} );
			// Render children
			if ( this.fragment ) {
				// Special case - <script> element
				if ( this.name === 'script' ) {
					this.bubble = updateScript;
					this.node.text = this.fragment.toString( false );
					// bypass warning initially
					this.fragment.unrender = noop;
				} else if ( this.name === 'style' ) {
					this.bubble = updateCss;
					this.bubble();
					this.fragment.unrender = noop;
				} else if ( this.binding && this.getAttribute( 'contenteditable' ) ) {
					this.fragment.unrender = noop;
				} else {
					this.node.appendChild( this.fragment.render() );
				}
			}
			// Add proxy event handlers
			if ( this.eventHandlers ) {
				this.eventHandlers.forEach( function( h ) {
					return h.render();
				} );
			}
			// deal with two-way bindings
			if ( this.binding ) {
				this.binding.render();
				this.node._ractive.binding = this.binding;
			}
			// Special case: if this is an <img>, and we're in a crap browser, we may
			// need to prevent it from overriding width and height when it loads the src
			if ( this.name === 'img' ) {
				renderImage( this );
			}
			// apply decorator(s)
			if ( this.decorator && this.decorator.fn ) {
				runloop.scheduleTask( function() {
					this$0.decorator.init();
				} );
			}
			// trigger intro transition
			if ( root.transitionsEnabled && this.intro ) {
				var transition = new Transition( this, this.intro, true );
				runloop.registerTransition( transition );
				runloop.scheduleTask( function() {
					return transition.start();
				} );
			}
			if ( this.name === 'option' ) {
				processOption( this );
			}
			if ( this.node.autofocus ) {
				// Special case. Some browsers (*cough* Firefix *cough*) have a problem
				// with dynamically-generated elements having autofocus, and they won't
				// allow you to programmatically focus the element until it's in the DOM
				runloop.scheduleTask( function() {
					return this$0.node.focus();
				} );
			}
			updateLiveQueries( this );
			return this.node;
		};

		function getNamespace( element ) {
			var namespace, xmlns, parent;
			// Use specified namespace...
			if ( xmlns = element.getAttribute( 'xmlns' ) ) {
				namespace = xmlns;
			} else if ( element.name === 'svg' ) {
				namespace = namespaces.svg;
			} else if ( parent = element.parent ) {
				// ...or HTML, if the parent is a <foreignObject>
				if ( parent.name === 'foreignObject' ) {
					namespace = namespaces.html;
				} else {
					namespace = parent.node.namespaceURI;
				}
			} else {
				namespace = element.root.el.namespaceURI;
			}
			return namespace;
		}

		function processOption( option ) {
			var optionValue, selectValue, i;
			selectValue = option.select.getAttribute( 'value' );
			if ( selectValue === undefined ) {
				return;
			}
			optionValue = option.getAttribute( 'value' );
			if ( option.select.node.multiple && isArray( selectValue ) ) {
				i = selectValue.length;
				while ( i-- ) {
					if ( optionValue == selectValue[ i ] ) {
						option.node.selected = true;
						break;
					}
				}
			} else {
				option.node.selected = optionValue == selectValue;
			}
		}

		function updateLiveQueries( element ) {
			var instance, liveQueries, i, selector, query;
			// Does this need to be added to any live queries?
			instance = element.root;
			do {
				liveQueries = instance._liveQueries;
				i = liveQueries.length;
				while ( i-- ) {
					selector = liveQueries[ i ];
					query = liveQueries[ '_' + selector ];
					if ( query._test( element ) ) {
						// keep register of applicable selectors, for when we teardown
						( element.liveQueries || ( element.liveQueries = [] ) ).push( query );
					}
				}
			} while ( instance = instance._parent );
		}
	}( namespaces, isArray, warn, create, createElement, defineProperty, noop, runloop, getInnerContext, render, Transition );

	/* virtualdom/items/Element/prototype/toString.js */
	var virtualdom_items_Element$toString = function( voidElementNames, isArray ) {

		return function() {
			var str, escape;
			str = '<' + ( this.template.y ? '!DOCTYPE' : this.template.e );
			str += this.attributes.map( stringifyAttribute ).join( '' );
			// Special case - selected options
			if ( this.name === 'option' && optionIsSelected( this ) ) {
				str += ' selected';
			}
			// Special case - two-way radio name bindings
			if ( this.name === 'input' && inputIsCheckedRadio( this ) ) {
				str += ' checked';
			}
			str += '>';
			if ( this.fragment ) {
				escape = this.name !== 'script' && this.name !== 'style';
				str += this.fragment.toString( escape );
			}
			// add a closing tag if this isn't a void element
			if ( !voidElementNames.test( this.template.e ) ) {
				str += '</' + this.template.e + '>';
			}
			return str;
		};

		function optionIsSelected( element ) {
			var optionValue, selectValue, i;
			optionValue = element.getAttribute( 'value' );
			if ( optionValue === undefined ) {
				return false;
			}
			selectValue = element.select.getAttribute( 'value' );
			if ( selectValue == optionValue ) {
				return true;
			}
			if ( element.select.getAttribute( 'multiple' ) && isArray( selectValue ) ) {
				i = selectValue.length;
				while ( i-- ) {
					if ( selectValue[ i ] == optionValue ) {
						return true;
					}
				}
			}
		}

		function inputIsCheckedRadio( element ) {
			var attributes, typeAttribute, valueAttribute, nameAttribute;
			attributes = element.attributes;
			typeAttribute = attributes.type;
			valueAttribute = attributes.value;
			nameAttribute = attributes.name;
			if ( !typeAttribute || typeAttribute.value !== 'radio' || !valueAttribute || !nameAttribute.interpolator ) {
				return;
			}
			if ( valueAttribute.value === nameAttribute.interpolator.value ) {
				return true;
			}
		}

		function stringifyAttribute( attribute ) {
			var str = attribute.toString();
			return str ? ' ' + str : '';
		}
	}( voidElementNames, isArray );

	/* virtualdom/items/Element/special/option/unbind.js */
	var virtualdom_items_Element_special_option_unbind = function( removeFromArray ) {

		return function unbindOption( option ) {
			removeFromArray( option.select.options, option );
		};
	}( removeFromArray );

	/* virtualdom/items/Element/prototype/unbind.js */
	var virtualdom_items_Element$unbind = function( unbindOption ) {

		return function Element$unbind() {
			if ( this.fragment ) {
				this.fragment.unbind();
			}
			if ( this.binding ) {
				this.binding.unbind();
			}
			// Special case - <option>
			if ( this.name === 'option' ) {
				unbindOption( this );
			}
			this.attributes.forEach( unbindAttribute );
		};

		function unbindAttribute( attribute ) {
			attribute.unbind();
		}
	}( virtualdom_items_Element_special_option_unbind );

	/* virtualdom/items/Element/prototype/unrender.js */
	var virtualdom_items_Element$unrender = function( runloop, Transition ) {

		return function Element$unrender( shouldDestroy ) {
			var binding, bindings;
			// Detach as soon as we can
			if ( this.name === 'option' ) {
				// <option> elements detach immediately, so that
				// their parent <select> element syncs correctly, and
				// since option elements can't have transitions anyway
				this.detach();
			} else if ( shouldDestroy ) {
				runloop.detachWhenReady( this );
			}
			// Children first. that way, any transitions on child elements will be
			// handled by the current transitionManager
			if ( this.fragment ) {
				this.fragment.unrender( false );
			}
			if ( binding = this.binding ) {
				this.binding.unrender();
				this.node._ractive.binding = null;
				bindings = this.root._twowayBindings[ binding.keypath ];
				bindings.splice( bindings.indexOf( binding ), 1 );
			}
			// Remove event handlers
			if ( this.eventHandlers ) {
				this.eventHandlers.forEach( function( h ) {
					return h.unrender();
				} );
			}
			if ( this.decorator ) {
				this.decorator.teardown();
			}
			// trigger outro transition if necessary
			if ( this.root.transitionsEnabled && this.outro ) {
				var transition = new Transition( this, this.outro, false );
				runloop.registerTransition( transition );
				runloop.scheduleTask( function() {
					return transition.start();
				} );
			}
			// Remove this node from any live queries
			if ( this.liveQueries ) {
				removeFromLiveQueries( this );
			}
		};

		function removeFromLiveQueries( element ) {
			var query, selector, i;
			i = element.liveQueries.length;
			while ( i-- ) {
				query = element.liveQueries[ i ];
				selector = query.selector;
				query._remove( element.node );
			}
		}
	}( runloop, Transition );

	/* virtualdom/items/Element/_Element.js */
	var Element = function( bubble, detach, find, findAll, findAllComponents, findComponent, findNextNode, firstNode, getAttribute, init, rebind, render, toString, unbind, unrender ) {

		var Element = function( options ) {
			this.init( options );
		};
		Element.prototype = {
			bubble: bubble,
			detach: detach,
			find: find,
			findAll: findAll,
			findAllComponents: findAllComponents,
			findComponent: findComponent,
			findNextNode: findNextNode,
			firstNode: firstNode,
			getAttribute: getAttribute,
			init: init,
			rebind: rebind,
			render: render,
			toString: toString,
			unbind: unbind,
			unrender: unrender
		};
		return Element;
	}( virtualdom_items_Element$bubble, virtualdom_items_Element$detach, virtualdom_items_Element$find, virtualdom_items_Element$findAll, virtualdom_items_Element$findAllComponents, virtualdom_items_Element$findComponent, virtualdom_items_Element$findNextNode, virtualdom_items_Element$firstNode, virtualdom_items_Element$getAttribute, virtualdom_items_Element$init, virtualdom_items_Element$rebind, virtualdom_items_Element$render, virtualdom_items_Element$toString, virtualdom_items_Element$unbind, virtualdom_items_Element$unrender );

	/* virtualdom/items/Partial/deIndent.js */
	var deIndent = function() {

		var empty = /^\s*$/,
			leadingWhitespace = /^\s*/;
		return function( str ) {
			var lines, firstLine, lastLine, minIndent;
			lines = str.split( '\n' );
			// remove first and last line, if they only contain whitespace
			firstLine = lines[ 0 ];
			if ( firstLine !== undefined && empty.test( firstLine ) ) {
				lines.shift();
			}
			lastLine = lines[ lines.length - 1 ];
			if ( lastLine !== undefined && empty.test( lastLine ) ) {
				lines.pop();
			}
			minIndent = lines.reduce( reducer, null );
			if ( minIndent ) {
				str = lines.map( function( line ) {
					return line.replace( minIndent, '' );
				} ).join( '\n' );
			}
			return str;
		};

		function reducer( previous, line ) {
			var lineIndent = leadingWhitespace.exec( line )[ 0 ];
			if ( previous === null || lineIndent.length < previous.length ) {
				return lineIndent;
			}
			return previous;
		}
	}();

	/* virtualdom/items/Partial/getPartialDescriptor.js */
	var getPartialDescriptor = function( log, config, parser, deIndent ) {

		return function getPartialDescriptor( ractive, name ) {
			var partial;
			// If the partial in instance or view heirarchy instances, great
			if ( partial = getPartialFromRegistry( ractive, name ) ) {
				return partial;
			}
			// Does it exist on the page as a script tag?
			partial = parser.fromId( name, {
				noThrow: true
			} );
			if ( partial ) {
				// is this necessary?
				partial = deIndent( partial );
				// parse and register to this ractive instance
				var parsed = parser.parse( partial, parser.getParseOptions( ractive ) );
				// register (and return main partial if there are others in the template)
				return ractive.partials[ name ] = parsed.t;
			}
			log.error( {
				debug: ractive.debug,
				message: 'noTemplateForPartial',
				args: {
					name: name
				}
			} );
			// No match? Return an empty array
			return [];
		};

		function getPartialFromRegistry( ractive, name ) {
			var partials = config.registries.partials;
			// find first instance in the ractive or view hierarchy that has this partial
			var instance = partials.findInstance( ractive, name );
			if ( !instance ) {
				return;
			}
			var partial = instance.partials[ name ],
				fn;
			// partial is a function?
			if ( typeof partial === 'function' ) {
				fn = partial.bind( instance );
				fn.isOwner = instance.partials.hasOwnProperty( name );
				partial = fn( instance.data, parser );
			}
			if ( !partial ) {
				log.warn( {
					debug: ractive.debug,
					message: 'noRegistryFunctionReturn',
					args: {
						registry: 'partial',
						name: name
					}
				} );
				return;
			}
			// If this was added manually to the registry,
			// but hasn't been parsed, parse it now
			if ( !parser.isParsed( partial ) ) {
				// use the parseOptions of the ractive instance on which it was found
				var parsed = parser.parse( partial, parser.getParseOptions( instance ) );
				// Partials cannot contain nested partials!
				// TODO add a test for this
				if ( parsed.p ) {
					log.warn( {
						debug: ractive.debug,
						message: 'noNestedPartials',
						args: {
							rname: name
						}
					} );
				}
				// if fn, use instance to store result, otherwise needs to go
				// in the correct point in prototype chain on instance or constructor
				var target = fn ? instance : partials.findOwner( instance, name );
				// may be a template with partials, which need to be registered and main template extracted
				target.partials[ name ] = partial = parsed.t;
			}
			// store for reset
			if ( fn ) {
				partial._fn = fn;
			}
			return partial.v ? partial.t : partial;
		}
	}( log, config, parser, deIndent );

	/* virtualdom/items/Partial/applyIndent.js */
	var applyIndent = function( string, indent ) {
		var indented;
		if ( !indent ) {
			return string;
		}
		indented = string.split( '\n' ).map( function( line, notFirstLine ) {
			return notFirstLine ? indent + line : line;
		} ).join( '\n' );
		return indented;
	};

	/* virtualdom/items/Partial/_Partial.js */
	var Partial = function( types, getPartialDescriptor, applyIndent, circular ) {

		var Partial, Fragment;
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		Partial = function( options ) {
			var parentFragment = this.parentFragment = options.parentFragment,
				template;
			this.type = types.PARTIAL;
			this.name = options.template.r;
			this.index = options.index;
			this.root = parentFragment.root;
			if ( !options.template.r ) {
				// TODO support dynamic partial switching
				throw new Error( 'Partials must have a static reference (no expressions). This may change in a future version of Ractive.' );
			}
			template = getPartialDescriptor( parentFragment.root, options.template.r );
			this.fragment = new Fragment( {
				template: template,
				root: parentFragment.root,
				owner: this,
				pElement: parentFragment.pElement
			} );
		};
		Partial.prototype = {
			bubble: function() {
				this.parentFragment.bubble();
			},
			firstNode: function() {
				return this.fragment.firstNode();
			},
			findNextNode: function() {
				return this.parentFragment.findNextNode( this );
			},
			detach: function() {
				return this.fragment.detach();
			},
			render: function() {
				return this.fragment.render();
			},
			unrender: function( shouldDestroy ) {
				this.fragment.unrender( shouldDestroy );
			},
			rebind: function( indexRef, newIndex, oldKeypath, newKeypath ) {
				return this.fragment.rebind( indexRef, newIndex, oldKeypath, newKeypath );
			},
			unbind: function() {
				this.fragment.unbind();
			},
			toString: function( toString ) {
				var string, previousItem, lastLine, match;
				string = this.fragment.toString( toString );
				previousItem = this.parentFragment.items[ this.index - 1 ];
				if ( !previousItem || previousItem.type !== types.TEXT ) {
					return string;
				}
				lastLine = previousItem.template.split( '\n' ).pop();
				if ( match = /^\s+$/.exec( lastLine ) ) {
					return applyIndent( string, match[ 0 ] );
				}
				return string;
			},
			find: function( selector ) {
				return this.fragment.find( selector );
			},
			findAll: function( selector, query ) {
				return this.fragment.findAll( selector, query );
			},
			findComponent: function( selector ) {
				return this.fragment.findComponent( selector );
			},
			findAllComponents: function( selector, query ) {
				return this.fragment.findAllComponents( selector, query );
			},
			getValue: function() {
				return this.fragment.getValue();
			}
		};
		return Partial;
	}( types, getPartialDescriptor, applyIndent, circular );

	/* virtualdom/items/Component/getComponent.js */
	var getComponent = function( config, log, circular ) {

		var Ractive;
		circular.push( function() {
			Ractive = circular.Ractive;
		} );
		// finds the component constructor in the registry or view hierarchy registries
		return function getComponent( ractive, name ) {
			var component, instance = config.registries.components.findInstance( ractive, name );
			if ( instance ) {
				component = instance.components[ name ];
				// best test we have for not Ractive.extend
				if ( !component._parent ) {
					// function option, execute and store for reset
					var fn = component.bind( instance );
					fn.isOwner = instance.components.hasOwnProperty( name );
					component = fn( instance.data );
					if ( !component ) {
						log.warn( {
							debug: ractive.debug,
							message: 'noRegistryFunctionReturn',
							args: {
								registry: 'component',
								name: name
							}
						} );
						return;
					}
					if ( typeof component === 'string' ) {
						//allow string lookup
						component = getComponent( ractive, component );
					}
					component._fn = fn;
					instance.components[ name ] = component;
				}
			}
			return component;
		};
	}( config, log, circular );

	/* virtualdom/items/Component/prototype/detach.js */
	var virtualdom_items_Component$detach = function Component$detach() {
		return this.instance.fragment.detach();
	};

	/* virtualdom/items/Component/prototype/find.js */
	var virtualdom_items_Component$find = function Component$find( selector ) {
		return this.instance.fragment.find( selector );
	};

	/* virtualdom/items/Component/prototype/findAll.js */
	var virtualdom_items_Component$findAll = function Component$findAll( selector, query ) {
		return this.instance.fragment.findAll( selector, query );
	};

	/* virtualdom/items/Component/prototype/findAllComponents.js */
	var virtualdom_items_Component$findAllComponents = function Component$findAllComponents( selector, query ) {
		query._test( this, true );
		if ( this.instance.fragment ) {
			this.instance.fragment.findAllComponents( selector, query );
		}
	};

	/* virtualdom/items/Component/prototype/findComponent.js */
	var virtualdom_items_Component$findComponent = function Component$findComponent( selector ) {
		if ( !selector || selector === this.name ) {
			return this.instance;
		}
		if ( this.instance.fragment ) {
			return this.instance.fragment.findComponent( selector );
		}
		return null;
	};

	/* virtualdom/items/Component/prototype/findNextNode.js */
	var virtualdom_items_Component$findNextNode = function Component$findNextNode() {
		return this.parentFragment.findNextNode( this );
	};

	/* virtualdom/items/Component/prototype/firstNode.js */
	var virtualdom_items_Component$firstNode = function Component$firstNode() {
		if ( this.rendered ) {
			return this.instance.fragment.firstNode();
		}
		return null;
	};

	/* virtualdom/items/Component/initialise/createModel/ComponentParameter.js */
	var ComponentParameter = function( runloop, circular ) {

		var Fragment, ComponentParameter;
		circular.push( function() {
			Fragment = circular.Fragment;
		} );
		ComponentParameter = function( component, key, value ) {
			this.parentFragment = component.parentFragment;
			this.component = component;
			this.key = key;
			this.fragment = new Fragment( {
				template: value,
				root: component.root,
				owner: this
			} );
			this.value = this.fragment.getValue();
		};
		ComponentParameter.prototype = {
			bubble: function() {
				if ( !this.dirty ) {
					this.dirty = true;
					runloop.addView( this );
				}
			},
			update: function() {
				var value = this.fragment.getValue();
				this.component.instance.viewmodel.set( this.key, value );
				runloop.addViewmodel( this.component.instance.viewmodel );
				this.value = value;
				this.dirty = false;
			},
			rebind: function( indexRef, newIndex, oldKeypath, newKeypath ) {
				this.fragment.rebind( indexRef, newIndex, oldKeypath, newKeypath );
			},
			unbind: function() {
				this.fragment.unbind();
			}
		};
		return ComponentParameter;
	}( runloop, circular );

	/* virtualdom/items/Component/initialise/createModel/_createModel.js */
	var createModel = function( types, parseJSON, resolveRef, ComponentParameter ) {

		return function( component, defaultData, attributes, toBind ) {
			var data = {},
				key, value;
			// some parameters, e.g. foo="The value is {{bar}}", are 'complex' - in
			// other words, we need to construct a string fragment to watch
			// when they change. We store these so they can be torn down later
			component.complexParameters = [];
			for ( key in attributes ) {
				if ( attributes.hasOwnProperty( key ) ) {
					value = getValue( component, key, attributes[ key ], toBind );
					if ( value !== undefined || defaultData[ key ] === undefined ) {
						data[ key ] = value;
					}
				}
			}
			return data;
		};

		function getValue( component, key, template, toBind ) {
			var parameter, parsed, parentInstance, parentFragment, keypath, indexRef;
			parentInstance = component.root;
			parentFragment = component.parentFragment;
			// If this is a static value, great
			if ( typeof template === 'string' ) {
				parsed = parseJSON( template );
				if ( !parsed ) {
					return template;
				}
				return parsed.value;
			}
			// If null, we treat it as a boolean attribute (i.e. true)
			if ( template === null ) {
				return true;
			}
			// If a regular interpolator, we bind to it
			if ( template.length === 1 && template[ 0 ].t === types.INTERPOLATOR && template[ 0 ].r ) {
				// Is it an index reference?
				if ( parentFragment.indexRefs && parentFragment.indexRefs[ indexRef = template[ 0 ].r ] !== undefined ) {
					component.indexRefBindings[ indexRef ] = key;
					return parentFragment.indexRefs[ indexRef ];
				}
				// TODO what about references that resolve late? Should these be considered?
				keypath = resolveRef( parentInstance, template[ 0 ].r, parentFragment ) || template[ 0 ].r;
				// We need to set up bindings between parent and child, but
				// we can't do it yet because the child instance doesn't exist
				// yet - so we make a note instead
				toBind.push( {
					childKeypath: key,
					parentKeypath: keypath
				} );
				return parentInstance.viewmodel.get( keypath );
			}
			// We have a 'complex parameter' - we need to create a full-blown string
			// fragment in order to evaluate and observe its value
			parameter = new ComponentParameter( component, key, template );
			component.complexParameters.push( parameter );
			return parameter.value;
		}
	}( types, parseJSON, resolveRef, ComponentParameter );

	/* virtualdom/items/Component/initialise/createInstance.js */
	var createInstance = function( component, Component, data, contentDescriptor ) {
		var instance, parentFragment, partials, root;
		parentFragment = component.parentFragment;
		root = component.root;
		// Make contents available as a {{>content}} partial
		partials = {
			content: contentDescriptor || []
		};
		instance = new Component( {
			append: true,
			data: data,
			partials: partials,
			magic: root.magic || Component.defaults.magic,
			modifyArrays: root.modifyArrays,
			_parent: root,
			_component: component,
			// need to inherit runtime parent adaptors
			adapt: root.adapt
		} );
		return instance;
	};

	/* virtualdom/items/Component/initialise/createBindings.js */
	var createBindings = function( createComponentBinding ) {

		return function createInitialComponentBindings( component, toBind ) {
			toBind.forEach( function createInitialComponentBinding( pair ) {
				var childValue, parentValue;
				createComponentBinding( component, component.root, pair.parentKeypath, pair.childKeypath );
				childValue = component.instance.viewmodel.get( pair.childKeypath );
				parentValue = component.root.viewmodel.get( pair.parentKeypath );
				if ( childValue !== undefined && parentValue === undefined ) {
					component.root.viewmodel.set( pair.parentKeypath, childValue );
				}
			} );
		};
	}( createComponentBinding );

	/* virtualdom/items/Component/initialise/propagateEvents.js */
	var propagateEvents = function( log ) {

		// TODO how should event arguments be handled? e.g.
		// <widget on-foo='bar:1,2,3'/>
		// The event 'bar' will be fired on the parent instance
		// when 'foo' fires on the child, but the 1,2,3 arguments
		// will be lost
		return function( component, eventsDescriptor ) {
			var eventName;
			for ( eventName in eventsDescriptor ) {
				if ( eventsDescriptor.hasOwnProperty( eventName ) ) {
					propagateEvent( component.instance, component.root, eventName, eventsDescriptor[ eventName ] );
				}
			}
		};

		function propagateEvent( childInstance, parentInstance, eventName, proxyEventName ) {
			if ( typeof proxyEventName !== 'string' ) {
				log.error( {
					debug: parentInstance.debug,
					message: 'noComponentEventArguments'
				} );
			}
			childInstance.on( eventName, function() {
				var args = Array.prototype.slice.call( arguments );
				args.unshift( proxyEventName );
				parentInstance.fire.apply( parentInstance, args );
			} );
		}
	}( log );

	/* virtualdom/items/Component/initialise/updateLiveQueries.js */
	var updateLiveQueries = function( component ) {
		var ancestor, query;
		// If there's a live query for this component type, add it
		ancestor = component.root;
		while ( ancestor ) {
			if ( query = ancestor._liveComponentQueries[ '_' + component.name ] ) {
				query.push( component.instance );
			}
			ancestor = ancestor._parent;
		}
	};

	/* virtualdom/items/Component/prototype/init.js */
	var virtualdom_items_Component$init = function( types, warn, createModel, createInstance, createBindings, propagateEvents, updateLiveQueries ) {

		return function Component$init( options, Component ) {
			var parentFragment, root, data, toBind;
			parentFragment = this.parentFragment = options.parentFragment;
			root = parentFragment.root;
			this.root = root;
			this.type = types.COMPONENT;
			this.name = options.template.e;
			this.index = options.index;
			this.indexRefBindings = {};
			this.bindings = [];
			if ( !Component ) {
				throw new Error( 'Component "' + this.name + '" not found' );
			}
			// First, we need to create a model for the component - e.g. if we
			// encounter <widget foo='bar'/> then we need to create a widget
			// with `data: { foo: 'bar' }`.
			//
			// This may involve setting up some bindings, but we can't do it
			// yet so we take some notes instead
			toBind = [];
			data = createModel( this, Component.defaults.data || {}, options.template.a, toBind );
			createInstance( this, Component, data, options.template.f );
			createBindings( this, toBind );
			propagateEvents( this, options.template.v );
			// intro, outro and decorator directives have no effect
			if ( options.template.t1 || options.template.t2 || options.template.o ) {
				warn( 'The "intro", "outro" and "decorator" directives have no effect on components' );
			}
			updateLiveQueries( this );
		};
	}( types, warn, createModel, createInstance, createBindings, propagateEvents, updateLiveQueries );

	/* virtualdom/items/Component/prototype/rebind.js */
	var virtualdom_items_Component$rebind = function( runloop, getNewKeypath ) {

		return function Component$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
			var childInstance = this.instance,
				parentInstance = childInstance._parent,
				indexRefAlias, query;
			this.bindings.forEach( function( binding ) {
				var updated;
				if ( binding.root !== parentInstance ) {
					return;
				}
				if ( updated = getNewKeypath( binding.keypath, oldKeypath, newKeypath ) ) {
					binding.rebind( updated );
				}
			} );
			this.complexParameters.forEach( function( parameter ) {
				parameter.rebind( indexRef, newIndex, oldKeypath, newKeypath );
			} );
			if ( indexRefAlias = this.indexRefBindings[ indexRef ] ) {
				runloop.addViewmodel( childInstance.viewmodel );
				childInstance.viewmodel.set( indexRefAlias, newIndex );
			}
			if ( query = this.root._liveComponentQueries[ '_' + this.name ] ) {
				query._makeDirty();
			}
		};
	}( runloop, getNewKeypath );

	/* virtualdom/items/Component/prototype/render.js */
	var virtualdom_items_Component$render = function Component$render() {
		var instance = this.instance;
		instance.render( this.parentFragment.getNode() );
		this.rendered = true;
		return instance.detach();
	};

	/* virtualdom/items/Component/prototype/toString.js */
	var virtualdom_items_Component$toString = function Component$toString() {
		return this.instance.fragment.toString();
	};

	/* virtualdom/items/Component/prototype/unbind.js */
	var virtualdom_items_Component$unbind = function() {

		return function Component$unbind() {
			this.complexParameters.forEach( unbind );
			this.bindings.forEach( unbind );
			removeFromLiveComponentQueries( this );
			this.instance.fragment.unbind();
		};

		function unbind( thing ) {
			thing.unbind();
		}

		function removeFromLiveComponentQueries( component ) {
			var instance, query;
			instance = component.root;
			do {
				if ( query = instance._liveComponentQueries[ '_' + component.name ] ) {
					query._remove( component );
				}
			} while ( instance = instance._parent );
		}
	}();

	/* virtualdom/items/Component/prototype/unrender.js */
	var virtualdom_items_Component$unrender = function Component$unrender( shouldDestroy ) {
		this.instance.fire( 'teardown' );
		this.shouldDestroy = shouldDestroy;
		this.instance.unrender();
	};

	/* virtualdom/items/Component/_Component.js */
	var Component = function( detach, find, findAll, findAllComponents, findComponent, findNextNode, firstNode, init, rebind, render, toString, unbind, unrender ) {

		var Component = function( options, Constructor ) {
			this.init( options, Constructor );
		};
		Component.prototype = {
			detach: detach,
			find: find,
			findAll: findAll,
			findAllComponents: findAllComponents,
			findComponent: findComponent,
			findNextNode: findNextNode,
			firstNode: firstNode,
			init: init,
			rebind: rebind,
			render: render,
			toString: toString,
			unbind: unbind,
			unrender: unrender
		};
		return Component;
	}( virtualdom_items_Component$detach, virtualdom_items_Component$find, virtualdom_items_Component$findAll, virtualdom_items_Component$findAllComponents, virtualdom_items_Component$findComponent, virtualdom_items_Component$findNextNode, virtualdom_items_Component$firstNode, virtualdom_items_Component$init, virtualdom_items_Component$rebind, virtualdom_items_Component$render, virtualdom_items_Component$toString, virtualdom_items_Component$unbind, virtualdom_items_Component$unrender );

	/* virtualdom/items/Comment.js */
	var Comment = function( types, detach ) {

		var Comment = function( options ) {
			this.type = types.COMMENT;
			this.value = options.template.c;
		};
		Comment.prototype = {
			detach: detach,
			firstNode: function() {
				return this.node;
			},
			render: function() {
				if ( !this.node ) {
					this.node = document.createComment( this.value );
				}
				return this.node;
			},
			toString: function() {
				return '<!--' + this.value + '-->';
			},
			unrender: function( shouldDestroy ) {
				if ( shouldDestroy ) {
					this.node.parentNode.removeChild( this.node );
				}
			}
		};
		return Comment;
	}( types, detach );

	/* virtualdom/Fragment/prototype/init/createItem.js */
	var virtualdom_Fragment$init_createItem = function( types, Text, Interpolator, Section, Triple, Element, Partial, getComponent, Component, Comment ) {

		return function createItem( options ) {
			if ( typeof options.template === 'string' ) {
				return new Text( options );
			}
			switch ( options.template.t ) {
				case types.INTERPOLATOR:
					return new Interpolator( options );
				case types.SECTION:
					return new Section( options );
				case types.TRIPLE:
					return new Triple( options );
				case types.ELEMENT:
					var constructor;
					if ( constructor = getComponent( options.parentFragment.root, options.template.e ) ) {
						return new Component( options, constructor );
					}
					return new Element( options );
				case types.PARTIAL:
					return new Partial( options );
				case types.COMMENT:
					return new Comment( options );
				default:
					throw new Error( 'Something very strange happened. Please file an issue at https://github.com/ractivejs/ractive/issues. Thanks!' );
			}
		};
	}( types, Text, Interpolator, Section, Triple, Element, Partial, getComponent, Component, Comment );

	/* virtualdom/Fragment/prototype/init.js */
	var virtualdom_Fragment$init = function( types, create, createItem ) {

		return function Fragment$init( options ) {
			var this$0 = this;
			var parentFragment, parentRefs, ref;
			// The item that owns this fragment - an element, section, partial, or attribute
			this.owner = options.owner;
			parentFragment = this.parent = this.owner.parentFragment;
			// inherited properties
			this.root = options.root;
			this.pElement = options.pElement;
			this.context = options.context;
			// If parent item is a section, this may not be the only fragment
			// that belongs to it - we need to make a note of the index
			if ( this.owner.type === types.SECTION ) {
				this.index = options.index;
			}
			// index references (the 'i' in {{#section:i}}...{{/section}}) need to cascade
			// down the tree
			if ( parentFragment ) {
				parentRefs = parentFragment.indexRefs;
				if ( parentRefs ) {
					this.indexRefs = create( null );
					// avoids need for hasOwnProperty
					for ( ref in parentRefs ) {
						this.indexRefs[ ref ] = parentRefs[ ref ];
					}
				}
			}
			// inherit priority
			this.priority = parentFragment ? parentFragment.priority + 1 : 1;
			if ( options.indexRef ) {
				if ( !this.indexRefs ) {
					this.indexRefs = {};
				}
				this.indexRefs[ options.indexRef ] = options.index;
			}
			// Time to create this fragment's child items
			// TEMP should this be happening?
			if ( typeof options.template === 'string' ) {
				options.template = [ options.template ];
			} else if ( !options.template ) {
				options.template = [];
			}
			this.items = options.template.map( function( template, i ) {
				return createItem( {
					parentFragment: this$0,
					pElement: options.pElement,
					template: template,
					index: i
				} );
			} );
			this.value = this.argsList = null;
			this.dirtyArgs = this.dirtyValue = true;
			this.inited = true;
		};
	}( types, create, virtualdom_Fragment$init_createItem );

	/* virtualdom/Fragment/prototype/rebind.js */
	var virtualdom_Fragment$rebind = function( assignNewKeypath ) {

		return function Fragment$rebind( indexRef, newIndex, oldKeypath, newKeypath ) {
			// assign new context keypath if needed
			assignNewKeypath( this, 'context', oldKeypath, newKeypath );
			if ( this.indexRefs && this.indexRefs[ indexRef ] !== undefined ) {
				this.indexRefs[ indexRef ] = newIndex;
			}
			this.items.forEach( function( item ) {
				if ( item.rebind ) {
					item.rebind( indexRef, newIndex, oldKeypath, newKeypath );
				}
			} );
		};
	}( assignNewKeypath );

	/* virtualdom/Fragment/prototype/render.js */
	var virtualdom_Fragment$render = function Fragment$render() {
		var result;
		if ( this.items.length === 1 ) {
			result = this.items[ 0 ].render();
		} else {
			result = document.createDocumentFragment();
			this.items.forEach( function( item ) {
				result.appendChild( item.render() );
			} );
		}
		this.rendered = true;
		return result;
	};

	/* virtualdom/Fragment/prototype/toString.js */
	var virtualdom_Fragment$toString = function Fragment$toString( escape ) {
		if ( !this.items ) {
			return '';
		}
		return this.items.map( function( item ) {
			return item.toString( escape );
		} ).join( '' );
	};

	/* virtualdom/Fragment/prototype/unbind.js */
	var virtualdom_Fragment$unbind = function() {

		return function Fragment$unbind() {
			this.items.forEach( unbindItem );
		};

		function unbindItem( item ) {
			if ( item.unbind ) {
				item.unbind();
			}
		}
	}();

	/* virtualdom/Fragment/prototype/unrender.js */
	var virtualdom_Fragment$unrender = function Fragment$unrender( shouldDestroy ) {
		if ( !this.rendered ) {
			throw new Error( 'Attempted to unrender a fragment that was not rendered' );
		}
		this.items.forEach( function( i ) {
			return i.unrender( shouldDestroy );
		} );
	};

	/* virtualdom/Fragment.js */
	var Fragment = function( bubble, detach, find, findAll, findAllComponents, findComponent, findNextNode, firstNode, getNode, getValue, init, rebind, render, toString, unbind, unrender, circular ) {

		var Fragment = function( options ) {
			this.init( options );
		};
		Fragment.prototype = {
			bubble: bubble,
			detach: detach,
			find: find,
			findAll: findAll,
			findAllComponents: findAllComponents,
			findComponent: findComponent,
			findNextNode: findNextNode,
			firstNode: firstNode,
			getNode: getNode,
			getValue: getValue,
			init: init,
			rebind: rebind,
			render: render,
			toString: toString,
			unbind: unbind,
			unrender: unrender
		};
		circular.Fragment = Fragment;
		return Fragment;
	}( virtualdom_Fragment$bubble, virtualdom_Fragment$detach, virtualdom_Fragment$find, virtualdom_Fragment$findAll, virtualdom_Fragment$findAllComponents, virtualdom_Fragment$findComponent, virtualdom_Fragment$findNextNode, virtualdom_Fragment$firstNode, virtualdom_Fragment$getNode, virtualdom_Fragment$getValue, virtualdom_Fragment$init, virtualdom_Fragment$rebind, virtualdom_Fragment$render, virtualdom_Fragment$toString, virtualdom_Fragment$unbind, virtualdom_Fragment$unrender, circular );

	/* Ractive/prototype/reset.js */
	var Ractive$reset = function( runloop, Fragment, config ) {

		var shouldRerender = [
			'template',
			'partials',
			'components',
			'decorators',
			'events'
		];
		return function Ractive$reset( data, callback ) {
			var promise, wrapper, changes, i, rerender;
			if ( typeof data === 'function' && !callback ) {
				callback = data;
				data = {};
			} else {
				data = data || {};
			}
			if ( typeof data !== 'object' ) {
				throw new Error( 'The reset method takes either no arguments, or an object containing new data' );
			}
			// If the root object is wrapped, try and use the wrapper's reset value
			if ( ( wrapper = this.viewmodel.wrapped[ '' ] ) && wrapper.reset ) {
				if ( wrapper.reset( data ) === false ) {
					// reset was rejected, we need to replace the object
					this.data = data;
				}
			} else {
				this.data = data;
			}
			// reset config items and track if need to rerender
			changes = config.reset( this );
			i = changes.length;
			while ( i-- ) {
				if ( shouldRerender.indexOf( changes[ i ] ) > -1 ) {
					rerender = true;
					break;
				}
			}
			if ( rerender ) {
				var component;
				this.viewmodel.mark( '' );
				// Is this is a component, we need to set the `shouldDestroy`
				// flag, otherwise it will assume by default that a parent node
				// will be detached, and therefore it doesn't need to bother
				// detaching its own nodes
				if ( component = this.component ) {
					component.shouldDestroy = true;
				}
				this.unrender();
				if ( component ) {
					component.shouldDestroy = false;
				}
				// If the template changed, we need to destroy the parallel DOM
				// TODO if we're here, presumably it did?
				if ( this.fragment.template !== this.template ) {
					this.fragment.unbind();
					this.fragment = new Fragment( {
						template: this.template,
						root: this,
						owner: this
					} );
				}
				promise = this.render( this.el, this.anchor );
			} else {
				promise = runloop.start( this, true );
				this.viewmodel.mark( '' );
				runloop.end();
			}
			this.fire( 'reset', data );
			if ( callback ) {
				promise.then( callback );
			}
			return promise;
		};
	}( runloop, Fragment, config );

	/* Ractive/prototype/resetTemplate.js */
	var Ractive$resetTemplate = function( config, Fragment ) {

		// TODO should resetTemplate be asynchronous? i.e. should it be a case
		// of outro, update template, intro? I reckon probably not, since that
		// could be achieved with unrender-resetTemplate-render. Also, it should
		// conceptually be similar to resetPartial, which couldn't be async
		return function Ractive$resetTemplate( template ) {
			var transitionsEnabled, component;
			config.template.init( null, this, {
				template: template
			} );
			transitionsEnabled = this.transitionsEnabled;
			this.transitionsEnabled = false;
			// Is this is a component, we need to set the `shouldDestroy`
			// flag, otherwise it will assume by default that a parent node
			// will be detached, and therefore it doesn't need to bother
			// detaching its own nodes
			if ( component = this.component ) {
				component.shouldDestroy = true;
			}
			this.unrender();
			if ( component ) {
				component.shouldDestroy = false;
			}
			// remove existing fragment and create new one
			this.fragment.unbind();
			this.fragment = new Fragment( {
				template: this.template,
				root: this,
				owner: this
			} );
			this.render( this.el, this.anchor );
			this.transitionsEnabled = transitionsEnabled;
		};
	}( config, Fragment );

	/* Ractive/prototype/reverse.js */
	var Ractive$reverse = function( makeArrayMethod ) {

		return makeArrayMethod( 'reverse' );
	}( Ractive$shared_makeArrayMethod );

	/* Ractive/prototype/set.js */
	var Ractive$set = function( runloop, isObject, normaliseKeypath, getMatchingKeypaths ) {

		var wildcard = /\*/;
		return function Ractive$set( keypath, value, callback ) {
			var this$0 = this;
			var map, promise;
			promise = runloop.start( this, true );
			// Set multiple keypaths in one go
			if ( isObject( keypath ) ) {
				map = keypath;
				callback = value;
				for ( keypath in map ) {
					if ( map.hasOwnProperty( keypath ) ) {
						value = map[ keypath ];
						keypath = normaliseKeypath( keypath );
						this.viewmodel.set( keypath, value );
					}
				}
			} else {
				keypath = normaliseKeypath( keypath );
				if ( wildcard.test( keypath ) ) {
					getMatchingKeypaths( this, keypath ).forEach( function( keypath ) {
						this$0.viewmodel.set( keypath, value );
					} );
				} else {
					this.viewmodel.set( keypath, value );
				}
			}
			runloop.end();
			if ( callback ) {
				promise.then( callback.bind( this ) );
			}
			return promise;
		};
	}( runloop, isObject, normaliseKeypath, getMatchingKeypaths );

	/* Ractive/prototype/shift.js */
	var Ractive$shift = function( makeArrayMethod ) {

		return makeArrayMethod( 'shift' );
	}( Ractive$shared_makeArrayMethod );

	/* Ractive/prototype/sort.js */
	var Ractive$sort = function( makeArrayMethod ) {

		return makeArrayMethod( 'sort' );
	}( Ractive$shared_makeArrayMethod );

	/* Ractive/prototype/splice.js */
	var Ractive$splice = function( makeArrayMethod ) {

		return makeArrayMethod( 'splice' );
	}( Ractive$shared_makeArrayMethod );

	/* Ractive/prototype/subtract.js */
	var Ractive$subtract = function( add ) {

		return function Ractive$subtract( keypath, d ) {
			return add( this, keypath, d === undefined ? -1 : -d );
		};
	}( Ractive$shared_add );

	/* Ractive/prototype/teardown.js */
	var Ractive$teardown = function( Promise ) {

		// Teardown. This goes through the root fragment and all its children, removing observers
		// and generally cleaning up after itself
		return function Ractive$teardown( callback ) {
			var promise;
			this.fire( 'teardown' );
			this.fragment.unbind();
			this.viewmodel.teardown();
			promise = this.rendered ? this.unrender() : Promise.resolve();
			if ( callback ) {
				// TODO deprecate this?
				promise.then( callback.bind( this ) );
			}
			return promise;
		};
	}( Promise );

	/* Ractive/prototype/toggle.js */
	var Ractive$toggle = function( log ) {

		return function Ractive$toggle( keypath, callback ) {
			var value;
			if ( typeof keypath !== 'string' ) {
				log.errorOnly( {
					debug: this.debug,
					messsage: 'badArguments',
					arg: {
						arguments: keypath
					}
				} );
			}
			value = this.get( keypath );
			return this.set( keypath, !value, callback );
		};
	}( log );

	/* Ractive/prototype/toHTML.js */
	var Ractive$toHTML = function Ractive$toHTML() {
		return this.fragment.toString( true );
	};

	/* Ractive/prototype/unrender.js */
	var Ractive$unrender = function( removeFromArray, runloop, css ) {

		return function Ractive$unrender() {
			var this$0 = this;
			var promise, shouldDestroy;
			if ( !this.rendered ) {
				throw new Error( 'ractive.unrender() was called on a Ractive instance that was not rendered' );
			}
			promise = runloop.start( this, true );
			// If this is a component, and the component isn't marked for destruction,
			// don't detach nodes from the DOM unnecessarily
			shouldDestroy = !this.component || this.component.shouldDestroy;
			shouldDestroy = shouldDestroy || this.shouldDestroy;
			if ( this.constructor.css ) {
				promise.then( function() {
					css.remove( this$0.constructor );
				} );
			}
			// Cancel any animations in progress
			while ( this._animations[ 0 ] ) {
				this._animations[ 0 ].stop();
			}
			this.fragment.unrender( shouldDestroy );
			this.rendered = false;
			removeFromArray( this.el.__ractive_instances__, this );
			runloop.end();
			return promise;
		};
	}( removeFromArray, runloop, global_css );

	/* Ractive/prototype/unshift.js */
	var Ractive$unshift = function( makeArrayMethod ) {

		return makeArrayMethod( 'unshift' );
	}( Ractive$shared_makeArrayMethod );

	/* Ractive/prototype/update.js */
	var Ractive$update = function( runloop ) {

		return function Ractive$update( keypath, callback ) {
			var promise;
			if ( typeof keypath === 'function' ) {
				callback = keypath;
				keypath = '';
			} else {
				keypath = keypath || '';
			}
			promise = runloop.start( this, true );
			this.viewmodel.mark( keypath );
			runloop.end();
			this.fire( 'update', keypath );
			if ( callback ) {
				promise.then( callback.bind( this ) );
			}
			return promise;
		};
	}( runloop );

	/* Ractive/prototype/updateModel.js */
	var Ractive$updateModel = function( arrayContentsMatch, isEqual ) {

		return function Ractive$updateModel( keypath, cascade ) {
			var values;
			if ( typeof keypath !== 'string' ) {
				keypath = '';
				cascade = true;
			}
			consolidateChangedValues( this, keypath, values = {}, cascade );
			return this.set( values );
		};

		function consolidateChangedValues( ractive, keypath, values, cascade ) {
			var bindings, childDeps, i, binding, oldValue, newValue, checkboxGroups = [];
			bindings = ractive._twowayBindings[ keypath ];
			if ( bindings && ( i = bindings.length ) ) {
				while ( i-- ) {
					binding = bindings[ i ];
					// special case - radio name bindings
					if ( binding.radioName && !binding.element.node.checked ) {
						continue;
					}
					// special case - checkbox name bindings come in groups, so
					// we want to get the value once at most
					if ( binding.checkboxName ) {
						if ( !checkboxGroups[ binding.keypath ] && !binding.changed() ) {
							checkboxGroups.push( binding.keypath );
							checkboxGroups[ binding.keypath ] = binding;
						}
						continue;
					}
					oldValue = binding.attribute.value;
					newValue = binding.getValue();
					if ( arrayContentsMatch( oldValue, newValue ) ) {
						continue;
					}
					if ( !isEqual( oldValue, newValue ) ) {
						values[ keypath ] = newValue;
					}
				}
			}
			// Handle groups of `<input type='checkbox' name='{{foo}}' ...>`
			if ( checkboxGroups.length ) {
				checkboxGroups.forEach( function( keypath ) {
					var binding, oldValue, newValue;
					binding = checkboxGroups[ keypath ];
					// one to represent the entire group
					oldValue = binding.attribute.value;
					newValue = binding.getValue();
					if ( !arrayContentsMatch( oldValue, newValue ) ) {
						values[ keypath ] = newValue;
					}
				} );
			}
			if ( !cascade ) {
				return;
			}
			// cascade
			childDeps = ractive.viewmodel.depsMap[ 'default' ][ keypath ];
			if ( childDeps ) {
				i = childDeps.length;
				while ( i-- ) {
					consolidateChangedValues( ractive, childDeps[ i ], values, cascade );
				}
			}
		}
	}( arrayContentsMatch, isEqual );

	/* Ractive/prototype.js */
	var prototype = function( add, animate, detach, find, findAll, findAllComponents, findComponent, fire, get, insert, merge, observe, off, on, pop, push, render, reset, resetTemplate, reverse, set, shift, sort, splice, subtract, teardown, toggle, toHTML, unrender, unshift, update, updateModel ) {

		return {
			add: add,
			animate: animate,
			detach: detach,
			find: find,
			findAll: findAll,
			findAllComponents: findAllComponents,
			findComponent: findComponent,
			fire: fire,
			get: get,
			insert: insert,
			merge: merge,
			observe: observe,
			off: off,
			on: on,
			pop: pop,
			push: push,
			render: render,
			reset: reset,
			resetTemplate: resetTemplate,
			reverse: reverse,
			set: set,
			shift: shift,
			sort: sort,
			splice: splice,
			subtract: subtract,
			teardown: teardown,
			toggle: toggle,
			toHTML: toHTML,
			unrender: unrender,
			unshift: unshift,
			update: update,
			updateModel: updateModel
		};
	}( Ractive$add, Ractive$animate, Ractive$detach, Ractive$find, Ractive$findAll, Ractive$findAllComponents, Ractive$findComponent, Ractive$fire, Ractive$get, Ractive$insert, Ractive$merge, Ractive$observe, Ractive$off, Ractive$on, Ractive$pop, Ractive$push, Ractive$render, Ractive$reset, Ractive$resetTemplate, Ractive$reverse, Ractive$set, Ractive$shift, Ractive$sort, Ractive$splice, Ractive$subtract, Ractive$teardown, Ractive$toggle, Ractive$toHTML, Ractive$unrender, Ractive$unshift, Ractive$update, Ractive$updateModel );

	/* utils/getGuid.js */
	var getGuid = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function( c ) {
			var r, v;
			r = Math.random() * 16 | 0;
			v = c == 'x' ? r : r & 3 | 8;
			return v.toString( 16 );
		} );
	};

	/* utils/getNextNumber.js */
	var getNextNumber = function() {

		var i = 0;
		return function() {
			return 'r-' + i++;
		};
	}();

	/* viewmodel/prototype/get/arrayAdaptor/processWrapper.js */
	var viewmodel$get_arrayAdaptor_processWrapper = function( wrapper, array, methodName, spliceSummary ) {
		var root = wrapper.root,
			keypath = wrapper.keypath;
		// If this is a sort or reverse, we just do root.set()...
		// TODO use merge logic?
		if ( methodName === 'sort' || methodName === 'reverse' ) {
			root.viewmodel.set( keypath, array );
			return;
		}
		if ( !spliceSummary ) {
			// (presumably we tried to pop from an array of zero length.
			// in which case there's nothing to do)
			return;
		}
		root.viewmodel.splice( keypath, spliceSummary );
	};

	/* viewmodel/prototype/get/arrayAdaptor/patch.js */
	var viewmodel$get_arrayAdaptor_patch = function( runloop, defineProperty, getSpliceEquivalent, summariseSpliceOperation, processWrapper ) {

		var patchedArrayProto = [],
			mutatorMethods = [
				'pop',
				'push',
				'reverse',
				'shift',
				'sort',
				'splice',
				'unshift'
			],
			testObj, patchArrayMethods, unpatchArrayMethods;
		mutatorMethods.forEach( function( methodName ) {
			var method = function() {
				var spliceEquivalent, spliceSummary, result, wrapper, i;
				// push, pop, shift and unshift can all be represented as a splice operation.
				// this makes life easier later
				spliceEquivalent = getSpliceEquivalent( this, methodName, Array.prototype.slice.call( arguments ) );
				spliceSummary = summariseSpliceOperation( this, spliceEquivalent );
				// apply the underlying method
				result = Array.prototype[ methodName ].apply( this, arguments );
				// trigger changes
				this._ractive.setting = true;
				i = this._ractive.wrappers.length;
				while ( i-- ) {
					wrapper = this._ractive.wrappers[ i ];
					runloop.start( wrapper.root );
					processWrapper( wrapper, this, methodName, spliceSummary );
					runloop.end();
				}
				this._ractive.setting = false;
				return result;
			};
			defineProperty( patchedArrayProto, methodName, {
				value: method
			} );
		} );
		// can we use prototype chain injection?
		// http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/#wrappers_prototype_chain_injection
		testObj = {};
		if ( testObj.__proto__ ) {
			// yes, we can
			patchArrayMethods = function( array ) {
				array.__proto__ = patchedArrayProto;
			};
			unpatchArrayMethods = function( array ) {
				array.__proto__ = Array.prototype;
			};
		} else {
			// no, we can't
			patchArrayMethods = function( array ) {
				var i, methodName;
				i = mutatorMethods.length;
				while ( i-- ) {
					methodName = mutatorMethods[ i ];
					defineProperty( array, methodName, {
						value: patchedArrayProto[ methodName ],
						configurable: true
					} );
				}
			};
			unpatchArrayMethods = function( array ) {
				var i;
				i = mutatorMethods.length;
				while ( i-- ) {
					delete array[ mutatorMethods[ i ] ];
				}
			};
		}
		patchArrayMethods.unpatch = unpatchArrayMethods;
		return patchArrayMethods;
	}( runloop, defineProperty, getSpliceEquivalent, summariseSpliceOperation, viewmodel$get_arrayAdaptor_processWrapper );

	/* viewmodel/prototype/get/arrayAdaptor.js */
	var viewmodel$get_arrayAdaptor = function( defineProperty, isArray, patch ) {

		var arrayAdaptor,
			// helpers
			ArrayWrapper, errorMessage;
		arrayAdaptor = {
			filter: function( object ) {
				// wrap the array if a) b) it's an array, and b) either it hasn't been wrapped already,
				// or the array didn't trigger the get() itself
				return isArray( object ) && ( !object._ractive || !object._ractive.setting );
			},
			wrap: function( ractive, array, keypath ) {
				return new ArrayWrapper( ractive, array, keypath );
			}
		};
		ArrayWrapper = function( ractive, array, keypath ) {
			this.root = ractive;
			this.value = array;
			this.keypath = keypath;
			// if this array hasn't already been ractified, ractify it
			if ( !array._ractive ) {
				// define a non-enumerable _ractive property to store the wrappers
				defineProperty( array, '_ractive', {
					value: {
						wrappers: [],
						instances: [],
						setting: false
					},
					configurable: true
				} );
				patch( array );
			}
			// store the ractive instance, so we can handle transitions later
			if ( !array._ractive.instances[ ractive._guid ] ) {
				array._ractive.instances[ ractive._guid ] = 0;
				array._ractive.instances.push( ractive );
			}
			array._ractive.instances[ ractive._guid ] += 1;
			array._ractive.wrappers.push( this );
		};
		ArrayWrapper.prototype = {
			get: function() {
				return this.value;
			},
			teardown: function() {
				var array, storage, wrappers, instances, index;
				array = this.value;
				storage = array._ractive;
				wrappers = storage.wrappers;
				instances = storage.instances;
				// if teardown() was invoked because we're clearing the cache as a result of
				// a change that the array itself triggered, we can save ourselves the teardown
				// and immediate setup
				if ( storage.setting ) {
					return false;
				}
				index = wrappers.indexOf( this );
				if ( index === -1 ) {
					throw new Error( errorMessage );
				}
				wrappers.splice( index, 1 );
				// if nothing else depends on this array, we can revert it to its
				// natural state
				if ( !wrappers.length ) {
					delete array._ractive;
					patch.unpatch( this.value );
				} else {
					// remove ractive instance if possible
					instances[ this.root._guid ] -= 1;
					if ( !instances[ this.root._guid ] ) {
						index = instances.indexOf( this.root );
						if ( index === -1 ) {
							throw new Error( errorMessage );
						}
						instances.splice( index, 1 );
					}
				}
			}
		};
		errorMessage = 'Something went wrong in a rather interesting way';
		return arrayAdaptor;
	}( defineProperty, isArray, viewmodel$get_arrayAdaptor_patch );

	/* viewmodel/prototype/get/magicArrayAdaptor.js */
	var viewmodel$get_magicArrayAdaptor = function( magicAdaptor, arrayAdaptor ) {

		var magicArrayAdaptor, MagicArrayWrapper;
		if ( magicAdaptor ) {
			magicArrayAdaptor = {
				filter: function( object, keypath, ractive ) {
					return magicAdaptor.filter( object, keypath, ractive ) && arrayAdaptor.filter( object );
				},
				wrap: function( ractive, array, keypath ) {
					return new MagicArrayWrapper( ractive, array, keypath );
				}
			};
			MagicArrayWrapper = function( ractive, array, keypath ) {
				this.value = array;
				this.magic = true;
				this.magicWrapper = magicAdaptor.wrap( ractive, array, keypath );
				this.arrayWrapper = arrayAdaptor.wrap( ractive, array, keypath );
			};
			MagicArrayWrapper.prototype = {
				get: function() {
					return this.value;
				},
				teardown: function() {
					this.arrayWrapper.teardown();
					this.magicWrapper.teardown();
				},
				reset: function( value ) {
					return this.magicWrapper.reset( value );
				}
			};
		}
		return magicArrayAdaptor;
	}( viewmodel$get_magicAdaptor, viewmodel$get_arrayAdaptor );

	/* viewmodel/prototype/adapt.js */
	var viewmodel$adapt = function( config, arrayAdaptor, magicAdaptor, magicArrayAdaptor ) {

		var prefixers = {};
		return function Viewmodel$adapt( keypath, value ) {
			var ractive = this.ractive,
				len, i, adaptor, wrapped;
			// Do we have an adaptor for this value?
			len = ractive.adapt.length;
			for ( i = 0; i < len; i += 1 ) {
				adaptor = ractive.adapt[ i ];
				// Adaptors can be specified as e.g. [ 'Backbone.Model', 'Backbone.Collection' ] -
				// we need to get the actual adaptor if that's the case
				if ( typeof adaptor === 'string' ) {
					var found = config.registries.adaptors.find( ractive, adaptor );
					if ( !found ) {
						throw new Error( 'Missing adaptor "' + adaptor + '"' );
					}
					adaptor = ractive.adapt[ i ] = found;
				}
				if ( adaptor.filter( value, keypath, ractive ) ) {
					wrapped = this.wrapped[ keypath ] = adaptor.wrap( ractive, value, keypath, getPrefixer( keypath ) );
					wrapped.value = value;
					return value;
				}
			}
			if ( ractive.magic ) {
				if ( magicArrayAdaptor.filter( value, keypath, ractive ) ) {
					this.wrapped[ keypath ] = magicArrayAdaptor.wrap( ractive, value, keypath );
				} else if ( magicAdaptor.filter( value, keypath, ractive ) ) {
					this.wrapped[ keypath ] = magicAdaptor.wrap( ractive, value, keypath );
				}
			} else if ( ractive.modifyArrays && arrayAdaptor.filter( value, keypath, ractive ) ) {
				this.wrapped[ keypath ] = arrayAdaptor.wrap( ractive, value, keypath );
			}
			return value;
		};

		function prefixKeypath( obj, prefix ) {
			var prefixed = {},
				key;
			if ( !prefix ) {
				return obj;
			}
			prefix += '.';
			for ( key in obj ) {
				if ( obj.hasOwnProperty( key ) ) {
					prefixed[ prefix + key ] = obj[ key ];
				}
			}
			return prefixed;
		}

		function getPrefixer( rootKeypath ) {
			var rootDot;
			if ( !prefixers[ rootKeypath ] ) {
				rootDot = rootKeypath ? rootKeypath + '.' : '';
				prefixers[ rootKeypath ] = function( relativeKeypath, value ) {
					var obj;
					if ( typeof relativeKeypath === 'string' ) {
						obj = {};
						obj[ rootDot + relativeKeypath ] = value;
						return obj;
					}
					if ( typeof relativeKeypath === 'object' ) {
						// 'relativeKeypath' is in fact a hash, not a keypath
						return rootDot ? prefixKeypath( relativeKeypath, rootKeypath ) : relativeKeypath;
					}
				};
			}
			return prefixers[ rootKeypath ];
		}
	}( config, viewmodel$get_arrayAdaptor, viewmodel$get_magicAdaptor, viewmodel$get_magicArrayAdaptor );

	/* viewmodel/helpers/getUpstreamChanges.js */
	var getUpstreamChanges = function getUpstreamChanges( changes ) {
		var upstreamChanges = [ '' ],
			i, keypath, keys, upstreamKeypath;
		i = changes.length;
		while ( i-- ) {
			keypath = changes[ i ];
			keys = keypath.split( '.' );
			while ( keys.length > 1 ) {
				keys.pop();
				upstreamKeypath = keys.join( '.' );
				if ( upstreamChanges.indexOf( upstreamKeypath ) === -1 ) {
					upstreamChanges.push( upstreamKeypath );
				}
			}
		}
		return upstreamChanges;
	};

	/* viewmodel/prototype/applyChanges/getPotentialWildcardMatches.js */
	var viewmodel$applyChanges_getPotentialWildcardMatches = function() {

		var starMaps = {};
		// This function takes a keypath such as 'foo.bar.baz', and returns
		// all the variants of that keypath that include a wildcard in place
		// of a key, such as 'foo.bar.*', 'foo.*.baz', 'foo.*.*' and so on.
		// These are then checked against the dependants map (ractive.viewmodel.depsMap)
		// to see if any pattern observers are downstream of one or more of
		// these wildcard keypaths (e.g. 'foo.bar.*.status')
		return function getPotentialWildcardMatches( keypath ) {
			var keys, starMap, mapper, result;
			keys = keypath.split( '.' );
			starMap = getStarMap( keys.length );
			mapper = function( star, i ) {
				return star ? '*' : keys[ i ];
			};
			result = starMap.map( function( mask ) {
				return mask.map( mapper ).join( '.' );
			} );
			return result;
		};
		// This function returns all the possible true/false combinations for
		// a given number - e.g. for two, the possible combinations are
		// [ true, true ], [ true, false ], [ false, true ], [ false, false ].
		// It does so by getting all the binary values between 0 and e.g. 11
		function getStarMap( length ) {
			var ones = '',
				max, binary, starMap, mapper, i;
			if ( !starMaps[ length ] ) {
				starMap = [];
				while ( ones.length < length ) {
					ones += 1;
				}
				max = parseInt( ones, 2 );
				mapper = function( digit ) {
					return digit === '1';
				};
				for ( i = 0; i <= max; i += 1 ) {
					binary = i.toString( 2 );
					while ( binary.length < length ) {
						binary = '0' + binary;
					}
					starMap[ i ] = Array.prototype.map.call( binary, mapper );
				}
				starMaps[ length ] = starMap;
			}
			return starMaps[ length ];
		}
	}();

	/* viewmodel/prototype/applyChanges/notifyPatternObservers.js */
	var viewmodel$applyChanges_notifyPatternObservers = function( getPotentialWildcardMatches ) {

		var lastKey = /[^\.]+$/;
		return notifyPatternObservers;

		function notifyPatternObservers( viewmodel, keypath, onlyDirect ) {
			var potentialWildcardMatches;
			updateMatchingPatternObservers( viewmodel, keypath );
			if ( onlyDirect ) {
				return;
			}
			potentialWildcardMatches = getPotentialWildcardMatches( keypath );
			potentialWildcardMatches.forEach( function( upstreamPattern ) {
				cascade( viewmodel, upstreamPattern, keypath );
			} );
		}

		function cascade( viewmodel, upstreamPattern, keypath ) {
			var group, map, actualChildKeypath;
			group = viewmodel.depsMap.patternObservers;
			map = group[ upstreamPattern ];
			if ( map ) {
				map.forEach( function( childKeypath ) {
					var key = lastKey.exec( childKeypath )[ 0 ];
					// 'baz'
					actualChildKeypath = keypath ? keypath + '.' + key : key;
					// 'foo.bar.baz'
					updateMatchingPatternObservers( viewmodel, actualChildKeypath );
					cascade( viewmodel, childKeypath, actualChildKeypath );
				} );
			}
		}

		function updateMatchingPatternObservers( viewmodel, keypath ) {
			viewmodel.patternObservers.forEach( function( observer ) {
				if ( observer.regex.test( keypath ) ) {
					observer.update( keypath );
				}
			} );
		}
	}( viewmodel$applyChanges_getPotentialWildcardMatches );

	/* viewmodel/prototype/applyChanges.js */
	var viewmodel$applyChanges = function( getUpstreamChanges, notifyPatternObservers ) {

		var dependantGroups = [
			'observers',
			'default'
		];
		return function Viewmodel$applyChanges() {
			var this$0 = this;
			var self = this,
				changes, upstreamChanges, allChanges = [],
				computations, addComputations, cascade, hash = {};
			if ( !this.changes.length ) {
				// TODO we end up here on initial render. Perhaps we shouldn't?
				return;
			}
			addComputations = function( keypath ) {
				var newComputations;
				if ( newComputations = self.deps.computed[ keypath ] ) {
					addNewItems( computations, newComputations );
				}
			};
			cascade = function( keypath ) {
				var map;
				addComputations( keypath );
				if ( map = self.depsMap.computed[ keypath ] ) {
					map.forEach( cascade );
				}
			};
			// Find computations and evaluators that are invalidated by
			// these changes. If they have changed, add them to the
			// list of changes. Lather, rinse and repeat until the
			// system is settled
			do {
				changes = this.changes;
				addNewItems( allChanges, changes );
				this.changes = [];
				computations = [];
				upstreamChanges = getUpstreamChanges( changes );
				upstreamChanges.forEach( addComputations );
				changes.forEach( cascade );
				computations.forEach( updateComputation );
			} while ( this.changes.length );
			upstreamChanges = getUpstreamChanges( allChanges );
			// Pattern observers are a weird special case
			if ( this.patternObservers.length ) {
				upstreamChanges.forEach( function( keypath ) {
					return notifyPatternObservers( this$0, keypath, true );
				} );
				allChanges.forEach( function( keypath ) {
					return notifyPatternObservers( this$0, keypath );
				} );
			}
			dependantGroups.forEach( function( group ) {
				if ( !this$0.deps[ group ] ) {
					return;
				}
				upstreamChanges.forEach( function( keypath ) {
					return notifyUpstreamDependants( this$0, keypath, group );
				} );
				notifyAllDependants( this$0, allChanges, group );
			} );
			// Return a hash of keypaths to updated values
			allChanges.forEach( function( keypath ) {
				hash[ keypath ] = this$0.get( keypath );
			} );
			this.implicitChanges = {};
			return hash;
		};

		function updateComputation( computation ) {
			computation.update();
		}

		function notifyUpstreamDependants( viewmodel, keypath, groupName ) {
			var dependants, value;
			if ( dependants = findDependants( viewmodel, keypath, groupName ) ) {
				value = viewmodel.get( keypath );
				dependants.forEach( function( d ) {
					return d.setValue( value );
				} );
			}
		}

		function notifyAllDependants( viewmodel, keypaths, groupName ) {
			var queue = [];
			addKeypaths( keypaths );
			queue.forEach( dispatch );

			function addKeypaths( keypaths ) {
				keypaths.forEach( addKeypath );
				keypaths.forEach( cascade );
			}

			function addKeypath( keypath ) {
				var deps = findDependants( viewmodel, keypath, groupName );
				if ( deps ) {
					queue.push( {
						keypath: keypath,
						deps: deps
					} );
				}
			}

			function cascade( keypath ) {
				var childDeps;
				if ( childDeps = viewmodel.depsMap[ groupName ][ keypath ] ) {
					addKeypaths( childDeps );
				}
			}

			function dispatch( set ) {
				var value = viewmodel.get( set.keypath );
				set.deps.forEach( function( d ) {
					return d.setValue( value );
				} );
			}
		}

		function findDependants( viewmodel, keypath, groupName ) {
			var group = viewmodel.deps[ groupName ];
			return group ? group[ keypath ] : null;
		}

		function addNewItems( arr, items ) {
			items.forEach( function( item ) {
				if ( arr.indexOf( item ) === -1 ) {
					arr.push( item );
				}
			} );
		}
	}( getUpstreamChanges, viewmodel$applyChanges_notifyPatternObservers );

	/* viewmodel/prototype/capture.js */
	var viewmodel$capture = function Viewmodel$capture() {
		this.capturing = true;
		this.captured = [];
	};

	/* viewmodel/prototype/clearCache.js */
	var viewmodel$clearCache = function Viewmodel$clearCache( keypath, dontTeardownWrapper ) {
		var cacheMap, wrapper, computation;
		if ( !dontTeardownWrapper ) {
			// Is there a wrapped property at this keypath?
			if ( wrapper = this.wrapped[ keypath ] ) {
				// Did we unwrap it?
				if ( wrapper.teardown() !== false ) {
					this.wrapped[ keypath ] = null;
				}
			}
		}
		if ( computation = this.computations[ keypath ] ) {
			computation.compute();
		}
		this.cache[ keypath ] = undefined;
		if ( cacheMap = this.cacheMap[ keypath ] ) {
			while ( cacheMap.length ) {
				this.clearCache( cacheMap.pop() );
			}
		}
	};

	/* viewmodel/prototype/get/FAILED_LOOKUP.js */
	var viewmodel$get_FAILED_LOOKUP = {
		FAILED_LOOKUP: true
	};

	/* viewmodel/prototype/get/UnresolvedImplicitDependency.js */
	var viewmodel$get_UnresolvedImplicitDependency = function( removeFromArray, runloop ) {

		var empty = {};
		var UnresolvedImplicitDependency = function( viewmodel, keypath ) {
			this.viewmodel = viewmodel;
			this.root = viewmodel.ractive;
			// TODO eliminate this
			this.ref = keypath;
			this.parentFragment = empty;
			viewmodel.unresolvedImplicitDependencies[ keypath ] = true;
			viewmodel.unresolvedImplicitDependencies.push( this );
			runloop.addUnresolved( this );
		};
		UnresolvedImplicitDependency.prototype = {
			resolve: function() {
				this.viewmodel.mark( this.ref );
				this.viewmodel.unresolvedImplicitDependencies[ this.ref ] = false;
				removeFromArray( this.viewmodel.unresolvedImplicitDependencies, this );
			},
			teardown: function() {
				runloop.removeUnresolved( this );
			}
		};
		return UnresolvedImplicitDependency;
	}( removeFromArray, runloop );

	/* viewmodel/prototype/get.js */
	var viewmodel$get = function( FAILED_LOOKUP, UnresolvedImplicitDependency ) {

		var empty = {};
		return function Viewmodel$get( keypath ) {
			var options = arguments[ 1 ];
			if ( options === void 0 )
				options = empty;
			var ractive = this.ractive,
				cache = this.cache,
				value, computation, wrapped, evaluator;
			if ( cache[ keypath ] === undefined ) {
				// Is this a computed property?
				if ( computation = this.computations[ keypath ] ) {
					value = computation.value;
				} else if ( wrapped = this.wrapped[ keypath ] ) {
					value = wrapped.value;
				} else if ( !keypath ) {
					this.adapt( '', ractive.data );
					value = ractive.data;
				} else if ( evaluator = this.evaluators[ keypath ] ) {
					value = evaluator.value;
				} else {
					value = retrieve( this, keypath );
				}
				cache[ keypath ] = value;
			} else {
				value = cache[ keypath ];
			}
			if ( options.evaluateWrapped && ( wrapped = this.wrapped[ keypath ] ) ) {
				value = wrapped.get();
			}
			// capture the keypath, if we're inside a computation or evaluator
			if ( options.capture && this.capturing && this.captured.indexOf( keypath ) === -1 ) {
				this.captured.push( keypath );
				// if we couldn't resolve the keypath, we need to make it as a failed
				// lookup, so that the evaluator updates correctly once we CAN
				// resolve the keypath
				if ( value === FAILED_LOOKUP && this.unresolvedImplicitDependencies[ keypath ] !== true ) {
					new UnresolvedImplicitDependency( this, keypath );
				}
			}
			return value === FAILED_LOOKUP ? void 0 : value;
		};

		function retrieve( viewmodel, keypath ) {
			var keys, key, parentKeypath, parentValue, cacheMap, value, wrapped;
			keys = keypath.split( '.' );
			key = keys.pop();
			parentKeypath = keys.join( '.' );
			parentValue = viewmodel.get( parentKeypath );
			if ( wrapped = viewmodel.wrapped[ parentKeypath ] ) {
				parentValue = wrapped.get();
			}
			if ( parentValue === null || parentValue === undefined ) {
				return;
			}
			// update cache map
			if ( !( cacheMap = viewmodel.cacheMap[ parentKeypath ] ) ) {
				viewmodel.cacheMap[ parentKeypath ] = [ keypath ];
			} else {
				if ( cacheMap.indexOf( keypath ) === -1 ) {
					cacheMap.push( keypath );
				}
			}
			// If this property doesn't exist, we return a sentinel value
			// so that we know to query parent scope (if such there be)
			if ( typeof parentValue === 'object' && !( key in parentValue ) ) {
				return viewmodel.cache[ keypath ] = FAILED_LOOKUP;
			}
			value = parentValue[ key ];
			// Do we have an adaptor for this value?
			viewmodel.adapt( keypath, value, false );
			// Update cache
			viewmodel.cache[ keypath ] = value;
			return value;
		}
	}( viewmodel$get_FAILED_LOOKUP, viewmodel$get_UnresolvedImplicitDependency );

	/* viewmodel/prototype/mark.js */
	var viewmodel$mark = function Viewmodel$mark( keypath, isImplicitChange ) {
		// implicit changes (i.e. `foo.length` on `ractive.push('foo',42)`)
		// should not be picked up by pattern observers
		if ( isImplicitChange ) {
			this.implicitChanges[ keypath ] = true;
		}
		if ( this.changes.indexOf( keypath ) === -1 ) {
			this.changes.push( keypath );
			this.clearCache( keypath );
		}
	};

	/* viewmodel/prototype/merge/mapOldToNewIndex.js */
	var viewmodel$merge_mapOldToNewIndex = function( oldArray, newArray ) {
		var usedIndices, firstUnusedIndex, newIndices, changed;
		usedIndices = {};
		firstUnusedIndex = 0;
		newIndices = oldArray.map( function( item, i ) {
			var index, start, len;
			start = firstUnusedIndex;
			len = newArray.length;
			do {
				index = newArray.indexOf( item, start );
				if ( index === -1 ) {
					changed = true;
					return -1;
				}
				start = index + 1;
			} while ( usedIndices[ index ] && start < len );
			// keep track of the first unused index, so we don't search
			// the whole of newArray for each item in oldArray unnecessarily
			if ( index === firstUnusedIndex ) {
				firstUnusedIndex += 1;
			}
			if ( index !== i ) {
				changed = true;
			}
			usedIndices[ index ] = true;
			return index;
		} );
		newIndices.unchanged = !changed;
		return newIndices;
	};

	/* viewmodel/prototype/merge.js */
	var viewmodel$merge = function( types, warn, mapOldToNewIndex ) {

		var comparators = {};
		return function Viewmodel$merge( keypath, currentArray, array, options ) {
			var this$0 = this;
			var oldArray, newArray, comparator, newIndices, dependants;
			this.mark( keypath );
			if ( options && options.compare ) {
				comparator = getComparatorFunction( options.compare );
				try {
					oldArray = currentArray.map( comparator );
					newArray = array.map( comparator );
				} catch ( err ) {
					// fallback to an identity check - worst case scenario we have
					// to do more DOM manipulation than we thought...
					// ...unless we're in debug mode of course
					if ( this.debug ) {
						throw err;
					} else {
						warn( 'Merge operation: comparison failed. Falling back to identity checking' );
					}
					oldArray = currentArray;
					newArray = array;
				}
			} else {
				oldArray = currentArray;
				newArray = array;
			}
			// find new indices for members of oldArray
			newIndices = mapOldToNewIndex( oldArray, newArray );
			// Indices that are being removed should be marked as dirty
			newIndices.forEach( function( newIndex, oldIndex ) {
				if ( newIndex === -1 ) {
					this$0.mark( keypath + '.' + oldIndex );
				}
			} );
			// Update the model
			// TODO allow existing array to be updated in place, rather than replaced?
			this.set( keypath, array, true );
			if ( dependants = this.deps[ 'default' ][ keypath ] ) {
				dependants.filter( canMerge ).forEach( function( dependant ) {
					return dependant.merge( newIndices );
				} );
			}
			if ( currentArray.length !== array.length ) {
				this.mark( keypath + '.length', true );
			}
		};

		function canMerge( dependant ) {
			return typeof dependant.merge === 'function' && ( !dependant.subtype || dependant.subtype === types.SECTION_EACH );
		}

		function stringify( item ) {
			return JSON.stringify( item );
		}

		function getComparatorFunction( comparator ) {
			// If `compare` is `true`, we use JSON.stringify to compare
			// objects that are the same shape, but non-identical - i.e.
			// { foo: 'bar' } !== { foo: 'bar' }
			if ( comparator === true ) {
				return stringify;
			}
			if ( typeof comparator === 'string' ) {
				if ( !comparators[ comparator ] ) {
					comparators[ comparator ] = function( item ) {
						return item[ comparator ];
					};
				}
				return comparators[ comparator ];
			}
			if ( typeof comparator === 'function' ) {
				return comparator;
			}
			throw new Error( 'The `compare` option must be a function, or a string representing an identifying field (or `true` to use JSON.stringify)' );
		}
	}( types, warn, viewmodel$merge_mapOldToNewIndex );

	/* viewmodel/prototype/register.js */
	var viewmodel$register = function() {

		return function Viewmodel$register( keypath, dependant ) {
			var group = arguments[ 2 ];
			if ( group === void 0 )
				group = 'default';
			var depsByKeypath, deps, evaluator;
			if ( dependant.isStatic ) {
				return;
			}
			depsByKeypath = this.deps[ group ] || ( this.deps[ group ] = {} );
			deps = depsByKeypath[ keypath ] || ( depsByKeypath[ keypath ] = [] );
			deps.push( dependant );
			if ( !keypath ) {
				return;
			}
			if ( evaluator = this.evaluators[ keypath ] ) {
				if ( !evaluator.dependants ) {
					evaluator.wake();
				}
				evaluator.dependants += 1;
			}
			updateDependantsMap( this, keypath, group );
		};

		function updateDependantsMap( viewmodel, keypath, group ) {
			var keys, parentKeypath, map, parent;
			// update dependants map
			keys = keypath.split( '.' );
			while ( keys.length ) {
				keys.pop();
				parentKeypath = keys.join( '.' );
				map = viewmodel.depsMap[ group ] || ( viewmodel.depsMap[ group ] = {} );
				parent = map[ parentKeypath ] || ( map[ parentKeypath ] = [] );
				if ( parent[ keypath ] === undefined ) {
					parent[ keypath ] = 0;
					parent.push( keypath );
				}
				parent[ keypath ] += 1;
				keypath = parentKeypath;
			}
		}
	}();

	/* viewmodel/prototype/release.js */
	var viewmodel$release = function Viewmodel$release() {
		this.capturing = false;
		return this.captured;
	};

	/* viewmodel/prototype/set.js */
	var viewmodel$set = function( isEqual, createBranch ) {

		return function Viewmodel$set( keypath, value, silent ) {
			var keys, lastKey, parentKeypath, parentValue, computation, wrapper, evaluator, dontTeardownWrapper;
			if ( isEqual( this.cache[ keypath ], value ) ) {
				return;
			}
			computation = this.computations[ keypath ];
			wrapper = this.wrapped[ keypath ];
			evaluator = this.evaluators[ keypath ];
			if ( computation && !computation.setting ) {
				computation.set( value );
			}
			// If we have a wrapper with a `reset()` method, we try and use it. If the
			// `reset()` method returns false, the wrapper should be torn down, and
			// (most likely) a new one should be created later
			if ( wrapper && wrapper.reset ) {
				dontTeardownWrapper = wrapper.reset( value ) !== false;
				if ( dontTeardownWrapper ) {
					value = wrapper.get();
				}
			}
			// Update evaluator value. This may be from the evaluator itself, or
			// it may be from the wrapper that wraps an evaluator's result - it
			// doesn't matter
			if ( evaluator ) {
				evaluator.value = value;
			}
			if ( !computation && !evaluator && !dontTeardownWrapper ) {
				keys = keypath.split( '.' );
				lastKey = keys.pop();
				parentKeypath = keys.join( '.' );
				wrapper = this.wrapped[ parentKeypath ];
				if ( wrapper && wrapper.set ) {
					wrapper.set( lastKey, value );
				} else {
					parentValue = wrapper ? wrapper.get() : this.get( parentKeypath );
					if ( !parentValue ) {
						parentValue = createBranch( lastKey );
						this.set( parentKeypath, parentValue, true );
					}
					parentValue[ lastKey ] = value;
				}
			}
			if ( !silent ) {
				this.mark( keypath );
			} else {
				// We're setting a parent of the original target keypath (i.e.
				// creating a fresh branch) - we need to clear the cache, but
				// not mark it as a change
				this.clearCache( keypath );
			}
		};
	}( isEqual, createBranch );

	/* viewmodel/prototype/splice.js */
	var viewmodel$splice = function( types ) {

		return function Viewmodel$splice( keypath, spliceSummary ) {
			var viewmodel = this,
				i, dependants;
			// Mark changed keypaths
			for ( i = spliceSummary.rangeStart; i < spliceSummary.rangeEnd; i += 1 ) {
				viewmodel.mark( keypath + '.' + i );
			}
			if ( spliceSummary.balance ) {
				viewmodel.mark( keypath + '.length', true );
			}
			// Trigger splice operations
			if ( dependants = viewmodel.deps[ 'default' ][ keypath ] ) {
				dependants.filter( canSplice ).forEach( function( dependant ) {
					return dependant.splice( spliceSummary );
				} );
			}
		};

		function canSplice( dependant ) {
			return dependant.type === types.SECTION && ( !dependant.subtype || dependant.subtype === types.SECTION_EACH ) && dependant.rendered;
		}
	}( types );

	/* viewmodel/prototype/teardown.js */
	var viewmodel$teardown = function Viewmodel$teardown() {
		var this$0 = this;
		var unresolvedImplicitDependency;
		// Clear entire cache - this has the desired side-effect
		// of unwrapping adapted values (e.g. arrays)
		Object.keys( this.cache ).forEach( function( keypath ) {
			return this$0.clearCache( keypath );
		} );
		// Teardown any failed lookups - we don't need them to resolve any more
		while ( unresolvedImplicitDependency = this.unresolvedImplicitDependencies.pop() ) {
			unresolvedImplicitDependency.teardown();
		}
	};

	/* viewmodel/prototype/unregister.js */
	var viewmodel$unregister = function() {

		return function Viewmodel$unregister( keypath, dependant ) {
			var group = arguments[ 2 ];
			if ( group === void 0 )
				group = 'default';
			var deps, index, evaluator;
			if ( dependant.isStatic ) {
				return;
			}
			deps = this.deps[ group ][ keypath ];
			index = deps.indexOf( dependant );
			if ( index === -1 ) {
				throw new Error( 'Attempted to remove a dependant that was no longer registered! This should not happen. If you are seeing this bug in development please raise an issue at https://github.com/RactiveJS/Ractive/issues - thanks' );
			}
			deps.splice( index, 1 );
			if ( !keypath ) {
				return;
			}
			if ( evaluator = this.evaluators[ keypath ] ) {
				evaluator.dependants -= 1;
				if ( !evaluator.dependants ) {
					evaluator.sleep();
				}
			}
			updateDependantsMap( this, keypath, group );
		};

		function updateDependantsMap( viewmodel, keypath, group ) {
			var keys, parentKeypath, map, parent;
			// update dependants map
			keys = keypath.split( '.' );
			while ( keys.length ) {
				keys.pop();
				parentKeypath = keys.join( '.' );
				map = viewmodel.depsMap[ group ];
				parent = map[ parentKeypath ];
				parent[ keypath ] -= 1;
				if ( !parent[ keypath ] ) {
					// remove from parent deps map
					parent.splice( parent.indexOf( keypath ), 1 );
					parent[ keypath ] = undefined;
				}
				keypath = parentKeypath;
			}
		}
	}();

	/* viewmodel/Computation/getComputationSignature.js */
	var getComputationSignature = function() {

		var pattern = /\$\{([^\}]+)\}/g;
		return function( signature ) {
			if ( typeof signature === 'function' ) {
				return {
					get: signature
				};
			}
			if ( typeof signature === 'string' ) {
				return {
					get: createFunctionFromString( signature )
				};
			}
			if ( typeof signature === 'object' && typeof signature.get === 'string' ) {
				signature = {
					get: createFunctionFromString( signature.get ),
					set: signature.set
				};
			}
			return signature;
		};

		function createFunctionFromString( signature ) {
			var functionBody = 'var __ractive=this;return(' + signature.replace( pattern, function( match, keypath ) {
				return '__ractive.get("' + keypath + '")';
			} ) + ')';
			return new Function( functionBody );
		}
	}();

	/* viewmodel/Computation/Computation.js */
	var Computation = function( log, isEqual, diff ) {

		var Computation = function( ractive, key, signature ) {
			this.ractive = ractive;
			this.viewmodel = ractive.viewmodel;
			this.key = key;
			this.getter = signature.get;
			this.setter = signature.set;
			this.dependencies = [];
			this.update();
		};
		Computation.prototype = {
			set: function( value ) {
				if ( this.setting ) {
					this.value = value;
					return;
				}
				if ( !this.setter ) {
					throw new Error( 'Computed properties without setters are read-only. (This may change in a future version of Ractive!)' );
				}
				this.setter.call( this.ractive, value );
			},
			// returns `false` if the computation errors
			compute: function() {
				var ractive, errored, newDependencies;
				ractive = this.ractive;
				ractive.viewmodel.capture();
				try {
					this.value = this.getter.call( ractive );
				} catch ( err ) {
					log.warn( {
						debug: ractive.debug,
						message: 'failedComputation',
						args: {
							key: this.key,
							err: err.message || err
						}
					} );
					errored = true;
				}
				newDependencies = ractive.viewmodel.release();
				diff( this, this.dependencies, newDependencies );
				return errored ? false : true;
			},
			update: function() {
				var oldValue = this.value;
				if ( this.compute() && !isEqual( this.value, oldValue ) ) {
					this.ractive.viewmodel.mark( this.key );
				}
			}
		};
		return Computation;
	}( log, isEqual, diff );

	/* viewmodel/Computation/createComputations.js */
	var createComputations = function( getComputationSignature, Computation ) {

		return function createComputations( ractive, computed ) {
			var key, signature;
			for ( key in computed ) {
				signature = getComputationSignature( computed[ key ] );
				ractive.viewmodel.computations[ key ] = new Computation( ractive, key, signature );
			}
		};
	}( getComputationSignature, Computation );

	/* viewmodel/adaptConfig.js */
	var adaptConfig = function() {

		// should this be combined with prototype/adapt.js?
		var configure = {
			lookup: function( target, adaptors ) {
				var i, adapt = target.adapt;
				if ( !adapt || !adapt.length ) {
					return adapt;
				}
				if ( adaptors && Object.keys( adaptors ).length && ( i = adapt.length ) ) {
					while ( i-- ) {
						var adaptor = adapt[ i ];
						if ( typeof adaptor === 'string' ) {
							adapt[ i ] = adaptors[ adaptor ] || adaptor;
						}
					}
				}
				return adapt;
			},
			combine: function( parent, adapt ) {
				// normalize 'Foo' to [ 'Foo' ]
				parent = arrayIfString( parent );
				adapt = arrayIfString( adapt );
				// no parent? return adapt
				if ( !parent || !parent.length ) {
					return adapt;
				}
				// no adapt? return 'copy' of parent
				if ( !adapt || !adapt.length ) {
					return parent.slice();
				}
				// add parent adaptors to options
				parent.forEach( function( a ) {
					// don't put in duplicates
					if ( adapt.indexOf( a ) === -1 ) {
						adapt.push( a );
					}
				} );
				return adapt;
			}
		};

		function arrayIfString( adapt ) {
			if ( typeof adapt === 'string' ) {
				adapt = [ adapt ];
			}
			return adapt;
		}
		return configure;
	}();

	/* viewmodel/Viewmodel.js */
	var Viewmodel = function( create, adapt, applyChanges, capture, clearCache, get, mark, merge, register, release, set, splice, teardown, unregister, createComputations, adaptConfig ) {

		// TODO: fix our ES6 modules so we can have multiple exports
		// then this magic check can be reused by magicAdaptor
		var noMagic;
		try {
			Object.defineProperty( {}, 'test', {
				value: 0
			} );
		} catch ( err ) {
			noMagic = true;
		}
		var Viewmodel = function( ractive ) {
			this.ractive = ractive;
			// TODO eventually, we shouldn't need this reference
			Viewmodel.extend( ractive.constructor, ractive );
			//this.ractive.data
			this.cache = {};
			// we need to be able to use hasOwnProperty, so can't inherit from null
			this.cacheMap = create( null );
			this.deps = {
				computed: {},
				'default': {}
			};
			this.depsMap = {
				computed: {},
				'default': {}
			};
			this.patternObservers = [];
			this.wrapped = create( null );
			// TODO these are conceptually very similar. Can they be merged somehow?
			this.evaluators = create( null );
			this.computations = create( null );
			this.captured = null;
			this.unresolvedImplicitDependencies = [];
			this.changes = [];
			this.implicitChanges = {};
		};
		Viewmodel.extend = function( Parent, instance ) {
			if ( instance.magic && noMagic ) {
				throw new Error( 'Getters and setters (magic mode) are not supported in this browser' );
			}
			instance.adapt = adaptConfig.combine( Parent.prototype.adapt, instance.adapt ) || [];
			instance.adapt = adaptConfig.lookup( instance, instance.adaptors );
		};
		Viewmodel.prototype = {
			adapt: adapt,
			applyChanges: applyChanges,
			capture: capture,
			clearCache: clearCache,
			get: get,
			mark: mark,
			merge: merge,
			register: register,
			release: release,
			set: set,
			splice: splice,
			teardown: teardown,
			unregister: unregister,
			// createComputations, in the computations, may call back through get or set
			// of ractive. So, for now, we delay creation of computed from constructor.
			// on option would be to have the Computed class be lazy about using .update()
			compute: function() {
				createComputations( this.ractive, this.ractive.computed );
			}
		};
		return Viewmodel;
	}( create, viewmodel$adapt, viewmodel$applyChanges, viewmodel$capture, viewmodel$clearCache, viewmodel$get, viewmodel$mark, viewmodel$merge, viewmodel$register, viewmodel$release, viewmodel$set, viewmodel$splice, viewmodel$teardown, viewmodel$unregister, createComputations, adaptConfig );

	/* Ractive/initialise.js */
	var Ractive_initialise = function( config, create, getElement, getNextNumber, Viewmodel, Fragment ) {

		return function initialiseRactiveInstance( ractive ) {
			var options = arguments[ 1 ];
			if ( options === void 0 )
				options = {};
			initialiseProperties( ractive, options );
			// init config from Parent and options
			config.init( ractive.constructor, ractive, options );
			// TEMPORARY. This is so we can implement Viewmodel gradually
			ractive.viewmodel = new Viewmodel( ractive );
			// hacky circular problem until we get this sorted out
			// if viewmodel immediately processes computed properties,
			// they may call ractive.get, which calls ractive.viewmodel,
			// which hasn't been set till line above finishes.
			ractive.viewmodel.compute();
			// Render our *root fragment*
			if ( ractive.template ) {
				ractive.fragment = new Fragment( {
					template: ractive.template,
					root: ractive,
					owner: ractive
				} );
			}
			ractive.viewmodel.applyChanges();
			// render automatically ( if `el` is specified )
			tryRender( ractive );
		};

		function tryRender( ractive ) {
			var el;
			if ( el = getElement( ractive.el ) ) {
				var wasEnabled = ractive.transitionsEnabled;
				// Temporarily disable transitions, if `noIntro` flag is set
				if ( ractive.noIntro ) {
					ractive.transitionsEnabled = false;
				}
				// If the target contains content, and `append` is falsy, clear it
				if ( el && !ractive.append ) {
					// Tear down any existing instances on this element
					if ( el.__ractive_instances__ ) {
						try {
							el.__ractive_instances__.splice( 0, el.__ractive_instances__.length ).forEach( function( r ) {
								return r.teardown();
							} );
						} catch ( err ) {}
					}
					el.innerHTML = '';
				}
				ractive.render( el, ractive.append );
				// reset transitionsEnabled
				ractive.transitionsEnabled = wasEnabled;
			}
		}

		function initialiseProperties( ractive, options ) {
			// Generate a unique identifier, for places where you'd use a weak map if it
			// existed
			ractive._guid = getNextNumber();
			// events
			ractive._subs = create( null );
			// storage for item configuration from instantiation to reset,
			// like dynamic functions or original values
			ractive._config = {};
			// two-way bindings
			ractive._twowayBindings = create( null );
			// animations (so we can stop any in progress at teardown)
			ractive._animations = [];
			// nodes registry
			ractive.nodes = {};
			// live queries
			ractive._liveQueries = [];
			ractive._liveComponentQueries = [];
			// If this is a component, store a reference to the parent
			if ( options._parent && options._component ) {
				ractive._parent = options._parent;
				ractive.component = options._component;
				// And store a reference to the instance on the component
				options._component.instance = ractive;
			}
		}
	}( config, create, getElement, getNextNumber, Viewmodel, Fragment );

	/* extend/initChildInstance.js */
	var initChildInstance = function( initialise ) {

		// The Child constructor contains the default init options for this class
		return function initChildInstance( child, Child, options ) {
			if ( child.beforeInit ) {
				child.beforeInit( options );
			}
			initialise( child, options );
		};
	}( Ractive_initialise );

	/* extend/childOptions.js */
	var childOptions = function( wrapPrototype, wrap, config, circular ) {

		var Ractive,
			// would be nice to not have these here,
			// they get added during initialise, so for now we have
			// to make sure not to try and extend them.
			// Possibly, we could re-order and not add till later
			// in process.
			blacklisted = {
				'_parent': true,
				'_component': true
			},
			childOptions = {
				toPrototype: toPrototype,
				toOptions: toOptions
			},
			registries = config.registries;
		config.keys.forEach( function( key ) {
			return blacklisted[ key ] = true;
		} );
		circular.push( function() {
			Ractive = circular.Ractive;
		} );
		return childOptions;

		function toPrototype( parent, proto, options ) {
			for ( var key in options ) {
				if ( !( key in blacklisted ) && options.hasOwnProperty( key ) ) {
					var member = options[ key ];
					// if this is a method that overwrites a method, wrap it:
					if ( typeof member === 'function' ) {
						member = wrapPrototype( parent, key, member );
					}
					proto[ key ] = member;
				}
			}
		}

		function toOptions( Child ) {
			if ( !( Child.prototype instanceof Ractive ) ) {
				return Child;
			}
			var options = {};
			while ( Child ) {
				registries.forEach( function( r ) {
					addRegistry( r.useDefaults ? Child.prototype : Child, options, r.name );
				} );
				Object.keys( Child.prototype ).forEach( function( key ) {
					if ( key === 'computed' ) {
						return;
					}
					var value = Child.prototype[ key ];
					if ( !( key in options ) ) {
						options[ key ] = value._method ? value._method : value;
					} else if ( typeof options[ key ] === 'function' && typeof value === 'function' && options[ key ]._method ) {
						var result, needsSuper = value._method;
						if ( needsSuper ) {
							value = value._method;
						}
						// rewrap bound directly to parent fn
						result = wrap( options[ key ]._method, value );
						if ( needsSuper ) {
							result._method = result;
						}
						options[ key ] = result;
					}
				} );
				if ( Child._parent !== Ractive ) {
					Child = Child._parent;
				} else {
					Child = false;
				}
			}
			return options;
		}

		function addRegistry( target, options, name ) {
			var registry, keys = Object.keys( target[ name ] );
			if ( !keys.length ) {
				return;
			}
			if ( !( registry = options[ name ] ) ) {
				registry = options[ name ] = {};
			}
			keys.filter( function( key ) {
				return !( key in registry );
			} ).forEach( function( key ) {
				return registry[ key ] = target[ name ][ key ];
			} );
		}
	}( wrapPrototypeMethod, wrapMethod, config, circular );

	/* extend/_extend.js */
	var Ractive_extend = function( create, defineProperties, getGuid, config, initChildInstance, Viewmodel, childOptions ) {

		return function extend() {
			var options = arguments[ 0 ];
			if ( options === void 0 )
				options = {};
			var Parent = this,
				Child, proto, staticProperties;
			// if we're extending with another Ractive instance, inherit its
			// prototype methods and default options as well
			options = childOptions.toOptions( options );
			// create Child constructor
			Child = function( options ) {
				initChildInstance( this, Child, options );
			};
			proto = create( Parent.prototype );
			proto.constructor = Child;
			staticProperties = {
				// each component needs a guid, for managing CSS etc
				_guid: {
					value: getGuid()
				},
				// alias prototype as defaults
				defaults: {
					value: proto
				},
				// extendable
				extend: {
					value: extend,
					writable: true,
					configurable: true
				},
				// Parent - for IE8, can't use Object.getPrototypeOf
				_parent: {
					value: Parent
				}
			};
			defineProperties( Child, staticProperties );
			// extend configuration
			config.extend( Parent, proto, options );
			Viewmodel.extend( Parent, proto );
			// and any other properties or methods on options...
			childOptions.toPrototype( Parent.prototype, proto, options );
			Child.prototype = proto;
			return Child;
		};
	}( create, defineProperties, getGuid, config, initChildInstance, Viewmodel, childOptions );

	/* Ractive.js */
	var Ractive = function( defaults, easing, interpolators, svg, magic, defineProperties, proto, Promise, extendObj, extend, parse, initialise, circular ) {

		var Ractive, properties;
		// Main Ractive required object
		Ractive = function( options ) {
			initialise( this, options );
		};
		// Ractive properties
		properties = {
			// static methods:
			extend: {
				value: extend
			},
			parse: {
				value: parse
			},
			// Namespaced constructors
			Promise: {
				value: Promise
			},
			// support
			svg: {
				value: svg
			},
			magic: {
				value: magic
			},
			// version
			VERSION: {
				value: '0.5.5'
			},
			// Plugins
			adaptors: {
				writable: true,
				value: {}
			},
			components: {
				writable: true,
				value: {}
			},
			decorators: {
				writable: true,
				value: {}
			},
			easing: {
				writable: true,
				value: easing
			},
			events: {
				writable: true,
				value: {}
			},
			interpolators: {
				writable: true,
				value: interpolators
			},
			partials: {
				writable: true,
				value: {}
			},
			transitions: {
				writable: true,
				value: {}
			}
		};
		// Ractive properties
		defineProperties( Ractive, properties );
		Ractive.prototype = extendObj( proto, defaults );
		Ractive.prototype.constructor = Ractive;
		// alias prototype as defaults
		Ractive.defaults = Ractive.prototype;
		// Certain modules have circular dependencies. If we were bundling a
		// module loader, e.g. almond.js, this wouldn't be a problem, but we're
		// not - we're using amdclean as part of the build process. Because of
		// this, we need to wait until all modules have loaded before those
		// circular dependencies can be required.
		circular.Ractive = Ractive;
		while ( circular.length ) {
			circular.pop()();
		}
		// Ractive.js makes liberal use of things like Array.prototype.indexOf. In
		// older browsers, these are made available via a shim - here, we do a quick
		// pre-flight check to make sure that either a) we're not in a shit browser,
		// or b) we're using a Ractive-legacy.js build
		var FUNCTION = 'function';
		if ( typeof Date.now !== FUNCTION || typeof String.prototype.trim !== FUNCTION || typeof Object.keys !== FUNCTION || typeof Array.prototype.indexOf !== FUNCTION || typeof Array.prototype.forEach !== FUNCTION || typeof Array.prototype.map !== FUNCTION || typeof Array.prototype.filter !== FUNCTION || typeof window !== 'undefined' && typeof window.addEventListener !== FUNCTION ) {
			throw new Error( 'It looks like you\'re attempting to use Ractive.js in an older browser. You\'ll need to use one of the \'legacy builds\' in order to continue - see http://docs.ractivejs.org/latest/legacy-builds for more information.' );
		}
		return Ractive;
	}( options, easing, interpolators, svg, magic, defineProperties, prototype, Promise, extend, Ractive_extend, parse, Ractive_initialise, circular );


	// export as Common JS module...
	if ( typeof module !== "undefined" && module.exports ) {
		module.exports = Ractive;
	}

	// ... or as AMD module
	else if ( typeof define === "function" && define.amd ) {
		define( function() {
			return Ractive;
		} );
	}

	// ... or as browser global
	global.Ractive = Ractive;

	Ractive.noConflict = function() {
		global.Ractive = noConflict;
		return Ractive;
	};

}( typeof window !== 'undefined' ? window : this ) );

},{}],52:[function(require,module,exports){
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

},{}]},{},[9])