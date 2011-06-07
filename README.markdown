So what if you could validate your Backbone Models like this:

    var AwesomeModel = Backbone.Model.extend({
      validate : {
        "name" : { 
          presence : true,
          length : {
            min : 3,
            max : 150
          }
        }
      }
    });

Now you can.


Just like before, validations don't get run until you start setting attributes.

    var a = new AwesomeModel;
    
    var attributesWereSet = a.set({somethingNotAwesome: "something"});
    attributesWereSet => false

The error callback gives you some cool info.

    a.bind('error', function(model, errors, options) { console.log(errors); });
    {
      awesome : ["presence"] 
    }

The errors object has attribute names as keys, 
with arrays of string describing the errors of each attribute.

Plus there are named errors!

    a.bind('error:awesome', function(model, errors, options) { console.log(errors); });
    a.set({somethingNotAwesome: "something"});

    [ "presence" ] << a list of errors is passed.

You can also use a custom attribute validator:

    var ExampleModel = Backbone.Model.extend({
      validate : {
        name : {
          "presence" : true,
          "custom" : "customAttributeValidation"
        }
      },

      customAttributeValidation : function(attributeName, attributeValue) {
        if ("There's An Error") {
          return "error_name";
        } else {
          return false; // or another falsy value.
        }
      }
    });

The custom validation function works in a similar manner to the normal
model.validate. It receives the value you're setting. Have it return a non falsy value if you'd like it to throw an error.

I am stomping ALL OVER the original Backbone.Model. If you feel skeezy about this, then feel free to call:
    
    Backbone.Model.noConflict();

Both will restore Backbone.Model to its' rightful spot, and allow you to find the new validating model at:
    
    Backbone.Validations.Model


TODO:

* Write validations
* Add custom validation methods

Something like this:

    var Model = Backbone.Model.extend({
      validate : {
        customValidation : "methodName"
      }
    });

* Add the ability to easily add custom validations

Something like this would be cool:

    Backbone.Validations.addValidatorType("validationName", function() { ... } );
