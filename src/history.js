
/*
Basic helper functions
 */

/*
 * Checks if given value is type of something
 */
var History, deepGet, deepSet, define, fixNumber, historyObject, isInList, isType, redo, remove, undo;

isType = function(val, type) {
  var classToType;
  classToType = {
    '[object Boolean]': 'boolean',
    '[object Number]': 'number',
    '[object String]': 'string',
    '[object Function]': 'function',
    '[object Array]': 'array',
    '[object Date]': 'date',
    '[object RegExp]': 'regexp',
    '[object Object]': 'object',
    '[object Null]': 'null',
    '[object Undefined]': 'undefined'
  };
  return classToType[Object.prototype.toString.call(val)] === type;
};

fixNumber = function(val) {
  if (isType(val, "number")) {
    val = +val;
  }
  return val;
};


/*
 * Reads value from object through path
 * @param obj {Object}
 * @param path {String} - e.g. 'a.foo.1.bar'
 */

deepGet = function(obj, path) {
  var key;
  if (!isType(path, "array")) {
    path = (path.split(".")).reverse().map(fixNumber);
  }
  key = path.pop();
  if (path.length === 0 || !Object.prototype.hasOwnProperty.call(obj, key)) {
    return obj[key];
  }
  return deepGet(obj[key], path);
};


/*
 * Writes value to object through path
 * @param obj {Object}
 * @param path {String} - e.g. 'a.foo.bar'
 * @param value {Mixed}
 * @param create {Boolean} - whether it should build non-existent tree or not
 */

deepSet = function(obj, path, value, create) {
  var key;
  if ((create == null) || create === void 0) {
    create = true;
  }
  if (!isType(path, "array")) {
    path = (path.split(".")).reverse().map(fixNumber);
  }
  key = path.pop();
  if (path.length === 0) {
    return obj[key] = value;
  }
  if (!Object.prototype.hasOwnProperty.call(obj, key) || obj[key] === void 0) {
    if (create === true) {
      if (isType(path[path.length - 1], "number")) {
        obj[key] = [];
      } else {
        obj[key] = {};
      }
    } else {
      throw new Error("Value not set, because creation is set to false!");
    }
  }
  console.log(obj, path, value);
  deepSet(obj[key], path, value, create);
};


/*
 * Checks if path is in a whitelisted place
 */

isInList = function(path, whitelist) {
  var item, matches, _i, _len;
  if ((whitelist == null) || whitelist === void 0 || whitelist.length === 0) {
    return true;
  }
  matches = 0;
  for (_i = 0, _len = whitelist.length; _i < _len; _i++) {
    item = whitelist[_i];
    if (path.indexOf(item) !== -1 || item.indexOf(path) !== -1) {
      matches++;
    }
  }
  return matches > 0;
};


/*
End of helper functions
 */

undo = function(store) {
  var step;
  if (store.__History__._backwards.length === 0) {
    return;
  }
  store.__History__.options.bypassRecording = true;
  store.__History__.options.emptyOnSet = false;
  step = store.__History__._backwards.pop();
  switch (step.type) {
    case "delete":
      (function(origin, store, step) {
        define.call(origin, store, step.path, step.value);
        return store.__History__._forwards.push({
          path: step.path,
          value: step.value,
          type: "delete"
        });
      })(this, store, step);
      break;
    case "add":
      (function(origin, store, step) {
        var key, obj, path, savePath;
        path = step.path.split(".");
        key = path.pop();
        savePath = path.join(".");
        obj = deepGet(origin, savePath);
        remove.call(origin, store, obj, step.path, key);
        return store.__History__._forwards.push({
          path: step.path,
          value: step.value,
          type: "add"
        });
      })(this, store, step);
      break;
    case "update":
      (function(origin, store, step) {
        store.__History__._forwards.push({
          path: step.path,
          value: deepGet(origin, step.path),
          type: "update"
        });
        return deepSet(origin, step.path, step.value);
      })(this, store, step);
  }
  store.__History__.options.emptyOnSet = true;
  store.__History__.options.bypassRecording = false;
};

