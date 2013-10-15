/**
 * Klout Users Caching Model
 */

var KloutModel = {

  Architecture: {
    schema: {
      id: {type: Number, required: true, index: true, unique: true, dropDups: true},
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


module.exports = KloutModel;