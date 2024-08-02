export function adjustBoard(board) {
    function getRandomColor() {
        const colors = [
            'rgb(3, 127, 76)',
            'rgb(0, 200, 117)',
            'rgb(156, 211, 38)',
            'rgb(202, 182, 65)',
            'rgb(255, 203, 0)',
            'rgb(120, 75, 209)',
            'rgb(157, 80, 221)',
            'rgb(0, 126, 181)',
            'rgb(87, 155, 252)',
            'rgb(102, 204, 255)',
            'rgb(187, 51, 84)',
            'rgb(223, 47, 74)',
            'rgb(255, 0, 127)',
            'rgb(255, 90, 196)',
            'rgb(255, 100, 46)',
            'rgb(127, 83, 71)',
            'rgb(196, 196, 196)',
            'rgb(117, 117, 117)',
        ]
        const randomIndex = Math.floor(Math.random() * colors.length)
        return colors[randomIndex]
    }

    function makeId() {
        return '_' + Math.random().toString(36).substr(2, 9)
    }

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)]
    }

    function getRandomDate(start, end) {
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
        return date.toISOString().split('T')[0]
    }

    const statuses = ['Not started']
    const priorities = ['Low', 'Medium', 'High', 'Critical']
    const startDate = new Date()
    const endDate = new Date()
    endDate.setFullYear(startDate.getFullYear() + 1)

    board.activities = board.activities || []
    board.archivedAt = null
    board.isStarred = true
    board.label = 'task'
    board.cmpsOrder = ['checkbox', 'title', 'memberIds', 'status', 'priority', 'dueDate', 'recording', 'description']
    board.members = board.members || []

    if (board.groups && Array.isArray(board.groups)) {
        board.groups.forEach(group => {
            group.archivedAt = null
            group._id = makeId()
            group.tasks = group.tasks || []
            group.title = group.title || 'Group'
            group.style = group.style || {}
            group.style.backgroundColor = getRandomColor()
            group.tasks.forEach(task => {
                task.archivedAt = null
                task._id = makeId()
                task.comments = task.comments || []
                task.checklists = task.checklists || []
                task.memberIds = task.memberIds || []
                task.priority = getRandomElement(priorities)
                task.status = getRandomElement(statuses)
                task.dueDate = getRandomDate(startDate, endDate)
                task.byMember = null
            })
        })
    }

    return board
}
