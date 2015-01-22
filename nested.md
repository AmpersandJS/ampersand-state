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
