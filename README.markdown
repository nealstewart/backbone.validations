This is a work in progress.

You use Backbone.Validations like so ...

    var AwesomeModel = Backbone.Model.extend({
      validate : {
        "awesome" : { presence : true }
      }
    });

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
          "custom" : "customAttributeMethod"
        }
      },

      nameOfFunction : function(attributeName, attributeValue) {
        if ("There's An Error") {
          return "error_name";
        } else {
          return false; // or another falsy value.
        }
      }
    });

The custom validation function works in a similar manner to the normal
model.validate. It receives the value you're setting. Have it return a non falsy value if you'd like it to throw an error.

TODO:

* Write validations
* Add the ability to easily add custom validations

Something like this would be cool:

    Backbone.Validations.addValidatorType("validationName", function() { ... } );
