(function() {
    'use strict';
})();

const Promise = require("bluebird");
const process = require("process");

module.exports = function(server, databaseObj, helper, packageObj) {
    
    const init = function(){

    };



    /**
     * Will bind model to the data..
     * @param {*} modelName 
     */
    const bindModel = function(modelName){
        const app       = server;
        const modelObj  = app.models[modelName];
        const propListObj  = modelObj.definition.properties;

        if(propListObj){
            for(let propertyName in propListObj){
                if(propListObj.hasOwnProperty(propertyName)){
                    const propertyData = propListObj[propertyName];
                    if(propertyData){
                        if(propertyData.template){
                            if(propertyData.template.type === "multiSmartSelect"){
                                const templateOptions = propertyData.template.templateOptions;
                                if(templateOptions){
                                    if(templateOptions.bind){
                                        //Add Observer for listening for changes in the Model..
                                        subscribeRelatedModelChange(modelName, propertyName, templateOptions);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };



    /**
     * Subscribe to Related Model Change..
     * @param {*} modelName 
     * @param {*} templateOptions 
     * example in model News
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

        here 
        1. newsLabels is the property name.
        2. templateOptions obeject is the templateOptions
        3. News is the modelName
     */
    const subscribeRelatedModelChange = function(modelName, propertyName, templateOptions){
        const relatedModelName = templateOptions.modelName;
        const relatedModelInstance = server.models[relatedModelName];

        if(relatedModelInstance){
            relatedModelInstance.observe("after save", function(ctx, next){
                const instance          = ctx.instance || ctx.data;                     // getting instance
                const currentInstance   = ctx.currentInstance;                          // getting currentInstance
                const isNew             = ctx.isNewInstance;
                
                if(!isNew){
                    //Update all the related models in 
                    if(instance){
                        if(instance.id){
                            var searchProp = templateOptions.searchProp;
                            if(searchProp){
                                if(instance[searchProp]){
                                    process.nextTick(function(){
                                        const where = {};
                                        let key = propertyName + "." + instance.id;
                                        where[key] = instance.id; 
                                        const modelInstance = server.models[modelName];
                                        let targetData;
                                        relatedModelInstance.findById(instance.id)
                                        .then(function(data){
                                            targetData = data;
                                            return modelInstance.find(where);
                                        })
                                        .then(function(items){
                                            const promiseList = [];
                                            if(targetData){
                                                if(items){
                                                    if(items.length){
                                                        items.forEach(function(item){
                                                            if(item){
                                                                promiseList.push(new Promise(function(resolve, reject){
                                                                    if(item[propertyName]){
                                                                        if(item[propertyName].length){
                                                                            let found = -1;
                                                                            for(let index = 0; index<item[propertyName].length; index++){
                                                                                const data = item[propertyName][index];
                                                                                if(data){
                                                                                    if(data.id){
                                                                                        if(data.id.toString() === targetData.id.toString()){
                                                                                            found = index;
                                                                                            break;
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }

                                                                            if(found == -1){
                                                                                resolve();
                                                                            }else{
                                                                                let index = found;
                                                                                item[propertyName][index] = targetData.toJSON();
                                                                                //Now update the item to database..
                                                                                item.save()
                                                                                .then(function(){
                                                                                    resolve();
                                                                                })
                                                                                .catch(function(error){
                                                                                    reject(error);
                                                                                });
                                                                            }
                                                
                                                                        }else{
                                                                            resolve();
                                                                        }
                                                                    }else{
                                                                        resolve();
                                                                    }
                                                                })); 
                                                            }
                                                        });
                                                    }
                                                }
                                            }
                                        })
                                        .catch(function(error){
                                            console.error("Error in updating multiple items in automata/backend/multiSmartSelect");
                                            console.error(error);
                                        });
                                    });
                                }
                            }
                            
                        }
                    }
                }
                
                next();
            });
        }
    };


    return {
        init: init,
        bindModel: bindModel
    };
};