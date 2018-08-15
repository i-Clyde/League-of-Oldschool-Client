// Turn off the settings button during the setup
$('#settings-btn').off();
// Set darker background
$('.bg-darker').animate({'opacity': '1'}, 100);
if (localStorage.getItem('nickname') == 'null') {
  // Open modal nickanme
  $('.firstloginsn').modal({
    backdrop: false,
    keyboard: false
  }); $('#fnib').focus();

  // Live nickname check
  var nickok = false;
  $('#fnib').on('keyup', function() {
    var bval = $(this).val().trim();
    if ((bval.length >= 3) && (bval.length <= 20) && (bval != 'null')) {
      var pnc = /^[ a-zA-Z0-9]*$/;
      if (pnc.test($('#fnib').val())) {
        $('#flsnchkbtn').removeAttr('disabled');nickok = true;
        $('#fnib').css({'border': '1px #998100 solid'});
      } else {
        $('#flsnchkbtn').attr('disabled', 'disabled');nickok = false;$('#fnib').css({'border': '1px solid red'});
      }
    } else if (bval.length == 0) {
      $('#flsnchkbtn').attr('disabled', 'disabled');nickok = false;$('#fnib').css({'border': '1px #998100 solid'});
    }
    else {
      $('#flsnchkbtn').attr('disabled', 'disabled');nickok = false;$('#fnib').css({'border': '1px solid red'});
    }
  })

  // Make the ENTER key working (only for check)
  $(document).on('keypress', function (e) {if ((e.which == 13) && (nickok)) $('#flsnchkbtn').trigger('click')});

  // Event for check button
  socket.on('check nickname response', function(r) {
    setTimeout(function() {
      if (r.status == 'success') {
        success_msg(r.msg);
        $('#flsnchkbtn, #fnib, #flsnbtn').removeAttr('disabled');
        $('#fnib').css({'border': '1px solid #11aa11'});$('#fnib').attr('disabled', 'disabled')
        $('#flsnchkbtn b').html('<b><i class="fa fa-times"></i></b>');
        $('#flsnchkbtn').css({'width': '50px'}).attr('dismiss-nickname', 'dismiss-nickname');
        $('#flsnchkbtn b').show();
        $('#flsnchkbtnspinner').hide();
        $('#flsnchkbtn[dismiss-nickname=dismiss-nickname]').one('click', function(){
          $('#flsnchkbtn b').html('Check availability'); $('#flsnchkbtn').removeAttr('dissmiss-nickname').css({'width': ''});
          $('#fnib').val('').removeAttr('disabled').css({'border': '1px #998100 solid'}).focus();
          $('#flsnbtn').attr('disabled', 'disabled');bindClickCheckNNC();
        });
      } else if (r.status == 'error') {
        error_msg(r.msg);
        $('#flsnchkbtn b').show();$('#flsnchkbtnspinner').hide();
        $('#fnib').val('');
        bindClickCheckNNC(); $('#flsnchkbtn, #fnib').removeAttr('disabled');
        $('#fnib').focus();
      }
    }, 400)
  })

  function bindClickCheckNNC(){
    $('#flsnchkbtn').one('click', function() {
        $('#flsnchkbtn b').hide();$('#flsnchkbtnspinner').show();
        $('#flsnchkbtn').off('click'); $('#flsnchkbtn, #fnib').attr('disabled', 'disabled');
        socket.emit('check nickname request', $('#fnib').val());
    });
  } bindClickCheckNNC();

  // Event for set nickname button
  socket.on('set nickname response', function(r) {
    setTimeout(function() {
      if (r.status == 'success') {
        localStorage.setItem('nickname', r.nick);
        success_msg(r.msg);
        $('#flsnbtn b').show();$('#flsnbtnspinner').hide();
        $('#flsnbtn').on('click');
        canplay = true;
        openIconselectSetup(1);
      } else if (r.status == 'error') {
        error_msg(r.msg);
        $('#flsnbtn b').show();$('#flsnbtnspinner').hide();
        bindClickSetNNC();
        $('#flsnchkbtn, #fnib').removeAttr('disabled');
      }
    }, 400)
  })

  function bindClickSetNNC() {
    $('#flsnbtn').one('click', function(){
      $('#flsnbtn b').hide();$('#flsnbtnspinner').show();
      $('#flsnbtn').off('click'); $('#flsnchkbtn, #fnib, #flsnbtn').attr('disabled', 'disabled');
      socket.emit('set nickname request', $('#fnib').val());
    })
  } bindClickSetNNC();
} else if (localStorage.getItem('iconid') == 'null') {
  openIconselectSetup(0);
}

function openIconselectSetup(a) {
  if (localStorage.getItem('iconid') == 'null') {
    if (a == 1) $('.firstloginsn').modal('toggle');
    $('.iconsetup').modal({
      backdrop: false,
      keyboard: false
    });

    var icons = localStorage.getItem('ownedicons').split(',');
    $.each( icons, function( data, id ) {
      $('.iconmenu.setupicons').append('<div class="icon-box"><label><input type="radio" name="icon" value="'+id+'" /><img class="icon-box-img" src="./../assets/imgs/profileicon/'+id+'.png"/></label></div>');
    });

    var picicongo = false;
    $('.iconmenu.setupicons input[type=radio][name=icon]').change(function() {
      $('#icmnsv').removeAttr('disabled', 'disabled');
      var picicongo = true;
    });

    $('#icmnsv').on('click', function() {
      $('#icmnsv b').hide(); $('#icmnsvspinner').show();
      var iconid = $('.iconmenu.setupicons input[type=radio][name=icon]:checked').val();
      if (iconid >= 0) {
        socket.emit('set icon request', {'iconid': iconid, 'update': false});
        $('.iconmenu.setupicons input[type=radio], #icmnsv').attr('disabled', 'disabled');
      } else {
        error_msg('An error occured, please try with another icon!');
      }
    });

    $(document).on('keypress', function (e) {if ((e.which == 13) && (picicongo)) $('#icmnsv').trigger('click')});

    socket.on('set icon response', function(data) {
      if (data.status == 'success') {
        localStorage.setItem('iconid', data.iconid);
        success_msg(data.msg);
        info_msg('Welcome to the oldSchoolLeague!');
        $('#icmnsv b').show(); $('#icmnsv #icmnsvspinner').hide();
        endSetup();
      } else if (data.status == 'error') {
        error_msg(data.msg);
        $('#icmnsv b').show(); $('#icmnsv #icmnsvspinner').hide();
        $('.iconmenu.setupicons input[type=radio], #icmnsv').removeAttr('disabled');
      }
    });

  }
}

function endSetup() {
  // Set darker background
  $('.bg-darker').animate({'opacity': '0'}, 1000, () => {$('bg-darker').remove()});
  settings_turn_trigger_click();
  $('.iconsetup').modal("toggle");
  setTimeout(function() {
    $('.setup').remove();
  }, 2000)
  localStorage.setItem('canplay', true);loadHomePage()
}
