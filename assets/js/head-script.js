const {remote} = require('electron');

if (localStorage.getItem('resolution') == null) {
  remote.getCurrentWindow().setSize(1024, 576);
  remote.BrowserWindow.getFocusedWindow().center();
  localStorage.setItem('resolution', '1');
}

$( document ).ready(function() {
    // $('html, body').animate({ 'background-color': 'rgba(23, 23, 23, 1)' }, 1000);
    $('html, body').animate({ 'opacity': '1' }, 700);
    $('.login-bar').animate({'right': '0px'}, 1100);

    if (localStorage.getItem('termsofuse') == 'true') {} else {$('.termsofuse_modal').modal({backdrop: 'static', keyboard: false})};

    var resolution_setting = localStorage.getItem('resolution');
    if (resolution_setting == null) {
      $(".resolution > option[value='1']").attr("selected", "selected");
    } else if (resolution_setting == 1) {
      $(".resolution > option[value='1']").attr("selected", "selected");
      remote.getCurrentWindow().setSize(1024, 576);
      remote.BrowserWindow.getFocusedWindow().center();
    } else if (resolution_setting == 2) {
      $(".resolution > option[value='2']").attr("selected", "selected");
      remote.getCurrentWindow().setSize(1280, 720);
      remote.BrowserWindow.getFocusedWindow().center();
    } else if (resolution_setting == 3) {
      $(".resolution > option[value='3']").attr("selected", "selected");
      remote.getCurrentWindow().setSize(1600, 900);
      remote.BrowserWindow.getFocusedWindow().center();
    }

    $( ".resolution" ).change(function() {
      var selected = $(".resolution option:selected").val();
      if (selected == '1') {
        remote.getCurrentWindow().setSize(1024, 576);
        remote.BrowserWindow.getFocusedWindow().center();
        localStorage.setItem('resolution', '1');
      } else if (selected == '2') {
        remote.getCurrentWindow().setSize(1280, 720);
        remote.BrowserWindow.getFocusedWindow().center();
        localStorage.setItem('resolution', '2');
      } else if (selected == '3') {
        remote.getCurrentWindow().setSize(1600, 900);
        remote.BrowserWindow.getFocusedWindow().center();
        localStorage.setItem('resolution', '3');
      }
    });

});

const io = require('socket.io-client');
var socket = io('http://localhost:3000', {forceNew: true});

socket.on('disconnect', function(){
  $('.lostconnectionmodal').modal({backdrop: 'static', keyboard: false});

  var reconnected = false;
  socket.on('reconnect', function(){
    $('.lostconnectionmodal').modal('toggle');
    reconnected = true; i=null, interval=null;
    $('.lostconnectionmodal .lcmbtn').attr('disabled', 'disabled')
  })

  var i=5; $('.lostconnectionmodal .lcmcd').html('('+i+')');
  var lsin = setInterval(() => {
    if (reconnected) clearInterval(lsin)
    i--;
    $('.lostconnectionmodal .lcmcd').html('('+i+')');
    if (i==0) {
      clearInterval(lsin)
      $('.lostconnectionmodal .lcmbtn').removeAttr('disabled');
      $('.lostconnectionmodal .lcmcd').html('');
    }
  }, 1000);

})

// Check if socket connected to the server
setTimeout(() => {
  if (!socket.connected) {
    $('#account-2').off('click');
    $('#login-input').attr('disabled', 'disabled');
    $('#password-input').attr('disabled', 'disabled');
    $('#remember-input').attr('disabled', 'disabled');
    $('.connectionstatus-error').show();
    $('.connectionstatus-error b').text('You are offline!')
    socket.on('connect', function(){
      register_turn_on_trigger_click();
      $('#login-input').removeAttr('disabled');
      $('#password-input').removeAttr('disabled');
      $('#remember-input').removeAttr('disabled');
      $('.connectionstatus-error').animate({'opacity': 0}, function(){
        $('.connectionstatus-error').hide()
      })
      if (localStorage.getItem('remember_checkbox') == 'true') $('#password-input').focus(); else $('#login-input').focus();
    })
  }
}, 100) // Timeout for DOM load on slower pc's

function settings_turn_trigger_click() {
  $('#settings-btn').on('click', function(e){
    $('.settings').modal()
  });
}

function sound_newmsg_play() {
  var sound_newmsg = new Audio('../assets/sounds/newmsg.mp3');
  sound_newmsg.play();
  delete sound_newmsg;
}

function sound_dash_title() {
  var sound_dash_title = new Audio('../assets/sounds/dashtitle.wav');
  sound_dash_title.play();
  delete sound_dash_title;
}

var music_blind_pick = new Audio('../assets/sounds/blindpick.mp3');

let tick = 0;
function sound_tick_and_tock() {
  if (tick == 0) {
    var sound_tick = new Audio('../assets/sounds/tick.wav');
    sound_tick.play();
    delete sound_tick;
    tick = 1;
  } else {
    tick = 0;
    var sound_tock = new Audio('../assets/sounds/tock.wav');
    sound_tock.play();
    delete sound_tock;
  }
}
