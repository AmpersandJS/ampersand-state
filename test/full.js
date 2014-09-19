var tape = require('tape');
var State = require('../ampersand-state');
var AmpersandRegistry = require('ampersand-registry');
var Collection = require('ampersand-collection');
var definition, Foo, registry;


// wrap test so we always run reset first
var test = function () {
    reset();
    tape.apply(tape, arguments);
};
test.only = function () {
    reset();
    tape.only.apply(tape, arguments);
};

function reset() {
    registry = new AmpersandRegistry();

    definition = {
        type: 'foo',
        props: {
            id: 'number',
            firstName: ['string', true, 'defaults'],
            lastName: ['string', true],
            thing: {
                type: 'string',
                required: true,
                default: 'hi'
            },
            num: ['number', true],
            today: ['date'],
            hash: ['object'],
            list: ['array'],
            myBool: ['boolean', true, false],
            someNumber: {type: 'number', allowNull: true},
            someNull: {type: 'object', default: null},
            good: {
                type: 'string',
                test: function (newVal) {
                    if (newVal !== 'good') {
                        return "Value not good";
                    }
                }
            }
        },
        session: {
            active: ['boolean', true, true]
        },
        derived: {
            name: {
                deps: ['firstName', 'lastName'],
                fn: function () {
                    return this.firstName + ' ' + this.lastName;
                }
            },
            initials: {
                deps: ['firstName', 'lastName'],
                cache: false,
                fn: function () {
                    // This currently breaks without both deps being set
                    if (this.firstName && this.lastName) {
                        return (this.firstName.charAt(0) + this.lastName.charAt(0)).toUpperCase();
                    }
                    return '';
                }
            },
            isCrazy: {
                deps: ['crazyPerson'],
                fn: function () {
                    return !!this.crazyPerson;
                }
            }
        },
        // add a reference to the registry
        registry: registry
    };

    Foo = State.extend(definition);
}

test('should get the derived value', function (t) {
    var foo = new Foo({
        firstName: 'jim',
        lastName: 'tom'
    });
    foo.firstName = 'jim';
    foo.lastName = 'tom';

    t.strictEqual(foo.name, 'jim tom');
    t.strictEqual(foo.initials, 'JT');
    t.end();
});

test('should have default values for properties', function (t) {
    var foo = new Foo({
        firstName: 'jim',
        lastName: 'tom'
    });
    t.strictEqual(foo.myBool, false);
    t.strictEqual(foo.someNull, null);
    t.end();
});

test('should have default array/object properties', function (t) {
    var Bar = State.extend({
        props: {
            list: ['array', true],
            hash: ['object', true]
        }
    });
    var bar = new Bar();
    var otherBar = new Bar();

    t.ok(bar.list !== undefined);
    t.ok(bar.hash !== undefined);

    //Should create unique instances of the defaults
    otherBar.list.push('foo');
    otherBar.hash.foo = 'bar';

    t.ok(bar.list.length === 0);
    t.ok(bar.hash.foo === undefined);

    t.end();
});

test('should throw a useful error setting a default value to an array', function (t) {
    t.plan(2);
    try {
        State.extend({
            props: { list: ['array', true, []] }
        });
    } catch (err) {
        t.ok(err instanceof TypeError);
        t.ok(err.message.match(/value for list cannot be an object\/array/));
    }
});

test('should throw a useful error setting a default value to an object', function (t) {
    t.plan(2);
    try {
        State.extend({
            props: { list: ['array', true, []] }
        });
    } catch (err) {
        t.ok(err instanceof TypeError);
        t.ok(err.message.match(/value for list cannot be an object\/array/));
    }
});

test('a default should be settable as a function which returns a value', function (t) {
    var Foo = State.extend({
        props: {
            anObject: ['object', true, function () { return {foo: 'bar'}; }]
        }
    });

    var foo = new Foo();

    t.deepEqual(foo.anObject, {foo: 'bar'});
    t.end();
});

test('should throw an error setting a derived prop', function (t) {
    t.plan(1);
    var foo = new Foo();
    try { foo.name = 'bob'; }
    catch (err) { t.ok(err instanceof TypeError); }
});

