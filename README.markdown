```
Copyright (C) 2011 Neal Stewart 

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```


#Backbone.Validations
--------

## How To Use:

Just include the script file, and then instead of passing a function as the validate attribute, you pass an object literal:

```javascript
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
    occupation : {
      in : [
        "Lawyer",
        "Doctor",
        "Professor",
        "Economist"
      ]
    }
  }
});
```

## Built-In Validations
- in
  - Takes an array of values, compares with ==
- pattern
  - Takes a regex
- minlength
- maxlength
- min (number)
- max
- type
  - email
  - url
  - number

This still works 

```javascript
var ValidatingModel = Backbone.Model.extend({
  validate: function(atts) {
       // YUP!
  }
});
```

And so does this

```javascript
var vm = new ValidatingModel;

vm.bind('error', function(model, errs) {
  // wherein errors looks like this
  // { name: ["required", "pattern", "minlength"] }
});
```


But now you can do this:

```javascript
vm.bind('error:name', function(model, errs) {
  // wherein errors looks like this:
  // ["required", "pattern", "minlength"]
});
```

You can define a custom validator for a type of Model.

```javascript
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
```

Or if you have some super complicated validator that you want to share among ALL of your Models you can do this:

```javascript
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
```

Give 'er a go!

# OH AND THERE'S A NOCONFLICT

```javascript
Backbone.Validations.noConflict();

// Now you can get at the validating model with this:

Backbone.Validations.Model
```
