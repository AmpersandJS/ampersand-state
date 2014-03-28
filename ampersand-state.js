var _ = require('underscore');
var BBEvents = require('backbone-events-standalone');
var propertyUtils = require('./properties');
var dataTypes = require('./dataTypes');


function Base(attrs, options) {
    options || (options = {});
    this.cid = _.uniqueId('model');
    // set collection/registry if passed in
    this.collection = options.collection;
    if (options.registry) this.registry = options.registry;
    if (options.parse) attrs = this.parse(attrs, options);
    this._initted = false;
    this._values = {};
    this._initCollections();
    this._cache = {};
    this._previousAttributes = {};
    this._events = {};
    if (attrs) this.set(attrs, _.extend({silent: true, initial: true}, options));
    this._changed = {};
    this.initialize.apply(this, arguments);
    if (attrs && attrs[this.idAttribute] && this.registry) _.result(this, 'registry').store(this);
    this._initted = true;
    if (this.seal) Object.seal(this);
}


_.extend(Base.prototype, BBEvents, {
    // getter for attributes
    get attributes() {
        return this._getAttributes(true);
    },

    // getter for derived properties
    get derived() {
        var res = {};
        for (var item in this._derived) res[item] = this._derived[item].fn.apply(this);
        return res;
    },

    idAttribute: 'id',

    namespaceAttribute: 'namespace',

    _derived: {},
    _deps: {},
    _definition: {},

    // can be allow, ignore, reject
    extraProperties: 'ignore',

    getId: function () {
        return this[this.idAttribute];
    },

    getNamespace: function () {
        return this[this.namespaceAttribute];
    },

    // stubbed out to be overwritten
    initialize: function () {
        return this;
    },

    // backbone compatibility
    parse: function (resp, options) {
        return resp;
    },

    // serialize gets props in raw form
    serialize: function () {
        return this._getAttributes(false, true);
    },

    set: function (key, value, options) {
        var self = this;
        var extraProperties = this.extraProperties;
        var changing, previous, changes, newType,
            interpretedType, newVal, def, attr, attrs, silent, unset, currentVal, initial;

        // Handle both `"key", value` and `{key: value}` -style arguments.
        if (_.isObject(key) || key === null) {
            attrs = key;
            options = value;
        } else {
            attrs = {};
            attrs[key] = value;
        }

        options = options || {};

        if (!this._validate(attrs, options)) return false;

        // Extract attributes and options.
        unset = options.unset;
        silent = options.silent;
        initial = options.initial;

        changes = [];
        changing = this._changing;
        this._changing = true;

        // if not already changing, store previous
        if (!changing) {
            this._previousAttributes = this._getAttributes(true);
            this._changed = {};
        }
        previous = this._previousAttributes;

        // For each `set` attribute...
        for (attr in attrs) {
            newVal = attrs[attr];
            newType = typeof newVal;
            currentVal = this._values[attr];
            def = this._definition[attr];

            if (!def) {
                if (extraProperties === 'ignore') {
                    continue;
                } else if (extraProperties === 'reject') {
                    throw new TypeError('No "' + attr + '" property defined on ' + (this.type || 'this') + ' model and allowOtherProperties not set.');
                } else if (extraProperties === 'allow') {
                    def = this._createPropertyDefinition(attr, 'any');
                }
            }

            // check type if we have one
            if (dataTypes[def.type]) {
                var cast = dataTypes[def.type].set(newVal);
                newVal = cast.val;
                newType = cast.type;
            }

            // If we've defined a test, run it
            if (def.test) {
                var err = def.test.call(this, newVal, newType);
                if (err) {
                    throw new TypeError('Property \'' + attr + '\' failed validation with error: ' + err);
                }
            }

            // If we are required but undefined, throw error.
            // If we are null and are not allowing null, throw error
            // If we have a defined type and the new type doesn't match, and we are not null, throw error.

            if (_.isUndefined(newVal) && def.required) {
                throw new TypeError('Required property \'' + attr + '\' must be of type ' + def.type + '. Tried to set ' + newVal);
            }
            if (_.isNull(newVal) && def.required && !def.allowNull) {
                throw new TypeError('Property \'' + attr + '\' must be of type ' + def.type + ' (cannot be null). Tried to set ' + newVal);
            }
            if ((def.type && def.type !== 'any' && def.type !== newType) && !_.isNull(newVal) && !_.isUndefined(newVal)) {
                throw new TypeError('Property \'' + attr + '\' must be of type ' + def.type + '. Tried to set ' + newVal);
            }
            if (def.values && !_.contains(def.values, newVal)) {
                throw new TypeError('Property \'' + attr + '\' must be one of values: ' + def.values.join(', '));
            }

            // enforce `setOnce` for properties if set
            if (def.setOnce && currentVal !== undefined && !_.isEqual(currentVal, newVal)) {
                throw new TypeError('Property \'' + key + '\' can only be set once.');
            }

            // push to changes array if different
            if (!_.isEqual(currentVal, newVal)) {
                changes.push({prev: currentVal, val: newVal, key: attr});
            }

            // keep track of changed attributes
            if (!_.isEqual(previous[attr], newVal)) {
                self._changed[attr] = newVal;
            } else {
                delete self._changed[attr];
            }
        }

        // actually update our values
        _.each(changes, function (change) {
            self._previousAttributes[change.key] = change.prev;
            if (unset) {
                delete self._values[change.key];
            } else {
                self._values[change.key] = change.val;
            }
        });

        var triggers = [];

        function gatherTriggers(key) {
            triggers.push(key);
            _.each((self._deps[key] || []), function (derTrigger) {
                gatherTriggers(derTrigger);
            });
        }

        if (!silent && changes.length) self._pending = true;
        _.each(changes, function (change) {
            gatherTriggers(change.key);
        });

        _.each(_.uniq(triggers), function (key) {
            var derived = self._derived[key];
            if (derived && derived.cache && !initial) {
                var oldDerived = self._cache[key];
                var newDerived = self._getDerivedProperty(key, true);
                if (!_.isEqual(oldDerived, newDerived)) {
                    self._previousAttributes[key] = oldDerived;
                    if (!silent) self.trigger('change:' + key, self, newDerived);
                }
            } else {
                if (!silent) self.trigger('change:' + key, self, self[key]);
            }
        });

        // You might be wondering why there's a `while` loop here. Changes can
        // be recursively nested within `"change"` events.
        if (changing) return this;
        if (!silent) {
            while (this._pending) {
                this._pending = false;
                this.trigger('change', this, options);
            }
        }
        this._pending = false;
        this._changing = false;
        return this;
    },

    get: function (attr) {
        return this[attr];
    },

    // Toggle boolean properties or properties that have a `values`
    // array in its definition.
    toggle: function (property) {
        var def = this._definition[property];
        if (def.type === 'boolean') {
            // if it's a bool, just flip it
            this[property] = !this[property];
        } else if (def && def.values) {
            // If it's a property with an array of values
            // skip to the next one looping back if at end.
            this[property] = arrayNext(def.values, this[property]);
        } else {
            throw new TypeError('Can only toggle properties that are type `boolean` or have `values` array.');
        }
        return this;
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function () {
        return _.clone(this._previousAttributes);
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function (attr) {
        if (attr == null) return !_.isEmpty(this._changed);
        return _.has(this._changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function (diff) {
        if (!diff) return this.hasChanged() ? _.clone(this._changed) : false;
        var val, changed = false;
        var old = this._changing ? this._previousAttributes : this._getAttributes(true);
        for (var attr in diff) {
            if (_.isEqual(old[attr], (val = diff[attr]))) continue;
            (changed || (changed = {}))[attr] = val;
        }
        return changed;
    },

    toJSON: function () {
        return this.serialize();
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function (attr) {
        return this.get(attr) != null;
    },

    // return copy of model
    clone: function () {
        return new this.constructor(this._getAttributes(true));
    },

    unset: function (attr, options) {
        var def = this._definition[attr];
        var type = def.type;
        var val;
        if (def.required) {
            if (!_.isUndefined(def.default)) {
                val = def.default;
            } else {
                val = this._getDefaultForType(type);
            }
            return this.set(attr, val, options);
        } else {
            return this.set(attr, val, _.extend({}, options, {unset: true}));
        }
    },

    clear: function (options) {
        var self = this;
        _.each(this._getAttributes(true), function (val, key) {
            self.unset(key, options);
        });
        return this;
    },

    previous: function (attr) {
        if (attr == null || !Object.keys(this._previousAttributes).length) return null;
        return this._previousAttributes[attr];
    },

    // Get default values for a certain type
    _getDefaultForType: function (type) {
        if (type === 'string') {
            return '';
        } else if (type === 'object') {
            return {};
        } else if (type === 'array') {
            return [];
        }
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function (attrs, options) {
        if (!options.validate || !this.validate) return true;
        attrs = _.extend({}, this.attributes, attrs);
        var error = this.validationError = this.validate(attrs, options) || null;
        if (!error) return true;
        this.trigger('invalid', this, error, _.extend(options || {}, {validationError: error}));
        return false;
    },

    _createPropertyDefinition: function (name, desc, isSession) {
        propertyUtils.createPropertyDefinition(this, name, desc, isSession);
    },

    // just makes friendlier errors when trying to define a new model
    // only used when setting up original property definitions
    _ensureValidType: function (type) {
        return _.contains(['string', 'number', 'boolean', 'array', 'object', 'date', 'any'].concat(_.keys(dataTypes)), type) ? type : undefined;
    },

    _getAttributes: function (includeSession, raw) {
        var res = {};
        var val, item, def;
        for (item in this._definition) {
            def = this._definition[item];
            if (!def.session || (includeSession && def.session)) {
                val = (raw) ? this._values[item] : this[item];
                if (typeof val === 'undefined') val = def.default;
                if (typeof val !== 'undefined') res[item] = val;
            }
        }
        return res;
    },

    _getDerivedProperty: function (name, flushCache) {
        // is this a derived property that is cached
        if (this._derived[name].cache) {
            //set if this is the first time, or flushCache is set
            if (flushCache || !this._cache.hasOwnProperty(name)) {
                this._cache[name] = this._derived[name].fn.apply(this);
            }
            return this._cache[name];
        } else {
            return this._derived[name].fn.apply(this);
        }
    },

    _initCollections: function () {
        var coll;
        if (!this._collections) return;
        for (coll in this._collections) {
            this[coll] = new this._collections[coll]();
            this[coll].parent = this;
        }
    },

    // Check that all required attributes are present
    _verifyRequired: function () {
        var attrs = this._getAttributes(true); // should include session
        for (var def in this._definition) {
            if (this._definition[def].required && typeof attrs[def] === 'undefined') {
                return false;
            }
        }
        return true;
    }
});


var extend = function (protoProps) {
    var parent = this;
    var child;
    var args = [].slice.call(arguments);

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
        child = protoProps.constructor;
    } else {
        child = function () {
            return parent.apply(this, arguments);
        };
    }

    // Add static properties to the constructor function from parent
    _.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // Mix in all prototype properties to the subclass if supplied.
    if (protoProps) {
        args.forEach(function processArg(def) {
            _.each(def, function (value, key) {
                if (key === 'props' || key === 'session') {
                    _.each(value, function (def, name) {
                        propertyUtils.createPropertyDefinition(child.prototype, name, def, key === 'session');
                    });
                } else if (key === 'derived') {
                    _.each(value, function (def, name) {
                        propertyUtils.createDerivedProperty(child.prototype, name, def);
                    });
                } else if (key === 'collections') {
                    _.each(value, function (constructor, name) {
                        child.prototype._collections[name] = constructor;
                    });
                }
            });
            delete def.props;
            delete def.session;
            delete def.derived;
            delete def.collections;
            _.extend(child.prototype, def);
        });
    }

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
};

// also expose data types in our export
Base.dataTypes = dataTypes;
Base.extend = extend;

// Our main exports
module.exports = Base;
