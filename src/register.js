require('dotenv').config();
const validator = require('validator');
const mongoose = require('mongoose');
require('mongoose-double')(mongoose);
const bcrypt = require('bcryptjs');
const conn = require("./db/conn");
const jwt = require("jsonwebtoken");

let SchemaTypes = mongoose.Schema.Types;

const newUserSchema = new mongoose.Schema ({

    user : {
      type : String,
      required : true,
    },
    password : {
      type : String,
      required : true
    },
    inv : {
      type : Number,
      default : 0
    },
    members : {
      type  : Number,
      default : 0
    },
    parent : {
      type : Number,
      default : 0
    },
    balance : {
      type : Number,
      default : 0
    },
    phone : {
      type : Number,
      required : true,
      default : 0
    },
    bet : {
      type : Number,
      default : 0
    },
    profit : {
      type : Number,
      default : 0
    },
    withdrawalC : {
      type : Number,
      default : 0
    },
    vip :{
      type  : Number,
      default : 0
    },
    tokens : [{
      token : {
        type : String,
        // required : true

      }
    }]

});

newUserSchema.methods.generateToken = async function(){

  try {

    const token =   jwt.sign({_id : this._id.toString() },process.env.SECRET);

    this.tokens = this.tokens.concat({token});
    await this.save();
    return token;

  } catch (e) {
    console.log(e);
  }
}

newUserSchema.pre("save" , async function(next){

   if(this.isModified("password")){
    this.password  = await bcrypt.hash(this.password , 9)
    }
    next();
});

// creating a collection

const user =  conn.user.model("person" , newUserSchema );

module.exports =  user;
