const {validationResult} =require("express-validator");
const Admin = require('../models/admin_model');

exports.registerAdmin = async (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    try {
        const {name,email,password} = req.body;
        const existingAdmin = await Admin.findOne({email});
        if (existingAdmin){
            return res.status(400).json({message:"Email Already Exist"});
    }
    const newadmin = new Admin({name,email,password});
    await newadmin.save();
    res.status(201).json({message:"Admin Registered Succesfully"});
    }
    catch (err){
        console.log(err)
        res.status(500).json({message:"Server Error"});
    }

};