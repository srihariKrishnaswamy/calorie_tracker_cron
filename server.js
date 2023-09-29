const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Require the 'cors' package
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080; // Use the specified PORT or default to 3000

app.use(cors());
app.use(express.json());

const baseurl = process.env.APIURL;

const updateTimes = {
  "18:30:0": ["India/New_Delhi"],
  "4:0:0": ["US/New_York"],
  "5:0:0": ["US/Chicago"],
  "6:0:0": ["US/Denver"],
  "7:0:0": ["US/Los_Angeles"],
  "8:0:0": ["US/Alaska"],
  "10:0:0": ["US/Hawaii"],
  "0:0:0": ["UK/London"],
};

function timeIsClose(hours, minutes) {
    for (const val of updateTimes) {   
      var mapHour = "";
      var mapMin = ""
      var i = 0;
      while (val[i] !== ":") {
        mapHour += val[i]
        i ++;
      }
      i ++;
      while (val[i] !== ":") {
        mapMin += val[i]
        i ++;
      }
      if ((parseInt(mapHour) === (hours + 1) % 24 && parseInt(mapMin) === minutes) || 
        (parseInt(mapMin) === 30 && parseInt(mapHour) === hours && parseInt(mapMin) === minutes)) {
        return updateTimes[val]
      }
    }
    return null;
}

app.get('/main', async (req, res) => {
  // insert 2 second countdown here
  await new Promise(resolve => setTimeout(resolve, 2000));
  const currentUtcTime = new Date();
  const hours = currentUtcTime.getUTCHours();
  const minutes = currentUtcTime.getUTCMinutes();
  const seconds = currentUtcTime.getUTCSeconds();
  const timeString = `${hours}:${minutes}:${seconds}`;
  console.log(timeString);
  const timezones = timeIsClose(parseInt(hours), parseInt(minutes))
  if (timezones) {
    for (const val of timezones) {
      console.log("timezone: " + val);
      const queryParams = {
        timezone: val,
      };
      
      try {
        const response = await axios.get(baseurl + '/users/timezone', {
          params: queryParams,
        });
        const resData = response.data;
        
        for (let i = 0; i < resData.length; i++) {
          console.log(`updating values for: ${resData[i].user_id}`);
          
          try {
            await axios.post(baseurl + '/dailytotals', {
              user_id: resData[i].user_id,
            });
            
            const deleteQPs = {
              user_id: resData[i].user_id,
            };
            
            const customAxios = axios.create({
              method: 'delete',
              baseURL: baseurl + '/dailytotals',
              params: deleteQPs,
            });
            
            try {
              const deleteRes = await customAxios();
              console.log(deleteRes.data);
            } catch (err) {
              console.error(err);
              res.status(400).json({message: "Error deleting"})
            }
          } catch (err) {
            console.error(err);
            res.status(400).json({message: "Error creating totals"})
          }
        }
      } catch (err) {
        console.error(err);
        res.status(400).json({message: "Error getting users"})
      }
    }
  }
  res.status(200).json({message: "CRON job completed."});
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
