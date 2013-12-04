/**
 * Analytic Model
 */

 var AnalyticsModel = {

  Architecture: {
    schema: {
      //id: { type: Number, required: true},
      //name: { type: String, required: true},

      facebook: {
        business: {
          timestamp: {type: Number},
          data: {}
        },
        tracking: {
          page: {
            likes: {
              meta: [{
                timestamp: {type: Number},
                total: {type: Number}
              }],
              total: {type: Number},
              timestamp: {type: Number}
            },
            talking: {
              meta: [{
                timestamp: {type: Number},
                total: {type: Number}
              }],
              total: {type: Number},
              timestamp: {type: Number}
            },
            checkins: {
              meta: [{
                timestamp: {type: Number},
                total: {type: Number}
              }],
              total: {type: Number},
              timestamp: {type: Number}
            },
            were_here: {
              meta: [{
                timestamp: {type: Number},
                total: {type: Number}
              }],
              total: {type: Number},
              timestamp: {type: Number}
            },
            insights: {},
          }, // end page

          posts: [{
            id: {type: String},
            //type: {type: String},
            timestamp: {type: Number},
            data: {},

            likes: {
              meta: [{
                timestamp: {type: Number},
                total: {type: Number},
                //new: {type: Number},
              }],
              timestamp: {type: Number},
              total: {type: Number},
              data: {}
            },
            comments: {
              meta: [{
                timestamp: {type: Number},
                total: {type: Number},
                //new: {type: Number},
              }],
              timestamp: {type: Number},
              total: {type: Number},
              data: {}
            },
            shares: {
              meta: [{
                timestamp: {type: Number},
                total: {type: Number}
                //new: {type: Number},
              }],
              timestamp: {type: Number},
              total: {type: Number}
            },
            insights: {}
          }]
        }, // end tracking

        notifications: {
          count: {type: Number, default: 0}, // this is the array length of analytic data last time user checked notification updates, if Analytic.facebook array length is larger than we have updates
          timestamp: {type: Number, default: 0} // this is the timestamp of the last analytic data that a user was updated about, we are using the timestamp as an ID 
        }
      },


      twitter: {
        account: {
          id: {type: String},
          timestamp: {type: Number},
          data: {}
        },
        timeline: {
          since_id: {type: String, default: '1'}, // this is time of last check used with the .since parameter of facebook graph
          timestamp: {type: Number},
          tweets: [
          // these are added to the tweets object field within 
          // the harvester, but here are the schema references
            /*
            retweets: {
              history: [{
                timestamp: {type: Number},
                total: {type: Number}
              }],
              retweeters: [{
                id:
                name:
                screen_name:
                picture:
                location:
                listed_count:
                followers:
                friends:
                favorited_count:
                varified:
                tweets_count:
                currently_following:
              }],
              timestamp: {type: Number},
              total: {type: Number}
            },
            favorited_count: {
              history: [{
                timestamp: {type: Number},
                total: {type: Number}
              }],
              timestamp: {type: Number},
              total: {type: Number}
            }
            */
          ]
        },

        // Put gathering friends and followers id (from '/friends/ids' and '/followers/ids' endpoints respectively) for now
        // the data is large and not particularly needed unless we just want t large pool of twitter user data
        friends: {
          active: [],
          dropped: [],
          new: [],
          previous: [] // this is a temp array used for comparing new active to old to discover dropped/deleted users
        },
        followers: {
          active: [],
          dropped: [],
          new: [],
          previous: [] // this is a temp array used for comparing new active to old to discover dropped/deleted users
        },
        
        search: {
          since_id: {type: String, default: '1'}, // this is time of last check
          timestamp: {type: Number},
          tweets: []
        },
        mentions: {
          since_id: {type: String, default: '1'},
          timestamp: {type: Number},
          list: []
        },
        /*retweets: [{
          tweet_id: {type: String},
          meta: [{
            timestamp: {type: Number},
            new: {type: Number},
          }],
          timestamp: {type: Number},
          total: {type: Number}
        }],*/
        messages: {
          since_id: {type: String, default: '1'},
          timestamp: {type: Number},
          list: []
        },

        tracking: {
          friends: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
            }],
            timestamp: {type: Number},
            total: {type: Number},
            update: {type: Boolean, default: true}
          },
          followers: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
            }],
            timestamp: {type: Number},
            total: {type: Number},
            update: {type: Boolean, default: true},
            newest: {
              timestamp: {type: Number},
              true_new: {type: Number}, // this is the number [0 -20] of the actual new followers since last login (within the list variable)
              list: []
            },
            dropped: []
          },

          // tweets of yours that other users have favorited
          // if this increases we need to look for favorited tweet
          favorited_count: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
            }],
            timestamp: {type: Number},
            total: {type: Number},
            change: {type: Boolean, default: false}
          },
          total_tweets: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
            }],
            timestamp: {type: Number},
            total: {type: Number}
          },
          // im assuming listed_count is number of lists your are on?
          list_count: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
            }],
            timestamp: {type: Number},
            total: {type: Number}
          } 
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
        business: {
          id: {type: String},
          timestamp: {type: Number},
          data: {}
        },
        tracking: {
          checkins: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
              //new: {type: Number},
              //foursquare_new: {type: Number},
              //unique_visitors: {type: Number},
            }],
            total: {type: Number},
            // This stats is added because foursquare reports different total checkin numbers  (I can't explain why) and the stats data is not updated as often as venue data.
            // We therefore use this variable to determine when stats has updated and then populate new stats data
            stats: {
              total: {type: Number}
            },
            timestamp: {type: Number}
          },
          unique: { // this is the number of unique checkins
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
            }],
            total: {type: Number},
            timestamp: {type: Number}
          },
          mayor: {
            history: [{
              timestamp: {type: Number},
              count: {type: Number}, // I think this is the number of times the mayor has checked in since becoming mayor. Not 100% sure
              user: {}
            }],
            //total: {type: Number},
            user_id: {type: String},
            timestamp: {type: Number}
          },
          rating: {
            history: [{
              timestamp: {type: Number},
              score: {type: Number}
            }],
            score: {type: Number},
            timestamp: {type: Number}
          },
          shares: {
            history: [{
              timestamp: {type: Number},
              total: {
                facebook: {type: Number},
                twitter: {type: Number}
              }
              //new: {
              //  facebook: {type: Number},
              //  twitter: {type: Number}
              //}
            }],
            facebook: {type: Number},
            twitter: {type: Number},
            timestamp: {type: Number}
          },

          gender: {
            history: [{
              timestamp: {type: Number},
              total: {
                male: {type: Number},
                female: {type: Number}
              }
              //new: {
              //  male: {type: Number},
              //  female: {type: Number}
              //}
            }],
            male: {type: Number},
            female: {type: Number},
            timestamp: {type: Number}    
          },

          age: {
            history: [{
              timestamp: {type: Number},
              data: {}
            }],
            timestamp: {type: Number}
          },

          hourBreakdown: {
            history: [{
              timestamp: {type: Number},
              data: {}
            }],
            timestamp: {type: Number}
          },

          visitsHistogram: {
            history: [{
              timestamp: {type: Number},
              data: {}
            }],
            timestamp: {type: Number}
          },

          // just plugin data from JSON response, also cool because it often contains emails and facebook pages for businesses owners to thank patrons
          topVisitors: {
            history: [{
              timestamp: {type: Number},
              list: []
            }],
            timestamp: {type: Number}
          },

          recentVisitors: {
            history: [{
              timestamp: {type: Number},
              list: []
            }],
            timestamp: {type: Number}
          },

          // these don't rely on checkins
          likes: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
              //new: {type: Number}
            }],
            total: {type: Number},
            timestamp: {type: Number}
          },

          tips: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
              //new: {type: Number}
            }],
            total: {type: Number},
            timestamp: {type: Number},
            update: {type: Boolean, default: true}
          },

          photos: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
              //new: {type: Number}
            }],
            total: {type: Number},
            timestamp: {type: Number}
          }
        },
        tips: {
          active: [],
          retracted: [],
          previous: [] // this is a temp array used for comparing new active to old active tips
        }
      },

      google: {
        plus: {
          id: {type: String},
          timestamp: {type: Number},
          data: {}
        },
        places: {
          id: {type: String},
          timestamp: {type: Number},
          data: {
            /*id: {type: String},
            name: {type: String},
            formatted_address: {type: String},
            formatted_phone_number: {type: String},
            international_phone_number: {type: String},
            url: {type: String},
            website: {type: String}*/
          }
        },
        tracking: {
          reviews: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number},
              star_breakdown: {}
            }],
            total: {type: Number},
            timestamp: {type: Number, default: 0},
            api_timestamp: {type: Number, default: 0}, // mark when the api timestamp was last updated (not harvesting)
          },
          rating: {
            history: [{
              timestamp: {type: Number},
              score: {type: Number}
            }],
            score: {type: Number}, // this is the more accurate score found from page harvesting
            timestamp: {type: Number, default: 0},
            api_timestamp: {type: Number, default: 0}, // mark when the api timestamp was last updated (not harvesting)
            api_score: {type: Number, default: 0} // this is used to compare score to identify new reviews and initiate page harvest
          }
        },
        reviews: {
          active: [],
          retracted: [],
          //TODO: Need to add a removed flag variable 
          // to show removed reviews, put removed in this object
          // so review count will still work
          api_samples: []  // this is the sample api reviews, if these change then we call the harvester
        },
        activities: []
      },

      yelp: {
        business: {
          timestamp: {type: Number},
          id: {type: String}, // this is the true Yelp ID
          data: {
            id: {type: String}, // this is the URL name id
            name: {type: String},
            is_claimed: {type: Boolean},
            is_closed: {type: Boolean},
            image_url: {type: String},
            url: {type: String},
            phone: {type: String},
            snippet: {type: String},
            categories: [],
            location: {
              address: [],
              display_address: [],
              neighborhoods: [],
              city: {type: String},
              state_code: {type: String},
              postal_code: {type: String},
              country_code: {type: String}
            }
          }
        },
        tracking: {
          reviews: {
            history: [{
              timestamp: {type: Number},
              total: {type: Number}
              //data: {}
            }],
            total: {type: Number},
            timestamp: {type: Number, default: 0}
          },
          rating: {
            history: [{
              timestamp: {type: Number},
              score: {type: Number}
            }],
            score: {type: Number},
            timestamp: {type: Number, default: 0}
          }
        },
        reviews: {
          active: [],
          filtered: {
            count: {type: Number} // link to this is http://www.yelp.com/filtered_reviews/YELP_ID (true id, not name id)
            // link: ie. http://www.yelp.com/filtered_reviews/ZQWnC09DjrNoaAECARIaJg
          },
        },

        // yelp is a strange, unyielding beast. we need to keep track of several variables for best practice scraping/harvesting and to stagger HTTP requests
        harvest: {
          initial: {type: Boolean, default: true},
          timestamp: {type: Number, default: 0},
          pagination: {
            multiplier : {type: Number, default: 40}
          }
        }
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