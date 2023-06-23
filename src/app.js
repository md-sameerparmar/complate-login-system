require('dotenv').config();
const express = require('express');
const hbs = require('hbs');
require('./db/connection')
const User = require('./models/users')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const auth = require('./middleware/auth');
const app = express(); 

app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({extended: false}));

app.use(express.static('./public'));
app.set('view engine', 'hbs');
app.set("views", './templates/views')
hbs.registerPartials('./templates/partials');

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/secret", auth, (req, res) => {
    // console.log('Cookies: ', req.cookies);
    res.render("secret")
})

app.get("/logout", auth, async (req, res) => {
    try {

        req.user.tokens = req.user.tokens.filter((currentElements) => {
            return currentElements.token != req.token
        })
        
        res.clearCookie("jwt");
        await req.user.save();
        res.render("login");
    } catch (error) {
        res.status(500).send(error)
    }
})

app.get("/register", (req, res) => {
    res.render("registration")
})

app.post("/register", async (req, res) => {
    try {

        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;

        const hashPassword = await bcrypt.hash(password, 10);

        const registerUser = new User({
            name,
            email,
            password: hashPassword,
        })

        const token = await registerUser.generateAuthToken();
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 30000),
            httpOnly: true,
        });

        await registerUser.save();
        res.status(201).render('index');
      
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
    
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const user = await User.findOne({email});
        const passwordMatch = await bcrypt.compare(password, user.password);

        const token = await user.generateAuthToken();
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 600000),
            httpOnly: true,
        });

        if (passwordMatch) {
            res.status(200).render('index')
        } else (
            res.status(400).send('Invalid credential')
        )
    } catch (error) {
        console.log(error);
        res.status(400).send('Invalid credential');
    }
})

app.get("/*", (req, res) => {
    res.render("404")
})


const port = process.env.PORT || 8081;
app.listen(port, () =>{
    console.log(`App is listening on http://localhost:${port}`);
})