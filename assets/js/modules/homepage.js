// Errors, success alerts
function custom_alert(msg, type, time) {
  $('<div class="alerts '+type+'">' + msg + '</div>').appendTo('.client-alerts');

  var i = 0;
  var rI = setInterval(() => { i++;
    if (i <= 15) $('.alerts.'+type).css({'backdrop-filter': 'blur('+i+'px)'});
    if (i == 16) clearInterval(rI);
  }, 40);

  $('.alerts.'+type).animate({'opacity': '1'}, 640, function() {
    setTimeout(() => {
    var rI = setInterval(() => { i--;
      if (i > 0) $('.alerts.'+type).css({'backdrop-filter': 'blur('+i+'px)'});
      if (i == -1) clearInterval(rI);
    }, 40);
      $(this).fadeOut(640, function() {
        $(this).remove();
      });
    }, time)
  });
}

function success_msg(msg) {custom_alert(msg, 'success', 7000)}
function info_msg(msg) {custom_alert(msg, 'info', 9000)}
function error_msg(msg) {custom_alert(msg, 'error', 10000)}

// Alerts from server
socket.on('error', msg => {
  error_msg(msg)
})
socket.on('info', msg => {
  info_msg(msg)
})
socket.on('success', msg => {
  success_msg(msg)
})

// Instant requests
socket.emit('load invites');
socket.emit('load friends');
socket.emit('load ignores');

// Removes if empty or count is 0
if ($('.social-content-friend-list .social-content-sub').length > 0) $('.social-content-no-friends').hide();

// Tooltips
$('body').tooltip({
    selector: '[rel=tooltip]'
});

// Copy to clipboard
function copyToClipboard(text){
  var placeholder = document.createElement("input");
  document.body.appendChild(placeholder);
  placeholder.setAttribute('value', text);
  placeholder.select();
  document.execCommand("copy");
  document.body.removeChild(placeholder);
}

