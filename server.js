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
  "9:0:0": ["US/Alaska"],
  "12:0:0": ["US/Hawaii"],
  "0:0:0": ["UK/London"],
};

// add logic for daylight savings stuff

function timeIsClose(hours, minutes) {
  for (const key in updateTimes) {
    const val = updateTimes[key];
    const [mapHour, mapMin] = key.split(':').map(Number);
    if (mapHour === hours && mapMin === minutes) {
      return val;
    }
  }
  return null;
}

app.get('/main', async (req, res) => {
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