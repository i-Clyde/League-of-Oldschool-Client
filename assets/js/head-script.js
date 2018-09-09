const {remote} = require('electron');
var fs = require('fs');
const BrowserWindow = remote.BrowserWindow;
var win = BrowserWindow.getAllWindows()[0];
var appRoot = require('app-root-path');
var http = require('http');
var https = require('https');
var mkdirp = require('mkdirp');
var gamePath = appRoot.path + '\\..\\Game\\';
var gameLolPath = appRoot.path + '\\..\\Game\\LeagueOfLegends\\';
const extract = require('extract-zip')

if (localStorage.getItem('resolution') == null) {
  win.setSize(1024, 576); win.center();
  localStorage.setItem('resolution', '1');
}

$( document ).ready(function() {
    win.setAlwaysOnTop(true);
    win.focus();
    win.setAlwaysOnTop(false);

    $('html').fadeIn(1100);
    $('html, body').animate({ 'opacity': '1' }, 1100);
    $('.login-bar').animate({'right': '0px'}, 1100);

    if (localStorage.getItem('termsofuse') == 'true') {} else {$('.termsofuse_modal').modal({backdrop: 'static', keyboard: false})};

    var resolution_setting = localStorage.getItem('resolution');
    if (resolution_setting == null) {
      $(".resolution > option[value='1']").attr("selected", "selected");
    } else if (resolution_setting == 1) {
      $(".resolution > option[value='1']").attr("selected", "selected");
      win.setSize(1024, 576); win.center();
    } else if (resolution_setting == 2) {
      $(".resolution > option[value='2']").attr("selected", "selected");
      win.setSize(1280, 720); win.center();
    } else if (resolution_setting == 3) {
      $(".resolution > option[value='3']").attr("selected", "selected");
      win.setSize(1600, 900); win.center();
    }

    $( ".resolution" ).change(function() {
      var selected = $(".resolution option:selected").val();
      if (selected == '1') {
        win.setSize(1024, 576); win.center();
        localStorage.setItem('resolution', '1');
      } else if (selected == '2') {
        win.setSize(1280, 720); win.center();
        localStorage.setItem('resolution', '2');
      } else if (selected == '3') {
        win.setSize(1600, 900); win.center();
        localStorage.setItem('resolution', '3');
      }
    });

});

const io = require('socket.io-client');
var socket = io('http://iclyde.ddns.net:3000/', {forceNew: true}), scnsts = true, idnonq = true;

var exitTimerInterval, reconnected = false;
function startExitTimer() {
  var i=5; $('.lostconnectionmodal .lcmcd').html('('+i+')');
  exitTimerInterval = setInterval(() => {
    if (reconnected) clearInterval(exitTimerInterval);
    i--;
    $('.lostconnectionmodal .lcmcd').html('('+i+')');
    if (i==0) {
      clearInterval(exitTimerInterval)
      $('.lostconnectionmodal .lcmbtn').removeAttr('disabled');
      $('.lostconnectionmodal .lcmcd').html('');
    }
  }, 1000);
}

socket.on('disconnect', function(){
  $('.lostconnectionmodal').modal({backdrop: 'static', keyboard: false});
  reconnected = false; startExitTimer(); scnsts = false;
})

socket.on('reconnect', function(){
  $('.lostconnectionmodal').modal('toggle');
  $('.lostconnectionmodal .lcmbtn').attr('disabled', 'disabled');
  reconnected = true; socket.emit('connecl'); scnsts = true;
})

// Check if socket connected to the server
socket.emit('connecl');
setTimeout(() => {
  if (!socket.connected) {
    $('#account-2').off('click');
    $('#login-input').attr('disabled', 'disabled');
    $('#password-input').attr('disabled', 'disabled');
    $('#remember-input').attr('disabled', 'disabled');
    $('.connectionstatus-error').show();
    $('.connectionstatus-error b').text('You are offline!')
    scnsts = false;
    socket.on('connect', function(){
      register_turn_on_trigger_click();
      if (!idnonq) {
        $('#login-input').removeAttr('disabled');
        $('#password-input').removeAttr('disabled');
      }
      $('#remember-input').removeAttr('disabled');
      $('.connectionstatus-error').animate({'opacity': 0}, function(){
        $('.connectionstatus-error').hide()
      })
      scnsts = true;
      if (localStorage.getItem('remember_checkbox') == 'true') $('#password-input').focus(); else $('#login-input').focus();
    })
  }
}, 100) // Timeout for DOM load on slower pc's

