const express = require('express');
const app = express();
const pool = require("./db.js");
const md5 = require('md5');
const fs = require('fs');
const formidable = require('formidable');
const auth = require('./auth.js');
const nodemailer = require('nodemailer');

app.use(express.json());

//user-registration on facebook
app.post('/user_registration', async(req,res)=>{
    let jsonArr = {};
    let first_name = req.body.first_name;
    let last_name = req.body.last_name;
    let email = req.body.email;
    let password = md5(req.body.password);
    let dob = req.body.dob;
    let gender = req.body.gender;

    if (typeof first_name != 'undefined' && typeof last_name != 'undefined' && typeof email != 'undefined' && typeof password != 'undefined' && typeof gender != 'undefined' && typeof dob != 'undefined') {
        let checkEmailPostgreQuery = "SELECT * FROM users WHERE email = '" + email + "'";
        await pool.query(checkEmailPostgreQuery, async function(err, output) {
            if (err) {
                jsonArr.status = 'fail';
                jsonArr.message = 'Query Exception: ' + err;
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));
            } else if (output.rowCount > 0) {
                jsonArr.status = 'fail';
                jsonArr.message = 'Email already exists.';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));
            } else {
                let postgreQuery = "INSERT INTO users(first_name,last_name,email,password,dob,gender) VALUES('" + first_name + "','" + last_name + "','" + email + "','" + password + "', '" + dob + "', '" + gender + "')";
                await pool.query(postgreQuery, async function(err, response) {
                    if (err) {
                        jsonArr.status = 'fail';
                        jsonArr.message = 'Query Exception: ' + err;
                        res.contentType('application/json');
                        res.end(JSON.stringify(jsonArr));
                    } else {
                        jsonArr.status = 'success';
                        jsonArr.message = 'User registration is successful';
                        res.contentType('application/json');
                        res.end(JSON.stringify(jsonArr));
                    }
                })
            }
        })
    } else {
        jsonArr.status = 'fail';
        jsonArr.message = 'Keys missing';
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }
})


//user-login through facebook 
app.post('/user_login', async(req, res)=>{
    let jsonArr = {
        data: [],
        status: 'fail'
    };

    if (typeof req.body.email != 'undefined' && typeof req.body.password != 'undefined') {
        let email = req.body.email;
        let password = req.body.password;

        let getQuery = "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + md5(password) + "'";
        
        await pool.query(getQuery, async function(err, output) {
            if (err) {
                jsonArr.message = 'Query Exception: ' + err;
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));
            } else if (output.rowCount > 0) {
                if (output.rows[0].status != 'active') {
                    jsonArr.message = 'Your account is not active. Please contact admin';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));
                } else {
                    let getQuery = "UPDATE users SET last_login=NOW() WHERE  email = '" + email + "' ";
                    await pool.query(getQuery, function(err, response) {
                        if (err) {
                            jsonArr.message = 'Query Exception: ' + err;
                            res.contentType('application/json');
                            res.end(JSON.stringify(jsonArr));
                        } else {
                            jsonArr.data = output.rows[0];
                            jsonArr.status = 'success';
                            jsonArr.message = 'Loggedin successfully.';
                            jsonArr.authToken = auth.generateToken(output.rows[0].id);
                            jsonArr.authTokenExpiryTime = '24 hours';
                            res.contentType('application/json');
                            res.end(JSON.stringify(jsonArr));	                            
                        }
                    })
                }

            } else {

                jsonArr.message = 'Oops, Your email or password does not match.';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));
            }
        })
    } else {
        jsonArr.message = 'Keys missing';
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }
})


