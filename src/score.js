const validator = require('validator');
const mongoose = require('mongoose');
require('mongoose-double')(mongoose);
const bcrypt = require('bcryptjs');
const conn = require("./db/conn");

let SchemaTypes = mongoose.Schema.Types;


const dataSchema = new mongoose.Schema ({

  user:{
    type : String,
    required : true
  },
  amount : {
    type : Number,
    required : true
  },
  team1 : {
    type : Number,
    required : true
  },
  team1_name : {
    type : String,
    required : true
  },
  team2_name : {
    type : String,
    required : true
  },
  team2 : {
    type : Number,
    required : true
  },
  profit : {
    type : Number,
    required : true
  },
  t1_background :{
    type : String,
    required : true
  },
  t2_background : {
    type : String,
    required : true
  },
  given : {
    type : Boolean,
    required : true,
    default : false
  }

});

const data =  conn.scores.model("matchData" , dataSchema );


module.exports =  data;
