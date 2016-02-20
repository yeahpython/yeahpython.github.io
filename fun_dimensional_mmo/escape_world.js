var hangoutLink = "https://talkgadget.google.com/hangouts/_/iijly5vlrnjjfq326nic6o45gua";

var usersRef = new Firebase("https://escape-world.firebaseio.com/users/");

function getMessageId(snapshot) {
  return snapshot.key().replace(/[^a-z0-9\-\_]/gi,'');
}

// code from stackOverflow.
function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

// code from StackOverflow.
function intToRGB(i){
    var c = (i & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}

function colorFromID(id) {
  return intToRGB(hashCode(id));
}

usersRef.on("child_added", function(snapshot) {
	var val = snapshot.val().position;
	var userdiv = $("<div/>")
		.attr("id", getMessageId(snapshot))
		.addClass("person")
		.css({"left": val.x,
	        "top": FIXED_HEIGHT,
          "opacity": 0})
		.appendTo("#users")
    .fadeTo(400, 1);
  var icon = $("<span/>")
    .addClass("icon")
    .css("background-color", colorFromID(getMessageId(snapshot)))
    .html("")
    .appendTo(userdiv);
  if (getMessageId(snapshot) == my_id) {
    $(icon).addClass("me");
  }
  $("<span/>")
    .addClass("options")
    .html("chat")
    .hide()
    .appendTo(userdiv);

  var targetLocation = $("<div/>")
    .addClass("targetLocation")
    .appendTo(userdiv);
  $("<div/>").addClass("xCoordinate").appendTo(targetLocation);
  $("<div/>").addClass("yCoordinate").appendTo(targetLocation);
  cacheUserPosition(snapshot.key(), val);

  if (getMessageId(snapshot) == my_id) {
    console.log("starting conversation this way.");
    startConversationWith(my_id);
  }
});

function getPositionFromId(id) {
  var left = $("#" + id)[0].style.left;
  var top = $("#" + id)[0].style.top;
  left = left.replace(/[^0-9\.\-]/gi,'');
  top = top.replace(/[^0-9\.\-]/gi,'');
  return {x:Number(left), y:Number(top)};
}

function cacheUserPosition(id, position) {
  $("#" + id + " > .targetLocation > .xCoordinate").html(position.x);
  $("#" + id + " > .targetLocation > .yCoordinate").html(position.y);
}

function recenterChatPosition(conversation_id, time) {
  console.log(time);
  var n = 0;
    var newleft = 0;
    var newbottom = 0;
    $("#" + conversation_id + "> .participants > div").each(function(index){
      n += 1;
      var id = $(this).text();
      newleft += Number($("#" + id + " > .targetLocation > .xCoordinate").html());
      newbottom += Number($("#" + id + " > .targetLocation > .yCoordinate").html());
    });
    if (n == 0) {
      console.log("found no participants")
    } else {
      newleft /= n;
      newbottom /= n;
    }
    console.log("newleft: " + newleft);
    // give the conversation a new target on the page.
    // $("#" + conversation_id).stop().animate({"left": newleft, "bottom": -1 * newbottom}, {duration: time})
    $("#" + conversation_id).stop().animate({"left": newleft, "bottom": "50%"}, {duration: time})
}

function animateMotionTo(position, id) {
  cacheUserPosition(id, position);
  var val = position;
  var current_x = $("#" + id)[0].style.left;
  var current_y = $("#" + id)[0].style.top;

  // get rid of px
  current_x = current_x.replace(/[^0-9\.\-]/gi,'');
  current_y = current_y.replace(/[^0-9\.\-]/gi,'');

  var dx = val.x - current_x;
  var dy = val.y - current_y;

  var distance = Math.sqrt(dx * dx + dy * dy);

  var user = $("#" + id);
  user.stop(true);
  user.animate({"left": val.x,
              "top": FIXED_HEIGHT,//val.y
              "opacity": 1}, {duration:distance * 3, easing: "swing", step: function(){
                user.css("zIndex", ~~(user[0].style.top.slice(0, -2)))
              }});
  return distance;
}

// There's a bad assumption here that the change is the user moving, where in fact it may be the addition of a new chat.
usersRef.on("child_changed", function(snapshot){
	var val = snapshot.val().position;
  //cacheUserPosition(snapshot.key(), val);
  var distance = animateMotionTo(val, getMessageId(snapshot));
  // need to animate associated chat as well
  var conversation_id = snapshot.val().activeConversation;
  if (conversation_id !== undefined) {
    var time;
    if (distance == 0) {
      // when the change is that we're posting in a conversation for the first time, we move ourself to the conversation
      time = 400;
    } else {
      time = distance * 3;
      // otherwise the conversation moves with us
      console.log("recentering 3");
      recenterChatPosition(conversation_id, time);
    }
  }
});

usersRef.on("child_removed", function(snapshot){
  // todo: Don't remove own icon
  $("#" + getMessageId(snapshot))
    .fadeTo(400, 0, function(){
      $("#" + getMessageId(snapshot)).remove()});
});

var myUserRef = usersRef.push();
var my_id = myUserRef.key();
myUserRef.child('position').set({
  x: 50,
  y: 50,
  zIndex: 50
});


$("#backdrop, #users").click(function (e) {
  if (e.target.id == "backdrop" || e.target.id == "users") {
    /*if (activeConversation != "") {
      leaveCurrentConversation();
    }*/
    if (activeConversation == "" || true) {
      // we're not in a conversation, so we control our own movement.
      myUserRef.child('position').set({
        x: e.pageX - $("#users").position().left,
        y: e.pageY - $("#users").position().top,
      });
    } else {
      // We control the movement of the conversation, which will in turn modify the participants' locations.

      chatsRef.child(activeConversation).child('position').set({
        x: e.pageX - $("#users").position().left,
        y: e.pageY - $("#users").position().top
      });
    }
  }
});

function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}
/*
// when we mouseover the icon, the options expand out.
$("#users").delegate(".icon", "mouseover", function(e) {
  if (e.target.parentElement.id == my_id) {
    $("#" + e.target.parentElement.id + " .options")
        .show(200);
  }
});

$("#users").delegate(".options", "mouseleave", function(e) {
  $(e.target).hide(200);
});
*/

