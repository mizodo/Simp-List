(function () {

    //* custom modules
    const {
        updateDocument,
    } = require('../js/dbControls')
    const {
        updateDueDateDataAttributes
    } = require("../renderer/mainWindow")
    //* variables for datePicker
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    const datePicker = document.querySelector('.date_picker');
    const dpMonth = datePicker.querySelector('h1>.month')
    const dpYear = datePicker.querySelector('h1>.year')
    const dpTableBody = datePicker.querySelector('tbody')

    let dateObject = new Date()
    let currentMonth = dateObject.getMonth()
    let currentYear = dateObject.getFullYear()

    //* Main createCalendar Function for creating the calendar. 
    //*_______________________________________________________
    function createCalendar(month, year) {
        //insert current Month into H1
        dpMonth.textContent = months[month]
        dpYear.textContent = year
        // getting start day of month
        let firstDay = (new Date(year, month)).getDay()
        //clear table body
        dpTableBody.innerHTML = ""
        // creating all cells
        let date = 1;
        for (let i = 0; i < 6; i++) {
            let row = document.createElement('tr')
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDay) {
                    cell = document.createElement('td')
                    cellText = document.createTextNode("")
                    cell.appendChild(cellText)
                    row.appendChild(cell)
                } else if (date > daysInMonth(month, year)) {
                    break;
                } else {
                    cell = document.createElement('td')
                    cellText = document.createTextNode(date)
                    cell.appendChild(cellText)
                    row.appendChild(cell)
                    date++;
                }
            }
            dpTableBody.appendChild(row)
        }
    }

    //check how many days in month
    function daysInMonth(iMonth, iYear) {
        return 32 - new Date(iYear, iMonth, 32).getDate()
    }

    // listen for click on NEXT, PREV, or DATE CELL
    datePicker.addEventListener('click', (e) => {
        if (e.target.matches('.prev_month')) {
            currentYear = (currentMonth === 0) ? currentYear - 1 : currentYear;
            currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
            createCalendar(currentMonth, currentYear);
        } else if (e.target.matches('.next_month')) {
            currentYear = (currentMonth === 11) ? currentYear + 1 : currentYear;
            currentMonth = (currentMonth + 1) % 12;
            createCalendar(currentMonth, currentYear);
        } else if (e.target.matches('td')) {
            changeDueDate(e.target)
        }
    })

    //* additional datePicker related Code
    //*_________________________________________

    const hiddenElement = document.querySelector('.hidden_element')
    const allTask = document.querySelector('.section_all_task')
    const addNewItemContainer = document.querySelector('.add_new_item_container');
    const newItemDueDate = document.querySelector('.new_item_due_date')

    //* change task item due date 
    function changeDueDate(selectedDate) {
        let newDueDate = returnDateSelected(selectedDate)

        if (selectedDate.closest('.task_item')) {
            let listItem = selectedDate.closest('.task_item')
            let dateDueElement = listItem.querySelector('.date_due')
            if(dateDueElement.textContent===newDueDate.toLocaleDateString()){
                console.log('No Change, function RETURNED');
                hiddenElement.appendChild(datePicker)
                return
            }
            updateDocument('dates.due', listItem, newDueDate).then((result) => {
                    dateDueElement.textContent = newDueDate.toLocaleDateString()
                    hiddenElement.appendChild(datePicker)
                })
                .then(() => {
                        updateDueDateDataAttributes([dateDueElement])
                })
                .catch((err) => {
                    console.log('Update Document Date Error: ' + err);
                })
            // else change due date for 'add new task' element
        } else if (selectedDate.closest('.main_header')) {
            newItemDueDate.value = newDueDate.toLocaleDateString()
            hiddenElement.appendChild(datePicker)
        }
    }
    
    //* Return date as date object
    function returnDateSelected(selectedDate) {
        let month = datePicker.querySelector('.month').textContent
        let year = datePicker.querySelector('.year').textContent
        let formattedDate = `${month}/${selectedDate.textContent}/${year}`
        return new Date(formattedDate)
    }

    //* Open/Append datePicker element.
    allTask.addEventListener('click', (e) => {
        if (e.target.matches('.date_due')) {
            let currentDateDue = new Date(e.target.textContent)
            currentMonth = currentDateDue.getMonth()
            currentYear = currentDateDue.getFullYear()
            let currentDateNumber = currentDateDue.getDate()
            let dueDateParent = e.target.parentElement
            console.log(dueDateParent);
            createCalendar(currentMonth, currentYear)
            dueDateParent.appendChild(datePicker)
            highlightCurrentDate(currentDateNumber)
        }
    })
    //* hides datePicker if clicked outside of datePicker or .date_due element
    document.addEventListener('click', (e) => {
        if (e.target.matches('.date_due') || e.target.closest('.date_picker')) return
        if (datePicker.parentElement.matches('.date_due_wrap'))
            hiddenElement.appendChild(datePicker)
    })

    //* highlights items current due date on datePicker calendar 
    function highlightCurrentDate(currentDateNumber) {
        let allDays = datePicker.querySelectorAll('td')
        let selectedDay = datePicker.querySelector('.selected')
        if (selectedDay) {
            selectedDay.classList.remove('selected')
        }
        for (let i = 0; i < allDays.length; i++) {
            if (allDays[i].textContent == currentDateNumber) {
                allDays[i].classList.add('selected')
            } else {
                console.log('not found');
            }
        }
    }

    //* Date Picker code for 'Add New Task' Section 
    const aboveNewItemContainer = document.querySelector('.area_for_date_picker');
    addNewItemContainer.addEventListener('click', e => {
        let target = e.target
        if (target.matches('.new_item_due_date')) {
            let currentDateDue = new Date(target.value)
            currentMonth = currentDateDue.getMonth()
            currentYear = currentDateDue.getFullYear()
            let currentDateNumber = currentDateDue.getDate()
            createCalendar(currentMonth, currentYear)

            aboveNewItemContainer.appendChild(datePicker)
            highlightCurrentDate(currentDateNumber)
        }
    })
   
})();