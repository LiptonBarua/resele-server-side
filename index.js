const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

require('dotenv').config();
const cors = require('cors');


app.use(cors())
app.use(express.json());

app.get('/', (req, res)=>{
    res.send('assianment 12 is runnuing')
})

app.listen(port, ()=>{
    console.log(`assianment is running ${port}`)
})