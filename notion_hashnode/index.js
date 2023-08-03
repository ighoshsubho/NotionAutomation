// index.js
require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const axios = require('axios');

const app = express();
const PORT = 3000;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const HASHNODE_API_KEY = process.env.HASHNODE_API_KEY;
const notion = new Client({ auth: NOTION_API_KEY });

app.use(express.json());

app.get('/notion-database/:databaseId', async (req, res) => {
  const { databaseId } = req.params;

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    res.json(response);
  } catch (error) {
    console.error('Error querying Notion database:', error.message);
    res.status(500).json({ error: 'Failed to query Notion database.' });
  }
});

app.get('/hashnode-blogs', async (req, res) => {
    try {
      const query = `{
        user(username: "ighoshsubho") {
            publication {
            posts(page: 0) {
                title
                brief
                slug
            }
            }
        }
        }`;
      const response = await axios.post('https://api.hashnode.com', {query}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: HASHNODE_API_KEY, // Replace with your Hashnode API key
        },
      });
  
      res.json(response.data.data.user.publication.posts);
    } catch (error) {
      console.error('Error fetching Hashnode blogs:', error.message);
      res.status(500).json({ error: 'Failed to fetch Hashnode blogs.' });
    }
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});