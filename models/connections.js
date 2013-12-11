/**
 * Social Media Connections Caching Model
 */

var ConnectionsModel = {

  Architecture: {
    schema: {
      twitter_id: {type: String, required: false, sparse: true, unique: true},
      twitter_handle: {type: String},

      facebook_id: {type: String, required: false, sparse: true, unique: true},

      google_id: {type: String, required: false, sparse: true, unique: true},

      foursquare_id: {type: String, required: false, sparse: true, unique: true},

      instagram_id: {type: String, required: false, sparse: true, unique: true},

      klout_id: {type: String, required: false, sparse: true, unique: true},

      peerindex_id: {type: String, required: false, sparse: true, unique: true},

      email: {type: String},
      phone: {type: String},
      
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
          id: {
            success: {type: Boolean, default: false},
            timestamp: {type: Number, default: 0}
          },
          score: {
            success: {type: Boolean, default: false},
            timestamp: {type: Number, default: 0},
            attempts: {type: Number, default: 1}
          },
          discovery: {
            timestamp: {type: Number, default: 0},
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
        },

        facebook: {
          discovery: {
            timestamp: {type: Number, default: 0}
          }
        },

        twitter: {
          business_id: {type: String},
          analytics_id: {type: String},
          discovery_attempt: {
            timestamp: {type: Number, default: 0}
          },
          //update: {
          //  timestamp: {type: Number, default: 0}
          //}
        },

        foursquare: {
          business_id: {type: String},
          analytics_id: {type: String},
          twitter_handle: {type: String},
          discovery_attempt: {
            timestamp: {type: Number, default: 0}
          }
        },

        instagram: {
          discovery: {
            timestamp: {type: Number, default: 0}
            //isPrivate: {type: Boolean, default: false} // this is just a schema placeholder
          }
        },
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