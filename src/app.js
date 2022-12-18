require('dotenv').config();
const bcrypt = require('bcryptjs');

const express = require('express');
const app = express();

const http = require('http');
const path = require('path');
const hbs = require('hbs');
const parser = require('cookie-parser');
const auth = require("./middleware/auth");
const nodemailer = require("nodemailer");
const crypto = require('crypto');

const shortid = require('shortid');
const cors = require('cors');


let port = process.env.PORT || 7000;

// database part

const data_schema = require("./score");
const user = require("./register");

// database part ends

const partials_path = path.join(__dirname , "../templates/partials");
const static_path = path.join(__dirname, "../");

// setting the view engnes

app.set('view engine' , 'hbs');
hbs.registerPartials(partials_path);
app.use(express.static(static_path));
app.use(express.json());
app.use(express.urlencoded({extended  : false}));
app.use(parser());

// setting hte view engines ends;


let g_user_details = {};

// routing starts here :=

app.get('/',(req, res)=>{
  res.status(200).render('login');
});

app.post('/register' , async(req , res)=>{

  let new_user = req.body.ruser;
  let inv_code = req.body.rinvitation;
  let parent_found;
  let have_invitation = false;
  let actual_value;
  let user_already_exist;

  new_user = new_user.trim();
  inv_code = inv_code.trim();

  user_already_exist =
  await user.findOne({user : new_user});

 if(user_already_exist){

   res.status(200).render('login')

 }else{

   try {

    if(inv_code){

      try {

        parent_found = await user.findOne({inv : inv_code});

      } catch (e) {

         console.log(e);
         res.status(300).render('login');

      } finally {

    // if parent not found then invitation code is incorrect or some server error =>

        if(!parent_found){

          res.status(200).render('login');

        }else{

          let new_members = parent_found.members;

          new_members++;

          await user.findOneAndUpdate( {inv : inv_code} , {
            members : new_members
           },{new : true});

        }

      }

      have_invitation = true;

     }else{
       inv_code = 0;
     }

  } catch (e) {

    console.log(e);

  } finally {

  // if the person has a parent and no user exists with the entered user name  OR person dosen't have a invitation code and has a unique user name. then =>

  if(parent_found || !have_invitation ){

      // calculating the invitation code for new user

    let calculate = ()=>{

          let generated_value = Math.floor(Math.random()*100000);
          if(generated_value < 1000){ return calculate() }

          check(generated_value);
      }


    calculate();

    async function check(generated_value){

        let inv_code_exist;

        try {

         inv_code_exist =
         await user.findOne({inv : generated_value});

        } catch (e) {

          console.log(e);
          res.render("login");

        }finally{

          if(!inv_code_exist){
            actual_value = generated_value;
            start_next_task();
          }else{
            calculate();
          }
        }
      }


    // done calculating
  async function start_next_task(){

    const newUser = new user({
        withdrawalC : req.body.rwithdrawalC,
        password : req.body.rpassword,
        phone : req.body.phone,
        inv  : actual_value,
        parent : inv_code,
        user : new_user,
      });

      // creating a global user for further

      g_user_details.g_user = new_user;
      g_user_details.g_profit = 0;
      g_user_details.g_balance = 0;
      g_user_details.g_bet = 0;
      g_user_details.g_withdrawal = req.body.rwithdrawal;
      g_user_details.g_members = 0;
      g_user_details.g_vip = 0;
      g_user_details.g_inv = actual_value;



    const token = await newUser.generateToken();

    res.cookie("jwt" , token , {
      expires : new Date(Date.now() + 60000000),
      httponly : true
    })

    // saving the user to database=>
    let result = await newUser.save();

    if(result){

      res.cookie('name' , new_user);
      res.cookie('wc' , req.body.withdrawalC);
      res.cookie('balance' , 0);

       res.status(200).render('index');
     }else{
       res.status(301).render("login");
     }
   }

  }

 }

}

});

app.post('/login'  , async (req , res)=>{

 let luser = req.body.luser;

   try {


    const s_user = await user.findOne({user : luser});

     if(s_user !== null){

      const pass  = req.body.lpassword;

      const match = await bcrypt.compare(pass , s_user.password);

      if(match == true){

        g_user_details.g_user =     s_user.user;
        g_user_details.g_profit =   parseInt(s_user.profit);
        g_user_details.g_balance =  parseInt(s_user.balance);
        g_user_details.g_bet =      parseInt(s_user.bet);
        g_user_details.g_withdrawal = s_user.withdrawalC;
        g_user_details.g_members =  s_user.members;
        g_user_details.g_vip =      s_user.vip;
        g_user_details.g_inv  = s_user.inv;

        const token = await s_user.generateToken();

        res.cookie("jwt" , token , {
           expires  : new Date(Date.now() + 6000000),
           httponly : true
        });
        res.cookie('name' , luser);
        res.cookie('balance' ,s_user.balance);
        res.cookie('wc' , s_user.withdrawalC);

        name = req.cookies.name;

        res.status(200).render("index" , {
          balance : s_user.balance
        });

      } else{

        res.status(200).render("login" , {
          text : "invalid Credential's"
        });

      }

    }else{
      res.status(200).render("login" , {
         text : "Invalid credential's"
       })
    }

    } catch(e){
      res.send(`something went wrong ${e}`);
    }

});

