var _ = require('underscore');
var dataTypes = require('./dataTypes');


exports.createPropertyDefinition = function (object, name, desc, isSession) {
    var def = object._definition[name] = {};
    var type;
    if (_.isString(desc)) {
        // grab our type if all we've got is a string
        type = object._ensureValidType(desc);
        if (type) def.type = type;
    } else {
        type = object._ensureValidType(desc[0] || desc.type);
        if (type) def.type = type;
        if (desc[1] || desc.required) def.required = true;
        // set default if defined
        def.default = !_.isUndefined(desc[2]) ? desc[2] : desc.default;
        def.allowNull = desc.allowNull ? desc.allowNull : false;
        if (desc.setOnce) def.setOnce = true;
        if (def.required && _.isUndefined(def.default)) def.default = object._getDefaultForType(type);
        def.test = desc.test;
        def.values = desc.values;
    }
    if (isSession) def.session = true;

    // define a getter/setter on the prototype
    // but they get/set on the instance
    Object.defineProperty(object, name, {
        set: function (val) {
            this.set(name, val);
        },
        get: function () {
            var result = this._values[name];
            if (typeof result !== 'undefined') {
                if (dataTypes[def.type] && dataTypes[def.type].get) {
                    result = dataTypes[def.type].get(result);
                }
                return result;
            }
            return def.default;
        }
    });

    return def;
};


exports.createDerivedProperty = function (modelProto, name, definition) {
    var def = modelProto._derived[name] = {
        fn: _.isFunction(definition) ? definition : definition.fn,
        cache: (definition.cache !== false),
        depList: definition.deps || []
    };

    // add to our shared dependency list
    _.each(def.depList, function (dep) {
        modelProto._deps[dep] = _(modelProto._deps[dep] || []).union([name]);
    });

    // defined a top-level getter for derived names
    Object.defineProperty(modelProto, name, {
        get: function () {
            return this._getDerivedProperty(name);
        },
        set: function () {
            throw new TypeError('"' + name + '" is a derived property, it can\'t be set directly.');
        }
    });
};
