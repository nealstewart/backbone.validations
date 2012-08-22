// Copyright (C) 2011 Neal Stewart
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is furnished to do
// so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


(function(Backbone) {
// Premade Validators
Backbone.Validations = {};

var validators = {
  "custom" : function(methodName, attributeName, model, valueToSet) {
    return model[methodName](attributeName, valueToSet);
  },

  "required" : function(attributeName, model, valueToSet) {
    var currentValue = model.get(attributeName);
    var isNotAlreadySet = _.isUndefined(currentValue);
    var isNotBeingSet = _.isUndefined(valueToSet);
    if (_.isNull(valueToSet) || valueToSet === "" || (isNotBeingSet && isNotAlreadySet)) {
      return "required";
    } else {
      return false;
    }
  },

  "in" : function(whitelist, attributeName, model, valueToSet) {
    return _.include(whitelist, valueToSet) ? undefined : "in";
  },

  "email" : function(type, attributeName, model, valueToSet) {
    var emailRegex = new RegExp("[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?");
    if (_.isString(valueToSet) && !valueToSet.match(emailRegex)) {
      return "email";
    }
  },

  "url" : function(type, attributeName, model, valueToSet) {
    // taken from jQuery UI validation
    var urlRegex = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
    if (_.isString(valueToSet) && !valueToSet.match(urlRegex)) {
      return "url";
    }
  },

  "number" : function(type, attributeName, model, valueToSet) {
    return isNaN(valueToSet) ? 'number' : undefined;
  },

  "pattern" : function(pattern, attributeName, model, valueToSet) {
    if (_.isString(valueToSet)) {
      if (pattern.test(valueToSet)) {
        return false;
      } else {
        return "pattern";
      }
    }
  },

  "min" : function(minimumValue, attributeName, model, valueToSet) {
    if (valueToSet < minimumValue) {
      return "min";
    }
  },

  "max" : function(maximumValue, attributeName, model, valueToSet) {
    if (valueToSet > maximumValue) {
      return "max";
    }
  },

  "minlength" : function(minlength, attributeName, model, valueToSet) {
    if (_.isString(valueToSet)) {
      if (valueToSet.length < minlength) { return "minlength"; }
    }
  },

  "maxlength" : function(maxlength, attributeName, model, valueToSet) {
    if (_.isString(valueToSet)) {
      if (valueToSet.length > maxlength) { return "maxlength"; }
    }
  }
};

var customValidators = {};
var getCustomValidator = function(name) {
  var cv = customValidators[name];
  if (!cv) { throw "custom validator '"+name+"' could not be found."; }
  return cv;
};

Backbone.Validations.addValidator = function(name, validator) {
  if (validators.hasOwnProperty(name) || customValidators.hasOwnProperty(name)) {
    throw "existing validator";
  }
  customValidators[name] = validator;
};

/*
  The newValidate method overrides validate in Backbone.Model.
  It has the same interface as the validate function which you
  would provide.

  The returned object looks like this:

    {
      attributeName : ["required", "of", "errors"],
      otherAttributeName: ["and", "so", "on"]
    }

  */
function newValidate(attributes, chgs) {
	  var errorsForAttribute,
	      errorHasOccured,
	      errors = {},
		  valueToSet;
	  
	  // Copy _attributeValidators into another array, which will grow as nested collections are inflated
	  var attrNames = _.keys(this._attributeValidators);
	  
	  var uninflatedChanges = {};
	  
	  for(var a in chgs){
		  var value = chgs[a];
		  a = a.replace(/\[\d+\]/g, "[]");
		  uninflatedChanges[a] = value; 
	  }
	  
	  for (var i = 0; i < attrNames.length; i++) {
		// Handle names for nested attributes	
		var attrName = attrNames[i];
		
		// if no changes have been passed, do nothing different than before.
		if(chgs === undefined){
			var attrNameFragments = attrName.split(".");
			
			for (var j = 0; j < attrNameFragments.length; j++) {
				var element = attrNameFragments[j];
				var attrNameTypeEnum = {
					NORMAL : 0,
					ARRAY : 1,
					ARRAY_ITEM : 2
				}
				var attrNameType = attrNameTypeEnum.NORMAL;
				var arrayIndex = -1;
				
				// Determine attribute name fragment type: (normal, uninflated array [], or inflated array item [n])
				element = element.replace(/\[(\d*)\]/, function(match, p1) {
					if (match === "[]") {
						attrNameType = attrNameTypeEnum.ARRAY;
					} else {
						attrNameType = attrNameTypeEnum.ARRAY_ITEM;
						arrayIndex = p1;
					}
					return "";
				});
				
				// Advance the placeholder in the JSON tree to reflect the current attribute name fragment
				if (j == 0) {
					if (attrNameType === attrNameTypeEnum.ARRAY_ITEM) {
						valueToSet = attributes[element][arrayIndex];
					} else valueToSet = attributes[element];
				} else {
					if (attrNameType === attrNameTypeEnum.ARRAY_ITEM) {
						valueToSet = valueToSet[element][arrayIndex];
					} else valueToSet = valueToSet[element];
				}
					
				// If this is an uninflated array, inflate it by appending array item entries to the end of attrNames
				if (attrNameType === attrNameTypeEnum.ARRAY) {
				  for (var k = 0; k < valueToSet.length; k++) {
					// Copy attrName into var, find the position of the first [] in the attrName, replace with [j], and push to attrNames
					var nameToPush = attrName.replace("[]", "[" + k + "]");
					attrNames.push(nameToPush);
				  }
				  break;
				} 
			}

			// Skip the attrNames that are arrays (empty []), but do process the inflated array items ([0], [1], etc.)
			if (attrNameType !== attrNameTypeEnum.ARRAY) {
				var errorsForAttribute = "";
				
				var attrValidatorName = attrName.replace(/\[\d+\]/g, "[]");
				var validateAttribute = this._attributeValidators[attrValidatorName];
				if (validateAttribute)  {
				  errorsForAttribute = validateAttribute(this, valueToSet);
				}
				if (errorsForAttribute) {
				  errorHasOccured = true;
				  errors[attrName] = errorsForAttribute;
				}
			}
			
		// if changes have been passed in we can skip the blanket inflation of all arrays
	    	// and just validate the changed key and value.
		} else if (uninflatedChanges[attrName]) {

			  for(var c in chgs){
				  
				  var uninflatedC = c.replace(/\[\d+\]/g, "[]");
				  if(uninflatedC === attrName){
					  var errorsForAttribute = "";
					  var valueToSet = chgs[c];
					  var validateAttribute = this._attributeValidators[attrName];
					  if (validateAttribute)  {
						  errorsForAttribute = validateAttribute(this, valueToSet);
					  }
					  if (errorsForAttribute) {
						  errorHasOccured = true;
						  errors[c] = errorsForAttribute;
					  }
				  }

			  }

		  }

		
	  }   
	return errorHasOccured ? errors : false;
}

function createMinValidator(attributeName, minimumValue) {
  return _.bind(validators.min, null, minimumValue);
}

function createMaxValidator(attributeName, maximumValue) {
  return _.bind(validators.max, null, maximumValue);
}


/* createValidator takes in:
    - the model
    - the name of the attribute
    - the type of validation
    - the description of the validation

   returns a function that takes in:
     - the value being set for the attribute

     and either returns nothing (undefined),
     or the error name (string).
  */
function createValidator(attributeName, type, description) {
  var validator,
      validatorMethod,
      customValidator;

  if (type === "type") {
    type = description;
  }
  validator = validators[type];

  if (!validator) { validator = getCustomValidator(type); }

  if (!validator) { throw "Improper validation type '"+type+"'" ; }

  if (type !== "required") { // doesn't need the description
    validator = _.bind(validator, null, description, attributeName);
  } else {
    validator = _.bind(validator, null, attributeName);
  }

  return validator;
}

function createAttributeValidator(attributeName, attributeDescription) {
  var validatorsForAttribute = [],
      type,
      desc;

  for (type in attributeDescription) {
    desc = attributeDescription[type];
    validatorsForAttribute.push(createValidator(attributeName, type, desc));
  }

  return function(model, valueToSet, hasOverridenError, options) {
    var validator,
        result,
        errors = [];

    for (var i = 0, length = validatorsForAttribute.length; i < length; i++) {
      validator = validatorsForAttribute[i];
      result = validator(model, valueToSet);
      if (result) {
        if (_.isArray(result)) {
          errors = errors.concat(result);
        } else {
          errors.push(result);
        }
      }
    }

    if (errors.length) {
      return errors;
    } else {
      return false;
    }
  };
}

function createValidators(modelValidations) {
  var attributeValidations,
      attributeValidators = {};

  for (var attrName in modelValidations) {
    attributeValidations = modelValidations[attrName];
    attributeValidators[attrName] = createAttributeValidator(attrName, attributeValidations);
  }

  return attributeValidators;
}

var oldPerformValidation = Backbone.Model.prototype._performValidation;
function performNestedValidation(attrs, options, chgs) {

  if (options.silent || !this.validate) return true;
  
  var errors = null;
  
  // if no changes have been made, there's no reason to validate
  if(chgs !== undefined && _.isEmpty(chgs)){
	  errors = this.validate(attrs);
  }else if(chgs){
	  errors = this.validate(attrs,chgs);
  }
  
  if (errors) {
    if (options.error) {
      options.error(this, errors, options);
    } else {
      this.trigger('error', this, errors, options);
      _.each(errors, function(error, name) {
        this.trigger('error:' + name, this, errors, options);
      }, this);
    }
    return false;
  }
  if (attrs) {
	  this.trigger('validated', this, attrs, options);
  }
  return true;
}

// save the old backbone
var oldModel = Backbone.Model;

// Constructor for our new Validations Model
Backbone.Validations.Model = Backbone.Model.extend({
  constructor : function() {
    // if they pass an object, construct the new validations
    if (typeof this.validate === "object" && this.validate !== null) {
      if (!this.constructor.prototype._attributeValidators) {
        this.constructor.prototype._attributeValidators = createValidators(this.validate);
        this.constructor.prototype.validate = newValidate;
		this.constructor.prototype._validate = performNestedValidation;
      }
    }

    oldModel.apply(this, arguments);
  }
});

// Override Backbone.Model with our new Model
Backbone.Model = Backbone.Validations.Model;


// Requisite noConflict
Backbone.Validations.Model.noConflict =  function() {
  Backbone.Model = oldModel;
};

}(Backbone));