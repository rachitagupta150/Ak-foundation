const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

app.post('/make-call', async (req, res) => {
  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Recipient number (to) is required' });
  }

  try {
    const call = await client.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to,
      from: '+14433411763', // Your Twilio number
    });

    res.json({ sid: call.sid });
  } catch (error) {
    console.error('Error making call:', error.message);
    res.status(500).json({ error: 'Failed to make call' });
  }
});

app.get('/call-status/:sid', async (req, res) => {
  const { sid } = req.params;

  console.log(`Checking status for SID: ${sid}`);

  try {
    const call = await client.calls(sid).fetch();
    console.log(`Call status: ${call.status}`);
    res.json({ status: call.status });
  } catch (error) {
    console.error('Error fetching call status:', error.message);
    res.status(500).json({ error: 'Failed to fetch call status' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
