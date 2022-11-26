const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 8000;

require('dotenv').config();
const cors = require('cors');


app.use(cors())
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ebocqiq.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function  run() {
   try{
    const categoryCollection= client.db('assianmentCollection').collection('categorie');
    const productCollection= client.db('assianmentCollection').collection('product');

    app.get('/category', async(req, res)=>{
        const query={};
        const result = await categoryCollection.find(query).toArray();
        res.send(result)
    })
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