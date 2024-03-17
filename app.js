const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017', {
   useNewUrlParser: true,
   useUnifiedTopology: true,
});

app.use(express.static(path.join(__dirname, 'public')));
// Define schema for hospital
const hospitalSchema = new mongoose.Schema({
   hospitalName: String,
   state: String,
   district: String,
   city: String,
   phoneNumber: String,
   email: String,
   password: String,
   
});

// Define schema for hospital donor
const donorSchema = new mongoose.Schema({
   firstName: String,
   lastName: String,
   email: String,
   bloodType: String,
   medicalHistory: String,
   password: String,
   state: String,
   city: String,
   district: String,
});

// Create models
const Hospital = mongoose.model('Hospital', hospitalSchema);
const Donor = mongoose.model('Donor', donorSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get('/index', (req, res) => {
   res.sendFile(__dirname + '/index.html');
});

// Handle login requests
app.post('/login', async (req, res) => {
    const { role, email, password } = req.body;

    // Determine the model based on the role
    const Model = role === 'donor' ? Donor : Hospital;

    try {
        // Find user by email
        const user = await Model.findOne({ email });

        if (!user) {
            // User not found
            return res.status(404).send('User not found');
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            // Password doesn't match
            return res.status(401).send('Incorrect password');
        }

        // Authentication successful, redirect to dashboard
        if (role === 'donor') {
            res.redirect(`/donor-dashboard/${user._id}`);
        } else {
            res.redirect(`/hospital-dashboard/${user._id}`);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
});

// Serve registration pages
app.get('/signup/donor', (req, res) => {
   res.sendFile(__dirname + '/signup_donor.html');
});

app.get('/signup/hospital', (req, res) => {
   res.sendFile(__dirname + '/signup_hospital.html');
});

// Handle donor registration
app.post('/signup/donor', async (req, res) => {
   const { firstName, lastName, email, bloodType, medicalHistory, state, district, city, password } = req.body;
   const hashedPassword = await bcrypt.hash(password, 10);

   const donor = new Donor({
       firstName,
       lastName,
       email,
       bloodType,
       medicalHistory,
       state,
       district,
       city,
       password: hashedPassword,
   });

   try {
       await donor.save();
       res.redirect(`/login`);
   } catch (error) { 
       console.error(error);
       res.status(500).send('Error registering hospital donor.');
   }
});

// Handle hospital registration
app.post('/signup/hospital', async (req, res) => {
   const { hospitalName, phoneNumber, email,state,district,city, password } = req.body;
   const hashedPassword = await bcrypt.hash(password, 10);

   const hospital = new Hospital({
       hospitalName,
       phoneNumber,
       email,
       state,
       district,
       city,
       password: hashedPassword,
   });

   try {
       await hospital.save();
       res.redirect(`/login`);
   } catch (error) {
       console.error(error);
       res.status(500).send('Error registering hospital.');
   }
});

// Serve donor dashboard
app.get('/donor-dashboard/:id', async (req, res) => {
   try {
      const donorId = req.params.id;
      const donor = await Donor.findById(donorId);
      if (!donor) {
         return res.status(404).send('Donor not found');
      }
      // Render donor dashboard with donor information
      res.render('donor-dashboard', { donor });
   } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
   }
});

// Serve hospital dashboard
app.get('/hospital-dashboard/:id', async (req, res) => {
   try {
      const hospitalId = req.params.id;
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
         return res.status(404).send('Hospital not found');
      }
      // Render hospital dashboard with hospital information
      res.render('hospital-dashboard', { hospital });
   } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
   }
});

// Serve homepage
app.get('/', (req, res) => {
   res.sendFile(__dirname + '/landing.html');
   
});

// Start server
app.listen(port, () => {
   console.log(`Server is running on port ${port}`);
});
