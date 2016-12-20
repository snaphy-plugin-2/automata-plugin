# automata plugin for Snaphy


### Plugin for automatic generating all CRUD methods to the UI.

### This plugin is exposed on  `/automata` route


###`GetAbsoluteSchema` method
1) Fetched the schema of any model.
2) You can assign roles to restrict the property.Only dynamic and predefined loopback roles allowed. Now  static roles  are also allowed.
>Example

```
  {
      "property": {
        "status": {
          "type": "string",
          "required": false,
          "default": "allow",
          "template": {
            "type": "selectString",
            "templateOptions": {
              "label": "Add a current status to allow/restrict.",
              "id": "employeeStatus",
              "options": [
                "allow",
                "onhold",
                "reject"
              ],
              "acl":{
                "allow":[],
                "reject": ["BrandStaff", "BrandAdmin"]
              }
            }
          }
        }
      }
      "relations": {
         "brand": {
              "type": "belongsTo",
              "model": "Brand",
              "foreignKey": "",
              "templateOptions": {
                "btnText": "Assign brand",
                "searchProp": "name",
                "search": true,
                "create": false,
                "id": "brandName",
                "acl":{
                  "allow":[],
                  "reject": ["BrandStaff", "BrandAdmin"]
                }
              }
         }
      }
    }
```



```
{
  "name": "Order",
  "base": "PersistedModel",
  "idInjection": true,
  "options": {
    "validateUpsert": true
  },
  "properties": {
    "orderNumber": {
      "type": "number",
      "required": true,
      "template": {
        "type": "dummy"
      }
    },
    "added": {
      "type": "date",
      "defaultFn": "now",
      "template": {
        "type": "dummy"
      }
    },
    "updated": {
      "type": "date",
      "defaultFn": "now"
    },
    "status": {
      "type": "string",
      "required": true,
      "template": {
        "type": "selectString",
        "templateOptions": {
          "label": "Select the order status",
          "id": "orderStatus",
          "options": [
            "pause",
            "stop",
            "active",
            "owing",
            "complementary"
          ],
          "priority": 7
        }
      }
    },
    "special_information": {
      "type": "string",
      "template": {
        "type": "textarea",
        "templateOptions": {
          "type": "text",
          "label": "Add special instruction",
          "id": "orderSpecialNotice",
          "priority": 6
        }
      }
    }
  },
  "validations": [],
  "relations": {
    "products": {
      "type": "hasMany",
      "model": "Product",
      "foreignKey": "",
      "onCascadeDelete": true,
      "through": "ProductOrder",
      "templateOptions": {
        "priority": 8,
        "type": "createOrder",
        "btnText": "Product",
        "searchProp": "name",
        "create": false,
        "search": true,
        "hide": false,
        "show": true,
        "init": true
      }
    },
    "deliveries": {
      "type": "hasOne",
      "model": "Delivery",
      "foreignKey": "",
      "onCascadeDelete": true,
      "templateOptions": {
        "btnText": "delivery detail",
        "create": true,
        "init": true,
        "show": true,
        "search": false,
        "id": "deliveryId",
        "priority": 2
      }
    },
    "invoices": {
      "type": "hasOne",
      "model": "Invoice",
      "foreignKey": "",
      "onCascadeDelete": true,
      "templateOptions": {
        "btnText": "invoice detail",
        "display": false,
        "create": false,
        "init": false,
        "show": false,
        "search": false,
        "id": "customerId",
        "priority": 0
      }
    },
    "customer": {
      "type": "belongsTo",
      "model": "Customer",
      "foreignKey": "",
      "templateOptions": {
        "btnText": "Link Customer",
        "searchProp": "name",
        "create": false,
        "id": "customerId",
        "priority": 10
      }
    },
    "addresses": {
      "type": "belongsTo",
      "model": "Address",
      "foreignKey": "",
      "templateOptions": {
        "btnText": "delivery address",
        "searchProp": "address",
        "where": {
          "customerId": {
            "relationName": "customer",
            "relationKey": "id"
          }
        },
        "whereValidation": {
          "customerId": "Add customer before adding address."
        },
        "displayProperty": [
          {
            "prefix": "City: ",
            "name": "city",
            "suffix": ","
          },
          {
            "prefix": "Area: ",
            "name": "area"
          }
        ],
        "create": false,
        "id": "addressId",
        "priority": 5
      }
    }
  },
  "acls": [],
  "methods": {}
}


```

