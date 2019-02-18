let mongoose = require('mongoose');
 
mongoose.connect('mongodb://localhost/mongoose_basics', function (err) {
 
   if (err) throw err;
 
   console.log('Successfully connected');
 
});


const missingCallsSchemaTest = mongoose.Schema({
  type: Number,
    tell: String,
    time: Number,
    ask: Number
})
const allCallsSchemaTest = mongoose.Schema({
    type: Number,
    tell: String,
    time: Number,
    desc: String
})
const allCall = mongoose.model('allCall', allCallsSchemaTest)

const missingsCall = mongoose.model('missingsCall', missingCallsSchemaTest)

// const call = new missingsCall({type: 1, tell: "79119493682", time:1548693353, ask: 0 })
// console.log('call', call)

// call.save((err, call) => {
//   if (err) {
//     console.log('err', err)
//   }
//   console.log('saved user', call)
// })

const descCallsSchemaTest = mongoose.Schema({
    tell: String,
    desc: String
})
const descCall = mongoose.model('descCall', descCallsSchemaTest)

// descCall.remove(function(err, result){
//     if(err) return console.log(err);
// }).then();

allCall.find((err, user) => {
    console.log('result2', err, user)
    user.forEach(function (item) {
        console.log(item)
    })
})
