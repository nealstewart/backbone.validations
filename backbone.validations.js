(function(Backbone) {
// Premade Validators
Backbone.Validations = {};

var validators = {
  "custom" : function(methodName, attributeName, model, valueToSet) {
    return model[methodName](attributeName, valueToSet);
  },

  "presence" : function(attributeName, model, valueToSet) {
    var currentValue = model.get(attributeName);
    var isNotAlreadySet = _.isUndefined(currentValue);

    var isNotBeingSet = _.isUndefined(valueToSet);

    if (_.isNull(valueToSet) || valueToSet === "" ||
         (isNotBeingSet && isNotAlreadySet)) {
      return "presence";
    } else {
      return false;
    }
  },

  "format" : function(pattern, attributeName, model, valueToSet) {
    if (_.isString(valueToSet)) {
      if (valueToSet.match(pattern)) {
        return false;
      } else {
        return "format";
      }
    }
  },

  "length" : function(minLength, maxLength, attributeName, model, valueToSet) {
    var undef;
    if (_.isString(valueToSet)) {
      var underMinLength;
      if (minLength > 0) {
        underMinLength = valueToSet.length < minLength;
      }
      var overMaxLength;
      if (maxLength > 0) {
        overMaxLength = valueToSet.length > maxLength;
      }

      var errors = [];
      if (underMinLength) errors.push( "minLength" );
      if (overMaxLength)  errors.push( "maxLength" );

      return errors.length ? errors : false;
    }
  }
};

var customValidators = {};
var getCustomValidator = function(name) {
  var cv = customValidators[name];
  if (!cv) throw "custom validator '"+name+"' could not be found.";

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
      errorsForAttribute = validateAttribute(this, valueToSet, hasOverridenError, options);
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
function createValidator(attributeName, type, description) {
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
    case "format" : {
      var pattern;
      if (_.isString(description)) {
        switch (description) {
          case "date" : {
            pattern = /^[0-3]?[0-9]\/[01]?[0-9]\/[12][90][0-9][0-9]$/;
            break;
          }
          default : {
            throw "improper date";
          }
        }

      } else if(_.isRegExp(description)) {
        pattern = description;

      } else {
        throw "improper format given to validate.";
      }
      validator = validators.format;
      validator = _.bind(validator, null, pattern);

      break;
    }
    case "length" : {
      validator = validators.length;
      var minLength = description.min;
      var maxLength = description.max; 
      var minLengthNotSet = _.isNull(minLength) || _.isUndefined(minLength);
      var maxLengthNotSet = _.isNull(maxLength) || _.isUndefined(maxLength);
      if (minLengthNotSet && maxLengthNotSet) throw "need to set either a max or min length";
      validator = _.bind(validator, null, minLength, maxLength);
      break;
    }
    case "custom" : {
      if (!_.isString(description)) { throw "Custom error callback names must be a string"; }

      validator = _.bind(validators.custom, null, description);
      break;
    }
    default : {
      validator = _.bind(getCustomValidator(type), null, description);
      if (!validator) {
        throw "Improper validation type '"+type+"'" ;
      }
    }
  }

  validator = _.bind(validator, null, attributeName);

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
      if (!hasOverridenError) {
          model.trigger('error:'+attributeName, model, errors, options);
      }
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
function newPerformValidation(attrs, options) {
  var newAttrs = {
    attributes : attrs,
    options : options,
    hasOverridenError : !!options.error
  };
  
  return oldPerformValidation.call(this, newAttrs, options);
}




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
        this.constructor.prototype._attributeValidators = createValidators(this.validate);
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