app.get('/index' , auth , async(req , res)=>{

 let newData;

  try {

    newData = await user.findOne({user : req.cookies.name});

  } catch (e) {
    console.log(e);
    res.render('login');
  } finally {

   if(newData){

     g_user_details.g_user    =   newData.user;
     g_user_details.g_members =   newData.members;
     g_user_details.g_balance =   newData.balance;
     g_user_details.g_profit  =   newData.profit;
     g_user_details.g_bet     =   newData.bet;
     g_user_details.g_vip     =   newData.vip;
     g_user_details.g_inv     =   newData.inv;

   }

    res.status(200).render('index' , {
      balance : g_user_details.g_balance
    })

  }

});

app.get('/allBets' , auth , async(req , res)=>{

  let refresingData;

  try {

    refresingData = await user.findOne({user : req.cookies.name});

  } catch (e) {
    console.log(e);
    res.render("login");
  } finally {

    if(refresingData){

      g_user_details.g_user    =   refresingData.user;
      g_user_details.g_members =   refresingData.members;
      g_user_details.g_balance =   refresingData.balance;
      g_user_details.g_profit  =   refresingData.profit;
      g_user_details.g_bet     =   refresingData.bet;
      g_user_details.g_vip     =   refresingData.vip;
      g_user_details.g_inv     =   refresingData.inv;

    }

  }

  res.status(200).render("allBets" , {
      balance : g_user_details.g_balance
  })

});

app.get('/MyPage' , auth , async (req , res)=>{
  
 let new_One;
  
  try{
    
     new_One = await user.findOne({user : req.cookies.name});
     
    if(new_One){
      
    g_user_details.g_user    =   new_One.user;
    g_user_details.g_members =   new_One.members;
    g_user_details.g_balance =   new_One.balance;
    g_user_details.g_profit  =   new_One.profit;
    g_user_details.g_bet     =   new_One.bet;
    g_user_details.g_vip     =   new_One.vip;
    g_user_details.g_inv     =   new_One.inv; 
       
     }
    
  }catch(e){
   res.render("login"); 
  }finally{
    
   res.status(200).render('MyPage' , {
    amount : parseFloat((g_user_details.g_balance).toFixed(2)),
    bet    : g_user_details.g_bet,
    name   : g_user_details.g_user ,
    profit : parseFloat((g_user_details.g_profit).toFixed(2))
    });
  
    
}
  
});

app.get('/Myteams' , async (req , res)=>{

  let newOne = await user.findOne({user : req.cookies.name});

  if(newOne){
    g_user_details.g_user    =   newOne.user;
    g_user_details.g_members =   newOne.members;
    g_user_details.g_balance =   newOne.balance;
    g_user_details.g_profit  =   newOne.profit;
    g_user_details.g_bet     =   newOne.bet;
    g_user_details.g_vip     =   newOne.vip;
    g_user_details.g_inv     =   newOne.inv;
  }

   let name2;
  
  if(g_user_details.g_user){
   name2 = g_user_details.g_user;
  }else{
   name2 = req.cookies.name; 
  }
  
    res.status(200).render('Myteams' , {

      user : name2,
      prof : g_user_details.g_profit,
      mem : g_user_details.g_members,
      vip : g_user_details.g_vip

    });

});

// function for placing the bet and deducting the balance;

