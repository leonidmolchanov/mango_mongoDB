const app = require('express')();
const fs = require('fs');
const bodyParser = require('body-parser');
const VPBX = require('mango-vpbx');
const vpbx = new VPBX('srvtxbv5axyvr2u2fbo2k59pq53wwm7e','f18kagpch8c3v4d8kmrvxirgfu6nf0sl');
const events = vpbx.events('https://app.mango-office.ru/vpbx/');
const mongoose = require('mongoose');
const httpPort = 9090;
const wsPort =9091;
const login = "test";
const password = "test";
mongoose.connect('mongodb://localhost/mongoose_basics', function (err) {
    if (err) throw err;
    console.log('Successfully connected');
});
const missingCallsSchemaTest = mongoose.Schema({
    type: Number,
    tell: String,
    time: Number,
    ask: Number,
    desc: String
})
const allCallsSchemaTest = mongoose.Schema({
    type: Number,
    tell: String,
    time: Number,
    desc: String
})
const descCallsSchemaTest = mongoose.Schema({
    tell: String,
    desc: String
})
const missingsCall = mongoose.model('missingsCall', missingCallsSchemaTest)
const descCall = mongoose.model('descCall', descCallsSchemaTest)
const allCall = mongoose.model('allCall', allCallsSchemaTest)
app.get('/',function(req,res){
    console.log(req.query)
    if(req.query.login==login && req.query.password==password){
        auth={login:req.query.login, password:req.query.password};
        res.cookie('mango', JSON.stringify(auth), { httpOnly: true ,maxAge: 10000000000 });
        res.sendFile(__dirname + '/index.html');
    }
    else{
        res.sendFile(__dirname + '/auth.html');
    }
});
app.get('/js/datepicker-ru.js',function(req,res){
    res.sendFile(__dirname +'/js/datepicker-ru.js');
});
app.get('/js/jquery.comiseo.daterangepicker.min.js',function(req,res){
    res.sendFile(__dirname +'/js/jquery.comiseo.daterangepicker.min.js');
});
app.get('/js/missed.js',function(req,res){
    res.sendFile(__dirname +'/js/missed.js');
});
app.get('/js/moment.min.js',function(req,res){
    res.sendFile(__dirname +'/js/moment.min.js');
});
app.get('/css/jquery.comiseo.daterangepicker.min.css',function(req,res){
    res.sendFile(__dirname +'/css/jquery.comiseo.daterangepicker.min.cs');
});
app.get('/css/jquery-ui.min.css',function(req,res){
    res.sendFile(__dirname +'/css/jquery-ui.min.css');
});
app.get('/css/missed.css',function(req,res){
    res.sendFile(__dirname +'/css/missed.css');
});
app.use(bodyParser.urlencoded());
app.use(events.call);
app.use(events.summary);
app.use(events.recording);
app.use(events.dtmf);
app.use(events.sms);
app.use(events.ping);
events.on('summary', e => getCall(e));
events.on('ping', e => fs.appendFileSync('test.txt', `\nping:`+JSON.stringify(e)));
app.use((req, res) => res.status(404).send({ error: 'not found' }));
app.listen(httpPort);
function getCall(e){
    if(e.talk_time==0){
        var time = Date(e.end_time);
        if(e.call_direction==1){
            let call = new missingsCall({type: 1, tell: e.from.number, time: e.end_time, ask: 0, desc: "" })

call.save((err, call) => {
  if (err) {
    console.log('err', err)
  }
  console.log('saved call', call)
})
        }
        else if(e.call_direction==2){
            let call = new missingsCall({type: 2, tell: e.to.number, time: e.end_time, ask: 0, desc: "" })
            call.save((err, call) => {
                if (err) {
                    console.log('err', err)
                }
                console.log('saved call', call)
            })
        }
    }
    else{
        let date = new Date();
        date.setHours(0,0,0,0);
        let time = date.getTime();

        if(e.call_direction==1){
            CallDesc = "-";
            descCall.find({tell: e.from.number},(err, user) => {
                user.forEach(function (item2) {
                    CallDesc = item2.desc
                })
            }).then(()=>{
                let call = new allCall({type: 1, tell: e.from.number, time: e.end_time, desc: CallDesc })
                call.save((err, call) => {
                    if (err) {
                        console.log('err', err)
                    }
                    console.log('saved call(all)', call)
                })
            })
        }
        else{
            CallDesc = "-";
            descCall.find({tell: e.to.number},(err, user) => {
                user.forEach(function (item2) {
                    CallDesc = item2.desc
                })
            }).then(()=>{
                let call = new allCall({type: 2, tell: e.to.number, time: e.end_time, desc: CallDesc })

                call.save((err, call) => {
                    if (err) {
                        console.log('err', err)
                    }
                    console.log('saved call(all)', call)
                })
            })
        }
        missingsCall.find({$or:[{type: 1}, {type: 2}], time: {$gt : Number(time / 1000)}},(err, user) => {
            user.forEach(function (item) {
console.log('find'+item.id)
                if(e.call_direction==1){
                    if(e.from.number==item.tell){

                        missingsCall.findByIdAndUpdate(item.id, {ask: 1}, function(err, guser){
                            if(err) return console.log(err);
                            console.log("Обновленный объект", guser);
                        });
                        console.log("bingo")
                    }
                }
                else{
                    if(e.to.number==item.tell){

                        allCall.findByIdAndUpdate(item.id, {ask: 1}, function(err, guser){
                            if(err) return console.log(err);
                            console.log("Обновленный объект", guser);
                        });
                        console.log("bingo")
                    }
                }
            })
        })
    }
    console.log('call')
}
const WebSocket = require('ws');
const wss = new WebSocket.Server({
    port: wsPort,
    perMessageDeflate: {
        zlibDeflateOptions: {
            // See zlib defaults.
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        serverMaxWindowBits: 10, // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages
        // should not be compressed.
    }
});
wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        message = JSON.parse(message);
        if(message.type=="getCall") {
            getCall(message.body)
        }
        else if(message.type=="createDesc") {
            console.log("disc")
            createDesc(message.body)
        }
        else if(message.type=="getDesc"){
            function getDesc(){
                request = {};
                request.type='sendDesc';
                request.body=[];
                descCall.find((err, user) => {
                    user.forEach(function (item) {
                        request.body.push(item)

                    })
                }).then(()=>{
                    ws.send(JSON.stringify(request));
                })
            }
            getDesc()
        }
        else{
            console.log('err')
        }
    });
    function createDesc(arr) {
descCall.remove(function(err, result){
    if(err) return console.log(err);
}).then(()=>{
    arr.forEach(function (item) {
        let desc = new descCall({ tell: item.tell, desc:item.desc})
        desc.save((err, call) => {
            if (err) {
                console.log('err', err)
            }
            console.log('saved desc', call)
        })
    })
});
    }
    function getCall(time){
        request = {};
        request.type='sendCall';
        request.miss=[];
        request.all=[];
        missingsCall.find({$or:[{type: 1}, {type: 2}], time: {$gt : time.start, $lt: time.end}},(err, user) => {
            user.forEach(function (item) {
                item.desc = "-";
                descCall.find({tell: item.tell},(err, user) => {
                    user.forEach(function (item2) {
                        item.desc = item2.desc
                    })
                })
                request.miss.push(item)
            })
        }).then(()=>{
            allCall.find({$or:[{type: 1}, {type: 2}], time: {$gt : time.start, $lt: time.end}},(err, user) => {
                user.forEach(function (item) {
                    request.all.push(item)
                })

            }).then(()=>{
                ws.send(JSON.stringify(request));
            })
        })
    }
    console.log('conn')
});