function expandConversation(id, time) {
  var conversation = $("#" + id);
  conversation.children(".messages").show(time);
  conversation.children("input").show(time);
  conversation.animate({"border-radius": 10, "padding":"20px"}, time);
}

$("#chats").delegate(".conversation", "mouseover", function(e) {
  if ($(e.target).hasClass("conversation")) {
    expandConversation(e.target.id, 200);
  }
})

function hideConversation(id, time) {
  var conversation = $("#" + id);
  conversation.children(".messages").hide(time);
  conversation.children("input").hide(time);
  conversation.animate({"border-radius": 5, "padding":"5px"}, time);
}

$("#chats").delegate(".conversation", "mouseleave", function(e) {
  if ($(e.target).hasClass("conversation") && (e.target.id !== activeConversation)) {
    hideConversation(e.target.id, 200);
  }
})
var FIXED_HEIGHT = "10px";
var chatsRef = new Firebase("https://escape-world.firebaseio.com/chats/");

function startConversationWith(id) {
  var requestRef = usersRef.child(id).child("requests").push(hangoutLink);

  var pos1 = getPositionFromId(my_id);
  var pos2 = getPositionFromId(id);

  var activeParticipants = {};
  activeParticipants[my_id] = true;
  var chat = chatsRef.push();
  chat.set({
    position: {x: (pos1.x + pos2.x)/2, y: (pos1.y + pos2.y)/2},
    activeParticipants: activeParticipants
  }, function(e){
    if (e == null) {
      addReferencesToConversation(chat.key());
    } else {
      console.log("Could not connect to server.");
    }
  });
  registerForAutoRemoval();
}

/*$("#start_chat").on("click", function(e) {
  startConversationWith(my_id);
});*/

var connectedRef = new Firebase("https://zfzcet128r5.firebaseio-demo.com//.info/connected");

function registerForAutoRemoval() {
  if (activeConversation !== "") {
    console.log("Registering to remove self from [" + activeConversation + "] upon disconnect");
    chatsRef.child(activeConversation).child("activeParticipants").child(my_id).onDisconnect().remove();
  }
}

connectedRef.on("value", function(isOnline) {
  if (isOnline.val()) {
    // If we lose our internet connection, we want ourselves removed from the list.
    myUserRef.onDisconnect().remove();
    registerForAutoRemoval();
  }
});

// Fills a message container with messages taken from a snapshot.
function populate(messageContainer, snapshot) {
  snapshot.child("messages").forEach(function(childSnapshot){
    var messagerow = $("<div/>")
       .appendTo(messageContainer);
    var message = $("<div/>")
      .html(childSnapshot.val().message)
      .css("background-color", colorFromID(childSnapshot.val().sender))
      .appendTo(messagerow);
    if (childSnapshot.val().sender == my_id) {
      message.addClass("my message");
      messagerow.addClass("mymessagecontainer");
    } else {
      message.addClass("their message");
      messagerow.addClass("theirmessagecontainer");
    }
  });
  $("<div/>")
    .html("n = "+snapshot.child("activeParticipants").numChildren())
    .addClass("debug")
    .appendTo(messageContainer);
}

