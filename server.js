const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });


const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.PASSWORD);
mongoose.connect(DB,{
}).then(()=>console.log('DataBase Connected Successfully!')).catch((err)=>console.log(`DataBase Failed! ERROR:${err}`));


const port = process.env.PORT || 8000;
app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});