#How to auto-generate forms for admin panel webpage.
 
 >Each property will have several properties.
  
The server has several predefined paths to defined several functions.
##Model Definition `/common/models/*.json`
All the model `property` and its `relations` will be defined here.
###Rules  
Each property will have a sub-property `template`. `template` is the starting point to add several definitions and rules to a model's `property`.  
**Example:**   
let take a model `Order`.  
`/common/models/order.json` will be model path where model definition is defined. Model name inside models folder is defined in `kebabCase`.
```
    {
      "name": "Customer",
      ....
      ....
      "properties": {
        "firstName": {
          "type": "string",
          "required": true,
          "template": {
            "type": "input",
            "templateOptions": {
              "type": "text",
              "label": "Enter first name",
              "priority": 10,
              "id": "firstName"
            }
          }
        },
        ....
        ....
    }
```
Here, `firstName` is the name of property for model `Order`.   
To generate its form we have to defined a sub-property of `firstName` i.e. `template`. `template` will contain all the this property `firstName` definition of what will be html type of this property, id name etc.  
#### Template options
1. `template` Entry point for html form definition for each property.
  - `type` it will define the html element of property defined using [Angular Formly][1].
  All basic types are predefined for complex type  you can  define it using [Angular Formly][1] syntax rules. 
  Here, firstName name will be an `input` element.   
  Several predefined types and its `options` are defined here in [Predefined Types](#predefined-types) section
  
  
  

###Predefined Types
All predefined html input types defined using [Angular Formly][1] is mentioned here. You can also create any type.

####input  

> Use Cases: Ask user enter some text, email, passwords etc  

Input is used to display any input elements. of type `<input id="firstName">` 
```
"template": {
    "type": "input",
    "templateOptions": {
      "type": "text",
      "label": "Enter name",
      "priority": 10,
      "id": "firstName"
    }
}
```
**Options**
1. `templateOptions` 
  - `type` Html type for it could be like password|email|number|text etc
  - `label` Placeholder or label text.
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `id` id of the html elements.
  - `class` Class of the input element. Class is in format of ng-class. example: ["col-md-6", "exampleStyle"]
  - `color` color of input elements. default is transparent. 
  - `colSize` Column Size of the template. Default is `col-md-12`,
  - `inline` Boolean value true|false. Default value is false.  If set true then element will be inline.
  

####textarea  
Textarea of type `<textarea id="firstName" ></textarea>`

> Use Cases: Ask user to write some summary, comments etc  

```
"template": {
    "type": "textarea",
    "templateOptions": {
      "type": "text",
      "label": "Enter name",
      "priority": 10,
      "id": "firstName",
      "row": 3
    }
}
```
**Options**
1. `templateOptions` 
  - `type` Html type for it could be like password|email|number|text etc
  - `label` Placeholder or label text.
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `id` id of the html elements.
  - `class` Class of the input element. Class is in format of ng-class. example: ["col-md-6", "exampleStyle"]
  - `color` color of input elements. default is transparent. 
  - `colSize` Column Size of the template. Default is `col-md-12`,
  - `inline` Boolean value true|false. Default value is false.  If set true then element will be inline.
  - `row` Row size for textarea elements. Numeric value.
   
   
####select  

> Use Cases: To select some options like country etc.

Textarea of type `<select id="firstName" ></select>` 
```
"template": {
    "type": "select",
    "templateOptions": {
      "type": "text",
      "label": "Enter name",
      "priority": 10,
      "id": "firstName",
      "options": {
        "name": "demo",
        "id": 1
      }
    }
}
```
**Options**
1. `templateOptions` 
  - `type` Html type for it could be like password|email|number|text etc
  - `label` Placeholder or label text.
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `id` id of the html elements.
  - `class` Class of the input element. Class is in format of ng-class. example: ["col-md-6", "exampleStyle"]
  - `color` color of input elements. default is transparent. 
  - `colSize` Column Size of the template. Default is `col-md-12`,
  - `inline` Boolean value true|false. Default value is false.  If set true then element will be inline.
  - `option` Data value present in `options`. 
  Options has two property.
    - `name` Name of the options that will be displayed <options>{{name}}</options>
    - `id` Value of options <options value="{{id}}">{{name}}</options>
  
  
   



 

      
 


##snaphy plugin dependency
1. JqueryValidate



#### Written by Robins Gupta

[1]: http://angular-formly.com/ "Angular Formly"
