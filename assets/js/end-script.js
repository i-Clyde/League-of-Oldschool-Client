$('.login-bar').animate({'right': '0px'}, "slow");

// Load title bar (close, minimalize, center, settings menu)
$('.body_head').load('./global/titlebarandoptions.html', function(){
  $('#center-btn').on('click', function(e) {
    win.center();
  });

  $('#min-btn').on('click', function(e){
    win.minimize();
  });

  $('#close-btn').on('click', function(e){
    $('.exit_confirm').modal();
    $('button[data-dismiss=exit_exit_confirm]').on('click', function(){
      $('.exit_confirm').modal('toggle');
    })
  });
  settings_turn_trigger_click();

  $('[data-exitbtn="yeah"]').on('click', function() {
    $('html, body').animate({ 'opacity': '0' }, 700);$('.login-bar').animate({'right': '270px'}, 1100, function(){win.close()});
  })

});

// var x = 'false';
//
// function logged_in(x) {
//   $('#main-client').empty();
//
// }

// Login page (first to see)
$('#main-client').append("<div id='login-page'></div>")
$('#login-page').load('./unique/login.html', function loadLoginPage(){});

// After close client clear local storage
$(window).on("unload", function() {

  localStorage.removeItem('login');
  localStorage.removeItem('nickname');
  localStorage.removeItem('playerid');
  localStorage.removeItem('iconid');
  localStorage.removeItem('ownedicons');
  localStorage.removeItem('friendsid');
  localStorage.removeItem('token');
  localStorage.removeItem('canplay');
  localStorage.removeItem('gameport');
  localStorage.removeItem('gametoken');
  localStorage.removeItem('isingame');
  localStorage.removeItem('mygamepid');

  // var data = sessionStorage.getItem('key');
  // sessionStorage.removeItem('key');
  // localStorage.clear();
})