redo = function(store) {
  var step;
  if (store.__History__._forwards.length === 0) {
    return;
  }
  store.__History__.options.bypassRecording = true;
  store.__History__.options.emptyOnSet = false;
  step = store.__History__._forwards.pop();
  switch (step.type) {
    case "delete":
      (function(origin, store, step) {
        var key, obj, path, savePath;
        path = step.path.split(".");
        key = path.pop();
        savePath = path.join(".");
        obj = deepGet(origin, savePath);
        remove.call(origin, store, obj, step.path, key);
        return store.__History__._backwards.push({
          path: step.path,
          value: step.value,
          type: "delete"
        });
      })(this, store, step);
      break;
    case "add":
      (function(origin, store, step) {
        define.call(origin, store, step.path, step.value);
        return store.__History__._backwards.push({
          path: step.path,
          value: step.value,
          type: "add"
        });
      })(this, store, step);
      break;
    case "update":
      (function(origin, store, step) {
        store.__History__._backwards.push({
          path: step.path,
          value: deepGet(origin, step.path),
          type: "update"
        });
        return deepSet(origin, step.path, step.value);
      })(this, store, step);
  }
  store.__History__.options.emptyOnSet = true;
  store.__History__.options.bypassRecording = false;
};

define = function(store, path, value) {
  if (deepGet(this, path) === void 0) {
    deepSet(this, path, value, true);
  }
  store.__History__.record({
    path: path,
    value: value,
    type: "add"
  });
  historyObject.config.observe(this, [path]);
};

remove = function(store, obj, path, key) {
  store.__History__.record({
    path: path,
    value: obj[key],
    type: "delete"
  });
  delete obj[key];
};

