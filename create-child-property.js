var _ = require('underscore');
var createPropertyDefinition = require('./create-property-definition');

module.exports = function createChildProperty(object, name, options) {
    if (!options.constructor) {
        throw "options.constructor is required";
    }
    createPropertyDefinition(object, name, {
        parse: function (newVal) {
            if (_.isObject(newVal) && !(newVal.isState)) {
                newVal = new options.constructor(newVal, {parent: this});
                this.listenTo(newVal, 'all', this._getEventBubblingHandler(name));
            }
            return newVal;
        },
        test: function (newVal, newType) {
            if (!(newVal instanceof options.constructor)) {
                return new Error("Must be an instance of the right thing");
            }
        },
        default: function () {
            var newVal = new options.constructor({}, {parent: this});
            this.listenTo(newVal, 'all', this._getEventBubblingHandler(name));
            return newVal;
        }
    }, false);
};
