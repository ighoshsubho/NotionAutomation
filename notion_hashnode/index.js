// index.js
require('dotenv').config();
const express = require('express');
const { Client } = require('@notionhq/client');
const axios = require('axios');

const app = express();
const PORT = 3000;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DEV_TO_API_KEY = process.env.DEV_TO_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const notion = new Client({ auth: NOTION_API_KEY });

app.use(express.json());

function convertToMarkdown(richText) {
  return richText.map(textObj => textObj.text.content).join('');
}

function convertBlockToMarkdown(block) {
  switch (block.type) {
     case 'paragraph':
       return convertToMarkdown(block.paragraph.rich_text);
     case 'heading_1':
       return `# ${convertToMarkdown(block.heading_1.rich_text)}`;
     case 'heading_2':
       return `## ${convertToMarkdown(block.heading_2.rich_text)}`;
     case 'heading_3':
       return `### ${convertToMarkdown(block.heading_3.rich_text)}`;
     case 'bulleted_list_item':
       return `- ${convertToMarkdown(block.bulleted_list_item.rich_text)}`;
     case 'numbered_list_item':
       return `1. ${convertToMarkdown(block.numbered_list_item.rich_text)}`;
     case 'to_do':
       return `- [${block.to_do.checked ? 'x' : ' '}] ${convertToMarkdown(block.to_do.rich_text)}`;
     case 'toggle':
       return `> ${convertToMarkdown(block.toggle.rich_text)}`;
     case 'child_page':
       return `## ${convertToMarkdown(block.child_page.title.rich_text)}`;
     case 'image':
       return `![${block.image.caption[0]}](${block.image.external.url})`;
     case 'video':
       return `![${block.video.caption[0]}](${block.video.external.url})`;
     case 'embed':
       return `![${block.embed.caption[0]}](${block.embed.external.url})`;
     case 'bookmark':
       return `![${block.bookmark.caption[0]}](${block.bookmark.external.url})`;
     case 'code':
       return `\`\`\`${block.code.language}\n${block.code.rich_text.map(obj => obj.plain_text)}\n\`\`\``;
     case 'callout':
       return `> ${convertToMarkdown(block.callout.rich_text)}`;
     default:
       return ''; 
   }
}

app.get('/notion-database', async (req, res) => {
  const  databaseId = NOTION_DATABASE_ID;

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Status', // Replace with the actual property name for status
        status: {
          equals: 'done', // Replace with the value that represents "done" status
        },
      },
    });

    const formattedResponse = [];

    for (const item of response.results) {
      
      if(item.url){
      const linkedPageId = item.url.slice(-32);

      const linkedPageResponse = await notion.blocks.children.list({
        block_id: linkedPageId,
      });

      const contentMarkdown = linkedPageResponse.results.map(block => convertBlockToMarkdown(block)).join('\n');

      const response_1 = await notion.pages.update({
        page_id: item.id,
        properties: {
          'Status' : {
            status: {
              name: 'Published'
            }
          },
        }
      });

          formattedResponse.push({
            title: item.properties['Title'].title[0].plain_text,
            coverImageUrl: item.properties['Cover Image URL'].url,
            tags: item.properties['Tags'].multi_select.map(tag => tag.name),
            content: contentMarkdown
          });
        }
    }

    for (const item of formattedResponse) {
      await createDevToBlog(item);
    }

    res.json(formattedResponse);
  } catch (error) {
    console.error('Error querying Notion database:', error.message);
    res.status(500).json({ error: 'Failed to query Notion database.' });
  }
});

const createDevToBlog = async ({ title, content, tags, coverImageUrl }) => {
  try {
      const response = await axios.post(
      'https://dev.to/api/articles',
      {
          article: {
          title: title,
          published: true,
          body_markdown: content,
          tags: tags,
          series: 'Hello World!'
          },
      },
      {
          headers: {
          'Content-Type': 'application/json',
          'api-key': DEV_TO_API_KEY, // Replace with your DEV.to API key
          },
      }
      );
      return response.data;
  } catch (error) {
      console.error('Error creating DEV.to blog post:', error.message);
      throw new Error('Failed to create DEV.to blog post.');
  }
};

const createHashnodeBlog = async ({ title, content, tags, coverImageUrl }) => {
  try {
    const mutation = `
    mutation ($input: CreateStoryInput!) {
      createStory(input: $input) {
        code
        message
      }
    }
  `;

    const response = await axios.post(
      'https://api.hashnode.com',
      {
        query: mutation,
        variables: {
          input: {
            title: title,
            slug: title.toLowerCase().replace(/ /g, '-'),
            contentMarkdown: content,
            tags: tags,
            coverImageUrl: coverImageUrl,
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: HASHNODE_API_KEY, // Replace with your Hashnode API key
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating Hashnode blog post:', error.message);
    throw new Error('Failed to create Hashnode blog post.');
  }
};

const createMediumBlog = async ({ title, content, tags, coverImageUrl }) => {
    try {
        const response = await axios.post(
        'https://api.medium.com/v1/users/' + MEDIUM_USER_ID + '/posts',
        {
            title: title,
            contentFormat: 'markdown',
            content: content,
            tags: tags,
            publishStatus: 'public',
            notifyFollowers: true,
            license: 'all-rights-reserved',
            canonicalUrl: '',
            coverImageUrl: coverImageUrl,
        },
        {
            headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + MEDIUM_ACCESS_TOKEN, // Replace with your Medium access token
            },
        }
        );
        return response.data;
    } catch (error) {
        console.error('Error creating Medium blog post:', error.message);
        throw new Error('Failed to create Medium blog post.');
        }
    };

app.listen(PORT, () => {
console.log(`Server listening on port ${PORT}`);
});

module.exports = {createDevToBlog, convertBlockToMarkdown};