(function () {
    const fs = require("fs");
    const Datastore = require("nedb");
    const appSettings = require('../js/appSettings')

    // Create Data-store with last used or default db path obtained from appSettings
    let currentTaskDB = new Datastore({
        filename: loadDBPath(),
        autoload: true
    });

    function loadDBPath() {
        let dbPath;
        if (appSettings.data.userDBPath.length) {
            dbPath = appSettings.data.userDBPath;
        } else if (appSettings.data.lastUsedDBPath) {
            dbPath = appSettings.data.lastUsedDBPath;
        } else {
            dbPath = appSettings.data.defaultDBPath;
        }
        if (!fs.existsSync(dbPath)) {
            dbPath = "db/default_task.db";
        }
        return dbPath
    }


    //- Look into possibly moving parts of below into appSettings file.
    const {
        remote
    } = require("electron");
    const path = require("path");
    const app = remote.app;
    const userDataPath = app.getPath("userData");
    const appSettingsPath = path.join(userDataPath, "appSettings.json");

    function updateDBPath(newDBFilePath) {
        return new Promise((resolve, reject) => {
            appSettings.data.lastUsedDBPath = newDBFilePath;
            let settingsJSON = JSON.stringify(appSettings.data);

            fs.writeFile(appSettingsPath, settingsJSON, err => {
                if (err) {
                    reject(err)
                } else {
                    let newTaskDB = new Datastore({
                        filename: newDBFilePath,
                        autoload: true
                    });
                    currentTaskDB = newTaskDB;
                    displayDBInformation()
                    resolve()
                }
            });
        })
    }


    //* Inserts Database information into DOM on initial load. 
    displayDBInformation()

    function displayDBInformation() {
        const pathElement = document.querySelector('.database_path');
        const filenameElement = document.querySelector('.database_filename');
        pathElement.textContent = currentTaskDB.filename
        filenameElement.textContent = path.basename(currentTaskDB.filename, path.extname(currentTaskDB.filename))
    }
    //* selects range of documents by date (currently selects 'completed task' with 'completed date' older then today)
    function selectOldCompletedTask() {
        let startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        return new Promise((resolve, reject) => {
            currentTaskDB.find({
                'status.complete': true,
                'dates.completed': {
                    $lt: startDate,
                    $ne: null
                }
            }).sort({
                priority: -1
            }).exec(function (err, rangeOfDocuments) {
                if (err) {
                    reject(err)
                } else {
                    resolve(rangeOfDocuments)
                }
            });
        })
    }
    //* delete 'completed task' with 'completed date' older then today 
    function deleteOldCompletedTask() {
        let startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        return new Promise((resolve, reject) => {
            currentTaskDB.remove({
                'status.complete': true,
                'dates.completed': {
                    $lt: startDate,
                    $ne: null
                }
            }, {
                multi: true
            }, (err, numRemoved) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(numRemoved)
                }
            });
        });
    }

    //* Find only Active Task
    function findActiveTask() {
        return new Promise((resolve, reject) => {
            currentTaskDB.find({
                'status.complete': false
            }).sort({
                priority: -1
            }).exec(function (err, activeTask) {
                if (err) {
                    reject(err)
                } else {
                    resolve(activeTask)
                }
            });
        })
    }

    //* Find only Todays Completed Task
    function findTaskCompletedToday() {
        let todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        let todayEnd = new Date()
        todayEnd.setDate(todayEnd.getDate() + 1)
        todayEnd.setHours(0, 0, 0, 0)

        return new Promise((resolve, reject) => {
            currentTaskDB.find({
                'dates.completed': {
                    $gte: todayStart,
                    $lt: todayEnd
                }
            }).sort({
                priority: -1
            }).exec(function (err, activeTask) {
                if (err) {
                    reject(err)
                } else {
                    resolve(activeTask)
                }
            });
        })
    }

    // ! may be able to remove below function once finished testing above functions
    //* DB function: Find All Docs
    function findAllDocuments() {
        console.log("Inserting Documents Into Dom");
        return new Promise((resolve, reject) => {
            currentTaskDB.find({}).sort({
                priority: -1
            }).exec(function (err, allDocuments) {
                if (err) {
                    reject(err)
                } else {
                    resolve(allDocuments)
                }
            });
        })
    }
    //* DB function: Insert New Item 
    function insertDocument(taskDocument, target) {
        return new Promise((resolve, reject) => {
            currentTaskDB.insert(taskDocument, (err, newDocument) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(newDocument)
                }
            });
        })
    }
    //* DB function: Remove Item 
    function removeDocument(id) {
        return new Promise((resolve, reject) => {
            currentTaskDB.remove({
                _id: id
            }, {}, (err, numRemoved) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(numRemoved)
                }
            });
        })
    }
    //* DB function: Update Document in DB 
    function updateDocument(key, listItem, value) {
        console.log('In Process: Updating Document');
        let docID = listItem.getAttribute("data-doc-id");
        if (key === 'status.complete') {
            let completedDate = value === false ? null : new Date()
            return new Promise((resolve, reject) => {
                currentTaskDB.update({
                        _id: docID
                    }, {
                        $set: {
                            [key]: value,
                            'dates.completed': completedDate
                        }
                    },
                    (err, NumberOfDocsUpdated) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(NumberOfDocsUpdated)
                        }
                    }
                );
            })
        } else {
            return new Promise((resolve, reject) => {
                currentTaskDB.update({
                        _id: docID
                    }, {
                        $set: {
                            [key]: value
                        }
                    },
                    (err, NumberOfDocsUpdated) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(NumberOfDocsUpdated)
                        }
                    }
                );
            })
        }
    }

    module.exports = {
        insertDocument,
        removeDocument,
        updateDocument,
        findAllDocuments,
        updateDBPath,
        findActiveTask,
        findTaskCompletedToday,
        selectOldCompletedTask,
        deleteOldCompletedTask
    }

})();