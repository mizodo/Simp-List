(function () {
    const {
        remote
    } = require("electron");
    const path = require("path");
    const fs = require("fs");
    const app = remote.app;
    const sectionAllTask = document.querySelector(".section_all_task");
    const settingsPane = document.querySelector('.settings_pane')
    const userDataPath = app.getPath("userData");
    const appSettingsPath = path.join(userDataPath, "appSettings.json");
    const appSettings = {};
    checkAppSettingsExistence();

    

    //*             App Settings : Load/Listen/Update
    //* _________________________________________________________

    //* NOTE: fs module SYNC versions are BLOCKING. additional code will not run until it is finished. (good for loading settings)

    function checkAppSettingsExistence() {
        try {
            if (fs.existsSync(appSettingsPath)) {
                appSettings.data = JSON.parse(fs.readFileSync(appSettingsPath));
                loadAppSettings();
            } else {
                const defaultAppSettings = {
                    defaultDBPath: "db/default_task.db",
                    userDBPath: "",
                    lastUsedDBPath: "",
                    list_side_by_side: false,
                    new_task_auto_change_date: true,
                    dates_due_change_color: true

                };
                let settingsJSON = JSON.stringify(defaultAppSettings);
                fs.writeFileSync(appSettingsPath, settingsJSON, "utf-8");
                appSettings.data = JSON.parse(fs.readFileSync(appSettingsPath));
                loadAppSettings()
            }
        } catch (err) {
            console.error(err);
        }
    }

    function loadAppSettings() {
        if (appSettings.data.list_side_by_side === true) {
            sectionAllTask.classList.add("flex_it");
            settingsPane.querySelector("[name='list_side_by_side']").checked = true;
        }
        if (appSettings.data.new_task_auto_change_date === true) {
            settingsPane.querySelector("[name='new_task_auto_change_date']").checked = true;
        }
        if (appSettings.data.dates_due_change_color === true) {
            settingsPane.querySelector("[name='dates_due_change_color']").checked = true;
        }
        console.log('App Settings Loaded');
    }

    //* Listen for changes to appSettings
    settingsPane.addEventListener("change", e => {
        let target = e.target
        if (target.matches("[name='list_side_by_side']")) {
            if (target.checked === true) {
                sectionAllTask.classList.add("flex_it");
            } else if (target.checked === false) {
                sectionAllTask.classList.remove("flex_it");
            }
            updateAppSettings(target.name, target.checked);
        } else if (target.matches("[name='new_task_auto_change_date']")) {
            updateAppSettings(target.name, target.checked)
        } else if (target.matches("[name='dates_due_change_color']")) {
            // - WIP - sets main parent element to false or true (which changes the CSS styles to color or not color dates)
            const sectionAllTask = document.querySelector('.section_all_task');          
            sectionAllTask.setAttribute('data-dates-colored',`${target.checked}`)

            updateAppSettings(target.name, target.checked)

        } else {
            return;
        }
    });
    settingsPane.addEventListener('click', (e) => {
        if (e.target.matches('.button_close_settings')) {
            settingsPane.classList.remove('opened')
        }
    })

    //* update appSettings.data
    function updateAppSettings(key, value) {
        appSettings.data[key] = value;
        let settingsJSON = JSON.stringify(appSettings.data);
        fs.writeFileSync(appSettingsPath, settingsJSON, "utf-8");
    }
    
   
    module.exports = appSettings

})();