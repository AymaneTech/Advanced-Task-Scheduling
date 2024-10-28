function assignTasksWithPriorityAndDependencies(developers, tasks) {
    const devs = [...developers];
    const remainingTasks = [...tasks]

    devs.forEach(dev => {
        dev.assignedTasks = [];
        dev.remainingHours = dev.maxHours;
    });

    remainingTasks.sort((a, b) => b.priority - a.priority);

    function areDependenciesMet(task, completedTasks) {
        return task.dependencies.every(dep =>
            completedTasks.some(completed => completed.taskName === dep)
        );
    }

    function calculateSuitabilityScore(dev, task) {
        const skillMatch = Math.max(0, 10 - Math.abs(dev.skillLevel - task.difficulty));
        const typeBonus = dev.preferredTaskType === task.taskType ? 5 : 0;
        const availabilityPenalty = Math.max(0, task.hoursRequired - dev.remainingHours) * 2;

        return skillMatch + typeBonus - availabilityPenalty;
    }

    const completedTasks = [];
    const unassignedTasks = [];
    let previousUnassignedCount = -1;

    while (remainingTasks.length > 0) {
        const availableTasks = remainingTasks.filter(task =>
            areDependenciesMet(task, completedTasks)
        );

        if (availableTasks.length === 0) {
            unassignedTasks.push(...remainingTasks);
            break;
        }

        let taskAssigned = false;

        for (const task of availableTasks) {
            let bestDev = null;
            let bestScore = -Infinity;

            for (const dev of devs) {
                if (dev.remainingHours >= task.hoursRequired) {
                    const score = calculateSuitabilityScore(dev, task);
                    if (score > bestScore) {
                        bestScore = score;
                        bestDev = dev;
                    }
                }
            }

            if (bestDev) {
                bestDev.assignedTasks.push({
                    ...task,
                    assignedHours: task.hoursRequired
                });
                bestDev.remainingHours -= task.hoursRequired;

                completedTasks.push(task);
                const index = remainingTasks.findIndex(t => t.taskName === task.taskName);
                remainingTasks.splice(index, 1);

                taskAssigned = true;
                break;
            }
        }

        if (!taskAssigned) {
            availableTasks.forEach(task => {
                if (!completedTasks.some(t => t.taskName === task.taskName)) {
                    unassignedTasks.push(task);
                    const index = remainingTasks.findIndex(t => t.taskName === task.taskName);
                    remainingTasks.splice(index, 1);
                }
            });
        }

        if (unassignedTasks.length === previousUnassignedCount) {
            unassignedTasks.push(...remainingTasks);
            break;
        }
        previousUnassignedCount = unassignedTasks.length;
    }

    devs.forEach(dev => {
        dev.totalAssignedHours = dev.assignedTasks.reduce((sum, task) =>
            sum + task.assignedHours, 0
        );
        dev.workloadPercentage = Math.round((dev.totalAssignedHours / dev.maxHours) * 100);
    });

    return {
        developers: devs,
        unassignedTasks: unassignedTasks,
        completedTasks: completedTasks
    };
}

function displaySchedulingResults(results) {
    console.log('\nDeveloper Assignments:');
    results.developers.forEach(dev => {
        console.log(`\n${dev.name} (${dev.workloadPercentage}% workload):`);
        console.log(`Total Hours: ${dev.totalAssignedHours}/${dev.maxHours}`);
        dev.assignedTasks.forEach(task => {
            console.log(`- ${task.taskName} (${task.hoursRequired}hrs, Priority: ${task.priority})`);
        });
    });

    if (results.unassignedTasks.length > 0) {
        console.log('\nUnassigned Tasks:');
        results.unassignedTasks.forEach(task => {
            console.log(`- ${task.taskName} (${task.hoursRequired}hrs, Priority: ${task.priority})`);
        });
    }
}

const developers = [
    { name: 'Alice', skillLevel: 7, maxHours: 40, preferredTaskType: 'feature' },
    { name: 'Bob', skillLevel: 9, maxHours: 30, preferredTaskType: 'bug' },
    { name: 'Charlie', skillLevel: 5, maxHours: 35, preferredTaskType: 'refactor' }
];

const tasks = [
    { taskName: 'Feature A', difficulty: 7, hoursRequired: 15, taskType: 'feature', priority: 4, dependencies: [] },
    { taskName: 'Bug Fix B', difficulty: 5, hoursRequired: 10, taskType: 'bug', priority: 5, dependencies: [] },
    { taskName: 'Refactor C', difficulty: 9, hoursRequired: 25, taskType: 'refactor', priority: 3, dependencies: ['Bug Fix B'] },
    { taskName: 'Optimization D', difficulty: 6, hoursRequired: 20, taskType: 'feature', priority: 2, dependencies: [] },
    { taskName: 'Upgrade E', difficulty: 8, hoursRequired: 15, taskType: 'feature', priority: 5, dependencies: ['Feature A'] }
];

const results = assignTasksWithPriorityAndDependencies(developers, tasks);
displaySchedulingResults(results);
