/**
 * Analytic Model
 */

 var AnalyticsModel = {

  Architecture: {
    schema: {
      id: { type: Number, required: true},
      name: { type: String, required: true},

      facebook: {

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
        }],

        notifications: {
          count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
          timestamp: {type: Number, default: 0} // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID 
        }
      },


      twitter: {
        updates: [{
          since_id: {type: String}, // this is time of last check used with the .since parameter of facebook graph
          tweets: {}
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
          },

          meta: {
            created: { type: Date, default: Date.now},
            createdTimestamp: { type: Number, default: Date.now() },
          } 
        },
        options: {
      // autoIndex should be false in production (http://mongoosejs.com/docs/guide.html#indexes)
      autoIndex: true
    },
    associations: {
      belongsTo : []
    }  
  },

  Middleware: {
    // http://mongoosejs.com/docs/middleware.html
    pre: {},
    post: {}
  },

  Custom: {
    // http://mongoosejs.com/docs/guide.html
    methods: {},

    statics: {},

    virtuals: {}
  }
};

module.exports = AnalyticsModel;