"use strict";

const Router = require("express").Router;
const router = new Router();
const Message = require("../models/message");
const {ensureLoggedIn} = require("../middleware/auth");
const { UnauthorizedError } = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function(req, res) {
    const id = req.params.id;
    const message = await Message.get(id);
    const username = res.locals.user.username;
    
    if(!(username === message.from_user.username || username === message.to_user.username)) {
        throw new UnauthorizedError;
    }
    return res.json({message});
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function(req, res) {
    const from_username = res.locals.user.username;
    const {to_username, body} = res.body;
    
    const message = await Message.create({from_username, to_username, body}); // good to have a trailing comma
    
    return res.json({message})
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async function(req, res) {
    const id = req.params.id;
    const message = await Message.get(id);
    const username = res.locals.user.username;
    
    if(username !== message.to_user.username) {
        throw new UnauthorizedError;
    }
    const readMessage = await Message.markRead(id);
    
    return res.json({message: readMessage})
})


module.exports = router;