/*
These still need to be ported to use tape, etc.

*/



test("#1664 - Changing from one value, silently to another, back to original triggers a change.", 1, function() {
    var Model = AmpersandModel.extend({
      props: {
        x: 'number'
      }
    });
    var model = new Model({x:1});
    model.on('change:x', function() { ok(true); });
    model.set({x:2},{silent:true});
    model.set({x:3},{silent:true});
    model.set({x:1});
  });

  test("#1664 - multiple silent changes nested inside a change event", 2, function() {
    var changes = [];
    var Model = AmpersandModel.extend({
      props: {
        a: 'string',
        b: 'number',
        c: 'string'
      }
    });
    var model = new Model();
    model.on('change', function() {
      model.set({a: 'c'}, {silent:true});
      model.set({b: 2}, {silent:true});
      model.unset('c', {silent:true});
    });
    model.on('change:a change:b change:c', function(model, val) { changes.push(val); });
    model.set({a:'a', b:1, c:'item'});
    deepEqual(changes, ['a',1,'item']);
    deepEqual(model.attributes, {a: 'c', b: 2});
  });

  test("#1791 - `attributes` is available for `parse`", function() {
    var Model = AmpersandModel.extend({
      parse: function() { this.has('a'); } // shouldn't throw an error
    });
    var model = new Model(null, {parse: true});
    expect(0);
  });

  test("silent changes in last `change` event back to original triggers change", 2, function() {
    var changes = [];
    var Model = AmpersandModel.extend({
      props: {
        a: 'string'
      }
    });
    var model = new Model();
    model.on('change:a change:b change:c', function(model, val) { changes.push(val); });
    model.on('change', function() {
      model.set({a:'c'}, {silent:true});
    });
    model.set({a:'a'});
    deepEqual(changes, ['a']);
    model.set({a:'a'});
    deepEqual(changes, ['a', 'a']);
  });

  test("#1943 change calculations should use _.isEqual", function() {
    var Model = AmpersandModel.extend({
      props: {
        a: 'object'
      }
    });
    var model = new Model({a: {key: 'value'}});
    model.set('a', {key:'value'}, {silent:true});
    equal(model.changedAttributes(), false);
  });

  test("#1964 - final `change` event is always fired, regardless of interim changes", 1, function () {
    var Model = AmpersandModel.extend({
      props: {
        property: 'string'
      }
    });
    var model = new Model();
    model.on('change:property', function() {
      model.set('property', 'bar');
    });
    model.on('change', function() {
      ok(true);
    });
    model.set('property', 'foo');
  });

  test("isValid", function() {
    var Model = AmpersandModel.extend({
      props: {
        valid: 'boolean'
      }
    });
    var model = new Model({valid: true});
    model.validate = function(attrs) {
      if (!attrs.valid) return "invalid";
    };
    equal(model.isValid(), true);
    equal(model.set({valid: false}, {validate:true}), false);
    equal(model.isValid(), true);
    model.set({valid:false});
    equal(model.isValid(), false);
    ok(!model.set('valid', false, {validate: true}));
  });

  test("#1545 - `undefined` can be passed to a model constructor without coersion", function() {
    var Model = AmpersandModel.extend({
      defaults: { one: 1 },
      initialize : function(attrs, opts) {
        equal(attrs, undefined);
      }
    });
    var emptyattrs = new Model();
    var undefinedattrs = new Model(undefined);
  });

  test("#1179 - isValid returns true in the absence of validate.", 1, function() {
    var model = new Backbone.Model();
    model.validate = null;
    ok(model.isValid());
  });

  test("#1961 - Creating a model with {validate:true} will call validate and use the error callback", function () {
    var Model = AmpersandModel.extend({
      props: {
        id: 'number'
      },
      validate: function (attrs) {
        if (attrs.id === 1) return "This shouldn't happen";
      }
    });
    var model = new Model({id: 1}, {validate: true});
    equal(model.validationError, "This shouldn't happen");
  });

  test("#2034 - nested set with silent only triggers one change", 1, function() {
    var Model = AmpersandModel.extend({
      props: {
        a: 'boolean',
        b: 'boolean'
      }
    });
    var model = new Model();
    model.on('change', function() {
      model.set({b: true}, {silent: true});
      ok(true);
    });
    model.set({a: true});
  });


  test("#2030 - set with failed validate, followed by another set triggers change", function () {
    var attr = 0, main = 0, error = 0;
    var Model = AmpersandModel.extend({
      props: {
        x: 'number'
      },
      validate: function (attr) {
        if (attr.x > 1) {
          error++;
          return "this is an error";
        }
      }
    });
    var model = new Model({x:0});
      model.on('change:x', function () { attr++; });
      model.on('change', function () { main++; });
      model.set({x:2}, {validate:true});
      model.set({x:1}, {validate:true});
      deepEqual([attr, main, error], [1, 1, 1]);
  });
