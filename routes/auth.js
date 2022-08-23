"use strict";

const User = require("../models/user");

const Router = require("express").Router;
const router = new Router();
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const jwt = require("jsonwebtoken");

/** POST /login: {username, password} => {token} */
router.post("/login", async function(req, res) {
    const {username, password} = req.body;
    
    const authBool = await User.authenticate(username, password);
    
    if(authBool) {
        User.updateLoginTimestamp(username);
        const token = jwt.sign({username}, SECRET_KEY)
        return res.json({token})
    }
    
    throw new UnauthorizedError("Invalid user/password")
})

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
 router.post("/register", async function(req, res) {
    const {username, password, first_name, last_name, phone} = req.body;
    
    const user = await User.register({username, password, first_name, last_name, phone}); // could also just do req.body here
    // DON'T FORGET CURLY BRACKETS! follow the instructions
    
    const token = jwt.sign({username}, SECRET_KEY)

    User.updateLoginTimestamp(username);
    return res.json({token})
    
    //TODO: Do we not need a try catch here for if the registration uses an already used username?
})


module.exports = router;