test('Error when setting derived property should be helpful', function (t) {
    var foo = new Foo();
    try { foo.name = 'bob'; }
    catch (err) {
        t.equal(err.message, "\"name\" is a derived property, it can't be set directly.");
    }
    t.end();
});

test('should get correct defaults', function (t) {
    var foo = new Foo({});
    t.strictEqual(foo.firstName, 'defaults');
    t.strictEqual(foo.thing, 'hi');
    t.end();
});

test('Setting other properties when `extraProperties: "reject"` throws error', function (t) {
    var Foo = State.extend({
        extraProperties: 'reject'
    });
    var foo = new Foo();
    t.throws(function () {
        foo.set({
            craziness: 'new'
        });
    }, Error, 'Throws exception if set to rejcet');
    t.end();
});

test('Setting other properties ignores them by default', function (t) {
    var foo = new Foo();
    foo.set({
        craziness: 'new'
    });
    t.strictEqual(foo.craziness, undefined, 'property should be ignored');
    t.end();
});

test('Setting other properties is ok if extraProperties = "allow"', function (t) {
    var foo = new Foo();
    foo.extraProperties = 'allow';
    foo.set({
        craziness: 'new'
    });
    t.equal(foo.get('craziness'), 'new');
    t.end();
});

test('#11 - multiple instances of the same state class should be able to use extraProperties = "allow" as expected', function (t) {
    var Foo = State.extend({
        extraProperties: 'allow'
    });

    var one = new Foo({ a: 'one.a', b: 'one.b' });
    var two = new Foo({ a: 'two.a', b: 'two.b', c: 'two.c' });

    t.equal(one.a, 'one.a');
    t.equal(one.b, 'one.b');

    t.equal(two.a, 'two.a');
    t.equal(two.b, 'two.b');
    t.equal(two.c, 'two.c');

    t.end();
});

test('extraProperties = "allow" properties should be defined entirely on the instance not the prototype', function (t) {
    var Foo = State.extend({
        extraProperties: 'allow'
    });

    var one = new Foo({ a: 'one.a', b: 'one.b' });
    var two = new Foo();

    t.deepEqual(two._definition, {});
    t.end();
});

test('should throw a type error for bad data types', function (t) {
    t.throws(function () {
        new Foo({firstName: 3});
    }, TypeError);
    t.throws(function () {
        new Foo({num: 'foo'});
    }, TypeError);
    t.throws(function () {
        new Foo({hash: 10});
    }, TypeError);
    t.throws(function () {
        new Foo({today: 'asdfadsfa'});
    }, TypeError);
    t.doesNotThrow(function () {
        new Foo({today: 1397631169892});
        new Foo({today: '1397631169892'});
    });
    t.throws(function () {
        new Foo({list: 10});
    }, TypeError);
    t.end();
});

test('should validate model', function (t) {
    var foo = new Foo();
    t.equal(foo._verifyRequired(), false);

    foo.firstName = 'a';
    foo.lastName = 'b';
    foo.thing = 'abc';
    foo.num = 12;
    t.ok(foo._verifyRequired());
    t.end();
});

test('should store previous attributes', function (t) {
    var foo = new Foo({
        firstName: 'beau'
    });
    foo.firstName = 'john';
    t.strictEqual(foo.firstName, 'john');
    t.strictEqual(foo.previous('firstName'), 'beau');
    foo.firstName = 'blah';
    t.strictEqual(foo.previous('firstName'), 'john');
    t.end();
});

test('should have data serialization methods', function (t) {
    var foo = new Foo({
        firstName: 'bob',
        lastName: 'tom',
        thing: 'abc'
    });

    t.deepEqual(foo.attributes, {
        firstName: 'bob',
        lastName: 'tom',
        thing: 'abc',
        myBool: false,
        active: true,
        someNull: null
    });
    t.deepEqual(foo.serialize(), {
        firstName: 'bob',
        lastName: 'tom',
        thing: 'abc',
        myBool: false,
        someNull: null
    });
    t.end();
});

