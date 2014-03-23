var test = require('tape');
var State = require('../ampersand-state');

var Person = State.extend({
    props: {
        name: 'string'
    }
});

test('init with values', function (t) {
    var person = new Person({name: 'henrik'});
    t.ok(person);
    t.equal(person.name, 'henrik');
    t.end();
});

test('extended object maintains existing props', function (t) {
    var AwesomePerson = Person.extend({
        props: {
            awesomeness: 'number'
        }
    });

    var awesome = new AwesomePerson({
        name: 'Captain Awesome',
        awesomeness: 11
    });

    t.equals(awesome.name, 'Captain Awesome');
    t.equals(awesome.awesomeness, 11);
    t.end();
});

test('extended object maintains existing methods', function (t) {
    var Person = State.extend({
        props: {
            awesomeness: 'number'
        },
        isTrulyAwesome: function () {
            if (this.awesomeness > 10) return true;
        }
    });
    var AwesomePerson = Person.extend({});

    var awesome = new AwesomePerson({
        awesomeness: 11
    });

    t.ok(awesome.isTrulyAwesome());
    t.end();
});

test('extended object can have a custom constructor name', function (t) {
    //Default constructor is 'State'
    var BaseState = State.extend({});
    var baseItem = new BaseState();
    t.ok(baseItem.constructor.toString().match(/function State/));

    //Can override constructor name on extend
    var Model = BaseState.extend('Model', { model: true });
    var model = new Model();
    t.ok(model.model);
    t.ok(model.constructor.toString().match(/function Model/));

    //Will maintain overridden down the chain
    var Dog = Model.extend({ dog: true });
    var dog = new Dog();
    t.ok(dog.dog);
    t.ok(dog.constructor.toString().match(/function Model/));

    //Or you can override again
    var MyDog = Dog.extend('MyDog', { myDog: true });
    var myDog = new MyDog();
    t.ok(myDog.myDog);
    t.ok(myDog.constructor.toString().match(/function MyDog/));

    t.end();
});

test('cached derived properties are calculated once per change', function (t) {
    var count = 0;
    var NewPerson = Person.extend({
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
    var person = new NewPerson({name: 'henrik'});
    t.equal(person.greeting, 'hi, henrik!');

    // use again, should not increment counter
    person.greeting;
    t.equal(count, 1);

    person.name = 'something';
    t.equal(person.greeting, 'hi, something!');
    // reference again
    person.greeting;
    t.equal(count, 2);

    t.end();
});

test('cached derived properties fire events on dependency change', function (t) {
    var NewPerson = Person.extend({
        derived: {
            greeting: {
                deps: ['name'],
                fn: function () {
                    return 'hi, ' + this.name + '!';
                }
            }
        }
    });
    var person = new NewPerson({name: 'henrik'});
    person.on('change:greeting', function (model, value) {
        t.equal(value, 'hi, something!', "shouldn't fire if value is unchanged same value");
        t.end();
    });
    person.name = 'something';
});

test('cached derived properties fire events if result is different', function (t) {
    t.plan(1);
    var NewPerson = Person.extend({
        derived: {
            greeting: {
                deps: ['name'],
                fn: function () {
                    return 'hi, ' + this.name + '!';
                }
            }
        }
    });
    var person = new NewPerson({name: 'henrik'});
    person.on('change:greeting', function (model, value) {
        t.ok(false, "shouldn't fire if value if derived value is unchanged");
    });
    person.name = 'henrik';
    t.equal(person.name, 'henrik');
    t.end();
});

test('uncached derived properties always fire events on dependency change', function (t) {
    t.plan(1);
    var NewPerson = Person.extend({
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
    var person = new NewPerson({name: 'henrik'});
    person.on('change:greeting', function (model, value) {
        t.equal(value, 'hello!', "Fires despite being same value");
        t.end();
    });
    person.name = 'different';
});

test('custom id attribute', function (t) {
    var NewPerson = Person.extend({
        props: {
            _id: 'number',
            ns: 'string'
        },
        idAttribute: '_id',
        namespaceAttribute: 'ns'
    });
    var person = new NewPerson({name: 'henrik', ns: 'group1', _id: 47});
    t.equal(person.getId(), 47);
    t.equal(person.getNamespace(), 'group1');
    t.end();
});
