//npm install ----> passport,passport-local,passport-local-mongoose,expresssession
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session'); /// this is use to start a session
const passport = require("passport"); ///this is use to use the passport to authenticate
const passportLocalMongoose = require("passport-local-mongoose"); ///this is used to to save users to the mongoose
const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
mongoose.connect("mongodb+srv://admin-jmbp:Ha1ns2i345@@cluster0.9tchm.mongodb.net/userDB?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});
mongoose.set("useCreateIndex", true);
app.use(session({
    secret: 'Our little Secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 100 * 365 * 5000
    }
}));
app.use(passport.initialize());
app.use(passport.session());
///------------------------------------------
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    secrets:[String],
});
userSchema.plugin(passportLocalMongoose);
///---------------------------------------------------
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect("/secrets");
    } else {
        res.render("home");
    }
})
app.get("/register", function (req, res) {
    res.render("register", {});
})
app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        User.find({ secrets: { $exists: true, $not: {$size: 0} } }, function(err,foundUsers){
            if(err){
                console.log(err);
            }
            else{
                ////
                const secrets =  [];
                foundUsers.forEach(function(user){
                    user.secrets.forEach(function(secret){
                        secrets.push(secret);
                    })
                })
                res.render("secrets",{secrets:secrets});
            }
        })
    } else {
        res.redirect("/login");
    }
})
app.post("/register", function (req, res) {
    User.register({
        username: req.body.username
    }, req.body.password, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })
})
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
})
app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
       res.render("submit");
    } else {
       res.render("home",{});
    }
})
app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                foundUser.secrets.push(submittedSecret);
                foundUser.save(function(){
                    res.redirect("/secrets");
                })
            }
        }

    })
})
app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, function (err) {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })
})
app.get("/login", function (req, res) {
    res.render("login", {})
})
app.listen(process.env.PORT || 3000, function () {
    console.log("Server is Up and Running on port 3000!");
});