// If nickname is not set, force user to set it!
  localStorage.setItem('canplay', true);
  var iconsjson = require('./../static_data/profileicon.json');
  if (localStorage.getItem('nickname') === 'null' || localStorage.getItem('iconid') === 'null') {
    localStorage.setItem('canplay', false);
    $('.setup').load('./unique/playersetup.html');
  } else {
    $('.setup').remove();
    loadHomePage();
  }

  function loadHomePage() {
    const { exec } = require('child_process');
    if (localStorage.getItem('canplay')) {

      // Load user overview
      socket.emit('load homepage req');
      socket.on('load homepage', (data) => {
        $('.social-header-sub').attr('status', '1')
        if (data.description == null) desc = 'Online';
        else desc = data.description;

        $('.social-zone .social-nick').html('<b>'+data.nickname+'</b>');
        $('.social-zone .social-description').attr('value', desc);
        $('.social-zone .social-icon .social-icon-img').attr('src', '../assets/imgs/profileicon/'+data.icon+'.png')

        if (data.lastGMSG != null) $('.chat-box-chatter-lastmsg[cid=0]').html(((data.lastGMSG.pid == localStorage.getItem('playerid'))?'You: ':'')+data.lastGMSG.msg);

        $.each(data.messageHistory, function(index) {
          if (localStorage.getItem('friendsid').includes(index)) {
            for(let i = 0, len = data.messageHistory[index].length; i < len; i++) {
              if (i == 0) addNewChatter(index, true, 'No messages yet!');
              if (!isNaN(data.messageHistory[index][i].unread) && data.messageHistory[index][i].unread == true) newMsgNotify(index, index, true)
              if (i == len-1) $('.chat-box-chatter-lastmsg[cid='+index+']').html((((data.messageHistory[index][i].you)?'You: ':'')+data.messageHistory[index][i].msg));
            }
          }
        })
        if (localStorage.getItem('isingame') != 'null') socket.emit('game load after relog', localStorage.getItem('gametoken'));
        else startHomepage();

      })

      socket.on('game load after relog res', function(info) {
        startHomepage(info);
      })

      // Description changer (your)
      $('.social-zone .social-description').on('keyup', (e) => {
        if (e.which == 13) {
          $('.social-zone .social-description').blur();
        }
      })

      var description_txt;
      $('.social-zone .social-description').on('focus', () => {
        description_txt = $('.social-description').val().trim();
      })

      $('.social-zone .social-description').on('focusout', () => {
        let desc = $('.social-description').val().trim();
        if (description_txt != desc) {
          let status = $('.social-header-sub').attr('status'); let status_text;
          if (status == 1) status_text = 'Online'; else if (status == 2) status_text = 'Away';
          if (desc.trim() == '') $('.social-description').val(status_text);
          socket.emit('update description req', {'desc': desc})
        }
      })

      $('.social-icon').on('click', () => {
        $('.iconsmenu').appendTo("body").modal();
      })

      socket.on('friend updated description', (data) => {
        updateDesc(data.id, data.status, data.desc)
      })

      // Icon menu and icon set
      var icons = localStorage.getItem('ownedicons').split(',');
      $.each( icons, function( data, id ) {
        $('.iconmenu').append('<div class="icon-box"><label><input type="radio" name="icon" value="'+id+'" /><img class="icon-box-img" src="./../assets/imgs/profileicon/'+id+'.png"/></label></div>');
      });

      $('.icon-box input[value='+localStorage.getItem('iconid')+']').attr('checked', 'checked');

      $('#saveiconbtn').on('click', function() {
        var iconid = $('.iconmenu input[type=radio][name=icon]:checked').val();
        if (iconid != localStorage.getItem('iconid')) {
        $('#saveiconbtn b').hide(); $('#icmnsvspinner').show();
          if (iconid >= 0) {
            socket.emit('set icon request', {'iconid': iconid, 'update': true});
            $('.iconmenu input[type=radio]').attr('disabled', 'disabled');
          } else {
            error_msg('An error occured, please try with another icon!');
            $('#saveiconbtn b').show(); $('#icmnsvspinner').hide();
          }
        } else $('.iconsmenu').modal('hide')
      })

      socket.on('set icon response', function(data) {
        if (data.status == 'success') {
          localStorage.setItem('iconid', data.iconid);
          success_msg(data.msg);
          $('#saveiconbtn b').show(); $('#saveiconbtn #icmnsvspinner').hide();
          $('.iconmenu input[type=radio]').removeAttr('disabled');
          $('.social-zone .social-icon .social-icon-img').attr('src', '../assets/imgs/profileicon/'+data.iconid+'.png')
          $('.iconsmenu').modal('hide')
        } else if (data.status == 'error') {
          error_msg(data.msg);
          $('#saveiconbtn b').show(); $('#saveiconbtn #icmnsvspinner').hide();
          $('.iconmenu input[type=radio]').removeAttr('disabled');
        }
      });

      // Change status to away/online
      function changeStatusToAwayBtn() {
        $('.social-header-status-bar').on('click', () => {
          let sp = $('.social-header-status-bar').parents('.social-header-sub');
          let s = sp.attr('status'); if (s == 1) {
            c = 2; $('.social-description').attr({'desc': $('.social-description').val(), 'disabled': 'disabled'}).val('I am Away!').css({'cursor': 'not-allowed'});
          } else if (s == 2) {
            c = 1; $('.social-description').val($('.social-description').attr('desc')).removeAttr('desc').removeAttr('disabled').css({'cursor': 'pointer'});
          }

          sp.attr('status', c);
          $('.social-header-status-bar').removeClass().addClass('social-header-status-bar status-'+c+'bg');
          $('.social-zone .social-icon img').removeClass().addClass('social-icon-img status-'+c);
          $('.social-description').removeClass().addClass('social-description status-'+c)

          socket.emit('update status req', {'status': c})
        })
      }; changeStatusToAwayBtn();

      function changeEventStatus(eventname) {
        let sp = $('.social-header-status-bar').parents('.social-header-sub');
        let s = sp.attr('status');

        if (s == 3) {$('.social-description').val(eventname).css({'cursor': 'not-allowed'})}
        else if (s != 3) {$('.social-description').attr({'desc': $('.social-description').val(), 'disabled': 'disabled'}).val(eventname).css({'cursor': 'not-allowed'})}

        $('.social-header-status-bar').removeClass().addClass('social-header-status-bar status-'+3+'bg');
        $('.social-zone .social-icon img').removeClass().addClass('social-icon-img status-'+3);
        $('.social-description').removeClass().addClass('social-description status-'+3);
        $('.social-header-status-bar').off('click').css({'cursor': 'not-allowed'});
        sp.attr('status', 3);

        socket.emit('update status req', {'status': 3, 'desc': eventname})
      }

      function eventStatusDescEnd() {
        let sp = $('.social-header-status-bar').parents('.social-header-sub');
        let s = sp.attr('status');

        if (s == 3) {
          let desc = $('.social-description').attr('desc');

          $('.social-description').removeAttr('desc').removeAttr('disabled').val(desc).css({'cursor': 'auto'})

          $('.social-header-status-bar').removeClass().addClass('social-header-status-bar status-'+1+'bg');
          $('.social-zone .social-icon img').removeClass().addClass('social-icon-img status-'+1);
          $('.social-description').removeClass().addClass('social-description status-'+1);
          $('.social-header-status-bar').off('click').css({'cursor': 'pointer'});
          sp.attr('status', 1);

          socket.emit('update status req', {'status': 1, 'desc': desc})
          changeStatusToAwayBtn();
        }
      }

      // Show panels
      function startHomepage(info = null) {
        setTimeout(() => {
          $('.social-type-friends').animate({'left': '0', 'opacity': '1'}, 400)
          $('.social-zone').animate({'left': '0', 'opacity': '1'}, 400)
          if (localStorage.getItem('isingame') == 'null') {
            $('.client-menu').animate({'top': '0', 'opacity': '1'}, 400, () => {$('.homepage').animate({'opacity': 1}, 600)})
          } else {
            $('.championselect').load('./models/ingame.html', function() {

              $.each(info, function(index, value) {
                $('<div class="ingame-champ-image" data-isloaded="'+value.status+'" gpid="'+index+'" pid="'+value.pid+'"><img src="../assets/imgs/champion/'+value.champion+'.png" /></div>').insertBefore('.champs-cover.'+value.team+'-team .igbeforer');
              });

              if (localStorage.getItem('isingame') == 'true') {
                $('#void-vote-btn').removeAttr('disabled');
                $('#reconnect-btn').attr({'disabled': 'disabled'}).text('Already connected');
              } else {
                $('#void-vote-btn').attr({'disabled': 'disabled'});
                $('#reconnect-btn').removeAttr('disabled').text('Reconnect');
              }

              $('#void-vote-btn, #reconnect-btn').off('click');
              $('#void-vote-btn').on('click', function() {

                if (localStorage.getItem('isingame') == 'true') {
                  socket.emit('game void vote');
                } else error_msg('You have to be connected after game start. To vote');

              });

              $('#reconnect-btn').on('click', function() {
                if (localStorage.getItem('isingame') == 'false') {
                  exec('start "" "'+gameLolPath+'League of Legends.exe" "8394" "LoLLauncher.exe" "" "176.241.73.111 '+localStorage.getItem('gameport')+' 17BLOhi6KZsTtldTsizvHg== '+(parseInt(localStorage.getItem('gamepid'))+1)+'"', {cwd: gameLolPath});
                } else error_msg('You are already in game, try relog if not or wait!');
              });

            }).css({'opacity': 1, 'display': 'block'});
          }

        }, 500)
        $('.loader').animate({'opacity': 0}, 200, () => {
          $('.loader').hide();
        })
      }


      // Handle home on clicks
      $('.chat-box-control-minimize').on('click', function() {
        if ($('.chat-box').height() > 287) {
          $('.chat-box').animate({'height': '4.9vh'}, "slow", () => {
            titleMaximize();
          });
          scrollBottomSChat();
        } else {
          $('.chat-box').animate({'height': '50vh'}, "slow");
          $('.chat-box-controls').off('click');
          $('.chat-box-controls').css({'cursor': 'default'});
          let pid = $('.chat-box-conversation-content').attr('cid');
          if ($('.chat-box-newmsg.profile[pid='+ pid +']').attr('data-newmsgs') == "true") msgHasBeenRead(pid, false);
          scrollBottomSChat();
        }
      })

      $('.chat-box-control-exit').on('click', function() {
        if ($('.chat-box').height() > 287) {
          $('.chat-box').animate({'height': '4.9vh'}, "slow", function() {
            $('.chat-box-title').animate({'opacity': '0'}, "slow");
            $('.chat-box').animate({'width': 0}, "slow", function() {
              $('.chat-box-controls').hide()
              $('.social-footer-globalchat').animate({'color': '#eee'}, "slow");
            })
          });
          scrollBottomSChat();
        } else {
          $('.chat-box-title').animate({'opacity': '0'}, "slow");
          $('.chat-box').animate({'width': 0}, "slow", function() {
            $('.chat-box-controls').hide()
            $('.social-footer-globalchat').animate({'color': '#eee'}, "slow");
          })
          $('.chat-box-controls').off('click');
          $('.chat-box-controls').css({'cursor': 'default'});
        }
      })

      // Toggle chat
      function toggleGlobalChatBtn() {
        $('.social-footer-globalchat').on('click', function() {
          if ($('.chat-box').width() == 0) {
            $(this).off('click');openChat(0)
          } else {
            if ($('.chat-box').height() > 287) { $(this).off('click');closeChat() }
            else { $(this).off('click');closeChat();$('.chat-box-controls').off('click');$('.chat-box-controls').css({'cursor': 'default'});}
          }
        })
      } toggleGlobalChatBtn();

      function openChat(cid) {
        $('.social-footer-globalchat').off('click');
        $('.social-content-friend-list').off('click');

        if ($('.chat-box-chats-chatter[cid='+cid+']').length > 0) {

          loadSocialMessages(cid);
          $('.chat-box-chats-chatter').removeAttr('data-selected');
          $('.chat-box-chats-chatter[cid='+cid+']').attr({'data-selected': 'true'});

        } else addNewChatter(cid);

        $('.chat-box-controls').show();
        $('.chat-box-title').animate({'opacity': '1'}, "slow");
        $('.chat-box').animate({'width': '95vh'}, "slow", function(){
          $(this).animate({'height': '50vh'}, "slow");
          $('.social-footer-globalchat').animate({'color': '#998100'}, "slow", function() {
            toggleGlobalChatBtn();friendOpenChat()
          });
        })

        if (cid == 0) {
          socket.emit('online users request');
        } else {let nick = $('.social-content-sub[pid='+cid+'] .social-friend-nick span b').text();updateChatTitle(nick)}
      }

      function updateChatTitle(type, others='') {
        $('.chat-box-title').html('<b>'+type+'</b>'+'<i>'+others+'</i>')
      }

      function addNewChatter(cid, newmsg=false, lastmsg='No messages yet!') {
        $('.chat-box-conversation-content').html('');

        let img = $('.social-content-sub[pid='+cid+'] .social-friend-icon img').attr('src');
        let status = $('.social-content-sub[pid='+cid+']').attr('status');
        let nick = $('.social-content-sub[pid='+cid+'] .social-friend-nick span b').text();
        let newchatter = '<div class="chat-box-chats-chatter social-hover" cid="'+cid+'" style="opacity: 0"><span class="chat-box-newmsg badge badge-warning" cid="'+cid+'"></span><img class="chat-box-chatter-img status-'+status+'" src="'+img+'" /><div class="chat-box-chatter-info"><div class="chat-box-chatter-info-basic"><div class="chat-box-nick-sub"><div class="chat-box-chatter-nick">'+nick+'</div><div style="clear: both"></div></div><div class="chat-box-chatter-lastmsg" cid="'+cid+'">No messages yet!</div></div></div><div style="clear: both"></div></div>';

        if ($('.chat-box-chats-chatter').length == 1) $('.chat-box-category.my-c').animate({'opacity': '1'})

        $('.chat-box-category.my-c').after(newchatter);

        if (!newmsg) {
          $('.chat-box-chats-chatter').removeAttr('data-selected');
          $('.chat-box-chats-chatter[cid='+cid+']').attr({'data-selected': 'true'});
          $('.chat-box-chatter-lastmsg[cid='+cid+']').html(lastmsg)
          updateChatTitle(nick);
        }


        $('.chat-box-chats-chatter[cid='+cid+']').animate({'opacity': '1'});
      }

      // Open chat on click friend
      function friendOpenChat() {
        $('.social-content-friend-list').on('click', '.social-content-sub', function() {
          var pid = $(this).attr('pid');
          var addChatterS = true;
          let nick = $('.social-content-sub[pid='+pid+'] .social-friend-nick span b').text();

          if ($('.chat-box-chats-chatter[cid='+pid+']').length > 0) addChatterS = false;

          if ($('.chat-box').width() == 0) {openChat(pid);updateChatTitle(nick)}
          else {

            $('.chat-box-controls').off('click');
            $('.chat-box-controls').css({'cursor': 'default'});

            if ($('.chat-box').height() < 287) $('.chat-box').animate({'height': '50vh'}, "slow");
            if (addChatterS) addNewChatter(pid);

            loadSocialMessages(pid);
            $('.chat-box-chats-chatter').removeAttr('data-selected');
            $('.chat-box-chats-chatter[cid='+pid+']').attr({'data-selected': 'true'});

            updateChatTitle(nick)
          }

        });
      } friendOpenChat();

      // Maximize after title click (chat)
      function titleMaximize() {
        $('.chat-box-controls').css({'cursor': 'pointer'});
        $('.chat-box-controls').on('click', function() {
          $('.chat-box-control-minimize').trigger('click');
        })
      }

      // Switch chatter
      $('body').on('click', '.chat-box-chats-chatter', function() {
        let pid = $(this).attr('cid');
        let nick = $('.social-content-sub[pid='+pid+'] .social-friend-nick span b').text();
        loadSocialMessages(pid);
        $('.chat-box-chats-chatter').removeAttr('data-selected');
        $('.chat-box-chats-chatter[cid='+pid+']').attr({'data-selected': 'true'});
        if (pid == 0) socket.emit('online users request'); else updateChatTitle(nick);
      });

      function closeChat() {
        $('.social-content-friend-list').off('click');
        if ($('.chat-box').height() > 287) {
          $('.chat-box').animate({'height': '4.9vh'}, "slow", function() {
            $('.chat-box-title').animate({'opacity': '0'}, "slow");
            $('.chat-box').animate({'width': 0}, "slow", function() {
              $('.chat-box-controls').hide()
              $('.social-footer-globalchat').animate({'color': '#eee'}, "slow", function() {
                toggleGlobalChatBtn();friendOpenChat();
              });
            });
          });
        } else {
          $('.chat-box-title').animate({'opacity': '0'}, "slow");
          $('.chat-box').animate({'width': 0}, "slow", function() {
            $('.chat-box-controls').hide()
            $('.social-footer-globalchat').animate({'color': '#eee'}, "slow", function() {
              toggleGlobalChatBtn();friendOpenChat();
            });
          })
        }
      }

      // Send chat messages
      $('.chat-box-input').on('keyup', function(k) {
        if (k.which == 13) {
          if (($('.chat-box-input').val().length <= 255) && ($('.chat-box-input').val().trim() != "")) {
            var cid = $('.chat-box-chats-chatter[data-selected=true]').attr('cid');
            socket.emit('send msg', {'to': cid, 'msg': $(this).val()})
            $(this).val('').focus();
          } else if ($('.chat-box-input').val().length > 255) {
            error_msg('Your message is too long! (Max 255 chars)')
          }
        }
      })

      // Function for data check (when msg was sent)
      function whenMsgWasSent(milis = false, first=false) {

        let last;
        if (!first) last = new Date(parseInt($('.chat-box-conversation-content .chat-msg-content').last().attr('date')));
        let now = (!milis)? new Date() : new Date(parseInt(milis));

        if (!milis) {
          if (isNaN(last)) return whenMsgWasSentPre(now);
          else {
            if (last.getDate() == now.getDate() && last.getMonth() == now.getMonth() && last.getFullYear() == now.getFullYear()) return('');
            else return whenMsgWasSentPre(now);
          }
        } else {
          if (isNaN(last)) return whenMsgWasSentPre(now)
          else {
            if (last.getDate() == now.getDate() && last.getMonth() == now.getMonth() && last.getFullYear() == now.getFullYear()) return('');
            else return whenMsgWasSentPre(now);
          }
        }
      }


    // Check when Msg Was sent
      function whenMsgWasSentPre(time) {
        let now = new Date();let x = new Date();x.setDate(x.getDate() - 1);function createOutput(n) {return('<div class="chat-date"><span>'+n+'</span></div>')}
        let then_f = new Date(time.getTime());then_f.setHours(0);then_f.setMinutes(0);then_f.setSeconds(0);
        let now_f = new Date();now_f.setHours(0);now_f.setMinutes(0);now_f.setSeconds(0);

        let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let diffDays = Math.round((now_f.getTime() - then_f.getTime())/(24*60*60*1000));

        function isThisYear(one, two) {if ((one.getMonth() == two.getMonth()) && (one.getFullYear() == two.getFullYear())) return true; else return false}

        if ((time.getDate() == now.getDate()) && isThisYear(time, now)) return createOutput('Today');
        else if ((time.getDate() == x.getDate()) && (time.getFullYear() == now.getFullYear())) return createOutput('Yesterday');
        else if (((diffDays >= 0) && (diffDays < 7)) && (time.getFullYear() == now.getFullYear())) return createOutput(days[time.getDay()]);
        else if (((diffDays >= 7) && (diffDays < 365)) && (time.getFullYear() == now.getFullYear())) return createOutput(time.getDate()+' '+months[time.getMonth()]);
        else if ((time.getFullYear() != now.getFullYear())) return createOutput(time.getDate()+' '+months[time.getMonth()]+' '+time.getFullYear());
        else return(createOutput('In the future'))
      }

      // Add new message notifi
      function newMsgNotify(pid, from, preloader=false) {
        if (from != localStorage.getItem('playerid')) {

          let newmsgs = parseInt($('.chat-box-newmsg.profile[pid='+pid+']').attr('data-new')); newmsgs++;

          $('.chat-box-newmsg[cid='+pid+']').text(newmsgs+' new')
          $('.chat-box-newmsg[cid='+pid+']').animate({'opacity': 1}, 800)
          $('.chat-box-newmsg.profile[pid='+pid+']').attr('data-new', newmsgs)
          $('.chat-box-newmsg.profile[pid='+pid+']').attr('data-newmsgs', true)
          $('.chat-box-newmsg.profile[pid='+pid+']').text(newmsgs+' new')
          $('.chat-box-newmsg.profile[pid='+pid+']').animate({'opacity': 1}, 800)

          let newchattersmsgs = $('.social-content-friend-list .chat-box-newmsg.profile[data-newmsgs=true]').length;
          setTimeout(() => {$('.notification-badge.chats').text(newchattersmsgs+' new').animate({'opacity': 1}, 400)}, ((preloader)?800:0))
          document.title = '('+newchattersmsgs+')'+' League of Oldschool';

          if (($('.chat-box-chats-chatter[cid='+pid+']').attr('data-selected') == 'true') && ($('.chat-box').height() < 100)) {
            $('.chat-box-title i').text(newmsgs+' new message'+((newmsgs > 1)?'s':''))
            $('.chat-box-title i').animate({'opacity': 1}, 'slow')
          }

          sound_newmsg_play();
        }
      }

      // Mark as read MSG
      function msgHasBeenRead(pid, nmsg=false) {

        if(!nmsg) {
          $('.chat-box-newmsg[cid='+pid+']').animate({'opacity': 0}, 800, function() {
            $('.chat-box-newmsg[cid='+pid+']').text('')
          })
          $('.chat-box-newmsg.profile[pid='+pid+']').attr('data-new', 0)
          $('.chat-box-newmsg.profile[pid='+pid+']').attr('data-newmsgs', false)
          $('.chat-box-newmsg.profile[pid='+pid+']').animate({'opacity': 0}, 800, function() {
            $('.chat-box-newmsg.profile[pid='+pid+']').text('')
          })

          $('.chat-box-title i').animate({'opacity': 0}, 'slow', function() {
            $('.chat-box-title i').text('');
          });

          let unReads = $('.social-content-friend-list .chat-box-newmsg.profile[data-newmsgs=true]').length;
          $('.notification-badge.chats').text(unReads+' new');
          document.title = '('+unReads+')'+' League of Oldschool';
          if (unReads > 0) $('.notification-badge.chats').animate({'opacity': 1}, 400); else {
            document.title = 'League of Oldschool';
            $('.notification-badge.chats').animate({'opacity': 0}, 400);
          }

          setTimeout(() => {
            $('.chat-box-conversation-content[cid='+pid+'] .chat-msg.unread-msg').css({'border': '1px solid rgba(100, 100, 100, 0.6)'});
            setTimeout(() => {
              $('.chat-box-conversation-content[cid='+pid+'] div.chat-msg').removeClass('unread-msg');
            }, 3100)
          }, 5000)


        }

        let specify = (!nmsg)?false:true;
        socket.emit('mark messages as read', {'pid': pid, 'specify': specify})


      }

      // Catch new message to global chat
      socket.on('new message', data => {
        var last_msg = $('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').last();
        var last_pid = last_msg.attr('pid');
        var from = '', isyou = '', read = false;

        if ((last_pid != data.from || last_pid === undefined) && data.cid == 0 ) from = '<div class="chat-msg-nick">'+data.fromnick+' says:</div>';
        if (localStorage.getItem('playerid') == data.from) {isyou = ' you';from = ''}
        $('.chat-box-chatter-lastmsg[cid='+data.cid+']').html((isyou == ' you'?'You: ':'')+data.msg)

        if (data.cid != 0) {
          if (!($('.chat-box-chats-chatter[cid='+data.cid+']').length > 0) && data.cid != localStorage.getItem('playerid')) addNewChatter(data.cid, true);
          if (($('.chat-box-chats-chatter[cid='+data.cid+']').attr('data-selected') != 'true') ||
          ($('.chat-box-chats-chatter[cid='+data.cid+']').attr('data-selected') == 'true' && $('.chat-box').height() < 100) ) newMsgNotify(data.cid, data.from, (isyou == ' you'?'You: ':'')+data.msg); else read = true;
        }

        let date = new Date();
        let h = (date.getHours() <= 9)?'0'+date.getHours():date.getHours();
        let i = (date.getMinutes() <= 9)?'0'+date.getMinutes():date.getMinutes();

        $('.chat-box-conversation-content[cid='+data.cid+']').append('<div class="chat-msg-content" pid="'+data.from+'" date="'+data.date+'">'+whenMsgWasSent()+from+'<div class="chat-msg'+isyou+'" rel="tooltip" title="'+h+':'+i+'"><span>'+data.msg+'</span></div><div style="clear: both"></div></div>');

        $('.chat-box-conversation').animate({ scrollTop: $('.chat-box-conversation-content[cid='+data.cid+']').height() }, "fast");

        if ($('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').length > 40) {
          $('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').first().remove();
          if ($('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').first().find('.chat-date').length == 0) {
            let mili = $('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').first().attr('date');
            $('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').first().prepend(whenMsgWasSent(mili, true));
          }
        }

        if (read && (data.from == data.cid)) msgHasBeenRead(data.from, true);
        scrollBottomSChat();
      });

      // Scroll chat to the bottom
      function scrollBottomSChat() {
        var chatbox_sc = document.getElementById("chatbox-sc");
        chatbox_sc.scrollTop = chatbox_sc.scrollHeight;
      }

      // Get old messages
      function loadSocialMessages(cid) {
        if ($('.chat-box-conversation-content').attr('cid') != cid) socket.emit('load old messages', cid);
      }

      socket.on('load old message res', function(data) {

        $('.chat-box-conversation-content').attr({'cid': data.cid});
        $('.chat-box-conversation-content').html('');

        if (data.cid == 0) {

          $.each(data.history, (key, value) => {
            let date = new Date(parseInt(value['date']));
            let from = value['pid'], isyou = (value['pid'] == localStorage.getItem('playerid')?' you':''), dayhr = '';
            let last_pid = $('.chat-box-conversation-content[cid=0] .chat-msg-content').last().attr('pid');
            if ((last_pid != value['pid'] || last_pid === undefined) && (isyou != ' you')) froms = '<div class="chat-msg-nick">'+value['nickname']+' says:</div>'; else froms = '';

            $('.chat-box-chatter-lastmsg[cid=0]').html((isyou == ' you'?'You: ':'')+value['msg'])

            let h = (date.getHours() <= 9)?'0'+date.getHours():date.getHours();
            let i = (date.getMinutes() <= 9)?'0'+date.getMinutes():date.getMinutes();

            $('.chat-box-conversation-content').append('<div class="chat-msg-content" pid="'+from+'" date="'+value['date']+'">'+whenMsgWasSent(value['date'])+froms+'<div class="chat-msg'+isyou+'" rel="tooltip" title="'+h+':'+i+'" rel="tooltip"><span href="#">'+value['msg']+'</span></div><div style="clear: both"></div></div>');

          });

        } else {

          let unreadCounter = 0;

          $.each(data.history, (key, value) => {
            let date = new Date(parseInt(value['date']));
            let unread = (!isNaN(value['unread']) && value['unread'] == true)?' unread-msg':''; if (unread == ' unread-msg') unreadCounter++;
            let you = value['you'], isyou = (you)?' you':'';
            $('.chat-box-chatter-lastmsg[cid='+data.cid+']').html(((isyou)?'You: ':'')+value['msg'])

            let h = (date.getHours() <= 9)?'0'+date.getHours():date.getHours();
            let i = (date.getMinutes() <= 9)?'0'+date.getMinutes():date.getMinutes();

            $('.chat-box-conversation-content[cid='+data.cid+']').append('<div class="chat-msg-content" date="'+value['date']+'">'+whenMsgWasSent(value['date'])+'<div class="chat-msg'+isyou+unread+'" rel="tooltip" title="'+h+':'+i+'" rel="tooltip"><span href="#">'+value['msg']+'</span></div><div style="clear: both"></div></div>');
          });

          if (unreadCounter != 0) msgHasBeenRead(data.cid);

        }

        scrollBottomSChat()

      });

      // Toggle add friend
      $('.social-footer-addfriend').on('click', function() {
        let t_friendsm = $('.social-type-friends').position();
        let t_ignoresm = $('.social-type-ignores').position();

        if (t_friendsm.left == 0) {
          toggleFriends('hide');
          toggleIgnores('hide');
          toggleInvites('show');
        } else if (t_friendsm.left == -270) {
          if (t_ignoresm.left == 0) {
            toggleIgnores('hide');
            toggleFriends('hide');
            toggleInvites('show');
          } else if (t_ignoresm.left == -270) {
            toggleIgnores('hide');
            toggleInvites('hide');
            toggleFriends('show');
          }
        }
      });

      // Toggle ignores
      $('.social-footer-ignoremenu').on('click', function() {
        let t_friendsm = $('.social-type-friends').position();
        let t_invitesm = $('.social-type-invites').position();

        if (t_friendsm.left == 0) {
          toggleInvites('hide');
          toggleFriends('hide');
          toggleIgnores('show');
        } else if (t_friendsm.left == -270) {
          if (t_invitesm.left == 0) {
            toggleInvites('hide');
            toggleFriends('hide');
            toggleIgnores('show');
          } else if (t_invitesm.left == -270) {
            toggleIgnores('hide');
            toggleInvites('hide');
            toggleFriends('show');
          }
        }
      });

      // Toggle add friends function
      function toggleInvites(mode) {
        if (mode == 'show') {
          $('.social-type-invites').animate({'left': '0'}, "slow");
          $('.social-footer-addfriend').animate({'color': 'green'}, "slow");
        } else if (mode == 'hide') {
          $('.social-type-invites').animate({'left': '-270px'}, "slow");
          $('.social-footer-addfriend').animate({'color': '#eee'}, "slow");
        }
      }

      // Toggle ignores function
      function toggleIgnores(mode) {
        if (mode == 'show') {
          $('.social-type-ignores').animate({'left': '0'}, "slow");
          $('.social-footer-ignoremenu').animate({'color': 'yellow'}, "slow");
        } else if (mode == 'hide') {
          $('.social-type-ignores').animate({'left': '-270px'}, "slow");
          $('.social-footer-ignoremenu').animate({'color': '#eee'}, "slow");
        }
      }

      // Toggle friends function
      function toggleFriends(mode) {
        if (mode == 'show') {
          $('.social-type-friends').animate({'left': '0'}, "slow");
        } else if (mode == 'hide') {
          $('.social-type-friends').animate({'left': '-270px'}, "slow");
        }
      }

      // Add friend input
      $('.add-friends-input').off('keyup');
      $('.add-friends-input').on('keyup', function(e) {
        if (e.which == 13) {
          let nick = $('.add-friends-input').val().trim();
          if (nick != "") {
            if (nick.length >= 3 && nick.length <= 20) {
              socket.emit('add friend', nick)
              $(this).val('');
            } else error_msg('This nick is too short or too long')
          } else error_msg('You have to type nickname')
        }
      });

      // Update description Function
      function updateDesc(pid, status, desc=null) {
        function update(t) {$('.social-content-friend-list .social-content-sub[pid='+pid+'] .social-friend-description').html('<span class="status-'+status+'">'+t+'</span>')}

        if (desc===null) { // Status change existing friend
          if (status == 0) update('Offline')
          else if (status == 1) update('Online')
          else if (status == 2) update('I am Away!')
        } else {
          if (status == 0) update('Offline')
          else if (status == 2) update('I am Away!')
          else if (status == 1) update(desc)
          else if (status == 3) update(desc)
        }

      }

      // Add new friendship request (to)
      socket.on('add friend requests', (data) => {
        $('.your-friend-requests .friend-req-title').after('<div class="friend-req" pid="'+data.pid+'"><span>'+data.nick+'</span><div class="friend-req-options"><i class="fa fa-times remove-request social-hover" pid="'+data.pid+'"></i></div></div>');
        if ($('.your-friend-requests .friend-req').length > 1) $('.no-pending-yfr').hide();
      })

      // Add new friendship request (from)
      socket.on('new friend request', (data) => {
        $('.friend-requests .friend-req-title').after('<div class="friend-req" pid="'+data.pid+'"><span>'+data.nick+'</span><div class="friend-req-options"><i class="fa fa-check request-accept social-hover" pid="'+data.pid+'"></i> <i class="fa fa-times request-decline social-hover" pid="'+data.pid+'"></i></div></div>');
        if ($('.friend-requests .friend-req').length > 1) $('.no-pending-fr').hide();
        notifyPendingFriendRequests();
      })

      // Load invites
      socket.on('load invites res', (data) => {
        if (data.type == 'sent') {
          $('.your-friend-requests .friend-req-title').after('<div class="friend-req" pid="'+data.pid+'"><span>'+data.nick+'</span><div class="friend-req-options"><i class="fa fa-times remove-request social-hover" pid="'+data.pid+'"></i></div></div>');
          if ($('.your-friend-requests .friend-req').length > 1) $('.no-pending-yfr').hide();
        }
        else if (data.type == 'req') {
          $('.friend-requests .friend-req-title').after('<div class="friend-req" pid="'+data.pid+'"><span>'+data.nick+'</span><div class="friend-req-options"><i class="fa fa-check request-accept social-hover" pid="'+data.pid+'"></i> <i class="fa fa-times request-decline social-hover" pid="'+data.pid+'"></i></div></div>');
          if ($('.friend-requests .friend-req').length > 1) $('.no-pending-fr').hide();
          notifyPendingFriendRequests();
        }
      })

      // Accept friend request
      $('.friend-requests').on('click', 'i.request-accept', function() {
        socket.emit('set friend', $(this).attr('pid'));
        $('.friend-requests div.friend-req[pid='+$(this).attr('pid')+']').remove();
        if ($('.friend-requests .friend-req').length == 1) $('.no-pending-fr').show();
        notifyPendingFriendRequests();
      })

      // Decline friend request
      $('.friend-requests').on('click', 'i.request-decline', function() {
        socket.emit('decline friend', $(this).attr('pid'));
        $('.friend-requests div.friend-req[pid='+$(this).attr('pid')+']').remove();
        if ($('.friend-requests .friend-req').length == 1) $('.no-pending-fr').show();
        notifyPendingFriendRequests();
      })

      // Friend request declined
      socket.on('declined friend request', (data) => {
        $('.your-friend-requests div.friend-req[pid='+data.pid+']').remove();
        if ($('.your-friend-requests .friend-req').length == 1) $('.no-pending-yfr').show();
      })

      // Friend request declined
      socket.on('cancelled friend request', (data) => {
        $('.friend-requests div.friend-req[pid='+data.pid+']').remove();
        if ($('.friend-requests .friend-req').length == 1) $('.no-pending-fr').show();
        notifyPendingFriendRequests();
      })

      // Remove friend request
      $('.your-friend-requests').on('click', 'i.remove-request', function() {
        socket.emit('remove friend request', $(this).attr('pid'));
        $('.your-friend-requests div.friend-req[pid='+$(this).attr('pid')+']').remove();
        if ($('.your-friend-requests .friend-req').length == 1) $('.no-pending-yfr').show();
      })

      // Friend request accepted
      socket.on('friend request accepted', (data) => {
        $('.social-content-friend-list').prepend('<div class="social-content-sub social-hover" pid="'+data.pid+'" status="'+data.socialstatus+'"><div class="social-friend"><div class="social-friend-icon"><span class="chat-box-newmsg badge badge-warning profile" pid="'+data.pid+'" data-new="0"></span><img class="status-'+data.socialstatus+'" src="../assets/imgs/profileicon/'+data.iconid+'.png"/></div><div class="social-friend-info"><div class="social-friend-nick"><span><b>'+data.nickname+'</b></span></div><div class="social-friend-description"></div></div><div style="clear: both"></div></div></div>');
        updateDesc(data.pid, data.socialstatus, data.description)
        if ($('.social-content-friend-list .social-content-sub').length > 0) $('.social-content-no-friends').hide();
        $('.your-friend-requests div.friend-req[pid='+data.pid+']').remove();
        $('.friend-requests div.friend-req[pid='+data.pid+']').remove();
        if ($('.your-friend-requests .friend-req').length == 1) $('.no-pending-yfr').show();
        if ($('.friend-requests .friend-req').length == 1) $('.no-pending-fr').show();
        notifyPendingFriendRequests();
      })

      // Load friends list
      socket.on('load friends res', (data) => {
        $('.social-content-friend-list').prepend('<div class="social-content-sub social-hover" pid="'+data.pid+'" status="'+data.socialstatus+'"><div class="social-friend"><div class="social-friend-icon"><span class="chat-box-newmsg badge badge-warning profile" pid="'+data.pid+'" data-new="0"></span><img class="status-'+data.socialstatus+'" src="../assets/imgs/profileicon/'+data.iconid+'.png"/></div><div class="social-friend-info"><div class="social-friend-nick"><span><b>'+data.nickname+'</b></span></div><div class="social-friend-description"></div></div><div style="clear: both"></div></div></div>');
        updateDesc(data.pid, data.socialstatus, data.description)
        if ($('.social-content-friend-list .social-content-sub').length > 0) $('.social-content-no-friends').hide();
      })

      // Update status on friend list
      socket.on('friend updated status', (data) => {
        $('.social-content-friend-list .social-content-sub[pid='+data.id+']').attr('status', data.status);
        $('.social-content-friend-list .social-content-sub[pid='+data.id+'] img').removeClass().addClass('status-'+data.status);
        updateDesc(data.id, data.status, data.desc);
        updateStatusOnChat(data.id, data.status);
      });

      // Update icon on friend list
      socket.on('friend updated icon', (data) => {
        $('.social-content-friend-list .social-content-sub[pid='+data.id+']').attr('status', data.status);
        $('.social-content-friend-list .social-content-sub[pid='+data.id+'] img').removeClass().addClass('status-'+data.status);
        $('.social-content-friend-list .social-content-sub[pid='+data.id+'] img').attr('src', '../assets/imgs/profileicon/'+data.icon+'.png');
        if ($('.chat-box-chats-chatter[cid='+data.id+']').length > 0) $('.chat-box-chats-chatter[cid='+data.id+'] img').attr('src', '../assets/imgs/profileicon/'+data.icon+'.png');
      });

    //////////////////////////////////////////
    // Add ignored player
      function tryIgnore(nick) {
        socket.emit('add ignore', {'nick': nick})
      }

      $('.add-ignore-input').on('keyup', function(e) {
        if (e.which == 13) {
          let nick = $('.add-ignore-input').val().trim();
          if (nick != "") {
            if (nick.length >= 3 && nick.length <= 20) {
              confirm_action(null, 'ignore', nick);
              $(this).val('');
            } else error_msg('This nick is too short or too long')
          } else error_msg('You have to type nickname')
        }
      });
      socket.on('add ignore res', (data) => {
        $('.your-ignores .ignore-title').after('<div class="friend-req ignored-p" pid="'+data.pid+'"><span>'+data.nick+'</span><div class="friend-req-options"><i class="fa fa-times remove-ignore social-hover" pid="'+data.pid+'"></i></div></div>');
        if ($('.your-ignores .ignored-p').length > 1) $('.no-ignores-yet').hide();
      })

      $('.your-ignores').on('click', 'i.remove-ignore', function() {
        socket.emit('remove ignore', {'pid': $(this).attr('pid')});
        $('.your-ignores div.ignored-p[pid='+$(this).attr('pid')+']').remove();
        if ($('.your-ignores .ignored-p').length == 1) $('.no-ignores-yet').show();
      })

      socket.on('load ignore res', (data) => {
        $('.your-ignores .ignore-title').after('<div class="friend-req ignored-p" pid="'+data.pid+'"><span>'+data.nick+'</span><div class="friend-req-options"><i class="fa fa-times remove-ignore social-hover" pid="'+data.pid+'"></i></div></div>');
        if ($('.your-ignores .ignored-p').length > 1) $('.no-ignores-yet').hide();
      })
    // End of 'add ignored players'
    //////////////////////////////////////////

    //////////////////////////////////////////
    // Unfriend player
      function tryUnfriend(pid) {
        socket.emit('remove friend', {'pid': pid})
      }

      socket.on('remove friend res', (pid) => {
        $('.social-content-sub[pid='+pid+']').remove();
        if($('.social-content-sub').length == 0) $('.social-content-no-friends').show();notifyPendingFriendRequests()
      })

      socket.on('friend removed you', (data) => {
        $('.social-content-sub[pid='+data.pid+']').remove();
        if($('.social-content-sub').length == 0) $('.social-content-no-friends').show();notifyPendingFriendRequests()
      })
    // End of 'unfriend player'
    //////////////////////////////////////////

    // Update status on chat
      function updateStatusOnChat(id, status) {
        var sel_img = $('.chat-box-chats-chatter[cid='+id+'] img');
        if ($('.chat-box-chats-chatter[cid='+id+']').length > 0) {
          sel_img.removeClass();
          sel_img.addClass('chat-box-chatter-img status-'+status);
        }
      }

    // Online players on global chat show
      socket.on('online users', data => {
        if ($('.chat-box-chats-chatter[cid=0]').attr('data-selected') == 'true') updateChatTitle('Public Chat - ('+data.loggedin+' logged in / '+data.online+' online) ')
      })

    // Remote homepage
      // $(function() {
      //   setTimeout(() => {
      //     $('.remote-homepage').contents().find('span.nickname').html(localStorage.getItem('nickname'));
      //   }, 500)
      // })

    // Homepage menu
        $('button.client-menu-playbtn').on('click', function(x) {
          if ($('button.client-menu-playbtn').attr('data-lobby') == 'true') return false;
          if (($('.client-menu-playbtn').attr('data-selected') == 'false') && (($('.client-menu-play-modes').height() == 0) || ($('.client-menu-play-sub').css('display') == 'none') )) {
            $('.client-menu-playbtn').attr({'data-selected': 'true'});
            $('.client-menu-play-sub').toggle(1, function() {
              $('.client-menu-play-modes').animate({'height': '38px'}, 400, function() {
                $('.client-menu-mode-btn').show();
                $('.client-menu-mode-btn').animate({'opacity': '1'}, 400);
              });
            });
          } else if (($('.client-menu-playbtn').attr('data-selected') == 'true') && (($('.client-menu-play-modes').height() == 38) || ($('.client-menu-play-sub').css('display') == 'block') )) {
            $('.client-menu-mode-btn').animate({'opacity': 0}, 300, () => {
              $('.client-menu-play-modes').animate({'height': '0px'}, 400, () => {
                $('.client-menu-play-modes').css({'height': '0px'})
                $('.client-menu-mode-btn').hide();
                $('.client-menu-play-sub').hide();
                $('.client-menu-playbtn').attr({'data-selected': 'false'});
              });
            });
          }
          // $('.client-menu-playbtn').removeAttr('data-selected');

        })

      function customGamesList() {
        $('.client-menu-play-custom').one('click', () => {
          $('.loader').show().animate({'opacity': 1}, 200)
          if ($('.client-menu-play-modes').height() != 0) {
            $('.client-menu-mode-btn').animate({'opacity': 0}, 'slow', () => {
              $('.client-menu-play-modes').animate({'height': '0%'}, 400, () => {
                $('.client-menu-play-sub').hide();
                $('section[name=customGames]').animate({'opacity': 1});
                $('.loader').animate({'opacity': 0}, 200, () => {
                  $('.loader').hide();
                })
              });
              $('.client-menu-mode-btn').hide();
            });
            $('.client-menu-playbtn').attr({'data-selected': 'false'});

            $('.client-menu-play-custom').css({'background-color': 'rgba(255, 255, 255, 0.1)', 'cursor': 'not-allowed', 'color': 'rgba(255, 255, 255, 0.8)'});
            $('.client-menu-play-custom').attr({'custom-list': true});
            $('.client-menu-play-custom').off('click');

            $( ".homepage" ).load( "models/customs.html", function() {
              socket.emit('custom game list load');

              $('.cG-enter-fastcode').off('click');
              $('.cG-enter-fastcode').on('click', function() {$('.joinviafastcodemodal').appendTo("body").modal()});

              $('.cG-trs').on('click', 'tr[cG-room]', function() {
                let token = $(this).attr('cG-room-token')
                let password = $(this).attr('cG-room-password')

                if (password == 'true') {
                  $('.enter-cg-password').appendTo('body').modal();
                  $('#cG_join_with_password_btn').off('click');
                  $('#cG_join_with_password_btn').on('click', function() {
                    socket.emit('custom game join', {'password': $('#cG_join_need_password_input').val(), 'token': token})
                  })

                  $('.enter-cg-password').on('hidden.bs.modal', function () {
                    $('.cG_join_with_password_btn').off('click');
                  })
                } else socket.emit('custom game join', {'token': token})
              })

              $('button.close-customs-btn').on('click', () => {
                $('.client-menu-play-custom').css({'background-color': '', 'cursor': 'pointer', 'color': 'white'});
                $('section[name=customGames]').animate({'opacity': 0}, () => {
                  $('section[name=customGames]').remove();
                })
                $('.cGC-create-room-btn').off('click');
                $('button.close-customs-btn').off('click');
                $('.joinviafastcodemodal').remove();
                customGamesList();
                eventStatusDescEnd();
              })

              $('.joinviafastcodemodal').on('shown.bs.modal', function() {
                $(this).find('#cG_join_via_fastcode_input').focus()
              });

              $('.cG-create-new-room').on('click', function() {
                $('.cG-customs').fadeOut(500, () => {$('.cG-customs').hide();$('.cG-create-new-game').fadeIn(800)});
                $('.back-to-customs-btn').on('click', () => {
                  $('.cG-create-new-game').fadeOut(500, () => {$('.cG-create-new-game').hide();$('.cG-customs').fadeIn(800);eventStatusDescEnd()});
                })
                $('.cGC-inputs-name').val("Player's game: "+localStorage.getItem('nickname'))
                $('.cGC-fast-code-prefix-span').val('p'+localStorage.getItem('playerid'))
                $('.cGC-fast-code-prefix-span').text('p'+localStorage.getItem('playerid')+'-')
                $('.cGC-fast-code-prefix-span').attr({'cGC-fastcode-prefix': 'p'+localStorage.getItem('playerid'), 'title': 'This is your fastcode prefix (p'+localStorage.getItem('playerid')+'-xxxxxx)'})
                changeEventStatus('Creating lobby');
              })

              $('.cGC-label-show-password').on('click', function() {($('.cGC-show-password').is(':checked')) ? $('.cGC-inputs-password').attr('type', 'text') : $('.cGC-inputs-password').attr('type', 'password')})
              $('.cGC-label-show-fastcode').on('click', function() {($('.cGC-show-fastcode').is(':checked')) ? $('.cGC-inputs-fastcode').attr('type', 'text') : $('.cGC-inputs-fastcode').attr('type', 'password')})
              $('.cGC-copy-fastcode').on('click', function() {
                let fastCode = $('.cGC-inputs-fastcode').val();
                let fastCodePrefix = $('.cGC-fast-code-prefix-span').attr('cgc-fastcode-prefix');

                if ((fastCode.length >= 1) && (fastCode.length <= 12)) {
                  copyToClipboard(fastCodePrefix + '-' + fastCode);
                  success_msg('Fastcode with prefix has been copied!')
                } else {
                  if (fastCode.length > 12) error_msg('Your Fastcode is too long! (Max 12 chars)')
                  else if (fastCode.length == 0) error_msg('You need to enter Fastcode first')
                }
              });

              $('#cGC-inputs-fastcode').on('keyup', function() {
                if ($('.cGC-inputs-fastcode').val().length > 0) $('.cGC-copy-fastcode').removeAttr('disabled'); else $('.cGC-copy-fastcode').attr({'disabled': 'disabled'})});

              $('.cGC-inputs-name').on('keyup', function() {
                if (($('.cGC-inputs-name').val().length >= 3) && ($('.cGC-map-radio[name=cGC-map]:checked').length > 0)) $('.cGC-create-room-btn').removeAttr('disabled'); else $('.cGC-create-room-btn').attr({'disabled': 'disabled'})
              });

              $('.cGC-map-radio[name=cGC-map]').on('change', function() {
                if (($('.cGC-inputs-name').val().length >= 3) && ($('.cGC-map-radio[name=cGC-map]:checked').length > 0)) $('.cGC-create-room-btn').removeAttr('disabled');
                else $('.cGC-create-room-btn').attr({'disabled': 'disabled'})
              });

              var newgamee = $('.cGC-create-room-btn').one('click', function() {
                $('.loader').show().animate({'opacity': 1}, 300);
                $('.cGC-create-room-btn').attr({'disabled': 'disabled'})
                $('.back-to-customs-btn').attr({'disabled': 'disabled'})
                $('.close-customs-btn').attr({'disabled': 'disabled'})

                let map = $('.cGC-map-radio[name=cGC-map]:checked').val(),
                name = $('.cGC-inputs-name').val().trim(),
                password = $('.cGC-inputs-password').val(),
                fastcode = $('.cGC-inputs-fastcode').val(),
                mode = $('.cGC-inputs-mode').val(),
                cheats = $('.cGC-inputs-cheats').val(),
                minions = $('.cGC-inputs-minions').val(),
                cooldowns = $('.cGC-inputs-cooldowns').val(),
                teamsize = $('.cGC-inputs-teamsize').val()

                socket.emit('custom game create', {'map': map, 'name': name, 'password': password, 'fastcode': fastcode, 'settings': {
                  'mode': mode, 'cheats': cheats, 'minions': minions, 'cooldowns': cooldowns, 'teamsize': teamsize}
                })

                changeEventStatus('In lobby');

              })

            });
          }
        })
      } customGamesList();

      $('body').on('keyup', 'input#cG_join_via_fastcode_input', function(e) {
        if (e.which === 13) {$('#cG_join_via_fastcode_btn').trigger('click')}
        if ($('input#cG_join_via_fastcode_input').val().length > 3) $('button#cG_join_via_fastcode_btn').removeAttr('disabled');
        else $('button#cG_join_via_fastcode_btn').attr({'disabled': 'disabled'});
      })

      $('body').on('click', 'button#cG_join_via_fastcode_btn', function() {
        socket.emit('custom game join via fastcode', $('input#cG_join_via_fastcode_input').val());$('input#cG_join_via_fastcode_input').val('')
      })

      socket.on('fastcode secret response', (res) => {if (res == 'success') {$('.joinviafastcodemodal').modal('hide'); setTimeout(() => {$('.joinviafastcodemodal').remove()},1000)}});

      // Scroll lobby chat to the bottom
      function scrollLobbyBottomSChat() {
        var chatbox_sc = document.getElementById("cGL-chat-messages");
        chatbox_sc.scrollTop = chatbox_sc.scrollHeight;
      }

      function isAnyCustomThere() {if ($('[cG-room]').length == 0) $('[cG-no-rooms]').show('fade', {}, 'slow'); else $('[cG-no-rooms]').hide('fade', {}, 'slow')}
      socket.on('custom game create res', (data) => {
        $('.loader').animate({'opacity': 0}, 300, () => {$('.loader').hide()});
        $('.back-to-customs-btn').removeAttr('disabled')
        $('.close-customs-btn').removeAttr('disabled')
        if (data.type == 'success') {

          let mapval = $('.cGC-map-radio[name=cGC-map]:checked').val(),
          name = $('.cGC-inputs-name').val().trim(),
          password = $('.cGC-inputs-password').val(),
          modeval = $('.cGC-inputs-mode').val(),
          cheats = $('.cGC-inputs-cheats').val(),
          minions = $('.cGC-inputs-minions').val(),
          cooldowns = $('.cGC-inputs-cooldowns').val(),
          teamsize = $('.cGC-inputs-teamsize').val(),
          ispsswd = false;

          $('.cGC-create-room-btn').removeAttr('disabled')
          success_msg(data.msg);

          $('button.client-menu-playbtn').attr({'data-lobby': true}).text('IN LOBBY');
          $('.client-menu-play-custom').css({'background-color': '', 'cursor': 'pointer', 'color': 'white'});
          $('section[name=customGames]').animate({'opacity': 0}, () => {
            $('section[name=customGames]').remove();
          })
          customGamesList();

          $('.homepage').css({'opacity': 0}).hide();
          $('.homepage').load('./models/customs_lobby.html', function() { ///////////// LOAD

            $(document).ready(() => {
              $('.homepage').on('keyup', 'input#cGL-chat-input', function(e) {
                if ((e.which === 13) && ($('input#cGL-chat-input').val().length > 0) && ($('input#cGL-chat-input').val().length <= 128)) {
                  socket.emit('custom game send message', $('input#cGL-chat-input').val()); $('input#cGL-chat-input').val('');
                }
              });
              $('body > .cGL-invite-friends-modal').remove();
              $('.homepage .cGL-invite-friends-modal').appendTo('body');
            })

            $('section[name=customGames-lobby]').attr({'token': data.info.cGID})

            $('.exit-cGL').on('click', function() {
              socket.emit('custom game leave', {'cGID': $('section[name=customGames-lobby]').attr('token')})
              $('section[name=customGames-lobby]').fadeOut(600, function() {
                $('.client-menu-playbtn').attr({'data-lobby': 'false'}).text('PLAY');
                $('section[name=customGames-lobby]').remove();
                $('.cGC-create-room-btn').off('click');
                $('.cG-enter-fastcode').off('click');
                $('button.close-customs-btn').off('click');
                eventStatusDescEnd();
              })
              $('#login-page').css({'background-image': 'url("../assets/imgs/loginBG.jpg")'})
            });

            if (password.length > 0) ispsswd = true;
            let padlock = (ispsswd)?'<i class="fa fa-lock"></i>':'<i class="fa fa-unlock"></i>', map, picktype;
            switch(mapval) {
              case '1': map = 'Summoner\'s rift'; $('#login-page').css({'background-image': 'url("../assets/imgs/mapsimgs/sr.jpg")'});break;
              case '2': map = 'Howling abyss';$('#login-page').css({'background-image': 'url("../assets/imgs/mapsimgs/ha.jpg")'});break;
              case '3': map = 'Twisted threeline';$('#login-page').css({'background-image': 'url("../assets/imgs/mapsimgs/tt.jpg")'});break;
              case '4': map = 'Crystal scar';$('#login-page').css({'background-image': 'url("../assets/imgs/mapsimgs/cs.jpg")'});break;
            }
            $('#login-page').css({'filter': 'blur(8px)'});
            switch(modeval) {
              case '0': picktype = 'Blind pick';break;
              case '1': picktype = 'Draft pick';break;
              case '2': picktype = 'Random pick';break;
            }

            function yesOrNotSetting(s) {
              switch(s) {
                case '0': return('Yes'); break;
                case '1': return('No'); break;
              }
            }

            teamsize = parseInt(teamsize)+1;

            $('.cGL-title').html('<h3>'+padlock+' '+name+'</h3>')
            $('.cGL-settings').html('Map: '+map+' - '+picktype+': '+teamsize+'x'+teamsize+' - Minions: '+yesOrNotSetting(minions)+' - Cooldowns: '+yesOrNotSetting(cooldowns)+' - Cheats: '+yesOrNotSetting(cheats)+'')

            for (i=1; i <= teamsize; i++) {
              $('.cGL-team-blue > .cGL-player-in-team:nth-child('+i+')').addClass('empty').text('Empty');
              $('.cGL-team-red > .cGL-player-in-team:nth-child('+i+')').addClass('empty').text('Empty');
            }
            $('.cGL-team-red > .cGL-player-in-team.empty').first().html('<button class="darkmit cGL-join-btn">Join</button>Empty');

            $(function () {
              $('[data-toggle="tooltip"]').tooltip()
            })

            $('.cGL-team-blue > .cGL-player-in-team.empty').first().before('\
            <div class="cGL-player-in-team full" pid="'+localStorage.getItem('playerid')+'">\
              <div class="cGL-player-img"><img src="'+$('.social-header-sub .social-icon img').attr('src')+'" /></div>\
              <div class="cGL-player-nick-options">\
                <div class="cGL-player-nick"><i class="fas fa-crown"></i> <span>'+ $('.social-header-pinfo .social-nick b').text() +'</span></div>\
                <div class="cGL-player-option">\
                  <button class="cGL-player-option-btn btn btn-primary" setting="4" data-toggle="tooltip" data-placement="bottom" title="Show player\'s profile"><i class="fas fa-address-card"></i></button>\
                </div>\
              </div>\
            </div>')
            $('.cGL-team-blue > .cGL-player-in-team.empty').last().remove();

            $('.cGL-chat-messages').append('<div class="cGL-chat-message"><i>'+$('.social-header-pinfo .social-nick b').text()+' joined the lobby!</i></div>');

            $('.cGL-invite-friend-btn').removeAttr('disabled');
            $('.cGL-start-game-btn').removeAttr('disabled');

          }).show().animate({'opacity': 1}, 600)


        } else if (data.type == 'error') {

          if (data.msg != null) {
            error_msg(data.msg)

            switch(data.eID) {
              case 1: console.log('error1'); break;
            }
          }

        }
      })

      socket.on('custom game player joined', function(data) {
        if (data.pid != localStorage.getItem('playerid')) {
          let team = (data.team)?'blue':'red'
          $('section[name=customGames-lobby] .cGL-chat-messages').append('<div class="cGL-chat-message"><i>'+data.nick+' joined to the lobby!</i></div>');
          scrollLobbyBottomSChat();

          let kingid = $('.cGL-player-nick .fa-crown').parents('.cGL-player-in-team').attr('pid');

          $(function () {
            $('[data-toggle="tooltip"]').tooltip()
          })

          $('.cGL-team-'+team+' > .cGL-player-in-team.empty').first().before('\
          <div class="cGL-player-in-team full" pid="'+data.pid+'">\
            <div class="cGL-player-img"><img src="../assets/imgs/profileicon/'+data.iconid+'.png" /></div>\
            <div class="cGL-player-nick-options">\
              <div class="cGL-player-nick"><span>'+ data.nick +'</span></div>\
              <div class="cGL-player-option">\
                '+((kingid == localStorage.getItem('playerid'))?'\
                <button class="cGL-player-option-btn btn btn-danger" setting="0" data-toggle="tooltip" data-placement="bottom" title="Kick this player from lobby"><i class="fas fa-user-times"></i></button>\
                <button class="cGL-player-option-btn btn btn-primary" setting="1" data-toggle="tooltip" data-placement="bottom" title="Allow/disallow this player to send invites"><i class="fas fa-user-plus"></i></button>\
                <button class="cGL-player-option-btn btn btn-primary" setting="2" data-toggle="tooltip" data-placement="bottom" title="Give him your crown"><i class="fas fa-crown"></i></button>':'\
                <button class="cGL-player-option-btn btn btn-danger no-king" setting="0" data-toggle="tooltip" data-placement="bottom" title="Kick this player from lobby"><i class="fas fa-user-times"></i></button>\
                <button class="cGL-player-option-btn btn btn-primary no-king" setting="1" data-toggle="tooltip" data-placement="bottom" title="Allow/disallow this player to send invites"><i class="fas fa-user-plus"></i></button>\
                <button class="cGL-player-option-btn btn btn-primary no-king" setting="2" data-toggle="tooltip" data-placement="bottom" title="Give him your crown"><i class="fas fa-crown"></i></button>')+'\
                '+((($('.social-content-sub[pid='+data.pid+']').length == 0) && (data.pid != parseInt(localStorage.getItem('playerid'))))?'<button class="cGL-player-option-btn btn btn-success" setting="3" data-toggle="tooltip" data-placement="bottom" title="Ask this player for friendship"><i class="fas fa-plus"></i></button>':'')+'\
                <button class="cGL-player-option-btn btn btn-primary" setting="4" data-toggle="tooltip" data-placement="bottom" title="Show player\'s profile"><i class="fas fa-address-card"></i></button>\
              </div>\
            </div>\
          </div>')
          $('.cGL-team-'+team+' > .cGL-player-in-team.empty').last().remove();
        }
      })

      socket.on('custom game player left', function(data) {
        $('section[name=customGames-lobby] .cGL-player-in-team[pid='+data.pid+']').remove();
        if ($('section[name=customGames-lobby] .cGL-team-'+data.teamcolor+' .cGL-player-in-team.full').length > 0) {
          $('section[name=customGames-lobby] .cGL-team-'+data.teamcolor+' .cGL-player-in-team.full').last().after('<div class="cGL-player-in-team empty">Empty</div>');
        } else {
          $('section[name=customGames-lobby] .cGL-team-'+data.teamcolor+' .cGL-player-in-team').first().before('<div class="cGL-player-in-team empty">Empty</div>');
        }


        let teamcolor = $('.cGL-player-in-team.full[pid='+localStorage.getItem('playerid')+']').parents('.cGL-team-list').attr('teamcolor');
        $('.cGL-player-in-team.empty button').remove();
        $('.cGL-team-'+((teamcolor == 'red')?'blue':'red')+' .cGL-player-in-team.empty').first().prepend('<button class="darkmit cGL-join-btn">Join</button>');

        if (!data.started) {$('section[name=customGames-lobby] .cGL-chat-messages').append('<div class="cGL-chat-message"><i>'+data.nick+' left the lobby.</i></div>')}
        scrollLobbyBottomSChat();
      })

      socket.on('custom game icon changed', function(data) {$('section[name=customGames-lobby] .cGL-player-in-team[pid='+data.pid+'] .cGL-player-img img').attr({'src': '../assets/imgs/profileicon/'+data.iconid+'.png'})})

      function addNewLobbyRoomToList(value) {
        if (value.started != 'true') {
          let padlock = (value.password)?'<i class="fa fa-lock">':'<i class="fa fa-unlock">', map;
          switch(value.map) {
            case 1: map = 'Summoner\'s rift';break;
            case 2: map = 'Howling abyss';break;
            case 3: map = 'Twisted threeline';break;
            case 4: map = 'Crystal scar';break;
          }

          let teamsize = value.online+'/'+(parseInt(value.teamsize)+1)*2;
          $('.cG-trs').prepend('<tr cG-room style="opacity: 0; height: 0" cG-room-token="'+value.token+'" cG-room-password="'+value.password+'"><td>'+padlock+'</td><td>'+value.name+'</td><td>'+map+'</td><td cGL-td-teamsize="'+(parseInt(value.teamsize)+1)*2+'" cGL-td-online="'+value.online+'">'+teamsize+'</td><td>'+value.createdby+'</td></tr>');
          $('tr[cG-room-token="'+value.token+'"]').animate({'height': '34px', 'opacity': 1}, 600)
        }
      }

      socket.on('custom game list load res', function(cGLR) {
        $('.cG-trs').html('<tr cG-no-rooms><td></td><td colspan="4">There is no rooms yet! (You can create one)</td></tr>');

        $.each(cGLR, function (index, value) {
          addNewLobbyRoomToList(value)
        }); isAnyCustomThere();
      });

      socket.on('custom game info update', function(data) {
        if ($('.client-menu-play-custom').attr('custom-list')) {
          let listedGame = $('tr[cG-room-token="'+data.token+'"]'), online, max;

          switch(data.type) {
            case 1: // New player joined online++
              online = listedGame.find('td[cGL-td-online]').attr('cGL-td-online');
              max = listedGame.find('td[cGL-td-teamsize]').attr('cGL-td-teamsize');
              listedGame.find('td[cGL-td-online]').attr({'cGL-td-online': parseInt(online)+1});
              listedGame.find('td[cGL-td-online]').html((parseInt(online)+1)+'/'+max)
              break;
            case 2: // Player left lobby--
              online = listedGame.find('td[cGL-td-online]').attr('cGL-td-online');
              max = listedGame.find('td[cGL-td-teamsize]').attr('cGL-td-teamsize');
              listedGame.find('td[cGL-td-online]').attr({'cGL-td-online': parseInt(online)-1});
              listedGame.find('td[cGL-td-online]').html((parseInt(online)-1)+'/'+max);
              break;
            case 6: // Show room after force champion select stop
              listedGame.show('fade', {}, 'slow', () => {listedGame.attr('cG-room');isAnyCustomThere()});
              break;
            case 7: // Hide room after start
              listedGame.hide('fade', {}, 'slow', () => {listedGame.removeAttr('cG-room');isAnyCustomThere()});
              break;
            case 8: // Room created (show new room)
              addNewLobbyRoomToList(data.newroom);isAnyCustomThere();
              break;
            case 9: // Room removed
              listedGame.animate({'opacity': 0, 'height': 0}, 600, () => {listedGame.remove(); isAnyCustomThere()});
              break;
          }
        }

        if ((data.type == 9) && ($('.social-game-invitation[token="'+data.token+'"]').length == 1)) {
          $('.social-game-invitation[token="'+data.token+'"]').css({'background-color': 'rgba(169, 13, 13, 0.41)'}).hide('drop', { direction: 'left'}, 'slow', function() {
            $('.social-game-invitation[token="'+data.token+'"]').remove()})
        }
      })

      socket.on('custom game moved', function(data) {
        if (data.ispsswd) $('.enter-cg-password').modal('toggle');
        $('.client-menu-play-custom').css({'background-color': 'rgba(255, 255, 255, 0.1)', 'cursor': 'not-allowed', 'color': 'rgba(255, 255, 255, 0.8)'});
        $('.client-menu-play-custom').attr({'custom-list': true});
        $('.client-menu-playbtn').attr({'data-lobby': 'true'}).text('IN LOBBY');

        $('.homepage').fadeOut(500, () => {$('.homepage').load('./models/customs_lobby.html', function() { ///////////// LOAD

          $('section[name=customGames-lobby]').attr({'token': data.gametoken})

          $('.exit-cGL').on('click', function() {
            socket.emit('custom game leave', {'cGID': $('section[name=customGames-lobby]').attr('token')})
            $('section[name=customGames-lobby]').fadeOut(600, function() {
              $('.client-menu-playbtn').attr({'data-lobby': 'false'}).text('PLAY');
              $('.client-menu-play-custom').css({'background-color': '', 'cursor': 'pointer', 'color': 'white'});
              $('.client-menu-play-custom').attr({'custom-list': false});
              $('section[name=customGames-lobby]').fadeOut(700, () => {$('section[name=customGames-lobby]').remove()});
              $('.cGC-create-room-btn').off('click');
              $('.cG-enter-fastcode').off('click');
              $('button.close-customs-btn').off('click');
              customGamesList();
              eventStatusDescEnd()
            })
            $('#login-page').css({'background-image': 'url("../assets/imgs/loginBG.jpg")'})
          });

          $(document).ready(() => {
            $('.homepage').on('keyup', 'input#cGL-chat-input', function(e) {
              if ((e.which === 13) && ($('input#cGL-chat-input').val().length > 0) && ($('input#cGL-chat-input').val().length <= 128)) {
                socket.emit('custom game send message', $('input#cGL-chat-input').val()); $('input#cGL-chat-input').val('');
              }
            });
            $('body > .cGL-invite-friends-modal').remove();
            $('.cGL-invite-friends-modal').appendTo('body');
            changeEventStatus('In lobby');
          })

          let padlock = (data.ispsswd)?'<i class="fa fa-lock"></i>':'<i class="fa fa-unlock"></i>', map, picktype;
          switch(data.map) {
            case 1: map = 'Summoner\'s rift'; $('#login-page').css({'background-image': 'url("../assets/imgs/mapsimgs/sr.jpg")'});break;
            case 2: map = 'Howling abyss';$('#login-page').css({'background-image': 'url("../assets/imgs/mapsimgs/ha.jpg")'});break;
            case 3: map = 'Twisted threeline';$('#login-page').css({'background-image': 'url("../assets/imgs/mapsimgs/tt.jpg")'});break;
            case 4: map = 'Crystal scar';$('#login-page').css({'background-image': 'url("../assets/imgs/mapsimgs/cs.jpg")'});break;
          }
          $('#login-page').css({'filter': 'blur(8px)'});
          switch(data.type) {
            case 0: picktype = 'Blind pick';break;
            case 1: picktype = 'Draft pick';break;
            case 2: picktype = 'Random pick';break;
          }

          function yesOrNotSetting(s) {
            switch(s) {
              case 0: return('Yes'); break;
              case 1: return('No'); break;
            }
          }

          teamsize = data.teamsize+1;

          $('.cGL-title').html('<h3>'+padlock+' '+data.name+'</h3>')
          $('.cGL-settings').html('Map: '+map+' - '+picktype+': '+teamsize+'x'+teamsize+' - Minions: '+yesOrNotSetting(data.minions)+' - Cooldowns: '+yesOrNotSetting(data.cooldowns)+' - Cheats: '+yesOrNotSetting(data.cheats)+'')

          for (i=1; i <= teamsize; i++) {
            $('.cGL-team-blue > .cGL-player-in-team:nth-child('+i+')').addClass('empty').text('Empty');
            $('.cGL-team-red > .cGL-player-in-team:nth-child('+i+')').addClass('empty').text('Empty');
          }

          $.each(data.blue, function(i, value) {
            addPlayerToTeamCGL('blue', value, data.nicksets[value]['nick'], '../assets/imgs/profileicon/'+data.nicksets[value]['icon']+'.png')
          })

          $.each(data.purple, function(i, value) {
            addPlayerToTeamCGL('red', value, data.nicksets[value]['nick'], '../assets/imgs/profileicon/'+data.nicksets[value]['icon']+'.png')
          })

          addPlayerToTeamCGL((data.myteam)?'blue':'red', localStorage.getItem('playerid'), $('.social-header-pinfo .social-nick b').text(), $('.social-header-sub .social-icon img').attr('src'), true)

          $('.cGL-team-'+((data.myteam)?'red':'blue')+' > .cGL-player-in-team.empty').first().html('<button class="darkmit cGL-join-btn">Join</button>Empty');

          $(function () {
            $('[data-toggle="tooltip"]').tooltip()
          })

          function addPlayerToTeamCGL(team, pid, nick, icon, isme=false) {
            $('.cGL-team-'+team+' > .cGL-player-in-team.empty').first().before('\
            <div '+((isme)?'style="border-left: 5px solid gold;" ':'')+'class="cGL-player-in-team full" pid="'+pid+'">\
              <div class="cGL-player-img"><img src="'+icon+'" /></div>\
              <div class="cGL-player-nick-options">\
                <div class="cGL-player-nick"><span>'+ nick +'</span></div>\
                <div class="cGL-player-option">\
                '+((!isme)?'<button class="cGL-player-option-btn btn btn-danger no-king" setting="0" data-toggle="tooltip" data-placement="bottom" title="Kick this player from lobby"><i class="fas fa-user-times"></i></button>\
                <button class="cGL-player-option-btn btn btn-primary no-king" setting="1" data-toggle="tooltip" data-placement="bottom" title="Allow/disallow this player to send invites"><i class="fas fa-user-plus"></i></button>\
                <button class="cGL-player-option-btn btn btn-primary no-king" setting="2" data-toggle="tooltip" data-placement="bottom" title="Give him your crown"><i class="fas fa-crown"></i></button>':'')+'\
                '+((($('.social-content-sub[pid='+pid+']').length == 0) && (parseInt(pid) != parseInt(localStorage.getItem('playerid'))))?'<button class="cGL-player-option-btn btn btn-success" setting="3" data-toggle="tooltip" data-placement="bottom" title="Ask this player for friendship"><i class="fas fa-plus"></i></button>':'')+'\
                <button class="cGL-player-option-btn btn btn-primary" setting="4" data-toggle="tooltip" data-placement="bottom" title="Show player\'s profile"><i class="fas fa-address-card"></i></button>\
                </div>\
              </div>\
            </div>')
            $('.cGL-team-'+team+' > .cGL-player-in-team.empty').last().remove();
          }

          $('.cGL-player-in-team.full[pid='+data.king+'] .cGL-player-nick').prepend('<i class="fas fa-crown"></i> ');
          $('.cGL-chat-messages').append('<div class="cGL-chat-message"><i>'+$('.social-header-pinfo .social-nick b').text()+' joined the lobby!</i></div>');

          if ($('.social-game-invitation').length > 0) $('.social-game-invitation').fadeOut(400, function() {$('.social-game-invitation').remove()})

          if (data.invites.all.length > 0) {
            $('.cGL-invite-no-invites').hide();

            data.invites.all.forEach(function(index) {
              $('.cGL-invite-list').append ('<div class="cGL-invite" pid="'+index+'" status="pending"><div class="cGL-invite-nick">'+((index != localStorage.getItem('playerid'))?data.players[index]:localStorage.getItem('nickname'))+'</div><i class="fas fa-circle-notch fa-spin"></i></div>');

              if (data.invites.accepted.includes(index) || (index == localStorage.getItem('playerid'))) customGameMakeHimAccepted(index)
              if (data.invites.declined.includes(index) && (index != localStorage.getItem('playerid'))) customGameMakeHimDeclined(index)
            })

          }

        }).animate({'opacity': 1}, 600, () => {$('.homepage').fadeIn(600)})
      });
      });

      socket.on('custom game new message', function(data) {
        let crown = ''; if( $('.cGL-player-nick i').parents('.cGL-player-in-team.full').attr('pid') == data.pid) {crown = '<i class="fas fa-crown"></i> '};
        $('.cGL-chat-messages').append('<div class="cGL-chat-message"><b>'+crown+data.nickname+':</b> '+data.msg+'</div>');

        if (data.pid != localStorage.getItem('playerid')) {sound_newmsg_play()};
        scrollLobbyBottomSChat();
      });

      $('.homepage').on('click', 'button.cGL-player-option-btn', function () {
        let nick = $(this).parents('.cGL-player-in-team').find('.cGL-player-nick span').text().trim()

        switch($(this).attr('setting')) {
          case '0': confirm_action(null, 'kickfromlobby', $(this).parents('.cGL-player-in-team').attr('pid'), $('section[name="customGames-lobby"]').attr('token'), nick); $(this).tooltip('hide');break;
          case '1': socket.emit('custom game allow to invite', $(this).parents('.cGL-player-in-team').attr('pid'));$(this).tooltip('hide');break;
          case '2': confirm_action(null, 'givecrown', $(this).parents('.cGL-player-in-team').attr('pid'), null, nick); $(this).tooltip('hide');break;
          case '3': socket.emit('add friend', $(this).parents('.cGL-player-in-team').find('.cGL-player-nick span').text().trim());$(this).tooltip('hide');$(this).remove();break;
          case '4': info_msg('I should show '+nick+'\'s profile but it\'s not implemented yet!');break;
        }

      })

      function tryKickFromLobby(pid, token) {socket.emit('custom game kick player', {'kickedid': pid, 'token': token})}
      function tryRenounceCrown(pid) {socket.emit('custom game renounce crown', pid);}

      socket.on('custom game new king', (data) => {
        let oldkingnick = $('.cGL-player-in-team[pid='+data.oldkingid+']').find('.cGL-player-nick span').text().trim();
        let newkingnick = $('.cGL-player-in-team[pid='+data.newkingid+']').find('.cGL-player-nick span').text().trim();

        if (data.how) {
          $('.cGL-chat-messages').append('<div class="cGL-chat-message"><i style="color: gold">King left, but <b>'+newkingnick+'</b> caught the crown! Good job!</i></div>')
          $('.cGL-player-in-team[pid='+data.newkingid+'] .cGL-player-nick').prepend('<i class="fas fa-crown"></i> ');
        } else if (!data.how) {
          $('.cGL-chat-messages').append('<div class="cGL-chat-message"><i style="color: gold"><b>'+oldkingnick+'</b> gave his crown to the new king: <b>'+newkingnick+'!</b></i></div>')
          $('.cGL-player-in-team[pid='+data.oldkingid+'] .cGL-player-nick i').insertBefore($('.cGL-player-in-team[pid='+data.newkingid+'] .cGL-player-nick span')).after(' ');
        }; scrollLobbyBottomSChat();

        if (data.oldkingid == localStorage.getItem('playerid')) {
          $('.cGL-player-option-btn[setting="0"]').addClass('no-king')
          $('.cGL-player-option-btn[setting="1"]').addClass('no-king')
          $('.cGL-player-option-btn[setting="2"]').addClass('no-king')
          $('.cGL-start-game-btn').attr({'disabled': 'disabled'});$('.cGL-invite-friend-btn').attr({'disabled': 'disabled'})
        } else if (data.newkingid == localStorage.getItem('playerid')) {
          $('.cGL-player-option-btn[setting="0"]').removeClass('no-king')
          $('.cGL-player-option-btn[setting="1"]').removeClass('no-king')
          $('.cGL-player-option-btn[setting="2"]').removeClass('no-king')
          $('.cGL-start-game-btn').removeAttr('disabled');$('.cGL-invite-friend-btn').removeAttr('disabled')
        }
      })

      socket.on('custom game kicked', (kickedres) => {
        $('.cGL-chat-messages').append('<div class="cGL-chat-message"><i style="color: #00e5ff"><b>King</b> kicked and blocked '+kickedres.kickednick+'!</i></div>');
        scrollLobbyBottomSChat();

        if (kickedres.kickedid == localStorage.getItem('playerid')) {
          $('.kickedfromlobby').appendTo('body').modal();
          $('.kickedfromlobby').on('hidden.bs.modal', function() {$('.kickedfromlobby').remove()})
          $('#login-page').css({'background-image': 'url("../assets/imgs/loginBG.jpg")'});
          $('.homepage').fadeOut(700, () => {$('.homepage').html('').fadeIn(100);customGamesList()});
          $('.client-menu-playbtn').attr({'data-lobby': 'false'}).text('PLAY');
          $('.client-menu-play-custom').css({'background-color': '', 'cursor': 'pointer', 'color': 'white'});
          $('.client-menu-play-custom').attr({'custom-list': false});
        }
      })

      $('.homepage').on('click', 'button.cGL-join-btn', function() {
        socket.emit('custom game switch team');
      })

      socket.on('custom game switch team res', function(data) {
        $('.cGL-team-'+data.fromteam+' .cGL-player-in-team.full').last().after('<div class="cGL-player-in-team empty">Empty</div>');
        if ($('.cGL-team-'+data.toteam+' .cGL-player-in-team.full').length > 0) {
          $('.cGL-team-'+data.fromteam+' .cGL-player-in-team.full[pid='+data.pid+']').insertAfter($('.cGL-team-'+data.toteam+' .cGL-player-in-team.full').last())
        } else {
          $('.cGL-team-'+data.fromteam+' .cGL-player-in-team.full[pid='+data.pid+']').insertBefore($('.cGL-team-'+data.toteam+' .cGL-player-in-team.empty').first())
        }
        $('.cGL-team-'+data.toteam+' .cGL-player-in-team.empty').last().remove();

        let teamcolor = $('.cGL-player-in-team.full[pid='+localStorage.getItem('playerid')+']').parents('.cGL-team-list').attr('teamcolor');
        $('.cGL-player-in-team.empty button').remove();
        $('.cGL-team-'+((teamcolor == 'red')?'blue':'red')+' .cGL-player-in-team.empty').first().prepend('<button class="darkmit cGL-join-btn">Join</button>');
      })

      socket.on('custom game new perms', function(data) {
        let kingnick = $('.cGL-player-in-team[pid='+data.king+']').find('.cGL-player-nick span').text().trim();
        let permmitednick = $('.cGL-player-in-team[pid='+data.allowedid+']').find('.cGL-player-nick span').text().trim();

        switch(data.toggleto) {
          case 0:
            $('.cGL-chat-messages').append('<div class="cGL-chat-message"><i style="color: #64ff34"><b>'+kingnick+'</b> disallowed <b>'+permmitednick+'</b> to send invites!</i></div>');
            if (data.allowedid == localStorage.getItem('playerid')) {$('button.cGL-invite-friend-btn').attr({'disabled': 'disabled'});$('.cGL-invite-friends-modal').modal('hide')}
            if (data.king == localStorage.getItem('playerid')) $('.cGL-player-in-team.full[pid="'+data.allowedid+'"] .cGL-player-option-btn[setting="1"]').removeClass('granted')
            break;
          case 1:
            $('.cGL-chat-messages').append('<div class="cGL-chat-message"><i style="color: #64ff34"><b>'+kingnick+'</b> allowed <b>'+permmitednick+'</b> to send invites!</i></div>');
            if (data.allowedid == localStorage.getItem('playerid')) {$('button.cGL-invite-friend-btn').removeAttr('disabled');info_msg('<i class="fas fa-crown"></i> '+kingnick+' allowed you to send invites!')}
            if (data.king == localStorage.getItem('playerid')) $('.cGL-player-in-team.full[pid="'+data.allowedid+'"] .cGL-player-option-btn[setting="1"]').addClass('granted')
            break;
        }

        scrollLobbyBottomSChat();
      });

      $('.homepage').on('click', 'button.cGL-invite-friend-btn', function () {
        let atif = $('.social-content-sub[status=1]').length + $('.social-content-sub[status=2]').length;
        if (atif > 0) {
          $('.cGL-invite-friends-modal .modal-body').html(''); var pid, img, status, nick;
          $('.social-content-sub[status=1]').each(function () {
            appendInviteModal($(this).attr('pid'), $(this).attr('status'), $(this).find('.social-friend img').attr('src'), $(this).find('.social-friend-nick span b').text())});
          $('.social-content-sub[status=2]').each(function () {
            appendInviteModal($(this).attr('pid'), $(this).attr('status'), $(this).find('.social-friend img').attr('src'), $(this).find('.social-friend-nick span b').text())});

          function appendInviteModal(pid, status, img, nick) {
            $('.cGL-invite-friends-modal .modal-body').append('\
            <div class="friend" pid="'+pid+'">\
              <div class="img"><img class="status-'+status+'" src="'+img+'"/></div>\
              <div class="nick">'+nick+'</div>\
              <div class="add"><button class="darkmit"><i class="fa fa-plus"></i></button></div>\
            </div>')
            if (($('.cGL-invite[pid='+pid+']').attr('status') == 'pending') || ($('.cGL-player-in-team.full[pid='+pid+']').length > 0)) $('.friend[pid='+pid+']').css({'background': 'rgba(0, 99, 0, 0.2)'}).find('.add button')
            .attr({'disabled': 'disabled'})
          }
        } else $('.cGL-invite-friends-modal .modal-body').html('<div style="width: 100%; padding: 15px 5px; text-align: center"><b>No online friends at this moment</b></div>')
        $('.cGL-invite-friends-modal').modal()
      })

      $('body').on('click', '.cGL-invite-friends-modal .add button', function() {
        let pid = $(this).parents('.friend').attr('pid'), token = $('section[name="customGames-lobby"]').attr('token');
        socket.emit('custom game send new invate', {'friendspid': pid, 'token': token})
      })

      socket.on('custom game add new invitation', function(data) {
        if ($('.cGL-invite[pid="'+data.pid+'"]').length == 0) {
          $('.cGL-invite-list').append('\
          <div class="cGL-invite" pid="'+data.pid+'" status="pending" data-placement="bottom" data-toggle="tooltip" title="Invited by: '+data.from+'">\
            <div class="cGL-invite-nick">'+data.invated+'</div><i class="fas fa-circle-notch fa-spin"></i>\
          </div>'); $('[data-toggle="tooltip"]').tooltip();
        } else customGameMakeHimPending(data.pid);


        $('.cGL-invite-friends-modal .friend[pid='+data.pid+'] .add button').attr({'disabled': 'disabled', 'curser': 'not-allowed'});
        $('.cGL-invite-friends-modal .friend[pid='+data.pid+'] .add button').parents('.friend').attr({'disabled':'disabled'}).css({'background': 'rgba(0, 99, 0, 0.2)'})

        if ($('.cGL-invite-no-invites').css('display') == 'block') $('.cGL-invite-no-invites').hide();
        if (data.from == localStorage.getItem('nickname')) success_msg('Invite sent to '+data.invated);
      })

      socket.on('custom game invitation', function(data) {
        $('.social-game-invitations').prepend('<div class="social-game-invitation" token="'+data.token+'">\
          <div class="social-game-inv-img"><img src="../assets/imgs/mapsminis/sr.webp" /></div>\
          <div class="social-game-inv-info">\
            <div class="social-game-inv-map">'+data.map+'</div>\
            <div class="social-game-inv-nick">'+data.from+'</div>\
          </div>\
          <div class="social-game-inv-options">\
            <div class="social-game-inv-accept"><i class="fa fa-check"></i></div>\
            <div class="social-game-inv-decline"><i class="fa fa-times"></i></div>\
          </div>\
        </div>')
        $('.social-game-invitation').show('slow');
      });

      $('.social-game-invitations').on('click', '.social-game-invitation .social-game-inv-accept', function () {
        let token = $(this).parents('.social-game-invitation').attr('token');
        $(this).parents('.social-game-invitation').css({'background-color': 'rgba(30, 169, 13, 0.41)'}).hide('drop', { direction: 'left'}, 'slow', function() {
          $('.social-game-invitation[token="'+token+'"]').remove()})
        $('.social-game-inv-accept').off('click');
        socket.emit('custom game invitation accept', token);
      });
      $('.social-game-invitations').on('click', '.social-game-invitation .social-game-inv-decline', function () {
        let token = $(this).parents('.social-game-invitation').attr('token');
        $(this).parents('.social-game-invitation').css({'background-color': 'rgba(169, 13, 13, 0.41)'}).hide('drop', { direction: 'left'}, 'slow', function() {
          $('.social-game-invitation[token="'+token+'"]').remove()})
        socket.emit('custom game invitation decline', token);
      });

      socket.on('custom game invited left', (pid) => {customGameMakeHimDeclined(pid)})
      socket.on('custom game invited declined', (pid) => {customGameMakeHimDeclined(pid)})
      socket.on('custom game invited accepted', (pid) => {customGameMakeHimAccepted(pid)})

      function customGameMakeHimPending(pid) {
        let element = $('.cGL-invite[pid="'+pid+'"]');
        element.attr({'status': 'pending'});
        element.find('.cGL-invite-nick').removeClass('accepted').removeClass('decline');
        element.find('i').remove();
        element.append('<i class="fas fa-circle-notch fa-spin"></i>')
      }

      function customGameMakeHimDeclined(pid) {
        let element = $('.cGL-invite[pid="'+pid+'"]');
        element.attr({'status': 'declined'});
        element.find('.cGL-invite-nick').removeClass('accepted').addClass('decline');
        element.find('i').remove();
        element.append('<i class="fa fa-times decline"></i>')
      }

      function customGameMakeHimAccepted(pid) {
        let element = $('.cGL-invite[pid="'+pid+'"]');
        element.attr({'status': 'accepted'});
        element.find('.cGL-invite-nick').removeClass('decline').addClass('accepted');
        element.find('i').remove();
        element.append('<i class="fa fa-check accepted"></i>')
      }

      $('.homepage').on('click', 'button.cGL-start-game-btn', function () {
        confirm_action(null, 'startgame', null, $('section[name="customGames-lobby"]').attr('token'), null)
      });
      function tryCGStart(token) {socket.emit('custom game start', token)}

      socket.on('custom game started', function(data, info) {
        changeEventStatus('In champion select'); showChampionSelect(data, info);
        $('section[name="customGames-lobby"]').hide('fade', {}, 'slow');
      })

      socket.on('custom game force game stop', function(leaver, type, map) {
        music_blind_pick.pause();
        music_blind_pick.currentTime = 0;
        function whichMap(mapid) {switch(mapid) {case 1: return('sr');case 2: return('ha');case 3: return('tt');case 4: return('cs')}}
        $('.cGL-chat-messages').append('<div class="cGL-chat-message"><i style="color: #ff5a5a">'+((type == 2)?'Somebody did not choose any champion':'<b>'+leaver+'</b> left during the champion select.')+'</i></div>');
        sound_newmsg_play();scrollLobbyBottomSChat();$('.client-menu').animate({'top': '0'}, 'slow');
        $('.championselect').hide('fade', {}, 'fast', function() {$('.championselect').html('');$('section[name="customGames-lobby"]').show('fade', {}, 'slow')});
        setTimeout(() => {changeEventStatus('In lobby')}, 500); startFirstCSTimer('stop'); clearInterval(tickandtock); clearInterval(dangertimer)
        $('#login-page').css({'background-image': 'url("../assets/imgs/mapsimgs/'+whichMap(map)+'.jpg")'});
      })

      function showChampionSelect(data, info) {
        $('.client-menu').animate({'top': '-10vh'}, 'slow', function() {
          $('.championselect').load('./models/championselect.html', function() {
          var champjson = require('./../static_data/champion.json');champjson = champjson['data']; var typwmemqwe = [];
          $.each(champjson, function(index) {
            $('.cS-pool').append('<div class="cS-champion-to-select" data-champion="'+index+'"><label><input type="radio" name="champion" value="'+index+'" disabled /><img src="../assets/imgs/champion/'+index+'.png"></label></div>');

            typwmemqwe.push(index);
          })

          let allyint = 0;
          $.each(info.ally, function(i, v) {
            $('.cS-ally-picks').append('<div class="cS-summoner ally summoner-not-ready in" pid="'+i+'" data-no="'+allyint+'">\
              <img class="championimg" src="../assets/imgs/champion/unknown.webp" />\
              <div class="cS-summoner-info">\
                <div class="cS-summoner-nickname">'+v+'</div>\
                <div class="cS-summoner-champion">Selecting...</div>\
              </div>\
              <div class="cS-summoner-spells">\
                <div class="cS-spell-a"><img src="../assets/imgs/summs/'+info.summs[i].a+'.webp" /></div>\
                <div class="cS-spell-b"><img src="../assets/imgs/summs/'+info.summs[i].b+'.webp" /></div>\
              </div>\
            </div>');
            allyint++;
          })

          for (i=0;i<info.enemy;i++) {
            $('.cS-enemy-picks').append('<div class="cS-summoner enemy summoner-not-ready in" data-no="'+i+'">\
              <img class="championimg" src="../assets/imgs/champion/unknown.webp" />\
              <div class="cS-summoner-info">\
                <div class="cS-summoner-nickname">Summoner '+(i+1)+'</div>\
                <div class="cS-summoner-champion">Selecting...</div>\
              </div>\
              <div class="cS-summoner-spells"><div class="cS-spell-a"></div><div class="cS-spell-b"></div></div>\
            </div>');
          }

          $('.cS-summoner[placeholder="true"]').remove();

          $('.cS-w-map').text(data.map); $('.cS-w-mode').text(data.mode);
          $('.cS-info-top-map').text(data.map); $('.cS-info-top-mode').text(data.mode + ' - ' + data.teamsizes);
          $('.cS-info-top-is-custom').text(data.gametype);

          $('.cS-smm-a img').attr({'src': '../assets/imgs/summs/'+info.summs[localStorage.getItem('playerid')].a+'.webp'});$('.cS-smm-a').attr({'a': info.summs[localStorage.getItem('playerid')].a});
          $('.cS-smm-b img').attr({'src': '../assets/imgs/summs/'+info.summs[localStorage.getItem('playerid')].b+'.webp'});$('.cS-smm-b').attr({'b': info.summs[localStorage.getItem('playerid')].b});

          $(document).ready(() => {
            $('.cS-welcome').animate({'opacity': 1}, 600, function() {
            $('.cS-w-mode').animate({'right': '-100px'}, 300, function() {
              sound_dash_title();
              $('.cS-w-mode').animate({'right': '0px'}, 2500, function() {
                music_blind_pick.play()
                $('.cS-w-mode').animate({'right': '731px'}, 300);
                $('.cS-welcome').animate({'opacity': 0}, 300, function() {
                  $('.cS-welcome').hide();
                });
                socket.emit('champion select send message', {'type': 'message', 'msg': 'mynickname'});
                $('.cS-footer').css({'display': 'flex'}).animate({'opacity': 1});
                $('.cS-center-header').show('slow').animate({'opacity': 1}, 'slow', function() {
                  $('.cS-center-header span').animate({'opacity': 1});
                  $('.cS-center-header .cS-timer div').animate({'opacity': 1});
                  $('.cS-info-top').animate({'opacity': 1});
                  $('.cS-ally-picks').animate({'left': 0}, 400, function() {
                  sound_dash_title();
                  setTimeout(() => {
                    $('.cS-enemy-picks').animate({'right': 0}, 400, function() {
                      sound_dash_title();

                      $('.cS-smm-a').off('click');
                      $('.cS-smm-a').on('click', function(e) {
                        $('.cS-smm-b').popover('hide');
                        $('.cS-smm-a').popover('toggle');
                      });

                      $('.cS-smm-b').off('click');
                      $('.cS-smm-b').on('click', function(e) {
                        $('.cS-smm-a').popover('hide');
                        $('.cS-smm-b').popover('toggle');
                      });

                      $('body').off('click', '.popover .smmsa')
                      $('body').on('click', '.popover .smmsa', function() {
                        let aspell = $('.cS-smm-a').attr('a'), bspell = $('.cS-smm-b').attr('b'), newspella = $(this).find('img').attr('srealid');
                        if (bspell == newspella) {
                          $('.cS-smm-a').attr({'a': bspell}).find('img').attr({'src': '../assets/imgs/summs/'+bspell+'.webp'});
                          $('.cS-smm-b').attr({'b': aspell}).find('img').attr({'src': '../assets/imgs/summs/'+aspell+'.webp'});
                          socket.emit('summoner spell update', {'a': bspell, 'b': aspell})
                        } else {
                          $('.cS-smm-a').attr({'a': newspella}).find('img').attr({'src': '../assets/imgs/summs/'+newspella+'.webp'});
                          socket.emit('summoner spell update', {'a': newspella, 'b': false})
                        }
                        $('.cS-smm-a').popover('hide');
                      }); $('.cS-smm-a').on('shown.bs.popover', function() {$('.cS-smm-a').popover('update')})

                      $('body').off('click', '.popover .smmsb')
                      $('body').on('click', '.popover .smmsb', function() {
                        let aspell = $('.cS-smm-a').attr('a'), bspell = $('.cS-smm-b').attr('b'), newspellb = $(this).find('img').attr('srealid');
                        if (aspell == newspellb) {
                          $('.cS-smm-b').attr({'b': aspell}).find('img').attr({'src': '../assets/imgs/summs/'+aspell+'.webp'});
                          $('.cS-smm-a').attr({'a': bspell}).find('img').attr({'src': '../assets/imgs/summs/'+bspell+'.webp'});
                          socket.emit('summoner spell update', {'a': bspell, 'b': aspell})
                        } else {
                          $('.cS-smm-b').attr({'b': newspellb}).find('img').attr({'src': '../assets/imgs/summs/'+newspellb+'.webp'});
                          socket.emit('summoner spell update', {'a': false, 'b': newspellb})
                        }
                        $('.cS-smm-a').popover('hide');
                      }); $('.cS-smm-b').on('shown.bs.popover', function() {$('.cS-smm-b').popover('update')})

                      $('div.cS-champion-to-select').off('click')
                      $('div.cS-champion-to-select').on('click', 'label', function(e) {
                        if ($(this).find('input').attr('disabled') != 'disabled') {
                          let last = (($('input[name="champion"]:checked').length > 0)?$('input[name="champion"]:checked').val():false)
                          if (last == false) $('div.cS-submit-champ button').removeAttr('disabled');
                          let champion = $(this).parents('.cS-champion-to-select').attr('data-champion');
                          $('input[name="champion"]').removeAttr('checked')
                          $(this).find('input').attr({'checked': 'checked'})

                          socket.emit('champion select declarate', champion, last)
                        }
                        e.stopPropagation();
                        e.preventDefault();
                      })

                      $('div.cS-submit-champ button').off('click')
                      $('div.cS-submit-champ button').on('click', function(e) {
                        socket.emit('champion select try lock in', $('input[name="champion"]:checked').val())
                        // e.stopPropagation();
                        // e.preventDefault();
                      })

                      setTimeout(() => {
                        $('.cS-p-and-l').animate({'opacity': 1}, 600)
                      }, 1600)
                    })}, 1000)})})})})
          $('.cS-w-map').animate({'left': '-50px'}, 300, function() {
            sound_dash_title();
            $('.cS-w-map').animate({'left': '0px'}, 2500, function() {
              $('.cS-w-map').animate({'left': '805px'}, 300)
            })})})})
          }).show('slow').animate({'opacity': 1}, 600);
        })
      }

      function scrollBottomCSChat() {
        var chatbox_chs = document.getElementById("cS-chat-messages");
        chatbox_chs.scrollTop = chatbox_chs.scrollHeight;
      }

      $('.championselect').on('keyup', '.cS-chat-input input', function(e) {
        if ((e.which === 13) && ($('.cS-chat-input input').val().length > 0) && ($('.cS-chat-input input').val().length <= 128)) {
          socket.emit('champion select send message', $('.cS-chat-input input').val()); $('.cS-chat-input input').val('');
        }
      }); socket.on('champion select new message', function(data) {$('.cS-chat-messages').append('<div class="cS-chat-msg"><b>'+data.nickname+' </b>'+data.msg+'</div>');scrollBottomCSChat()})

      socket.on('champion select header update', (newheader) => {updateHeaderCS(newheader)})
      function updateHeaderCS(newheader) {$('.cS-header-bar span').hide('fade', {}, 'slow', () => {$('.cS-header-bar span').text(newheader).show('fade', {}, 'slow')})}

      socket.on('champion select new declarate', (champion, who, last) => {
        if (last != false) {
          $('.cS-champion-to-select[data-champion="'+last+'"] img').css({'filter': 'grayscale(0%)'});
          $('.cS-champion-to-select[data-champion="'+last+'"] label').css({'cursor': 'pointer'});
          $('.cS-champion-to-select[data-champion="'+last+'"] input').removeAttr('disabled');
        }

        $('.cS-summoner[pid="'+who+'"] .championimg').attr({'src': '../assets/imgs/champion/'+champion+'.png'})

        $('.cS-champion-to-select[data-champion="'+champion+'"] img').css({'filter': 'grayscale(100%)'});
        $('.cS-champion-to-select[data-champion="'+champion+'"] label').css({'cursor': 'not-allowed'});
        $('.cS-champion-to-select[data-champion="'+champion+'"] input').attr({'disabled': 'disabled'});
      })

      socket.on('champion select summoner spell update', function(which) {
        if (which.both) {
          $('.cS-summoner[pid="'+which.who+'"] .cS-spell-a img').attr({'src': '../assets/imgs/summs/'+which.a+'.webp'});
          $('.cS-summoner[pid="'+which.who+'"] .cS-spell-b img').attr({'src': '../assets/imgs/summs/'+which.b+'.webp'});
        } else {
          $('.cS-summoner[pid="'+which.who+'"] .cS-spell-'+which.x+' img').attr({'src': '../assets/imgs/summs/'+which.name+'.webp'});
        }
      })

      socket.on('champion select new ready', function(who, where) {
        if (where == 'success') {
          $('.cS-submit-champ button').off('click')
          $('.cS-submit-champ').off('click')
          $('.cS-submit-champ button').attr({'disabled': 'disabled'})
          $('div.cS-champion-to-select input').attr({'disabled': 'disabled'})
          $('div.cS-champion-to-select').off('click').css({'cursor': 'not-allowed'})
          $('div.cS-champion-to-select img').css({'filter': 'grayscale(100%)'})
          $('div.cS-champion-to-select label').off('click').css({'cursor': 'not-allowed'})
          $('#login-page').css({'background-image': 'url("../assets/imgs/splash/'+who+'_0.jpg")'});
        } else {
          if (where) {$('.cS-summoner.enemy[data-no="'+who+'"]').removeClass('summoner-not-ready in').css({'background-color': 'rgba(0, 0, 0, 0.2)'}, 'slow').find('.cS-summoner-champion').text('Ready!')}
          else {$('.cS-summoner.ally[pid="'+who+'"]').removeClass('summoner-not-ready in').css({'background-color': 'rgba(0, 0, 0, 0.2)'}, 'slow').find('.cS-summoner-champion').text('Ready!')}
        }
      })

      socket.on('champion select layout phase', function() {
        clearInterval(tickandtock); clearInterval(dangertimer); startFirstCSTimer('stop');
        startFirstCSTimer('start', 10, false)
      })

      socket.on('champion select force submit', function() {
        $('.cS-submit-champ button').trigger('click');
      })

      socket.on('game ready your gamepid', (gamepid) => {localStorage.setItem('gamepid', gamepid)});
      socket.on('game successfully started info', (info) => {
        updateHeaderCS('GAME WILL START SOON!')
        changeEventStatus('In game');
        music_blind_pick.pause();
        music_blind_pick.currentTime = 0;
        setTimeout(() => {

          $('.championselect').animate({'opacity': 0}, 600, () => {
            $('.championselect').load('./models/ingame.html', function() {

              $.each(info, function(index, value) {
                $('<div class="ingame-champ-image" data-isloaded="'+value.status+'" gpid="'+index+'" pid="'+value.pid+'"><img src="../assets/imgs/champion/'+value.champion+'.png" /></div>').insertBefore('.champs-cover.'+value.team+'-team .igbeforer');
              });

              if (localStorage.getItem('isingame') == 'true') {
                $('#void-vote-btn').removeAttr('disabled');
                $('#reconnect-btn').attr({'disabled': 'disabled'}).text('Already connected');
              } else {
                $('#void-vote-btn').attr({'disabled': 'disabled'});
                $('#reconnect-btn').removeAttr('disabled').text('Reconnect');
              }

              $('#void-vote-btn, #reconnect-btn').off('click');
              $('#void-vote-btn').on('click', function() {

                if (localStorage.getItem('isingame') == 'true') {
                  socket.emit('game void vote');
                } else error_msg('You have to be connected after game start. To vote');

              });

              $('#reconnect-btn').on('click', function() {
                if (localStorage.getItem('isingame') == 'false') {
                  exec('start "" "'+gameLolPath+'League of Legends.exe" "8394" "LoLLauncher.exe" "" "176.241.73.111 '+localStorage.getItem('gameport')+' 17BLOhi6KZsTtldTsizvHg== '+(parseInt(localStorage.getItem('gamepid'))+1)+'"', {cwd: gameLolPath});
                } else error_msg('You are already in game, try relog if not!');
              });

            }).animate({'opacity': 1}, 600);
          })

        }, 1000)
      })

      socket.on('game successfully started', (gameport) => {
        exec('start "" "'+gameLolPath+'League of Legends.exe" "8394" "LoLLauncher.exe" "" "176.241.73.111 '+gameport+' 17BLOhi6KZsTtldTsizvHg== '+(parseInt(localStorage.getItem('gamepid'))+1)+'"', {cwd: gameLolPath});
        localStorage.setItem('gameport', gameport); localStorage.setItem('isingame', 'true')
      })

      socket.on('game new ready', (gpid) => {


      });
      socket.on('game new unready', (gpid) => {


      });
      socket.on('game new void vote', (gpid) => {


      });

      socket.on('game map started', (gpid) => {


      });

      socket.on('champion select ready', function(data, x) {$('.cS-champion-to-select input').removeAttr('disabled');clearInterval(tickandtock); clearInterval(dangertimer); startFirstCSTimer('stop');startFirstCSTimer(data, x)})
      var timer, tickandtock, dangertimer, brick;
      function startFirstCSTimer(cmd, x=-1, danger=true) {
        if (cmd == 'start') {
          timer = x;
          tickandtock = setInterval(() => {
            if (timer >= 0) {
              $('.cS-timer.left div').text(timer);
              $('.cS-timer.right div').text(timer);
              sound_tick_and_tock();
              if (timer === 10 && danger == true) toggleDangerTimer('start');
              if (timer === 0) {clearInterval(dangertimer);$('.cS-timer.left div').css({'color': 'rgba(255, 255, 255, 0.9)'});$('.cS-timer.right div').css({'color': 'rgba(255, 255, 255, 0.9)'})};
              timer--;
            } else {clearInterval(tickandtock); clearInterval(dangertimer)}
          }, 1000)

          function toggleDangerTimer(danger) {
            if (danger == 'start') {brick = 0};

            dangertimer = setInterval(() => {
              if (brick == 0) {
                $('.cS-timer.left div').css({'color': 'firebrick'});
                $('.cS-timer.right div').css({'color': 'firebrick'});
                brick++;
              } else if (brick == 1) {
                $('.cS-timer.left div').css({'color': 'rgba(255, 255, 255, 0.9)'});
                $('.cS-timer.right div').css({'color': 'rgba(255, 255, 255, 0.9)'});
                brick--;
              }
            }, 500)
          }
        } else if (cmd == 'stop') {
          timer = -1;
          clearInterval(tickandtock); clearInterval(dangertimer)
        }
      }

      socket.on('Game force ended', () => {
        $('.championselect').animate({'opacity': 0}, 600, () => {$('.championselect').html('').css({'display': 'none'})});
        $('.client-menu').animate({'top': '0', 'opacity': '1'}, 400, () => {$('.homepage').animate({'opacity': 1}, 600)});
        $('section[name=customGames-lobby]').fadeOut(600, function() {
          info_msg('Your game ended without resoult!')
          $('.client-menu-playbtn').attr({'data-lobby': 'false'}).text('PLAY');
          $('section[name=customGames-lobby]').remove();
          $('.cGC-create-room-btn').off('click');
          $('.cG-enter-fastcode').off('click');
          $('button.close-customs-btn').off('click');
          eventStatusDescEnd();
        })
        $('#login-page').css({'background-image': 'url("../assets/imgs/loginBG.jpg")'});
      })

      socket.on('Game successfully ended', () =>  {
        $('.championselect').animate({'opacity': 0}, 600, () => {$('.championselect').html('').css({'display': 'none'})});
        $('.client-menu').animate({'top': '0', 'opacity': '1'}, 400, () => {$('.homepage').animate({'opacity': 1}, 600)});
        $('section[name=customGames-lobby]').fadeOut(600, function() {
          success_msg('Your game successfully ended!')
          $('.client-menu-playbtn').attr({'data-lobby': 'false'}).text('PLAY');
          $('section[name=customGames-lobby]').remove();
          $('.cGC-create-room-btn').off('click');
          $('.cG-enter-fastcode').off('click');
          $('button.close-customs-btn').off('click');
          eventStatusDescEnd();
        })
        $('#login-page').css({'background-image': 'url("../assets/imgs/loginBG.jpg")'});
      })

    // contextMenu
      $(function() {
        $.contextMenu({
          selector: '.social-content-sub',
          callback: function(key, options) {
            var pid = options.$trigger.attr("pid");
            switch(key) {
              case 'chat': openChat(pid); break;
              case 'removefriend': confirm_action(pid, 'unfriend'); break;
              case 'ignore': confirm_action(pid, 'ignore'); break;
              default: null;
            }
          },
          items: {
            "chat": {name: "Send message", icon: "far fa-comments"},
            "sep1": "---------",
            "removefriend": {name: "Unfriend", icon: "fas fa-user-times"},
            "ignore": {name: "Ignore", icon: "fas fa-minus-circle"}
          }
        });
      });

    // Check for pending requests and add dot if needed
      function notifyPendingFriendRequests() {
        let lng = $('.friend-requests .friend-req').length;
        if ( lng > 1) {
          $('.notification-badge.friends').html(lng-1+' new');
          $('.notification-badge.friends').animate({'opacity': 1}, 'slow');
        } else {
          $('.notification-badge.friends').animate({'opacity': 0}, 'slow');
        }
      }

    // Actions confirm
      function confirm_action(pid, type, n=null, token=null, cgnick=null) {

        let nick;
        if (n === null) nick = $('.social-content-sub[pid='+pid+'] .social-friend-nick span b').text();
        if (pid === null) nick = n;

        switch(type) {
          case 'unfriend':
            $('.confirm_action_body').html('Do you wish to remove \''+nick+'\' from your friend list?');
            $('.confirm_action').appendTo("body").modal();
            $('.confirm_action').on('hide.bs.modal', () => {$('.confirm_action_yes').off('click')})
            $('.confirm_action_yes').on('click', () => {tryUnfriend(pid);$('.confirm_action').modal('hide')})
          break;
          case 'ignore':
            $('.confirm_action_body').html('Do you wish to ignore \''+nick+'\'?<br><br><b>After this:</b><br>- You both will not be able to ask for friendship.<br>- If you are friends this relation will be cancelled.');
            $('.confirm_action').appendTo("body").modal();
            $('.confirm_action').on('hide.bs.modal', () => {$('.confirm_action_yes').off('click')})
            $('.confirm_action_yes').on('click', () => {tryIgnore(nick);$('.confirm_action').modal('hide')})
          break;
          case 'kickfromlobby':
            $('.confirm_action_body').html('Do you wish to kick '+cgnick+' from lobby?');
            $('.confirm_action').appendTo("body").modal();
            $('.confirm_action').on('hide.bs.modal', () => {$('.confirm_action_yes').off('click')})
            $('.confirm_action_yes').on('click', () => {tryKickFromLobby(n, token);$('.confirm_action').modal('hide')})
          break;
          case 'givecrown':
            $('.confirm_action_body').html('Are you sure about renounce your crown to him? (New king: '+cgnick+')');
            $('.confirm_action').appendTo("body").modal();
            $('.confirm_action').on('hide.bs.modal', () => {$('.confirm_action_yes').off('click')})
            $('.confirm_action_yes').on('click', () => {tryRenounceCrown(n, token);$('.confirm_action').modal('hide')})
          break;
          case 'startgame':
            $('.confirm_action_body').html('Do you wish to start the game?');
            $('.confirm_action').appendTo("body").modal();
            $('.confirm_action').on('hide.bs.modal', () => {$('.confirm_action_yes').off('click')})
            $('.confirm_action_yes').on('click', () => {tryCGStart(token);$('.confirm_action').modal('hide')})
          break;
        }

        $('.confirm_action_no').one('click', () => {$('.confirm_action').modal('hide')})

      }

    }
  }
