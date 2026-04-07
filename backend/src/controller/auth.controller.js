const isProduction = process.env.NODE_ENV === "production";
const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require("../models/blacklist.model")

async function registerUserController(req, res){
const  {username, email, password} = req.body;

if(!username || !email || !password){
    return res.status(400).json({message: "all fields are required"});  
}
const isUserAlreadyExists = await userModel.findOne({
    $or: [{ username}, {email}]
})

if(isUserAlreadyExists){
    return res.status(400).json({message: "user already exists with this username or email"});  
}

const hash  = await bcrypt.hash(password, 10);

const user = await userModel.create({
    username, 
    email, 
    password: hash
})

const token = jwt.sign(
    { id: user._id, username: user.username},
    process.env.JWT_SECRET,
    {expiresIn: "1d"}

)
res.cookie("token", token, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
});
res.status(201).json({message: "user registered successfully", 
    user: {
        id: user._id,
        username: user.username,
        email: user.email
    }
}
)           
}

async function loginUserController(req, res){
const { email, password } = req.body || {};if (!email || !password) {
    return res.status(400).json({
        message: "Email and password are required"
    });
}

    
   const user = await userModel.findOne({ email })

   if(!user){
    return res.status(400).json({message: "invalid email or password"});
   }
   
   const isPasswordValid = await bcrypt.compare(password, user.password)

   if(!isPasswordValid){
    return res.status(400).json({
        message: "Invalid email or password"
    })
   }
const token = jwt.sign(
    { id: user._id, username: user.username},
    process.env.JWT_SECRET,
    {expiresIn: "1d"}

)
res.cookie("token", token, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
});
res.status(200).json({
    message: "user loggedIn successfully.", 
    user: {
        id:user._id,
        username: user.username,
        email: user.email
    }
})


}

async function logoutUserController(req, res) {
    const token = req.cookies.token

if(token) {
    await tokenBlacklistModel.create({token})

}
res.clearCookie("token")
res.status(200).json({
    message: "user logged out successfully"
})
}
 
async function getMeController(req, res){
    if(!req.user){
        return res.status(401).json({ message: "User not authenticated" });
    }

    const user = await userModel.findById(req.user.id);

    if(!user){
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
        message:"user details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}
module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}    