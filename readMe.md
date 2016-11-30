# automata plugin for Snaphy


### Plugin for automatic generating all CRUD methods to the UI.

### This plugin is exposed on  `/automata` route


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

###### snaphy plugin depedency
1. JqueryValidate



#### Written by Robins Gupta
