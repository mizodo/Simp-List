(function () {

    let developmentEnvironment = true;
    if (developmentEnvironment) {
        //! Disables security warning during Dev.
        process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
        //! Auto reloads page for Dev.
        require('electron-reload')(__dirname, {
            ignored: /node_modules|[\/\\]\.|db/
        })
    }

    const {
        app,
        BrowserWindow,
        ipcMain,
        Menu,
        dialog
    } = require('electron')


    //** Create Main Window */
    // Keep a global reference of the window object, if you don't, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    let mainWindow;

    function createMainWindow() {
        mainWindow = new BrowserWindow({
            width: 470,
            height: 1000,
            webPreferences: {
                nodeIntegration: true,
            },
            show: false,
            frame: false,
            icon: __dirname + '/assets/icons/win/icon.png'
        })
        mainWindow.loadURL(`file://${__dirname}/renderer/mainWindow.html`)
 
        if(developmentEnvironment){
            //! Open Dev Tools
            mainWindow.webContents.openDevTools()
        }
      
        // gracefully shows window by waiting until content is ready to show, then 'show()'s the window
        mainWindow.on('ready-to-show', () => {
            mainWindow.show()
            mainWindow.focus()
        })
        mainWindow.on('closed', () => {
            mainWindow = null
        })
    }
    //* Listen for and create 'Delete Confirmation Dialog' for deleting task item
    ipcMain.on('delete-task-confirmation', (event) => {
        let options = {
            buttons: ['Yes', 'No', 'Cancel'],
            cancelId: 2,
            defaultId: 1,
            message: 'Delete Task Item?',
            type: 'question',
            icon: __dirname + '/assets/icons/win/icon.png',
            title: 'Deletion Confirmation'
        }
        dialog.showMessageBox(mainWindow, options, (response) => {
            event.sender.send('delete-task-confirmation-reply', response)
        })
    })

    //* Listen for and create 'Delete Confirmation Dialog' for deleting old completed task
    ipcMain.on('delete-old-completed-task-confirmation', (event,numberOfDocuments) => {
        console.log(numberOfDocuments);
        let options = {
            buttons: ['Yes', 'No', 'Cancel'],
            cancelId: 2,
            defaultId: 1,
            message: `There are ${numberOfDocuments} completed task older then today. Would you like to delete them?`,
            type: 'question',
            icon: __dirname + '/assets/icons/win/icon.png',
            title: 'Deletion Confirmation'
        }
        dialog.showMessageBox(mainWindow, options, (response) => {
            event.sender.send('delete-old-completed-task-confirmation-reply', response)
        })
    })

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', createMainWindow)

    // Quit when all windows are closed.
    app.on('window-all-closed', function () {
        // On macOS it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') app.quit()
    })

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) createWindow()
    })

})();