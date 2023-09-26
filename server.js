const axios = require('axios')
const schedule = require('node-schedule')

const baseurl = "https://caltracker-backend-988509e33b53.herokuapp.com"

/*
map of timezones : exact time to update
switch statement to see if its the current update time for a timezone
for that current timezone, get the timezone name
- create new daily total for all users in that timezone
- delete old daily totals for all users in that timezone
*/
const updateTimes = {
    "18:30:0":["India/New_Delhi"],
    "4:0:0": ["US/New_York"],
    "5:0:0": ["US/Chicago"],
    "6:0:0":  ["US/Denver"],
    "7:0:0": ["US/Los_Angeles"],
    "8:0:0": ["US/Alaska"],
    "10:0:0": ["US/Hawaii"],
    "0:0:0": ["UK/London"],
    "19:13:0": ["Dummy"]
}

const job =  schedule.scheduleJob('* * * * * *', async ()  => {
    const currentUtcTime = new Date()
    const hours = currentUtcTime.getUTCHours();
    const minutes = currentUtcTime.getUTCMinutes();
    const seconds = currentUtcTime.getUTCSeconds();
    const timeString = `${hours}:${minutes}:${seconds}`;
    console.log(timeString);
    if (timeString in updateTimes) {
        for (const val of updateTimes[timeString]) {
            console.log("timezone: " + val)
            const queryParams = {
                timezone: val
            }
            axios.get(baseurl + '/users/timezone', {
                params: queryParams
            }).then((response) => {
                const res = response.data;
                for (let i = 0; i < res.length; i++) {
                    console.log("updating values for: ")
                    console.log(res[i])
                    axios.post(baseurl + '/dailytotals', {
                        user_id: res[i]['user_id']
                    })
                    .then((r) => {
                        console.log(`added new total, need to delete ID ${res[i]['user_id']}`)
                        const deleteQPs = {
                            user_id: res[i]['user_id']
                        }
                        const customAxios = axios.create({
                            method: 'delete',
                            baseURL: baseurl + "/dailytotals",
                            params: deleteQPs
                        })
                        customAxios()
                            .then((deleteRes) => {
                                console.log(deleteRes.data)
                            })
                            .catch((err) => {
                                console.error(err)
                            })
                    })
                    .catch((err) => {
                        console.error(err)
                    })
                }
            })
        }
    }
    // const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
})