//forgot password 
app.post('/forgotPassword', async(req, res)=>{
    let jsonArr = {
        data: [],
        status: 'fail'
    };
    if (typeof req.body.email != 'undefined') {
        let email = req.body.email;
        let checkUserPostgreQuery = "SELECT * FROM users WHERE email = '" + email + "'";
        await pool.query(checkUserPostgreQuery, async function(err, output) {
            if (err) {
                jsonArr.message = 'Query Exception: ' + err;
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));
            } else if (output.rowCount > 0) {
                if (output.rows[0].status != 'active') {
                    jsonArr.message = 'Your account is not active. Please contact admin';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));
                } else if (output.rows[0].email_verified != 'Y') {
                    jsonArr.message = 'Your email is not verified. Please verify from your mail box first.';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));
                } else {
                    var transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: "abc@gmail.com",
                            pass: "123"
                        }

                    });
                    // Declare a string variable  
                    // which stores all string 
                    var string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    let OTP = '';

                    // Find the length of string 
                    var len = string.length;
                    for (let i = 0; i < 8; i++) {
                        OTP += string[Math.floor(Math.random() * len)];
                    }
                    let expiryTime = new Date().getTime();

                    let link = "<a href='https://www.facebook.com/" + output.rows[0].id + "/" + expiryTime + "'>Reset Password</a>";
                    //Send Mail Start
                    var mailOptions = {
                        from: "support@facebook.com", // sender address
                        to: output.rows[0].email,//define the receiver of the email
                        subject: "Facebook | Forgot Password", // Subject line. define the message to be sent. Each line should be separated with \n
                        html: "Hi " + output.rows[0].first_name + ",<br> Your reset password link is given below: <br><br>" + link + ". <br>Kindly use this link to reset your password before 2 hours else link will be expired.<br><br>Thanks." // html body
                    };
                    let updatePostgreQuery = "UPDATE users SET reset_email_sent = 'Y', reset_link_time = '" + expiryTime + "' WHERE id='" + output.rows[0].id + "'";
                    await pool.query(updatePostgreQuery, async function(err, outputres) {
                        if (err) {
                            jsonArr.message = 'Query Exception: ' + err;
                            res.contentType('application/json');
                            res.end(JSON.stringify(jsonArr));
                        } else {
                            // send mail with defined transport object
                            await transporter.sendMail(mailOptions, function(error, info) {
                                if (error) {
                                    console.log('Error While sending email : ' + error);
                                    jsonArr.message = 'Error in sending email.';
                                    res.contentType('application/json');
                                    res.end(JSON.stringify(jsonArr));
                                } else {
                                    jsonArr.status = 'success';
                                    jsonArr.message = 'Email has been sent to your address. Kindly use that link to reset your password.';
                                    res.contentType('application/json');
                                    res.end(JSON.stringify(jsonArr));
                                }
                            });
                        }
                    })
                }
            } else {
                jsonArr.message = 'User does not exist.';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));
            }
        })
    } else {
        jsonArr.message = 'Keys missing';
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }
})

//edit the profile for the given user_id
app.post('/edit_profile', async(req, res)=>{
    let jsonArr = {
        status: 'fail'
    };

    let form = new formidable.IncomingForm();
    form.parse(req, async function(err, fields, files) {
        if(typeof fields.user_id!= 'undefined'){
            let first_name = fields.first_name;
            let last_name = fields.last_name;
            let email = fields.email;
            let user_id = fields.user_id;
            let password = md5(fields.password);
            let dob = fields.dob;
            let gender = fields.gender;
            if (typeof files.profile_pic != 'undefined') {
                let oldpath = files.profile_pic.path;
                let fileName = "uploads/" + new Date().getTime() + files.profile_pic.name;
                let newpath = '../public/' + fileName;
                fs.rename(oldpath, newpath, async function(err) {
                    if (err) throw err;
                    let postgreQuery = "UPDATE users SET first_name = '" + first_name + "',last_name = '" + last_name + "',email = '" + email + "',password = '" + password + "',dob = '" + dob + "',gender= '" + gender+ "' ,profile_pic = '" + fileName + "' WHERE id = '" + user_id + "'";
                    await pool.query(postgreQuery, async function(err, response) {
                        if (err) {
                            jsonArr.message = 'Query Exception: ' + err;
                            res.contentType('application/json');
                            res.end(JSON.stringify(jsonArr));
                        } else {
                            jsonArr.status = 'success';
                            jsonArr.message = 'Your profile has been updated successfully.';
                            res.contentType('application/json');
                            res.end(JSON.stringify(jsonArr));
                        }
                    })

                });
            }
            else {
                let postgreQuery2 = "UPDATE users SET first_name = '" + first_name + "',last_name = '" + last_name + "',email = '" + email + "',password = '" + password + "',dob = '" + dob + "',gender= '" + gender+ "' WHERE id = '" + user_id + "'";
                await pool.query(postgreQuery2, function(err, response) {
                    if (err) {
                        jsonArr.message = 'Query Exception: ' + err;
                        res.contentType('application/json');
                        res.end(JSON.stringify(jsonArr));
                    } else {
                        jsonArr.status = 'success';
                        jsonArr.message = 'Your profile has been updated successfully.';
                        res.contentType('application/json');
                        res.end(JSON.stringify(jsonArr));
                    }
                })
            }     
        }else{
            jsonArr.message = 'Keys missing';
            res.contentType('application/json');
            res.end(JSON.stringify(jsonArr));
        }  
    })

})

