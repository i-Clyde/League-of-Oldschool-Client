// Errors, success alerts
function success_msg(msg) {
  $('<div class="alerts success">' + msg + '</div>').appendTo('.client-alerts');
  $('.alerts.success').animate({'opacity': '1'}, 'slow').delay(7000).fadeOut('slow', function(){
    $(this).remove();
  });
}
function info_msg(msg) {
  $('<div class="alerts info">' + msg + '</div>').appendTo('.client-alerts');
  $('.alerts.info').animate({'opacity': '1'}, 'slow').delay(9000).fadeOut('slow', function(){
    $(this).remove();
  });
}
function error_msg(msg) {
  $('<div class="alerts error">' + msg + '</div>').appendTo('.client-alerts');
  $('.alerts.error').animate({'opacity': '1'}, 'slow').delay(10000).fadeOut('slow', function(){
    $(this).remove();
  });
}

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

        $('.chat-box-chatter-lastmsg[cid=0]').html(((data.lastGMSG.pid == localStorage.getItem('playerid'))?'You: ':'')+data.lastGMSG.msg)

        $.each(data.messageHistory, function(index) {
          for(let i = 0, len = data.messageHistory[index].length; i < len; i++) {
            if (i == 0) addNewChatter(index, true, 'No messages yet!');
            if (!isNaN(data.messageHistory[index][i].unread) && data.messageHistory[index][i].unread == true) newMsgNotify(index, index)
            if (i == len-1) $('.chat-box-chatter-lastmsg[cid='+index+']').html((((data.messageHistory[index][i].you)?'You: ':'')+data.messageHistory[index][i].msg));
          }
        })
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

      // Show panels
      $('.social-type-friends').animate({'left': '0', 'opacity': '1'}, 400)
      $('.social-zone').animate({'left': '0', 'opacity': '1'}, 400, function() {
        $('.client-menu').animate({'top': '0', 'opacity': '1'}, 600)
      })

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
          updateChatTitle('Public Chat')
        } else {let nick = $('.social-content-sub[pid='+cid+'] .social-friend-nick span b').text();updateChatTitle(nick)}
      }

      function updateChatTitle(type, others='') {
        $('.chat-box-title').html('<b>'+type+'</b>'+'<i>'+others+'</i>')
      }

      function addNewChatter(cid, newmsg=false, lastmsg=null) {
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
        if (pid == 0) updateChatTitle('Public Chat'); else updateChatTitle(nick);
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
      function newMsgNotify(pid, from) {
        if (from != localStorage.getItem('playerid')) {

        let newmsgs = parseInt($('.chat-box-newmsg.profile[pid='+pid+']').attr('data-new')); newmsgs++;

        $('.chat-box-newmsg[cid='+pid+']').text(newmsgs+' new')
        $('.chat-box-newmsg[cid='+pid+']').animate({'opacity': 1}, 800)
        $('.chat-box-newmsg.profile[pid='+pid+']').attr('data-new', newmsgs)
        $('.chat-box-newmsg.profile[pid='+pid+']').attr('data-newmsgs', true)
        $('.chat-box-newmsg.profile[pid='+pid+']').text(newmsgs+' new')
        $('.chat-box-newmsg.profile[pid='+pid+']').animate({'opacity': 1}, 800)

        $('.notification-badge.chats').text($('.social-content-friend-list .chat-box-newmsg.profile[data-newmsgs=true]').length+' new').animate({'opacity': 1}, 400);
        }
      }

      // Mark as read MSG
      function msgHasBeenRead(pid) {

        $('.chat-box-newmsg[cid='+pid+']').animate({'opacity': 0}, 800, function() {
          $('.chat-box-newmsg[cid='+pid+']').text('')
        })
        $('.chat-box-newmsg.profile[pid='+pid+']').attr('data-new', 0)
        $('.chat-box-newmsg.profile[pid='+pid+']').attr('data-newmsgs', false)
        $('.chat-box-newmsg.profile[pid='+pid+']').animate({'opacity': 0}, 800, function() {
          $('.chat-box-newmsg.profile[pid='+pid+']').text('')
        })


        let unReads = $('.social-content-friend-list .chat-box-newmsg.profile[data-newmsgs=true]').length;
        $('.notification-badge.chats').text(unReads+' new');
        if (unReads > 0) $('.notification-badge.chats').animate({'opacity': 1}, 400); else $('.notification-badge.chats').animate({'opacity': 0}, 400);

        setTimeout(() => {
          $('.chat-box-conversation-content[cid='+pid+'] .chat-msg.unread-msg').css({'border': '1px solid rgba(100, 100, 100, 0.6)'});
          setTimeout(() => {
            $('.chat-box-conversation-content[cid='+pid+'] div.chat-msg').removeClass('unread-msg');
          }, 3100)
        }, 5000)

        socket.emit('mark messages as read', {'pid': pid})

      }

      // Catch new message to global chat
      socket.on('new message', data => {
        var last_msg = $('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').last();
        var last_pid = last_msg.attr('pid');
        var from = '', isyou = '';

        if ((last_pid != data.from || last_pid === undefined) && data.cid == 0 ) from = '<div class="chat-msg-nick">'+data.fromnick+' says:</div>';
        if (localStorage.getItem('playerid') == data.from) {isyou = ' you';from = ''}
        $('.chat-box-chatter-lastmsg[cid='+data.cid+']').html((isyou == ' you'?'You: ':'')+data.msg)

        if (data.cid != 0) {
          if (!($('.chat-box-chats-chatter[cid='+data.cid+']').length > 0) && data.cid != localStorage.getItem('playerid')) addNewChatter(data.cid, true);
          newMsgNotify(data.cid, data.from, (isyou == ' you'?'You: ':'')+data.msg);
        }

        let date = new Date();
        let h = (date.getHours() <= 9)?'0'+date.getHours():date.getHours();
        let i = (date.getMinutes() <= 9)?'0'+date.getMinutes():date.getMinutes();

        $('.chat-box-conversation-content[cid='+data.cid+']').append('<div class="chat-msg-content" pid="'+data.from+'" date="'+data.date+'">'+whenMsgWasSent()+from+'<div class="chat-msg'+isyou+'" rel="tooltip" title="'+h+':'+i+'" rel="tooltip"><span>'+data.msg+'</span></div><div style="clear: both"></div></div>');

        $('.chat-box-conversation').animate({ scrollTop: $('.chat-box-conversation-content[cid='+data.cid+']').height() }, "fast");

        if ($('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').length > 40) {
          $('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').first().remove();
          if ($('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').first().find('.chat-date').length == 0) {
            let mili = $('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').first().attr('date');
            $('.chat-box-conversation-content[cid='+data.cid+'] .chat-msg-content').first().prepend(whenMsgWasSent(mili, true));
          }
        }

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
          else if (status == 1) update(desc);
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
      function confirm_action(pid, type, n=null) {

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
        }

        $('.confirm_action_no').one('click', () => {$('.confirm_action').modal('hide')})

      }

    }
  }
