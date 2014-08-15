/*
These still need to be ported to use tape, etc.
*/

//does not work
  test("#1791 - `attributes` is available for `parse`", function() {
    var Model = AmpersandModel.extend({
      parse: function() { this.has('a'); } // shouldn't throw an error
    });
    var model = new Model(null, {parse: true});
    expect(0);
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
