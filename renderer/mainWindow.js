(function () {

    //* load modules
    const {
        ipcRenderer,
        remote,
    } = require("electron");

    const dialog = remote.dialog;

    //* load custom modules
    const appSettings = require('../js/appSettings')
    const {
        insertDocument,
        removeDocument,
        updateDocument,
        findAllDocuments,
        updateDBPath,
        findActiveTask,
        findTaskCompletedToday,
        selectOldCompletedTask,
        deleteOldCompletedTask
    } = require('../js/dbControls')

    const newTaskDocument = require("../js/taskSchema");


    //*         ANIMATIONS
    //*______________________________________________
    //- thinking about moving to separate module file
    const anime = require('../lib/anime');

    // animate sort arrow 
    function morphUp(targetElement) {

        anime({
            targets: targetElement,
            points: [{
                value: '12.5,67.2 12.5,72.8 50,63 87.5,72.8 87.5,67.2 50,17 '
            },],
            opacity: 1,
            fill: '#de48f1',
            easing: 'linear',
            duration: 300,
        });
    }

    function morphMiddle(targetElement) {
        anime({
            targets: targetElement,
            points: [{
                value: '12.5,37.2 12.5,62.8 50,63 87.5,62.8 87.5,37.2 50,37 '
            },],
            opacity: .3,
            fill: '#8FE1FF',
            easing: 'linear',
            duration: 300,
        });
    }

    function morphDown(targetElement) {
        anime({
            targets: targetElement,
            points: [{
                value: '12.5,27.2 12.5,32.8 50,83 87.5,32.8 87.5,27.2 50,37 '
            },],
            opacity: 1,
            fill: '#ee991a',
            easing: 'linear',
            duration: 300,
        });
    }

    //*                   CONSTANTS
    //*___________________________________________

    const listActiveTask = document.querySelector(".active_task_list");
    const listCompleteTask = document.querySelector(".completed_item_list");
    const newItemDateElement = document.querySelector('.new_item_due_date')
    const sectionAllTask = document.querySelector(".section_all_task");
    const hiddenMessageNoTask = document.querySelector(".no_task_message");
    const addNewItemContainer = document.querySelector('.add_new_item_container')
    const inputNewTaskText = document.querySelector('.input_new_list_item')
    const allSortPriorityButtons = document.querySelectorAll('.button_sort_by_priority');
    const allSortPriorityArrows = document.querySelectorAll('.sortPriorityArrow')
    const inputEditItem = document.querySelector(".input_edit_list_item");
    const hiddenElement = document.querySelector(".hidden_element");
    /* const allDatesDue = document.querySelectorAll('.date_due'); */

    //*            Initial On Load Code to Run/Trigger                         
    //*__________________________________________________________
    window.addEventListener("load", (e) => {
        loadTaskIntoDom()
        // Settings Pane hidden = false on window load
        document.querySelector('.settings_pane').hidden = false
    });
    setDateBasedOnPriority("P1", newItemDateElement);


    //-       WIP 5/30 - TESTING (working) getting task and inserting into DOM
    //*              Load Task Items into the DOM (Active and Today's Completed Task)
    //*___________________________________________________________________________________________
    function loadTaskIntoDom() {
        // Find and Insert Active Task
        findActiveTask().then((activeTask) => {
            console.log('INSIDE LOAD TASK INTO DOM');
            if (activeTask.length < 1) {
                updateTaskQuantities();
                return (hiddenMessageNoTask.hidden = false);
            }
            for (let i = 0; i < activeTask.length; i++) {
                createNewTaskElement(activeTask[i]);
            }
            updateTaskQuantities();
            morphDown(allSortPriorityArrows)
            const listContainerActive = document.querySelector('.list_container_active');
            const listContainerCompleted = document.querySelector('.list_container_completed');
            // change this to be dynamic based on past user preferences 
            setSortState(listContainerActive, 'selected_priority', 'ascending')
            setSortState(listContainerCompleted, 'selected_priority', 'ascending')
            for (let i = 0; i < allSortPriorityButtons.length; i++) {
                allSortPriorityButtons[i].setAttribute('data-button-sort', 'ascending')
            }
        })
            .then(() => {
                const allDatesDue = document.querySelectorAll('.date_due');
                updateDueDateDataAttributes(allDatesDue)
            })
            .catch((err) => {
                console.log('DB function error: ' + err);
            });
        // Find and insert Todays Completed Task
        findTaskCompletedToday().then((taskCompletedToday) => {

            if (taskCompletedToday.length < 1) {
                updateTaskQuantities();
                return
            }
            for (let i = 0; i < taskCompletedToday.length; i++) {
                createNewTaskElement(taskCompletedToday[i]);
            }
            updateTaskQuantities();
            morphDown(allSortPriorityArrows)
            const listContainerActive = document.querySelector('.list_container_active');
            const listContainerCompleted = document.querySelector('.list_container_completed');
            // change this to be dynamic based on past user preferences 
            setSortState(listContainerActive, 'selected_priority', 'ascending')
            setSortState(listContainerCompleted, 'selected_priority', 'ascending')
            for (let i = 0; i < allSortPriorityButtons.length; i++) {
                allSortPriorityButtons[i].setAttribute('data-button-sort', 'ascending')
            }
        })
            .then(() => {
                const allDatesDue = document.querySelectorAll('.date_due');
                updateDueDateDataAttributes(allDatesDue)
            })
            .catch((err) => {
                console.log('DB function error: ' + err);
            });
    }



    //**          DOM Manipulation : R&R Task List Items        */
    //**_______________________________________________________ */

    function replaceTaskDomElements() {
        // Empties listActive and listComplete, then inserts new Documents as List Items.
        let child = listActiveTask.firstElementChild;
        while (child) {
            listActiveTask.removeChild(child);
            child = listActiveTask.firstElementChild;
        }
        let completeChild = listCompleteTask.firstElementChild;
        while (completeChild) {
            listCompleteTask.removeChild(completeChild);
            completeChild = listCompleteTask.firstElementChild;
        }
        // load chosen db task documents
        loadTaskIntoDom()
    }

    //*                  'Add NEW Task' Code
    //* _______________________________________________________
    // Listen for focus on text input field 
    inputNewTaskText.addEventListener('focus', (e) => {
        inputNewTaskText.closest('.add_new_item_container').classList.add('opened')

    })
    // reset transform position on main container
    function resetContainerTransform() {
        addNewItemContainer.classList.remove('opened')
    }
    // Listen for Priority change on Options
    addNewItemContainer.querySelector(".new_item_options").addEventListener("click", (e) => {
        if (appSettings.data.new_task_auto_change_date === false) {
            return
        } else if (e.target && e.target.matches("input[type='radio']")) {
            let dateElement = e.target.closest('.new_item_options').querySelector('.new_item_due_date')
            setDateBasedOnPriority(e.target.value, dateElement);
        }
    });
    // Listen for input on textarea to change size of text-box when needed. 
    inputNewTaskText.addEventListener('input', (e) => {
        inputNewTaskText.style.height = inputNewTaskText.scrollHeight + "px"
    })

    // Helper function to set date based on priority level.
    function setDateBasedOnPriority(priority, dateElement) {
        let date = new Date();
        if (priority === "P1") {
            date.setHours(date.getHours() + 4);
        } else if (priority === "P2") {
            date.setDate(date.getDate() + 1);
        } else if (priority === "P3") {
            date.setDate(date.getDate() + 3);
        } else if (priority === "P4") {
            date.setDate(date.getDate() + 5);
        }
        dateElement.value = date.toLocaleDateString();
    }

    // Listen for New Task Item to be added.
    document.addEventListener("submit", (e) => {
        e.preventDefault();
        let target = e.target;
        let inputValue = target.querySelector(".input_new_list_item").value;
        let priority = target.querySelector('input[name="priority_radio_group"]:checked').value;
        let dueDate = target.querySelector('.new_item_due_date').value
        newTaskDocument.text_content = inputValue;
        newTaskDocument.dates.created = new Date();
        newTaskDocument.dates.due = new Date(dueDate);
        newTaskDocument.priority = priority;
        resetContainerTransform()
        insertDocument(newTaskDocument, target).then((newDocument) => {
            createNewTaskElement(newDocument, target, "sort");
            updateTaskQuantities()
        }).catch((err) => {
            console.log('DB Function Error: ' + err);
        });

    });

    // create new list item and insert/append to DOM
    function createNewTaskElement(newDocument, target, sort) {
        let li = document.createElement("li");
        li.setAttribute("class", "task_item");
        li.setAttribute("data-doc-id", `${newDocument._id}`);
        let status;
        if (newDocument.status.complete === true) {
            status = "checked";
        }
        let markup = `
    <div class="task_details_container">
        <div class="priority_container">
            <div data-priority="${newDocument.priority}" class="priority ${newDocument.priority} selected_priority"></div>
        </div>
        <div class="date_due_wrap"><span class="date_due">${newDocument["dates"]["due"].toLocaleDateString()}</span></div>
    </div>
    <div class="bottom_container">
        <p class="text_content"></p>

        <div class="state_change_container">
            <label class="label_status_checkbox">
                <input class="status_checkbox" type="checkbox" name="status_main" ${status}>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 200 200" style="enable-background:new 0 0 200 200;" xml:space="preserve">
                    <path class="svg_path_checkmark" d="M177,18.4c-44.5,7-90.3,99.7-93.6,103.5c-3.1-1.9-20.6-31.5-27.6-34.8C44.6,81.8,32,89,35,103.6
                    c0.8,4.1,7.8,7.5,12,11.5c9,8.5,20.5,28.4,22.9,39.9c1.2,5.8,3.9,11.6,10.1,13.8c11.2,4.1,17.5-8.3,19.9-16.4
                    c13.3-43.8,48.2-110.1,83-130.1c1.1-0.6,6.5-3.8,6.5-3.8S182.6,17.5,177,18.4z" />
                </svg>
            </label>
            <button class="button_delete_item"></button>
        </div>
    </div>
    `
        li.insertAdjacentHTML('beforeend', markup)
        li.querySelector('.text_content').textContent = newDocument.text_content

        let targetList = newDocument.status.complete === true ? listCompleteTask : listActiveTask
        targetList.insertBefore(li, targetList.childNodes[0]);
        if (sort) {
            let sortOrder = targetList.closest('.list_container').getAttribute('data-sort-order')
            let sortBy = targetList.closest('.list_container').getAttribute('data-sort-by')
            sortListItems(targetList, sortBy, sortOrder);
            updateDueDateDataAttributes([li.querySelector('.date_due')])
        }
        if (hiddenMessageNoTask.hidden === false) hiddenMessageNoTask.hidden = true;
        if (target && target.matches('form')) {
            target.reset();
            resetAddNewTaskElements()
        }
    }
    // reset the 'add new task' element
    function resetAddNewTaskElements() {
        setDateBasedOnPriority("P1", newItemDateElement);
        inputNewTaskText.style.height = 'unset'
    }

    //*                     Update Quantities 
    //*_____________________________________________________________________

    // Update task item quantity in list header
    function updateTaskQuantities(element) {
        let listHeaders;
        if (element === undefined) {
            listHeaders = document.querySelectorAll(".list_header_wrap");
            for (let i = 0; i < listHeaders.length; i++) {
                let listQuantityElement = listHeaders[i].querySelector('.list_quantity')
                let associatedList = listHeaders[i].nextElementSibling;
                listQuantityElement.textContent = associatedList.querySelectorAll("li").length;
            }
        } else {
            element.textContent = "Just a Placeholder =(";
        }
    }

    //*        Priority Changes on Task Line Items
    //*_______________________________________________________

    function changePriority(target) {
        let container = target.parentElement;
        let recentlySelected = container.querySelector(".selected_priority");
        let currentlySelected = getPrioritySelected(recentlySelected, target);
        let currentlySelectedPriority = currentlySelected.dataset.priority;
        if (!container.classList.contains("opened") && !container.classList.contains("closed")) {
            container.classList.add("opened");
            createPriorityElements(currentlySelectedPriority, container);
        } else if (container.classList.contains('closed')) {
            container.classList.remove('closed')
            container.classList.add('opened')
            container.style.width = `unset`
            return;
        } else if (container.classList.contains("opened")) {
            container.classList.remove("opened");
            container.classList.add('closed')
            container.style.width = `${target.offsetWidth}px`
            let listItem = target.closest('.task_item');
            if (currentlySelected === recentlySelected) return;
            let sortArrow = container.closest('.list_container').querySelector('.button_sort_by_priority polygon')
            morphMiddle(sortArrow)
            updateDocument("priority", listItem, currentlySelectedPriority).then((result) => {
                console.log('db updated successfully');
            }).catch((err) => {
                console.log('DB Function Error: ' + err);
            });
        }
    }

    function getPrioritySelected(recentlySelected, target) {
        if (target === recentlySelected) return target;
        recentlySelected.classList.remove("selected_priority");
        target.classList.add("selected_priority");
        return target;
    }

    function createPriorityElements(currentlySelectedPriority, container) {
        let priorityElementsNeeded = ["P1", "P2", "P3", "P4"];
        // removes currently selected_priority element from array
        for (let i = 0; i < priorityElementsNeeded.length; i++) {
            if (priorityElementsNeeded[i] === currentlySelectedPriority) {
                priorityElementsNeeded.splice(i, 1);
            }
        }
        for (let i = 0; i < priorityElementsNeeded.length; i++) {
            let priorityElement = document.createElement("div");
            priorityElement.className += `priority ${priorityElementsNeeded[i]}`;
            priorityElement.setAttribute("data-priority", `${priorityElementsNeeded[i]}`);
            container.appendChild(priorityElement);
            sortListItems(container, "priority");
        }
    }

    //*        Task Item Changes, Editing, Deleting
    //*_______________________________________________________

    // Listener (click) for All Task Items and List Headers (for sorting)
    sectionAllTask.addEventListener("click", e => {
        if (e.target.matches(".text_content")) {
            makeListItemEditable(e.target);
        }
        if (e.target.matches(".button_delete_item")) {
            confirmDeleteTaskItem(e.target)
        }
        if (e.target.matches(".priority")) {
            changePriority(e.target);
        }
        if (e.target.matches('.button_sort_by_priority')) {
            let list = e.target.closest('.list_container').querySelector('.all_task_list')
            let sortOrder = changeSortButtonState(e.target)
            sortListItems(list, 'selected_priority', sortOrder)
            changeSortState('selected_priority', sortOrder, e.target)
        }
        if (e.target.matches('.button_sort_by_date')) {
            let list = e.target.closest('.list_container').querySelector('.all_task_list')
            let sortOrder = changeSortButtonState(e.target)
            sortListItems(list, 'date_due', sortOrder)
            changeSortState('date_due', sortOrder, e.target)
        }
        return;
    });

    // Confirm Task Item Deletion
    function confirmDeleteTaskItem(target) {
        ipcRenderer.send('delete-task-confirmation')
        // look into use of .once vs .on. Someone on SO said this may not be good???
        // maybe send target through the initial .send and then back in the reply?
        ipcRenderer.once('delete-task-confirmation-reply', (event, reply) => {
            if (reply === 0) {
                console.log('initializing document removal');
                let id = target.closest('.task_item').dataset.docId
                removeDocument(id).then((numRemoved) => {
                    target.closest('.task_item').remove();
                    updateTaskQuantities()
                }).catch((err) => {
                    console.log('DB Function Error: ' + err);
                })
            } else {
                return
            }
        })
    }

    // Listen for Task Item Status Change COMPLETE/ACTIVE
    document.addEventListener("change", e => {
        if (!e.target.matches(".status_checkbox")) return;
        let listItem = e.target.closest('.task_item')
        console.log(e.target.checked);
        updateDocument("status.complete", listItem, e.target.checked).then((result) => {
            console.log('db updated successfully');
        }).catch((err) => {
            console.log('DB Function Error: ' + err);
        });
        let targetList = e.target.checked === true ? listCompleteTask : listActiveTask
        targetList.appendChild(listItem);
        // look into obtaining below variables from function object
        let sortBy = targetList.closest('.list_container').getAttribute('data-sort-by')
        let sortOrder = targetList.closest('.list_container').getAttribute('data-sort-order')
        sortListItems(targetList, sortBy, sortOrder)
        updateTaskQuantities()
    });
    // Listen on text input while editing to change size of text area dynamically
    inputEditItem.addEventListener("input", (e) => {
        inputEditItem.style.height = inputEditItem.scrollHeight + "px";
    });

    function makeListItemEditable(target) {
        let preExistingValue = target.textContent;
        inputEditItem.value = preExistingValue;
        sessionStorage.setItem('old_text', preExistingValue)
        target.textContent = "";
        target.classList.add("edit_state");
        target.appendChild(inputEditItem);
        // scroll height set on click
        inputEditItem.style.height = "fit-content";
        inputEditItem.style.height = inputEditItem.scrollHeight + "px";
        inputEditItem.focus();
    }

    function changeLastItemToInputValue() {
        let listItem = inputEditItem.closest('.task_item');
        inputEditItem.parentElement.classList.remove("edit_state");
        let inputValue = inputEditItem.value;
        inputEditItem.parentElement.textContent = inputValue;
        if (inputValue === sessionStorage.getItem('old_text')) return
        updateDocument("text_content", listItem, inputValue).then((result) => {
            console.log('db updated successfully');
        }).catch((err) => {
            console.log('DB Function Error: ' + err);
        });
    }
    inputEditItem.addEventListener("blur", e => {
        if (e.target.parentElement.matches(".edit_state")) {
            changeLastItemToInputValue();
        }
        hiddenElement.appendChild(inputEditItem);
    });

    //*                   Sorting & Sort STATE                   
    //*_______________________________________________________________
    // Sort associated List with supplied arguments 
    function sortListItems(targetList, sortBy, sortOrder) {
        let numX = -1;
        let numY = 1;
        if (sortOrder && sortOrder === 'descending') {
            numX = 1;
            numY = -1;
        }
        Array.prototype.slice
            .call(targetList.querySelectorAll(`.${sortBy}`))
            .sort(function sort(a, b) {
                if (sortBy === 'date_due') {
                    let aa = parseInt(a.dataset.timeRemaining)
                    let bb = parseInt(b.dataset.timeRemaining)
                    if (aa < bb) return numX;
                    if (aa > bb) return numY;
                    return 0;
                } else {
                    if (a.dataset.priority < b.dataset.priority) return numX;
                    if (a.dataset.priority > b.dataset.priority) return numY;
                    return 0;
                }

            })
            .forEach(function (childElement) {
                let li;
                if (targetList.classList.contains("all_task_list")) {
                    if (childElement.matches(".text_content")) {
                        li = childElement.parentElement;
                    } else if (childElement.matches(".priority") || childElement.matches('.date_due')) {
                        li = childElement.closest('.task_item');
                    }
                } else if (targetList.classList.contains("priority_container")) {
                    li = childElement;
                }
                targetList.appendChild(li);
            });
    }

    // change Sort State
    function changeSortState(sortBy, sortOrder, targetButton) {
        let targetArrow = targetButton.querySelector('polygon')
        let className = targetArrow.className.baseVal
        let opposingArrow = targetButton.closest('.list_header_wrap').querySelector(`polygon:not(.${className})`)
        morphMiddle(opposingArrow)
        if (sortOrder === 'descending') {
            morphUp(targetArrow)
        } else if (sortOrder === 'ascending') {
            morphDown(targetArrow)
        }
        let listContainer = targetButton.closest('.list_container')
        console.log(listContainer);
        setSortState(listContainer, sortBy, sortOrder)
    }
    // set set SORT STATE
    function setSortState(listContainer, sortBy, sortOrder) {
        listContainer.setAttribute('data-sort-by', `${sortBy}`)
        listContainer.setAttribute('data-sort-order', `${sortOrder}`)
    }
    // Sort Button : Checks current state and changes to opposing state.
    function changeSortButtonState(target) {
        let state = target.getAttribute('data-button-sort')
        console.log(state);
        if (state === null || state === 'descending') {
            target.setAttribute('data-button-sort', 'ascending')
            morphDown(target)
        } else if (state === 'ascending') {
            target.setAttribute('data-button-sort', 'descending')
            morphUp(target)
        }
        let newState = target.getAttribute('data-button-sort')
        return newState
    }

    //*              DRAG BAR MENU AND WINDOW CONTROLS
    //*________________________________________________________________
    // code for Main MENU top left 
    const menuItemsContainer = document.querySelector('.menu_items')

    // Drag Bar: Listens for menu click and closes if already open
    document.addEventListener('click', (e) => {
        if (e.target.matches('.button_toggle_menu')) {
            menuItemsContainer.classList.toggle('toggle')
        } else {
            menuItemsContainer.classList.remove('toggle')
        }
    })

    // Drag Bar: Window Controls (min,max,close)
    document.querySelector('.app_controls').addEventListener('click', (e) => {
        if (e.target.matches('.minimize_app')) {
            remote.BrowserWindow.getFocusedWindow().minimize();
        } else if (e.target.matches('.exit_app')) {
            remote.BrowserWindow.getFocusedWindow().close();
        } else if (e.target.matches('.maximize_app')) {
            let window = remote.BrowserWindow.getFocusedWindow();
            window.isMaximized() ? window.unmaximize() : window.maximize();
        }
    })

    // Drag Bar : Menu Listeners
    menuItemsContainer.addEventListener('click', (e) => {
        let target = e.target
        if (target.matches('.button_settings')) {
            openSettingsPane()
        } else if (target.matches('.button_new_db')) {
            openNewDBDialog()
        } else if (target.matches('.button_load_db')) {
            openLoadDBDialog()
        }
    })
    // open Settings pane
    function openSettingsPane() {
        document.querySelector('.settings_pane').classList.toggle('opened')
    }
    // create new db
    function openNewDBDialog() {
        let options = {
            title: "Create a New Database",
            buttonLabel: "Create New Database",
            filters: [{
                name: "Data Base File",
                extensions: ["db"]
            }]
        };
        let newDBFilePath = dialog.showSaveDialog(options);
        if (!newDBFilePath) return;
        updateDBPath(newDBFilePath).then((result) => {
            console.log('DataStore and AppSettings Updated');
            replaceTaskDomElements()
        }).catch((err) => {
            console.log('DB Path update Error: ' + err);
        });
    }
    // load existing db
    function openLoadDBDialog() {
        let options = {
            title: "Load Database",
            buttonLabel: "Load Database",
            filters: [{
                name: "Data Base File",
                extensions: ["db"]
            }],
            properties: ["openFile"]
        };

        let newDBFilePath = dialog.showOpenDialog(options);
        if (!newDBFilePath) {
            return;
        } else {
            // note: showOpenDialog returns array, so added [0] to end.
            newDBFilePath = newDBFilePath[0]
        }
        updateDBPath(newDBFilePath).then((result) => {
            replaceTaskDomElements()
        }).catch((err) => {
            console.log('DB Path update Error: ' + err);
        });
    }

    // Confirm and Delete 'Completed Task' older then today.
    document.querySelector('.button_remove_old_completed_task').addEventListener('click', e => {
        selectOldCompletedTask().then((rangeOfDocuments) => {
            ipcRenderer.send('delete-old-completed-task-confirmation', rangeOfDocuments.length)
        }).catch((err) => {
            console.log('DB Function Error: ' + err);
        })
    })
    ipcRenderer.on('delete-old-completed-task-confirmation-reply', (event, reply) => {
        if (reply === 0) {
            console.log('YES WAS SELECTED');
            deleteOldCompletedTask().then((numRemoved) => {
                console.log(`${numRemoved} task deleted`);
            }).catch((err) => {
                console.log('DB Function Error: ' + err);
            })
        } else {
            return
        }
    })

    // update Due Date DATA Attributes (remember to pass in argument as array)
    function updateDueDateDataAttributes(dueDates) {

        sectionAllTask.setAttribute('data-dates-colored', `${appSettings.data.dates_due_change_color}`)

        const currentDate = new Date()
        currentDate.setHours(0, 0, 0, 0)
        for (let i = 0; i < dueDates.length; i++) {
            let dueDate = new Date(dueDates[i].textContent)
            let daysLeft = ((dueDate - currentDate) / 1000) / 86400
            // sets number for sorting purposes
            dueDates[i].setAttribute('data-time-remaining', `${daysLeft}`)
            if (daysLeft < 0) daysLeft = -1
            // sets number for css style purposes 
            dueDates[i].setAttribute('data-color-number', `${daysLeft}`)

        }
        if (dueDates.length === 1) {
            let sortArrow = dueDates[0].closest('.list_container').querySelector('.sortDateArrow')
            morphMiddle(sortArrow)
        }
    }
    
    module.exports = {
        updateDueDateDataAttributes
    }

})();