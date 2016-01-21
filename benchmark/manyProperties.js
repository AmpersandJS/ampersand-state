var State = require('../ampersand-state');

// State slows down massively with many properties.
// We benchmark this here.
function createModel() {
  var aModel = State.extend({
    derived: {
      foo: {
        deps: ['a', 'b'],
        fn: function derived () {
          return this.a + this.b;
        }
      }
    }
  });
  return aModel;
}

// Go through most of the normal ascii range.
// Adjust I and J for larger objects.
var properties = {};
for (var i = 0; i < 1; i++) {
  for (var j = 0; j < 83; j++) {
    properties[String.fromCharCode(j + 33) + i] = j;
  }
}

//Function that contains the pattern to be inspected
var aModel = createModel();
function benchFn() {
  return new aModel(properties).foo;
}

function printStatus(fn) {
    switch(%GetOptimizationStatus(fn)) {
        case 1: console.log("Function is optimized"); break;
        case 2: console.log("Function is not optimized"); break;
        case 3: console.log("Function is always optimized"); break;
        case 4: console.log("Function is never optimized"); break;
        case 6: console.log("Function is maybe deoptimized"); break;
    }
}

//Fill type-info
benchFn();
// 2 calls are needed to go from uninitialized -> pre-monomorphic -> monomorphic
benchFn();
benchFn();
benchFn();
benchFn();
benchFn();

%OptimizeFunctionOnNextCall(benchFn);
//The next call
benchFn();

//Check
printStatus(benchFn);


console.time('manyProperties');
for (var i = 0; i < 10000;i++) {
  benchFn();
}
console.timeEnd('manyProperties');