app.get("/history" , auth ,  async (req,res)=>{

  let new_data = await user.findOne({user : req.cookies.name});

  if(new_data){
    g_user_details.g_user    =   req.cookies.name;
    g_user_details.g_members =   new_data.members;
    g_user_details.g_balance =   new_data.balance;
    g_user_details.g_profit  =   new_data.profit;
    g_user_details.g_bet     =   new_data.bet;
    g_user_details.g_vip     =   new_data.vip;
    g_user_details.g_inv     =   new_data.inv;
  }


  let orignal_data = [
     {
    t1_back : "../public/photos/Comunicaciones.png",
    t2_back : "../public/photos/Criciúma.png",
    t1_name : "Comunicaciones",
    t2_name : "Criciúma", 
    match_day : new Date(2022 , 5 , 27 , 12 ,0),
    time    : 0, 
    team1   : 4,
    team2   : 4
  },{

    t1_back : "../public/photos/Avaí.png",
    t2_back : "../public/photos/Fortaleza.png",
    t1_name : "Avaí",
    t2_name : "Fortaleza",
    match_day : new Date(2022 , 5 , 27 , 13 ,0),
    time    : 0,
    team1   : 1,
    team2   : 9

  } ,

 {
    t1_back : "../public/photos/LAFC.png",
    t2_back : "../public/photos/Zulia.png",
    t1_name : "LAFC",
    t2_name : "Zulia",
    match_day : new Date(2022 , 5 , 27 , 14 ,0),
    time    : 0,
    team1   : 3,
    team2   : 3
  } ,

 {
    t1_back : "../public/photos/Internacional.png",
    t2_back : "../public/photos/Lillestrom.png",
    t1_name : "Internacional",
    t2_name : "Lillestrom",
    match_day : new Date(2022 , 5 , 27 , 15 ,0),
    time    : 0,
    team1   : 3,
    team2   : 3
  } ,

{
    t1_back : "../public/photos/Rosenborg.png",
    t2_back : "../public/photos/Molde.png",
    t1_name : "Rosenborg",
    t2_name : "Molde",
    match_day : new Date(2022 , 5 , 27 , 16 ,0),
    time    : 0,
    team1   : 7,
    team2   : 2
  } ,

{
    t1_back : "../public/photos/Stromsgodset.png",
    t2_back : "../public/photos/Temperley.png",
    t1_name : "Stromsgodset",
    t2_name : "Temperley",
    match_day : new Date(2022 , 5 , 27 , 17 ,0),
    time    : 0,
    team1   : 9,
    team2   : 0
  } ,
{
    t1_back : "../public/photos/Tenerife.png",
    t2_back : "../public/photos/Sport.png",
    t1_name : "Tenerife",
    t2_name : "Sport",
    match_day : new Date(2022 , 5 , 27 , 18 , 0),
    time    : 0,
    team1   : 2,
    team2   : 2
  } ,

{
    t1_back : "../public/photos/Tenerife.png",
    t2_back : "../public/photos/Sarawak.png",
    t1_name : "Tenerife",
    t2_name : "Sarawak",
    match_day : new Date(2022 , 5 , 27 , 19 ,0),
    time    : 0,
    team1   : 7,
    team2   : 0
  } ,

{
    t1_back : "../public/photos/Cobreloa.png",
    t2_back : "../public/photos/Aalesund.png",
    t1_name : "Cobreloa",
    t2_name : "Aalesund",
    match_day : new Date(2022 , 5 , 27 , 20 ,0),
    time    : 0,
    team1   : 2,
    team2   : 2
  } ,
{
    t1_back : "../public/photos/Antofagasta.png",
    t2_back : "../public/photos/Girona.png",
    t1_name : "Antofagasta",
    t2_name : "Girona",
    match_day : new Date(2022 , 5 , 27 , 21 ,0),
    time    : 0,
    team1   : 3,
    team2   : 3
  } ,
{
    t1_back : "../public/photos/Pahang.png",
    t2_back : "../public/photos/Selangor.png",
    t1_name : "Pahang",
    t2_name : "Selangor",
    match_day : new Date(2022 , 5 , 27 , 22 ,0),
    time    : 0,
    team1   : 7,
    team2   : 3
  } ,
{
    t1_back : "../public/photos/Haugesund.png",
    t2_back : "../public/photos/Terengganu.png",
    t1_name : "Haugesund",
    t2_name : "Terengganu",
    match_day : new Date(2022 , 5 , 27 , 23 ,0),
    time    : 0,
    team1   : 3,
    team2   : 1
  },{
  t1_back:"../public/photos/Goias.png",
  t2_back: "../public/photos/Wanderers.png",
  t1_name: "Goias",
  t2_name: "Wanderers",
  match_day: new Date(2022, 5, 27 , 24 ,28),
  time: 0,
  team1 : 9,
  team2 : 1
  },
  {
  t1_back:"../public/photos/OperarioPR.png",
  t2_back: "../public/photos/Botafogo.png",
  t1_name: "Operario PR",
  t2_name: "Botafogo",
  match_day: new Date(2022, 5, 28 , 12 , 15),
  time: 0,
  team1 : 0,
  team2 : 3
  },
  {
  t1_back:"../public/photos/Guarani.png",
  t2_back: "../public/photos/Goias.png",
  t1_name: "Guarani",
  t2_name: "Goiás",
  match_day: new Date(2022, 5, 28 , 13 ,0),
  time: 0,
  team1 : 3,
  team2 : 7
  },
  {
  t1_back:"../public/photos/OperarioPR.png",
  t2_back: "../public/photos/Wanderers.png",
  t1_name: "Operario PR",
  t2_name: "Wanderers",
  match_day: new Date(2022, 5, 28, 14, 20),
  time: 0,
  team1 : 4,
  team2 : 4
  },
  {
  t1_back:"../public/photos/CampinensePB.png",
  t2_back: "../public/photos/Latvia.png",
  t1_name: "Campinense PB",
  t2_name: "Latvia",
  match_day: new Date(2022, 5, 28 , 15 , 30),
  time: 0,
  team1 : 9,
  team2 : 3
  },
  {
  t1_back:"../public/photos/DalianProfessional.png",
  t2_back: "../public/photos/GuangzhouCity.png",
  t1_name: "Dalian Professional",
  t2_name: "Guangzhou City",
  match_day: new Date(2022, 5, 28 , 16 , 40),
  time: 0,
  team1 : 9,
  team2 : 9
  },
  {
  t1_back:"../public/photos/DalianProfessional.png",
  t2_back: "../public/photos/BostonRiver.png",
  t1_name: "Dalian Professional",
  t2_name: "Boston River",
  match_day: new Date(2022, 5, 28 , 17 ,58),
  time: 0,
  team1 : 2,
  team2 : 3
  },
  {
  t1_back:"../public/photos/BerekumChelsea.png",
  t2_back: "../public/photos/DreamsFC.png",
  t1_name: "Berekum Chelsea",
  t2_name: "Dreams F.C.",
  match_day: new Date(2022, 5, 28 , 18 , 0),
  time: 0,
  team1 : 9,
  team2 : 9
  },
  {
  t1_back:"../public/photos/DeportesTolima.png",
  t2_back: "../public/photos/DreamsFC.png",
  t1_name: "Deportes Tolima",
  t2_name: "Dreams F.C.",
  match_day: new Date(2022, 5, 28 , 19 , 0),
  time: 0,
  team1 : 9,
  team2 : 9
  },
  {
  t1_back: "../public/photos/Envigado.png",
  t2_back: "../public/photos/laEquidad.png",
  t1_name: "Envigado",
  t2_name: "La Equidad",
  match_day: new Date(2022, 5, 28 , 20 , 30),
  time: 0,
  team1 : 3,
  team2 : 3
  },
    {
  t1_back:"../public/photos/Guarani.png",
  t2_back: "../public/photos/CampinensePB.png",
  t1_name: "Guarani",
  t2_name: "Campinense PB",
  match_day: new Date(2022, 5, 28 ,21 , 20),
  time: 0,
  team1 : 7,
  team2 : 3
  },
  {
  t1_back:"../public/photos/Guarani.png",
  t2_back: "../public/photos/Remo.png",
  t1_name: "Guarani",
  t2_name: "Remo",
  match_day: new Date(2022, 5, 28 , 22 , 45),
  time: 0,
  team1 : 2,
  team2 : 3
  },
  {
  t1_back:"../public/photos/Wanderers.png",
  t2_back: "../public/photos/Latvia.png",
  t1_name: "Wanderers",
  t2_name: "Latvia",
  match_day: new Date(2022, 5, 28 , 23 ,0),
  time: 0,
  team1 : 3,
  team2 : 9
  },
  {
      t1_back : "../public/photos/RealMadrid.png",
      t2_back : "../public/photos/Barcelona.png",
      t1_name : "Real Madrid",
      t2_name : "Barcelona",
      match_day : new Date(2022 , 5 , 28 , 24 , 0),
      time : 0,
      team1 : 9,
      team2 : 1
    },

    {
      t1_back : "../public/photos/Juventus.png",
      t2_back : "../public/photos/manchesterUnited.png",
      t1_name : "Juventus",
      t2_name : "Manchester United",
      match_day : new Date(2022 , 5 , 29 , 12 , 0),
      time : 0,
      team1 : 9 ,
      team2 : 2
    },
    {
      t1_back : "../public/photos/ManchesterCity.png",
      t2_back : "../public/photos/chelse.png",
      t1_name : "Manchester City",
      t2_name : "Chelsea",
      match_day : new Date(2022 , 5 , 29 , 13 , 0),
      time : 0,
      team1 : 9 ,
      team2 : 2
    },
    {
      t1_back : "../public/photos/Arsenal.png",
      t2_back : "../public/photos/liverpool.png",
      t1_name : "Arsenal",
      t2_name : "Liverpool",
      match_day : new Date(2022, 5 , 29 , 14 , 0),
      time : 0,
      team1 : 0 ,
      team2 : 2
    },
    {
      t1_back : "../public/photos/BayernMunchen.png",
      t2_back : "../public/photos/BorussiaDortmund.png",
      t1_name : "Bayern Munchen",
      t2_name : "Borussia Dortmund",
      match_day : new Date(2022, 5 , 29 , 15 , 0),
      time : 0,
      team1 : 9 ,
      team2 : 3
    },
    {
      t1_back : "../public/photos/PSG.png",
      t2_back : "../public/photos/TottenhamHotspur.png",
      t1_name : "PSG",
      t2_name : "Tottenham Hotspur",
      match_day : new Date(2022, 5 , 29 , 16 , 0),
      time : 0,
      team1 : 0 ,
      team2 : 2
    },
    {
      t1_back : "../public/photos/AtleticoMadrid.png",
      t2_back : "../public/photos/Intenazionale.png",
      t1_name : "Atletico Madrid",
      t2_name : "Intenazionale",
      match_day : new Date(2022, 5 , 29 , 17 , 0),
      time : 0,
      team1 : 2 ,
      team2 : 2
    },
    {
      t1_back : "../public/photos/Milan.png",
      t2_back : "../public/photos/Brazil.png",
      t1_name : "Milan",
      t2_name : "Brazil",
      match_day : new Date(2022, 5 , 29 , 18 , 0),
      time : 0,
      team1 : 9 ,
      team2 : 2
    },
    {
      t1_back : "../public/photos/Spain.png",
      t2_back : "../public/photos/Argentina.png",
      t1_name : "Spain",
      t2_name : "Argentina",
      match_day : new Date(2022, 5 , 29 , 19 , 0),
      time : 0,
      team1 : 8 ,
      team2 : 3
    },
    {
      t1_back : "../public/photos/Germany.png",
      t2_back : "../public/photos/England.png",
      t1_name : "Germany",
      t2_name : "England",
      match_day : new Date(2022, 5 , 29 , 20 , 0),
      time : 0,
      team1 : 1 ,
      team2 : 3
    },
    {
      t1_back : "../public/photos/RealMadrid.png",
      t2_back : "../public/photos/Juventus.png",
      t1_name : "Real Madrid",
      t2_name : "Juventus",
      match_day : new Date(2022, 5 , 29 , 21 , 0),
      time : 0,
      team1 : 0 ,
      team2 : 0
    },
    {
      t1_back : "../public/photos/Barcelona.png",
      t2_back : "../public/photos/manchesterUnited.png",
      t1_name : "Barcelona",
      t2_name : "Mnchester United",
      match_day : new Date(2022, 5 , 29 , 22 , 0),
      time : 0,
      team1 : 9 ,
      team2 : 3
    },
    {
      t1_back : "../public/photos/ManchesterCity.png",
      t2_back : "../public/photos/Arsenal.png",
      t1_name : "Manchester City",
      t2_name : "Arsenal",
      match_day : new Date(2022, 5 , 29 , 23 , 0),
      time : 0,
      team1 : 7 ,
      team2 : 3
    },
    {
      t1_back : "../public/photos/chelse.png",
      t2_back : "../public/photos/liverpool.png",
      t1_name : "Chelsea",
      t2_name : "Liverpool",
      match_day : new Date(2022, 5 , 29 , 24 , 0),
      time : 0,
      team1 : 9 ,
      team2 : 2
    },
    {
      t1_back : "../public/photos/BayernMunchen.png",
      t2_back : "../public/photos/PSG.png",
      t1_name : "Bayern Munchen",
      t2_name : "PSG",
      match_day : new Date(2022, 5 , 30 , 12 , 0),
      time : 0,
      team1 : 1 ,
      team2 : 2
    },
    {
      t1_back : "../public/photos/BorussiaDortmund.png",
      t2_back : "../public/photos/TottenhamHotspur.png",
      t1_name : "Borussia Dortmund",
      t2_name : "Tottenham Hotspur",
      match_day : new Date(2022, 5 , 30 , 13 , 0),
      time : 0,
      team1 : 8 ,
      team2 : 1
    },
    {
      t1_back : "../public/photos/AtleticoMadrid.png",
      t2_back : "../public/photos/Milan.png",
      t1_name : "Atletico Madrid",
      t2_name : "Milan",
      match_day : new Date(2022, 5 , 30 , 14 , 0),
      time : 0,
      team1 : 9 ,
      team2 : 3
    },
    {
      t1_back : "../public/photos/Intenazionale.png",
      t2_back : "../public/photos/Milan.png",
      t1_name : "Intenazionale",
      t2_name : "Milan",
      match_day : new Date(2022, 5 , 30 , 15 , 0),
      time : 0,
      team1 : 2 ,
      team2 : 0
    },
    {
      t1_back : "../public/photos/Brazil.png",
      t2_back : "../public/photos/Argentina.png",
      t1_name : "Brazil",
      t2_name : "Argentina",
      match_day : new Date(2022, 5 , 30 , 16 , 0),
      time : 0,
      team1 : 8 ,
      team2 : 3
    },
    {
      t1_back : "../public/photos/Spain.png",
      t2_back : "../public/photos/Germany.png",
      t1_name : "Spain",
      t2_name : "Germany",
      match_day : new Date(2022, 5 , 30 , 17 , 0),
      time : 0,
      team1 : 9 ,
      team2 : 3
    },
    {
      t1_back : "../public/photos/Argentina.png",
      t2_back : "../public/photos/England.png",
      t1_name : "Argentina",
      t2_name : "England",
      match_day : new Date(2022, 5 , 30 , 18 , 0),
      time : 0,
      team1 : 2,
      team2 : 2
    },{
    t1_back : "../public/photos/Bahia.png",
    t2_back : "../public/photos/Cañuelas.png",
    t1_name : "Bahia",
    t2_name : "Cañuelas", 
    match_day : new Date(2022 , 5 , 27 , 18 ,0),
    time    : 0, 
    team1   : 2,
    team2   : 2
  } ,  

 {
    t1_back : "../public/photos/Celaya.png",
    t2_back : "../public/photos/iFénix.png",
    t1_name : "Celaya",
    t2_name : "iFénix", 
    match_day : new Date(2022 , 5 , 28 , 18 ,0),
    time    : 0, 
    team1   : 3,
    team2   : 0
  } ,  

{
    t1_back : "../public/photos/Corinthians.png",
    t2_back : "../public/photos/Flamengo.png",
    t1_name : "Corinthians",
    t2_name : "Flamengo", 
    match_day : new Date(2022 , 5 , 29 , 18 ,0),
    time    : 0, 
    team1   : 0,
    team2   : 0
  } ,  
{
    t1_back : "../public/photos/Liniers.png",
    t2_back : "../public/photos/Londrina.png",
    t1_name : "Liniers",
    t2_name : "Londrina", 
    match_day : new Date(2022 , 5 , 30 , 18 ,0),
    time    : 0, 
    team1   : 1,
    team2   : 2
  } ,  
{
    t1_back : "../public/photos/Lugano.png",
    t2_back : "../public/photos/Magallanes.png",
    t1_name : "Lugano",
    t2_name : "Magallanes", 
    match_day : new Date(2022 , 6 , 1 , 18 ,0),
    time    : 0, 
    team1   : 1,
    team2   : 2
  } ,  
{
    t1_back : "../public/photos/Melgar.png",
    t2_back : "../public/photos/Novorizontino.png",
    t1_name : "Melgar",
    t2_name : "Novorizontino", 
    match_day : new Date(2022 , 6 , 2 , 18 ,0),
    time    : 0, 
    team1   : 3,
    team2   : 0
  } ,  

{
    t1_back : "../public/photos/Portuguesa.png",
    t2_back : "../public/photos/Santos.png",
    t1_name : "Portuguesa",
    t2_name : "Santos", 
    match_day : new Date(2022 , 6 , 3 , 18 ,0),
    time    : 0, 
    team1   : 0,
    team2   : 0
  } ,  
{
    t1_back : "../public/photos/Yupanqui.png",
    t2_back : "../public/photos/Zamora.png",
    t1_name : "Yupanqui",
    t2_name : "Zamora", 
    match_day : new Date(2022 , 6 , 4 , 18 ,0),
    time    : 0, 
    team1   : 3,
    team2   : 0
  } ,  
{
    t1_back : "../public/photos/Celaya.png",
    t2_back : "../public/photos/Santos.png",
    t1_name : "Celaya",
    t2_name : "Santos", 
    match_day : new Date(2022 , 6 , 5 , 18 ,0),
    time    : 0, 
    team1   : 2,
    team2   : 2
  } ,  
{
    t1_back : "../public/photos/Liniers.png",
    t2_back : "../public/photos/Bahia.png",
    t1_name : "Liniers",
    t2_name : "Bahia", 
    match_day : new Date(2022 , 6 , 6 , 18 ,0),
    time    : 0, 
    team1   : 2,
    team2   : 2
  } 
    
 ];

  let data_from_user;
  let user_id = req.cookies.name;
  let data_to_send;
  let user_data , bet_profit, previous_profit , new_balance ,bet_amount ,  previous_balance ,new_profit;

  try {

  // get all the user bets whose given is false;

    data_from_user =
    await data_schema.find({user : user_id , given : false});

    user_data = await user.findOne({user : user_id});

  } catch (e){
    console.log(e);
    res.status(301).render('index');
  } finally {

  let bets = "";

  if(data_from_user){

// data_from_user is the data retrived from the mongodb server where user has placed the bet;

  data_from_user.forEach((item, i) => {

      let team1_name = item.team1_name;
      let team2_name = item.team2_name;

// original data is the data saved in the database;

    orignal_data.forEach((or_data, i) => {

        let res1 = (team1_name.localeCompare(or_data.t1_name));
        let res2 = (team2_name.localeCompare(or_data.t2_name));

    // if i find a document similar to. my bet then check if the beting score is same or not

       let date_tocheck = new Date(or_data.match_day);
       let found_time = date_tocheck.getTime();

       var dateUTC = new Date();
       dateUTC = dateUTC.getTime()
       var dateIST = new Date(dateUTC);

   //date shifting for IST timezone (+5 hours and 30 minutes)

       dateIST.setHours(dateIST.getHours() + 5);
       dateIST.setMinutes(dateIST.getMinutes() + 30);

       let is_date_less = (date_tocheck.getDate() <= dateIST.getDate());

       let is_time_less = (found_time < dateIST.getTime());

//        console.log(date_tocheck , today);
//        console.log(is_date_less , is_time_less , res1 , res2 );

       if(is_date_less && is_time_less && res1 == 0 && res2 == 0){

          let user_bet1 = parseInt(item.team1);
          let user_bet2 = parseInt(item.team2);
          bet_amount = parseInt(item.amount);

    // calculating the new profit of the use

          previous_balance = parseInt(user_data.balance) + bet_amount;

    // if user bet score's matches our planed bet scores then

        if(user_bet1 == parseInt(or_data.team1) && user_bet2 ==   parseInt(or_data.team2)){

           bet_profit = parseFloat(item.profit);

            let calculated_profit = parseFloat((bet_profit/100) * bet_amount);

            calculated_profit = parseFloat(calculated_profit.toFixed(2));

            new_balance = parseFloat(user_data.balance) + calculated_profit + bet_amount;
            new_balance = parseFloat(new_balance.toFixed(3));

            new_profit = calculated_profit + user_data.profit;
            new_profit = parseFloat(new_profit.toFixed(3));

            previous_profit = parseFloat((user_data.profit).toFixed(2));
            previous_balance = parseFloat((user_data.balance).toFixed(2));

            bets = `${item.team1} : ${item.team2}`;

            update( bet_amount , new_balance , new_profit , previous_balance , previous_profit , bet_profit);

          }else{

            new_balance = parseFloat((user_data.balance).toFixed(2));
            new_profit = parseFloat((user_data.profit).toFixed(2));

            bets = `${item.team1} : ${item.team2}`;

            update(bet_amount , new_balance , new_profit , new_balance , new_profit , item.profit);

          }

       }

      });

    });


 async function update(bet_am , u_balance , u_profit , u_prev_bal , u_prev_prof , bet_prof){

    user_data.balance = u_balance;
    user_data.profit = u_profit;

    await user.findOneAndUpdate({user : user_data.user},{
      balance : u_balance,
      profit : u_profit
    },{new : true});


   data_schema.findOneAndDelete({user : req.cookies.name , amount : bet_am,  given : false} , function(err , done){

           if(err){

             res.send("someting went wrong");

           }else if(done){

             let to = 'simrankumari6343@gmail.com';
             let subject = "Bet settled";
             let body = `user_name ==  ${user_data.user} \n Bet_amount == ${bet_am} \n user_previous_blance == ${u_prev_bal} \n New balance == ${u_balance} \n previous_profit === ${u_prev_prof} \n new_profit == ${u_profit} \n profit == ${bet_prof}% \n score == ${bets}`;

             let transporter = nodemailer.createTransport({
                 service : 'gmail',
                 auth : {
                   user : 'darkidentity2002@gmail.com',
                   pass : 'qgdpqubejudzjlke'
                  }
               })

             let mailOptions = {
                 from : 'darkidentity2002@gmail.com',
                 to : to,
                 subject : subject,
                 text : body
             }

             transporter.sendMail(mailOptions , async(err , info)=>{
                 if(err){console.log(err);}
               })
             }
           });

  }

}

   data_to_send =  await data_schema.find({user : req.cookies.name , given : false});

   res.send(data_to_send);

  }

});

