#Backbone.Validations
--------

## How To Use:

Just include the script file, and then instead of passing a function as the validate attribute, you pass an object literal:

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
        },
        email : {
          type: "email"
        },
        homepage : {
          type: "url"
        },
        "occupation" : {
          in : [}}]
            "Lawyer",
            "Doctor",
            "Professor",
            "Economist"
          ]
        }
      }
    });

This still works 

    var vm = new ValidatingModel;

    vm.bind('error', function(model, errs) {
      // wherein errors looks like this
      // { name: ["required", "pattern", "minlength"] }
    });


But now you can do this:

    vm.bind('error:name', function(model, errs) {
      // wherein errors looks like this:
      // ["required", "pattern", "minlength"]
    });

You can define a custom validator for a type of Model.

    var CustomValidatingModel = Backbone.Model.extend({
      validate: {
        custom: "supercomplicatedlogic"
      },

      supercomplicatedlogic: function(attributeName, attributeValue) {
        if (attributeValue != "awesome") {
          return "supercomplicatedlogicfail";
        } 
      }
    });

Or if you have some super complicated validator that you want to share among ALL of your Models you can do this:
    
    Backbone.Validations.addValidator("awesomeValidator", function(options, attributeName, model, valueToSet) {
      // do junk
      // return something if you want to communicate stuff!
    });

    var CustomGlobalUsingValidationDudeModel = Backbone.Model.extend({
      validate : {
        name: {
          awesomeValidator: "whatever"
        }
      } 
    });

Give 'er a go!
