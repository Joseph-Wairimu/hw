const express= require('express');
const cors=require('cors');
const bp=require('body-parser');
const mongoose = require('mongoose');
const {connect} =require('mongoose');
const  {success,error}=require('consola');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {DB} =require('./config');
// Set up a Mongoose model for the user
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

const messageSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
});
const advisorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  student_id: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Advisor = mongoose.model('Advisor', advisorSchema);
// Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
// initialize app
const app =express();

//middlewares
app.use(cors());
app.use(bp.json());

// create a route for registration
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  // validate email and password
  if (!email || !password) {
    return res.status(400).send({ error: 'Email and password are required' });
  }
  try {
    // check if a user with the given email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).send({ error: 'A user with this email already exists' });
    }
    // hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    // create a new user in the database
    const user = new User({ email, password: hashedPassword });
    await user.save();
  
    return res.status(201).json({
        message:"Successfully registered. Please login.",
        success:true
       });
       
  } catch (error) {
    res.status(500).send({ error: 'Error saving user to database' });
  }
});

// create a route for login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // check if email and password are correct
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }
    // compare the hashed password stored in the database with the given password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send({ error: 'Invalid email or password' });
    }
    // if correct, return a JSON web token (JWT) to the client
    const token = jwt.sign({ userId: user._id }, 'my_secret_key');
     let result={
         email:user.email,
         password:user.password,
         token:`Bearer ${token}`,
     };
     return res.status(200).json({
         ...result,
         message:"Successfully logged in.",
         success:true
       });

  } catch (error) {
    res.status(500).send({ error: 'Error logging in' });
  }
});
// create a route for the message
app.post('/message', async (req, res) => {
  // check if user is authenticated
  try {
    // get the authorization header from the request
    const authHeader = req.headers.authorization;
    // check if the authorization header is present
    if (!authHeader) {
      return res.status(401).send({ error: 'No authorization header provided' });
    }
    // extract the JWT from the authorization header
    const token = authHeader.split(' ')[1];
    // verify the JWT and get the user id
    const { userId } = jwt.verify(token, 'my_secret_key');
    // check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).send({ error: 'Invalid user' });
    }
    // create a new message in the database
    const { email, phone, message } = req.body;
    const newMessage = new Message({ email, phone, message });
    await newMessage.save();

    return res.status(201).json({
      message: 'Successfully added message to the database',
      success: true
    });
  } catch (error) {
    res.status(403).send({ error: 'Error verifying JWT or adding message to the database' });
  }
});

// create a route for the advisor
app.post('/advisor', async (req, res) => {
  // check if user is authenticated
  try {
    // get the authorization header from the request
    const authHeader = req.headers.authorization;
    // check if the authorization header is present
    if (!authHeader) {
      return res.status(401).send({ error: 'No authorization header provided' });
    }
    // extract the JWT from the authorization header
    const token = authHeader.split(' ')[1];
    // verify the JWT and get the user id
    const { userId } = jwt.verify(token, 'my_secret_key');
    // check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).send({ error: 'Invalid user' });
    }
    // create a new advisor in the database
    const { name, student_id, date } = req.body;
    const newAdvisor = new Advisor({ name, student_id, date });
    await newAdvisor.save();

    return res.status(201).json({
      message: 'Successfully added advisor to the database',
      success: true
    });
  } catch (error) {
    res.status(403).send({ error: 'Error verifying JWT or adding advisor to the database' });
  }
});

// // Replace <db_user> and <db_password> with your own MongoDB Atlas database user and password
// const uri = `mongodb://localhost:27017/weparty`;

const startApp= async()=>{
    try{
     await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>success({
         message:`successfully connected to Database `, badge:true
     })
     )
      //start listening for the server
    app.listen(3000,()=>
     success({message:`server started on PORT 3000`, badge:true})
     );
    }catch(err){
    error({
            message:`Unable to connected to Database \n${err}`, badge:true
        });
        startApp();
}    
 };
 
 startApp();