app.post("/placeBet" , async(req, res)=>{

  let newData;
 
  let new_person = await user.findOne({user : req.cookies.name});

  if(new_person){
    g_user_details.g_user    =   req.cookies.name;
    g_user_details.g_members =   new_person.members;
    g_user_details.g_balance =   new_person.balance;
    g_user_details.g_profit  =   new_person.profit;
    g_user_details.g_bet     =   new_person.bet;
    g_user_details.g_vip     =   new_person.vip;
    g_user_details.g_inv     =   new_person.inv;
  }
  
  let name;
  
  if(g_user_details.g_user){
    name = g_user_details.g_user;
  }else{
    name = req.cookies.name;
  }
  
   newData = new data_schema({

     user :          name,
     amount :        req.body.amount,
     team1 :         req.body.t1_score,
     team2:          req.body.t2_score,
     team1_name:     req.body.team1_name,
     team2_name :    req.body.team2_name,
     profit :        req.body.profit,
     t1_background : req.body.t1_back,
     t2_background : req.body.t2_back,
     given :         false

   })


   let check_exits = await data_schema.findOne({user : g_user_details.g_user , team1_name :  req.body.team1_name , team2_name : req.body.team2_name , given : false});

  if(check_exits){
    res.send({status : 2});
  }else if (req.body.amount < 500){
    res.send({status : 5});
  }else if(req.body.amount >= 500){

    let new_Bet = (g_user_details.g_bet) + 1;
    let n_balance = (g_user_details.g_balance)  - req.body.amount;

    if(n_balance < 0){

      res.send({status : 0});

     }else{

      await user.findOneAndUpdate({user : g_user_details.g_user} , {
         balance : n_balance,
         bet :     new_Bet
      }, {new : true});

    let if_done = await newData.save();

    if(if_done){

      g_user_details.g_balance = n_balance;
      g_user_details.g_bet = new_Bet;
      res.send({status : 1});

    }else{
      res.send({status  : -1});
    }

  }

 }

});

