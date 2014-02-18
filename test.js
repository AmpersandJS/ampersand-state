var assert = require('assert');
var Statey = require('./statey');


var Person = Statey.extend({
    props: {
        name: 'string'
    },
    personMethodThatShouldBeInherited: function () {
        return this.name;
    }
});

var AwesomePerson = Person.extend({
    props: {
        awesomeness: 'number'
    },
    awesomeMethod: function () {
        return this.awesomeness;
    }
});

var SuperHero = AwesomePerson.extend({
    props: {
        secretName: 'string'
    },
    fly: function () {
        console.log('i\'m sad i\'m flying');
    }
});

window.Person = Person;
window.AwesomePerson = AwesomePerson;
window.SuperHero = SuperHero;

window.p = new Person({name: 'henrik'});
window.a = new AwesomePerson({awesomeness: 5});
window.s = new SuperHero({
    name: 'henry',
    awesomeness: 10,
    secretName: 'strong sad'
})

console.log(p instanceof Person);
console.log(p instanceof Statey);
console.log(s instanceof SuperHero);

console.log('p name', p.name);
console.log('p awesomeness', p.awesomeness);
console.log('p definition', p._definition);

console.log('a name', a.name);
console.log('a awesomeness', a.awesomeness);
console.log('a definition', a._definition);

console.log('p === a', p === a);
