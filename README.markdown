#Backbone.Validations
--------

## How To Use:

Just include the script file, and then instead of passing a function as the validate attribute, you pass an object literal:

```javascript
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


## Notes

### Maintains the original Backbone validation interface

```javascript
var ValidatingModel = Backbone.Model.extend({
  validate: function(atts) {
       // YUP!
  }
});
```

### Bind with error events

```javascript
var vm = new ValidatingModel;

vm.bind('error', function(model, errs) {
  // wherein errors looks like this
  // { name: ["required", "pattern", "minlength"] }
});
```

### Bind to specific attribute's errors

```javascript
vm.bind('error:name', function(model, errs) {
  // wherein errors looks like this:
  // ["required", "pattern", "minlength"]
});
```

### Bind with validated events

The Backbone change event will not fire in cases where the same value is set on the attribute, but if you want to detect validation in these cases, use the "validated" event.

```javascript
var vm = new ValidatingModel;

vm.bind('validated', function(model, attrs) {
  // wherein attrs contains the validated attributes
});
```

### Define custom model validators

```javascript
var CustomValidatingModel = Backbone.Model.extend({
  validate: {
    radicality: {
      custom: "supercomplicatedlogic" 
    }    
  },

  supercomplicatedlogic: function(attributeName, attributeValue) {
    if (attributeValue != "awesome") {
      return "supercomplicatedlogicfail";
    } 
  }
});
```

### Add Global Validators to Share among Models

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

### Integrates with [Backbone-Nested](http://afeld.github.com/backbone-nested/)

Backbone-Nested allows you to specify nested attributes with 1-1 and 1-N relationships. You can define validations 
for nested attributes using dot notation and empty square brackets. You will need to import backbone-nested separately
to use this. See testIntegrationWithBackboneNested.htm for more examples.

```javascript
var ValidatingModel = Backbone.Model.extend({
  validate : {
    "person.name" : {
      pattern   : /^[a-zA-Z]+$/,
      minlength : 3,
      maxlength : 100
    },
	"person.addresses[].city" : {
	  maxlength : 100
	}
  }
});
```

Give 'er a go!

### OH AND THERE'S A NOCONFLICT

```javascript
Backbone.Validations.noConflict();

// Now you can get at the validating model with this:

Backbone.Validations.Model
```

#License
------------

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