test('serialize should not include session properties no matter how they\'re defined.', function (t) {
    var Foo = State.extend({
        props: {
            name: 'string'
        },
        session: {
            // simple definintion
            active: 'boolean'
        }
    });

    var Bar = State.extend({
        props: {
            name: 'string'
        },
        session: {
            // fuller definition
            active: ['boolean', true, false]
        }
    });

    var foo = new Foo({name: 'hi', active: true});
    var bar = new Bar({name: 'hi', active: true});
    t.deepEqual(foo.serialize(), {name: 'hi'});
    t.deepEqual(bar.serialize(), {name: 'hi'});
    t.end();
});

test('should fire events normally for properties defined on the fly', function (t) {
    var foo = new Foo();
    foo.extraProperties = 'allow';
    foo.on('change:crazyPerson', function () {
        t.ok(true);
    });
    foo.set({
        crazyPerson: true
    });
    t.end();
});

test('should fire event on derived properties, even if dependent on ad hoc prop.', function (t) {
    var Foo = State.extend({
        extraProperties: 'allow',
        derived: {
            isCrazy: {
                deps: ['crazyPerson'],
                fn: function () {
                    return !!this.crazyPerson;
                }
            }
        }
    });
    var foo = new Foo();
    foo.on('change:isCrazy', function () {
        t.ok(true);
    });
    foo.set({
        crazyPerson: true
    });
    t.end();
});

test('should fire general change event on single attribute', function (t) {
    var foo = new Foo({firstName: 'coffee'});
    foo.on('change', function () {
        t.ok(true);
    });
    foo.firstName = 'bob';
    t.end();
});

test('should fire single change event for multiple attribute set', function (t) {
    var foo = new Foo({firstName: 'coffee'});
    foo.on('change', function () {
        t.ok(true);
    });
    foo.set({
        firstName: 'roger',
        lastName: 'smells'
    });
    t.end();
});

test('derived properties', function (t) {
    var ran = 0;
    var notCachedRan = 0;
    var Foo = State.extend({
        props: {
            name: ['string', true]
        },
        derived: {
            greeting: {
                deps: ['name'],
                fn: function () {
                    ran++;
                    return 'hi, ' + this.name;
                }
            },
            notCached: {
                cache: false,
                deps: ['name'],
                fn: function () {
                    notCachedRan++;
                    return 'hi, ' + this.name;
                }
            }
        }
    });
    var foo = new Foo({name: 'henrik'});
    t.strictEqual(ran, 0, 'derived function should not have run yet.');
    t.equal(foo.greeting, 'hi, henrik');
    t.equal(foo.greeting, 'hi, henrik');
    t.equal(ran, 1, 'cached derived should only run once');
    t.equal(notCachedRan, 0, 'shold not have been run yet');
    foo.name = 'someone';
    t.equal(foo.greeting, 'hi, someone');
    t.equal(foo.greeting, 'hi, someone');
    t.equal(ran, 2, 'cached derived should have been cleared and run once again');
    t.equal(notCachedRan, 1, 'shold have been run once because it was triggered');
    t.equal(foo.notCached, 'hi, someone');
    t.equal(notCachedRan, 2, 'incremented again');
    t.equal(foo.notCached, 'hi, someone');
    t.equal(notCachedRan, 3, 'incremented each time');
    t.end();
});

test('cached, derived properties should only fire change event if they\'ve actually changed', function (t) {
    var changed = 0;
    var Foo = State.extend({
        props: {
            name: ['string', true],
            other: 'string'
        },
        derived: {
            greeting: {
                deps: ['name', 'other'],
                fn: function () {
                    return 'hi, ' + this.name;
                }
            }
        }
    });
    var foo = new Foo({name: 'henrik'});
    foo.on('change:greeting', function () {
        changed++;
    });
    t.equal(changed, 0);
    foo.name = 'new';
    t.equal(changed, 1);
    foo.other = 'new';
    t.equal(changed, 1);
    t.end();
});