//send friend request
app.post('/send_friend_request', async(req, res)=>{
    let jsonArr = {
        status: 'fail'
    };

    let user_id = req.body.user_id;
    let friend_user_id = req.body.friend_user_id;

    try {
        if(typeof user_id!= 'undefined' && typeof friend_user_id!= 'undefined'){
            let data1 = await pool.query("SELECT * FROM users WHERE id = '" + user_id + "'");
            let data2 = await pool.query("SELECT * FROM users WHERE id = '" + friend_user_id + "'");
            if(data1.rowCount>0 && data2.rowCount>0){
                let getRequests = await pool.query("SELECT * FROM requests WHERE id = '" + user_id + "' and friend_id = '" + friend_user_id + "'");
                if(getRequests.rowCount>0){
                    jsonArr.message = 'Friend request sent already';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));
                }else{
                    let insertQuery = await pool.query("INSERT INTO requests (id, friend_id) VALUES ($1, $2) RETURNING *;",
                    [user_id, friend_user_id]);
                    if(insertQuery.rowCount>0){
                        let getQuery = await pool.query("SELECT no_of_friend_requests FROM users WHERE id = '" + friend_user_id + "'");
                        let friend_requests = getQuery.rows[0].no_of_friend_requests + 1;
                        let updateData = await pool.query("UPDATE users SET no_of_friend_requests = '" + friend_requests + "' WHERE id = '" + friend_user_id + "'");
                        if(updateData){
                            jsonArr.status = 'success';
                            jsonArr.message = 'Friend request sent successfully.';
                            res.contentType('application/json');
                            res.end(JSON.stringify(jsonArr));
                        }
                    }
                }
              
            }else{
                jsonArr.message = 'One or more users not found';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));  
            }            
        }else{
            jsonArr.message = 'Keys missing';
            res.contentType('application/json');
            res.end(JSON.stringify(jsonArr));
        } 
        
    } catch (error) {
        jsonArr.message = 'Query Exception: ' + error;
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }
})

//accept friend request
app.post('/accept_friend_request', async(req, res)=>{
    let jsonArr = {
        status: 'fail'
    };

    let user_id = req.body.user_id;
    let friend_user_id = req.body.friend_user_id;

    try {
        if(typeof user_id!= 'undefined' && typeof friend_user_id!= 'undefined'){
            let data1 = await pool.query("SELECT * FROM users WHERE id = '" + user_id + "'");
            let data2 = await pool.query("SELECT * FROM users WHERE id = '" + friend_user_id + "'");
            if(data1.rowCount>0 && data2.rowCount>0){
                let deleteQuery = await pool.query("DELETE FROM requests WHERE id = '" + user_id + "' AND friend_id = '" + friend_user_id + "'");
                if(deleteQuery.rowCount>=1){
                    let getQuery = await pool.query("SELECT no_of_friend_requests FROM users WHERE id = '" + friend_user_id + "'");
                    let friend_requests = getQuery.rows[0].no_of_friend_requests - 1;
                    let updateData = await pool.query("UPDATE users SET no_of_friend_requests = '" + friend_requests + "' WHERE id = '" + friend_user_id + "'");
                    let insertQuery1 = await pool.query("INSERT INTO friends (id, friend_id) VALUES ($1, $2) RETURNING *;",
                    [user_id, friend_user_id]);  
                    let insertQuery2 = await pool.query("INSERT INTO friends (id, friend_id) VALUES ($1, $2) RETURNING *;",
                    [friend_user_id, user_id]);     
                    if(updateData.rowCount>=1){
                        jsonArr.status = 'success';
                        jsonArr.message = 'Friend request accepted successfully.';
                        res.contentType('application/json');
                        res.end(JSON.stringify(jsonArr));
                    }
                }else{
                    jsonArr.message = "This person is not there in request's list";
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));  
                }
            }else{
                jsonArr.message = 'One or more users not found';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));  
            }
            
        }else{
            jsonArr.message = 'Keys missing';
            res.contentType('application/json');
            res.end(JSON.stringify(jsonArr));
        } 
        
    } catch (error) {
        jsonArr.message = 'Query Exception: ' + error;
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }
})

