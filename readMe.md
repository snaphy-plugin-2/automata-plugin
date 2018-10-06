# Automata plugin for Snaphy


### Snaphy plugin for automatic generating all CRUD methods to to html, js of admin panel.

### This plugin is exposed on  `/automata` route


###`GetAbsoluteSchema` method
Used to fetch schema of any model.  
####Adding Schema based on `ACL`
You can assign roles to restrict the property.Only dynamic and predefined loopback roles allowed. Now  static roles  are also allowed.
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
              },
              //Reject edit access for relations..
              "relations":{
                "allow":[],
                //Remove relations completely from all
                "reject": ["BrandStaff", "BrandAdmin"]
              },
              "header":{
                "allow":[],
                //Remove from table..
                "reject": ["BrandStaff", "BrandAdmin"]
              },
              "fields":{
              //Only remove from edit side..
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

####dummy  

> Use Cases: In case of readOnly only displaying in table and not editing.

```
"added": {
  "type": "date",
  "required": true,
  "defaultFn": "now",
  "template": {
    "type": "dummy"
  }
},
```

  
  
####input  

> Use Cases: Enter some text, email, passwords etc  

Input is used to display any input elements. of type `<input id="firstName">` 
```
"template": {
    "type": "input",
    "templateOptions": {
      "type": "text",
      "label": "Enter name",
      "priority": 10,
      "display": true,
      "default": "DEFAULT VALUE",
      "id": "firstName",
      "onChange": "broadcastReceiverPublisherName", //Will get called whenever data changes.
      "loadData": "broadcastReceiverSubscriberName" //Will change the value of the model ..whenever value               provided in  {args}
    }
}
```
**Options**  

1. `templateOptions` 
  - `type` Html type for it could be like password|email|number|text etc
  - `label` Placeholder or label text.
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `id` id of the html elements.
  - `display` `true|false` Either to display or hide
  - `default` Show the data
  - `class` Class of the input element. Class is in format of ng-class. example: ["col-md-6", "exampleStyle"]
  - `color` color of input elements. default is transparent. 
  - `colSize` Column Size of the template. Default is `col-md-12`,
  - `inline` Boolean value true|false. Default value is false.  If set true then element will be inline.
  - `onChange` BroadCastPublisher will get called whenevet data value changes.
  - `loadData` broadcastReceiverSubscriberName will load new data to model.
      ```
        //Defined in script.run.js file..
        $rootScope.$on("onChangeListenr", function(event, args){
          //Force load new data in load to value..
          $rootScope.$broadcast("loadData", {
              data: 2000 //Will load data to the input element.
          });
          });
      ```

####textarea  
Textarea of type `<textarea id="firstName" ></textarea>`

> Use Cases: Write some summary, comments etc  

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
     

####date  

> Use Cases: For displaying dates.  

```
"eventDate": {
  "type": "date",
  "template": {
    "type": "date",
    "templateOptions": {
    "label": "Select scheduled redeem date",
    "placeholder": "Select scheduled redeem date",
    "inline": true,
    "priority": 10,
    "utc": true,
    "id": "schedule_redeemed_date",
    "colSize": "col-xs-6",
    "box": "dateBox"
    }
  }
},
```
**Options**  

1. `templateOptions` 
  - `placeholder` "Placeholder text".
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `id` id of the html elements.
  - `format` Date format to display. Default is `mm/dd/yyyy`.

   
   
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
    * `name` Name of the options that will be displayed <options>{{name}}</options>
    * `id` Value of options <options value="{{id}}">{{name}}</options>
  - `model` `{model: "Model Name", 
       value: "Key name of property which is value usually it is the id", 
       name: "key name of property name which is going to be displayed", 
       filter: {} //Filter for fetching data dynamically
     }`
     For fetching data dynamically from a `loopback model`
  
     
####selectString  

> Use Cases: To select some options like country etc.

Textarea of type `<select id="firstName" ></select>`.  
Same as [Select](#select) with difference of asking `options` value as `Array` type instead of `Object`.   
```
"template": {
    "type": "select",
    "templateOptions": {
      "type": "text",
      "label": "Enter name",
      "priority": 10,
      "id": "firstName",
      "options": ["demo", "real"]
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
  - `option` Data value present in `options`. `Array` of datatypes is accepted as options
  
     
     
####arrayValue  

> Use Cases: Add some value whose type as defined in loopback is an `Array`  
 

```
"template": {
    "type": "arrayValue",
    "templateOptions": {
      "btnText": "Add more data",
      "name": "Ingredients",
      "priority": 10,
      "fields":[
            {
                "key": "keyName"
                "type": "select",
                "templateOptions": {
                  "type": "text",
                  "label": "Enter name",
                  "priority": 10,
                  "id": "firstName",
                  "options": ["demo", "real"]
                }
            }
      ],
      "validation":{
        "rules":{
            
        },
        "messages":{
            
        }
      }
    }
}
```
**Options**  

1. `templateOptions` 
  - `btnText` Button label to add more data.
  - `name` of the array to specifying to remove this object.
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `fields` Array of object. Its contains all the defined fields which is present in the array.
  - `validation` The validation object for array data types is defined here. Validation format is defined in detail in below.
  
     
####objectValue  

> Use Cases: Add some property value of object types.  
 

```
"template": {
    "type": "objectValue",
    "templateOptions": {
      "priority": 10,
      "fields":[
            {
                "key": "keyName"
                "type": "select",
                "templateOptions": {
                  "type": "text",
                  "label": "Enter name",
                  "priority": 10,
                  "id": "firstName",
                  "options": ["demo", "real"]
                }
            }
      ]
}
```
**Options**  

1. `templateOptions` 
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `fields` Array of object. Its contains all the defined fields which is present in the array.  
  
     
####multipleFileUpload  

> Use Cases: In case of uploading multiple images.
 

```
{
  ...
  ...
  "postImages": {
    "type": [
      "object"
    ],
    "template": {
      "type": "multipleFileUpload",
      "templateOptions": {
        "label": "Add images",
        "containerName": "containerName",
        "containerModel": "Container",
        "url": {
          "upload": "",
          "delete": ""
        },
        "bind": true,
        "fullWidth": true,
        "fileDataSource": "Image",
        "onImageUpdate": {
          "deletePrevious": true
        }
      }
    }
  },    
  ...
  ...
}
```
**Options**  

1. `templateOptions` 
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `label` Label showing add images.
  - `containerName` Name of `Container` folder in case of localstorage or bucket in case of AWS S3 upload as defined in loopback.
  - `containerModel` Model name where container is defined.
  - `url` If upload is occuring to some other remote location then use this.
     * `upload` Upload url
     * `delete` Url to delete the files.
  - `bind` To bind the current images with current model. If the current model is deleted from collection then  delete the images from server too.
  - `onImageUpdate` Hook to be applied on image update.
     * `deletePrevious` Delete the Previous image on image update.
  - `fullWidth` `false|true` Display the images to its full width. default to `false`
  - `fileDataSource` DataSource name defined in loopback at location `/server/datasources.json`.  

> Validation for multiple image upload is still in process of implementation.  

  
      

####singleFileUpload  

> Use Cases: In case of uploading single image.
 

```
{
  ...
  ...
  "postImages": {
    "type": [
      "object"
    ],
    "template": {
      "type": "singleFileUpload",
      "templateOptions": {
        "label": "Add images",
        "containerName": "containerName",
        "id": "fileUploadId",
        "containerModel": "Container",
        "url": {
          "upload": "",
          "delete": ""
        },
        "bind": true,
        "fullWidth": true,
        "fileDataSource": "Image",
        "onImageUpdate": {
          "deletePrevious": true
        }
      }
    }
  },    
  ...
  ...
}

#For displaying image on table
//common/table/modelName.json
{
  "table":{
    "postImages":{
      "image": true,
      "style":{
        "width": "50px !important",
        "max-width": "50px !important",
        "min-width": "50px"
      }
    }
  }
}

```
**Options**  

1. `templateOptions` 
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `label` Label showing add images.
  - `containerName` Name of `Container` folder in case of localstorage or bucket in case of AWS S3 upload as defined in loopback.
  - `containerModel` Model name where container is defined.
  - `url` If upload is occuring to some other remote location then use this.
     * `upload` Upload url
     * `delete` Url to delete the files.
  - `bind` To bind the current images with current model. If the current model is deleted from collection then  delete the images from server too.
  - `onImageUpdate` Hook to be applied on image update.
     * `deletePrevious` Delete the Previous image on image update.
  - `fullWidth` `false|true` Display the images to its full width. default to `false`
  - `fileDataSource` DataSource name defined in loopback at location `/server/datasources.json`.   
  - `id` Used for applying validation to image upload.  
  
  **Example**
  ```
    "validationsBackend": {
        "rules": {
          "postImages": {
            "required": true
          }
        },
        "messages": {
          "postImages": {
            "required": "postImages  is required."
          }
        }
      }
  ```



####MultiSmartSelect

> For Using a Property Array of Object. By Selecting From Properties from Another Model.
//models/news.json
{
"newsLabels":{
    "type": ["object"],
    "template":{
      "type": "multiSmartSelect",
      "templateOptions":{
        "placeholder": "Select Labels",
        "modelName": "Label",
        "searchProp": "name",
        "id": "multiLabelSelect",
        "label": "Select Label",
         "bind": true
      }
    }
  }
}


For a model news we have a property which will store the `labels` of which `news` belongs to. `Label` can be `more than one` and is another Model `Label`;
**Options**  

1. `templateOptions` 
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `label` Label showing add images.
  - `placeholder` label
  - `searchProp` Properties from model `Label` which it will use to search.
  - `modelName` Model name from which it will search the values.
  - `id` Used for applying validation to image upload.  
  - `bind`: true|false will update the data on related data update. `Warning`: never use is data it very big.

//For Table Search 
```
"newsLabels":{
  "display": true,
  "search": "arrayOfObject",
  "type": "text",
  "propertyName": "name"
}
```





#### multiInput

> For Using a Property Array of String.
> For example situations like selecting multiple `pincodes` for an `Area` `["110011", "843302"]`

//models/models.json
```
{
"pincode":{
    "type": ["string"],
    "template":{
      "type": "multiInput",
      "templateOptions":{
        "placeholder": "Enter Pincode",
        "id": "multiLabelSelect",
        "label": "Select Label"
      }
    }
  }
}
```

For a model news we have a property which will store the multiple `pincodes` in an `Area`
**Options**  

1. `templateOptions` 
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `label` Label .
  - `placeholder` label
  
  
### htmlText
> For displaying and storing html data in form pof WYSIWYG. 
```
  {
    "secondaryDescription": {
    "type": "string",
    "template": {
      "type": "htmlText",
      "templateOptions": {
        "inline": true,
        "type": "text",
        "label": "Enter Secondary Description ",
        "id": "secondaryDescription"
      }
    }
  }  
```

For a model news we have a property which will store the multiple `pincodes` in an `Area`
**Options**  

1. `templateOptions` 
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `label` Label.  
  - `inline`  Will set html `display` value as `inline-block` type.
  


  
  
     
#### singlePDFUpload  

> Use Cases: In case of uploading single PDF file to server.
 

```
{
  ...
  ...
  "postImages": {
    "type": [
      "object"
    ],
    "template": {
      "type": "singlePDFUpload",
      "templateOptions": {
        "label": "Add images",
        "containerName": "containerName",
        "containerModel": "Container",
        "url": {
          "upload": "",
          "delete": ""
        },
        "bind": true,
        "fullWidth": true,
        "fileDataSource": "Image",
        "onImageUpdate": {
          "deletePrevious": true
        }
      }
    }
  },    
  ...
  ...
}
```
**Options**  

1. `templateOptions` 
  - `priority` numeric values which decides placement of elements. Elements with higher priority resides at top than element having lower priority.
  - `label` Label showing add images.
  - `containerName` Name of `Container` folder in case of localstorage or bucket in case of AWS S3 upload as defined in loopback.
  - `containerModel` Model name where container is defined.
  - `url` If upload is occuring to some other remote location then use this.
     * `upload` Upload url
     * `delete` Url to delete the files.
  - `bind` To bind the current images with current model. If the current model is deleted from collection then  delete the images from server too.
  - `onImageUpdate` Hook to be applied on image update.
     * `deletePrevious` Delete the Previous image on image update.
  - `fullWidth` `false|true` Display the images to its full width. default to `false`
  - `fileDataSource` DataSource name defined in loopback at location `/server/datasources.json`.   
  - `id` Used for applying validation to image upload.  
  **Example**
  ```
    "validationsBackend": {
        "rules": {
          "postImages": {
            "required": true
          }
        },
        "messages": {
          "postImages": {
            "required": "postImages  is required."
          }
        }
      }
  ```
  
  

 
   
##Predefined Type with model relations   

### Common Property for relations.  

#### onCascadeDelete 
Boolean `true|false`. Default `false`.  
Use to bind the relation model completely with current Model. In case current model is deleted then the relation model will get deleted automatically.  
Example
```
{
  ...
  ...
  "track": {
      "type": "hasMany",
      "model": "Track",
      "foreignKey": "",
      "onCascadeDelete": true,
      "templateOptions": {
        
      }
  },
  ...
}
```   



#### templateOptions

* In case of adding templateOption to relations.   
* By default relations automatically pick its default types from predefined types.  
* If current predefined type doesn't suit requirement then you can create your own template using [Angular Formly][1] and add it to the templateOptions object using `type` as property and its value. 
  
     
####belongsTo  

> Use Cases: To define belongsTo and hasMany definition

```
{
    ....
    ....
    "relations": {
        "post": {
        "type": "belongsTo",
        "model": "Post",
        "foreignKey": "",
        "templateOptions": {
            "btnText": "Search Post",
            "searchProp": "title",
            "search": true,
            "create": false,
            "id": "PostRelation",
            displayProperty:[
                {
                    prefix: "PostedBy"
                },
                {
                    name: "name"
                },
                {
                    suffix: "Author"
                }
                //Will display PostedBy ${name} Author in search results.
            ]
        }
    },
    ....    
    ....
}
```
#####Options  

1. `templateOptions` 
  - `btnText` Placeholder or label text.
  - `searchProp` Property of the relation's `Model` which is about to be searched.  
  - `search` `true|false`. Boolean value to select either show search suggestion to add any related model data.
  - `create` `true|false`. Boolean value to select either to display a button to add any relation model if related model data not present in search.
  - `hide` `true|false` To hide the relation box on initialize. By default it is set to `false`. 
  - `display` `true|false` To remove the relation box from the `DOM` set it to false. by default its value is `true`.  
  - `id` Used to apply JqueryValidation to the related belongTo relation search. In case of relation validation apply relation name in place of validation key.
  **Example**
  ```
  //For relation `post` apply validation like this.
  "validationsBackend": {
      "rules": {
        "post": {
          "required": true,
          "valueNotEquals": ""
        }
      },
      "messages": {
        "post": {
          "required": "Customer is required",
          "valueNotEquals": "Customer is required"
        }
      }
    }
  ```
  
  - `load` `{Boolean}` Default false if set true will load all data at once on initialize and dont load data dynamically.    
  - `displayProperty` `{[{}]}` Set the prefix or suffix either static data or from the model data of related model.
      - `prefix` : If set will add static string value to prefix of the search property results.
      - `name`   : If set will add dynamic string value from related model data.
      - `suffix` : If set will add static string value at suffix to related model data.


  - `where` `{Object}` Where query apply filter to show only specific data for relation search.
    **Example**
    ```
    {
      name: "Customer",
    ...
    relations:{
        "post"{
            "type": "hasOne",
            "model": "Post",
            "foreignKey": "",
            templateOptions:{
                ...
                ...
            }
        },
        "favouriteComment":{
            "type": "hasOne",
            "model": "Comment",
            "foreignKey": "",
            "templateOptions": {
                "btnText": "Search Favourate Comments",
                "searchProp": "answer",
                "where":{
                  "postId": {
                    "relationName": "post",
                    "relationKey": "id"
                  }
                },
                "whereValidation":{
                  "postId": "You need to first add a post before adding its favourite answer."
                },
                "create": false,
                "id": "acceptedAnswerId"
            }
        }
    }
    
    //Other example
    "where":{
      "postId": {
        "relationName": "post",
        "relationKey": "id",
        "key": "value"
      }
    }
    ...
    ...
    ```
    Here, when adding any relation like `post` to main Model `Customer` is searched then `where` query filter will be applied on each search query and filter results will be shown only.  
    There are two different cases of writing `where` query in different scenario.
       1. When one relation `Relation A` is dependent on other relation `Relation B` and we have to show only those results of `Relation A` which are dependent on `Relation B` .  
          For Example.  
          * Suppose there is a `Customer` which is related to a model `Post` to post any kind of summary or blog.  
          * Now this `Customer` model has also relation name  `favouriteComment` with model `Comment`. `favouriteComment` connects this `Post` with those `Comments` that author has checked it as his favourite one.  
          * When a user searches to pick `favouriteComment` relation in `Customer` model then in search only those comments will be displayed which belongs to `Post` of current customer. 
          * To facilitate it we will add a `where` property with `postId` as key as this `postId` is the foreign key name in model `Comment`.
          * Now in `Customer` the value of `Post` model is present in `relationName` `post` and its relation key is `id` which is primary key of `Post` model.
          * Thus here `relationName` will be `Post` and `relationKey` will be `id`.   
       2. When a search filter of some static data is to be performed
          * In this case simple `key` and its `value` is written.
          * Example  
          
          ```
          where:{
              "type": private
          }
          ```


####smartSelect
> Use Case: Run time data fetch. Used in Placce of belongsTo


```
 "department": {
      "type": "belongsTo",
      "model": "Department",
      "foreignKey": "",
      "templateOptions": {
        "btnText": "Assign department",
        "searchProp": "name",
        "type": "smartSelect",
        "id": "departmentName",
        "loadWhen": "departmentLoadedEmployee",
        "onLoad":"departmentEmployeeLoaded",
        "onSelect":"departmentSelected",
        "readOnly": false,
        "acl": {
          "allow": [],
          "reject": ["DepartmentEmployee", "DepartmentAdmin"],
          "relations":{
            "allow":[],
            "reject": ["DepartmentEmployee", "DepartmentAdmin"]
          }
        }
      }
    }
```
      
     
####repeatSection  
> Use Cases: To define hasMany and hasAndBelongToMany definition


```
{
    ....
    ....
    "relations": {
        "post": {
        "type": "hasMany",
        "model": "Post",
        "foreignKey": "",
        "templateOptions": {
            "btnText": "Search Post",
            "searchProp": "title",
            "search": true,
            "create": false,
            "id": "PostRelation",
            "hide: false,
            "label": "This a label or placeholder"
        }
    },
    ....    
    ....
}
```
#####Options  

1. `templateOptions` 
  - `btnText` Button label.
  - `label` Placeholder or label.
  - `searchProp` Property of the relation's `Model` which is about to be searched.  
  - `search` `true|false`. Boolean value to select either show search suggestion to add any related model data.
  - `create` `true|false`. Boolean value to select either to display a button to add any relation model if related model data not present in search.
  - `hide` `true|false` To hide the relation box on initialize. By default it is set to `false`. 
  - `display` `true|false` To remove the relation box from the `DOM` set it to false. by default its value is `true`.
  


##Filter

 ```
 {
     "filters": {
         "recipeType": {
           "type": "$radio",
           "label": "Select recipe type",
           "options": [
             {
               "id": 1,
               "name": "veg"
             },
             {
               "id": 2,
               "name": "nonveg"
             },
             {
               "id": 3,
               "name": "egg"
             }
           ]
         },
         "added": {
           "type": "$date",
           "label": "Recipe added between"
         },
         "status": {
           "type": "$select",
           "label": "Select recipe status",
           "options": [
             {
               "id": 1,
               "name": "publish"
             },
             {
               "id": 2,
               "name": "onhold"
             },
             {
               "id": 3,
               "name": "rejected"
             }
           ]
         },
         "servings": {
           "type": "$multiSelect",
           "label": "Select recipe servings",
           "getOptionsFromColumn": false,
           "options": [
             {
               "id": "1",
               "name": "1"
             },
             {
               "id": "2",
               "name": "2"
             },
             {
               "id": "3",
               "name": "3"
             },
             {
               "id": "4",
               "name": "4"
             },
             {
               "id": "5",
               "name": "5"
             }
           ]
         }
         //Suppose departmentId select  value was to be fetched from some remote url method.
         "departmentId":{
            "type":"$remoteUrl",
            "label":"Select Department",
            "default": "", //some default value which you want to select,
            "disabled": Boolean, //which means to disabled the select element by default.
            "url": "/getAllDepartment",
            "method":"get|post"
            "options":{
                //Only required if post in case of json data
            },
            "field":{
                "value": "id", //Value property.
                "display":"name" //Display property.
            },
            broadcast:"OnDepartmentFetched"
            //event to be broadcast when data has been fetched. successfully from remote url.
            //with value {schema, data} schema will contain the schema object and data will contain the data object.
            //schema: Schema Object ,
            //options: Options list which contains all the data.,
            //filter: filter options,
            //data: data containing values on select,
            //loadTableWithFilter: Load tables on filter select,
            //setFilter: Set filter data.
         }
   }
 ```


#### Container -> Arranging Elements in a Box and Styling it around.
> `common/models/model-name.json`
```
    {
        "name": {
              "type": "string",
              "required": true,
              "template": {
                "type": "input",
                "templateOptions": {
                  "type": "text",
                  "label": "Enter department name",
                  "priority": 10,
                  "id": "departmentName",
                  "box": "DepartmentNameBox"
                }
              }
        },
        "logo": {
              "type": "object",
              "required": true,
              "template": {
                "type": "singleFileUpload",
                "templateOptions": {
                  "box": "DepartmentLogoBox",
                  "label": "Add department logo",
                  "containerName": "easypoints",
                  "id": "fileUploadId",
                  "containerModel": "Container",
                  "url": {
                    "upload": "",
                    "delete": ""
                  },
                  "bind": true,
                  "fullWidth": false,
                  "fileDataSource": "Image",
                  "onImageUpdate": {
                    "deletePrevious": true
                  }
                }
              }
            },
    }
```

> `common/table/model-name.json`

```
{
  "box":{
    "DepartmentNameBox":{
      "style":{
        "border-color": "#eeeeee",
        "border-width": "1px",
        "border-style": "solid",
        "padding-top": "20px",
        "margin-bottom": "10px"
      },
      "class":["col-md-7", "clearfix"]
    },
    "DepartmentLogoBox":{
      "style":{
        "border-color": "#eeeeee",
        "border-width": "1px",
        "border-style": "solid",
        "padding-top": "10px"
      },
      "class":["col-md-offset-1", "col-md-4"]
    }
  }
}
```


## Additional Features

 1. "onSchemaFetched"
     - Can be set from  `/common/settings/robustAutomata/admin-panel-setting.js`
     - Will call an $broadcast event every time a new Schema is fetched.
     - Will also send Model `schema` Object along with the schema.
 2. "Settings" : Will add settings to data panel.
     - Can be set from `/common/table/model-name.json`
   ```
    "settings": {
        "create": false,
        "delete": false,
        "read": true,
        "form": {
          "beforeSave": [
            {
              "departmentId": "$user.departmentId",
              "key": "value"
            }
          ]
        },
        "widgets": {

        },
        "filters": {
          "showReset": false
        },
        "tables":{
          "showReset": false,
          "autoLoad": false,
          "resetWhenBroadCast": "DepartmentFilterSet",
          "beforeTableLoad":"onLoadTable",
          "sort":{
            "added": "DESC"
          },
          "beforeLoad":{
            "departmentId": "$user.departmentId"
          }
        },
        "onClose":{
          "unsubscribe":["OnDepartmentFetched", "onSchemaFetched"]
        }
      },
   ```
 > Settings Explanation:
   1. `create`: {Boolean|default: true} Will Remove/Show Create Button.
   2. `read`: {Boolean|default: true} .
   3. `delete`: {Boolean|default: true} Will Remove/Show Delete Button.

###### SETTINGS > FORM
   Will contain all the settings that can help in configuring the `FORM` i.e data save panel.
   1. `beforeSave` {function|Object}
       - Will contain either a function with argument of data and return type promise.
       - Can also contain Object. Will values that will be placed to the data. Before load time.
       - In case of Object
           ```
           {
              "departmentId": "$user.departmentId",
              "key": "value"
           }
           ```
           1. It can contain dynamic variables like $user.propertyId, this will get replaced by logged user given property values.
           2. `"key": "value"`  Will simple get attached to main form data getting saved. Without getting modified.
       - In case of `function` type data can be added dynamically. By listening to any filter
                  like `onSchemaFetched` etc.
            ```
            function(formData){ return $q(function(resolve, reject){
                //Modify FormData..Object and later return it.
                resolve(formData);
            })}
            ```
##### Settings>filters
   Configure the settings of Filters Object
       - `showReset`: {Boolean} Show Filter reset button.

##### Settings>tables
         ```
         "tables":{
               "showReset": false,
               "autoLoad": false,
               "resetWhenBroadCast": "DepartmentFilterSet",
               "beforeTableLoad":"onLoadTable",
               "sort":{
                 "added": "DESC"
               },
               "beforeLoad":{
                 "departmentId": "$user.departmentId"
               }
         }
         ```


         1. `showReset` Will either enable or disable the reset buttons.
         2. `autoLoad` {Boolean} Will stop the auto loading of table and will load
                          only when `resetWhenBroadCast` event is called.
         3. `resetWhenBroadCast`: If This event is Called will load the table.
         4. `beforeTableLoad`: If present will $broadcast this event just before everytime tables load/reloads.
             - Argument Passed along with this event
             {
                 schema: //Schema Object,
                 where: //Where Query Object,
                 tableState: //Table state
             }

         5. sort: Will sort the table given the DESc or ASC.
         6. beforeLoad: Will add property or dynamic property before loading of table in where query.


#Future docs coming.
1. Validation
2. Table
3. Widgets
4. Filter
5. Settings
 


#snaphy plugin dependency
1. JqueryValidate



#### Written by Robins Gupta

[1]: http://angular-formly.com/ "Angular Formly"
