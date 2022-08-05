
import User from "../models/user/user.model";
import ViewController from "../controllers/view/view.controller";
import BookingController from "../controllers/booking/booking.controller";
import UserController from "../controllers/user/user.controller";
import OrderController from "../controllers/order/order.controller";
import PostController from "../controllers/post/post.controller";
import LiveController from "../controllers/live/live.controller";
var Message = require('../models/message/message.model');
var MessageController = require('../controllers/message/messageController');

module.exports = {

    startChat: function (io) {  
        console.log('socket is on')
        
        var nsp = io.of('/beautiNova'); //namespace

        nsp.on('connection', async(socket) => { 
               nsp.emit('hi', 'Hello everyone!'); 
            var myId = socket.handshake.query.id
           
            var roomName = 'room-' + myId; 
            socket.join(roomName); 
            console.log('client ' + myId + ' connected.');

            var clients1 = nsp.allSockets()//old is nsp.clients();             
            socket.userId = myId; 
            console.log("socket: "+socket.userId);
            var clients=[];
            for (var id in clients1.connected) { 
                var userid= clients1.connected[id].userId;
                clients.push(userid);
            }
            
            var onlineData={
                id: myId,
                users : clients
            };
            MessageController.getOnlineUsers(nsp,onlineData);
            await User.findByIdAndUpdate(myId, {lastSeen:Date.parse(new Date()),online:true}, { new: true });
            
            /*Product.find({deleted:false,quantity:{$lte:0}})
            .then(async(data)=>{
                data.map(async(e) =>{
                    Product.findByIdAndUpdate(e.id,{visible:false,available:false},{new:true}).then((docs)=>{
                        console.log('done update product')
                      
                    }).catch((err)=>{
                        console.log(err);
                    })
                })
            })*/
            socket.on('AddComment', function (data) { 
                console.log(data);
                LiveController.AddComment(io, nsp, data,socket);
            });
            socket.on('view', function (data) { 
                console.log(data);
                ViewController.view(io, nsp, data);
            });
            socket.on('compare', function (data) { 
                console.log(data);
                ViewController.compare(io, nsp, data);
            });
            socket.on('getArtists', function (data) { 
                console.log(data);
                ViewController.getArtists(io, nsp, data);
            });
            socket.on('Statistics', function (data) { 
                console.log(data);
                UserController.statisticsSocket(socket,data,nsp);
            });
            socket.on('Explore', function (data) { 
                console.log(data);
                UserController.exploreSocket(socket,data,nsp,socket.userId);
            });
            socket.on('orderRate', function (data) { 
                console.log(data);
                OrderController.getOrderToRate(socket,nsp,data);
            });
            socket.on('AddBooking', function (data) { 
                console.log(data);
                BookingController.AddBooking(socket,data,nsp);
            });
            socket.on('CancelRequest', function (data) { 
                console.log(data);
                BookingController.CancelRequest(socket,nsp,data);
            });
            socket.on('RejectRequest', function (data) { 
                console.log(data);
                BookingController.rejectSocket(socket,nsp,data);
            });
            socket.on('AcceptRequest', function (data) { 
                console.log(data);
                BookingController.acceptSocket(socket,nsp,data);
            });
            socket.on('DayTimes', function (data) { 
                console.log(data);
                BookingController.dayBookingSocket(socket,data,nsp);
            });
            socket.on('importFromInsta', function (data) { 
                console.log(data);
                PostController.importInstagram(socket,nsp,data);
            });
            socket.on('newMessage', function (data) { 
                console.log(data);
                MessageController.addnewMessage(io,nsp,data);
            });
            socket.on('seen',function(data){
                data.myId = myId;
                console.log("in server in seeen")
                MessageController.updateSeenSocket(nsp,data);

            });
            socket.on('searchMsg',function(data){
                data.myId = myId;
                console.log("in server in seeen")
                MessageController.searchMsg(nsp,data);

            });

            socket.on('typing', function (data) { 
                var toRoom = 'room-' + data.toId;
                nsp.to(toRoom).emit('typing', data);
            });


            socket.on('stopTyping', function (data) {
                var toRoom = 'room-' + data.toId;
                nsp.to(toRoom).emit('stopTyping', data);
            });


            socket.on('online',function(){
                var check = true; 
                MessageController.changeStatus(socket,{id: myId},check);
                console.log('user is online')
            });

            socket.on('offline',function(){
                var check = false;
                MessageController.changeStatus(socket,{id: myId},check);
                console.log('user is offline')
            });
            
            socket.on('disconnect', async(reason) =>{
                var check = false;
                console.log(`socket ${socket.id} disconnected because: ${reason}`)
                MessageController.changeStatus(socket,{id: myId},check);
                nsp.emit('clientDisconnected',{id: myId})
            });

            
          
        });
    },
    startNotification : function(io){
        global.notificationNSP = io.of('/notification') ; 
        notificationNSP.on('connection',function(socket){
            var id = socket.handshake.query.id;
            var roomName = 'room-' + id;
            socket.join(roomName);
            console.log('client ' + id + ' connected on notification .');
        });
    }
}