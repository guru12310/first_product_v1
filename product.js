const express = require('express')
// const cors = require('cors')
// require('dotenv').config();
const path = require('path');

const app = express()
const port = 4000

// app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.set('ngrok-skip-browser-warning', 'true');
  next();
});

const authRoute = require('./routers/auth_Router')
const igRoute = require('./routers/ig_Router')
const mediaRoute = require('./routers/media_Router')
const igTestPostRoutes = require('./routers/test_router');


app.use(
  '/tmp_uploads',
  express.static(path.join(process.cwd(), 'tmp_uploads'))
);

app.get("/", (req, res) => {
  res.send("API running 🚀");
});


app.use('/test', igTestPostRoutes);


app.use('/auth',authRoute)
app.use('/api',igRoute)
// app.use('/media',mediaRoute)




app.listen(port,()=>{
    console.log("Server is Start Running ijn 4000")
})