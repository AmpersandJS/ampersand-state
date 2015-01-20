/* jshint esnext:true */
var test = require('tape');
var State = require('../ampersand-state');

test("can use State in a class extends", (t) => {
    class SubState extends State {
        props() {
            return {
                name: "string"
            };
        }
    }

    var myState = new SubState({ name: "Phil", foo: "bar" });
    t.equal(myState.name, "Phil", "Has a name prop");
    t.notOk(myState.foo, "Shouldn't set unknown props");

    t.throws(() => {
        new SubState({ name: 1234 });
    }, /must be of type string/, "Throws on typeerror as expected");

    t.end();
});

test("can subclass an es5 state", (t) => {
    var BaseState = State.extend({
        extraProperties: 'allow',

        props: {
            name: 'string',
            age: 'any'
        }
    });

    class SubState extends BaseState {
        props() {
            return {
                age: 'number',
                height: 'number'
            };
        }
    }

    var myState = new SubState({
        name: 'Phil',
        age: 27,
        height: 165,
        someExtraProp: 'abc'
    });

    t.equal(myState.name, 'Phil');
    t.equal(myState.age, 27);
    t.equal(myState.height, 165);
    t.equal(myState.someExtraProp, 'abc', 'should inherit "instance variable" from es5 extend');
    t.end();
});

test("can sub-sub-class es6, with mergeProps", (t) => {
    class BaseState extends State {
        get props() {
            return {
                name: 'string',
                age: 'string' //to demonstrate it being overridden
            };
        }

        get session() {
            return {
                loggedIn: 'string',
                tempProp: 'any'
            };
        }

        get derived() {
            return {
                summary: {
                    deps: ['name', 'age'],
                    fn() { return `${this.name} ${this.age}`; }
                },
                doubleAge: {
                    deps: ['age'],
                    fn() { return "double " + this.age; }
                }
            };
        }
    }

    class SubState extends BaseState {
        get props() {
            return this._mergeProps(super.props, {
                age: 'number',
                height: 'number'
            });
        }

        get session () {
            return this._mergeProps(super.session, {
                loggedIn: 'boolean',
                otherTempProp: 'any'
            });
        }

        get derived() {
            return this._mergeProps(super.derived, {
                doubleAge: {
                    deps: ['age'],
                    fn() { return 2 * this.age; }
                }
            });
        }
    }

    //Base State -------------
    var myBaseState = new BaseState({
        name: 'Phil',
        age: 'a-string',
        height: 165,

        //session props
        loggedIn: 'yes',
        tempProp: 'tempValue'
    });

    t.equal(myBaseState.name, 'Phil', 'Basic prop');
    t.equal(myBaseState.age, 'a-string', 'Sub class does not affect parent class def');
    t.notOk(myBaseState.height, 'Sub class does not add def to parent class');

    //session props
    t.equal(myBaseState.loggedIn, 'yes', 'session props work as expected');
    t.equal(myBaseState.tempProp, 'tempValue');

    //derived props
    t.equal(myBaseState.doubleAge, 'double a-string', 'Derived props work');

    //type checking
    t.throws(() => {
        new BaseState({ age: 123 });
    }, /must be of type string/);

    t.throws(() => {
        new BaseState({ loggedIn: true });
    }, /must be of type string/);


    //Sub State -------------
    var mySubState = new SubState({
        name: 'Phil',
        age: 27,
        height: 165,

        loggedIn: true,
        tempProp: 'someValue',
        otherTempProp: 'someOtherValue'
    });

    //props
    t.equal(mySubState.name, 'Phil', 'Inherits name def from super');
    t.equal(mySubState.age, 27, 'Overwrites age def with correct type');
    t.equal(mySubState.height, 165, 'Adds height def');

    //session
    t.equal(mySubState.loggedIn, true, 'session props can be overridden');
    t.equal(mySubState.tempProp, 'someValue', 'session props can be inherited');
    t.equal(mySubState.otherTempProp, 'someOtherValue', 'session props can be added to');

    //derived
    t.equal(mySubState.doubleAge, 54, 'Derived props can be overrideen');
    t.equal(mySubState.summary, "Phil 27", 'Derived props can be inherited with mergeProps');

    t.end();
});