module.exports = historyObject = {
  config: {
    store: "self",
    defaultWhitelist: [],
    enableExtension: false,
    enableDeep: true,
    enableDefine: true,
    enableRemove: true,
    enableObserve: true,
    enableUnobserve: true
  },
  "class": History = (function() {
    function History(origin) {
      this.origin = origin;
      this._backwards = [];
      this._forwards = [];
    }

    History.prototype.options = {
      maxLength: 100,
      emptyOnSet: true,
      bypassRecording: false
    };

    History.prototype.record = function(state) {
      if (this.options.bypassRecording === true) {
        return;
      }
      if (state.type === void 0) {
        state.type = "update";
      }
      this._backwards.push(state);
      if (this.options.emptyOnSet === true) {
        this._forwards = [];
      }
      if (this._backwards.length > this.options.maxLength) {
        this._backwards.shift();
      }
    };

    return History;

  })(),
  observe: function(obj, whitelist, extension, deep, origin, path) {
    var extendPath, keys, prop, savePath, store, _fn, _fn1, _i, _j, _len, _len1;
    if (whitelist == null) {
      whitelist = historyObject.config.defaultWhitelist;
    }
    if (extension == null) {
      extension = historyObject.config.enableExtension;
    }
    if (deep == null) {
      deep = historyObject.config.enableDeep;
    }
    if ((origin == null) || origin === void 0) {
      origin = obj;
    }
    if (historyObject.config.store === "self") {
      store = origin;
    }
    if (historyObject.config.store !== "self" && isType(historyObject.config.store, "object")) {
      store = historyObject.config.store;
    }
    if ((path == null) || path === void 0) {
      path = [];
    }
    if (!isType(path, "array")) {
      path = path.split(".");
    }
    savePath = path.join(".");
    if (extension === true && isType(whitelist, "array")) {
      _fn = function(extendPath) {
        if (deepGet(obj, extendPath) === void 0) {
          deepSet(obj, extendPath, null, true);
        }
      };
      for (_i = 0, _len = whitelist.length; _i < _len; _i++) {
        extendPath = whitelist[_i];
        _fn(extendPath);
      }
    }
    extension = false;
    if (!store.hasOwnProperty("__History__")) {
      Object.defineProperty(store, "__History__", {
        enumerable: false,
        configurable: true,
        value: new historyObject["class"](origin)
      });
    }
    if (!store.hasOwnProperty("undo")) {
      Object.defineProperty(store, "undo", {
        configurable: true,
        enumerable: false,
        writable: false,
        value: function(n) {
          if (!isType(n, "number")) {
            n = 1;
          }
          while (n--) {
            undo.call(origin, store);
          }
        }
      });
    }
    if (!store.hasOwnProperty("redo")) {
      Object.defineProperty(store, "redo", {
        configurable: true,
        enumerable: false,
        writable: false,
        value: function(n) {
          if (!isType(n, "number")) {
            n = 1;
          }
          while (n--) {
            redo.call(origin, store);
          }
        }
      });
    }
    if (isType(obj, "object") || isType(obj, "array")) {
      if (!obj.hasOwnProperty("define") && historyObject.config.enableDefine === true) {
        (function(origin, store, obj, path) {
          return Object.defineProperty(obj, "define", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: function(key, value) {
              path.push(key);
              savePath = path.join(".");
              path.pop();
              define.call(origin, store, savePath, value);
            }
          });
        })(origin, store, obj, path);
      }
      if (!obj.hasOwnProperty("remove") && historyObject.config.enableRemove === true) {
        (function(origin, store, obj, path) {
          return Object.defineProperty(obj, "remove", {
            configurable: true,
            enumerable: false,
            writable: false,
            value: function(key) {
              path.push(key);
              savePath = path.join(".");
              path.pop();
              remove.call(origin, store, obj, savePath, key);
            }
          });
        })(origin, store, obj, path);
      }
    }
    if (!obj.hasOwnProperty("unobserve") && historyObject.config.enableUnobserve === true) {
      Object.defineProperty(obj, "unobserve", {
        configurable: true,
        enumerable: false,
        writable: false,
        value: function(path) {
          if ((path == null) || path === void 0) {
            historyObject.unobserve(origin, [savePath]);
          } else {
            historyObject.unobserve(obj, [path]);
          }
        }
      });
    }
    if (!obj.hasOwnProperty("observe") && historyObject.config.enableObserve === true) {
      Object.defineProperty(obj, "observe", {
        configurable: true,
        enumerable: false,
        writable: false,
        value: function(path) {
          if ((path == null) || path === void 0) {
            historyObject.observe(origin, [savePath]);
          } else {
            historyObject.observe(obj, [path]);
          }
        }
      });
    }
    keys = Object.keys(obj);
    _fn1 = function(prop) {
      var value;
      value = obj[prop];
      path.push(prop);
      savePath = path.join(".");
      if (isInList(savePath, whitelist)) {
        if ((value != null) && (isType(value, 'object') || isType(value, 'array')) && deep === true) {
          historyObject.observe(value, whitelist, extension, deep, origin, savePath);
        } else {
          (function(store, obj, prop, savePath) {
            Object.defineProperty(obj, prop, {
              enumerable: true,
              configurable: true,
              get: function() {
                return prop;
              },
              set: function(val) {
                var step;
                step = {
                  path: savePath,
                  value: prop
                };
                store.__History__.record(step);
                return prop = val;
              }
            });
            store.__History__.options.bypassRecording = true;
            obj[prop] = value;
            store.__History__.options.bypassRecording = false;
          })(store, obj, prop, savePath);
        }
      }
      path.pop();
    };
    for (_j = 0, _len1 = keys.length; _j < _len1; _j++) {
      prop = keys[_j];
      _fn1(prop);
    }
  },
  unobserve: function(obj, blacklist, path) {
    var prop, val, _fn;
    if ((path == null) || path === void 0) {
      path = [];
    }
    if (!isType(path, "array")) {
      path = path.split(".");
    }
    _fn = function(prop, val) {
      var savePath;
      path.push(prop);
      savePath = path.join(".");
      if (isInList(savePath, blacklist)) {
        if ((val != null) && isType(val, "object") || isType(val, "array")) {
          historyObject.unobserve(val, blacklist, savePath);
        } else {
          if (obj.hasOwnProperty("__History__")) {
            delete obj.__History__;
          }
          if (obj.hasOwnProperty("undo")) {
            delete obj.undo;
          }
          if (obj.hasOwnProperty("redo")) {
            delete obj.redo;
          }
          if (obj.hasOwnProperty("define")) {
            delete obj.define;
          }
          if (obj.hasOwnProperty("remove")) {
            delete obj.remove;
          }
          if (obj.hasOwnProperty("observe")) {
            delete obj.observe;
          }
          if (obj.hasOwnProperty("unobserve")) {
            delete obj.unobserve;
          }
          Object.defineProperty(obj, prop, {
            writable: true,
            configurable: true,
            enumerable: true,
            value: val
          });
        }
      }
      path.pop();
    };
    for (prop in obj) {
      val = obj[prop];
      _fn(prop, val);
    }
  }
};
