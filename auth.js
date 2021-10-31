const express = require('express');
const app = express();
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

/* Used to generate the auth token
*/

exports.generateToken = (userId) =>{
    var token = jwt.sign({ id: userId }, 'AmkAvJvb4OwUz2KGdFrlloCvxgLpWEfwsahwn3pJlmBS', {
      expiresIn: 86400 // expires in 24 hours
    });
    return token; 
}