test("can sub-sub-class es6, with mergeProps and seal", (t) => {
    class BaseState extends State {
        get props() {
            return {
                name: 'string',
                age: 'string' //to demonstrate it being overridden
            };
        }

        get session() {
            return {
                loggedIn: 'string',
                tempProp: 'any'
            };
        }

        get derived() {
            return {
                summary: {
                    deps: ['name', 'age'],
                    fn() { return `${this.name} ${this.age}`; }
                },
                doubleAge: {
                    deps: ['age'],
                    fn() { return "double " + this.age; }
                }
            };
        }
    }
    //State.seal(BaseState);

    class SubState extends BaseState {
        get props() {
            return this._mergeProps(super.props, {
                age: 'number',
                height: 'number'
            });
        }

        get session () {
            return this._mergeProps(super.session, {
                loggedIn: 'boolean',
                otherTempProp: 'any'
            });
        }

        get derived() {
            return this._mergeProps(super.derived, {
                doubleAge: {
                    deps: ['age'],
                    fn() { return 2 * this.age; }
                }
            });
        }
    }

    State.seal(SubState);
    
    //Base State -------------
    var myBaseState = new BaseState({
        name: 'Phil',
        age: 'a-string',
        height: 165,

        //session props
        loggedIn: 'yes',
        tempProp: 'tempValue'
    });

    t.equal(myBaseState.name, 'Phil', 'Basic prop');
    t.equal(myBaseState.age, 'a-string', 'Sub class does not affect parent class def');
    t.notOk(myBaseState.height, 'Sub class does not add def to parent class');

    //session props
    t.equal(myBaseState.loggedIn, 'yes', 'session props work as expected');
    t.equal(myBaseState.tempProp, 'tempValue');

    //derived props
    t.equal(myBaseState.doubleAge, 'double a-string', 'Derived props work');

    //type checking
    t.throws(() => {
        new BaseState({ age: 123 });
    }, /must be of type string/);

    t.throws(() => {
        new BaseState({ loggedIn: true });
    }, /must be of type string/);


    //Sub State -------------
    var mySubState = new SubState({
        name: 'Phil',
        age: 27,
        height: 165,

        loggedIn: true,
        tempProp: 'someValue',
        otherTempProp: 'someOtherValue'
    });

    //props
    t.equal(mySubState.name, 'Phil', 'Inherits name def from super');
    t.equal(mySubState.age, 27, 'Overwrites age def with correct type');
    t.equal(mySubState.height, 165, 'Adds height def');

    //session
    t.equal(mySubState.loggedIn, true, 'session props can be overridden');
    t.equal(mySubState.tempProp, 'someValue', 'session props can be inherited');
    t.equal(mySubState.otherTempProp, 'someOtherValue', 'session props can be added to');

    //derived
    t.equal(mySubState.doubleAge, 54, 'Derived props can be overrideen');
    t.equal(mySubState.summary, "Phil 27", 'Derived props can be inherited with mergeProps');

    t.end();
});

test('can add extra configuration', (t) => {
    class MyState extends State {
        get extraProperties() { return 'allow'; }
        get idAttribute() { return 'someIdAttribute'; }
        get namespaceAttribute() { return 'someNamespaceAttribute'; }
        get typeAttribute() { return 'someTypeAttribute'; }

        get props() {
            return {
                someIdAttribute: 'string',
                someNamespaceAttribute: 'string',
                someTypeAttribute: 'string'
            };
        }
    }

    var myState = new MyState({
        foo: 'bar',
        someIdAttribute: 'someId',
        someNamespaceAttribute: 'someNamespace',
        someTypeAttribute: 'someType'
    });

    t.equal(myState.foo, 'bar', 'allows extra props if set');
    t.equal(myState.getId(), 'someId', 'changes idAttribute');
    t.equal(myState.getNamespace(), 'someNamespace', 'changes idNamespaceAttribute');
    t.equal(myState.getType(), 'someType', 'changes typeAttribute');
    t.end();
});

test('es6 class gets statics?', (t) => {
    class MyState extends State {
        get props() {
            return {
                name: 'string'
            };
        }
    }

    t.equal(typeof MyState.extend, 'function');
    t.end();
});