test('derived properties with derived dependencies', function (t) {
    var ran = 0;
    var Foo = State.extend({
        props: {
            name: ['string', true]
        },
        derived: {
            greeting: {
                deps: ['name'],
                fn: function () {
                    return 'hi, ' + this.name;
                }
            },
            awesomeGreeting: {
                deps: ['greeting'],
                fn: function () {
                    return this.greeting + '!';
                }
            }
        }
    });
    var foo = new Foo({name: 'henrik'});
    foo.on('change:awesomeGreeting', function () {
        ran++;
        t.ok(true, 'should fire derived event');
    });
    foo.on('change:greeting', function () {
        ran++;
        t.ok(true, 'should fire derived event');
    });
    foo.on('change:name', function () {
        ran++;
        t.ok(true, 'should fire derived event');
    });
    foo.on('change', function () {
        ran++;
        t.ok(true, 'should file main event');
    });
    foo.name = 'something';
    t.equal(ran, 4);
    t.end();
});

test('derived properties triggered with multiple instances', function (t) {
    var foo = new Foo({firstName: 'Silly', lastName: 'Fool'});
    var bar = new Foo({firstName: 'Bar', lastName: 'Man'});

    foo.on('change:name', function () {
        t.ok('name changed');
    });
    foo.firstName = 'bob';
    bar.on('change:name', function () {
        t.ok('name changed');
    });
    bar.firstName = 'bob too';
    t.end();
});

test('Calling `previous` during change of derived cached property should work', function (t) {
    var foo = new Foo({firstName: 'Henrik', lastName: 'Joreteg'});
    var ran = false;
    foo.on('change:name', function () {
        if (!ran) {
            t.equal(typeof foo.previous('name'), 'undefined');
            ran = true;
        } else {
            t.equal(foo.previous('name'), 'Crazy Joreteg');
        }
    });

    foo.firstName = 'Crazy';
    foo.firstName = 'Lance!';
    t.end();
});

test('Calling `previous` during change of derived property that is not cached, should be `undefined`', function (t) {
    var foo = new Foo({firstName: 'Henrik', lastName: 'Joreteg'});

    // the initials property is explicitly not cached
    // so you should not be able to get a previous value
    // for it.
    foo.on('change:initials', function () {
        t.equal(typeof foo.previous('initials'), 'undefined');
    });

    foo.firstName = 'Crazy';
    t.end();
});

test('Should be able to define and use custom data types', function (t) {
    var Foo = State.extend({
        props: {
            silliness: 'crazyType'
        },
        dataTypes: {
            crazyType: {
                set: function (newVal) {
                    return {
                        val: newVal,
                        type: 'crazyType'
                    };
                },
                get: function (val) {
                    return val + 'crazy!';
                }
            }
        }
    });

    var foo = new Foo({silliness: 'you '});

    t.equal(foo.silliness, 'you crazy!');
    t.end();
});

test('Uses dataType compare', function (t) {
    var compareRun;

    var Foo = State.extend({
        props: {
            silliness: 'crazyType'
        },
        dataTypes: {
            crazyType: {
                compare: function (oldVal, newVal) {
                    compareRun = true;
                    return false;
                },
                set: function (newVal) {
                    return {
                        val: newVal,
                        type: 'crazyType'
                    };
                },
                get: function (val) {
                    return val + 'crazy!';
                }
            }
        }
    });

    compareRun = false;
    var foo = new Foo({ silliness: 'you' });
    t.assert(compareRun);

    compareRun = false;
    foo.silliness = 'they';
    t.assert(compareRun);
    t.end();
});

test('Should only allow nulls where specified', function (t) {
    var foo = new Foo({
        firstName: 'bob',
        lastName: 'vila',
        someNumber: null
    });
    t.equal(foo.someNumber, null);
    t.throws(function () {
        foo.firstName = null;
    }, TypeError, 'Throws exception when setting unallowed null');
    t.end();
});

test('Attribute test function works', function (t) {
    var foo = new Foo({good: 'good'});
    t.equal(foo.good, 'good');

    t.throws(function () {
        foo.good = 'bad';
    }, TypeError, 'Throws exception on invalid attribute value');
    t.end();
});

