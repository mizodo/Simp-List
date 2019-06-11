(function () {
    let newTaskDocument = {

        text_content: '',
        dates: {
            created: new Date(),
            due: '',
            completed: null,
            deleted: null,
        },
        status: {
            complete: false,
            sub: 'in progress'
        },
        priority: ''

    }
    module.exports = newTaskDocument
})();