require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const { processDocuments } = require('../lib/chat.js'); 
const key_map = require('../lib/config');
const Email = require('../lib/contact');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});


app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    console.log(name, email, message);
  
    try {
        const response = await Email.sendEmail(name, email, message);
        console.log('Email sent successfully:', response);
        
        res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        

        res.status(500).json({ success: false, message: 'Error sending email' });
    }
});


app.post('/api/chat', async (req, res) => {
    const userInput = req.body.input;
    console.log(userInput);
    try {
        const response = await processDocuments(userInput);
        res.json({ success: true, response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


module.exports = app;