test('Values attribute basic functionality', function (t) {
    var Model = State.extend({
        props: {
            state: {
                values: ['CA', 'WA', 'NV']
            }
        }
    });

    var m = new Model();

    t.throws(function () {
        m.state = 'PR';
    }, TypeError, 'Throws exception when setting something not in list');

    t.equal(m.state, undefined, 'Should be undefined if no default');

    m.state = 'CA';

    t.equal(m.state, 'CA', 'State should be set');
    t.end();
});

test('Values attribute default works', function (t) {
    var Model = State.extend({
        props: {
            state: {
                values: ['CA', 'WA', 'NV'],
                default: 'CA'
            }
        }
    });

    var m = new Model();

    t.equal(m.state, 'CA', 'Should have applied the default');

    t.throws(function () {
        m.state = 'PR';
    }, TypeError, 'Throws exception when setting something not in list');
    t.end();
});

test('toggle() works on boolean and values properties.', function (t) {
    var Model = State.extend({
        props: {
            isAwesome: 'boolean',
            someNumber: 'number',
            state: {
                values: ['CA', 'WA', 'NV'],
                default: 'CA'
            }
        }
    });

    var m = new Model();

    t.throws(function () {
        m.toggle('someNumber');
    }, TypeError, 'Throws exception when toggling a non-togglable property.');

    m.toggle('state');
    t.equal(m.state, 'WA', 'Should go to next');
    m.toggle('state');
    t.equal(m.state, 'NV', 'Should go to next');
    m.toggle('state');
    t.equal(m.state, 'CA', 'Should go to next with loop');

    m.toggle('isAwesome');
    t.strictEqual(m.isAwesome, true, 'Should toggle even if undefined');
    m.toggle('isAwesome');
    t.strictEqual(m.isAwesome, false, 'Should toggle if true.');
    m.toggle('isAwesome');
    t.strictEqual(m.isAwesome, true, 'Should toggle if false.');
    t.end();
});

test('property test function scope is correct.', function (t) {
    var m;
    var temp;
    var Model = State.extend({
        props: {
            truth: {
                type: 'boolean',
                test: function () {
                    temp = this;
                    return false;
                }
            }
        }
    });

    m = new Model();
    m.toggle('truth');
    t.equal(m, temp);
    t.end();
});

test('should be able to inherit for use in other objects', function (t) {
    var StateObj = State.extend({
        props: {
            name: 'string'
        }
    });
    function AwesomeThing() {
        StateObj.apply(this, arguments);
    }

    AwesomeThing.prototype = Object.create(StateObj.prototype);

    AwesomeThing.prototype.hello = function () {
        return this.name;
    };

    var awe = new AwesomeThing({name: 'cool'});

    t.equal(awe.hello(), 'cool');
    t.equal(awe.name, 'cool');
    t.end();
});

test('extended state objects should maintain child collections of parents', function (t) {
    var State1 = State.extend({
        collections: {
            myStuff: Collection
        }
    });
    var State2 = State1.extend({
        collections: {
            myOtherCollection: Collection
        }
    });
    var thing = new State2();
    t.ok(thing.myStuff);
    t.ok(thing.myOtherCollection);
    t.end();
});

test('`initialize` should have access to initialized child collections', function (t) {
    var StateObj = State.extend({
        initialize: function () {
            t.ok(this.myStuff);
            t.equal(this.myStuff.parent, this);
            t.end();
        },
        collections: {
            myStuff: Collection
        }
    });
    var thing = new StateObj();
});

test('parent collection references should be maintained when adding/removing to a collection', function (t) {
    var StateObj = State.extend({
        props: {
            id: 'string'
        }
    });
    var c = new Collection();
    var s = new StateObj({id: '47'});
    c.add(s);
    t.equal(s.collection, c);
    c.remove(s);
    t.notOk(s.collection);
    t.end();
});

