const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId, Collection } = require('mongodb');
const port = process.env.PORT || 8000;

require('dotenv').config();
const jwt =require('jsonwebtoken');
const cors = require('cors');


app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ebocqiq.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader =req.headers.authorization;
    if(!authHeader){
      return res.status(401).send('unauthorization access')
    }
    const token= authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, docoded){
      if(err){
        return res.status(403).send({message: 'forbidden access'})
      }
      req.docoded=docoded;
      next();
    })
  }



async function  run() {
   try{
    const categoryCollection= client.db('assianmentCollection').collection('categorie');
    const productCollection= client.db('assianmentCollection').collection('product');
    const bookingCollection= client.db('assianmentCollection').collection('booking');
    const usersCollection=client.db('assianmentCollection').collection('users');

    app.get('/category', async(req, res)=>{
        const query={};
        const result = await categoryCollection.find(query).toArray();
        res.send(result)
    })

    // ..........Product Collection..........

    app.post('/product', async(req, res)=>{
        const product=req.body;
        const result= await productCollection.insertOne(product)
        res.send({...result, ...req.body})
    })
    app.get('/product', async(req, res)=>{
       const query={}
        const name = await productCollection.find(query).toArray();
        res.send(name)
    })
    app.get('/product/:brand', async(req, res)=>{
        const brand = req.params.brand;
        const query={brand}
        const result = await productCollection.find(query).toArray()
        res.send(result)
    })

    // ............Booking Collection..........

    app.post('/booking', async(req, res)=>{
        const booking= req.body;
        const result= await bookingCollection.insertOne(booking);
        res.send(result)
    });
    app.get('/booking', verifyJWT, async(req, res)=>{
        const email= req.query.email;
        const docodedEmail = req.docoded.email;
        if(email !==docodedEmail){
          return res.status(403).send({message: 'forbidden access'})
        }
        const query = {email: email};
        const result= await bookingCollection.find(query).toArray();
        res.send(result)
    })

    // ...............User Collection......................

    app.post('/users', async(req, res)=>{
        const users= req.body;
        const result= await usersCollection.insertOne(users);
        res.send(result)
    })


    // .........JSON Web Token................

    app.get('/jwt', async(req, res)=>{
        const email= req.query.email;
        const query={email:email};
        const users= await usersCollection.findOne(query);
        if(users){
            const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1d'});
            return res.send({accessToken: token})
        }
        console.log(users)
        res.status(403).send({accessToken: ""})
    })
   } 
   finally{
    
   }
}
run().catch(error=>console.log(error))

app.get('/', (req, res)=>{
    res.send('assianment 12 is runnuing')
})










app.listen(port, ()=>{
    console.log(`assianment is running ${port}`)
})