# ampersand-state

<!-- starthide -->
Part of the [Ampersand.js toolkit](http://ampersandjs.com) for building clientside applications.
<!-- endhide -->

An observable, extensible state object with derived watchable properties.

Ampersand-state serves as a base object for [ampersand-model](http://github.com/ampersandjs/ampersand-model) but is useful any time you want to track complex state.

[ampersand-model](https://github.com/ampersandjs/ampersand-model) extends ampersand-state to include assumptions that you'd want if you're using models to model data from a REST API. But by itself ampersand-state is useful for anytime you want something to model state, that fires events for changes and lets you define and listen to derived properties.

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

To create a **State** class of your own, you extend **AmpersandState** and provide instance properties and options for your class. Typically here you will pass any properties (`props`, `session` and `derived`) of your state class, and any instance methods to be attached to instances of your class.

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

`AmpersandState.extend` does more than just copy attributes from one prototype to another. As such it is incompatible with Coffeescript's class-based extend. TypeScript users may have similar issues. 

For instance, this will not work since it never actually calls `AmpersandState.extend`:

```
class Foo extends AmpersandView
     constructor: (options)->
         @special = options.special
         super
```


### constructor/initialize `new AmpersandState([attrs], [options])`

When creating an instance of a state object, you can pass in the initial values of the **attributes** which will be [set](#ampersand-state-set) on the state. Unless [extraProperties](#amperand-state-extra-properties) is set to `allow`, you will need to have defined these attributes in `props` or `session`.

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
* `[parent]` {AmpersandState} - pass a reference to a state's parent to store on the state.

### idAttribute `state.idAttribute`

The attribute that should be used as the unique id of the state. `getId` uses this to determine the id for use when constructing a model's url for saving to the server.

Defaults to `'id'`.

```
var Person = AmpersandModel.extend({
    idAttribute: 'personId',
    urlRoot: '/people',
    props: {
        personId: 'number',
        name: 'string'
    }
});

var me = new Person({ personId: 123 });

console.log(me.url()) //=> "/people/123"
```

### getId `state.getId()`

Get ID of state per `idAttribute` configuration. Should *always* be how ID is determined by other code.

### namespaceAttribute `state.namespaceAttribute`

The property name that should be used as a namespace. Namespaces are completely optional, but exist in case you need to make an additionl distinction between states, that may be of the same type, with potentially conflicting IDs but are in fact different.

Defaults to `'namespace'`.

### getNamespace `state.getNamespace()`

Get namespace of state per `namespaceAttribute` configuration. Should *always* be how namespace is determined by other code.

### typeAttribute

The property name that should be used to specify what type of state this is. This is optional, but specifying a state type types provides a standard, yet configurable way to determine what type of state it is.

Defaults to `'modelType'`.

### getType `state.getType()`

Get type of state per `typeAttribute` configuration. Should *always* be how type is determined by other code.

### extraProperties `AmpersandState.extend({ extraProperties: 'allow' })`

Defines how properties that aren't defined in `props`, `session` or `derived` are handled. May be set to `'allow'`, `'ignore'` or `'reject'`.

Defaults to `ignore`.

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
//=> TypeError('No foo property defined on this state and extraProperties not set to "ignore" or "allow".');
```

### collection `state.collection`

A reference to the collection a state is in, if in a collection.

This is used for building the default `url` property, etc.

Which is why you can do this:

```js
// some ampersand-rest-collection instance
// with a `url` property
widgets.url //=> '/api/widgets'

// get a widget from our collection
var badWidget = widgets.get('47');

// Without a `collection` reference this
// widget wouldn't know what URL to build
// when calling destroy
badWidget.destroy(); // does a DELETE /api/widgets/47
```

### cid `state.cid`

A special property of states, the **cid**, or a client id, is a unique identifier automatically assigned to all states when they are first created. Client ids are handy when the state has not been saved to the server, and so does not yet have its true **id** but needs a unique id so it can be rendered in the UI etc.

```javascript
var userA = new User();
console.log(userA.cid) //=> "state-1"

var userB = new User();
console.log(userB.cid) //=> "state-2"
```

### isNew `state.isNew()`

Has this state been saved to the server yet? If the state does not yet have an id (using `getId()`), it is considered to be new.

### escape `state.escape()`

Similar to `get`, but returns the HTML-escaped version of a state's attribute. If you're interpolating data from the state into HTML, using **escape** to retrieve attributes will help prevent XSS attacks.

```
var hacker = new PersonModel({
    name: "<script>alert('xss')</script>"
});

document.body.innerHTML = hacker.escape('name');
```

### isValid `state.isValid()`

Check if the state is currently in a valid state, it does this by calling the `validate` method, of your state if you've provided one.


### dataTypes  `AmpersandState.extend({ datatypes: myCustomTypes })`

ampersand-state defines several built-in datatypes:  `string`, `number`, `boolean`, `array`, `object`, `date`, or `any`.  Of these, `object`, `array` and `any` allow for a lot of extra flexibility.  However sometimes it may be useful to define your own custom datatypes.  Then you can use these types in the `props` below with all their features (like `required`, `default`, etc).  

To define a type, you generally will provide an object with 4 member functions (though only 2 are usually necessary)  `get`, `set`, `default`, and `compare`.  

`set : function(newVal){};  returns {type : type, val : newVal};`:  Called on every set, returns an object with two members : `val` and `type`.  If the 'type' value does not equal the name of the dataType you defined, a `TypeError` will be thrown.

`compare : function(currentVal, newVal, attributeName){}; returns boolean`:  Called on every set, Should return true if `oldVal` and `newVal` are equal.  Non-equal values will eventually trigger `change` events (unless `{silent : true}` is an option sent to the state's `set` method (not to be confused with the `set` method of the dataType).

`get : function(val){} returns val;`:  Overrides the default getter of this type.  Useful if you want to make defensive copies.  For example, the `date` dataType returns a clone of the internally saved `date` to keep the internal state consistent. 

`default : function(){} returns val;`:  The returns the default value for this type.  
 

For example, let's say your application uses a special type of date, "JulianDate".  You'd like to setup this as a type in state, but don't want to just use `any` or `object` as the type.  To define it:
```javascript
// Julian Date is a 'class' defined elsewhere: 
// it has an 'equals' method and takes `{julianDays : number}` as a constructor

var Person = AmpersandState.extend({
   dataTypes : {
        julianDate : {
           // set called every time someone tried to set a property of this datatype
           set : function(newVal){                 
               if(newVal instanceof JulianDate){
                   return {
                       val : newVal,
                       type : 'julianDate'
                   };
               }
               try{
                   // try to parse it from passed in value:
                   var newDate = new JulianDate(newVal);
               
                   return {
                       val : newDate,
                       type : 'julianDate'
                   };
               }catch(parseError){
                   // return the value with what we think its type is
                   return {
                       val : newVal,
                       type : typeof newVal
                   };
               }
           },
           compare : function(currentVal, newVal, attributeName){
               return currentVal.equals(newVal);
           }
       }
           
   }
   props : {
       bornOn : 'julianDate',
       retiresOn : {
           type : 'julianDate',
           required : 'true',
           default : function(){
                  // assuming an 'add' function on julian date which returns a new JulianDate
                  return this.bornOn.add('60','years');               
               }
           }
   }
});

var person = new Person({ bornOn : new JulianDate({julianDays : 1000}); }
// this will also work and will build a new JulianDate
var person = new Person({bornOn : {julianDays : 1000}});

// will construct a new julian date for us
// and will also trigger a change event
person.bornOn = {julianDays : 1001}; 

// but this will not trigger a change event since the equals method would return true
person.bornOn = {julianDays : 1001};
   
```


### props `AmpersandState.extend({ props: { name: 'string' } })`

Pass **props** as an object to extend, describing the observable properties of your state class. The props properties should not be set on an instance, as this won't define new properties, they should only be passed to extend.

Properties can be defined in three different ways:

* As a string with the expected dataType. One of `string`, `number`, `boolean`, `array`, `object`, `date`, or `any`. Eg: `name: 'string'`. Can also be set to the name of a custom `dataTypes` if any are defined for the class.
* An array of `[dataType, required, default]`
* An object `{ type: 'string', required: true, default: '' , values: [], allowNull: false, setOnce: false }`
* `default` will be the value that the property will be set to if it is undefined, either by not being set during initialization, or by being explicit set to undefined.
* If `required` is true, one of two things will happen.  If a `default` is set for the property, the property will start with that value, and revert to it after a call to `unset(propertyName)`.  If a `default` is not set for the property, an error will be thrown after a call to `unset(propertyName)`.
* If `values` array is passed, then you'll be able to change a property to one of those values only.
* If `setOnce` is true, then you'll be able to set property only once.
  * If used in combination with a `default` and you instantiate without that value, the default becomes the first value `set`. Thus cannot be set again. 
  * If you don't have a default and don't set the value initially it can be set later, but only once.
* Trying to set a property to an invalid type will raise an exception.

* See [get](#ampersand-state-get) and [set](#ampersand-state-set) for more information about getting and setting properties.

```javascript
var Person = AmpersandState.extend({
    props: {
        name: 'string',
        age: 'number',
        paying: ['boolean', true, false], // required attribute, defaulted to false
        type: {
            type: 'string',
            values: ['regular-hero', 'super-hero', 'mega-hero']
        }
    }
});
```

#### defaulting to objects/arrays

You will get an error if you try to set the default of any property as either an object or array.  This is because those two data types are mutable and passed by reference.  If you were to default a property to `[]` this would return *the same array* on every new instantiation of the state.

Instead, if you want to default a property to an array or object you can set `default` to a function like this

```javascript
AmpersandModel.extend({
    props: {
        checkpoints: {
            type: 'array',
            default: function () { return []; }
        }
    }
});
```

It's worth noting that both `array` and `object` do this already: they default to empty versions of themselves.  You would only need to do this if you wanted to default to an array/object that wasn't empty.

### session `AmpersandState.extend({ session: { name: 'string' } })`

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
        name: 'string'
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

### collections `AmpersandState.extend({ collections: { widgets: Widgets } })`

Define child collection objects to attach to the object. Attributes passed to the constructor or to `set()` will be proxied to the collections. 

```javascript
var State = require('ampersand-state');
var Collection = require('ampersand-collection');

var Widget = State.extend({
    props: {
        name: 'string',
        funLevel: 'number'
    }
});

var WidgetCollection = Collection.extend({
    model: Widget
});

var Person = AmpersandState.extend({
    props: {
        name: 'string'
    },
    collections: {
        widgets: WidgetCollection
    }
});

var me = new Person({
    name: 'Henrik', 
    widgets: [
        { name: 'rc car', funLevel: 8 },
        { name: 'skis', funLevel: 11 }
    ]
});

console.log(me.widgets.length); //=> 2
console.log(me.widgets instanceof WidgetCollection); //=> true
```

Note that currently, events *don't* bubble from collections to parent automatically. This is done for efficiency reasons. But there are discussions ongoing about how to best handle this case.


### parse

**parse** is called when the state is initialized allowing the attributes to be modified/remapped/renamed/etc before they are actually applied to the state. In ampersand-state, parse is only called when the state is first initialized, and only if `{ parse: true }` is passed to the constructor options:

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

var me = new Person({ personID: 123, name: 'Phil' },{ parse: true});

console.log(me.id) //=> 123
console.log(me.personID) //=> undefined
```

**parse** is arguably more useful in ampersand-model, where data typically comes from the server.

### serialize `state.serialize()`

Serialize the state object into a plain object, ready for sending to the server (typically called via [toJSON](#ampersand-state-tojson)). Of the state's properties, only `props` is returned, `session` and `derived` are omitted. Will also serialize any `children` or `collections` by calling their serialize methods.


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

Shortcut to toggle boolean properties, or cycle through "ENUM" type properties that have a `values` array in its definition. Fires change events as you would expect from set.

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

Return a copy of the object's previous attributes (the state before the last `"change"` event). Useful for getting a diff between versions of a state, or getting back to a valid state after an error occurs.


### hasChanged `state.hasChanged([attribute])`

Determine if the state has been modified since the last `"change"` event. If an attribute name is passed, determine if that one attribute has changed.

### changedAttributes `state.changedAttributes([objectToDiff])`

Return an object containing all the attributes that have changed, or false if there are no changed attributes. Useful for determining what parts of a view need to be updated and/or what attributes need to be persisted to the server. Unset attributes will be set to undefined.  You can also pass an attributes object to diff against the state, determining if there *would be* a change.

Note that if passing an attributes object to diff against, only changes to properties defined on the model will be detected. This means that changes to children or collections will *not* be returned as changes by this method.

### toJSON `state.toJSON()`

Return a shallow copy of the state's attributes for JSON stringification. This can be used for persistence, serialization, or for augmentation before being sent to the server. The name of this method is a bit confusing, as it doesn't actually return a JSON string — but I'm afraid that it's the way that the JavaScript API for JSON.stringify works.

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
