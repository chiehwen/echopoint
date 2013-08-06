/**
 * User Model
 */

// Module dependencies
var Auth = require('../server/auth').getInstance();
    
var UserModel = {

  Architecture: {
    schema: {
      name: {type: String},
      email: {type: String, required: true, index: { unique: true } },
      password: {type: String, required: true},
      role: {type: String, required: true, default: 'user' }, // current roles: admin, user
      Business: [{
        name: { type: String, required: true},
        analyticsId: { type: Number },
        meta: {
          created: { type: Date, default: Date.now},
          createdTimestamp: { type: Number, default: Date.now() },
        },
        Social: {
          facebook: {
            auth: {
              id: {type: String},
              oauthAccessToken: {type: String},
              expires: {type: Number},
              created: {type: Number}
            },

            account: {},

            analytics: {
              updates: [{
                timestamp: {type: Number}, // this is time of last check used with the .since parameter of facebook graph
                posts: {}
              }],
              tracking: [{
                id: {type: String},
                type: {type: String},
                timestamp: {type: Number},
                likes: {
                  total: {type: Number},
                  new: {type: Number},
                  data: {}
                },
                comments: {
                  total: {type: Number},
                  new: {type: Number},
                  data: {}
                },
                shares: {
                  total: {type: Number},
                  new: {type: Number},
                  data: {}
                }
              }]
            },
            notifications: {
              count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
              timestamp: {type: Number, default: 0} // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID 
            }
          },
          twitter: {
            auth: {
              oauthAccessToken: {type: String},
              oauthAccessTokenSecret: {type: String},
              created: {type: Number}
            },
            analytics: [{
              since_id: {type: String}, // this is time of last check used with the .since parameter of facebook graph
              tweets: {}
            }],
            notifications: {
              count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
              since_id: {type: String, default: '0'} // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID 
            }
          },
          yelp: {
            id: {type: String},
            oauthAccessToken: {type: String},
            oauthAccessTokenSecret: {type: String},
            expires: {type: Number},
            created: {type: Number}
          },
          foursquare: {
            id: {type: String},
            venueId: {type: String},
            oauthAccessToken: {type: String},
            expires: {type: Number},
            created: {type: Number}
          },
          instagram: {
            id: {type: String},
            oauthAccessToken: {type: String},
            expires: {type: Number},
            created: {type: Number}
          }
        },
        Tools: {
          bitly: {
            id: {type: String},
            login: {type: String},
            oauthAccessToken: {type: String},
            expires: {type: Number},
            created: {type: Number}
          },
        }            
      }],
      Social: {
        facebook: {
          id: {type: String},
          oauthAccessToken: {type: String},
          expires: {type: Number},
          created: {type: Number},

          account: {},

          analytics: {
            updates: [{
              timestamp: {type: Number}, // this is time of last check used with the .since parameter of facebook graph
              posts: {}
            }],
            tracking: [{
              id: {type: String},
              type: {type: String},
              timestamp: {type: Number},
              likes: {
                total: {type: Number},
                new: {type: Number},
                data: {}
              },
              comments: {
                total: {type: Number},
                new: {type: Number},
                data: {}
              },
              shares: {
                total: {type: Number},
                new: {type: Number},
                data: {}
              }
            }]
          },
          notifications: {
            count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
            timestamp: {type: Number, default: 0} // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID 
          }
        },
        twitter: {
          id: {type: String},
          oauthAccessToken: {type: String},
          oauthAccessTokenSecret: {type: String},
          expires: {type: Number},
          created: {type: Number},

          analytics: [{
            since_id: {type: String}, // this is time of last check used with the .since parameter of facebook graph
            tweets: {}
          }],
          notifications: {
            count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
            since_id: {type: String, default: '0'} // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID 
          }
        },
        yelp: {
          id: {type: String},
          oauthAccessToken: {type: String},
          oauthAccessTokenSecret: {type: String},
          expires: {type: Number},
          created: {type: Number}
        },
        foursquare: {
          id: {type: String},
          venueId: {type: String},
          oauthAccessToken: {type: String},
          expires: {type: Number},
          created: {type: Number}
        },
        instagram: {
          id: {type: String},
          oauthAccessToken: {type: String},
          expires: {type: Number},
          created: {type: Number}
        }
      },
      Tools: {
        bitly: {
          id: {type: String},
          login: {type: String},
          oauthAccessToken: {type: String},
          expires: {type: Number},
          created: {type: Number}
        },
      },
      Analytics: {
        facebook: [{
          timestamp: {type: Number}, // this is time of last check used with the .since parameter of facebook graph
          posts: {}
        }],
        twitter: [{
          since_id: {type: String}, // this is time of last check used with the .since parameter of facebook graph
          tweets: {}
        }],
        foursquare: [],
        instagram: [],
        yelp: [{
          id: {type: String}
        }],
        meta: {
          update: {
            facebook: {
              count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
              timestamp: {type: Number, default: 0} // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID 
            }
          }
        }
      },
      meta: {
        created: { type: Number, default: Date.now() },
        Business: { 
          tokens: { type: Number, default: 1 },
          current: { 
            id: { type: String, default: null },
            index: { type: Number, default: 0 }
          }
        },
        guide: { type: Boolean, default: 1}
      }   
    },
    options: {
      // autoIndex should be false in production (http://mongoosejs.com/docs/guide.html#indexes)
      autoIndex: true
    },
    associations: {
      hasOne: [],
      hasMany: [],
      notNested: {}
    }  
  },

  Middleware: {
    // http://mongoosejs.com/docs/middleware.html
    pre: {
      save: function(next) {
        var user = this;

        // only hash the password if it has been modified (or is new)
        if (!user.isModified('password')) return next();

        Auth.encrypt(user.password, function(err, encrypted){
          if (err) return next(err);
          user.password = encrypted;
          next();
        });
      }
    },
    post: {}
  },

  Custom: {
    // http://mongoosejs.com/docs/guide.html
    methods: {
      authenticate: function(unverified, callback) {
        Auth.authenticate(unverified, this.password, function(err, match){
          if (err) callback(err)
          callback(null, match)
        });
      }
    },

    statics: {
      findByName: function(name, callback) {
        this.find({name: new RegExp(name, 'i')}, callback);
      }
    },

    virtuals: {
      
      "name.email": {
        get: function() {
          return this.name + ' (' + this.email + ')';
        },
        set: function(data) {
           this.name = data.name;
          this.email = data.email;
        }
      }
    }
  }
};


module.exports = UserModel;