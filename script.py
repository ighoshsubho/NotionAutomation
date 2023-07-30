import tweepy
import praw
from notion.client import NotionClient
import pydantic
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# Twitter API credentials
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET")
TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
TWITTER_ACCESS_TOKEN_SECRET = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")

# Reddit API credentials
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT")
REDDIT_USERNAME = os.getenv("REDDIT_USERNAME")
REDDIT_PASSWORD = os.getenv("REDDIT_PASSWORD")

# Notion integration token
NOTION_INTEGRATION_TOKEN = os.getenv("NOTION_INTEGRATION_TOKEN")

# Notion database properties
NOTION_DATABASE_URL = os.getenv("NOTION_DATABASE_URL")

# Authenticate with Twitter API
auth = tweepy.OAuthHandler(TWITTER_API_KEY, TWITTER_API_SECRET)
auth.set_access_token(TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET)
twitter_api = tweepy.API(auth)

# Authenticate with Reddit API
reddit = praw.Reddit(client_id=REDDIT_CLIENT_ID,
                     client_secret=REDDIT_CLIENT_SECRET,
                     user_agent=REDDIT_USER_AGENT,
                     username=REDDIT_USERNAME,
                     password=REDDIT_PASSWORD)

# Connect to Notion API
notion = NotionClient(token_v2=NOTION_INTEGRATION_TOKEN)
database = notion.get_collection_view(NOTION_DATABASE_URL)

def fetch_tweets(topic, count=10):
    try:
        tweets = twitter_api.search(q=topic, lang="en", count=count, result_type="popular")
        return [tweet.text for tweet in tweets], "Success"
    except Exception as e:
        print(f"Error fetching tweets for {topic}: {e}")
        return [], "Error"

def fetch_reddit_posts(subreddit, count=10):
    try:
        subreddit = reddit.subreddit(subreddit)
        posts = subreddit.top(limit=count)
        return [post.title for post in posts], "Success"
    except Exception as e:
        print(f"Error fetching Reddit posts for {subreddit}: {e}")
        return [], "Error"

def store_in_notion(topic, tweets, reddit_posts, status):
    row = database.collection.add_row()
    row.topic = topic
    row.status = status

    if status == "Success":
        tweets_heading = row.children.add_new(NotionClient.block.text)
        tweets_heading.title = "Tweets"

        for tweet in tweets:
            tweets_block = row.children.add_new(NotionClient.block.text)
            tweets_block.title = tweet

        reddit_heading = row.children.add_new(NotionClient.block.text)
        reddit_heading.title = "Reddit Posts"

        for post in reddit_posts:
            reddit_block = row.children.add_new(NotionClient.block.text)
            reddit_block.title = post

def main():
    topic = input("Enter the topic you want to curate: ")
    tweet_count = 10
    reddit_post_count = 10

    trending_tweets, tweets_status = fetch_tweets(topic, count=tweet_count)
    reddit_posts, reddit_status = fetch_reddit_posts(topic, count=reddit_post_count)

    store_in_notion(topic, trending_tweets, reddit_posts, status="Success" if tweets_status == "Success" and reddit_status == "Success" else "Error")

if __name__ == "__main__":
    main()