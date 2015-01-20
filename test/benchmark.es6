/* jshint esnext:true */
var Benchmark = require('benchmark');
var State = require('../ampersand-state');

var suite = new Benchmark.Suite();

var MyStateExtended = State.extend({
    props: {
        name: 'string',
        age: 'number'
    },
    session: {
        isLoggedIn: 'boolean'
    },
    derived: {
        summary: {
            deps: ['name', 'age', 'isLoggedIn'],
            fn: function () {
                return this.name + " " + this.age + " " + this.isLoggedIn;
            }
        }
    }
});

class MyStateES6 extends State {
    get props() {
        return {
            name: 'string',
            age: 'number'
        };
    }
    get session() {
        return {
            isLoggedIn: 'boolean'
        };
    }
    get derived() {
        return {
            summary: {
                deps: ['name', 'age', 'isLoggedIn'],
                fn: function () {
                    return this.name + " " + this.age + " " + this.isLoggedIn;
                }
            }
        };
    }
}

function testConstructor(Cons) {
    var myState = new Cons({
        name: 'Phil',
        age: Math.random(),
        isLoggedIn: Math.random() > 0.5
    });

    myState.all;
}

suite.add('extend on inherit (es5)', function () {
    testConstructor(MyStateExtended);
})
.add('extend on construct (es6)', function () {
    testConstructor(MyStateES6);
})
.add('extend on seal (es6)', function () {
    MyStateES6.seal();
    testConstructor(MyStateES6);
})
.on('cycle', function(event) {
    console.log(String(event.target));
})
.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));
})
.run();
