Process to run the application

1) git clone
2) run npm i
3) set user, password, db, host, port in db.js file
4) run commands in database.sql to create tables
5) run node index.js


-----------------------------------------

APIs

To register on facebook.

Method: POST
Path: http://localhost:8080/user_registration

body-----> {
    "first_name":"samhi",
    "last_name": "vinnakota",
    "email": "abc@gmail.com",
    "password":"1234",
    "dob":"10-07-1996",
    "gender": "female"
}

----------------------------------------------

To login through facebook

Method: POST
Path: http://localhost:8080/user_login

body---------> {
     "email": "abc@gmail.com",
    "password":"1234"
}

---------------------------------------------

Forgot password

Method: POST
Path: http://localhost:8080/forgotPassword

body---------> {
     "email": "abc@gmail.com"
}

------------------------------------------------

Edit profile

Method: POST
Path: http://localhost:8080/edit_profile

body---------> {
     "first_name":"sa",
    "last_name": "vinnakota",
    "email": "a@gmail.com",
    "password":"1234",
    "dob":"10-07-1996",
    "gender": "female",
    "user_id": "10",
    "profile_pic": file
}


-----------------------------------------------------

Send friend request


Method: POST
Path: http://localhost:8080/send_friend_request

body---------> {
    "user_id": "10",
    "friend_user_id": "15"
}

---------------------------------------------------

Accept friend request


Method: POST
Path: http://localhost:8080/accept_friend_request

body---------> {
    "user_id": "10",
    "friend_user_id": "15"
}

---------------------------------------------------

Reject friend request


Method: POST
Path: http://localhost:8080/reject_friend_request

body---------> {
    "user_id": "9",
    "friend_user_id": "11"
}


------------------------------------------------------

Remove friend


Method: POST
Path: http://localhost:8080/remove_friend

body---------> {
    "user_id": "9",
    "friend_user_id": "11"
}

--------------------------------------------------

View friends

Method: GET
Path: http://localhost:8080/view_friends?user_id=10

req.query--------->  user_id = 10

--------------------------------------------------

View mutual friends

Method: GET
Path: http://localhost:8080/view_mutual_friends?user_id=9&friend_user_id=10

req.query-------->  user_id = 9, friend_user_id = 10

-------------------------------------------------------


View friends of friends

Method: GET
Path: http://localhost:8080/view_friends_of_friends?user_id=9

req.query-------->  user_id = 9


------------------------------------------------------------

Add post 

Method: POST
Path: http://localhost:8080/add_post

body------> {
    "user_id": "12",
    "content": "npls"
}

---------------------------------------------------------

Delete post 

Method: POST
Path: http://localhost:8080/delete_post

body------> {
    "user_id": "9",
    "content": "hey! my name is sam"
}

---------------------------------------------------------