app.get("/invitation", auth , async (req, res)=>{

    let newDATA = await user.findOne({user : req.cookies.name});

     res.status(200).render('invi' , {
       inv : newDATA.inv
     })

});

// payment page
app.get("/payments" , (req , res)=>{

  res.render("pay" , {key : process.env.PAYKEYID});

});

// withdrawal mail sender
app.post("/mail" , async (req, res)=>{

  let the_user ;
  let valid = true;
  let r_amount;

  try {

    let filter = {user : g_user_details.g_user};

    let w_amount = g_user_details.g_balance - req.body.Amount;

    r_amount = req.body.Amount - (req.body.Amount * 0.1);

    if(g_user_details.g_balance > req.body.Amount){


    if(w_amount < 0){
      w_amount = 0;
    }

   let update = {balance : w_amount};

   g_user_details.g_balance = w_amount;

   the_user = await user.findOneAndUpdate(filter , update ,{
      new : true
    });

    }else{
      valid = false;
    }

  }catch (e) {
    console.log(e);
    res.status(301).render("index");
}
  finally{

  if(valid){

    let to = 'vishalkumar73777@gmail.com';
    let subject = "withdrawal";
    let body = ` name : ${req.cookies.name} \n user_Bank_name = ${req.body.name} \n Bank account = ${req.body.accNo} \n IFSC = ${req.body.IFSCE} \n Branch = ${req.body.Branch} \n Amount_requested = ${req.body.Amount}\n Amount_to_update = ${r_amount} `;

    let transporter = nodemailer.createTransport({
      service : 'gmail',
      auth : {
        user : 'darkidentity2002@gmail.com',
        pass : 'qgdpqubejudzjlke'
      }
    })

    let mailOptions = {
      from : 'darkidentity2002@gmail.com',
      to : to,
      subject : subject,
      text : body
    }

    transporter.sendMail(mailOptions , async(err , info)=>{
      if(err){
        console.log(err);
      }else if(info){

        res.status(200).render("response" , {
          type : "blue",
          background : "url(./public/photos/done.png)",
          response : "Your withdrawal is being parsed by our system's , it will be credited soon."
        });

      }
    })

  }else{

    res.status(200).render("response" , {
      type : "red",
      background : "url(./public/photos/insufficient.png)",
      response : "insufficient balance"

    });

  }

}


});

