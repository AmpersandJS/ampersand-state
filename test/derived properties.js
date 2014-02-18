var Statey = require('../statey');


exports.setUp = function (cb) {
    this.Person = Statey.extend({
        props: {
            name: 'string'
        }
    });
    cb();
};

exports['cached derived properties are calculated once per change'] = function (test) {
    var count = 0;
    var Person = this.Person.extend({
        derived: {
            greeting: {
                deps: ['name'],
                fn: function () {
                    count++;
                    return 'hi, ' + this.name + '!';
                }
            }
        }
    });
    var person = new Person({name: 'henrik'});
    test.equal(person.greeting, 'hi, henrik!');

    // use again, should not increment counter
    person.greeting;
    test.equal(count, 1);

    person.name = 'something';
    test.equal(person.greeting, 'hi, something!');
    // reference again
    person.greeting;
    test.equal(count, 2);

    test.done();
};

exports['cached derived properties fire events on dependency change'] = function (test) {
    var Person = this.Person.extend({
        derived: {
            greeting: {
                deps: ['name'],
                fn: function () {
                    return 'hi, ' + this.name + '!';
                }
            }
        }
    });
    var person = new Person({name: 'henrik'});
    person.on('change:greeting', function (model, value) {
        test.equal(value, 'hi, something!', "shouldn't fire if value is unchanged same value");
        test.done();
    });
    person.name = 'something';
};

exports['cached derived properties fire events if result is different'] = function (test) {
    test.expect(1);
    var Person = this.Person.extend({
        derived: {
            greeting: {
                deps: ['name'],
                fn: function () {
                    return 'hi, ' + this.name + '!';
                }
            }
        }
    });
    var person = new Person({name: 'henrik'});
    person.on('change:greeting', function (model, value) {
        test.ok(false, "shouldn't fire if value if derived value is unchanged");
    });
    person.name = 'henrik';
    test.equal(person.name, 'henrik');
    test.done();
};

exports['uncached derived properties always fire events on dependency change'] = function (test) {
    test.expect(1);
    var Person = this.Person.extend({
        derived: {
            greeting: {
                deps: ['name'],
                cache: false,
                fn: function () {
                    return 'hello!';
                }
            }
        }
    });
    var person = new Person({name: 'henrik'});
    person.on('change:greeting', function (model, value) {
        test.equal(value, 'hello!', "Fires despite being same value");
        test.done();
    });
    person.name = 'different';
};

