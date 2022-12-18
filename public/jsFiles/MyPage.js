const input = document.getElementsByTagName('input');


// window come and go

let wind = document.querySelectorAll(".wind");
let money_btns = document.querySelectorAll(".deposit");


// function to make the specific window section visible;

let page = "";
let func;

  const window_move = ()=>{

    if(func == 1){

      window.scrollTo(0,0);
      page.style.animation = "come 1s ease-in-out forwards";

    }else if(func == 0){

       page.style.animation = "go 1s ease-in-out forwards";

    }else{
      console.log("err");
    }

  }
// about page cut btn;

let cut = document.querySelectorAll('.cut-btn');
let dep_cancel = document.querySelector('.cancel-btn');

  dep_cancel.addEventListener('click' , ()=>{
      page = wind[1];
      func = 0;
      let x2 = document.querySelector('.form-btns').lastElementChild;

      for(let i = 0; i < x2.length-1 ; i++){
         x2[i].lastElementChild.value = 0;
      }

      x2.setAttribute('disabled' , "");
      x2.style.background = "#888888";

      window_move()
  });

   cut.forEach((item, i) => {

     item.addEventListener('click' , ()=>{
        if(i==0){
          page = wind[3];
          func = 0;
          window_move();
        } else if(i== 1){
          page = wind[4];
          func = 0;
          window_move();
        }else if(i == 2){
          page = wind[5];
          func = 0;
          window_move();
        }
     });

 });

// the logout section:

let setting = document.querySelector(".setting");

setting.addEventListener("click" , ()=>{
   page = wind[5];
   func = 1;
   window_move();
});


let deposit = money_btns[0].lastElementChild;
let withdraw = money_btns[0].firstElementChild;
let w_btn = document.querySelector(".btn").children[0];

let w_card = document.querySelector(".w-card").lastElementChild;

let deposit_chose = 0;

  w_btn.addEventListener("click" , (e)=>{

    w_card.innerHTML = "Your payment is in progress <br> our system will validate your request. <br> Then payment will be added to your account.";
    w_card.style.textAlign = "start";
    w_card.style.background = "#e91e63";
    w_card.style.color = "white";
  });

  deposit.addEventListener('click' , ()=>{
            page = wind[1];
            func = 1;

   deposit_chose = document.querySelectorAll(".deposit-list");

            window_move();

     deposit_chose.forEach((item, i) => {
       item.addEventListener("click" , ()=>{
         inpt_field[1].value = item.value;
       })
     });

  });

  let x =   document.querySelector('.form-btns').lastElementChild;

  withdraw.addEventListener('click' , ()=>{
            page = wind[0];
            func = 1;
            w_btn.setAttribute('disabled' , "");
            w_btn.style.background = "#888888";

            w_card.innerHTML = "For further assistace contact us. <br> Note we charge 10% of the  withdrawal amount.";

            w_card.style.textAlign = "start";
            w_card.style.background = "none";
            window_move();

     });

// withdraw page back btn

let wit_back = document.querySelector('.w-cut-btn').children[0];
let inpt_box = document.querySelectorAll('.w-inpt');

wit_back.addEventListener("click" , ()=>{
  page = wind[0];
  func = 0;
  inpt_box.forEach((item, i) => {
     item.children[1].value = '';
  });
  window_move();
});

let num = parseInt(document.querySelector('.num').value);


let confirm_btn = document.querySelectorAll(".conf");

  confirm_btn.forEach((item, i) => {
       item.addEventListener('click' , ()=>{
           page = wind[i];
           func = 0;
           window_move();
        });
  });

let contact_btn = document.querySelectorAll(".cut-btn-box");

let the_btn = contact_btn[0].firstElementChild;


the_btn.addEventListener('click' , ()=>{

    contact_btn[0].style.animation = "reced 1.5s ease-in-out forwards";

    page = wind[2];
    func = 0;
    window_move();

});


let balance_box = document.querySelectorAll(".contact");
let elements = balance_box[0].children;

 for(let i = 0; i < elements.length ; i++){

      elements[i].addEventListener('click' , ()=>{

           if(i == 0){

             page = wind[2];
             func = 1;
             contact_btn[0].style.animation = "precede 1.5s ease-in-out forwards";
             // console.log(page);
             window_move();

           }else if(i == 2){
                     // console.log(wind[3]);
             page = wind[3];
             func = 1;
             window_move();

           }else if(i == 1){

             page = wind[4];
             func = 1;
             window_move();

           }

      });
 }


// disabeling the pay now btn;
let inpt_field = document.querySelectorAll('.form-control');

function validate() {


    if(parseInt(inpt_field[2].value.length) >= 12 &&
       parseInt(inpt_field[1].value) >= 500){

    x.removeAttribute("disabled");
    x.style.background = "#ffa120";

  }else{
    x.setAttribute('disabled' , "");
    x.style.background = "#303b4d";
  }

}





// promotion page js

// disabeling the withdraw btns

function w_check(){
  let count = 0;
  inpt_box.forEach((item, i) => {
    if(item.lastElementChild.value !== ""){
      count++;
    }
  });
  if(count === inpt_box.length){
    w_btn.removeAttribute('disabled');
    w_btn.style.background = "blue";
  }

}
// disabeling ends

document.querySelector('.fill-up').addEventListener('click', ()=>{
   page = wind[7];
   func = 1;
   window_move();
})
let af_cut = document.querySelector('.af-cut').lastElementChild;

af_cut.addEventListener('click' , ()=>{
   page = wind[7];
   func = 0;
   window_move();
});