test('children and collections should be instantiated', function (t) {
    var GrandChild = State.extend({
        props: {
            id: 'string'
        },
        collections: {
            nicknames: Collection
        }
    });

    var FirstChild = State.extend({
        props: {
            id: 'string'
        },
        children: {
            grandChild: GrandChild
        }
    });

    var StateObj = State.extend({
        props: {
            id: 'string'
        },
        children: {
            firstChild: FirstChild
        }
    });

    var data = {
        id: 'child',
        firstChild: {
            id: 'child',
            grandChild: {
                id: 'grandChild',
                nicknames: [
                    {name: 'munchkin'},
                    {name: 'kiddo'}
                ]
            }
        }
    };

    var first = new StateObj(data);

    t.ok(first.firstChild, 'child should be initted');
    t.ok(first.firstChild.grandChild, 'grand child should be initted');
    t.equal(first.firstChild.id, 'child');
    t.equal(first.firstChild.grandChild.id, 'grandChild');
    t.ok(first.firstChild.grandChild.nicknames instanceof Collection, 'should be collection');
    t.equal(first.firstChild.grandChild.nicknames.length, 2);

    t.deepEqual(first.serialize(), {
        id: 'child',
        firstChild: {
            id: 'child',
            grandChild: {
                id: 'grandChild',
                nicknames: [
                    {name: 'munchkin'},
                    {name: 'kiddo'}
                ]
            }
        }
    });

    t.equal(JSON.stringify(first), JSON.stringify({
        id: 'child',
        firstChild: {
            id: 'child',
            grandChild: {
                id: 'grandChild',
                nicknames: [
                    {name: 'munchkin'},
                    {name: 'kiddo'}
                ]
            }
        }
    }), 'should be able to pass whole object to JSON.stringify()');

    // using `set` should still apply to children
    first.set({
        firstChild: {
            id: 'firstChild',
            grandChild: {
                nicknames: [{name: 'runt'}]
            }
        }
    });
    t.ok(first.firstChild instanceof FirstChild, 'should still be instanceof');
    t.equal(first.firstChild.id, 'firstChild', 'change should have been applied');
    t.equal(first.firstChild.grandChild.nicknames.length, 3, 'collection should have been updated');

    t.end();
});

test('listens to child events', function (t) {
    var GrandChild = State.extend({
        props: {
            id: 'string',
            name: 'string'
        },
        collections: {
            nicknames: Collection
        }
    });

    var FirstChild = State.extend({
        props: {
            id: 'string',
            name: 'string'
        },
        children: {
            grandChild: GrandChild
        }
    });

    var StateObj = State.extend({
        props: {
            id: 'string',
            name: 'string'
        },
        children: {
            firstChild: FirstChild
        }
    });

    var first = new StateObj({
        id: 'child',
        name: 'first-name',
        firstChild: {
            id: 'child',
            name: 'first-child-name',
            grandChild: {
                id: 'grandChild',
                name: 'Henrik',
                nicknames: [
                    {name: 'munchkin'},
                    {name: 'kiddo'}
                ]
            }
        }
    });

    t.plan(7);

    //Change property
    first.once('change:name', function (model, newVal) {
        t.equal(newVal, 'new-first-name');
    });
    first.name = 'new-first-name';
    t.equal(first.name, 'new-first-name');


    //Change child property
    first.once('change:firstChild.name', function (model, newVal) {
        t.equal(newVal, 'new-first-child-name');
    });
    first.firstChild.name = 'new-first-child-name';
    t.equal(first.firstChild.name, 'new-first-child-name');


    //Change grand child property
    first.once('change:firstChild.grandChild.name', function (unsure, name) {
        t.equal(name, "Phil");
    });
    first.firstChild.grandChild.name = 'Phil';
    t.equal(first.firstChild.grandChild.name, 'Phil');

    //Propagates change events from children too
    first.once('change', function (model) {
        t.equal(model, first);
    });
    first.firstChild.grandChild.name = 'Bob';
});

test('Should be able to declare derived properties that have nested deps', function (t) {
    var GrandChild = State.extend({
        props: {
            id: 'string',
            name: 'string'
        }
    });

    var FirstChild = State.extend({
        props: {
            id: 'string',
            name: 'string'
        },
        children: {
            grandChild: GrandChild
        }
    });

    var StateObj = State.extend({
        props: {
            id: 'string',
            name: 'string'
        },
        children: {
            child: FirstChild
        },
        derived: {
            relationship: {
                deps: ['child.grandChild.name', 'name'],
                fn: function () {
                    return this.name + ' has grandchild ' + (this.child.grandChild.name || '');
                }
            }
        }
    });

    var first = new StateObj({
        name: 'henrik'
    });

    t.equal(first.relationship, 'henrik has grandchild ', 'basics properties working');

    first.on('change:relationship', function () {
        t.pass('got change event on derived property for child');
        t.end();
    });

    first.child.grandChild.name = 'something';
});

