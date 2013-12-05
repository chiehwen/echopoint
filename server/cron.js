/*
 * Cron-based Analytics Processing
 */
var Auth = require('./auth').getInstance(),
		Log = require('./logger').getInstance().getLogger(),
		Error = require('./error').getInstance(),
		Helper = require('./helpers'),
		Model = Model || Object,
		CronJob = require('cron').CronJob,
		Crons = {
			facebook: require('./crons/facebook').getInstance(),
			twitter: require('./crons/twitter'),
			foursquare: require('./crons/foursquare').getInstance(),
			google: require('./crons/google').getInstance(),
			yelp: require('./crons/yelp').getInstance(),
			instagram: require('./crons/instagram').getInstance(),
			klout: require('./crons/klout').getInstance()
		};

var CronJobs = {
	facebook: {
		feed: new CronJob({
			cronTime: '0 */15 * * * *', // every 15 minutes (TODO: if logged in and watching twitter feed check every 10 minutes, plus inital update on page load)
			onTick: function() {
				Crons.facebook.getJob('metrics', ['page', 'posts'])
			},
			start: false
		}),

		insights: new CronJob({
			cronTime: '0 30 3 * * *', // every 24 hours (3:30am) 
			onTick: function() {
				Crons.facebook.getJob('metrics', ['page_insights', 'posts_insights'])
			},
			start: false
		}),

		connections: new CronJob({
			// NOTE: currently on five minutes for testing, but will cahnge to every 2 minutes
			cronTime: '0 */5 * * * *', // every 2 minutes *processes 100 users every run with batch calling and once populated it won't call that user again so many calls won't even hit the FB api
			onTick: function() {
				Crons.facebook.getJob('connections', ['connections'])
			},
			start: false
		}) 
	},


	twitter: {
		timeline: new CronJob({
			cronTime: '0 */15 * * * *', // every 15 minutes (TODO: if logged in and watching twitter feed check every 5 minutes, plus inital update on page load)
			onTick: function() {
				new Crons.twitter.getJob('metrics', ['credentials', 'timeline', 'dm', 'mentions', 'retweets', 'favorited'])
			},
			start: false
		}),

		interactions: new CronJob({
			cronTime: '0 */30 * * * *', // every 15 minutes (every 30 for testing)
			onTick: function() {
				new Crons.twitter.getJob('metrics', ['retweeters', 'friends', 'followers'])
			},
			start: false
		}),

		search: new CronJob({
			cronTime: '0 */15 * * * *', // every 15 minutes 
			onTick: function() {
				new Crons.twitter.getJob('metrics', ['search'])
			},
			start: false
		}),

		connections: new CronJob({
			cronTime: '*/5 * * * * *',
			onTick: function() { // every 5 seconds *again these wont call the api if no users need to be populated in the Connections table
				Crons.twitter.getJob('connections', ['populateById', 'populateByScreenName'])
			},

			start: false
		}),

		duplicates: new CronJob({
			cronTime: '*/15 * * * * *', // every 15 seconds
			onTick: function() {
				Crons.twitter.getJob('connections', ['duplicates'])
			},
			start: false
		}),

		update: new CronJob({
			cronTime: '0 */15* * * *', // every 15 minutes
			onTick: function() {
				Crons.twitter.getJob('connections', ['update'])
			},
			start: false
		})
	},


	foursquare: {
		venue: new CronJob({
			cronTime: '0 */15 * * * *', // every ten minutes for venue metrics (TODO: if logged in and watching foursquare use here_now to show updated every 30 seconds)
			onTick: function() {
				Crons.foursquare.getJob('metrics', ['venue'])
			},
			start: false
		}),

		stats: new CronJob({
			cronTime: '0 30 3 * * *', // stats every 24 hours (3:30am)
			onTick: function() {
				Crons.foursquare.getJob('metrics', ['stats'])
			},
			start: false
		}),

		tips: new CronJob({
			cronTime: '0 * * * * *', // every minute. *This is oinly called if the business tips updated flag is check which means often the API won't be called
			onTick: function() {
				Crons.foursquare.getJob('tips', ['tips'])
			},
			start: false
		}),

		users: new CronJob({
			cronTime: '*/15 * * * * *', // every 15 seconds. *this is only called if we have user data in the Connections table
			onTick: function() {
				Crons.foursquare.getJob('users')
			},

			start: false
		})
	},

	// call together every 5 min (must be called together)
	// every 5 minutes will cover 288 businesses
	// increase call time when app has more businesses!
	google: {
		// run every 10 seconds
		activity: new CronJob({
			cronTime: '0 */5 * * * *', // every 15 minutes [5 for testing]
			onTick: function() {
				Crons.google.getJob('activity', ['activity'])
			},
			start: false
		}),

		// run every 5 minutes
		business: new CronJob({
			cronTime: '0 */5 * * * *', // every 5 minutes
			onTick: function() {
				Crons.google.getJob('business', ['business', 'reviews'])
			},

	// THIS IS A SCRAPER, REMOVE MASS USER CALL AND call only one user at a time
	// then call this cron often(every 1- 5 min). otherwise we will call google in a single second for every user
	// also need to add a field of last lookup so we wont crawl again for 24 hours 

			start: false
		}),
		
		// run every 5 minutes (only a business that hasn't been checked or review updated in 48 hours gets pushed to an actual web scrape)
		reviews: new CronJob({
			cronTime: '0 */5 * * * *', // every 5 minutes
			onTick: function() {
				Crons.google.getJob('reviews', ['reviews'])
			},
			start: false
		})
	},


	// call together every 5 min (must be called together)
	// every 5 minutes will cover 288 businesses
	// increase call time when app has more businesses!
	yelp: new CronJob({
		cronTime: '0 */5 * * * *', // every 5 minutes
		onTick: function() {
			Crons.yelp.getJob('metrics', ['business', 'reviews'])
		},
		
// THIS IS A SCRAPER, REMOVE MASS USER CALL AND call only one user at a time
// then call this cron often (every 1- 5 min). otherwise we will call google in one second for every user
// also need to add a field of last lookup so we wont crawl again for 24 hours 

		start: false
	}),

	instagram: {
		users: new CronJob({
			cronTime: '40 * * * * *', // run every 10 seconds (can technically be run every second )
			onTick: function() {
				Crons.instagram.getJob('metrics', ['user'])
			},
			start: false
		})
	},


	klout: new CronJob({
		cronTime: '*/5 * * * * *', // run every 5 seconds, each method is only run if the other isn't nee so only 1 in the array will be run every 5 seconds 
		onTick: function() {
			Crons.klout.getJob('metrics', ['id', 'score', 'update', 'discovery'])
		},
		start: false
	})

} // end cronjobs namespace

module.exports = CronJobs;