// Renders a fresh new chatbox when a new conversation is added
chatsRef.on("child_added", function(snapshot) {
  if (snapshot.child("activeParticipants").numChildren() == 0) {
    console.log("removing chat as there are no participants.")
    chatsRef.child(getMessageId(snapshot)).remove();
  }
  var chatbox = $("<div/>")
    .attr("id", getMessageId(snapshot))
    .addClass("conversation")
    .css({"left": snapshot.val().position.x,
          "bottom": snapshot.val().position.y * -1,
          "z-index": snapshot.val().position.y}) // This kind of placing will soon be deprecated.
    .appendTo($("#chats"));
  var messageContainer = $("<div/>")
    .addClass("messages")
    .html("")
    .appendTo(chatbox);
  var participantsContainer = $("<div/>")
    .addClass("participants")
    .html("")
    .appendTo(chatbox);
  populate(messageContainer, snapshot);
  cacheParticipants(snapshot);
  console.log("recentering 1")
  recenterChatPosition(getMessageId(snapshot), 0);
  $("<input type='text' name='fname'>")
    .appendTo(chatbox);
  hideConversation(getMessageId(snapshot), 0);
  console.log(getMessageId(snapshot));
});

var activeConversation = "";

function setMyActiveConversation(chat_id) {
  // update the chat object
  // Add my_id to the list of participants associated with chat_id
  chatsRef.child(chat_id).child("activeParticipants").child(my_id).set(true);

  addReferencesToConversation(chat_id);
}

function leaveCurrentConversation(){
  chatsRef.child(activeConversation).child("activeParticipants").child(my_id).remove();
}

function addReferencesToConversation(chat_id) {
  // update the user and associated local variables
  // set my active conversation to chat_id
  myUserRef.child("activeConversation").set(chat_id);
  // Remove my_id from the previous chat if it used to be a different one.
  if (activeConversation !== "" && activeConversation !== chat_id) {
    leaveCurrentConversation();
    //startConversationWith(my_id);
    //chatsRef.child(activeConversation).child("activeParticipants").child(my_id).remove();
  }
  // Cache the active conversation id.
  activeConversation = chat_id;
  // Ensure that my_id is removed from chats when I disconnect
  registerForAutoRemoval();
}

// Rule for adding chat messages
$("#chats").delegate("input", "keypress", function(e) {
  if (e.which == 13) {
    // (A) update participant counts so that the message doesn't instantly disappear
    setMyActiveConversation(e.target.parentElement.id);

    // (B) update the message list (inducing a new change everywhere again)
    e.preventDefault();
    chatsRef.child(e.target.parentElement.id).child("messages").push({
      message: e.target.value,
      sender: my_id,
      time: Firebase.ServerValue.TIMESTAMP
    });
    var new_x = $("#" + activeConversation)[0].style.left.slice(0, -2);
    var new_y = $("#" + my_id)[0].style.top.slice(0, -2);
    animateMotionTo({x: new_x, y:new_y}, my_id);
    //console.log("recentering 2");
    //recenterChatPosition(e.target.parentElement.id, 400);
    console.log("sent message: " + e.target.value);
    e.target.value = "";
  }
});

/*function moveGroup(snapshot) {
  console.log("moving!");
  var n = snapshot.child("activeParticipants").numChildren();
  snapshot.child("activeParticipants").forEach(function(childSnapshot){
    chatsRef.child(getMessageId(childSnapshot)).position.set(snapshot.position.val());
  });
  recenterChatPosition(getMessageId(snapshot), 400);
}*/

function cacheParticipants(snapshot) {
  var participantsContainer = $("#" + getMessageId(snapshot))
      .children(".participants")
      .html("");
    snapshot.child("activeParticipants").forEach(function(childSnapshot){
      $("<div/>")
        .html(childSnapshot.key())
        .appendTo(participantsContainer);
    });
}

// When a conversation is changed, re-render the conversation
chatsRef.on("child_changed", function(snapshot){
  // If all participants have left the room, delete the room.
  if (snapshot.child("activeParticipants").numChildren() == 0) {
    console.log("removing chat as there are no participants.")
    chatsRef.child(getMessageId(snapshot)).remove();
  } else {
    //
    var messageContainer = $("#" + getMessageId(snapshot))
      .children(".messages")
      .html("");
    populate(messageContainer, snapshot);
    // todo: only do computations when participants change
    recenterChatPosition(getMessageId(snapshot), 1000)
    //moveGroup(snapshot);
    cacheParticipants(snapshot);
  }
});

chatsRef.on("child_removed", function(snapshot){
  var id = getMessageId(snapshot);
  // animation may get interrupted...
  $("#" + id).animate({borderRadius:0, padding:0}, 200, "swing", function(){$("#" + id).remove()});
})




