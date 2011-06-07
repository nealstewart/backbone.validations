(function(Backbone) {
// Premade Validators
var validators = {
  "presence" : function(attributeName, valueToSet) {
    var currentValue = this.get(attributeName);
    var isNotAlreadySet = _.isUndefined(currentValue);

    var isNotBeingSet = _.isUndefined(valueToSet);

    if (_.isNull(valueToSet) || valueToSet === "" ||
         (isNotBeingSet && isNotAlreadySet)) {
      return "presence";
    } else {
      return false;
    }
  },

  "length" : function(minLength, maxLength, attributeName, valueToSet) {
    var undef;
    if (typeof valueToSet === "string") {
      var underMinLength;
      if (minLength > 0) {
        underMinLength = valueToSet.length < minLength;
      }
      var overMaxLength;
      if (maxLength > 0) {
        overMaxLength = valueToSet.length > maxLength;
      }

      var errors = [];
      if (underMinLength) errors.push( "under_min" );
      if (overMaxLength)  errors.push( "over_max" );

      return errors.length ? errors : false;
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
      options = params.options,
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
      errorsForAttribute = validateAttribute.call(this, valueToSet, hasOverridenError, options);
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
    - the name of the attribute
    - the type of validation
    - the description of the validation

   returns a function that takes in:
     - the value being set for the attribute
   
     and either returns nothing (undefined), 
     or the error name (string).
  */
function createValidator(model, attributeName, type, description) {
  var validator,
      validatorMethod,
      customValidator;
  
  switch (type) {
    case "presence" : {
      if (!description) {
        throw "presence should only be given true";
      }

      validator = validators.presence;
      break;
    }
    case "length" : {
      validator = validators.length;
      var minLength = description.min;
      var maxLength = description.max; 
      var minLengthNotSet = _.isNull(minLength) || _.isUndefined(minLength);
      var maxLengthNotSet = _.isNull(maxLength) || _.isUndefined(maxLength);
      if (minLengthNotSet && maxLengthNotSet) throw "need to set either a max or min length";
      validator = _.bind(validator, this, minLength, maxLength);
      break;
    }
    case "custom" : {
      if (!_.isString(description)) { throw "Custom error callback names must be a string"; }
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

  return function(valueToSet, hasOverridenError, options) {
    var validator,
        result,
        errors = [];

    for (var i = 0, length = validatorsForAttribute.length; i < length; i++) {
      validator = validatorsForAttribute[i];
      result = validator.call(this, valueToSet);
      if (result) {
        if (_.isArray(result)) {
          errors = errors.concat(result);
        } else {
          errors.push(result);
        }
      }  
    }
    
    if (errors.length) {
      if (!hasOverridenError) {
          this.trigger('error:'+attributeName, this, errors, options);
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
    options : options,
    hasOverridenError : !!options.error
  };
  
  return oldPerformValidation.call(this, newAttrs, options);
}

Backbone.Validations = {};



// the following inheritance method is ripped straight from Backbone.
// it would be nice if backbone made this public
// so that i could avoid this repetition.
var ctor = function(){};
var inherits = function(parent, protoProps, staticProps) {
  var child;
  if (protoProps && protoProps.hasOwnProperty('constructor')) {
    child = protoProps.constructor;
  } else {
    child = function(){ return parent.apply(this, arguments); };
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  if (protoProps) _.extend(child.prototype, protoProps);
  if (staticProps) _.extend(child, staticProps);
  child.prototype.constructor = child;
  child.__super__ = parent.prototype;
  return child;
};

// save the old backbone
var oldModel = Backbone.Model;

// Constructor for our new Validations Model
Backbone.Validations.Model = inherits(Backbone.Model, {
  constructor : function() {
    // if they pass an object, construct the new validations
    if (typeof this.validate === "object" && this.validate !== null) {
      if (!this.constructor.prototype._attributeValidators) {
        this.constructor.prototype._attributeValidators = createValidators(this, this.validate);
        this.constructor.prototype.validate = newValidate;
        this.constructor.prototype._performValidation = newPerformValidation;
      }
    }
    
    oldModel.apply(this, arguments);
  }
}, Backbone.Model);

// Override Backbone.Model with our new Model
Backbone.Model = Backbone.Validations.Model;

// Requisite noConflict
Backbone.Validations.Model.noConflict =  function() {
  Backbone.Model = oldModel;
};

})(Backbone);
