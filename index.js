const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId, Collection } = require('mongodb');
const port = process.env.PORT || 8000;

require('dotenv').config();
const jwt =require('jsonwebtoken');
const cors = require('cors');
const stripe = require("stripe")(process.env.SECRET_KEY);


app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ebocqiq.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    console.log('token insert verifyJWT', req.headers.authorization)
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
    const paymentsCollection = client.db('assianmentCollection').collection('payments');

    const verifyAdmin=(req, res, next)=>{
      next()
    }
    const verifySaller=(req, res, next)=>{
      next()
    }
    app.get('/category', async(req, res)=>{
        const query={};
        const result = await categoryCollection.find(query).toArray();
        res.send(result)
    })

    // ..........Product Collection..........

    app.post('/product',verifyJWT, verifyAdmin, verifySaller, async(req, res)=>{
        const product=req.body;
        const result= await productCollection.insertOne(product)
        res.send({...result, ...req.body})
    })
    app.get('/product',  async(req, res)=>{
      let query = {}
      if(req.query.email){
        query={
            email: req.query.email
        }
      }
      console.log(query)
      const cursor = productCollection.find(query);
      const orders = await cursor.toArray();
      console.log(orders)
      res.send(orders)
    })


    app.get('/product/:brand', verifyAdmin, verifySaller, async(req, res)=>{
        const brand = req.params.brand;
        const query={brand}
        const result = await productCollection.find(query).toArray()
        res.send(result)
    })

    app.delete('/product/:id', verifyAdmin, verifySaller, async(req, res)=>{
        const id = req.params.id;
        const filter = {_id:ObjectId(id)}
        const result = await productCollection.deleteOne(filter)
        res.send(result)
      })
    // ............Booking Collection..........

    app.post('/booking', async(req, res)=>{
        const booking= req.body;
        const result= await bookingCollection.insertOne(booking);
        res.send(result)
    });

  

    app.get('/booking/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const result = await bookingCollection.findOne(query);
      res.send(result)
    })
 
  

    app.get('/booking',  async(req, res)=>{


        let query = {}
        if(req.query.email){
          query={
              email: req.query.email
          }
        }
        console.log(query)
        const cursor = bookingCollection.find(query);
        const orders = await cursor.toArray();
        console.log(orders)
        res.send(orders)
      })
    // ...............User Collection......................

    app.post('/users', async(req, res)=>{
        const users= req.body;
        const result= await usersCollection.insertOne(users);
        res.send(result)
    })

    app.get('/users', async(req, res)=>{
        const query={};
        const result = await usersCollection.find(query).toArray();
        res.send(result)
    })

    app.delete('/users/:id', verifyAdmin, async(req, res)=>{
      const id = req.params.id;
      const filter = {_id:ObjectId(id)}
      const result = await usersCollection.deleteOne(filter)
      res.send({...result,...req.body})
    })
    // .........JSON Web Token................

    app.get('/jwt', async(req, res)=>{
        const email = req.query.email;
        const query ={email:email};
        const user = await usersCollection.findOne(query);
        if(user){
          const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '365d'});
          return res.send({accessToken: token})
        }
        console.log(user)
        res.status(401).send({accessToken: ''})
      })

    //   .........Admin Collection...........

    app.put('/users/admin/:id',verifyJWT, verifyAdmin, async(req, res)=>{
        const id = req.params.id;
        const filter = {_id:ObjectId(id)};
        const options = { upsert: true };
        const updateDos ={
          $set: {
            role: 'admin'
          }
        }
        const result= await usersCollection.updateOne(filter, updateDos,options);
        res.send(result)
      })


    app.put('/users/verified/:id',verifyJWT, verifySaller, async(req, res)=>{
        const id = req.params.id;
        const filter = {_id:ObjectId(id)};
        const options = { upsert: true };
        const updateDos ={
          $set: {
            isVerified: 'verified'
          }
        }
        const result= await usersCollection.updateOne(filter, updateDos,options);
        res.send(result)
      })

      
  app.get('/users/admin/:email', async(req, res)=>{
    const email = req.params.email;
    const query = {email};
    const user = await usersCollection.findOne(query);
    res.send({isAdmin: user?.role==='admin'})
  })


  app.post('/create-payment-intent', async(req, res)=>{
    const booking= req.body;
    const price= booking.price;
    const amount = parseFloat(price *100);
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount: amount,
      "payment_method_types": [
        "card"
      ],
    })
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  })

  app.post('/payments', async(req, res)=>{
    const payments= req.body;
    const result = await paymentsCollection.insertOne(payments);
    const id = payments.bookingId;
    const filter={_id:ObjectId(id)};
    const updateDos={
       $set:{
        paid: true,
        transactionId:payments.transactionId
       }
    }
    const updateResult= await bookingCollection.updateOne(filter, updateDos)
    res.send(result)
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