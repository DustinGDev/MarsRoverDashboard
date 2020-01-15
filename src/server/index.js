require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

// your API calls

// example API call
app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`)
            .then(res => res.json())
        res.send({ image })
    } catch (err) {
        console.log('error:', err);
    }
})

// Get the rover manifest data
app.get('/roverData/:rover', async (req, res) => {
    try {
        let manifest = await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${req.params.rover}?api_key=${process.env.API_KEY}`)
            .then(res => res.json())
        res.send({ manifest })
    } catch (err) {
        console.log('error:', err);
    }
})

// Get the corresponding image data
app.get('/photos/:rover/:sol', async (req, res) => {
    try {
        let manifest = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${req.params.rover}/photos?sol=${req.params.sol}&api_key=${process.env.API_KEY}`)
            .then(res => res.json())
        res.send({ manifest })
    } catch (err) {
        console.log('error:', err);
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))