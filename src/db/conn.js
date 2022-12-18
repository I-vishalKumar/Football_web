const mongoose = require('mongoose');


mongoose.user =  mongoose.createConnection("mongodb+srv://vishal:12345@cluster0.ay2re.mongodb.net/?retryWrites=true&w=majority" , {
})

mongoose.scores = mongoose.createConnection("mongodb+srv://vishal:12345@cluster0.ay2re.mongodb.net/?retryWrites=true&w=majority", {

})

module.exports = mongoose;
