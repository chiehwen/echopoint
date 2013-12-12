/*
 * Cron-based Analytics Processing
 */
var Auth = require('./auth').getInstance(),
		Log = require('./logger').getInstance().getLogger(),
		Error = require('./error').getInstance(),
		//Utils = require('./utilities'),
		Model = Model || Object,
		CronJob = require('cron').CronJob,
		Crons = {
			facebook: require('./crons/facebook'),
			twitter: require('./crons/twitter'),
			foursquare: require('./crons/foursquare'),
			google: require('./crons/google'),
			yelp: require('./crons/yelp'),
			instagram: require('./crons/instagram'),
			klout: require('./crons/klout')
		};

var CronJobs = {
	facebook: {
		feed: new CronJob({
			cronTime: '0 */15 * * * *', // every 15 minutes (TODO: if logged in and watching twitter feed check every 10 minutes, plus inital update on page load)
			onTick: function() {
				var feed = new Crons.facebook;
				feed.getJob('metrics', ['page', 'posts'])
			},
			start: false
		}),

		insights: new CronJob({
			cronTime: '0 30 3 * * *', // every 24 hours (3:30am) 
			onTick: function() {
				var insights = new Crons.facebook;
				insights.getJob('metrics', ['page_insights', 'posts_insights'])
			},
			start: false
		}),

		engagers: new CronJob({
			// NOTE: currently on five minutes for testing, but will cahnge to every 2 minutes
			cronTime: '0 */5 * * * *', // every 2 minutes *processes 100 users every run with batch calling and once populated it won't call that user again so many calls won't even hit the FB api
			onTick: function() {
				var engagers = new Crons.facebook;
				engagers.getJob('engagers', ['engagers'])
			},
			start: false
		}) 
	},


	twitter: {
		timeline: new CronJob({
			cronTime: '0 */15 * * * *', // every 15 minutes (TODO: if logged in and watching twitter feed check every 5 minutes, plus inital update on page load)
			onTick: function() {
				var timeline = new Crons.twitter
				timeline.getJob('metrics', ['credentials', 'timeline', 'dm', 'mentions', 'retweets', 'favorited'])
			},
			start: false
		}),

		interactions: new CronJob({
			cronTime: '0 */30 * * * *', // every 15 minutes (every 30 for testing)
			onTick: function() {
				var interactions = new Crons.twitter
				interactions.getJob('metrics', ['retweeters', 'friends', 'followers'])
			},
			start: false
		}),

		search: new CronJob({
			cronTime: '0 */15 * * * *', // every 15 minutes 
			onTick: function() {
				var search = new Crons.twitter
				search.getJob('metrics', ['search'])
			},
			start: false
		}),

		engagers: new CronJob({
			cronTime: '*/5 * * * * *',
			onTick: function() { // every 5 seconds *again these wont call the api if no users need to be populated in the Engagers table
				
				var engagers = new Crons.twitter
				engagers.getJob('engagers', ['populateById', 'populateByScreenName'])
			},

			start: false
		}),

		duplicates: new CronJob({
			cronTime: '*/15 * * * * *', // every 15 seconds
			onTick: function() {
				var duplicates = new Crons.twitter
				duplicates.getJob('engagers', ['duplicates'])
			},
			start: false
		}),

		update: new CronJob({
			cronTime: '0 */15* * * *', // every 15 minutes
			onTick: function() {
				var update = new Crons.twitter
				update.getJob('engagers', ['update'])
			},
			start: false
		})
	},


	foursquare: {
		venue: new CronJob({
			cronTime: '0 */15 * * * *', // every ten minutes for venue metrics (TODO: if logged in and watching foursquare use here_now to show updated every 30 seconds)
			onTick: function() {
				var venue = new Crons.foursquare
				venue.getJob('metrics', ['venue'])
			},
			start: false
		}),

		stats: new CronJob({
			cronTime: '0 30 3 * * *', // stats every 24 hours (3:30am)
			onTick: function() {
				var stats = new Crons.foursquare
				stats.getJob('metrics', ['stats'])
			},
			start: false
		}),

		tips: new CronJob({
			cronTime: '0 * * * * *', // every minute. *This is oinly called if the business tips updated flag is check which means often the API won't be called
			onTick: function() {
				var tips = new Crons.foursquare
				tips.getJob('tips', ['tips'])
			},
			start: false
		}),

		engagers: new CronJob({
			cronTime: '*/15 * * * * *', // every 15 seconds. *this is only called if we have user data in the Engagers table
			onTick: function() {
				var engagers = new Crons.foursquare
				engagers.getJob('engagers', ['user'])
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
				var activity = new Crons.google
				activity.getJob('activity', ['activity'])
			},
			start: false
		}),

		// run every 5 minutes
		business: new CronJob({
			cronTime: '0 */5 * * * *', // every 5 minutes
			onTick: function() {
				var business = new Crons.google
				business.getJob('business', ['business', 'reviews'])
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
				var reviews = new Crons.google
				reviews.getJob('reviews', ['reviews'])
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
			var yelp = new Crons.yelp
			yelp.getJob('metrics', ['business', 'reviews'])
		},
		
// THIS IS A SCRAPER, REMOVE MASS USER CALL AND call only one user at a time
// then call this cron often (every 1- 5 min). otherwise we will call google in one second for every user
// also need to add a field of last lookup so we wont crawl again for 24 hours 

		start: false
	}),

	instagram: {
		users: new CronJob({
			cronTime: '*/10 * * * * *', // run every 10 seconds (can technically be run every second )
			onTick: function() {
				var instagram = new Crons.instagram
				instagram.getJob('metrics', ['user'])
			},
			start: false
		})
	},


	klout: new CronJob({
		cronTime: '*/5 * * * * *', // run every 5 seconds, each method is only run if the other isn't needed so only 1 in the array will be run every 5 seconds 
		onTick: function() {
			var klout = new Crons.klout
			klout.getJob('metrics', ['id', 'user', 'update', 'discovery'])
		},
		start: false
	})

} // end cronjobs namespace

module.exports = CronJobs;