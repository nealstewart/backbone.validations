#Backbone.Validations
--------

## How To Use:

Just include the script file, and then instead of passing a function as the validate attribute, you pass an object literal:

    var ValidatingModel = Backbone.Model.extend({
      validate : {
        name : {
          required  : true,
          pattern   : /[a-zA-Z]+/,
          in        : ["Sam", "Harry"],
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
        }
      }
    });

Mmm hmm.

Give 'er a go!
