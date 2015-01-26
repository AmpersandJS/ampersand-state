function makeLink(name) {
    return "See http://ampersandjs.com/errors/ampersand-state#" + name + ".";
}
function extendError(ErrorClass, BaseError) {
    ErrorClass.prototype = BaseError();
    return ErrorClass;
}

function PropertyTypeError(attr, expectedType, actualValue, actualType) {
    this.name = 'PropertyTypeError';
    this.message = [
        "Property '" + attr + "' must be of type '" + expectedType + "'.",
        "Tried to set " + actualValue + " which is a '" + actualType + "'.",
        makeLink('ampersand-state', this.name)
    ].join(' ');
}

function PropertyRequiredError(attr, expectedType, newVal) {
    this.name = 'PropertyRequiredError';
    this.message = [
        "Property '" + attr + "' is required and must be of type '" + expectedType + "'.",
        "Tried to set " + newVal + ".",
        makeLink(this.name)
    ].join(' ');
}

function PropertyNullError(attr, expectedType, newVal) {
    this.name = 'PropertyNullError';
    this.message = [
        "Property '" + attr + "' must be of type '" + expectedType + "' (cannot be null).",
        "Tried to set " + newVal + ".",
        makeLink(this.name)
    ].join(' ');
}

function PropertyAlreadySetError(attr) {
    this.name = "PropertyAlreadySetError";
    this.message = "Property '" + attr + "' can only be set once. " + makeLink(this.name);
}

function PropertyValuesError(attr, values, val) {
    this.name = 'PropertyValuesError';
    this.message = [
        "Property '" + attr + "' must be one of values: " + values.join(', ') + ".",
        "Tried to set " + val + ".",
        makeLink(this.name)
    ].join(' ');
}

function PropertyValidationError(attr, err) {
    //in case actual error object
    if (err.message) { err = err.message; } 

    this.name = 'PropertyValidationError';
    this.message = [
        "Property '" + attr + "' failed validation with error: " + err,
        makeLink(this.name)
    ].join(' ');
}

function UnregisteredDataTypeError(attr, type) {
    this.name = "UnregisteredDataTypeError";
    this.message = [
        "Unregistered dataType: " + type + " for property " + attr,
        makeLink(this.name)
    ].join(' ');
}

module.exports = {
    PropertyTypeError: extendError(PropertyTypeError, TypeError),
    PropertyRequiredError: extendError(PropertyRequiredError, TypeError),
    PropertyNullError: extendError(PropertyNullError, TypeError),
    PropertyAlreadySetError: extendError(PropertyAlreadySetError, TypeError),
    PropertyValuesError: extendError(PropertyValuesError, TypeError),
    UnregisteredDataTypeError: extendError(UnregisteredDataTypeError, TypeError),
};