//reject friend request
app.post('/reject_friend_request', async(req, res)=>{
    let jsonArr = {
        status: 'fail'
    };

    let user_id = req.body.user_id;
    let friend_user_id = req.body.friend_user_id;

    try {
        if(typeof user_id!= 'undefined' && typeof friend_user_id!= 'undefined'){
            let data1 = await pool.query("SELECT * FROM users WHERE id = '" + user_id + "'");
            let data2 = await pool.query("SELECT * FROM users WHERE id = '" + friend_user_id + "'");
            if(data1.rowCount>0 && data2.rowCount>0){
                let deleteQuery = await pool.query("DELETE FROM requests WHERE id = '" + user_id + "' and friend_id = '" + friend_user_id + "'"); 
                if(deleteQuery.rowCount>=1){
                    let getQuery = await pool.query("SELECT no_of_friend_requests FROM users WHERE id = '" + friend_user_id + "'");
                    let friend_requests = getQuery.rows[0].no_of_friend_requests - 1;
                    let updateData = await pool.query("UPDATE users SET no_of_friend_requests = '" + friend_requests + "' WHERE id = '" + friend_user_id + "'");
                    if(updateData){
                        jsonArr.status = 'success';
                        jsonArr.message = 'Friend request rejected successfully.';
                        res.contentType('application/json');
                        res.end(JSON.stringify(jsonArr));
                    }
                }else{
                    jsonArr.message = "This person is not there in request's list";
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));  
                }
            }else{
                jsonArr.message = 'One or more users not found';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));  
            }
            
        }else{
            jsonArr.message = 'Keys missing';
            res.contentType('application/json');
            res.end(JSON.stringify(jsonArr));
        } 
        
    } catch (error) {
        jsonArr.message = 'Query Exception: ' + error;
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }
})

//remove the friend from the list
app.post('/remove_friend', async(req, res)=>{
    let jsonArr = {
        status: 'fail'
    };

    let user_id = req.body.user_id;
    let friend_user_id = req.body.friend_user_id;

    try {
        if(typeof user_id!= 'undefined' && typeof friend_user_id!= 'undefined'){
            let data1 = await pool.query("SELECT * FROM users WHERE id = '" + user_id + "'");
            let data2 = await pool.query("SELECT * FROM users WHERE id = '" + friend_user_id + "'");
            if(data1.rowCount>0 && data2.rowCount>0){
                let deleteQuery1 = await pool.query("DELETE FROM friends WHERE id = '" + user_id + "' AND friend_id = '" + friend_user_id + "'"); 
                let deleteQuery2 = await pool.query("DELETE FROM friends WHERE id = '" + friend_user_id + "' AND friend_id = '" + user_id + "'");   
                if(deleteQuery1.rowCount>=1 && deleteQuery2.rowCount>=1){
                    jsonArr.status = 'success';
                    jsonArr.message = 'Friend removed successfully.';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));
                }else{
                    jsonArr.message = "This person is not there in friend's list";
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));  
                }
            }else{
                jsonArr.message = 'One or more users not found';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));  
            }
            
        }else{
            jsonArr.message = 'Keys missing';
            res.contentType('application/json');
            res.end(JSON.stringify(jsonArr));
        } 
        
    } catch (error) {
        jsonArr.message = 'Query Exception: ' + error;
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }
})

//view friends
app.get('/view_friends', async(req, res)=>{
    let jsonArr = {
        status: 'fail'
    };

    let user_id = req.query.user_id;

    try {
        if(typeof user_id!= 'undefined'){
            let data = await pool.query("SELECT * FROM users WHERE id = '" + user_id + "'");
            if(data.rowCount>0){
                let result = await pool.query("SELECT friend_id FROM friends WHERE id = '" + user_id + "'"); 
                if(result.rowCount>0){
                    jsonArr.data = result.rows;
                    jsonArr.status = 'success';
                    jsonArr.message = 'Friends viewed successfully.';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));
                }else {
                    jsonArr.message = 'No friend found for the given id';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));  
                }
            }else{
                jsonArr.message = 'User not found';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));  
            }
            
        }else{
            jsonArr.message = 'Keys missing';
            res.contentType('application/json');
            res.end(JSON.stringify(jsonArr));
        } 
        
    } catch (error) {
        jsonArr.message = 'Query Exception: ' + error;
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }
})


