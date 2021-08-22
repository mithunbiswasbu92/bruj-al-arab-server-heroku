const express = require('express');
const bodyParser = require('body-parser');
const admin = require("firebase-admin");
const cors = require('cors')
require('dotenv').config();


const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = process.env.PORT || 5000; 

const serviceAccount = require("./configs/burj-al-arab-41761-firebase-adminsdk-a2pur-9b3270958e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4svir.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookCollection = client.db("burjAlArab2").collection("bookings2");

  app.post('/addBookings', (req, res) => {
    const bookings = req.body;
    bookCollection.insertOne(bookings)
      .then(result => {
        req.send(result.insertedCount > 0);
      })
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1]; 
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email; 
          if(tokenEmail == req.query.email){
            bookCollection.find({email: req.query.email})
            .toArray((err, document) => {
              res.status(200).send(document);
            })
          }
          else{
            res.status(401).send('unauthorize access')
          }
        })
        .catch((error) => { 
          res.status(401).send('unauthorize access')
        });
    }
    else{
      res.status(401).send('unauthorize access')
    }
  
  })

})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)