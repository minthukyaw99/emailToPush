/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

           
var credentials = {
  client: {
    id: '7adac02e-6799-4b49-b79b-0bf7c6345e2b',
    secret: 'sBYBj8fiBBiJCTuFxvkX6DY',
  },
  auth: {
    tokenHost: 'https://login.microsoftonline.com',
    authorizePath: 'common/oauth2/v2.0/authorize',
    tokenPath: 'common/oauth2/v2.0/token'
  }
};

var oauth2 = require('simple-oauth2').create(credentials);//(credentials);

var redirectUri = 'http://localhost:1337/authorize';

// The scopes the app requires
var scopes = [  'openid',
                'offline_access',
                'https://outlook.office.com/mail.read' ];
           
var url = require('url');

var outlook = require('node-outlook');
           
module.exports = {
    index: function (req, res) {
        var returnVal = oauth2.authorizationCode.authorizeURL({
                            redirect_uri: redirectUri,
                            scope: scopes.join(' ')
                        });
        sails.log.info('Generated auth url: ' + returnVal);
        var initOptions = {
          returnVal: returnVal  
        };
        return res.view('email/index',initOptions);
    },
    authorize: function(req, res){
        console.log('Request handler \'authorize\' was called.');
        // The authorization code is passed as a query parameter
        var url_parts = url.parse(req.url, true);
        var code = url_parts.query.code;
        sails.log.info('Code: ' + code);
        this._getTokenFromCode(code, this._tokenReceived, res);
        
    },
    _getTokenFromCode: function(auth_code, callback, res) {
        var token;
        oauth2.authorizationCode.getToken({
          code: auth_code,
          redirect_uri: redirectUri,
          scope: scopes.join(' ')
        }, function (error, result) {
          if (error) {
            sails.log.info('Access token error: ', error.message);
            callback(res, error, null);
          } else {
            token = oauth2.accessToken.create(result);
            sails.log.info('Token created: ', token.token);
            callback(res, null, token);
          }
        });
    },
    _getUserEmail: function(token, callback) {
        // Set the API endpoint to use the v2.0 endpoint
        outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');

        // Set up oData parameters
        var queryParams = {
          '$select': 'DisplayName, EmailAddress',
        };

        outlook.base.getUser({token: token, odataParams: queryParams}, function(error, user){
          if (error) {
            callback(error, null);
          } else {
            callback(null, user.EmailAddress);
          }
        });
    },
    _tokenReceived: function(res, error, token) {
        var initOptions = {};
        if (error) {
          sails.log.info('Access token error: ', error.message);
          initOptions.AccessTokenError = error;
          res.view('email/authorize', initOptions);
        } else {
            this._getUserEmail(token.token.access_token, function(error, email) {
            if (error) {
              sails.log.info('getUserEmail returned an error: ' + error);
              initOptions.getUserEmailError = error;
              res.view('email/authorize', initOptions);
            } else if (email) {
                initOptions.email = email;
                initOptions.token = token.token.access_token;
                var cookies = ['node-tutorial-token=' + token.token.access_token + ';Max-Age=4000',
                       'node-tutorial-refresh-token=' + token.token.refresh_token + ';Max-Age=4000',
                       'node-tutorial-token-expires=' + token.token.expires_at.getTime() + ';Max-Age=4000',
                       'node-tutorial-email=' + email + ';Max-Age=4000'];
                res.setHeader('Set-Cookie', cookies);
                res.writeHead(302, {'Location': 'http://localhost:1337/mail'});
                res.end();
                sails.log.info('Email', email);
                sails.log.info('Access token: ', token.token.access_token);
                sails.log.info("print out initOptions", initOptions);
                //res.view('email/authorize', initOptions);
            }
          });
        }
    },
    _getValueFromCookie: function (valueName, cookie) {
        if (cookie.indexOf(valueName) !== -1) {
          var start = cookie.indexOf(valueName) + valueName.length + 1;
          var end = cookie.indexOf(';', start);
          end = end === -1 ? cookie.length : end;
          return cookie.substring(start, end);
        }
    },
    _getAccessToken: function (request, response, callback) {
        var expiration = new Date(parseFloat(this._getValueFromCookie('node-tutorial-token-expires', request.headers.cookie)));

        if (expiration <= new Date()) {
          // refresh token
          console.log('TOKEN EXPIRED, REFRESHING');
          var refresh_token = this._getValueFromCookie('node-tutorial-refresh-token', request.headers.cookie);
          this._refreshAccessToken(refresh_token, function(error, newToken){
            if (error) {
              callback(error, null);
            } else if (newToken) {
              var cookies = ['node-tutorial-token=' + newToken.token.access_token + ';Max-Age=4000',
                             'node-tutorial-refresh-token=' + newToken.token.refresh_token + ';Max-Age=4000',
                             'node-tutorial-token-expires=' + newToken.token.expires_at.getTime() + ';Max-Age=4000'];
              response.setHeader('Set-Cookie', cookies);
              callback(null, newToken.token.access_token);
            }
          });
        } else {
          // Return cached token
          var access_token = this._getValueFromCookie('node-tutorial-token', request.headers.cookie);
          callback(null, access_token);
        }
    },
    _refreshAccessToken: function(refreshToken, callback) {
        var tokenObj = oauth2.accessToken.create({refresh_token: refreshToken});
        tokenObj.refresh(callback);
    },
    mail: function(req,res) {
        var that = this;
        this._getAccessToken(req, res, function(error, token) {
            sails.log.info('Token found in cookie: ', token);
            var email = that._getValueFromCookie('node-tutorial-email', req.headers.cookie);
            sails.log.info('Email found in cookie: ', email);
            if (token) {
              //response.writeHead(200, {'Content-Type': 'text/html'});
              //response.write('<div><h1>Your inbox</h1></div>');

              var queryParams = {
                '$select': 'Subject,ReceivedDateTime,From,IsRead',
                '$orderby': 'ReceivedDateTime desc',
                '$top': 10
              };

              // Set the API endpoint to use the v2.0 endpoint
              outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
              // Set the anchor mailbox to the user's SMTP address
              outlook.base.setAnchorMailbox(email);

              outlook.mail.getMessages({token: token, odataParams: queryParams},
                function(error, result){
                  if (error) {
                    sails.log.info('getMessages returned an error: ' + error);
                    sails.log.info('<p>Mail ResponseERROR: ' + error + '</p>');
                    res.end();
                  } else if (result) {
                    sails.log.info('getMessages returned ' + result.value.length + ' messages.');
                    //response.write('<table><tr><th>From</th><th>Subject</th><th>Received</th></tr>');
                    result.value.forEach(function(message) {
                      sails.log.info('  Subject: ' + message.Subject);
                      /*
                        var from = message.From ? message.From.EmailAddress.Name : 'NONE';
                      response.write('<tr><td>' + from + 
                        '</td><td>' + (message.IsRead ? '' : '<b>') + message.Subject + (message.IsRead ? '' : '</b>') +
                        '</td><td>' + message.ReceivedDateTime.toString() + '</td></tr>');
                        */
                    });

                    res.view('email/mail');
                  }
                });
            } else {
              response.writeHead(200, {'Content-Type': 'text/html'});
              response.write('<p> No token found in cookie!</p>');
              response.end();
            }
        });
    },
    pushSubscribe: function (req,res){
        this._getAccessToken(req, res, function(error, token) {
            sails.log.info('Token found in cookie: ', token);
            var email = that._getValueFromCookie('node-tutorial-email', req.headers.cookie);
            sails.log.info('Email found in cookie: ', email);
            if (token) {
                $.ajax()
            } else {
              response.writeHead(200, {'Content-Type': 'text/html'});
              response.write('<p> No token found in cookie!</p>');
              response.end();
            }
        });
    }
};