test('`state` properties', function (t) {
    var Person = State.extend({
        props: {
            sub: 'state',
            sub2: 'state'
        }
    });

    var SubState = State.extend({
        props: {
            id: 'string'
        }
    });

    var p = new Person();

    t.plan(4);

    t.equal(p.sub, undefined, 'should be undefined to start');

    t.throws(function () {
        p.sub = 'something silly';
    }, TypeError, 'Throws type error if not state object');

    p.once('change:sub', function () {
        t.pass('fired change for state');
    });

    var sub = new SubState({id: 'hello'});

    p.sub = sub;

    p.on('change:sub', function () {
        t.fail('shouldnt fire if same instance');
    });

    p.sub = sub;

    p.on('change:sub.id', function () {
        t.pass('child property event bubbled');
    });

    p.sub.id = 'new';

    // new person
    var p2 = new Person();
    var sub1 = new SubState({id: 'first'});
    var sub2 = new SubState({id: 'second'});

    p2.on('change:sub.id', function () {
        t.fail('should not bubble on old one');
    });

    p2.sub = sub1;
    p2.sub = sub2;

    sub1.id = 'something different';

    t.end();
});

test.only('Issue: #75 `state` property from undefined -> state', function (t) {
    t.plan(2);

    var Person = State.extend({
        props: {
            sub: 'state',
            sub2: 'state'
        }
    });

    var SubState = State.extend({
        props: {
            foo: 'string'
        }
    });

    var sub = new SubState({ foo: 'a' });
    var p = new Person({ sub: sub });

    p.on('change:sub.foo', function () {
        t.ok(true);
    });

    sub.foo = 'b';

    p.sub2 = new SubState({ foo: 'bar' });

    sub.foo = 'c';

    t.end();
});


test('`state` properties should invalidate dependent derived properties when changed', function (t) {
    var counter = 0;
    var Person = State.extend({
        props: {
            sub: 'state'
        },
        derived: {
            subId: {
                deps: ['sub.id'],
                fn: function () {
                    return this.sub && this.sub.id;
                }
            }
        }
    });

    var SubState = State.extend({
        props: {
            id: 'string'
        }
    });

    var p = new Person();

    // count each time it's changed
    p.on('change:subId', function () {
        counter++;
    });

    var sub1 = new SubState({id: '1'});
    var sub2 = new SubState({id: '2'});

    t.equal(p.subId, undefined, 'should be undefined to start');

    p.sub = sub1;

    t.equal(p.subId, '1', 'should invalidated cache');
    t.equal(counter, 1, 'should fire change callback for derived item');

    p.on('change:sub.id', function (model, newVal) {
        t.pass('change event should fire');
        t.equal(model, sub1, 'callback on these should be sub model');
        t.equal(newVal, 'newId', 'should include new val');
        t.end();
    });

    sub1.id = 'newId';
});

test("#1664 - Changing from one value, silently to another, back to original triggers a change.", function (t) {
    var Model = State.extend({
        props: {
            x: 'number'
        }
    });
    var model = new Model({x: 1});
    model.on('change:x', function () { t.ok(true); t.end(); });
    model.set({x: 2}, {silent: true});
    model.set({x: 3}, {silent: true});
    model.set({x: 1});
});

test("#1664 - multiple silent changes nested inside a change event", function (t) {
    var changes = [];
    var Model = State.extend({
        props: {
            a: 'string',
            b: 'number',
            c: 'string'
        }
    });
    var model = new Model();
    model.on('change', function () {
        model.set({a: 'c'}, {silent: true});
        model.set({b: 2}, {silent: true});
        model.unset('c', {silent: true});
    });
    model.on('change:a change:b change:c', function (model, val) { changes.push(val); });
    model.set({a: 'a', b: 1, c: 'item'});
    t.deepEqual(changes, ['a', 1, 'item']);
    t.deepEqual(model.attributes, {a: 'c', b: 2});
    t.end();
});

