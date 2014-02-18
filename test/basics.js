var Statey = require('../statey');


module.exports = {
    setUp: function (cb) {
        this.Person = Statey.extend({
            props: {
                name: 'string'
            }
        });

        this.AwesomePerson = this.Person.extend({
            props: {
                awesomeness: ['number', true, 7]
            },
            awesomeMethod: function () {
                return this.awesomeness;
            }
        });

        this.SuperHero = this.AwesomePerson.extend({
            props: {
                secretName: 'string'
            },
            fly: function () {
                return 'i\'m sad i\'m flying';
            }
        });
        cb();
    },
    'init with values': function (test) {
        var person = new this.Person({name: 'henrik'});
        test.ok(person);
        test.equal(person.name, 'henrik');
        test.done();
    },
    'derived properties': function (test) {
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
    },
    'cached derived events fire on dependency change': function (test) {
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
            test.equal(value, 'hi, something!')
            test.done();
        });

        person.name = 'something';
    }
};

