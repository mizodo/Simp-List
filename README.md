# Simp-List
Task tracking 'to-do' list style electron application with priority levels and due dates.

![Simp-List Logo](https://raw.githubusercontent.com/mizodo/Simp-List/master/assets/icons/win/icon.png)

## Summary

Simp-List is a a simple 'to-do list' style application for tracking **active** and **completed** task.  I made this application because other 'to-do' list applications didn't really give me what I wanted. 

**Simp-List** shows task items with 4 key points of information.
1. **Text Content** describing the task
2. **Due Date** associated with the task. 
3. **Priority Level** of the task.
4. **Main Status**, either Complete or Active. 

## Screenshot
![Simp-List Logo](https://raw.githubusercontent.com/mizodo/Simp-List/master/img/simp_list_screenshot1.JPG)
___
# Application Breakdown
## How to Package
- In 'main.js' line 3, change `developmentEnviroment` to `false`.
- In the terminal, type the command, `npm run package-win` . 
- The app will be written to and available in the 'release-builds' folder. Open it and double click the executable to launch. 
## Application on Initial Load
When application first loads. It searches for an `appSettings.json` file within the user's application folder.  
- If it exist, associated settings are loaded from this file, such as the UI settings and the 'last used database' from the `lastUsedDBPath` key.)
- If it does NOT exist, a 'default' 'appSettings' file is created and saved to the user's application folder location. Default settings include the creation and use of a 'default' database that will be stored in the user's application folder with a simple path name of `db/default_task.db`. 

## Menu Options

The Menu can be accessed from the top left menu bar.  Currently, this menu gives 3 options
- **Load DB File**: Will open a dialog window for the user to select a database from a specific file location.  Once selected, this database will be loaded and displayed in 'Main Window'.  The path for the loaded database will be saved in the `appSettings.json` file under the key `lastUsedDBPath`. 
- **New DB File**: Opens a dialog window for the user to create a new database with their chosen name and directory path.  Once created, an Empty Active and Completed task list will display on the Main Window ready for the user to start adding task.  The newly added database's path will be saved to the `appSettings.json` file under the key `lastUsedDBPath`. 
- **Settings**: Opens an element pane with settings options related to the application. 

### Settings and Options 

1. Task List Side By Side: (Default: false).  If true, the active and completed task will show side by side if there is room within the window. If false, the active and completed task list are stacked vertically. 
2. Due Dates Change Color: (Default: true).  If true, the due dates for each task will be colored depending on how much time remains between the the current date and the due date. If set to false, no colors will be added to the due dates. 
    - Note, if enabled: The Due Date Color scheme follows the same pattern as the item level priority colors.  Although they share the same color pattern, they are independent of the item priority level. The only time they are linked, is when first adding a task within the 'add new task' element. This enables dynamic use of the priority system, for example; a user can set different priority levels for task due on the same day. 
3. Automatically change date based on priority: (Default: true).  This setting only applies to the **add new task** element. If true, the 'new task' due date will change depending on the priority level you select.  If false, this functionality is disabled. This does NOT effect existing task, only the new task being added in the 'add new task' element.  



## Main Window
The main window consist of three main sections.
- The 'Add New Task' section
- Active List of task
- Completed List of task 

### Section 1: Add New Task 
The 'Add New Task' Section consist of a simple input at the top of the page.  When the input is selected, the element will expand revealing a few more options related to the soon to be added task. A new task will consist of 
- **Text Content**: the meat and potatoes for describing the soon to be added task.
- **Priority Level**: A color coded and number based range between 1 and 4 that showcases the level of importance related to the task. (See 'Priority Levels: Explained' section for more details).
- **Due Date**: A date which the task should be complete by. This date will change depending on the priority level selected when adding a new task, but can be edited after selecting a priority level. If you want to edit the due date, make sure to select your priority level first, then edit the date. If the date is edited and then the priority level is changed, the date will recalculate based on the newly selected priority level.  (This only happens during the stage of adding a new item.  Due dates will not be changed when changing the priority level of an already added task item). This feature can be turned off in the settings pane.

### Section 2: Active List
The **Active List** shows all the task which are still pending completion.  Each task item in the active list shows the following items
- Text Content describing the details of the task.
- Color Coded priority level in the top left corner. 
- Due Date in the top right corner.
- A checkbox for marking the task completed.
- An 'X' icon for deleting the task. 

### Section 3: Completed List
The **Completed List** shows the current day's completed task. Each completed task item in this list shows the same elements that task within the 'active list' show, with the main difference being that the text content has a strike-through and the checkbox has a check mark in it. 

## Priority Levels: Explained
The priority level system is simple, it consist of 4 color coded levels from 1 being the most important to 4 being the least important. When adding a new task item, the due date will change according to the standards described in the below table (this can be turned off in the settings).  This is not a strict rule set and only applies when changing the priority level within the 'Add New Task' section.  The due date can be changed if desired.  The 'resolution' time described below is only a baseline.

| Priority | Type      | Resolution |
| -------- | --------- | ---------- |
| P1 <span style="color:red">(red)</span>.| Critical  | 4 hours  |
| P2 <span style="color:yellow">(yellow)</span>.| Important | 24 hours |
| P3 <span style="color:green">(green)</span>.| Normal  | 3 days |
| P4 <span style="color:blue">(blue)</span>| Low  | 5 days  |

The point of the priority level system is to be able to view a group of task and quickly determine what items need attention over others.  The user is free to decide what due dates they wish to set on their task.  Auto changing of due dates based on priority level only occurs when changing the priority level in the 'Add New Task' section.  The date can be changed after the priority level is selected, as well as after an item is added to the list.  Once a task is added, the due date will not change unless the user specifically edits the due date. So, even if an existing items priority level is changed, the due date will remain the same unless the user manually edits the due date.

Task Items are sorted by priority level, with the most important task being listed at the top of the list. Task Items are sorted by priority level upon the below triggers
- loading a new or existing database
- adding a new task item to the list
- manually selecting the 'sort' button in the list header.

note: task can also be sorted by due date. Simply use the right arrow to sort by due date.

note: Task Items within a list will **NOT** be sorted by priority when the user changes the priority level of an existing task item.






