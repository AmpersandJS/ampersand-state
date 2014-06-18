# ampersand-state

An observable, extensible state object with derived watchable properties.

Ampersand-state serves as a base object for [ampersand-model](http://github.com/ampersandjs/ampersand-model) but is useful any time you want to track complex state.

[ampersand-model](https://github.com/ampersandjs/ampersand-model) extends ampersand-state to include assumptions that you'd want if you're using models to model date from a REST API. But by itself ampersand-state is useful for anytime you want something to model state, that fires events for changes and lets you define and listen to derived properties.

<!-- starthide -->
Part of the [Ampersand.js toolkit](http://ampersandjs.com) for building clientside applications.
<!-- endhide -->

<!-- starthide -->
## browser support

[![browser support](https://ci.testling.com/ampersandjs/ampersand-state.png)
](https://ci.testling.com/ampersandjs/ampersand-state)
<!-- endhide -->

## Install

```
npm install ampersand-state --save
```

<!-- starthide -->
## In pursuit of the ultimate observable JS object.

So much of building an application is managing state. Your app needs a single unadulterated *source of truth*. But in order to fully de-couple it from everything that cares about it, it needs to be observable.

Typically that's done by allowing you to register handlers for when things change.

In our case it looks like this:

```js
// Require the lib
var State = require('ampersand-state');

// Create a constructor to represent the state we want to store
var Person = State.extend({
    props: {
        name: 'string',
        isDancing: 'boolean'
    }
});

// Create an instance of our object
var person = new Person({name: 'henrik'});

// watch it
person.on('change:isDancing', function () {
    console.log('shake it!'); 
});

// set the value and the callback will fire
person.isDancing = true;

```

## So what?! That's boring.

Agreed. Though, there is some more subtle awesomeness in being able to observe changes that are set with a simple assigment: `person.isDancing = true` as opposed to `person.set('isDancing', true)` (either works, btw), but that's nothing groundbreaking.

So, what else? Well, as it turns out, a *huge* amount of code that you write in a project is really in describing and tracking relationships between variables.

So, what if our observable layer did that for us too?

Say you wanted to describe a draggable element on a page so you wanted it to follow a set of a rules. You want it to only be considered to have been dragged if it's total delta is > 10 pixels.

```js
var DraggedElementModel = State.extend({
    props: {
        x: 'number',
        y: 'number'
    },
    derived: {
        // the name of our derived property
        dragged: {
            // the properties it depends on
            deps: ['x', 'y'],
            // how it's calculated
            fn: function () {
                // the distance formula
                return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) > 10;
            }
        }
    }
});

var element = new DraggedElementModel({x: 0, y: 0});

// now we can just watch for changes to "dragged"
element.on('change:dragged', function (model, val) {
    if (val) {
        console.log('element has moved more than 10px');
    } else {
        console.log('element has moved less than 10px');
    }
});

```

## You didn't invent derived properties, pal. `</sarcasm>`

True, derived properties aren't a new idea. But, being able to clearly declare and derive watchable properties from a model is super useful and in our case, they're just accessed without calling a method. For example, using the draggable example above, the derived property is just `element.dragged`.


## Handling relationships between objects/models with derived properties

Say you've got an observable that you're using to model data from a RESTful API. Say that you've got a `/users` endpoint and when fetching a user, the user data includes a groupID that links them to another collection of groups that we've already fetched and created models for. From our user model we want to be able to easily access the group model. So, when passed to a template we can just access related group information.

Cached, derived properties are perfect for handling this relationship:

```js
var UserModel = State.extend({
    props: {
        name: 'string',
        groupId: 'string'
    },
    derived: {
        groupModel: {
            deps: ['groupId'],
            fn: function () {
                // we access our group collection from within 
                // the derived property to grab the right group model.
                return ourGroupCollection.get(this.groupId);
            }
        }
    }
});


var user = new UserModel({name: 'henrik', groupId: '2341'});

// now we can get the actual group model like so:
user.groupModel;

// As a bonus, it's even evented so you can listen for changes to the groupModel property.
user.on('change:groupModel', function (model, newGroupModel) {
    console.log('group changed!', newGroupModel);
});

```


## Cached, derived properties are da shiznit

So, say you have a more "expensive" computation for model. Say you're parsing a long string for URLs and turning them into HTML and then wanting to reference that later. Again, this is built in.

By default, derived properties are cached. 

```js
// assume this linkifies strings
var linkify = require('urlify');

var MySmartDescriptionModel = State.extend({
    // assume this is a long string of text
    description: 'string',
    derived: {
        linkified: {
            deps: ['description'],
            fn: function () {
                return linkify(this.description);
            }
        }
    }
});

var myDescription = new MySmartDescriptionModel({
    description: "Some text with a link. http://twitter.com/henrikjoreteg"
});

// Now i can just reference this as many times as I want but it 
// will never run it through the expensive function again.

myDescription.linkified;

```

With the model above, the descrition will only be run through that linkifier method once, unless of course the description changes.


## Derived properties are intelligently triggered

Just because an underlying property has changed, *doesn't mean the derived property has*. 

Cached derived properties will *only* trigger a `change` if the resulting calculated value has changed.

This is *super* useful if you've bound a derived property to a DOM property. This ensures that you won't ever touch the DOM unless the resulting value is *actually* different. Avoiding unecessary DOM changes is a huge boon for performance.

This is also important for cases where you're dealing with fast changing attributes.

Say you're drawing a realtime graph of tweets from the Twitter firehose, instead of binding your graph to increment with each tweet, if you know your graph only ticks with every thousand tweets you can easily create a property to watch.

```js
var MyGraphDataModel = State.extend({
    props: {
        numberOfTweets: 'number'
    },
    derived: {
        thousandTweets: {
            deps: ['numberOfTweets'],
            fn: function () {
                return Math.floor(this.numberOfTweets / 1000);
            }
        }
    }
});

// then just watch the property
var data = new MyGraphDataModel({numberOfTweets: 555});

// start adding 'em
var increment = function () {
    data.number += 1;
}
setInterval(increment, 50);

data.on('change:thousandTweets', function () {
    // will only get called every time is passes another 
    // thousand tweets.
});

```

## Derived properties don't *have* to be cached.

Say you want to calculate a value whenever it's accessed. Sure, you can create a non-cached derived property.

If you say `cache: false` then it will fire a `change` event anytime any of the `deps` changes and it will be re-calculated each time its accessed.


## State can be extended as many times as you want

Each state object you define will have and `extend` method on the constructor.

That means you can extend as much as you want and the definitions will get merged.

```js
var Person = State.extend({
    props: {
        name: 'string'
    },
    sayHi: function () {
        return 'hi, ' + this.name;
    }
});

var AwesomePerson = Person.extend({
    props: {
        awesomeness: 'number'
    }
});

// Now awesome person will have both awesomeness and name properties
var awesome = new AwesomePerson({
    name: 'henrik',
    awesomeness: 8
});

// and it will have the methods in the original
awesome.sayHi(); // returns 'hi, henrik'

// it also maintains the prototype chain
// so instanceof checks will work up the chain

// so this is true
awesome instanceof AwesomePerson; // true;

// and so is this
awesome instanceof Person; // true

```

## child models and collections

You can declare children and collections that will get instantiated on init as follows:

```js
var State = require('ampersand-state');
var Messages = require('./models/messages');
var ProfileModel = require('./models/profile');


var Person = State.extend({
    props: {
        name: 'string'
    },
    collections: {
        // `Messages` here is a collection
        messages: Messages
    },
    children: {
        // `ProfileModel` is another ampersand-state constructor
        profile: ProfileModel
    }
});

// When we instantiate an instance of a Person 
// the Messages collection and ProfileModels
// are instantiated as well

var person = new Person();

// so meetings exists as an empty collection
person.meetings instanceof Meetings; // true

// and profile exists as an empty `ProfileModel`
person.profile instanceof ProfileModel; // true

// This also provides some additional capabilities
// when we instantiate a state object with some
// data it will apply them to the collections and child
// models as you might expect:
var otherPerson = new Person({
    messages: [
        {from: 'someone', message: 'hi'},
        {from: 'someoneElse', message: 'yo!'},
    ],
    profile: {
        name: 'Joe', 
        hairColor: 'black'
    }
});

// now messages would have a length
otherPerson.messages.length === 2; // true

// and the profile state object would be
// populated
otherPerson.profile.name === 'Joe'; // true

// The same works for `set`, it will apply it 
// to children as well. 
otherPerson.set({profile: {name: 'Mary'}});

// Since this a state object it triggers a `change:name` on 
// the `profile` object. 
// In addition, since it's a child that event propagates 
// up. More on that below.
```

## Event bubbling, derived properties based on children

Say you want a simple way to listen for any changes that are represented in a tempalate.

Let's say you've got a `person` state object with a `profile` child. You want an easy way to listen for changes to either the base `person` object or the `profile`. In fact, you want to listen to anything related to the person object. 

Rather than having to worry about watching the right thing, we do exactly what the browser does to solve this problem: we bubble up the events up the chain. 

Now we can listen for deeply nested changes to properties.

And we can declare derived properties that depend on children. For example:

```js
var Person = State.extend({
    children: {
        profile: Profile
    },
    derived: {
        childsName: {
            // now we can declare a child as a
            // dependency
            deps: ['profile.name'],
            fn: function () {
                return 'my child\'s name is ' + this.profile.name;
            }
        }
    }
});

var me = new Person();

// we can listen for changes to the derived property
me.on('change:childsName', function (model, newValue) {
    console.log(newValue); // logs out `my child's name is henrik`
});

// so when a property of a child is changed the callback
// above will be fired (if the resulting derived property is different)
me.profile.name = 'henrik';
```

## A quick note about instanceof checks

With npm and browserify for module deps you can sometimes end up with a situation where, the same `state` constructor wasn't used to build a `state` object. As a result `instanceof` checks will fail. 

In order to deal with this (because sometimes this is a legitimate scenario), `state` simply creates a read-only `isState` property on all state objects that can be used to check whether or a not a given object is in fact a state object no matter what its constructor was.
<!-- endhide -->

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
