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

const renderNestedListMarkdown = (block) => {
  const { type } = block;
  const value = block[type];

  if (!value) return "";

  const isNumberedList = value.children?.type === "numbered_list_item";
  const listType = isNumberedList ? "ol" : "ul";

  return value.children?.map((child) => {
      const listItemText = child.numbered_list_item || child.bulleted_list_item;
      if (listItemText) {
        return `  - ${convertToMarkdown(listItemText.rich_text)}\n${convertToMarkdownNew(child)}`;
      }
      return "";
    })
    .join("");
};

const convertBlockToMarkdown = (block) => {
  const { type } = block;
  const value = block[type];

  switch (type) {
    case "paragraph":
      return `${convertToMarkdown(value.rich_text)}\n\n`;
    case "heading_1":
      return `# ${convertToMarkdown(value.rich_text)}\n\n`;
    case "heading_2":
      return `## ${convertToMarkdown(value.rich_text)}\n\n`;
    case "heading_3":
      return `### ${convertToMarkdown(value.rich_text)}\n\n`;
    case "bulleted_list":
    case "numbered_list":
      return value.children
        .map((child) => convertToMarkdownNew(child))
        .join("");
    case "bulleted_list_item":
    case "numbered_list_item":
      return `- ${convertToMarkdown(value.rich_text)}\n${renderNestedListMarkdown(block)}`;
    case "to_do":
      return `- [${value.checked ? "x" : " "}] ${convertToMarkdown(value.rich_text)}\n`;
    case "toggle":
      return `**${convertToMarkdown(value.rich_text)}**\n${block.children
        .map((child) => convertToMarkdownNew(child))
        .join("")}`;
    case "child_page":
      return `**${value.title}**\n${block.children
        .map((child) => convertToMarkdownNew(child))
        .join("")}`;
    case "image":
      const src = value.type === "external" ? value.external.url : value.file.url;
      const caption = value.caption ? value.caption[0]?.plain_text : "";
      return `![${caption}](${src})\n\n`;
    case "divider":
      return "---\n\n";
    case "quote":
      return `> ${convertToMarkdown(value.rich_text)}\n\n`;
    case "code":
      return `\`\`\`${value.language}\n` + convertToMarkdown(value.rich_text) + "\n```\n\n";
    case "file":
      const srcFile = value.type === "external" ? value.external.url : value.file.url;
      const captionFile = value.caption ? value.caption[0]?.plain_text : "";
      return `[${captionFile}](${srcFile})\n\n`;
    case "bookmark":
      return `[${value.url}](${value.url})\n\n`;
    case "table":
      return value.children
        .map((child) => convertToMarkdownNew(child))
        .join("");
    case "column_list":
      return block.children
        .map((child) => convertToMarkdownNew(child))
        .join("");
    case "column":
      return block.children
        .map((child) => convertToMarkdownNew(child))
        .join("");
    default:
      return `❌ Unsupported block (${type === "unsupported" ? "unsupported by Notion API" : type})\n\n`;
  }
};

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

app.listen(PORT, () => {
console.log(`Server listening on port ${PORT}`);
});

module.exports = {createDevToBlog, convertBlockToMarkdown};