//view mutual friends
app.get('/view_mutual_friends', async(req, res)=>{
    let jsonArr = {
        status: 'fail'
    };

    let user_id = req.query.user_id;
    let friend_user_id = req.query.friend_user_id;

    try {
        if(typeof user_id!= 'undefined' && typeof friend_user_id!= 'undefined'){
            let data1 = await pool.query("SELECT * FROM users WHERE id = '" + user_id + "'");
            let data2 = await pool.query("SELECT * FROM users WHERE id = '" + friend_user_id + "'");

            if(data1.rowCount>0 && data2.rowCount>0){
                let result = await pool.query("SELECT friend_id FROM friends WHERE id = '" + user_id + "'  INTERSECT SELECT friend_id FROM friends WHERE id = '" + friend_user_id + "'");                 
                if(result.rowCount>0){
                    jsonArr.data = result.rows;
                    jsonArr.status = 'success';
                    jsonArr.message = 'Mutual friends viewed successfully.';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));
                }else {
                    jsonArr.message = "No mutual friends found for the given 2 id's";
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));  
                }
            }else{
                jsonArr.message = 'One or more users not found';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));  
            }
            
        }else{
            jsonArr.message = 'Keys missing';
            res.contentType('application/json');
            res.end(JSON.stringify(jsonArr));
        } 
        
    } catch (error) {
        jsonArr.message = 'Query Exception: ' + error;
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }
})


//view friends of friends
app.get('/view_friends_of_friends', async(req, res)=>{
    let jsonArr = {
        status: 'fail'
    };

    let user_id = req.query.user_id;

    try {
        if(typeof user_id!= 'undefined'){
            let data = await pool.query("SELECT * FROM users WHERE id = '" + user_id + "'");
            if(data.rowCount>0){
                let result = await pool.query("SELECT distinct(f1.friend_id) FROM friends f1 CROSS JOIN friends f2 WHERE f2.id = '" + user_id + "'");                 
                if(result.rowCount>0){
                    jsonArr.data = result.rows;
                    jsonArr.status = 'success';
                    jsonArr.message = 'Friends of friends viewed successfully.';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));
                }else {
                    jsonArr.message = "No friends of friends found for the given id";
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));  
                }
            }else{
                jsonArr.message = 'One or more users not found';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));  
            }
            
        }else{
            jsonArr.message = 'Keys missing';
            res.contentType('application/json');
            res.end(JSON.stringify(jsonArr));
        } 
        
    } catch (error) {
        jsonArr.message = 'Query Exception: ' + error;
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }
})

//user can add post in his profile
app.post('/add_post', async(req, res)=>{
    let jsonArr = {
        status: 'fail'
    };

    let user_id = req.body.user_id;
    let content = req.body.content;

    try {
        if(typeof user_id!= 'undefined' && typeof content!= 'undefined'){
            let data = await pool.query("SELECT * FROM users WHERE id = '" + user_id + "'");
            if(data.rowCount>0){
                let insertQuery = await pool.query("INSERT INTO posts(content, user_id) values ($1, $2) RETURNING *;",
                [content, user_id]);
                if(insertQuery.rowCount>0){
                    jsonArr.status = 'success';
                    jsonArr.message = 'Post added successfully';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));
                }
            }else {
                jsonArr.message = 'User not found';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));  
            }
           
        }else {
            jsonArr.message = 'Keys missing';
            res.contentType('application/json');
            res.end(JSON.stringify(jsonArr));
        }     
    } catch (error) {
        jsonArr.message = 'Query Exception: ' + error;
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }

})

//user can delete the post in his profile
app.post('/delete_post', async(req, res)=>{
    let jsonArr = {
        status: 'fail'
    };

    let user_id = req.body.user_id;
    let content = req.body.content;

    try {
        if(typeof user_id!= 'undefined' && typeof content!= 'undefined'){
            let data = await pool.query("SELECT * FROM posts WHERE user_id = '" + user_id + "' AND content = '" + content + "'" );            
            if(data.rowCount>0){
                let deleteQuery = await pool.query("DELETE FROM posts WHERE user_id = '" + user_id + "' AND content = '" + content + "'");                
                if(deleteQuery.rowCount>=1){
                    jsonArr.status = 'success';
                    jsonArr.message = 'Post removed successfully';
                    res.contentType('application/json');
                    res.end(JSON.stringify(jsonArr));
                }
            }else {
                jsonArr.message = 'User or content not found in posts list';
                res.contentType('application/json');
                res.end(JSON.stringify(jsonArr));  
            }
           
        }else {
            jsonArr.message = 'Keys missing';
            res.contentType('application/json');
            res.end(JSON.stringify(jsonArr));
        }     
    } catch (error) {
        jsonArr.message = 'Query Exception: ' + error;
        res.contentType('application/json');
        res.end(JSON.stringify(jsonArr));
    }

})


app.listen(8080,()=> {
    console.log("server is listening on port 8080");
});