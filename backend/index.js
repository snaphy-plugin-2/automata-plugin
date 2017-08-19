(function(){'use strict';})();
module.exports = function( server, databaseObj, helper, packageObj) {
	var saveRemoteMethod = require('./saveDb');
	var onDelete = require('./cascadingDelete');
	var _ = require("lodash");
	var modifyHasAndBelongsToMany = require("./modifyHasAndBelongsToMany");
	const Promise = require("bluebird");
	/**
	 * Here server is the main app object
	 * databaseObj is the mapped database from the package.json file
	 * helper object contains all the helpers methods.
	 * packegeObj contains the packageObj file of your plugin.
	 */

	/**
	 * Initialize the plugin at time of server start.
	 * init method should never have any argument
	 * It is a constructor and is populated once the server starts.
	 * @return {[type]} [description]
	 */
	var init = function(){
		if(!server.automata){
            server.automata = true;
            //For loading the raw properties..
            //Just Introduce a remote method in all the given method..
            //run each models in the loop and add a remote method to it.
            var models = server.models();

            models.forEach(function(Model) {
                //refer to https://apidocs.strongloop.com/loopback/#app-models
                addRemoteMethod(server, Model.modelName);
                //Also add save method to each models..
                saveRemoteMethod.addSaveMethod(server, Model.modelName);
                addCaseSensitiveSearch (server, Model.modelName);
                onDelete.onCascadeDelete(server, Model.modelName);
                modifyHasAndBelongsToMany.modifyRelation(server, Model.modelName);
            });
		}else{
			console.log("Rejected Automata");
		}

	};


    /**
	 * Fetch the snaphy acl from the list.
     * @param modelName {String}
     * @param roles {Array}
     */
	const getSnaphyACL = function (modelName, roles) {
			return new Promise(function (resolve, reject) {
                if(modelName && roles){
                	if(roles.length){
                        const SnaphyACL = databaseObj.SnaphyACL;
                        if(SnaphyACL){
                            SnaphyACL.findOne({
                                where:{
                                    model: modelName,
                                    role: {
                                        inq: roles
                                    }
                                },
                                include:["snaphyAclProps", "snaphyAclRelations"]
                            })
                                .then(function (snaphyACL) {
                                    if(snaphyACL){
                                        const aclObj = snaphyACL.toJSON();
                                        if(snaphyACL.snaphyAclProps()){
                                            aclObj.snaphyACLProps = {};
                                            snaphyACL.snaphyAclProps().forEach(function (aclProp) {
                                                aclObj.snaphyACLProps[aclProp.name] = aclProp;
                                            });
                                        }

                                        if(snaphyACL.snaphyAclRelations()){
                                            aclObj.snaphyACLRelations = {};
                                            snaphyACL.snaphyAclRelations().forEach(function (aclrelation) {
                                                aclObj.snaphyACLRelations[aclrelation.relation] = aclrelation;
                                            });
                                        }
                                        resolve(aclObj);
                                    }else{
                                        resolve(snaphyACL);
                                    }

                                })
                                .catch(function (error) {
                                    reject(error);
                                });
                        }else{
                            resolve({});
                        }
					}else{
                		reject("GetAbsoluteSchema: Roles array cannot be empty.");
					}

				}else{
                	reject("Model name and roles required");
				}


            });
    };





	/**
	 * Add remote methods to the models..
	 * @param app
	 * @param modelName
     */
	var addRemoteMethod = function(app, modelName){
		var modelObj = app.models[modelName];
		/**
		 * ModelObj getSchema remote method..
		 * @param callback
         */
		modelObj.getSchema = function(callback) {
			//Now form the schema and send it to the client..
			let relations = modelObj.definition.settings.relations,
				filters,
				tables,
                settings,
				widgets;

			const tableObj = helper.getTableJson(modelName);

			if(tableObj){
				if(tableObj.tables){
					tables = tableObj.tables;
				}
				if(tableObj.widgets){
					widgets = tableObj.widgets;
				}
				if(tableObj.filters){
					filters = tableObj.filters;
				}
                if(tableObj.settings){
                    settings = tableObj.settings;
                }

            }

			/**
			 * Now form the desired schema and return it.
			 */
			var header = addPropToHeader(app, modelName, '', [], false, []),
			//Get template structure..
			schema = generateTemplateStr(app, modelName);
			//Now recursively add relations to the models...
			addNestedModelRelation(app, header, schema, relations, modelName);

			//Now add filters and tables and headers to the model
			schema.header  = header;
			schema.filters = filters;
			schema.tables  = tables;
			schema.widgets  = widgets;
			schema.settings  = settings;

			callback(null, schema);
		};



		modelObj.getAbsoluteSchema = function(callback) {
			//Now form the schema and send it to the client..
			let relations = modelObj.definition.settings.relations,
			filters,
			tables,
			settings,
			widgets;

			//Load login plugin get roles method..
			const {getAuthorisedRoles} = helper.loadPlugin('login');
			//Find the authorised roles for the data..
			if(getAuthorisedRoles){
				getAuthorisedRoles(server, function(err, roleList){
					if(err){
						console.error("Error occured in fetching roles.", err);
                        callback(err);
					}else{
                        getSnaphyACL(modelName, roleList)
							.then(function (snaphyACL) {
                                return generateSchemaByACL(app, modelName, relations, filters, tables, settings, widgets, roleList, snaphyACL);
                            })
							.then(function (schema) {
                                callback(null, schema);
                            })
							.catch(function (error) {
								callback(error);
                            });
					}
				});
			}else{
                let err = new Error("getAuthorisedRoles is not defined in login plugin");
                callback(err, null);
            }
		};

		//Now registering the method `getSchema`
		modelObj.remoteMethod(
				'getSchema',
				{
					returns: {arg: 'schema', type: 'object'},
					description: "Send the schema of the model requested."
				}
		);

		//Now registering the method `getAbsoluteSchema` required for robust automata plugin..
		modelObj.remoteMethod(
				'getAbsoluteSchema',
				{
					returns: {arg: 'schema', type: 'object'},
					description: "Send the absolute schema of the model requested."
				}
		);
	};


    /**
	 * Generate Schema according ACL and defined roles.
     * @param app
     * @param modelName
     * @param relations
     * @param filters
     * @param tables
     * @param settings
     * @param widgets
     * @param roleList
     * @param snaphyACL
     */
	const generateSchemaByACL = function (app, modelName, relations, filters, tables, settings, widgets, roleList, snaphyACL) {
        return new Promise(function (resolve, reject) {
            const tableObj = helper.getTableJson(modelName);
            if(tableObj){
                if(tableObj.tables){
                    tables = tableObj.tables;
                }
                if(tableObj.widgets){
                    widgets = tableObj.widgets;
                }
                if(tableObj.filters){
                    filters = tableObj.filters;
                }
                tableObj.settings = tableObj.settings || {};
                if(tableObj.settings){
                    settings = tableObj.settings;
                    if(snaphyACL){
                    	//Check for read permission..
						if(snaphyACL.read === "deny"){
                            settings.read = false;
						}else if(snaphyACL.read === "allow"){
							//handle setting for read === true..
                            settings.read = true;
						}

                        //Check for read permission..
                        if(snaphyACL.create === "deny"){
                            settings.create = false;
                        }else if(snaphyACL.create === "allow"){
                            //handle setting for read === true..
                            settings.create = true;
                        }

                        //Check for read permission..
                        if(snaphyACL.edit === "deny"){
                            settings.edit = false;
                        }else if(snaphyACL.edit === "allow"){
                            //handle setting for read === true..
                            settings.edit = true;
                        }

                        //Check for read permission..
                        if(snaphyACL.delete === "deny"){
                            settings.delete = false;
                        }else if(snaphyACL.delete === "allow"){
                            //handle setting for read === true..
                            settings.delete = true;
                        }
					}
                }
            }



            /**
             * Now form the desired schema and return it.
             */
            var header = addPropToHeader(app, modelName, '', [], false, roleList, snaphyACL),
                //Get template structure..
                schema = generateTemplateStr(app, modelName, null, roleList, snaphyACL);


            //Now recursively add relations to the models...
            addNestedModelRelation(app, header, schema, relations, modelName, true, roleList, snaphyACL);

            //Now add filters and tables and headers to the model..
            schema.header  = header;
            schema.filters = filters;
            schema.tables  = tables;
            schema.widgets  = widgets;
            schema.settings  = settings;

            if(schema.fields){
                //Sort the fields..
                schema.fields = sortByPriority(schema.fields);
            }

            resolve(schema);
        });

    };


	var addCaseSensitiveSearch = function(server, modelName){
		var modelObj = server.models[modelName];
		modelObj.observe("access", function (ctx, next) {
			if(ctx.query.where){
				for(var whereProp in ctx.query.where){
					if(ctx.query.where.hasOwnProperty(whereProp)){
						if(whereProp){
							if(ctx.query.where[whereProp]){
                                var like = ctx.query.where[whereProp].like;
                                if(like){
                                    var patt= /\/.*\//;
                                    if(patt.test(like)){
                                        //Regex already present..
                                        //do nothing..
                                    }else{
                                        var pattern = new RegExp(''+like+'.*', "i"); /* case-insensitive RegExp search */
                                        //Now modifying the like property..
                                        ctx.query.where[whereProp].like = pattern;
                                    }
                                }
							}
						}
					}
				}
				next();
			}else{
				next();
			}
		});//observe..
	};

	/**
	 * Sort schemas by priority
	 * @params {[object]} array of object that needs to be sorted in descending order.
 	 */
	var sortByPriority = function(collection){
		//_.sortBy(users, [function(o) { return o.user; }]);
		collection = _.sortBy(collection, [function(obj) {
			if(obj){
				if(obj.templateOptions){
					if(obj.templateOptions.fields){
						//Also sort if any nested fields present..
						obj.templateOptions.fields = sortByPriority(obj.templateOptions.fields);
					}

					if(obj.templateOptions.priority){
						return obj.templateOptions.priority;
					}
				}
			}
			return 0;
		}]).reverse();

		return collection;
	};


    /**
	 * Check the dynamic property access of the role.
     * @param propName
     * @param prefix {String} if related table has to restrict.
     * @param roleList
     * @param snaphyACL
     * @param type
     */
	const checkDynamicPropertyAccess = function(propName, prefix, roleList, snaphyACL, type){
        let rejectProperty = false;
		if(propName){
			if(snaphyACL){
				if(snaphyACL.snaphyACLProps){
					if(prefix) {
                        const relatedAclPropObj = snaphyACL.snaphyACLProps[prefix +'.'+propName];
                        if(relatedAclPropObj){
                        	if(type === "header"){
                                if(relatedAclPropObj.read){
                                    if(relatedAclPropObj.read === "allow"){
                                        rejectProperty = false;
                                    }else if(relatedAclPropObj.read === "deny"){
                                        rejectProperty = true;
                                    }
                                }
							}

							if(type === "fields"){
                                if(relatedAclPropObj.write){
                                    if(relatedAclPropObj.write === "allow"){
                                        rejectProperty = false;
                                    }else if(relatedAclPropObj.write === "deny"){
                                        rejectProperty = true;
                                    }
                                }
							}
                        }
					}else {
                        const aclPropObj = snaphyACL.snaphyACLProps[propName];
                        if(aclPropObj){
                            if(type === "header") {
                                if (aclPropObj.read) {
                                    if (aclPropObj.read === "allow") {
                                        rejectProperty = false;
                                    } else if (aclPropObj.read === "deny") {
                                        rejectProperty = true;
                                    }
                                }
                            }

                            if(type === "fields"){
                                if(aclPropObj.write){
                                    if(aclPropObj.write === "allow"){
                                        rejectProperty = false;
                                    }else if(aclPropObj.write === "deny"){
                                        rejectProperty = true;
                                    }
                                }
                            }

                        }
					}

				}

                if(type === "relations"){
					if(snaphyACL.snaphyACLRelations){
                        const aclRelationObj = snaphyACL.snaphyACLRelations[propName];
                        if(aclRelationObj){
                            if(aclRelationObj.execute === "deny"){
                                rejectProperty = true;
                            }
						}
                    }
				}

			}
		}

		return rejectProperty;
	};


    /**
     * Check if the property has allow role or reject role..
     * @param propertyObj Loopback model property obj
     * @param roleList list of roles defined for current logged user..loopback.currentContext
	 * @param type {String} Enum either [header, fields, relations, tables]
	 * Used For applying allow or remove specifically to provided properties type.
     * @returns {boolean} false if property is allowed and true if it is rejected..
     */
    const checkPropertyAccess = function(propertyObj, roleList, type){
        if(!roleList){
            roleList = [];
        }

        let rejectProperty = false;
        if(propertyObj.templateOptions){
            if(propertyObj.templateOptions.acl){
                if(propertyObj.templateOptions.acl.reject){
					rejectProperty = matchAccess(propertyObj.templateOptions.acl, roleList);
                }

                //Check for specifically defined types..
                if(propertyObj.templateOptions.acl[type]){
                    if(propertyObj.templateOptions.acl[type].reject){
                        rejectProperty = matchAccess(propertyObj.templateOptions.acl[type], roleList);
                    }
                }
            }
        }
        return rejectProperty;
    };


    /**
     * Check if a relation data is allowed for edit or not..
     * @param propertyObj Loopback model property obj
     * @param roleList list of roles defined for current logged user..loopback.currentContext
     * Used For applying allow or remove specifically to provided properties type.
     * @returns {boolean} false if property is allowed and true if it is rejected..
     */
    const checkRelationEditAccess = function(propertyObj, roleList){
        if(!roleList){
            roleList = [];
        }

        let rejectProperty = false;
        if(propertyObj.templateOptions){
            if(propertyObj.templateOptions.acl){
                //Check for specifically defined types..
                if(propertyObj.templateOptions.acl["relations"]){
                    if(propertyObj.templateOptions.acl["relations"].reject){
                        rejectProperty = matchAccess(propertyObj.templateOptions.acl["relations"], roleList);
                    }
                }
            }
        }
        return rejectProperty;
	};


    /**
	 * Match the current ACL object having allow and reject array with data.
     * @param aclObject { {reject:Array, allow: Array } }
     * @param roleList {Array},
     * @returns {boolean}
     */
    const matchAccess = function(aclObject, roleList){
    	let rejectProperty = false;
        let found = _.find(aclObject.reject, function(rejectedRole) {
            for(let i=0; i < roleList.length; i++){
                let userRole = roleList[i];
                //If current role is in reject role..then reject the role..
                if(userRole === rejectedRole){
                    return true;
                }
            }
            return false;
        });

        //Now check if current role is also present in allow role list
        if(found){
            rejectProperty = true;
            if(aclObject.allow) {
                let found = _.find(aclObject.allow, function(allowedRole) {
                    for(let i=0; i < roleList.length; i++){
                        let userRole = roleList[i];
                        //If current role is in reject role..then reject the role..
                        if(userRole === allowedRole){
                            return true;
                        }
                    }
                    return false;
                });



                if(found) {
                    rejectProperty = false;
                }
            }
        }


        //Adding ACL from Website dynamically..

        return rejectProperty;
	};




	//TODO ADD ENTRY FOR NESTED DATA RELATED MODELS NOT DONE AT CLIENT SIDE IN ANGULAR FORMLY.
	/**
	 * Recursive function for generating models schema. and header.
	 * @param app
	 * @param header
	 * @param schema
	 * @param relations
	 * @param rootModelName model name of the root
	 * @param absoluteSchema {boolean} if the request is for absolute schema or getSchema
	 * @param roleList {[string]} list of roles assigned to current logged user..
	 * @param snaphyACL
     */
	var addNestedModelRelation = function(app, header, schema, relations, rootModelName, absoluteSchema, roleList, snaphyACL){

		//Now adding  prop of belongTo and hasMany method to the header and schema respectfully...
		for(var relationName in relations){
			if(relations.hasOwnProperty(relationName)){
				var relationObj = relations[relationName];
				var modelName       = relationObj.model;
                //Flag to track if to reject property or accept prop..
                var rejectProperty = checkPropertyAccess(relationObj, roleList, "relations");
				var dynamicRejectProperty = checkDynamicPropertyAccess(relationName, '', roleList, snaphyACL, "relations");
                if(rejectProperty || dynamicRejectProperty){
                    //Skip this property..
                    continue;
                }

				//Only add relation if template option in the template option is present..
				if((relationObj.type === 'hasMany' ||  relationObj.type === 'hasAndBelongsToMany' ) && relationObj.templateOptions !== undefined){
					var nestedSchema = {};
					if(relationObj.type === "hasMany"){
						if(relationObj.through){
							nestedSchema.key = relationName;
							//Now cloning the object from templateOptions....
							nestedSchema.templateOptions = Object.assign({}, relationObj.templateOptions);
							if(relationObj.templateOptions.type){
								nestedSchema.type = relationObj.templateOptions.type;
								delete nestedSchema.templateOptions.type;
							}else{
								nestedSchema.type = 'arrayValue';
							}

							//Add model to be searched..
							nestedSchema.templateOptions.model = relationObj.through;

							var throughRelationName;
							var throughSearchId;
							var throughTemplateOptions = {};
							var throughModelObj = app.models[relationObj.through];
							var relatedModelRelationObj = throughModelObj.definition.settings.relations;
							for(var relatedModelRelation in relatedModelRelationObj){
								if(relatedModelRelationObj.hasOwnProperty(relatedModelRelation)){
									var relatedModel = relatedModelRelationObj[relatedModelRelation];
									if(modelName === relatedModel.model){
										throughRelationName = relatedModelRelation;
										if(relatedModel.templateOptions){
											throughTemplateOptions = relatedModel.templateOptions;
										}
									}
									else if(rootModelName === relatedModel.model){
										if(relatedModel.foreignKey){
											throughSearchId = relatedModel.foreignKey;
										}else{
											throughSearchId = rootModelName.toLowerCase() + "Id";
										}
									}
								}
							}
							//Now get nested schema str for the relational models..
							generateTemplateStr(app, relationObj.through, nestedSchema.templateOptions, roleList);

							var belongsToSchemaThrough = {
								type           : "belongsTo",
								key            : throughRelationName,
								templateOptions: throughTemplateOptions
							};

							//Model name of relational data..
							belongsToSchemaThrough.templateOptions.model = relationObj.model;

							if(nestedSchema.templateOptions.fields === undefined){
								nestedSchema.templateOptions.fields = [];
							}

							nestedSchema.templateOptions.fields.push(belongsToSchemaThrough);

							//Also add templateStr for related model of HasManyThrough
							generateTemplateStr(app, relationObj.model, belongsToSchemaThrough.templateOptions, roleList);


							/**
							 * HasManyThrough structure
							 * {
							 * 		relation: 'ingredients',
							 * 		through: 'RecipeIngredient'
							 * }
							 */
							//Push data to hasManyThrough array..
							schema.relations.hasManyThrough.push({
								//Relation of related model in though Model property name
								throughModelRelation: throughRelationName,
								through: relationObj.through,
								whereId:  throughSearchId,
								relationName: relationName
							});
						}else{
							nestedSchema.type = 'repeatSection';
							nestedSchema.key = relationName;
							nestedSchema.templateOptions = relationObj.templateOptions;
							nestedSchema.templateOptions.model = relationObj.model;
							//Now get nested schema str for the relational models..
							generateTemplateStr(app, relationObj.model, nestedSchema.templateOptions, roleList);

							//Now add nestedSchema to the schema object.
							schema.relations.hasMany.push(relationName);

						}
					}
					else{
						nestedSchema.type = 'repeatSection';
						nestedSchema.key = relationName;
						nestedSchema.templateOptions = relationObj.templateOptions;
						nestedSchema.templateOptions.model = relationObj.model;
						//Now get nested schema str for the relational models..
						generateTemplateStr(app, relationObj.model, nestedSchema.templateOptions, roleList);

						//Now add nestedSchema to the schema object.
						schema.relations.hasAndBelongsToMany.push(relationName);
					}
					schema.fields.push(nestedSchema);
				}
				if((relationObj.type === 'hasOne' || relationObj.type === 'belongsTo') && relationObj.templateOptions !== undefined){
					if(absoluteSchema){
						//Now add its properties to the header..
						header = addPropToHeader(app, relationObj.model, relationName,  header, true, roleList, snaphyACL);
					}else{
						//Now add its properties to the header..
						header = addPropToHeader(app, relationObj.model, relationName,  header, false, roleList, snaphyACL);
					}

					if(relationObj.type === "hasOne"){
						schema.relations.hasOne.push(relationName);
					}else{
						//Add this relation to the schema..
						schema.relations.belongsTo.push(relationName);
					}

					var belongsToSchema = {
						type           : "belongsTo",
						key            : relationName,
						templateOptions: relationObj.templateOptions
					};

					if(relationObj.templateOptions.type){
						belongsToSchema.type = relationObj.templateOptions.type;
					}


					belongsToSchema.templateOptions.model      = relationObj.model;
					belongsToSchema.templateOptions.foreignKey = relationObj.foreignKey === "" ? relationName + 'Id' : relationObj.foreignKey;
					//Now add nested schema to the relational model.
					generateTemplateStr(app, relationObj.model, belongsToSchema.templateOptions, roleList);

					if(belongsToSchema.templateOptions.includeRelatedModel){
						//Now if model-> related model -> related model (belongTo data is requested)
						//If some related mode of related model is requested too.. then in this case.. call this method..
						var relatedModelObj = app.models[relationObj.model];
						var relatedModelRelations = relatedModelObj.definition.settings.relations;
						var relatedHeader = addPropToHeader(app, relationObj.model, '', [], false, roleList, snaphyACL);

						belongsToSchema.templateOptions.relations = belongsToSchema.templateOptions.relations || {
							hasMany:[],
							belongsTo:[],
							hasManyThrough:[],
							hasAndBelongsToMany:[],
							hasOne:[]
						};
						//add schema
						addNestedModelRelation(app, relatedHeader, belongsToSchema.templateOptions, relatedModelRelations, relationObj.model, snaphyACL);
					}

					const checkRelationEditAccess_ = checkRelationEditAccess(relationObj, roleList);
					//Only allow if reject value is set to be false..
					if(!checkRelationEditAccess_){
                        if(relations[relationName].templateOptions.box){
                            schema.container[relations[relationName].templateOptions.box] = schema.container[relations[relationName].templateOptions.box] || initializeContainer();
                            schema.container[relations[relationName].templateOptions.box].schema.push(belongsToSchema);
                        }else{
                            //Now add this to the schema..
                            schema.container.default = schema.container.default || initializeContainer();
                            schema.container.default.schema.push(belongsToSchema);
                            //schema.fields.push(belongsToSchema);
                        }
					}
				}

			}
		}//for in loop..
	};



    /**
     * Add container definition like class or style..
     * @param schema
     * @param tableObj
     */

    const addContainerSettings = function (schema, tableObj) {
        if(tableObj.box){
            for(const boxName in tableObj.box){
                if(tableObj.box.hasOwnProperty(boxName)){
                    //initializeContainer();
                    schema.container[boxName] = schema.container[boxName] || initializeContainer();
                    let settings = tableObj.box[boxName];
                    //Assign properties value to schema..
                    for(const prop in settings){
                        if(settings.hasOwnProperty(prop)){
                            schema.container[boxName][prop] = settings[prop];
                        }
                    }
                }
            }
        }
        return schema;
    };





    /**
	 * Generate header by adding properties key names.
	 * @param app
	 * @param modelName
	 * @param prefix
	 * @param header
	 * @param absoluteSchema
	 * @param roleList
	 * @param snaphyACL
     * @returns {*|Array}
     */
	var addPropToHeader = function(app, modelName, prefix,  header, absoluteSchema, roleList, snaphyACL){
		header = header || [];
        if(!absoluteSchema){
            absoluteSchema = false;
        }
		var modelObj = app.models[modelName],
		modelProperties = modelObj.definition.rawProperties,
		hiddenProperties = modelObj.definition.settings.hidden;
		for(var key in modelProperties){
			if(modelProperties.hasOwnProperty(key)){

				//Add only if template is defined.
				if(modelProperties[key].template !== undefined){
                    //Flag to track if to reject property or accept prop..
                    let rejectProperty = checkPropertyAccess(modelProperties[key].template, roleList, "header");
                    let dynamicRejectProperty = checkDynamicPropertyAccess(key, prefix, roleList, snaphyACL, "header");
                    //Only allow if reject prop value is false..
                    if(!rejectProperty && !dynamicRejectProperty){
                        var propIsHidden = false;
                        if(hiddenProperties){
                            //Now checkingif the value is a hidden prop.
                            for(var i=0; i<hiddenProperties.length; i++){
                                var prop = hiddenProperties[i];
                                if(prop ===  key){
                                    propIsHidden = true;
                                    break;
                                }
                            }
                        }
                        if(!propIsHidden){
                            if(prefix === ''){
                                //Add key to the header..
                                header.push(key);
                            }else{
                                if(absoluteSchema){
                                    header.push(prefix + '.' + key);
                                }else{
                                    header.push(prefix + '_' + key);
                                }
                            }
                        }
                    }

				}//if
			}
		}
		return header;
	};


    /**
     *  Intiailize the container object for a container type
     * @returns {{class: Array, style: {}, schema: Array, options: {}}}
     */
    const initializeContainer = function () {
        return {
            //Class in form or array..
            class: [],
            style:{},
            //Store schema for the given container
            schema:[],
            //For storing additional options..
            options:{}
        };
    };



	/**
	 * Generate template structure for data entry schema.
	 * @param app
	 * @param modelName
	 * @param schema
	 * @param roleList {[string]} list of roles for current logged user. Loopback current context.
	 * @param snaphyACL
     * @returns {*}
     */
	var generateTemplateStr = function(app, modelName, schema, roleList, snaphyACL){
		if(!schema){
			schema = {};
			schema.model = modelName;
			schema.relations = {
				hasMany:[],
				belongsTo:[],
				hasManyThrough:[],
				hasAndBelongsToMany:[],
				hasOne:[]
			};
		}

        //Start adding container..
        schema.container = {};
        //Store different fields by their name,,
        schema.container.default   = schema.container.default || initializeContainer();

		//schema.fields   = [];
		const validationModelObj = helper.getValidationObj(modelName);
		//{validationsBackend, complexValidation}

        //path of table data from //common/table/model.json data
        const tableModelObj = helper.getTablePath(modelName);
        //Actual table object data..
        let tableModelData = {};
        //{validationsBackend, complexValidation}
        if(tableModelObj){
            if(tableModelObj.json){
                tableModelData = helper.readPackageJsonFile(tableModelObj.json);
            }
        }

        //Add container settings stored in table definitions..file..
        addContainerSettings(schema, tableModelData);

		let
			validationObj,
			complexValidation,
			modelObj    = app.models[modelName],
			modelProperties = modelObj.definition.rawProperties;


		if(validationModelObj){
			if(validationModelObj.validationsBackend){
				validationObj = validationModelObj.validationsBackend;
			}

			if(validationModelObj.complexValidation){
				complexValidation = validationModelObj.complexValidation;
			}
		}



		let newValidationObj = {
			rules:{},
			messages:{}
		};

		for(var propertyName in modelProperties){
			if(modelProperties.hasOwnProperty(propertyName)){
				var propObj = modelProperties[propertyName].template;
				if(propObj !== undefined){
                    //Flag to track if to reject property or accept prop..
                    let rejectProperty = checkPropertyAccess(propObj, roleList, "fields");
                    let dynamicRejectProperty = checkDynamicPropertyAccess(propertyName, '', roleList, snaphyACL, "fields");


                    //Add property only if rejectProperty value is false..
                    if(!rejectProperty && !dynamicRejectProperty){
                        propObj.key = propertyName;
                        //also add the validation to the object..
                        try{
                            var validationRules = validationObj.rules[propertyName];
                            var validationMessages = validationObj.messages[propertyName];

                            if(propObj.templateOptions && validationRules){
                                if(propObj.templateOptions.id){
                                    var validationName = propObj.templateOptions.id;
                                    //Get the validation object..
                                    newValidationObj.rules[validationName] = validationRules;
                                    newValidationObj.messages[validationName] = validationMessages;
                                }
                            }
                        }catch(err){
                            // Do nothing
                            // Validation is not defined in the model definition
                        }

                        if (propObj.templateOptions) {
                            if (propObj.templateOptions.box) {
                                schema.container[propObj.templateOptions.box] = schema.container[propObj.templateOptions.box] || initializeContainer();
                                schema.container[propObj.templateOptions.box].schema.push(propObj);
                            } else {
                                schema.container.default = schema.container.default || initializeContainer();
                                schema.container.default.schema.push(propObj);
                            }
                        } else {
                            schema.container.default = schema.container.default || initializeContainer();
                            schema.container.default.schema.push(propObj);
                        }
                    }
				}
			}
		}//for-in

        //This code is just for adding validation in schema..of relation properties..
        var modelRelation = modelObj.definition.settings.relations;
        for(var relationName in modelRelation){
			if(modelRelation.hasOwnProperty(relationName)){
				var relationObj = modelRelation[relationName].templateOptions;
				if(relationObj !== undefined){
					relationObj.key = relationName;
					//also add the validation to the object..
					try{
						var validationRules_ = validationObj.rules[relationName];
						var validationMessages_ = validationObj.messages[relationName];

						if(relationObj && validationRules_){
							if(relationObj.id){
								var validationName_ = relationObj.id;
								//Get the validation object..
								newValidationObj.rules[validationName_] = validationRules_;
								newValidationObj.messages[validationName_] = validationMessages_;
							}
						}

					}catch(err){
                        console.error(err);
						// Do nothing
						// Validation is not defined in the model definition
					}

				}
			}
		}//for-in


        //Now also add custom validation for facilitating array type validation or other complex validation..
        //Just copy direct validation in this case..
        if(complexValidation){
            if(complexValidation.rules){
                for(var key in complexValidation.rules){
                    if(complexValidation.rules.hasOwnProperty(key)){
                        newValidationObj.rules[key] = complexValidation.rules[key];
                        if(complexValidation.messages[key]){
                            newValidationObj.messages[key] = complexValidation.messages[key];
                        }

                    }
                }
            }
        }


		//Now adding validation obj..
		schema.validations = newValidationObj;
		return schema;
	};




	//return all the methods that you wish to provide user to extend this plugin.
	return {
		init: init,
        getSnaphyACL: getSnaphyACL,
        initializeContainer: initializeContainer,
        addContainerSettings: addContainerSettings,
        checkPropertyAccess: checkPropertyAccess,
        checkDynamicPropertyAccess: checkDynamicPropertyAccess,
        checkRelationEditAccess: checkRelationEditAccess
	};
}; //module.exports
