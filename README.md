# League-of-Oldschool-Client

**This project will not be continue until Gameserver of League Sandbox will be stable to catch start and end game events via socket**

## To run
- Make sure you've got node.js installed type `npm -v` and `node -v` to check that [You can download node.js here](https://www.npmjs.com/get-npm)
- Install electron global `npm install electron -g`
- Install all needed packages via `npm install`
- Start application `npm start`

**It doesn't matter which app you run first, client will automaticlly connect to the server after his start**

[Server](https://github.com/i-Clyde/League-of-Oldschool-Server)

**After championselect phase game will not start also cdn isn't implemented**
**In future client will have cdn implementation to download game and client updates and be in exe installer form**

## What you can?
- Register
- Login
- Change resolution of the app (settings button in the corner) *Dedicated is 1600x900 I've got an idea in future for scale*
- Add and ignore friends
- Unfriend friends
- Create custom game lobby/room
- Join via click on room or *fastcode*
- You can set password for room
- You can choose map, name and other options
- You can manage players inside a room as King of the room
- King options; Kick, make king, toggle invites, start game
- If players in room are not friends they can add each other via special button in room
- Set your status to 'Im away' by clicking the green line before profile image
- Change profile image by clicking on your profile icon
- Set your nickname after first login
- Change your description by clicking on description
- You can send messages to friends by clicking on them on friendlist or right click them and selecting send message option
- You can chat in global chat (default: notifications are disabled for everyone)
- You can read history of messages up to 40 messages
- You can minimize chatbox
- You can see online and logged in players (only number) on global chat title
- You can send invites and chat in lobby room
- After start game you can select champion/runes/masteries and summoner spells if no champion selected everyone will be kicked.
- You can lockin AT THIS MOMENT ONLY BLINDPICK is codded
- You can also reconnect to the game
- You can vote for game void if something went wrong
- You've got 5 minutes to connect to the server otherwise client will avoid the game
- You can reconnect after relog etc.
- And more...

## How to use this client online
- Edit 54th line in `assets/js/head-script.js` with your online address e.g. **myhomeserver.net:SOCKETPORT**, or IP address.
- Open SOCKETPORT on your server machine default it is 3000 you can change it on the 3rd line in server.js (server side)
- Run server and client
- Done

## First run
- It can be slow. If it doesn't run try to CTRL+R on focused 'invisible' app and wait some seconds.
**This problem only appear on older pcs**

## Images of client
![1](https://i.imgur.com/0EEref7.jpg)
![2](https://i.imgur.com/YnbB2g4.jpg)
![3](https://i.imgur.com/8ecKTdS.png)
![4](https://i.imgur.com/hLbhrt4.jpg)
![5](https://i.imgur.com/mksbSMT.png)
![6](https://i.imgur.com/89Ud3V8.png)
![7](https://i.imgur.com/pHQaFBr.png)
![9](https://i.imgur.com/lhEzK1T.jpg)
![10](https://i.imgur.com/VJhUu5n.jpg)
![11](https://i.imgur.com/6kHa7EN.jpg)
![12](https://i.imgur.com/kgKXSVY.jpg)
![13](https://i.imgur.com/mJxvlgo.jpg)

## Working runes project from other project will be included in future
![14](https://i.imgur.com/8fItS26.jpg)
