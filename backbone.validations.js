(function(Backbone) {
// Save the old Backbone

// Premade Validators
var validators = {
  "presence" : function(attributeName, valueToSet) {
    var isNotBeingSet = _.isNull(valueToSet) || _.isUndefined(valueToSet);
    var currentValue = this.get(attributeName);
    var isNotAlreadySet = _.isNull(currentValue) || _.isUndefined(currentValue);

    if (isNotBeingSet && isNotAlreadySet) {
      return "presence";
    } else {
      return false;
    }
  }
};


/*
  The newValidate method overrides validate in Backbone.Model.
  It has the same interface as the validate function which you
  would provide.

  The returned object looks like this:

    {
      attributeName : ["presence", "of", "errors"],
      otherAttributeName: ["and", "so", "on"]
    }

  */
function newValidate(params) {
  var hasOverridenError = params.hasOverridenError,
      attributes = params.attributes,
      errorHasOccured = false,
      errors = {},
      errorsForAttribute,
      attrName,
      valueToSet,
      validateAttribute;

  for (attrName in this._attributeValidators) {
    valueToSet = attributes[attrName];
    validateAttribute = this._attributeValidators[attrName];
    if (validateAttribute)  {
      errorsForAttribute = validateAttribute.call(this, valueToSet, hasOverridenError);
    }
    if (errorsForAttribute) {
      errorHasOccured = true;
      errors[attrName] = errorsForAttribute;
    } 
  }

  return errorHasOccured ? errors : false;
}

/* createValidator takes in:
    - the model
    - the type of validation
    - the description of the validation

   returns a function that takes in:
     - the value being set for the attribute
   
     and either returns nothing (undefined), 
     or the error name (string).
  */
function createValidator(model, attributeName, type, description) {
  var validator,
      customValidator;

  switch (type) {
    case "presence" : {
      if (!description) {
        throw "presence should only be given true";
      }

      validator = validators.presence;
      break;
    }
    case "custom" : {
      if (!_.isString(description)) { throw "Custome error callback names must be a string"; }
      validatorMethod = model[description];

      if (!_.isFunction(validatorMethod)) { throw "Custom validator '"+description+"' is not a function on the model"; }

      validator = validatorMethod;
      break;
    }
    default : {
      throw "Improper validation type '"+type+"'" ;
    }
  }

  validator = _.bind(validator, model, attributeName);

  return validator;
}

function createAttributeValidator(model, attributeName, attributeDescription) {
  var validatorsForAttribute = [],
      type,
      desc;

  for (type in attributeDescription) {
    desc = attributeDescription[type];
    validatorsForAttribute.push(createValidator(model, attributeName, type, desc));
  }

  return function(valueToSet, hasOverridenError) {
    var validator,
        result,
        errors = [];

    for (var i = 0, length = validatorsForAttribute.length; i < length; i++) {
      validator = validatorsForAttribute[i];
      result = validator.call(this, valueToSet);
      if (result) errors.push(result); 
    }
    
    if (errors.length) {
      if (!hasOverridenError) {
          this.trigger('error:'+attributeName, this, errors );
      }
      return errors;
    } else {
      return false;
    }
  };
}

function createValidators(model, modelValidations) {
  var attributeValidations,
      attributeValidators = {};

  for (var attrName in modelValidations) {
    attributeValidations = modelValidations[attrName];
    attributeValidators[attrName] = createAttributeValidator(model, attrName, attributeValidations);
  }

  return attributeValidators;
}

var oldPerformValidation = Backbone.Model.prototype._performValidation;
function newPerformValidation(attrs, options) {
  var newAttrs = {
    attributes : attrs,
    hasOverridenError : !!options.error
  };
  
  return oldPerformValidation.call(this, newAttrs, options);
}

Backbone.Validations = {};

// Constructor for our new Validations Model
var oldModel = Backbone.Model;
Backbone.Validations.Model = function() {
  // if they pass an object, construct the new validations
  if (typeof this.validate === "object" && this.validate !== null) {
    this._attributeValidators = createValidators(this, this.validate);
    this.validate = newValidate;
    this._performValidation = newPerformValidation;
  }
  
  oldModel.apply(this, arguments);
};

// Extend Backbone.Validations.Model with Backbone.Model
Backbone.Validations.Model.prototype = Backbone.Model.prototype;
_.extend(Backbone.Validations.Model, Backbone.Model);

// Override Backbone.Model with our new Model
Backbone.Model = Backbone.Validations.Model;

// Requisite noConflict
Backbone.Validations.noConflict =  function() {
  Backbone.Model = oldModel;
};

})(Backbone);
