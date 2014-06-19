# ampersand-state

<!-- starthide -->
Part of the [Ampersand.js toolkit](http://ampersandjs.com) for building clientside applications.
<!-- endhide -->

An observable, extensible state object with derived watchable properties.

Ampersand-state serves as a base object for [ampersand-model](http://github.com/ampersandjs/ampersand-model) but is useful any time you want to track complex state.

[ampersand-model](https://github.com/ampersandjs/ampersand-model) extends ampersand-state to include assumptions that you'd want if you're using models to model date from a REST API. But by itself ampersand-state is useful for anytime you want something to model state, that fires events for changes and lets you define and listen to derived properties.

For further explanation see the [learn ampersand-state](http://ampersandjs.com/learn/state) guide.

## browser support

[![browser support](https://ci.testling.com/ampersandjs/ampersand-state.png)
](https://ci.testling.com/ampersandjs/ampersand-state)

## Install

```
npm install ampersand-state --save
```

## API Reference

### extend `AmpersandState.extend({ })`

To create a **State** class of your own, you extend **AmpersandState** and provide instance properties an options for your class. Typically here you will pass any properties (`props`, `session` and `derived` of your state class, and any instance methods to be attached to instances of your class.

**extend** correctly sets up the prototype chain, so that subclasses created with **extend** can be further extended as many times as you like.

Definitions like `props`, `session`, `derived` etc will be merged with superclass definitions.

```javascript
var Person = AmpersandState.extend({
    props: {
        firstName: 'string',
        lastName: 'string'
    },
    session: {
        signedIn: ['boolean', true, false],
    },
    derived: {
        fullName: {
            deps: ['firstName', 'lastName'],
            fn: function () {
                return this.firstName + ' ' + this.lastName;
            }
        }
    }
});
```

### constructor/initialize `new AmpersandState([attrs], [options])`

When creating an instance of a state object, you can pass in the initial values of the **attributes** which will be [set](#ampersand-state-set) on the model. Unless [extraProperties](#amperand-state-extra-properties) is set to `allow`, you will need to have defined these attributes in `props` or `session`.

If you have defined an **initialize** function for your subclass of State, it will be invoked at creation time.

```javascript
var me = new Person({
    firstName: 'Phil'
    lastName: 'Roberts'
});

me.firstName //=> Phil
```

Available options:

* `[parse]` {Boolean} - whether to call the class's [parse](#ampersand-state-parse) function with the initial attributes. _Defaults to `false`_.
* `[parent]` {AmpersandState} - pass a reference to a model's parent to store on the model.


### extraProperties `AmpersandState.extend({ extraProperties: 'allow' })`

Defines how properties that aren't defined in `props`, `session` or `derived` are handled. May be set to `'allow'`, `'reject'` or `'allow'`.

```javascript
var StateA = AmpersandState.extend({
    extraProperties: 'allow',
});

var stateA = new StateA({ foo: 'bar' });
stateA.foo === 'bar' //=> true


var StateB = AmpersandState.extend({
    extraProperties: 'ignore',
});

var stateB = new StateB({ foo: 'bar' });
stateB.foo === undefined //=> true


var stateC = AmpersandState.extend({
    extraProperties: 'reject'
});

var stateC = new StateC({ foo: 'bar' })
//=> TypeError('No foo property defined on this model and extraProperties not set to "ignore" or "allow".');
```

### dataTypes

### props `AmpersandView.extend({ props: { name: 'string' } })`

Pass **props** as an object to extend, describing the observable properties of your state class. The props properties should not be set on an instance, as this won't define new properties, they should only be passed to extend.

Properties can be defined in three different ways:

* As a string with the expected dataType. One of `string`, `number`, `boolean`, `array`, `object`, `date`, or `any`. Eg: `name: 'string'`. Can also be set to the name of a custom `dataTypes` if any are defined for the class.
* An array of `[dataType, required, default]`
* An object `{ type: 'string', required: true, default: '' , allowNull: false}`

* If `required` is true, and a `default` is set for the property, the property will start with that value, and revert to it after a call to `unset(propertyName)`.
* Trying to set a property to an invalid type will raise an exception.
* See [get](#ampersand-state-get) and [set](#ampersand-state-set) for more information about getting and setting properties.

```javascript
var Person = AmpersandState.extend({
    props: {
        name: 'string',
        age: 'number',
        paying: ['boolean', true, false], //required attribute, defaulted to false
        type: {
            type: 'string',
            values: ['regular-hero', 'super-hero', 'mega-hero'
        }
    }
});
```

### session `AmpersandView.extend({ session: { name: 'string' } })`

Session properties are defined and work in exactly the same way as [props](#ampersand-state-props), but generally only exist for the lifetime of the page. They would not typically be persisted to the server, and are not returned by calls to `toJSON()` or `serialize()`.

```javascript
var Person = AmpersandState.extend({
    props: {
        name: 'string',
    },
    session: {
        isLoggedIn: 'boolean'
    }
);
```

### derived

Derived properties (also known as computed properties) are properties of the state object that depend on the other (`props`, `session`  or even `derived` properties to determine their value. Best demonstrated with an example:

```javascript
var Person = AmpersandState.extend({
    props: {
        firstName: 'string',
        lastName: 'string'
    },
    derived: {
        fullName: {
            deps: ['firstName', 'lastName'],
            fn: function () {
                return this.firstName + ' ' + this.lastName;
            }
        }
    }
});

var person = new Person({ firstName: 'Phil', lastName: 'Roberts' });
console.log(person.fullName) //=> "Phil Roberts"

person.firstName = 'Bob';
console.log(person.fullName) //=> "Bob Roberts"
```

Each derived property, is defined as an object with the current properties:

* `deps` {Array} - An array of property names which the derived property depends on.
* `fn` {Function} - A function which returns the value of the computed property. It is called in the context of the current object, so that `this` is set correctly.
* `cache` {Boolean} - Whether to cache the property. Uncached properties are computed everytime they are accessed. Useful if it depends on the current time for example. _Defaults to `true`_.

Derived properties are retrieved and fire change events just like any other property. They cannot be set directly. Caching ensures that the `fn` function is only run when any of the dependencies change, and change events are only fired if the result of calling `fn()` has actually changed.

### children `AmpersandState.extend({ children: { profile: Profile } })`

Define child state objects to attach to the object. Attributes passed to the constructor or to `set()` will be proxied to the children/collections. Change events on the child will be proxied through the parent:

```javascript
var AmpersandState = require('ampersand-state');
var Hat = AmpersandState.extend({
    props: {
        color: 'string'
    }
});

var Person = AmpersandState.extend({
    props: {
        name: 'Phil'
    },
    children: {
        hat: Hat
    }
});

var me = new Person({ name: 'Phil', hat: { color: 'red' } });

me.on('all', function (eventName) {
    console.log('Got event: ', eventName);
});

console.log(me.hat) //=> Hat{color: 'red'}

me.set({ hat: { color: 'green' } });
//-> "Got event: change:hat.color"
//-> "Got event: change"

console.log(me.hat) //=> Hat{color: 'green'}
```

### parse

**parse** is called when the model is initialized allowing the attributes to be modified/remapped/renamed/etc before they are actually applied to the model. In ampersand-state, parse is only called when the model is first initialized, and only if `{ parse: true }` is passed to the constructor options:

```javascript
var Person = AmpersandState.extend({
    props: {
        id: 'number',
        name: 'string'
    },

    parse: function (attrs) {
        attrs.id = attrs.personID; //remap an oddly named attribute
        delete attrs.personID;

        return attrs;
    }
});

var me = new Person({ personID: 123, name: 'Phil' });

console.log(me.id) //=> 123
console.log(me.personID) //=> undefined
```

**parse** is arguably more useful in ampersand-model, where data typically comes from the server.

### serialize `state.serialize()`

Serialize the state object into a plain object, ready for sending to the server (typically called via [toJSON](#ampersand-state-tojson)). Of the model's properties, only `props` is returned, `session` and `derived` are omitted. Will also serialize any `children` or `collections` by calling their serialize methods.


### get `state.get(attribute); state[attribute]; state.firstName`

Get the current value of an attribute from the state object. Attributes can be accessed directly, or a call to the Backbone style `get`. So these are all equivalent:

```javascript
person.get('firstName');
person['firstName'];
person.firstName
```

Get will retrieve `props`, `session` or `derived` properties all in the same way.

### set `state.set(attributes, [options]); state.firstName = 'Henrik';`

Set an attribute, or multiple attributes, on the state object. If any of the attributes change the state of the object, a `"change"` event will be triggered on it. Change events for specific attributes are also triggered, which you can listen to as well. For example: `"change:firstName"` and `"change:content"`. If the changes update any `derived` properties on the object, their values will be updated, and change events fired as well.

Attributes can be set directly, or via a call to the backbone style `set` (useful if you wish to update multiple attributes at once):

```javascript
person.set({firstName: 'Phil', lastName: 'Roberts'});
person.set('firstName', 'Phil');
person.firstName = 'Phil';
```

Possible options (when using `state.set()`):

* `silent` {Boolean} - prevents triggering of any change events as a result of the set operation.
* `unset` {Boolean} - `unset` the attributes keyed in the attributes object instead of setting them.

### unset `state.unset(attribute, [options])`

Clear the named attribute from the state object. Fires a `"change"` event and a `"change:attributeName"` event unless `silent` is passed as an option.

If the attribute being unset is `required` and has a `default` value as defined in either `props` or `session`, it will be set to that value, otherwise it will be `undefined`.

```javascript
person.unset('firstName')
```

### toggle `state.toggle('active')`

Shortcut to toggle boolean properties, or cycle through "ENUM" type properties that have a `values` array in it's definition. Fires change events as you would expect from set.

```javascript
var Person = AmpersandState.extend({
    props: {
        active: 'boolean',
        color: {
            type: 'string',
            values: ['red', 'green', 'blue']
        }
    }
});

var me = new Person({ active: true, color: 'green' });

me.toggle('active');
console.log(me.active) //=> false

me.toggle('color');
console.log(me.color) //=> 'blue'

me.toggle('color');
console.log(me.color) //=> 'red'
```


### previousAttributes `state.previousAttributes()`

Return a copy of the object's previous attributes (the state before the last `"change"` event). Useful for getting a diff between versions of a model, or getting back to a valid state after an error occurs.


### hasChanged `state.hasChanged([attribute])`

Determine if the model has been modified since the last `"change"` event. If an attribute name is passed, determine if that one attribute has changed.

### changedAttributes `state.changedAttributes([objectToDiff])`

Return an object containing all the attributes that have changed, or false if there are no changed attributes. Useful for determining what parts of a view need to be updated and/or what attributes need to be persisted to the server. Unset attributes will be set to undefined.  You can also pass an attributes object to diff against the model, determining if there *would be* a change.

### toJSON `state.toJSON()`

Return a shallow copy of the model's attributes for JSON stringification. This can be used for persistence, serialization, or for augmentation before being sent to the server. The name of this method is a bit confusing, as it doesn't actually return a JSON string — but I'm afraid that it's the way that the JavaScript API for JSON.stringify works.

Calls [serialize](#ampersand-state-serialize) to determine which values to return in the object. Will be called implicitly by JSON.stringify.

```javascript
var me = new Person({ firstName: 'Phil', lastName: 'Roberts' });

me.toJSON() //=> { firstName: 'Phil', lastName: 'Roberts' }

//JSON.stringify implicitly calls toJSON:
JSON.stringify(me) //=> "{\"firstName\":\"Phil\",\"lastName\":\"Roberts\"}"
```

## Changelog

<!-- starthide -->
## Credits

[@HenrikJoreteg](http://twitter.com/henrikjoreteg)

## License

MIT
<!-- endhide -->
