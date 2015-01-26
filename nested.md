# Nested models/collections

## Questions/comments
* Setting a setonce data type screws up events [issue-112](https://github.com/AmpersandJS/ampersand-state/issues/112)
* parity/difference between type: state and children [#108](https://github.com/AmpersandJS/ampersand-state/issues/108)
* parse true not passed to children: [issue-106](https://github.com/AmpersandJS/ampersand-state/issues/106)
* store instances of collections/children somewhere[issue-96](https://github.com/AmpersandJS/ampersand-state/issues/95)
* eventing on initialize: [#92](https://github.com/AmpersandJS/ampersand-state/issues/92)
* some stuff about initializing here: [#91](https://github.com/AmpersandJS/ampersand-state/issues/91)
* bubbling custom events: [#77](https://github.com/AmpersandJS/ampersand-state/issues/77)
* derived props on collections
* should not instantiate collections with [] [#49](https://github.com/AmpersandJS/ampersand-state/issues/49)



## Scenarios

* Initialize with a model

    ```
    new Parent({ child: new Child({ name: 'Phil' }) })
    ```

* Initialize with an object

    ```
    new Parent({ child: { name: 'Phil' }})
    ```

* Initialize with nothing

    ```new Parent({ })```

* Set with a model

    ```
    var parent = new Parent({ child: new Child({ name: 'Phil' }) })
    parent.child = new Child({ name: 'Bob' })
    ```

* Set with an object

    ```
    var parent = new Parent({ child: new Child({ name: 'Phil', age: 21 }) })
    parent.child = { name: 'Phil', age: 25 };
    parent.child = { name: 'Bob', age: 30 };
    ```

## Spec

### Generic state property

* A state property can only be set to an instance/subclass of `AmpersandState`
* Will default undefined unless a default is set, default must be a function which returns an instance
* On initialize the property must be an instance: `var parent = new Parent({ child: new Child({ name: 'Phil' }) })`
* Can be set to a new instance, `parent.child = new Child({ name: 'Bob' })`
* When setting to a new instance, event listeners will be setup and torn down as appropriate
* The parent will reemitted change events with a prefix `change:foo` on the child gets reemitted as `change:child.foo` on the parent
* The parent can use child props in derived properties: `bar: { deps: ['child.foo'], fn: function () { return 'foo: ' + this.child.foo; } }`
* Should anything happen with custom/non-change events? `child.on('sync')` => `parent.on('child:sync') [ ] hmmm???

## Child property

* A child property is a stricter/enhanced version of the generic state property
* A child property has a specific class, instances must be of that class (or a subclass)
* On initialize, the property may be an instance, or a POJO. If it's a POJO a new instance will be created `var parent = new Parent({ child: { name: 'Phil' } })` or `var parent = new Parent({ child: new Child({ name: 'Phil' }) })`. Child instances will be initialized with the same options as parent ones
* Can be set to a new instance, `parent.child = new Child({ name: 'Bob' })`
* If set to a new object (not instance) `parent.child = { name: 'Bob' }` something should happen [ ] what???
  - if it updates the existing instance, we risk modifying state elsewhere in the system, which may or may not be intentional
  - it could create a new instance, and if you want to update the existing you would have to do `parent.child.set({ newAttributes: "..." })`


