const axios = require('axios')
const schedule = require('node-schedule')
const job = schedule.scheduleJob('30 * * * *', () => {
    console.log("Running task every 30 min")
})

