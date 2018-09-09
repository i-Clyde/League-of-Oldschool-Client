  // Input remembered username and check checkbox
  var checkbox_status = localStorage.getItem('remember_checkbox');
  var last_login = localStorage.getItem('remember_login');
  if (checkbox_status === 'true') {
    $('#remember-input').prop('checked', 'checked');
    $('#login-input').val(last_login);
    $('#login-input').removeAttr('autofocus');
    $('#password-input').prop('autofocus', 'autofocus');
    $('#password-input').focus();
  } else {
    $('#login-input').focus();
  }

  // Swap between register & login
  var scene = 'login';
  function register_turn_on_trigger_click() {
    $('#account-2').on('click', function() {
      $(".log-inputs").animate({left: '-270px'}, "slow", function(){
        $(".login-bar").animate({'padding-top': '30px'}, "slow");
        $(".reg-inputs").animate({left: '15px'}, "slow");
      });
      $("#submit-log").animate({left: '-270px'}, "slow", function(){
        $("#submit-reg").animate({left: '0'}, "slow");
      });
      $('#account-2').animate({'opacity': '0'}, "fast", function(){
        $('#account-2').animate({'left': '-270px'}, "fast", function(){
          $('.back-to-login').animate({'opacity': '1', 'left': '15px'});
        });
      });
      $('#account-1').animate({'opacity': '0'}, "fast", function(){
        $('#account-1').animate({'left': '-270px'}, "fast");
      });
      scene = 'register';
    });
  } register_turn_on_trigger_click();
  function back_to_login_turn_on_trigger_click() {
    $('.back-to-login').on('click', function(){
      $(".reg-inputs").animate({left: '-270px'}, "slow", function(){
        $(".login-bar").animate({'padding-top': '10%'}, "slow");
        $(".log-inputs").animate({left: '15px'}, "slow");
      });
      $("#submit-reg").animate({left: '-270px'}, "slow", function(){
        $("#submit-log").animate({left: '0'}, "slow");
      });
      $('.back-to-login').animate({'opacity': '0'}, "fast", function(){
        $('.back-to-login').animate({'left': '-270px'}, "fast", function(){
          $('#account-1, #account-2').animate({'opacity': '1', 'left': '15px'});
        });
      });
      scene = 'login';
    });
  } back_to_login_turn_on_trigger_click();

  // Check if fields are filled (login & register)
    //Register
    // // TODO: Add better (alerts for wrong queries while typing)
    var nickpattern = false, registerProcess = false;
    $('#login-reg-input').on('keyup', function() {
      var patternick = /^[a-zA-Z0-9]*$/;
      if (patternick.test($('#login-reg-input').val())) {
        $('#span-reg-username').text("");
        $('#login-reg-input').css('border', '1px #b7a64c solid');

        if (($('#login-reg-input').val().length < 3) && ($('#login-reg-input').val().length != 0)) {
          $('#span-reg-username').text("Too short!");
          $('#login-reg-input').css('border', '1px solid red');
          nickpattern = false;
        } else if (($('#login-reg-input').val().length > 20) && ($('#login-reg-input').val().length < 30)) {
          $('#span-reg-username').text("Too long!");
          $('#login-reg-input').css('border', '1px solid red');
          nickpattern = false;
        } else if (($('#login-reg-input').val().length >= 30)) {
            $('#span-reg-username').text("Too too long...");
            $('#login-reg-input').css('border', '1px solid red');
            nickpattern = false;
        } else {
          $('#span-reg-username').text("");
          $('#login-reg-input').css('border', '1px #b7a64c solid');
          nickpattern = true;
        }

      } else {
        $('#span-reg-username').text("Unacceptable Chars!");
        $('#login-reg-input').css('border', '1px solid red');
        nickpattern = false;
      }
    });
    $('.reg-inputs input[type="text"], .reg-inputs input[type="password"], .reg-inputs input[type="email"], #remember-reg-input').on('keyup change', function(){
      if ( ($('#login-reg-input').val().length >= 3) && ($('#email-reg-input').val().length >= 4) && ($('#password-reg-input').val().length >= 6) && ($('#password-reg-input2').val().length >= 6) && (
        $('#remember-reg-input').is(':checked')) && nickpattern) {
        function isEmail(email) {
          var epattern = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
          return epattern.test(email);
        }
        if (isEmail($('#email-reg-input').val())){
          if ( $('#password-reg-input').val() == $('#password-reg-input2').val() ) {
            $('#span-reg-password2').text("");
            $('#password-reg-input').css('border', '1px solid #b7a64c');
            $('#password-reg-input2').css('border', '1px solid #b7a64c');
            $("#submit-reg").removeAttr("disabled");
            registerProcess = true;
          } else {
            $("#submit-reg").attr("disabled", "disabled");
            $('#span-reg-password2').text("Not match!");
            $('#password-reg-input').css('border', '1px solid red');
            $('#password-reg-input2').css('border', '1px solid red');
            registerProcess = false
          }
          $('#email-reg-input').css('border', '1px solid #b7a64c');
          $('#span-reg-email').text("");
        } else {
          $("#submit-reg").attr("disabled", "disabled");
          $('#span-reg-email').text("Looks like not valid!");
          $('#email-reg-input').css('border', '1px solid red');
          registerProcess = false
        }
      } else {
        $("#submit-reg").attr("disabled", "disabled");
        registerProcess = false
      }
    });

    // Login
    // // TODO: Nick, password check before login
    var lss = false;
    $('#login-input, #password-input').on('keyup', function(){
      if (($('#login-input').val().length >= 3) && ($('#password-input').val().length >= 6)) {
        lss = true;
        $("#submit-log").removeAttr("disabled");
      } else {
        lss = false;
        $("#submit-log").attr("disabled", "disabled");
      }
    });

    $(document).on('keypress', function (e) {
      if ((scene == 'login') && (e.which == 13) && lss) {
        $('#submit-log').trigger('click');
      } else if ((scene == 'register') && (e.which == 13) && registerProcess) {
        $('#submit-reg').trigger('click');
      }
    });

  // Handle register request
  $('#submit-reg').on('click', function(){

    $('#login-reg-input, #email-reg-input, #password-reg-input, #password-reg-input2, #remember-reg-input, #submit-reg').attr('disabled', 'disabled');
    $('.reg-inputs').animate({'opacity': 0.2}, 'slow');
    $('#submit-reg').animate({'opacity': 0.2}, 'slow');
    $('#back-to-login').off('click');
    $('#submit-reg b').hide();
    $('#reg-spinner').show();
    registerProcess = false;

    setTimeout(function() {
      socket.emit('register request', {
        login: $('#login-reg-input').val(),
        email: $('#email-reg-input').val(),
        password: $('#password-reg-input').val(),
        cpassword: $('#password-reg-input2').val()
      });
    }, 1500);

  });
  socket.on('register response', function(res){
    if (res.status === 'success') {
      $('#login-input').val($('#login-reg-input').val());
      $('#login-reg-input, #email-reg-input, #password-reg-input, #password-reg-input2, #remember-reg-input').removeAttr('disabled').val("");
      $('#remember-reg-input').prop('checked', false);
      back_to_login_turn_on_trigger_click();
      $('.back-to-login').trigger('click');
      $('#reg-spinner').hide();
      $('#submit-reg b').show();
      $('.reg-inputs').animate({'opacity': 1});
      $('#submit-reg').animate({'opacity': 1});
      registerProcess = false;

      $('<div class="alerts success">' + res.msg + '</div>').appendTo('.login-alerts');

      $('.alerts.success').animate({'opacity': '1'}, 'slow').delay(5000).fadeOut('slow', function(){
        $('.alerts.success').remove();
      });

    } else {
      $('#login-reg-input, #email-reg-input, #password-reg-input, #password-reg-input2, #remember-reg-input').removeAttr('disabled');
      $('#password-reg-input, #password-reg-input2').val("");
      $('#remember-reg-input').prop('checked', false);
      $('#login-reg-input').focus();
      back_to_login_turn_on_trigger_click();
      $('#reg-spinner').hide();
      $('#submit-reg b').show();
      $('.reg-inputs').animate({'opacity': 1});
      $('#submit-reg').animate({'opacity': 1});
      registerProcess = false;

      $('<div class="alerts error">' + res.msg + '</div>').appendTo('.login-alerts');
      $('.alerts.error').animate({'opacity': '1'}, 'slow').delay(10000).fadeOut('slow', function() {
        $('.alerts.error').remove();
      });
    }
  });

  // Handle login request
  $('#submit-log').on('click', function(){
    $('#login-input, #password-input, #remember-input, #submit-log').attr('disabled', 'disabled');
    $('.log-inputs').animate({'opacity': 0.2}, 'slow');
    $('#submit-log').animate({'opacity': 0.2}, 'slow');
    $('#submit-log b').hide();
    $('#log-spinner').show();

    setTimeout(function() {
      socket.emit('login request', {
        login: $('#login-input').val(),
        password: $('#password-input').val()
      });
    }, 500)

  });
  socket.on('login response', function(res){
    if (res.status === 'success') {
      $('#password-input').val("");
      $('.login-alerts').animate({'opacity': 0}, function(){$(this).remove})
      $('.login-bar').animate({'right': '270px'}, "slow", function(){
        var filterVal = 'blur(' + 5 + 'px)';
        $('#login-page').css({'transition': '1.5s'});
        $('#login-page').css({
          '-webkit-filter': filterVal,
          '-moz-filter': filterVal,
          '-o-filter': filterVal,
          '-ms-filter': filterVal,
          'filter': filterVal,
          'box-shadow': '0px 0px 20px 5px rgba(0,0,0,0.7)'
        });
        setTimeout(() => {
          $('#login-page').css({'transition': ''});
        }, 1500)
        $('.login-bar').remove();
      });

        if ( $('#remember-input').is(":checked") ) {
          localStorage.setItem('remember_checkbox', true);
          localStorage.setItem('remember_login', $('#login-input').val());
        }

        localStorage.setItem('login', res.login);
        localStorage.setItem('nickname', res.nickname);
        localStorage.setItem('playerid', res.id);
        localStorage.setItem('iconid', res.icon);
        localStorage.setItem('ownedicons', res.ownedIcons);
        localStorage.setItem('friendsid', res.friendsid);
        localStorage.setItem('token', res.socketToken);

        $('#main-client').append('<div id="home-page"></div>');
        $('head').append('<link rel="stylesheet" href="../assets/css/homepage.css" />');

        localStorage.setItem('gameport', res.gameinfo.port)
        localStorage.setItem('isingame', res.gameinfo.isin)
        localStorage.setItem('gamepid', res.gameinfo.gamepid)
        localStorage.setItem('gametoken', res.gameinfo.gametoken)

        $('#home-page').load('./unique/homepage.html', function(){
          $('.loader').show();
          $('.loader').animate({'opacity': 1}, 600);
          $(document, '#home-page').ready(function(){
            $('#home-page').animate({'opacity': "1"}, "slow");
          })
        });

    } else if (res.status === 'error') {
      $('#login-input, #password-input, #remember-input').removeAttr('disabled');
      $('#password-input').val("").focus();
      $('.log-inputs').animate({'opacity': 1}, 'slow');
      $('#submit-log').animate({'opacity': 1}, 'slow');
      $('#submit-log b').show();
      $('#log-spinner').hide();

      $('<div class="alerts error">' + res.msg + '</div>').appendTo('.login-alerts');
      $('.alerts.error').animate({'opacity': '1'}, 'slow').delay(10000).fadeOut('slow', function(){
        $(this).remove();
      });

      if ( $('#remember-input').is(":checked") ) {

      } else {
        localStorage.removeItem('remember_checkbox');
        localStorage.removeItem('remember_login');
      }
    }
  });