test("silent changes in last `change` event back to original triggers change", function (t) {
    var changes = [];
    var Model = State.extend({
        props: {
            a: 'string'
        }
    });
    var model = new Model();
    model.on('change:a change:b change:c', function (model, val) { changes.push(val); });
    model.on('change', function () {
        model.set({a: 'c'}, {silent: true});
    });
    model.set({a: 'a'});
    t.deepEqual(changes, ['a']);
    model.set({a: 'a'});
    t.deepEqual(changes, ['a', 'a']);
    t.end();
});

test("#1943 change calculations should use _.isEqual", function (t) {
    var Model = State.extend({
        props: {
            a: 'object'
        }
    });
    var model = new Model({a: {key: 'value'}});
    model.set('a', {key: 'value'}, {silent: true});
    t.equal(model.changedAttributes(), false);
    t.end();
});

test("#1964 - final `change` event is always fired, regardless of interim changes", function (t) {
    var Model = State.extend({
        props: {
            property: 'string'
        }
    });
    var model = new Model();
    model.on('change:property', function () {
        model.set('property', 'bar');
    });
    model.on('change', function () {
        t.ok(true);
        t.end();
    });
    model.set('property', 'foo');
});

test("isValid", function (t) {
    var Model = State.extend({
        props: {
            valid: 'boolean'
        }
    });
    var model = new Model({valid: true});
    model.validate = function (attrs) {
        if (!attrs.valid) return "invalid";
    };
    t.equal(model.isValid(), true);
    t.equal(model.set({valid: false}, {validate: true}), false);
    t.equal(model.isValid(), true);
    model.set({valid: false});
    t.equal(model.isValid(), false);
    t.ok(!model.set('valid', false, {validate: true}));
    t.end();
});

test("#1545 - `undefined` can be passed to a model constructor without coersion", function (t) {
    var Model = State.extend({
        defaults: { one: 1 },
        initialize : function (attrs, opts) {
            t.equal(attrs, undefined);
        }
    });
    var emptyattrs = new Model();
    var undefinedattrs = new Model(undefined);
    t.end();
});

test("#1961 - Creating a model with {validate: true} will call validate and use the error callback", function (t) {
    var Model = State.extend({
        props: {
            id: 'number'
        },
        validate: function (attrs) {
            if (attrs.id === 1) return "This shouldn't happen";
        }
    });
    var model = new Model({id: 1}, {validate: true});
    t.equal(model.validationError, "This shouldn't happen");
    t.end();
});

test("#2034 - nested set with silent only triggers one change", function (t) {
    var Model = State.extend({
        props: {
            a: 'boolean',
            b: 'boolean'
        }
    });
    var model = new Model();
    model.on('change', function () {
        model.set({b: true}, {silent: true});
        t.ok(true);
        t.end();
    });
    model.set({a: true});
});

test("#2030 - set with failed validate, followed by another set triggers change", function (t) {
    var attr = 0, main = 0, error = 0;
    var Model = State.extend({
        props: {
            x: 'number'
        },
        validate: function (attr) {
            if (attr.x > 1) {
                error++;
                return "this is an error";
            }
        }
    });
    var model = new Model({x: 0});
    model.on('change:x', function () { attr++; });
    model.on('change', function () { main++; });
    model.set({x: 2}, {validate: true});
    model.set({x: 1}, {validate: true});
    t.deepEqual([attr, main, error], [1, 1, 1]);
    t.end();
});

test("#1179 - isValid returns true in the absence of validate.", function(t) {
    var Model = State.extend({
        validate: null
    });
    var model = new Model();
    t.ok(model.isValid());
    t.end();
});

test("#1791 - `attributes` is available for `parse`", function(t) {
    var Model = State.extend({
        //Backbone test used this.has which was a this.get !== null test
        parse: function() { this.get('a') !== null; } // shouldn't throw an error
    });
    var model = new Model(null, {parse: true});
    t.end();
});
