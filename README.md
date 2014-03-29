# ampersand-state

An observable, extensible state object with derived watchable properties.

Ampersand-state serves as a base object for [ampersand-model](http://github.com/ampersandjs/ampersand-model) but is useful any time you want to track complex state.

[ampersand-model](https://github.com/ampersandjs/ampersand-model) extends ampersand-state to include assumptions that you'd want if you're using models to model date from a REST API. But by itself ampersand-state is useful for anytime you want something to model state, that fires events for changes and lets you define and listen to derived properties.

<!-- starthide -->
Part of the [Ampersand.js toolkit](http://ampersandjs.com) for building clientside applications.
<!-- endhide -->

## browser support

[![browser support](https://ci.testling.com/ampersandjs/ampersand-state.png)
](https://ci.testling.com/ampersandjs/ampersand-state)

## install

```
npm install ampersand-state
```

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
    derirved: {
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

## Changelog

- 0.1.0 - lots of cleanup, grabbing tests from human-model, now maintains the prototype chain so `instanceof` checks pass no matter how many times it's been extended.
- 0.0.2 - improved doc
- 0.0.1 - initial publish

<!-- starthide -->
## Credits

[@HenrikJoreteg](http://twitter.com/henrikjoreteg)

## License

MIT
<!-- endhide -->
