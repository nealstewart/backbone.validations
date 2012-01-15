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

  equals(test.set({}), false);
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

  test.bind('error', function() {
    errorCallbackCalled = true;
  });

  test.set({});

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

  test.bind('error:' + nameOfAttribute, function() {
    errorCallbackCalled = true;
  });

  test.set({});

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
  test.bind('error:' + nameOfAttribute, function() {
    nameCallbackCalled = true;
  });

  var normalCallbackCalled = false;
  test.bind('error', function() {
    normalCallbackCalled = true;
  });

  var overrideCallbackCalled = false;
  var overrideCallback = function() {
    overrideCallbackCalled = true;
  };

  test.set({}, {
    error: overrideCallback
  });

  equals(false, normalCallbackCalled, "normal callback called");
  equals(false, nameCallbackCalled, "name callback called");
  ok(overrideCallbackCalled);
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
  testModel.set({name: valueToBeSet});

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

  testModel.bind('error', function(model, errors) {
    errorCallbackCalled = true;
    errorWasIncluded = _.include(errors.name, "error dude");
  });

  valueToBeSet = "blech";
  testModel.set({name: valueToBeSet});

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

  equals(t.set({woo: "hoo"}), false);

  equals(t.get('woo'), undefined);
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

  equals(t.set({name: null}), false);
  equals(t.set({name: ""}), false);
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
  t.set({name: "whatever"});
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
  equals(t.set({name: "whatever"}), false);
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
  t.bind('error', function(model, errors) {
    errorResponseWasIncluded = _.include(errors.name, errorResponse);
  });
  
  t.set({name: "blech"});

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
  equals(t.set({name : "neal"}), t);
  equals(t.set({name : "al"}), false);
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
  equals(t.set({name : "neals"}), false);
  equals(t.set({name : "al"}), t);
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
  ok(newTestModel.set({name:"test"}));
  equals(newTestModel.set({name:"broken"}), false);
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
  equals(m.set({size: 2}), false);
  ok(m.set({size: 5}));
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
  equals(m.set({size: 5}), false);
  ok(m.set({size: 1}));
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
  equals(m.set({size: 5}), false);
  ok(m.set({size: 2}));
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
  ok(model.set({name: 'white'}));
  equals(model.set({name: 'yellow'}), false);
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
  equals(m.set({email : "boogers"}), false);
  ok(m.set({email : "neal@snot.ca"}));
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
  equals(m.set({link : "boogers"}), false);
  ok(m.set({link : "http://snot.ca"}));
  ok(m.set({link : "ftp://snot.ca"}));
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
  ok(m.set({address : "33"}));
  ok(m.set({address : "33.333"}));
  equals(m.set({address : "33.333f"}), false);
  equals(m.set({address : "f33.333f"}), false);
  equals(m.set({address : "."}), false);
  ok(m.set({address : "089"}));
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
  nm.set({name: "Neal"});
  equals(nm.set({name: ""}), false);

  var um = new UnnameModel();
  um.set({name: "Neal"});
  ok(um.set({name: ""}));
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

  ok(vm.set({name: "neal", age: 10}));
  equals(vm.set({name: "neal", age: 201}), false);
  equals(vm.set({name: "al", age: 10}), false);
  equals(vm.set({name: "neal", age: -5}), false);
  ok(vm.set({name: "neal", age: "10"}));
  equals(vm.set({name: "neal", age: "201"}), false);
  equals(vm.set({name: "ne", age: 1}), false);
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

  v.bind('error', function(model, errors) {
    deepEqual(errors, {
      name: ["required"],
      whatever: ["min"]
    });
  });

  v.set({whatever: 0})
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

  vm.bind('error', function(model, error) {
    deepEqual({
      age: ["max"]
    }, error);
  });

  equals(vm.set({name: "neal", age: 201}), false);
});

test("maxlength", function() {
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

  vm.bind('error', function(model, error) {
    deepEqual({
      name: ["minlength"]
    }, error);
  });
  
  equals(vm.set({name: "al", age: 10}), false);
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

  vm.bind('error', function(model, error) {
    deepEqual({
      name: ["pattern"]
    }, error);
  });
 
  equals(vm.set({name: "a323", age: 10}), false);
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

  vm.bind('error', function() {
    ok(false);
  });
 
  vm.save({
    number: 10
  }, {
    success: function() {
      ok(false);
    },
    error: function(model, error) {
      deepEqual({
        name: ["required"]
      }, error);
    }
  });
});


});
