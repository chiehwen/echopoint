/**
 * Social Media Connections Caching Model
 */

var ConnectionsModel = {

  Architecture: {
    schema: {
      twitter_id: {type: String, required: false, sparse: true, unique: true},
      //twitter_loaded: {type: Boolean, default: false},

      facebook_id: {type: String, required: false, sparse: true, unique: true},
      //facebook_loaded: {type: Boolean, default: false},

      google_id: {type: String, required: false, sparse: true, unique: true},
      //google_loaded: {type: Boolean, default: false},

      foursquare_id: {type: String, required: false, sparse: true, unique: true},
      //foursquare_loaded: {type: Boolean, default: false},

      instagram_id: {type: String, required: false, sparse: true, unique: true},

      klout_id: {type: String, required: false, sparse: true, unique: true},
      //klout_success: {type: Boolean, default: false},
      //klout_attempt_timestamp: {type: Number, default: 0},
      //klout_loaded: {type: Boolean, default: false},

      
      Twitter: {},
      Facebook: {},
      Google:  {},
      Foursquare: {},
      Instagram: {},
      Klout: {
        // below is the Klout data schema, we don't pre-populate because we will be using $exists to discover if data has been loaded (during queries)
        /*
        id: {type: String},
        handle: {type: String},
        user: {
          twitter: {
            id: {type: Number},
            screen_name: {type: String}
          },
          google: {
            id: {type: Number}
          },
          instagram: {
            id: {type: Number}
          }
        },
        score: {
          score: {type: Number},
          timestamp:{type: Number},
          history: [{
            score: {type: Number},
            bucket: {type: String},
            deltas: {
              day: {type: Number},
              week: {type: Number},
              month: {type: Number}
            },
            timestamp:{type: Number}
          }]
        },
        topics: [],
        influence: {
          influencers: [],
          influencees: [], 
          count: {
            influencers: {type: Number},
            influencees: {type: Number}
          },
        }
        */
      },
      meta: {
        klout: {
          success: {type: Boolean, default: false},
          attempt_timestamp: {type: Number, default: 0},
          discovery: {
            attempt_timestamp: {type: Number, default: 0},
            twitter: {
              success: {type: Boolean, default: false},
              //attempt_timestamp: {type: Number, default: 0}
            },
            google: {
              success: {type: Boolean, default: false},
              //attempt_timestamp: {type: Number, default: 0}
            },
            instagram: {
              success: {type: Boolean, default: false},
              //attempt_timestamp: {type: Number, default: 0}
            },
          }
        }
      },
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

module.exports = ConnectionsModel;