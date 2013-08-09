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
              //type: {type: String},
              timestamp: {type: Number},
              likes: {
                meta: [{
                  timestamp: {type: Number},
                  new: {type: Number},
                }],
                //timestamp: {type: Number},
                total: {type: Number},
                data: {}
              },
              comments: {
                meta: [{
                  timestamp: {type: Number},
                  new: {type: Number},
                }],
                //timestamp: {type: Number},
                total: {type: Number},
                data: {}
              },
              shares: {
                meta: [{
                  timestamp: {type: Number},
                  new: {type: Number},
                }],
                //timestamp: {type: Number},
                total: {type: Number}
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
              timestamp: {type: Number},
              tweets: {}
            }],
            search: [{
              since_id: {type: String}, // this is time of last check used with the .since parameter of facebook graph
              timestamp: {type: Number},
              tweets: {}
            }],
            tracking: {
              mentions: [{
                since_id: {type: String},
                timestamp: {type: Number},
                mentions: {}
              }],
              retweets: [{
                id: {type: String},
                meta: [{
                  timestamp: {type: Number},
                  new: {type: Number},
                }],
                timestamp: {type: Number},
                total: {type: Number},
                //new: {type: Number}
                //data: {}
              }],
              messages: [{
                since_id: {type: String},
                timestamp: {type: Number},
                messages: {}
              }],
            },
          notifications: {
            mentions: {
              count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
              since_id: {type: String, default: '0'}, // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID
              last_checked: {type: Number} // timestamp
            },
            retweets: {
              count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
              since_id: {type: String, default: '0'}, // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID
              last_checked: {type: Number} // timestamp
            },
            messages: {
              count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
              since_id: {type: String, default: '0'}, // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID
              last_checked: {type: Number} // timestamp              
            },
            search: {
              count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
              since_id: {type: String, default: '0'}, // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID
              last_checked: {type: Number} // timestamp
            }
          }
      },

          foursquare: {
            // this is venue updates (such as change of operating hours, new address, new business category, etc)
            update: {
              timestamp: {type: Number},
              changes: {}
            },
            tracking: {
              checkins: {
                meta: [{
                  timestamp: {type: Number},
                  total: {type: Number},
                  new: {type: Number},
                  foursquare_new: {type: Number},
                  unique_visitors: {type: Number},
                }],
                total: {type: Number},
                timestamp: {type: Number}
              },
              // Remember all stats are only updated is a new checkin occures!
              mayor: {
                meta: [{
                  timestamp: {type: Number},
                  total: {type: Number},
                  new: {type: Number},
                  user: {}
                }],
                total: {type: Number},
                user_id: {type: String},
                timestamp: {type: Number}
              },
              shares: {
                meta: [{
                  timestamp: {type: Number},
                  total: {
                    facebook: {type: Number},
                    twitter: {type: Number}
                  },
                  new: {
                    facebook: {type: Number},
                    twitter: {type: Number}
                  }
                }],
                // Instead use meta.length - 1 to get last in array
                // * actually that may be less efficient since its an array look up 
                facebook: {type: Number},
                twitter: {type: Number},
                timestamp: {type: Number}
              },

              gender: {
                meta: [{
                  timestamp: {type: Number},
                  total: {
                    male: {type: Number},
                    female: {type: Number}
                  },
                  new: {
                    male: {type: Number},
                    female: {type: Number}
                  }
                }],
                male: {type: Number},
                female: {type: Number},
                timestamp: {type: Number}    
              },

              age: {
                meta: [{
                  timestamp: {type: Number},
                  data: {}
                }],
                timestamp: {type: Number}
              },

              hourBreakdown: {
                meta: [{
                  timestamp: {type: Number},
                  data: {}
                }],
                timestamp: {type: Number}
              },

              visitorHistogram: {
                meta: [{
                  timestamp: {type: Number},
                  data: {}
                }],
                timestamp: {type: Number}
              },

              // just plugin data from JSON response, also cool because it often contains emails and facebook pages for businesses owners to thank patrons
              topVisitors: {},

              recentVisitors: {},

              // these don't rely on checkins
              likes: {
                meta: [{
                  timestamp: {type: Number},
                  total: {type: Number},
                  new: {type: Number}
                }],
                total: {type: Number},
                timestamp: {type: Number}
              },

              tips: {
                meta: [{
                  timestamp: {type: Number},
                  total: {type: Number},
                  new: {type: Number}
                }],
                total: {type: Number},
                timestamp: {type: Number}
              },

              photos: {
                meta: [{
                  timestamp: {type: Number},
                  total: {type: Number},
                  new: {type: Number}
                }],
                total: {type: Number},
                timestamp: {type: Number}
              }
            },
          },

          yelp: {
            id: {type: String},
            oauthAccessToken: {type: String},
            oauthAccessTokenSecret: {type: String},
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