const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

const app = express()
dotenv.config()
const port = process.env.PORT

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.get('/health', (req, res) => {
    res.status(200).send('OK')
})

function startServer() {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`)
    })
}

startServer()