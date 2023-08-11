# Notion Automation using Serverless and Notion API
Hey, Subho this side, I created this project. You can freely use this to automate your blog posts to DevTo. More integrations will come soon. And if you want you can defnitely contribute to this. Plan is to automate for all the blogging platforms.

## How to setup Local Environment

### Step 1 

Install all dependencies :accessibility:

```
npm install

npm install -g serverless

serverless config credentials --provider aws --key <YOUR_USER_KEY> --secret <YOUR_USER_SECRET>
```

### Step 2

Add Environment Variables. There is only two variables required to make this work. You already have a **.env.local** file in your root directory if you have done the Step 1 properly.
```
NOTION_API_KEY=
DEV_TO_API_KEY=
NOTION_DATABASE_ID=
```

#### Getting the env. 🔍
Head to [Notion's Integration Website](https://www.notion.so/my-integrations). Make a new integration and get the secret key from there. That is your NOTION_TOKEN.

Finally it's time to get the NOTION_DATABASE_ID

See the URL of the page. For example https://www.notion.so/XYZ/ContentCurator-cd0db9f8767843ca9563c591a233be5b. Here `cd0db9f8767843ca9563c591a233be5b` is the database id.

### Step 3

Add Environment Variables in `serverless.yml` file. If you want, you can play around with the scheduler and make your lambda function check every `X` minutes whether you are `done` with your blogs or not.
```
NOTION_API_KEY: 
DEV_TO_API_KEY: 
NOTION_DATABASE_ID: 
```

### Step 4 🤝

Making Blogs database in notion.


For the next env. Make a new page in Notion and make a new database in that. 

Add these three column there
```
Title
Description
Cover Image URL
Tags
Status
ID
```
Here is a screenshot of the table and the propery names. ⬇️
![image](https://github.com/ighoshsubho/NotionAutomation/assets/93722719/cc7fe96b-58df-4140-b3f4-b7b158427707)


Make sure to name them exactly this. And `DON'T FORGET` to add a `Published` status. But initally it should have status `Not started` or `In progress`. Once you're done writing the blog, change your status to done. It will automatically get changed to status published and keep track of your post updates every 10 mins.

Now it is time to connect the page to the Developers App you just built.

Go to Shares of the page and scroll down until you find **Connections** . Click on **Add connections** and add your developer app. 

Here is a screenshot of where you can find the connections. And then you can add your app you made in this website [Notion's Integration Website](https://www.notion.so/my-integrations) ⬇️

![image](https://github.com/ighoshsubho/NotionAutomation/assets/93722719/19355ee3-5bea-4798-abe3-86a938b772b3)


### Step 5 🏃
When all is set, deploy your lambda and check using...

```bash
npm run deploy
```

And boom!

Now start writing blogs on Notion and it will work magically.  

Star this if you find it useful.

<br />

## Want to contribute to the repo to make it better?? 🔥
Yup! Everyone is welcome to cohntribute to this repo and making this better day by day. This could be a small typo fix, design fix to adding some big functionality like adding hashnode and other integrations.