$(() => {
  if (idnonq) {
    $('#submit-log').tooltip({title: 'You cannot play without game files, please wait!'})
  }
})

// Download the game
if (!fs.existsSync(gamePath + 'app.settings')) {
  idnonq = true;
  mkdirp(gamePath, function(err) {
    if (err) {
      $('<div class="alerts error">There was an error during the game download, please restart the app!<br>You cannot login during the download</div>').appendTo('.login-alerts');
      $('.alerts.error').animate({'opacity': '1'}, 'slow').delay(10000).fadeOut('slow', function(){ $('.alerts.error').remove(); });
      console.log(err); return false}

    var file = fs.createWriteStream(gamePath + 'game.zip');
    var request = http.get("http://145.239.84.192/LeagueOfLegends.zip", function(response) {

      var sizes = ['Bytes', 'KB', 'MB', 'GB'], i;

      $('<div class="alerts info">Game is downloading, please wait!<br>You cannot login during the download</div>').appendTo('.login-alerts');
      $('.alerts.info').animate({'opacity': '1'}, 'slow').delay(10000).fadeOut('slow', function(){ $('.alerts.info').remove(); });
      response.pipe(file);

      var content_length = 0;
      var content_length_bytes = 0;
      var downloaded_bytes = 0;

      function outputInfo() {
        percent = parseInt((downloaded_bytes / content_length_bytes) * 100);
        downloaded = Math.round(downloaded_bytes * 100 / Math.pow(1024, i), 2) / 100 + ' ' + sizes[i];
        $('#submit-log').text(percent + '%\t - ' + downloaded + ' / ' + content_length);
      }

      content_length = response.headers['content-length'];
      content_length_bytes = response.headers['content-length'];
      i = parseInt(Math.floor(Math.log(content_length) / Math.log(1024)));
      content_length = Math.round(content_length * 100 / Math.pow(1024, i), 2) / 100 + ' ' + sizes[i];

      response.on('data', function(data) {
        downloaded_bytes += data.length;
        i = parseInt(Math.floor(Math.log(downloaded_bytes) / Math.log(1024)));
        outputInfo();
      });

      response.on('end', function() {
        file.close();
        $('<div class="alerts success">Game successfully downloaded, preparing...<br>Please do not close the window!</div>').appendTo('.login-alerts');
        $('.alerts.success').animate({'opacity': '1'}, 'slow').delay(10000).fadeOut('slow', function(){ $('.alerts.success').remove(); });
        $('#submit-log').tooltip('dispose')
        $('#submit-log').tooltip({title: 'This is the last phase of download (it can take some minutes)!'})
        $('#submit-log').text('Extracting game files...');

        extract(gamePath + 'game.zip', {dir: gamePath}, function (err) {
          fs.writeFile(gamePath + 'app.settings', 'Please, do not delete this file. Otherwise little cat will die!!!', err => console.log(err));
          fs.unlink(gamePath + 'game.zip');
          idnonq = false;
          if (Boolean(scnsts)) {
            $('#login-input').removeAttr('disabled');
            $('#password-input').removeAttr('disabled');
          }
          $('#submit-log').tooltip('disable').removeAttr('title', 'data-original-title', 'data-toggle').html('<b>SIGN IN</b>');
        })

      });
    });

  });

} else {
  idnonq = false;
  $('#submit-log').tooltip('dispose')
  if (Boolean(scnsts)) {
    $('#login-input').removeAttr('disabled');
    $('#password-input').removeAttr('disabled');
  }
}

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
