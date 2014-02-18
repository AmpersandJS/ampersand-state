var Statey = require('../statey');


exports.setUp = function (cb) {
    this.Person = Statey.extend({
        props: {
            name: 'string'
        }
    });
    cb();
};

exports['init with values'] = function (test) {
    var person = new this.Person({name: 'henrik'});
    test.ok(person);
    test.equal(person.name, 'henrik');
    test.done();
};

exports['extended object maintains existing props'] = function (test) {
    var AwesomePerson = this.Person.extend({
        props: {
            awesomeness: 'number'
        }
    });

    var awesome = new AwesomePerson({
        name: 'Captain Awesome',
        awesomeness: 11
    });

    test.equals(awesome.name, 'Captain Awesome');
    test.equals(awesome.awesomeness, 11);
    test.done();
};

exports['extended object maintains existing methods'] = function (test) {
    var Person = Statey.extend({
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

    test.ok(awesome.isTrulyAwesome());
    test.done();
};
