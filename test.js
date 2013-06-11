$(document).ready(function(){

module("general tests");
test("it maintains the original validate interface", function() {
  var ValidatingModel = Backbone.Model.extend({
    validate: {
      name: {
        required: true
      },
      number: {
        required: true
      }
    }
  });

  var vm = new ValidatingModel;

  deepEqual(vm.validate({"hahah": 3}), {
    name: ["required"],
    number: ["required"]
  });
});

test("set returns false when failing", function() {
  var TestModel = Backbone.Model.extend({
    validate : {
      name : {
        required : true
      }
    }
  });

  var test = new TestModel;

  equal(test.set({}, {validate: true}), false);
});

test("set triggers an error event on the model", function() {
  var TestModel = Backbone.Model.extend({
    validate : {
      name : {
        required : true
      }
    }
  });

  var test = new TestModel;
  var errorCallbackCalled = false;

  test.bind('invalid', function() {
    errorCallbackCalled = true;
  });

  test.set({}, {validate: true});

  ok(errorCallbackCalled);
});

test("set triggers an error event named after the attribute, on the model", function() {
  var nameOfAttribute = "name";
  var validateObject = {};
  validateObject[nameOfAttribute] = {required : true};

  var TestModel = Backbone.Model.extend({
    validate : validateObject
  });

  var test = new TestModel;
  var errorCallbackCalled = false;

  test.bind('invalid:' + nameOfAttribute, function() {
    errorCallbackCalled = true;
  });

  test.set({}, {validate: true});

  ok(errorCallbackCalled);
});


test("providing a direct override prevents normal and named errors from being triggered", function() {
  var nameOfAttribute = "name";
  var validateObject = {};
  validateObject[nameOfAttribute] = {required : true};

  var TestModel = Backbone.Model.extend({
    validate : validateObject
  });

  var test = new TestModel;

  var nameCallbackCalled = false;
  test.bind('invalid:' + nameOfAttribute, function() {
    nameCallbackCalled = true;
  });

  var normalCallbackCalled = false;
  test.bind('invalid', function() {
    normalCallbackCalled = true;
  });

  equal(false, normalCallbackCalled, "normal callback called");
  equal(false, nameCallbackCalled, "name callback called");
});

module("Backbone.Validations.addValidator");
test("Custom validators can be provided, and can be added to a model, and will be executed.", function() {
  var testModel, optionsPassed, valueToBeSet;
  var testModelMatched = false,
      optionsPassedMatched = false,
      valueToBeSetMatched = false;

  var customValidator = function(options, attributeName, model, valueToSet) {
    testModelMatched = model === testModel;
    optionsPassedMatched = options == optionsPassed;
    valueToBeSetMatched = valueToSet === valueToBeSet;
  };


  Backbone.Validations.addValidator("customValidator", customValidator);

  optionsPassed = {};
  var TestModel = Backbone.Model.extend({
    validate : {
      "name" : {
        customValidator : optionsPassed
      }
    }
  });

  testModel = new TestModel;
  valueToBeSet = "blech";
  testModel.set({name: valueToBeSet}, {validate: true});

  ok(testModelMatched);
  ok(optionsPassedMatched);
  ok(valueToBeSetMatched);
});

test("Custom validators can be provided, and can be added to a model, and will be trigger error if they return something.", function() {
  var testModel, optionsPassed, valueToBeSet;

  var customValidator = function(options, attributeName, model, valueToSet) {
    return "error dude";
  };

  Backbone.Validations.addValidator("newCustomValidator", customValidator);

  optionsPassed = {};
  var TestModel = Backbone.Model.extend({
    validate : {
      "name" : {
        newCustomValidator : optionsPassed
      }
    }
  });

  testModel = new TestModel;
  var errorCallbackCalled = false,
      errorWasIncluded = false;

  testModel.bind('invalid', function(model, errors) {
    errorCallbackCalled = true;
    errorWasIncluded = _.include(errors.name, "error dude");
  });

  valueToBeSet = "blech";
  testModel.set({name: valueToBeSet}, {validate: true}, {validate: true});

  ok(errorCallbackCalled);
  ok(errorWasIncluded);
});

test("It can't override an existing validation, custom or preset.", function() {
  var presetThrowsError = false,
    doubleCustomThrowsError = false;

  try {
    Backbone.Validations.addValidator("required", function() {});
  } catch (err) {
    presetThrowsError = true;
  }

  ok(presetThrowsError, 'preset threw error');

  Backbone.Validations.addValidator("dasds6231237123", function() {});
  try {
    Backbone.Validations.addValidator("dasds6231237123", function() {});
  } catch (err) {
    doubleCustomThrowsError = true;
  }

  ok(doubleCustomThrowsError);
});


module("required validator");
test("doesn't set other values, when there is no current value, and no value is passed", function() {
  var TestModel = Backbone.Model.extend({
    validate : {
      name : {
        required : true
      }
    }
  });

  var t = new TestModel;

  equal(t.set({woo: "hoo"}, {validate: true}), false);

  equal(t.get('woo'), undefined);
});

module("validate as a function");

test("defining validate as a function which returns an object works", function() {
  var TestModel = Backbone.Model.extend({
    validate : function () {
      return {
        name : {
          required : true
        }
      };
    }
  });

  var t = new TestModel;

  equal(t.set({woo: "hoo"}, {validate: true}), false);
  equal(t.get('woo'), undefined);
});


test("won't allow a value to be set to null, or blank", function() {
  var TestModel = Backbone.Model.extend({
    validate : {
      name : {
        required : true
      }
    }
  });

  var t = new TestModel;

  equal(t.set({name: null}, {validate: true}), false);
  equal(t.set({name: undefined}, {validate: true}), false);
  equal(t.set({name: ""}, {validate: true}), false);
});

module("custom attribute validator");
test("it calls the custom validator", function() {
  var customValidatorCalled = false;
  var TestModel = Backbone.Model.extend({
    validate : {
      name : {
        custom : "nameOfMethod"
      }
    },

    nameOfMethod : function(attributeName, attributeValue) {
      customValidatorCalled = true;
    }
  });

  var t = new TestModel;
  t.set({name: "whatever"}, {validate: true});
  ok(customValidatorCalled);
});

test("can cause an error", function() {
  var TestModel = Backbone.Model.extend({
    validate : {
      name : {
        custom : "nameOfMethod"
      }
    },

    nameOfMethod : function() {
      return "error";
    }
  });

  var t = new TestModel;
  equal(t.set({name: "whatever"}, {validate: true}), false);
});

test("it's included in the errors", function() {
  var errorResponse = "blech";
  var TestModel = Backbone.Model.extend({
    validate : {
      name : {
        custom : "nameOfMethod"
      }
    },

    nameOfMethod : function() {
      return errorResponse;
    }
  });

  var t = new TestModel;
  var errorResponseWasIncluded = false;
  t.bind('invalid', function(model, errors) {
    errorResponseWasIncluded = _.include(errors.name, errorResponse);
  });

  t.set({name: "blech"}, {validate: true});

  ok(errorResponseWasIncluded);
});

module("minlength validator");
test("given a minimum length, it will error if given a string that is a smaller", function() {
  var lengthToBeLessThan = 3;
  var TestModel = Backbone.Model.extend({
    validate : {
      name : {
        minlength : 3
      }
    }
  });

  var t = new TestModel;
  equal(t.set({name : "neal"}, {validate: true}), t);
  equal(t.set({name : "al"}, {validate: true}), false);
});

module("maxlength validator");
test("given a maximum length, it will error if given a string that is a larger", function() {
  var TestModel = Backbone.Model.extend({
    validate : {
      name : {
        maxlength : 4
      }
    }
  });

  var t = new TestModel;
  equal(t.set({name : "neals"}, {validate: true}), false);
  equal(t.set({name : "al"}, {validate: true}), t);
});

module("pattern validation");
test("pattern /^test/", function() {
  var PatternTestModel = Backbone.Model.extend({
    validate : {
      name : {
        pattern : /^test/
      }
    }
  });

  var newTestModel = new PatternTestModel;
  ok(newTestModel.set({name:"test"}, {validate: true}));
  equal(newTestModel.set({name:"broken"}, {validate: true}), false);
});

module("min validation");
test("works", function() {
  var MinTestModel = Backbone.Model.extend({
    validate : {
      size : {
        min : 3
      }
    }
  });

  var m = new MinTestModel;
  equal(m.set({size: 2}, {validate: true}), false);
  ok(m.set({size: 5}, {validate: true}));
});

module("in validation");
test("works", function() {
  var InTestModel = Backbone.Model.extend({
    validate : {
      size : {
        in : [
          1, 2, 3
        ]
      }
    }
  });

  var m = new InTestModel;
  equal(m.set({size: 5}, {validate: true}), false);
  ok(m.set({size: 1}, {validate: true}));
});

module("max validation");
test("works", function() {
  var MaxTestModel = Backbone.Model.extend({
    validate : {
      size : {
        max : 3
      }
    }
  });

  var m = new MaxTestModel;
  equal(m.set({size: 5}, {validate: true}), false);
  ok(m.set({size: 2}, {validate: true}));
});


module("whitelists");
test("valid colors", function() {
  var ColorTestingModel = Backbone.Model.extend({
    validate : {
      name : {
        in: [
          'white',
          'blue',
          'red'
        ]
      }
    }
  });

  var model = new ColorTestingModel;
  ok(model.set({name: 'white'}, {validate: true}));
  equal(model.set({name: 'yellow'}, {validate: true}), false);
});

module("array elements validation");
test("works", function() {
  var ArrayElemTestModel = Backbone.Model.extend({
    validate : {
      myArray : {
        arrayElem : function(elem) {
          if (elem < 100) return true;
        }
      }
    }
  });

  var m = new ArrayElemTestModel();
  ok(m.set({myArray : []}, {validate: true}));
  equal(m.set({myArray : [101, 89]}, {validate: true}), false);
  equal(m.set({myArray : [788]}, {validate: true}), false);
  ok(m.set({myNumber : [1, 67]}, {validate: true}));
});

module("type validations");
test("email", function() {
  var EmailTestModel = Backbone.Model.extend({
    validate : {
      email : {
        type : "email"
      }
    }
  });

  var m = new EmailTestModel;
  equal(m.set({email : "boogers"}, {validate: true}), false);
  ok(m.set({email : "neal@snot.ca"}, {validate: true}));
});


test("url", function() {
  var UrlTestModel = Backbone.Model.extend({
    validate : {
      link : {
        type : "url"
      }
    }
  });

  var m = new UrlTestModel;
  equal(m.set({link : "boogers"}, {validate: true}), false);
  ok(m.set({link : "http://snot.ca"}, {validate: true}));
  ok(m.set({link : "ftp://snot.ca"}, {validate: true}));
});


test("number", function() {
  var NumberTestModel = Backbone.Model.extend({
    validate : {
      address : {
        type : "number"
      }
    }
  });

  var m = new NumberTestModel();
  ok(m.set({address : "33"}, {validate: true}));
  ok(m.set({address : 33}, {validate: true}));
  ok(m.set({address : "33.333"}, {validate: true}));
  equal(m.set({address : "33.333f"}, {validate: true}), false);
  equal(m.set({address : "f33.333f"}, {validate: true}), false);
  equal(m.set({address : "."}, {validate: true}), false);
  ok(m.set({address : "089"}, {validate: true}));
});

test("String", function() {
  var StringTestModel = Backbone.Model.extend({
    validate : {
      address : {
        type : "String"
      }
    }
  });

  var m = new StringTestModel();
  ok(m.set({address : "bla bla"}, {validate: true}));
  ok(m.set({address : "33.333"}, {validate: true}));
  equal(m.set({address : 33.333}, {validate: true}), false);
  equal(m.set({address : []}, {validate: true}), false);
});

test("Array", function() {
  var ArrayTestModel = Backbone.Model.extend({
    validate : {
      elements : {
        type : "Array"
      }
    }
  });

  var m = new ArrayTestModel();
  ok(m.set({elements : []}, {validate: true}));
  ok(m.set({elements : ["bla", "bla"]}, {validate: true}));
  equal(m.set({elements : "bla"}, {validate: true}), false);
  equal(m.set({elements : {}}, {validate: true}), false);
});

test("Boolean", function() {
  var BooleanTestModel = Backbone.Model.extend({
    validate : {
      isNoGood : {
        type : "Boolean"
      }
    }
  });

  var m = new BooleanTestModel();
  ok(m.set({isNoGood : false}, {validate: true}));
  ok(m.set({isNoGood : true}, {validate: true}));
  equal(m.set({isNoGood : "bla"}, {validate: true}), false);
  equal(m.set({isNoGood : 1}, {validate: true}), false);
});

test("digits", function() {
  var NumberTestModel = Backbone.Model.extend({
    validate : {
      myNumber : {
        type : "digits"
      }
    }
  });

  var m = new NumberTestModel();
  ok(m.set({myNumber : "123"}, {validate: true}));
  equal(m.set({myNumber : "33.333f"}, {validate: true}), false);
  equal(m.set({myNumber : "f33.333f"}, {validate: true}), false);
  equal(m.set({myNumber : "-123"}, {validate: true}), false);
  equal(m.set({myNumber : "."}, {validate: true}), false);
  equal(m.set({myNumber : "abc"}, {validate: true}), false);
  ok(m.set({myNumber : "089"}, {validate: true}));
});

module("test for overlaps");
test("different models shouldn't affect one another", function() {
  var NameModel = Backbone.Model.extend({
    validate : {
      name : {
        required: "true"
      }
    }
  });

  var UnnameModel = Backbone.Model.extend({
  });

  var nm = new NameModel();
  nm.set({name: "Neal"}, {validate: true});
  equal(nm.set({name: ""}, {validate: true}), false);

  var um = new UnnameModel();
  um.set({name: "Neal"}, {validate: true});
  ok(um.set({name: ""}, {validate: true}));
});

module("WHOA A BUNCH AT ONCE");
test("a whole bunch!", function() {
  var ValidatingModel = Backbone.Model.extend({
    validate : {
      name : {
        required  : true,
        pattern   : /[a-zA-Z]+/,
        minlength : 3,
        maxlength : 100
      },
      age : {
        type: "number",
        min: 0,
        max: 200
      }
    }
  });

  var vm = new ValidatingModel;

  ok(vm.set({name: "neal", age: 10}, {validate: true}));
  equal(vm.set({name: "neal", age: 201}, {validate: true}), false);
  equal(vm.set({name: "al", age: 10}, {validate: true}), false);
  equal(vm.set({name: "neal", age: -5}, {validate: true}), false);
  ok(vm.set({name: "neal", age: "10"}, {validate: true}));
  equal(vm.set({name: "neal", age: "201"}, {validate: true}), false);
  equal(vm.set({name: "ne", age: 1}, {validate: true}), false);
});

module("The shape of validation errors");
test("The errors object should be an object literal", function() {
  var ValidatingModel = Backbone.Model.extend({
    validate : {
      name : {
        required: "true"
      },
      whatever: {
        min: 10
      }
    }
  });

  var v = new ValidatingModel;

  v.bind('invalid', function(model, errors) {
    deepEqual(errors, {
      name: ["required"],
      whatever: ["min"]
    });
  });

  v.set({whatever: 0}, {validate: true})
});


test("proper shaped responses", function() {
  var ValidatingModel = Backbone.Model.extend({
    validate : {
      name : {
        required  : true,
        pattern   : /^[a-zA-Z]+$/,
        minlength : 3,
        maxlength : 100
      },
      age : {
        type: "number",
        min: 0,
        max: 200
      }
    }
  });

  var vm = new ValidatingModel;

  vm.bind('invalid', function(model, error) {
    deepEqual({
      age: ["max"]
    }, error);
  });

  equal(vm.set({name: "neal", age: 201}, {validate: true}), false);
});

test("minlength", function() {
  var ValidatingModel = Backbone.Model.extend({
    validate : {
      name : {
        required  : true,
        pattern   : /^[a-zA-Z]+$/,
        minlength : 3,
        maxlength : 100
      },
      age : {
        type: "number",
        min: 0,
        max: 200
      }
    }
  });

  var vm = new ValidatingModel;

  vm.bind('invalid', function(model, error) {
    deepEqual({
      name: ["minlength"]
    }, error);
  });

  equal(vm.set({name: "al", age: 10}, {validate: true}), false);
});

test("pattern", function() {
  var ValidatingModel = Backbone.Model.extend({
    validate : {
      name : {
        required  : true,
        pattern   : /^[a-zA-Z]+$/,
        minlength : 3,
        maxlength : 100
      },
      age : {
        type: "number",
        min: 0,
        max: 200
      }
    }
  });

  var vm = new ValidatingModel;

  vm.bind('invalid', function(model, error) {
    deepEqual({
      name: ["pattern"]
    }, error);
  });

  equal(vm.set({name: "a323", age: 10}, {validate: true}), false);
});

test("save options success", function() {
  var ValidatingModel = Backbone.Model.extend({
    validate: {
      name: {
        required: true
      },
      number: {
        required: true
      }
    }
  });

  var vm = new ValidatingModel;

  vm.bind('invalid', function(model, error) {
    deepEqual({
      name: ["required"]
    }, error);
  });

  vm.save({
    number: 10
  }, {
    success: function() {
      ok(false);
    },
    error: function(model, error) {
      ok(false);
    }
  });
});


});
