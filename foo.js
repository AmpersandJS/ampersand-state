var Model = require('./');

var Foo = Model.extend({
    props: {
        bar: 'object'
    },
    echo: function () {
        console.log(this.bar);
    }
});

var foo = new Foo();
console.log(foo.bar);
foo.bar.baz = 'akey';
console.log(foo.bar);
foo.echo();
