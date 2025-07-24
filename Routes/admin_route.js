// Route File For Admin Module
/* Basically It has the paths to tell the request to which it can get the informtaion like for register admin it 
will tell the request that which controller can do the task */

const express = require('express');
const {body} = require('express-validator');
const {registerAdmin} = require('../controller/admin_controller');

const router = express.Router();

router.post('/register',
    [
        body('name').notEmpty().withMessage('Name is Required'),
        body('email').isEmail().withMessage('Enter a Valid Email'),
        body('password').isLength({min:8}).withMessage("Password Must be at least 8 characters")
    ],
    registerAdmin
);
module.exports = router;