app.post('/logout' , auth  , async (req , res)=>{
     try {
       res.clearCookie("jwt");
     } catch (e) {
       console.log(e);
     }finally{
       res.status(200).render("login");
     }
});

app.post('/pay' , async (req , res)=>{

  let new_person2;

  try{

    new_person2 = await user.findOne({user : req.cookies.name});

    if(new_person){

    g_user_details.g_user    =   req.cookies.name;
    g_user_details.g_members =   new_person2.members;
    g_user_details.g_balance =   new_person2.balance;
    g_user_details.g_profit  =   new_person2.profit;
    g_user_details.g_bet     =   new_person2.bet;
    g_user_details.g_vip     =   new_person2.vip;
    g_user_details.g_inv     =   new_person2.inv;

    }else{
      res.render("login");
    }

    }catch(e){
      console.log("hello there");
    }finally{


    let to = 'vishalkumar73777@gmail.com';
    let subject = "payment added";
    let body = `deposited : ${req.body.amount} \n
                from :     ${req.cookies.name} \n
                upi refrence : ${req.body.transaction}`;

    let transporter = nodemailer.createTransport({
        service : 'gmail',
        auth : {
          user : 'darkidentity2002@gmail.com',
          pass : 'qgdpqubejudzjlke'
          }
      })

    let mailOptions = {
        from : 'darkidentity2002@gmail.com',
        to : to,
        subject : subject,
        text : body
      }

    transporter.sendMail(mailOptions , async(err , info)=>{
        if(err){
          console.log(err);
        }else{

          res.status(200).render("response" , {
            type : "blue",
            background : "url(./public/photos/done.png)",
            response : "payment success Our system's are verifying your request , your payment will be added soon in your wallet."
          });
        }
    })


    }

 });

app.listen(port , ()=>{
  console.log(`Listening on port ${port}`);
})
